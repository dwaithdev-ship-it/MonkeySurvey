const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path as needed
const MSRUser = require('./models/MSRUser'); // Adjust path as needed
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/monkeysurvey';

async function checkUser(phone) {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        if (phone) {
            console.log(`Checking for phone: ${phone}`);
            const user = await User.findOne({ phoneNumber: phone });
            console.log('Found in User collection:', user ? 'YES' : 'NO');
            if (user) {
                console.log('User Details:', {
                    id: user._id,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role,
                    registeredDeviceId: user.registeredDeviceId
                });
            }

            const msrUser = await MSRUser.findOne({ phoneNumber: phone });
            console.log('Found in MSRUser collection:', msrUser ? 'YES' : 'NO');
            if (msrUser) {
                console.log('MSRUser Details:', {
                    id: msrUser._id,
                    companyEmail: msrUser.companyEmail,
                    phoneNumber: msrUser.phoneNumber
                });
            }
        } else {
            console.log('No phone provided, listing all Users with phone numbers:');
            const users = await User.find({ phoneNumber: { $exists: true, $ne: null } }).select('email phoneNumber role');
            console.log(users);

            console.log('Listing all MSR Users with phone numbers:');
            const msrUsers = await MSRUser.find({ phoneNumber: { $exists: true, $ne: null } }).select('companyEmail phoneNumber');
            console.log(msrUsers);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

// Get phone from args
const phone = process.argv[2];
checkUser(phone);
