const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path as needed
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function checkUserStatus(phone) {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`Checking status for phone: ${phone}`);

        const user = await User.findOne({ phoneNumber: phone });

        if (user) {
            console.log('User Found:');
            console.log(`- Email: ${user.email}`);
            console.log(`- Role: ${user.role}`);
            console.log(`- Registered Device ID: ${user.registeredDeviceId || 'NONE'}`);
            console.log(`- Active Session: ${user.activeSession && user.activeSession.token ? 'ACTIVE' : 'NONE'}`);
            if (user.activeSession) {
                console.log(`  - Device: ${user.activeSession.deviceId}`);
                console.log(`  - IP: ${user.activeSession.ipAddress}`);
            }
        } else {
            console.log('User NOT found in User collection.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkUserStatus('9392618252');
