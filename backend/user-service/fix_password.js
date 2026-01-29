const mongoose = require('mongoose');
const User = require('./models/User');
const MSRUser = require('./models/MSRUser');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function checkPasswordSync(phone) {
    try {
        await mongoose.connect(MONGO_URI);

        // Find in both
        const user = await User.findOne({ phoneNumber: phone });
        const msrUser = await MSRUser.findOne({ phoneNumber: phone });

        if (user && msrUser) {
            console.log('User Password Hash:    ' + user.password.substring(0, 20) + '...');
            console.log('MSRUser Password Hash: ' + msrUser.password.substring(0, 20) + '...');

            if (user.password === msrUser.password) {
                console.log('MATCH: Passwords are in sync.');
            } else {
                console.log('MISMATCH: Passwords are DIFFERENT.');

                // Sync them
                console.log('Syncing User password to match MSRUser...');
                user.password = msrUser.password;
                await user.save();
                console.log('Synced.');
            }
        } else {
            console.log('User or MSRUser not found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkPasswordSync('9392618252');
