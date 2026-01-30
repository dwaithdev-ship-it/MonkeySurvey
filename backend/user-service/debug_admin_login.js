const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const { comparePassword } = require('../shared/auth');

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('MONGODB_URI is not defined in .env');
    process.exit(1);
}

const debugLogin = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@monkeysurvey.com';
        const password = 'admin123';

        console.log(`Searching for user: ${email}`);
        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ User NOT found in database.');
            process.exit(1);
        }

        console.log(`✅ User found: ID=${user._id}, Role=${user.role}`);
        console.log(`Stored Hash: ${user.password}`);

        console.log(`Attempting to compare password '${password}' with stored hash...`);
        const isMatch = await comparePassword(password, user.password);

        if (isMatch) {
            console.log('✅ Password Match: SUCCESS');
        } else {
            console.log('❌ Password Match: FAILED');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

debugLogin();
