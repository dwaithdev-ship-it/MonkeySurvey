const cron = require('node-cron');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Since we're in a separate service, we'll define minimal models for data access
const UserSchema = new mongoose.Schema({
    email: String,
    role: String,
    settings: {
        reportFrequency: { type: String, enum: ['1m', '1h', '24h'], default: '1m' },
        lastReportSentAt: Date
    }
}, { strict: false });

const ResponseSchema = new mongoose.Schema({
    surveyId: String,
    userName: String,
    answers: Array,
    submittedAt: Date
}, { strict: false, collection: 'msr_responses' });

const SurveySchema = new mongoose.Schema({
    title: String
}, { strict: false });

const User = mongoose.model('User', UserSchema);
const Response = mongoose.model('Response', ResponseSchema);
const Survey = mongoose.model('Survey', SurveySchema);

// Transporter configuration
console.log('[ReportJob] Initializing Transporter with:');
console.log('  Host:', process.env.SMTP_HOST);
console.log('  Port:', process.env.SMTP_PORT);
console.log('  User:', process.env.SMTP_USER);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.example.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_PORT == 465,
    auth: {
        user: process.env.SMTP_USER || 'user@example.com',
        pass: process.env.SMTP_PASS || 'password'
    }
});

async function sendReportToAdmin(admin) {
    try {
        console.log(`[ReportJob] Preparing report for ${admin.email}...`);

        // Fetch all responses
        console.log(`[ReportJob] Fetching responses...`);
        const responses = await Response.find({}).sort({ surveyId: 1, createdAt: -1 });
        console.log(`[ReportJob] Found ${responses.length} responses.`);

        const surveys = await Survey.find({});
        console.log(`[ReportJob] Found ${surveys.length} surveys.`);

        // Build survey map for titles
        const surveyMap = {};
        surveys.forEach(s => {
            surveyMap[s._id.toString()] = s.title;
        });

        if (responses.length === 0) {
            console.log(`[ReportJob] No responses found for ${admin.email}. Skipping email.`);
            return;
        }

        // 1. Format email body
        let mailContent = `Survey Response Report (Cumulative)\n`;
        mailContent += `====================================\n\n`;
        mailContent += `Admin Panel: http://localhost:5173\n\n`; // Updated port

        const groupedResponses = {};
        responses.forEach(r => {
            if (!groupedResponses[r.surveyId]) groupedResponses[r.surveyId] = [];
            groupedResponses[r.surveyId].push(r);
        });

        // 2. Generate CSV Content
        let csvContent = "Survey,Respondent,Date,Response Data\n";

        for (const surveyId in groupedResponses) {
            const surveyTitle = surveyMap[surveyId] || surveyId;
            const surveyResponses = groupedResponses[surveyId];

            mailContent += `Survey: ${surveyTitle}\n`;
            mailContent += `Total Responses: ${surveyResponses.length}\n`;
            mailContent += `------------------------------------\n`;

            surveyResponses.forEach((res, idx) => {
                const respondent = res.userName || 'Anonymous';
                const date = (res.createdAt || res.submittedAt || new Date()).toLocaleString();

                // Extract all answers for CSV (Removed from body per user request)
                let answersString = "";
                Object.keys(res.toObject ? res.toObject() : res).forEach(key => {
                    if (key.startsWith('Question_')) {
                        const val = res[key];
                        answersString += `${key}:${val}; `;
                    }
                });

                // Add to CSV
                csvContent += `"${surveyTitle.replace(/"/g, '""')}","${respondent.replace(/"/g, '""')}","${date}","${answersString.replace(/"/g, '""')}"\n`;
            });
            mailContent += `(Details included in the attached CSV file)\n\n`;
        }

        const mailOptions = {

            to: admin.email,
            subject: `📊 Cumulative Survey Response Report - ${new Date().toLocaleString()}`,
            text: mailContent,
            attachments: [
                {
                    filename: `survey_responses_${new Date().getTime()}.csv`,
                    content: csvContent
                }
            ]
        };

        console.log(`[ReportJob] Attempting to send email with CSV attachment...`);
        await transporter.sendMail(mailOptions);
        console.log(`[ReportJob] ✅ Report sent successfully to ${admin.email}`);

        // Update lastReportSentAt and status
        console.log(`[ReportJob] Updating lastReportSentAt for admin...`);
        await User.findByIdAndUpdate(admin._id, {
            $set: {
                'settings.lastReportSentAt': new Date(),
                'settings.lastReportStatus': 'Success'
            }
        });
        console.log(`[ReportJob] ✅ Database updated.`);

    } catch (err) {
        console.error(`[ReportJob] Failed to send report to ${admin.email}:`, err);
        // Update status for admin even on failure
        try {
            await User.findByIdAndUpdate(admin._id, {
                $set: {
                    'settings.lastReportStatus': 'Failed',
                    'settings.lastReportAttemptAt': new Date()
                }
            });
        } catch (dbErr) {
            console.error('[ReportJob] Failed to update error status in DB:', dbErr);
        }
    }
}

function initReportJob() {
    console.log('[ReportJob] Initializing cumulative report scheduler (checking every minute)...');

    cron.schedule('* * * * *', async () => {
        try {
            console.log('[ReportJob] Running scheduled check at:', new Date().toLocaleString());

            // Find all admins who have enabled email reports
            const admins = await User.find({
                role: 'admin',
                'settings.emailScheduleEnabled': true
            });
            console.log(`[ReportJob] Found ${admins.length} admins with email schedule enabled.`);

            const now = new Date();

            for (const admin of admins) {
                console.log(`[ReportJob] Processing admin: ${admin.email}`);

                // Double check enabled status (redundant but safe)
                if (!admin.settings?.emailScheduleEnabled) {
                    console.log(`[ReportJob]   Skipping: Schedule disabled for ${admin.email}`);
                    continue;
                }

                const frequency = admin.settings?.reportFrequency || '1m';
                const lastSent = admin.settings?.lastReportSentAt ? new Date(admin.settings.lastReportSentAt) : null;

                console.log(`[ReportJob]   Frequency: ${frequency}`);
                console.log(`[ReportJob]   Last sent: ${lastSent ? lastSent.toLocaleString() : 'Never'}`);

                let shouldSend = false;
                let diffMin = 0;

                if (!lastSent) {
                    console.log(`[ReportJob]   Triggering: First time report for ${admin.email}.`);
                    shouldSend = true;
                } else {
                    const diffMs = now - lastSent;
                    diffMin = diffMs / (1000 * 60);
                    console.log(`[ReportJob]   Minutes since last report: ${diffMin.toFixed(2)}`);

                    // Ensure it respects the frequency
                    if (frequency === '1m' && diffMin >= 1) shouldSend = true;
                    else if (frequency === '1h' && diffMin >= 60) shouldSend = true;
                    else if (frequency === '24h' && diffMin >= 1440) shouldSend = true;
                }

                if (shouldSend) {
                    console.log(`[ReportJob]   Action: Proceeding to send report.`);
                    await sendReportToAdmin(admin);
                } else {
                    const nextDue = frequency === '1m' ? 1 : (frequency === '1h' ? 60 : 1440);
                    console.log(`[ReportJob]   Action: Skipping (next report due in ${Math.max(0, nextDue - diffMin).toFixed(2)} mins).`);
                }
            }
        } catch (error) {
            console.error('[ReportJob] Error in scheduler loop:', error);
        }
    });
}

module.exports = { initReportJob };
