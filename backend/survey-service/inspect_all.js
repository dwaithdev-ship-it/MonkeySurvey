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

        console.log('Survey Title:', survey.title);
        console.log('Survey Header Text:', survey.headerText);

        survey.questions.forEach((q, i) => {
            const title = q.question || q.title || q.displayTitle || '';
            console.log(`${i + 1}: [${q.type}] ${title}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
