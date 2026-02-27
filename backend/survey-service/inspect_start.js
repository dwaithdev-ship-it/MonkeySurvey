const mongoose = require('mongoose');
const URI = 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function run() {
    try {
        await mongoose.connect(URI);
        const surveyId = '6997e719071aea1670643e21';
        const survey = await mongoose.connection.collection('surveys').findOne({ _id: new mongoose.Types.ObjectId(surveyId) });

        if (!survey) {
            console.log('Survey not found');
            process.exit(0);
        }

        console.log('Searching for "Prasnavali" or similar...');
        survey.questions.forEach((q, i) => {
            const text = (q.question || q.title || q.displayTitle || '').toLowerCase();
            if (text.includes('ప్రశ్నావలి') || text.includes('prasnavali')) {
                console.log(`FOUND at Q${i + 1}: Type=${q.type} | Text=${text}`);
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
