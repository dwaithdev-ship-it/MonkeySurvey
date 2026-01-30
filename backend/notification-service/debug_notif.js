const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    email: String,
    role: String,
    settings: {
        reportFrequency: String,
        lastReportSentAt: Date
    }
}, { strict: false });

const ResponseSchema = new mongoose.Schema({}, { strict: false, collection: 'msr_responses' });

const User = mongoose.model('User_Debug', UserSchema, 'users');
const Response = mongoose.model('Response_Debug', ResponseSchema);

async function debugNotifications() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const adminEmail = 'dwaith.dev@mail.com';
        const admin = await User.findOne({ email: adminEmail });

        if (!admin) {
            console.log(`❌ Admin not found: ${adminEmail}`);
        } else {
            console.log(`✅ Admin found: ${admin.email}`);
            console.log('Admin Settings:', JSON.stringify(admin.settings, null, 2));
            console.log('Admin Role:', admin.role);
        }

        const responseCount = await Response.countDocuments({});
        console.log(`📊 Total Responses in msr_responses: ${responseCount}`);

        if (responseCount > 0) {
            const lastResponse = await Response.findOne({}).sort({ createdAt: -1 });
            console.log('Last Response createdAt:', lastResponse.createdAt);
        }

    } catch (error) {
        console.error('Error debugging:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugNotifications();
