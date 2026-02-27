const mongoose = require('mongoose');
const Response = require('./models/Response');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

const testPayload = {
    surveyId: '6997e719071aea1670643e21',
    userName: 'Tester',
    location: { latitude: 17.0, longitude: 82.0 },
    answers: [
        { questionId: 'q1', value: 'Araku (ST)' },
        { questionId: 'q2', value: 'Palakonda' },
        { questionId: 'q3', value: 'Seethampeta' },
        { questionId: 'q4', value: 'Main Street' },
        { questionId: 'q5', value: 'Village' },
        { questionId: 'q7', value: '9999999999' },
        { questionId: 'q37', value: 'Test Answer 37' }
    ]
};

async function testSubmission() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(uri);

        // Simulate the logic in the route
        const responseData = {
            surveyId: testPayload.surveyId,
            userName: testPayload.userName,
            location: testPayload.location,
            answers: testPayload.answers,
            submittedAt: new Date(),
            metadata: { userAgent: 'test-script' }
        };

        // Apply Logic
        if (responseData.surveyId === '6997e719071aea1670643e21' && responseData.answers) {
            const getAnswer = (qid) => responseData.answers.find(a => a.questionId === qid)?.value;

            responseData.parliament = getAnswer('q1');
            responseData.assembly = getAnswer('q2');
            responseData.mandal = getAnswer('q3');
            responseData.village_or_street = getAnswer('q4');

            responseData.answers.forEach(ans => {
                if (ans.questionId && /^q\d+$/i.test(ans.questionId)) {
                    const qNum = ans.questionId.substring(1);
                    responseData[`Question_${qNum}`] = ans.value;
                }
            });

            const phoneAns = getAnswer('q7');
            if (phoneAns) {
                responseData.userName = phoneAns;
            }
        }

        console.log('Processed Data:', responseData);

        const response = new Response(responseData);
        await response.save();
        console.log('Saved Response ID:', response._id);

        // Verify saved document
        const saved = await Response.findById(response._id);
        console.log('Fetched Document:', saved);

        if (saved.parliament === 'Araku (ST)' && saved.Question_37 === 'Test Answer 37' && saved.userName === '9999999999') {
            console.log('SUCCESS: Fields mapped correctly.');
        } else {
            console.log('FAILURE: Fields not mapped correctly.');
        }

        // Cleanup
        await Response.findByIdAndDelete(response._id);
        console.log('Cleaned up test document.');

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

testSubmission();
