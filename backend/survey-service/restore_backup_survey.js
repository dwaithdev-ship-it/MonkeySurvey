const fs = require('fs');
const mongoose = require('mongoose');
const URI = 'mongodb+srv://dwaithdevkalyan_db_user:Dwaithdevkalyan123@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function run() {
    try {
        console.log('Reading db_backup_before_cleanup.json...');
        const backupPath = 'c:/Users/HP/projects_app/Monkey Survey/MonkeySurvey/backend/user-service/db_backup_before_cleanup.json';
        const rawData = fs.readFileSync(backupPath, 'utf8');
        const backup = JSON.parse(rawData);

        console.log('Finding survey with title "Prajābhiprāya సేకరణ – 2026"...');
        const backupSurvey = backup.surveys.find(s => s.title === 'Prajābhiprāya సేకరణ – 2026');

        if (!backupSurvey) {
            console.error('Could not find survey in backup');
            process.exit(1);
        }

        console.log('Found survey in backup with', backupSurvey.questions.length, 'questions.');
        console.log('First question type:', backupSurvey.questions[0].type);

        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(URI);

        const targetId = '6997e719071aea1670643e21';
        console.log(`Updating survey in MongoDB Atlas under ID ${targetId}...`);

        // Prepare the survey document
        const updateDoc = {
            title: backupSurvey.title,
            description: backupSurvey.description,
            createdBy: new mongoose.Types.ObjectId(backupSurvey.createdBy),
            status: backupSurvey.status || 'Published',
            settings: backupSurvey.settings || {},
            questions: backupSurvey.questions,
            createdAt: backupSurvey.createdAt ? new Date(backupSurvey.createdAt) : new Date(),
            updatedAt: new Date()
        };

        const result = await mongoose.connection.collection('surveys').updateOne(
            { _id: new mongoose.Types.ObjectId(targetId) },
            { $set: updateDoc },
            { upsert: true }
        );

        console.log('✅ Update result:', result);

        // Let's also check if there is any cached survey in other collections or if we need to publish it.
        console.log('Survey successfully updated to the backup Cascade Options version!');

    } catch (err) {
        console.error('Error during restore:', err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
