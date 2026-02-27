const mongoose = require('mongoose');
const URI = "mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey";

async function checkSurveys() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(URI);
    const db = mongoose.connection;
    console.log('Connected.');

    const msr = await db.collection('surveys').findOne({
        $or: [{ name: /MSR Survey/i }, { title: /MSR Survey/i }, { title: /MSR Municipal/i }]
    });
    const prajab = await db.collection('surveys').findOne({
        $or: [{ name: /Prajābhiprāya/i }, { title: /Prajābhiprāya/i }]
    });

    console.log('MSR:', msr ? { id: msr._id, qCount: msr.questions?.length } : 'Not found');
    console.log('Prajab:', prajab ? { id: prajab._id, qCount: prajab.questions?.length } : 'Not found');

    const countTotal = await db.collection('msr_responses').countDocuments({});
    console.log('Total responses in msr_responses:', countTotal);

    if (msr) {
        const msrResponses = await db.collection('msr_responses').countDocuments({ surveyId: msr._id.toString() });
        const msrResponsesNumeric = await db.collection('msr_responses').countDocuments({ surveyId: '1' });
        console.log('MSR Responses (Mongo ID):', msrResponses);
        console.log('MSR Responses (1):', msrResponsesNumeric);
    }

    if (prajab) {
        const prajabResponses = await db.collection('msr_responses').countDocuments({ surveyId: prajab._id.toString() });
        const prajabResponsesNumeric = await db.collection('msr_responses').countDocuments({ surveyId: '2' });
        console.log('Prajab Responses (Mongo ID):', prajabResponses);
        console.log('Prajab Responses (2):', prajabResponsesNumeric);
    }

    await mongoose.disconnect();
}

checkSurveys().catch(console.error);
