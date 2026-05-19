const mongoose = require('mongoose');
const URI = 'mongodb+srv://dwaithdevkalyan_db_user:Dwaithdevkalyan123@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function run() {
    try {
        await mongoose.connect(URI);
        const surveys = await mongoose.connection.collection('surveys').find().toArray();
        for (const s of surveys) {
            console.log('\n========================================');
            console.log(`SURVEY: ID=${s._id}, Title=${s.title || s.name}, Status=${s.status}`);
            console.log(`Description: ${s.description}`);
            console.log(`Questions Count: ${s.questions?.length}`);
            if (s.questions) {
                s.questions.slice(0, 5).forEach((q, i) => {
                    console.log(`  Q${i+1}: Type="${q.type}" | Title="${q.title || q.question}"`);
                    if (q.options) {
                        console.log(`     Options: ${JSON.stringify(q.options).slice(0, 100)}...`);
                    }
                });
                if (s.questions.length > 5) {
                    console.log(`  ... and ${s.questions.length - 5} more questions.`);
                }
            }
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
