const mongoose = require('mongoose');
require('dotenv').config();
const Response = require('./models/Response');

async function reproduce() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const surveyId = '6997e719071aea1670643e21';
        const testPayload = {
            surveyId: surveyId,
            userName: 'Repro Tester',
            answers: [
                { questionId: 'q1', value: 'Test Voter' },
                { questionId: 'q2', value: ['Parliament A', 'Assembly B', 'Mandal C'] },
                { questionId: 'q3', value: 'Ward 5' }
            ]
        };

        // Simulate the logic in routes/responses.js
        const responseData = {
            surveyId: testPayload.surveyId,
            userName: testPayload.userName,
            answers: testPayload.answers,
            submittedAt: new Date(),
        };

        const getVal = (idx) => responseData.answers[idx]?.value;

        if (responseData.surveyId === '6997e719071aea1670643e21' && responseData.answers?.length) {
            // Mapping Logic
            responseData.answers.forEach((ans, index) => {
                responseData[`Question_${index + 1}`] = ans.value;
            });

            const q2 = getVal(1);
            if (Array.isArray(q2)) {
                responseData.parliament = q2[0] || '';
                responseData.assembly = q2[1] || '';
                responseData.municipality = q2[1] || '';
                responseData.mandal = q2[2] || '';
                responseData.ward_num = q2[2] || '';
            }
        }

        console.log('Data to be saved:', JSON.stringify(responseData, null, 2));

        const response = new Response(responseData);
        await response.save();
        console.log('Saved with ID:', response._id);

        const fetched = await Response.findById(response._id).lean();
        console.log('Fetched from DB:', JSON.stringify(fetched, null, 2));

        console.log('Type of parliament:', typeof fetched.parliament);

        // Check for duplication of documents (attempt second save with same data)
        const response2 = new Response(responseData);
        await response2.save();
        console.log('Saved Second Response with Same Data, ID:', response2._id);

        // Cleanup
        await Response.findByIdAndDelete(response._id);
        await Response.findByIdAndDelete(response2._id);
        console.log('Cleaned up.');

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

reproduce();
