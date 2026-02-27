const mongoose = require('mongoose');
const URI = 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function run() {
    try {
        await mongoose.connect(URI);
        const col = mongoose.connection.collection('parl_cons');
        const count = await col.countDocuments();
        console.log('Total documents in parl_cons:', count);

        if (count > 0) {
            const sample = await col.findOne();
            console.log('Sample Document:', JSON.stringify(sample, null, 2));

            const fields = ['parliament', 'assembly', 'mandal', 'parl_name', 'muni_name'];
            for (const f of fields) {
                const unique = await col.distinct(f);
                console.log(`Unique values for "${f}" (count: ${unique.length}):`, unique.slice(0, 5));
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
