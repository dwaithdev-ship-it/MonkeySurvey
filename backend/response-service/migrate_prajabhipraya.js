const mongoose = require('mongoose');
const URI = 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function migrate() {
    console.log('Connecting to MongoDB...');
    try {
        await mongoose.connect(URI);
        console.log('Connected.');

        const coll = mongoose.connection.collection('msr_responses');
        const prajRealId = '6997e719071aea1670643e21';

        console.log('Querying ALL responses to find Prajabhipraya data...');
        const responses = await coll.find({}).toArray();
        console.log(`Checking ${responses.length} total responses.`);

        const toStr = (v) => Array.isArray(v) ? (v[0] || v[1] || v[2] || '') : (v || '');

        let updatedCount = 0;
        for (const r of responses) {
            if (!r.answers || !r.answers.length) continue;

            const updates = {};

            // Intelligence: Decide if it belongs to Prajabhipraya
            const isPraj = r.answers.length > 10 || r.surveyId === prajRealId || r.surveyId === '2';

            if (!isPraj) continue;

            updates.surveyId = prajRealId;
            const getVal = (idx) => r.answers[idx]?.value;

            // 1. Map Question_N fields for all answers
            r.answers.forEach((ans, index) => {
                updates[`Question_${index + 1}`] = ans.value;
            });

            // 2. Location Logic (Index 1 is the array)
            const q2 = getVal(1);
            if (Array.isArray(q2)) {
                updates.parliament = q2[0] || '';
                updates.assembly = q2[1] || '';
                updates.municipality = q2[1] || '';
                updates.mandal = q2[2] || '';
                updates.ward_num = q2[2] || '';
            }

            // 3. User says ward_num is "3", which matches index 2
            const q3 = getVal(2);
            if (q3 && q3 !== '') {
                updates.ward_num = String(q3);
            }

            // 4. Village at index 3
            updates.village_or_street = String(getVal(3) || '');

            // 5. Phone / Name Identity
            let phone = '';
            r.answers.forEach(ans => {
                const s = String(ans.value || '');
                if (/^\d{10}$/.test(s)) phone = s;
            });
            const name = String(getVal(0) || '');

            if (phone) {
                updates.userName = phone;
            } else if (name && name.trim() !== '') {
                updates.userName = name;
            } else {
                // Remove incorrect Gender labels from userName
                if (r.userName === 'పురుషుడు' || r.userName === 'స్త్రీ' || !r.userName || r.userName === 'Male' || r.userName === 'Female') {
                    updates.userName = 'Anonymous';
                }
            }

            try {
                await coll.updateOne({ _id: r._id }, { $set: updates });
                updatedCount++;
                if (updatedCount % 5 === 0) {
                    console.log(`Migrated ${updatedCount} records...`);
                }
            } catch (err) {
                console.error(`Failed to update record ${r._id}:`, err.message);
            }
        }

        console.log(`Migration complete. Total updated: ${updatedCount}`);
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

migrate();
