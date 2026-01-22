const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '.env' });

const User = require('./models/User');

async function checkPrajesh() {
    try {
        console.log('Connecting to DB...');
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/monkeysurvey';
        await mongoose.connect(uri);

        console.log(`Searching for user with firstName: Prajesh`);
        const user = await User.findOne({ firstName: { $regex: new RegExp('^Prajesh$', 'i') } });

        if (user) {
            console.log('User found:');
            const u = user.toJSON();
            console.log(JSON.stringify(u, null, 2));
            if (!u.district || !u.municipality) {
                console.log('\n[RESULT] MISSING DATA: "district" or "municipality" not set for this user.');
            } else {
                console.log('\n[RESULT] SUCCESS: Data is present in DB.');
            }
        } else {
            console.log('User NOT found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkPrajesh();
