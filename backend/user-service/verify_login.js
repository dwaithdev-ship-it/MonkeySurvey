const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: '.env' });
const User = require('./models/User');
const { comparePassword } = require('../shared/auth');

async function verifyLogin() {
    try {
        console.log('Connecting to MongoDB...');
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri);
        console.log('Connected.');

        const email = 'admin@monkeysurvey.com';
        const password = 'admin123';

        console.log(`Attempting login simulation for: ${email} with password: ${password}`);
        const user = await User.findOne({ email });

        if (!user) {
            console.log('❌ User not found in DB!');
            return;
        }

        console.log('User found in DB.');
        console.log('Stored Hash:', user.password);

        const isMatch = await comparePassword(password, user.password);

        if (isMatch) {
            console.log('✅ PRE-CHECK SUCCESSFUL: Password matches hash.');
        } else {
            console.log('❌ PRE-CHECK FAILED: Password does NOT match hash.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyLogin();
