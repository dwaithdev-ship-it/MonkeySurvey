const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Response = require('../models/Response');
const { authMiddleware } = require('../../shared/auth');

// Optional auth middleware - allows anonymous submissions
// Helper to resolve surveyId from numeric aliases
// Helper to resolve surveyId from numeric aliases and return question mapping
async function resolveSurvey(id) {
  let surveyDoc;
  const isNumeric = /^\d+$/.test(id);

  if (isNumeric) {
    if (id === "1") {
      surveyDoc = await mongoose.connection.collection('surveys').findOne({
        $or: [{ name: /MSR Survey/i }, { title: /MSR Survey/i }, { title: /MSR Municipal/i }]
      });
    } else if (id === "2") {
      surveyDoc = await mongoose.connection.collection('surveys').findOne({
        $or: [{ name: /Prajābhiprāya/i }, { title: /Prajābhiprāya/i }]
      });
    }

    if (!surveyDoc) {
      const n = parseInt(id, 10);
      surveyDoc = await mongoose.connection.collection('surveys')
        .find({})
        .sort({ createdAt: -1 })
        .skip(n - 1)
        .limit(1)
        .next();
    }
  } else {
    // It's already a MongoDB ID
    try {
      surveyDoc = await mongoose.connection.collection('surveys').findOne({ _id: new mongoose.Types.ObjectId(id) });
    } catch (e) {
      // Not a valid ObjectId, maybe a slug
      surveyDoc = await mongoose.connection.collection('surveys').findOne({ slug: id });
    }
  }

  if (!surveyDoc) return { id, questionMap: {} };

  // Create a map of QuestionID (ObjectId or custom string) -> Human readable "q1", "q2" etc.
  const questionMap = {};
  if (Array.isArray(surveyDoc.questions)) {
    surveyDoc.questions.forEach((q, idx) => {
      const qN = `q${idx + 1}`;
      if (q._id) questionMap[q._id.toString().toLowerCase()] = qN;
      if (q.id) questionMap[q.id.toString().toLowerCase()] = qN;
    });
  }

  return {
    id: surveyDoc._id.toString(),
    questionMap
  };
}

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authMiddleware(req, res, next);
  }
  next();
};

router.post('/', optionalAuth, async (req, res) => {
  try {
    console.log('Submitting response:', req.body);

    let {
      surveyId,
      userName,
      parliament,
      municipality,
      ward_num,
      location,
      answers
    } = req.body;

    // --- STEP: Resolve survey and get question mapping ---
    const { id: resolvedId, questionMap } = await resolveSurvey(surveyId);
    surveyId = resolvedId;

    let googleMapsLink = '';
    if (location && location.latitude && location.longitude) {
      googleMapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    }

    // Normalize a value into a single string (handles arrays and nested arrays)
    const toStr = (v, join = false) => {
      if (v === undefined || v === null) return '';
      if (Array.isArray(v)) {
        if (v.length === 0) return '';
        if (join) return v.map(item => toStr(item, true)).filter(v => v !== undefined && v !== null && v !== '').join(' - ');
        const first = v[0];
        return Array.isArray(first) ? toStr(first) : String(first);
      }
      if (typeof v === 'object' && v !== null) {
        return Object.values(v).map(val => toStr(val, true)).filter(Boolean).join(', ');
      }
      return String(v);
    };

    // --- IMPROVED EXTRACTION: Check map first, then literal, then positional fallback ---
    const getValByLabel = (label) => {
      const targetLabel = label.toLowerCase();
      // 1. Look for answer where the questionId maps to our targetLabel (e.g. "65..." -> "q1")
      // OR where the questionId is the targetLabel itself
      const found = answers?.find(a => {
        const aId = String(a.questionId).toLowerCase();
        return questionMap[aId] === targetLabel || aId === targetLabel;
      });
      return found?.value;
    };

    const responseData = {
      surveyId,
      userName: userName || (req.user ? (req.user.phoneNumber || req.user.name) : 'Anonymous'),
      parliament: toStr(parliament) || toStr(getValByLabel('q1')),
      municipality: toStr(municipality) || toStr(getValByLabel('q2')),
      ward_num: toStr(ward_num) || toStr(getValByLabel('q3')),
      village_or_street: toStr(getValByLabel('q4')),
      location,
      googleMapsLink, // Add this line
      answers,
      submittedAt: new Date(),
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    };

    if (req.user) {
      responseData.userId = req.user.id;
    }

    // --- Surveyor Identity (Who is logged in) ---
    const surveyorName = userName || (req.user ? (req.user.name || req.user.phoneNumber) : 'Anonymous');
    responseData.userName = surveyorName;

    // --- ROBUST PHONE EXTRACTION FOR respondentPhone ---
    const findPhoneInAnswers = () => {
      const likelyPhoneQs = ['q6', 'q5', 'q7', 'q10', 'q11'];
      const extractDigits = (val) => {
        const d = String(val || '').replace(/\D/g, '');
        if (d.length === 10) return d;
        if (d.length === 11 && d.startsWith('0')) return d.substring(1);
        if (d.length === 12 && d.startsWith('91')) return d.substring(2);
        return null;
      };

      for (const label of likelyPhoneQs) {
        const val = getValByLabel(label);
        const digits = extractDigits(val);
        if (digits) {
          return digits;
        }
      }

      if (Array.isArray(answers)) {
        for (const ans of answers) {
          const digits = extractDigits(ans.value);
          if (digits) {
            return digits;
          }
        }
      }
      return null;
    };

    // --- Respondent Identity (Who is being surveyed) ---
    const extractedPhone = findPhoneInAnswers();
    if (extractedPhone) {
      responseData.respondentPhone = extractedPhone;
    }

    // Identify respondent name from q1
    const personName = toStr(getValByLabel('q1')) || toStr(answers?.[0]?.value);
    if (personName && personName !== surveyorName) {
      responseData.respondentName = personName;
    }

    // Specific logic for MSR Survey
    const isMSR = (req.body.surveyId === '1' || responseData.surveyId === '6978f3428722d9744093cd3c');
    if (isMSR && responseData.answers?.length) {
      const q1 = getValByLabel('q1') || answers[0]?.value;
      responseData.parliament = toStr(q1);

      const q2 = getValByLabel('q2') || answers[1]?.value;
      const hierarchy = Array.isArray(q2) ? q2 : [];
      responseData.assembly = toStr(hierarchy[1]);
      responseData.municipality = toStr(hierarchy[1]);

      const q3 = getValByLabel('q3') || answers[2]?.value;
      responseData.mandal = toStr(q3);
      responseData.ward_num = responseData.mandal;

      const q4 = getValByLabel('q4') || answers[3]?.value;
      responseData.village_or_street = toStr(q4);
    }

    // Specific logic for Prajābhiprāya survey
    if (responseData.surveyId === '6997e719071aea1670643e21' && responseData.answers?.length) {
      const q1Arr = getValByLabel('q1') || answers[0]?.value;
      const q2Arr = getValByLabel('q2') || answers[1]?.value;

      if (Array.isArray(q2Arr)) {
        responseData.parliament = toStr(q2Arr[0]);
        responseData.assembly = toStr(q2Arr[1]);
        responseData.municipality = toStr(q2Arr[1]);
        responseData.mandal = toStr(q2Arr[2]);
        responseData.ward_num = toStr(q2Arr[2]);
      }

      const q3 = getValByLabel('q3') || answers?.[2]?.value;
      // Only use q3 for ward_num if it doesn't look like a phone number AND if ward_num is empty
      if (q3 && q3 !== '' && !/^\d{10}$/.test(String(q3)) && !responseData.ward_num) {
        responseData.ward_num = toStr(q3);
      }

      const q4 = getValByLabel('q4') || answers?.[3]?.value;
      if (q4 && q4 !== '') responseData.village_or_street = toStr(q4);

      // If we didn't find a 10-digit phone, but we have a voter name in q1, use that for respondentName
      if (!responseData.respondentPhone && q1Arr && !responseData.respondentName) {
        responseData.respondentName = toStr(q1Arr);
      }
    }

    // --- Flatten all answers into Question_N fields as strings ---
    if (Array.isArray(answers)) {
      answers.forEach((ans, index) => {
        const aId = String(ans.questionId).toLowerCase();
        const mappedLabel = questionMap[aId] || (/^q\d+$/i.test(aId) ? aId : null);

        if (mappedLabel) {
          const qNum = mappedLabel.replace('q', '');
          responseData[`Question_${qNum}`] = toStr(ans.value, true);
        } else {
          // Fallback: Use index for Question_N if mapping failed
          const qNum = index + 1;
          if (!responseData[`Question_${qNum}`]) {
            responseData[`Question_${qNum}`] = toStr(ans.value, true);
          }
        }
      });
    }

    // Positional fallback for specific critical fields IF they are still empty
    if (Array.isArray(answers)) {
      if (!responseData.parliament && answers[0]) responseData.parliament = toStr(answers[0].value);
      if (!responseData.municipality && answers[1]) responseData.municipality = toStr(answers[1].value);
      if (!responseData.ward_num && answers[2]) responseData.ward_num = toStr(answers[2].value);
      if (!responseData.village_or_street && answers[3]) responseData.village_or_street = toStr(answers[3].value);
      if (!responseData.Question_1 && answers[0]) responseData.Question_1 = toStr(answers[0].value, true);
    }

    // Positional fallback for specific critical fields if they are missing after ID mapping
    [1, 14, 22, 29].forEach(n => {
      const qKey = `Question_${n}`;
      if ((!responseData[qKey] || responseData[qKey] === '') && answers && answers[n - 1]) {
        responseData[qKey] = toStr(answers[n - 1].value, true);
      }
    });

    // Final safety check: deep match duplication
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const answersHash = JSON.stringify(responseData.answers);
    const existingResponse = await Response.findOne({
      surveyId: responseData.surveyId,
      userName: responseData.userName,
      createdAt: { $gte: thirtySecondsAgo }
    }).sort({ createdAt: -1 });

    if (existingResponse && JSON.stringify(existingResponse.answers) === answersHash) {
      return res.status(200).json({
        success: true,
        data: existingResponse,
        message: 'Duplicate submission detected.'
      });
    }

    // Force ALL dynamic fields starting with "Question_" to strings
    const finalData = { ...responseData };
    Object.keys(finalData).forEach(key => {
      if (key.startsWith('Question_')) {
        finalData[key] = toStr(finalData[key], true);
      }
    });

    const response = new Response(finalData);
    await response.save();

    res.status(201).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to submit response'
      }
    });
  }
});

// List responses (optional auth to allow public count fetching)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { surveyId, page = 1, limit = 50, userName } = req.query;

    const query = {};
    if (surveyId) {
      if (/^\d+$/.test(surveyId)) {
        const { id: realId } = await resolveSurvey(surveyId);
        if (realId !== surveyId) {
          query.surveyId = { $in: [surveyId, realId] };
        } else {
          query.surveyId = surveyId;
        }
      } else {
        query.surveyId = surveyId;
      }
    }
    if (userName) query.userName = userName;

    console.log('Querying responses with:', query);

    const skip = (page - 1) * limit;
    const responses = await Response.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Response.countDocuments(query);
    const globalTotal = await Response.countDocuments({}); // Total across all surveys
    console.log('Found total responses for query:', total, 'Global total:', globalTotal);

    res.json({
      success: true,
      data: {
        responses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          globalTotal,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('List responses error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to list responses'
      }
    });
  }
});

module.exports = router;
