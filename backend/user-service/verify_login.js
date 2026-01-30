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

        const email = 'dwaith.dev@mail.com';
        const password = 'Dh@1thdev123';

        // 1. Create/Get Admin User
        const adminEmail = 'dwaith.dev@mail.com';
        let adminUser = await User.findOne({ email: adminEmail });

        if (!adminUser) {
            console.log('Admin user not found. Creating...');
            adminUser = new User({
                email: adminEmail,
                password: 'Dh@1thdev123', // This password will be hashed by the pre-save hook
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin'
            });
            await adminUser.save();
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists.');
        }

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
