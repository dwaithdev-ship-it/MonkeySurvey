const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const clearLocks = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const emails = ['akshitha@msr.com', 'dwaith.kalyan@gmail.com'];
        console.log(`Clearing locks for: ${emails.join(', ')}`);

        const result = await User.updateMany(
            { email: { $in: emails } },
            {
                $set: {
                    registeredDeviceId: null,
                    activeSession: {
                        token: null,
                        deviceId: null,
                        loginTime: null,
                        ipAddress: null
                    }
                }
            }
        );

        console.log('Successfully cleared device locks and sessions.');
        console.log('Modified count:', result.modifiedCount);
    } catch (err) {
        console.error('Error occurred:', err.message);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
};

clearLocks();
