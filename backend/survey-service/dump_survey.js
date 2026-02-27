const mongoose = require('mongoose');
const URI = 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';
const fs = require('fs');

async function run() {
    try {
        await mongoose.connect(URI);
        const surveyId = '6997e719071aea1670643e21';
        const survey = await mongoose.connection.collection('surveys').findOne({ _id: new mongoose.Types.ObjectId(surveyId) });

        if (!survey) {
            console.log('Survey not found');
            process.exit(0);
        }

        const data = JSON.stringify(survey, null, 2);
        fs.writeFileSync('survey_dump.json', data);
        console.log('Survey dumped to survey_dump.json');

        const matches = [];
        survey.questions.forEach((q, i) => {
            const raw = JSON.stringify(q);
            if (raw.includes('ప్రశ్నావలి') || raw.includes('prasnavali') || raw.includes('Questionnaire')) {
                matches.push({ index: i + 1, type: q.type, text: q.question || q.title });
            }
        });

        console.log('Matches found:', matches);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
