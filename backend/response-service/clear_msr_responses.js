const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MONGODB_URI = "mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey";

async function clearResponses() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Define schemas
        const Survey = mongoose.model('Survey', new mongoose.Schema({ title: String }));
        const Response = mongoose.model('Response', new mongoose.Schema({ surveyId: String }, { collection: 'msr_responses' }));

        // Find the survey
        const survey = await Survey.findOne({ title: 'MSR Survey' });

        if (!survey) {
            console.log('❌ "MSR Survey" not found. Please check the name.');
            process.exit(1);
        }

        console.log(`Found survey: ${survey.title} (ID: ${survey._id})`);

        // Delete responses
        const deleteResult = await Response.deleteMany({ surveyId: survey._id.toString() });
        console.log(`✅ Deleted ${deleteResult.deletedCount} responses for "${survey.title}".`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

clearResponses();
