const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function listUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const UserSchema = new mongoose.Schema({ email: String, role: String }, { strict: false });
        const User = mongoose.model('User_List', UserSchema, 'users');

        const users = await User.find({}, 'email role');
        console.log('--- System Users ---');
        users.forEach(u => console.log(`- ${u.email} (${u.role})`));

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

listUsers();
