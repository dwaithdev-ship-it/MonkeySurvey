const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '.env' });

// Adjust path to find User model associated with this service
const User = require('./models/User');

async function checkUser() {
    try {
        console.log('Connecting to DB...');
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/monkeysurvey';
        await mongoose.connect(uri);

        const email = 'Srini@dwaith.com';
        console.log(`Searching for user: ${email}`);
        const user = await User.findOne({ email });

        if (user) {
            console.log('User found:');
            // Remove password for security/log clarity
            const u = user.toJSON();
            console.log(JSON.stringify(u, null, 2));
            if (!u.district || !u.municipality) {
                console.log('\n[RESULT] MISSING DATA: "district" or "municipality" not set for this user.');
            } else {
                console.log('\n[RESULT] SUCCESS: Data is present.');
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

checkUser();
