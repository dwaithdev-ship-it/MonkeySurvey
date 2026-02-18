const mongoose = require('mongoose');
const User = require('./models/User');
const { hashPassword } = require('../shared/auth');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

async function createTestUser() {
    try {
        await mongoose.connect(MONGO_URI);

        const email = 'debug_active_session@test.com';
        const password = 'TestPassword123!';

        await User.deleteOne({ email });

        const hashedPassword = await hashPassword(password);

        const user = new User({
            email,
            password: hashedPassword,
            firstName: 'Debug',
            lastName: 'ActiveSession',
            phoneNumber: '9988776655', // Unique phone
            role: 'creator'
        });

        await user.save();
        console.log('Created test user:', user.email);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error creating user:', err);
    }
}

createTestUser();
