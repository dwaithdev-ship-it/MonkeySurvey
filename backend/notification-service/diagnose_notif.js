const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function diagnose() {
    try {
        console.log('--- 1. MongoDB Check ---');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const UserSchema = new mongoose.Schema({ email: String, role: String, settings: Object }, { strict: false });
        const User = mongoose.model('User_Diag', UserSchema, 'users');

        const admin = await User.findOne({ email: 'dwaith.dev@mail.com' });
        if (admin) {
            console.log('✅ Admin User Found:', admin.email);
            console.log('✅ Role:', admin.role);
            console.log('✅ Current Settings:', JSON.stringify(admin.settings, null, 2));

            if (!admin.settings || !admin.settings.reportFrequency) {
                console.log('⚠️  reportFrequency missing. Setting default to 1m...');
                await User.findByIdAndUpdate(admin._id, { $set: { 'settings.reportFrequency': '1m' } });
                console.log('✅ reportFrequency set to 1m.');
            }
        } else {
            console.log('❌ Admin User NOT FOUND in database.');
        }

        console.log('\n--- 2. SMTP Check ---');
        console.log('Host:', process.env.SMTP_HOST);
        console.log('Port:', process.env.SMTP_PORT);
        console.log('User:', process.env.SMTP_USER);

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_PORT == 465,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        console.log('Testing SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');

        console.log('\n--- 3. Sending Test Email ---');
        await transporter.sendMail({
            from: process.env.SENDER_EMAIL,
            to: 'dwaith.dev@mail.com',
            subject: 'BodhaSurvey Notification System Diagnostic',
            text: 'This is a test email from the notification system diagnostic script. If you receive this, SMTP is working correctly.'
        });
        console.log('✅ Test email sent to dwaith.dev@mail.com');

    } catch (error) {
        console.error('\n❌ DIAGNOSTIC FAILED:', error.message);
        if (error.code === 'EAUTH') {
            console.log('👉 ERROR: SMTP Authentication failed. Please check your SMTP_USER and SMTP_PASS (App Password if using Gmail).');
        }
    } finally {
        await mongoose.disconnect();
    }
}

diagnose();
