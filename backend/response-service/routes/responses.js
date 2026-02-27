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
    questionMap,
    surveyDoc
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
      userName: bodyUserName,
      location,
      answers: incomingAnswers = []
    } = req.body;

    // --- STEP 1: Fetch User Info (Surveyor) ---
    let dbUserName = bodyUserName || 'Anonymous';
    let dbUserPhone = '';
    let userId = null;

    if (req.user && req.user.id) {
      userId = req.user.id;
      try {
        const userDoc = await mongoose.connection.collection('users').findOne({
          _id: new mongoose.Types.ObjectId(userId)
        });
        if (userDoc) {
          dbUserName = `${userDoc.firstName} ${userDoc.lastName}`.trim() || userDoc.name || dbUserName;
          dbUserPhone = userDoc.phoneNumber || '';
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
    }

    // --- STEP 2: Resolve Survey and Questions ---
    const { id: resolvedId, surveyDoc, questionMap } = await resolveSurvey(surveyId);
    surveyId = resolvedId;

    if (!surveyDoc) {
      throw new Error('Survey not found');
    }

    let googleMapsLink = '';
    if (location && location.latitude && location.longitude) {
      googleMapsLink = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
    }

    // --- STEP 3: Process Answers based on Survey Definition ---
    const processedMap = new Map();
    const questions = surveyDoc.questions || [];

    let parliamentVal = '';
    let assemblyVal = '';
    let mandalVal = '';
    let respName = '';
    let respPhone = '';
    let villageVal = '';

    // First pass: extract and distribute hierarchical values from Q1 if necessary
    const q1 = questions[0];
    if (q1) {
      const q1Id = String(q1._id || q1.id || '').toLowerCase();
      const foundQ1 = incomingAnswers.find(a => String(a.questionId).toLowerCase() === q1Id || String(a.questionId).toLowerCase() === 'q1');
      let val = foundQ1 ? foundQ1.value : req.body.parliament;

      if (val) {
        let parts = [];
        if (Array.isArray(val)) parts = val.map(s => String(s).trim());
        else if (typeof val === 'string' && val.includes(',')) parts = val.split(',').map(s => s.trim());

        if (parts.length >= 2) {
          // It's a hierarchical value, distribute it
          parliamentVal = parts[0] || '';
          assemblyVal = parts[1] || '';
          mandalVal = parts[2] || '';
          processedMap.set(0, parliamentVal);
          processedMap.set(1, assemblyVal);
          processedMap.set(2, mandalVal);
        } else {
          parliamentVal = String(val);
          processedMap.set(0, parliamentVal);
        }
      }
    }

    // Second pass: process all questions and fill in the rest
    const processedAnswers = [];
    questions.forEach((q, idx) => {
      const qId = String(q._id || q.id || '').toLowerCase();
      const qN = `q${idx + 1}`;

      // Use distributed value if available, otherwise look in incomingAnswers or req.body
      let value = processedMap.has(idx) ? processedMap.get(idx) : null;

      if (value === null || value === undefined) {
        let found = incomingAnswers.find(a => {
          const aId = String(a.questionId).toLowerCase();
          return aId === qId || aId === qN || questionMap[aId] === qN;
        });
        value = found ? found.value : null;
      }

      // Legacy fallback
      if (value === null || value === undefined) {
        const qText = (q.question || q.text || '').toLowerCase();
        if (qText.includes('parliament') || qText.includes('constituency')) value = req.body.parliament;
        else if (qText.includes('assembly') || qText.includes('municipality')) value = req.body.municipality || req.body.assembly;
        else if (qText.includes('mandal') || qText.includes('ward')) value = req.body.ward_num || req.body.mandal;
        else if (qText.includes('name') || qText.includes('ఓటరు')) value = req.body.respondentName;
      }

      if (value !== undefined && value !== null) {
        // Map other meta fields for reporting
        const qTextNorm = (q.question || q.text || '').toLowerCase();
        if (qTextNorm.includes('name') || qTextNorm.includes('ఓటరు')) respName = Array.isArray(value) ? value.join(', ') : String(value);
        if (qTextNorm.includes('phone') || qTextNorm.includes('ఫోన్')) respPhone = String(value).replace(/\D/g, '');
        if (qTextNorm.includes('village') || qTextNorm.includes('స్ట్రీట్')) villageVal = Array.isArray(value) ? value.join(', ') : String(value);

        processedAnswers.push({
          questionId: q._id || q.id || qN,
          label: q.question || q.text || `Question ${idx + 1}`,
          value: value
        });
      }
    });

    const responseData = {
      surveyId,
      userId,
      userName: dbUserName,
      userPhone: dbUserPhone,
      parliament: parliamentVal || req.body.parliament,
      assembly: assemblyVal || req.body.municipality || req.body.assembly,
      mandal: mandalVal || req.body.ward_num || req.body.mandal,
      respondentName: respName || req.body.respondentName,
      respondentPhone: respPhone,
      village_or_street: villageVal || req.body.village_or_street,
      location,
      googleMapsLink,
      answers: processedAnswers,
      submittedAt: new Date(),
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    };

    // --- STEP 4: Duplicate check ---
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const answersHash = JSON.stringify(processedAnswers);
    const existingResponse = await Response.findOne({
      surveyId: responseData.surveyId,
      userId: responseData.userId,
      createdAt: { $gte: thirtySecondsAgo }
    }).sort({ createdAt: -1 });

    if (existingResponse && JSON.stringify(existingResponse.answers) === answersHash) {
      return res.status(200).json({
        success: true,
        data: existingResponse,
        message: 'Duplicate submission detected.'
      });
    }

    const response = new Response(responseData);
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

// Cross-Tab aggregation report
router.get('/crosstab', optionalAuth, async (req, res) => {
  try {
    const { surveyId, questionId, startDate, endDate, groupBy } = req.query;

    if (!surveyId) {
      return res.status(400).json({ success: false, message: 'surveyId is required' });
    }

    // Resolve survey ID
    const { id: realSurveyId, surveyDoc } = await resolveSurvey(surveyId);

    const matchQuery = { surveyId: realSurveyId };

    // Date filter
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Step 1: Base aggregation to get matching responses
    const pipeline = [
      { $match: matchQuery }
    ];

    // If we have a groupBy that is a question ID, we need to extract it first
    // Default top-level fields for grouping
    const topLevelGroups = ['parliament', 'assembly', 'mandal', 'userName'];

    if (groupBy && !topLevelGroups.includes(groupBy)) {
      // Assume it's a questionId (like Gender or Age)
      pipeline.push({
        $addFields: {
          groupValue: {
            $let: {
              vars: {
                ansObj: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$answers",
                        as: "a",
                        cond: { $eq: [{ $toLower: "$$a.questionId" }, groupBy.toLowerCase()] }
                      }
                    },
                    0
                  ]
                }
              },
              in: { $ifNull: ["$$ansObj.value", "Not Answered"] }
            }
          }
        }
      });
    } else if (groupBy) {
      pipeline.push({
        $addFields: {
          groupValue: { $ifNull: [`$${groupBy}`, "Not Specified"] }
        }
      });
    } else {
      pipeline.push({
        $addFields: {
          groupValue: "Total"
        }
      });
    }

    // Extract the main question answer
    if (questionId) {
      pipeline.push({
        $addFields: {
          answerValue: {
            $let: {
              vars: {
                ansObj: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$answers",
                        as: "a",
                        cond: { $eq: [{ $toLower: "$$a.questionId" }, questionId.toLowerCase()] }
                      }
                    },
                    0
                  ]
                }
              },
              in: { $ifNull: ["$$ansObj.value", "No Answer"] }
            }
          }
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'questionId is required' });
    }

    // Grouping
    pipeline.push({
      $group: {
        _id: {
          group: "$groupValue",
          answer: "$answerValue"
        },
        count: { $sum: 1 }
      }
    });

    // Formatting for frontend
    pipeline.push({
      $group: {
        _id: "$_id.group",
        answers: {
          $push: {
            answer: "$_id.answer",
            count: "$count"
          }
        },
        totalGroupResponses: { $sum: "$count" }
      }
    });

    pipeline.push({
      $project: {
        group: "$_id",
        _id: 0,
        answers: 1,
        totalGroupResponses: 1
      }
    });

    const results = await Response.aggregate(pipeline);

    // Calculate overall totals for percentages
    let totalResponses = 0;
    results.forEach(r => totalResponses += r.totalGroupResponses);

    res.json({
      success: true,
      data: {
        report: results,
        totalResponses
      }
    });

  } catch (error) {
    console.error('Crosstab error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate crosstab report'
    });
  }
});

// Analytics distribution report for a single field/question
router.get('/analytics', optionalAuth, async (req, res) => {
  try {
    const { surveyId, questionId, startDate, endDate } = req.query;

    if (!surveyId) {
      return res.status(400).json({ success: false, message: 'surveyId is required' });
    }

    const { id: realSurveyId } = await resolveSurvey(surveyId);

    const matchQuery = { surveyId: realSurveyId };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: matchQuery }
    ];

    const topLevelFields = ['parliament', 'assembly', 'mandal', 'userName', 'respondentName', 'respondentPhone'];

    if (questionId && topLevelFields.includes(questionId)) {
      pipeline.push({
        $group: {
          _id: `$${questionId}`,
          count: { $sum: 1 }
        }
      });
    } else if (questionId) {
      // Question answer field
      pipeline.push({
        $addFields: {
          answerValue: {
            $let: {
              vars: {
                ansObj: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$answers",
                        as: "a",
                        cond: { $eq: [{ $toLower: "$$a.questionId" }, questionId.toLowerCase()] }
                      }
                    },
                    0
                  ]
                }
              },
              in: { $ifNull: ["$$ansObj.value", "No Answer"] }
            }
          }
        }
      });

      pipeline.push({
        $group: {
          _id: "$answerValue",
          count: { $sum: 1 }
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'questionId (field) is required' });
    }

    pipeline.push({
      $project: {
        option: "$_id",
        count: 1,
        _id: 0
      }
    });

    const results = await Response.aggregate(pipeline);
    const total = results.reduce((acc, curr) => acc + curr.count, 0);

    res.json({
      success: true,
      data: {
        distribution: results,
        totalResponses: total
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate analytics report'
    });
  }
});

/**
 * GET /responses/daily-report
 * Generates a day-wise aggregation of responses, optionally grouped by surveyor.
 */
router.get('/daily-report', optionalAuth, async (req, res) => {
  try {
    const { surveyId, startDate, endDate } = req.query;

    if (!surveyId) {
      return res.status(400).json({ success: false, message: 'surveyId is required' });
    }

    const { id: realSurveyId } = await resolveSurvey(surveyId);

    const matchQuery = { surveyId: realSurveyId };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Pipeline to group by date and userId with lookup for real names
    const pipeline = [
      { $match: matchQuery },
      {
        $addFields: {
          dateStr: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'uInfo'
        }
      },
      {
        $unwind: { path: "$uInfo", preserveNullAndEmptyArrays: true }
      },
      {
        $group: {
          _id: {
            date: "$dateStr",
            // Group by userId if it exists, otherwise use userName to distinguish guest surveyors
            groupKey: { $ifNull: ["$userId", "$userName"] }
          },
          count: { $sum: 1 },
          userId: { $first: "$userId" },
          userNameDb: { $first: "$uInfo.firstName" },
          userLastNameDb: { $first: "$uInfo.lastName" },
          userNameLocal: { $first: "$userName" },
          parliament: { $first: "$parliament" },
          assembly: { $first: "$assembly" },
          mandal: { $first: "$mandal" }
        }
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          userId: 1,
          userName: {
            $cond: [
              { $ifNull: ["$userNameDb", false] },
              { $concat: ["$userNameDb", " ", { $ifNull: ["$userLastNameDb", ""] }] },
              { $ifNull: ["$userNameLocal", "Unknown Surveyor"] }
            ]
          },
          count: 1,
          parliament: 1,
          assembly: 1,
          mandal: 1
        }
      },
      { $sort: { date: -1, count: -1 } }
    ];

    const results = await Response.aggregate(pipeline);

    // Calculate Summary Metrics
    const totalResponses = results.reduce((sum, item) => sum + item.count, 0);

    // Unique dates
    const uniqueDates = [...new Set(results.map(r => r.date))];
    const avgPerDay = uniqueDates.length > 0 ? (totalResponses / uniqueDates.length).toFixed(1) : 0;

    // Top User within this range
    const userTotals = {};
    results.forEach(r => {
      const key = r.userName.trim() || 'Unknown';
      userTotals[key] = (userTotals[key] || 0) + r.count;
    });

    let topUser = "N/A";
    let topCount = 0;
    Object.entries(userTotals).forEach(([name, count]) => {
      if (count > topCount) {
        topCount = count;
        topUser = name;
      }
    });

    res.json({
      success: true,
      data: {
        report: results,
        summary: {
          totalResponses,
          avgPerDay,
          topUser: topCount > 0 ? `${topUser} (${topCount})` : "N/A"
        }
      }
    });

  } catch (error) {
    console.error('Daily Report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate daily report'
    });
  }
});

/**
 * GET /responses/summary-report
 * Generates a full summary of all questions for a survey.
 */
router.get('/summary-report', optionalAuth, async (req, res) => {
  try {
    const { surveyId, startDate, endDate } = req.query;

    if (!surveyId) {
      return res.status(400).json({ success: false, message: 'surveyId is required' });
    }

    const { id: realSurveyId } = await resolveSurvey(surveyId);

    const matchQuery = { surveyId: realSurveyId };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    // Pipeline to aggregate all answers
    const pipeline = [
      { $match: matchQuery },
      { $unwind: "$answers" },
      {
        $group: {
          _id: {
            questionId: "$answers.questionId",
            answer: "$answers.value"
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.questionId",
          distribution: {
            $push: {
              option: "$_id.answer",
              count: "$count"
            }
          },
          totalQuestionResponses: { $sum: "$count" }
        }
      },
      {
        $project: {
          questionId: "$_id",
          distribution: 1,
          totalQuestionResponses: 1,
          _id: 0
        }
      }
    ];

    const results = await Response.aggregate(pipeline);

    // Get total overall responses for the survey in this range
    const totalSurveyResponses = await Response.countDocuments(matchQuery);

    res.json({
      success: true,
      data: {
        questions: results,
        totalResponses: totalSurveyResponses
      }
    });

  } catch (error) {
    console.error('Summary Report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate summary report'
    });
  }
});

/**
 * GET /responses/spatial-report
 * Fetches responses with GPS coordinates for mapping.
 */
router.get('/spatial-report', optionalAuth, async (req, res) => {
  try {
    const { surveyId, startDate, endDate } = req.query;

    if (!surveyId) {
      return res.status(400).json({ success: false, message: 'surveyId is required' });
    }

    const { id: realSurveyId } = await resolveSurvey(surveyId);

    const matchQuery = {
      surveyId: realSurveyId,
      $or: [
        { latitude: { $exists: true, $ne: null } },
        { "location.latitude": { $exists: true, $ne: null } }
      ]
    };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const pipeline = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'uInfo'
        }
      },
      {
        $unwind: { path: "$uInfo", preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          latitude: 1,
          longitude: 1,
          location: 1,
          userName: 1,
          parliament: 1,
          assembly: 1,
          mandal: 1,
          createdAt: 1,
          surveyId: 1,
          userFirstNameDb: "$uInfo.firstName",
          userLastNameDb: "$uInfo.lastName"
        }
      }
    ];

    const responses = await Response.aggregate(pipeline);

    // Standardize the location format
    const formatted = responses.map(r => {
      let resolvedName = r.userName || 'Anonymous';
      if (r.userFirstNameDb) {
        resolvedName = `${r.userFirstNameDb} ${r.userLastNameDb || ''}`.trim();
      }
      return {
        id: r._id,
        lat: r.latitude || (r.location && r.location.latitude),
        lng: r.longitude || (r.location && r.location.longitude),
        userName: resolvedName,
        parliament: r.parliament,
        assembly: r.assembly,
        mandal: r.mandal,
        createdAt: r.createdAt,
        surveyId: r.surveyId
      };
    });

    res.json({
      success: true,
      data: formatted
    });

  } catch (error) {
    console.error('Spatial Report error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate spatial report'
    });
  }
});

module.exports = router;
