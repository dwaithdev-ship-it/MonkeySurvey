const mongoose = require('mongoose');
const URI = "mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey";

async function inspectQuestions() {
    await mongoose.connect(URI);
    const db = mongoose.connection;

    console.log('--- MSR Survey Questions ---');
    const msr = await db.collection('surveys').findOne({
        $or: [{ name: /MSR Survey/i }, { title: /MSR Survey/i }, { title: /MSR Municipal/i }]
    });
    if (msr && msr.questions) {
        msr.questions.forEach((q, i) => {
            console.log(`Q${i + 1}:`, {
                id: q._id || q.id,
                text: q.question || q.title || q.label,
                type: q.type
            });
        });
    }

    console.log('\n--- Prajab Survey Questions ---');
    const prajab = await db.collection('surveys').findOne({
        $or: [{ name: /Prajābhiprāya/i }, { title: /Prajābhiprāya/i }]
    });
    if (prajab && prajab.questions) {
        prajab.questions.forEach((q, i) => {
            console.log(`Q${i + 1}:`, {
                id: q._id || q.id,
                text: q.question || q.title || q.label,
                type: q.type
            });
        });
    }

    await mongoose.disconnect();
}

inspectQuestions().catch(console.error);
