const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey";

async function clearAllResponses() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Connected to MongoDB');

        const Response = mongoose.model('Response', new mongoose.Schema({}, { strict: false, collection: 'msr_responses' }));

        console.log('Counting responses before deletion...');
        const count = await Response.countDocuments({});
        console.log(`Found ${count} responses in total.`);

        if (count > 0) {
            console.log('Deleting all responses...');
            const result = await Response.deleteMany({});
            console.log(`✅ Successfully deleted ${result.deletedCount} responses.`);
        } else {
            console.log('No responses found to delete.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

clearAllResponses();
