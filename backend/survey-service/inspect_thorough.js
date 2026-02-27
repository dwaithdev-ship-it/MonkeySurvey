const mongoose = require('mongoose');
const URI = 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function run() {
    try {
        await mongoose.connect(URI);
        const surveyId = '6978f3428722d9744093cd3c';
        const survey = await mongoose.connection.collection('surveys').findOne({ _id: new mongoose.Types.ObjectId(surveyId) });

        if (!survey) {
            console.log('Survey not found');
            process.exit(0);
        }

        console.log('Survey Title:', survey.title);
        survey.questions.forEach((q, i) => {
            const raw = JSON.stringify(q);
            if (raw.includes('ప్రశ్నావలి') || raw.includes('prasnavali')) {
                console.log(`FOUND at Q${i + 1}: Type=${q.type} | Text=${q.question || q.title}`);
            }
        });

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
