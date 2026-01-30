const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

const resetDeviceLocks = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Reset device locks for ALL non-admin users
        const result = await User.updateMany(
            { role: { $ne: 'admin' } },
            {
                $set: {
                    registeredDeviceId: null,
                    'activeSession.token': null,
                    'activeSession.deviceId': null
                }
            }
        );

        console.log(`✅ Successfully reset device locks for ${result.modifiedCount} users.`);
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

resetDeviceLocks();
