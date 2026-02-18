const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

async function listUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        const users = await User.find({}).limit(5);
        console.log('Users found:', users.map(u => ({ email: u.email, phone: u.phoneNumber, id: u._id, activeSession: u.activeSession })));
        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

listUsers();
