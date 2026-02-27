const mongoose = require('mongoose');
const URI = 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function run() {
    try {
        await mongoose.connect(URI);
        const surveys = await mongoose.connection.collection('surveys').find().toArray();
        surveys.forEach((s, idx) => {
            console.log(`Survey ${idx + 1}: ID=${s._id}, Title=${s.title || s.name}`);
        });
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
