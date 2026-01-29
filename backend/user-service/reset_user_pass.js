const mongoose = require('mongoose');
const User = require('./models/User');
const MSRUser = require('./models/MSRUser');
const bcrypt = require('bcryptjs'); // You might need to install this if not in node_modules, but usually is
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function resetPassword(phone, newPassword) {
    try {
        await mongoose.connect(MONGO_URI);

        const user = await User.findOne({ phoneNumber: phone });
        const msrUser = await MSRUser.findOne({ phoneNumber: phone });

        if (user && msrUser) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            console.log(`Resetting password for ${phone} to: ${newPassword}`);

            user.password = hashedPassword;
            user.registeredDeviceId = null; // Clear device lock to be nice
            user.activeSession = { token: null, deviceId: null }; // Clear session
            await user.save();

            msrUser.password = hashedPassword;
            await msrUser.save();

            console.log('Password reset successful. Device locks cleared.');
        } else {
            console.log('User not found.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

resetPassword('9392618252', 'Test@123');
