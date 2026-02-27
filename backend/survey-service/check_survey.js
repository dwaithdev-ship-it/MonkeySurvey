const mongoose = require('mongoose');
const URI = 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function run() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(URI, { serverSelectionTimeoutMS: 5000 });
        console.log('Connected.');

        const surveyId = '6997e719071aea1670643e21';
        const survey = await mongoose.connection.collection('surveys').findOne({ _id: new mongoose.Types.ObjectId(surveyId) });

        if (!survey) {
            console.log('Survey not found');
            process.exit(0);
        }

        console.log('Survey Title:', survey.title);
        console.log('Questions Count:', survey.questions.length);

        survey.questions.forEach((q, i) => {
            console.log(`Q${i + 1}: ID=${q._id || q.id} | Type=${q.type} | Text=${q.question || q.title || q.displayTitle}`);
        });

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();
