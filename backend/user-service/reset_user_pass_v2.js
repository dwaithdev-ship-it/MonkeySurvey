const mongoose = require('mongoose');
const User = require('./models/User'); // in backend/user-service/models
const MSRUser = require('./models/MSRUser');
const { hashPassword } = require('../shared/auth'); // in backend/shared/auth
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function resetPassword(phone, newPassword) {
    try {
        await mongoose.connect(MONGO_URI);

        // Hash using the shared utility
        const hashedPassword = await hashPassword(newPassword);

        console.log(`Resetting password for ${phone} to: ${newPassword}`);

        const user = await User.findOne({ phoneNumber: phone });
        const msrUser = await MSRUser.findOne({ phoneNumber: phone });

        if (user) {
            user.password = hashedPassword;
            user.registeredDeviceId = null;
            user.activeSession = { token: null, deviceId: null };
            await user.save();
            console.log('User password updated and locks cleared.');
        }

        if (msrUser) {
            msrUser.password = hashedPassword;
            await msrUser.save();
            console.log('MSRUser password updated.');
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
    }
}

resetPassword('9392618252', 'Test@123');
