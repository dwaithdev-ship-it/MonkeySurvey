const mongoose = require('mongoose');
const SurveyTheme = require('./models/SurveyTheme');

require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI;

async function seedTheme() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Make sure index is created
        await SurveyTheme.init();

        const sampleTheme = {
            surveyId: "6997e719071aea1670643e21", // We can use "demo-pre-election" or "1" to make sure it loads on dummy surveys too, but let's stick to prompt's generic logic
            themeName: "Default Theme Portrait",
            layoutType: "mobile",
            headerBackgroundColor: "#09C1D8",
            headerTextColor: "#FFFFFF",
            bodyBackgroundColor: "#FFFFFF",
            bodyTextColor: "#444444",
            bodyIconColor: "#09C1D8",
            inputTextColor: "#444444",
            groupBackgroundColor: "#09C1D8",
            groupTextColor: "#FFFFFF",
            formBackgroundImage: "",
            isActive: true
        };

        // Upsert to not crash if exists
        await SurveyTheme.findOneAndUpdate(
            { surveyId: sampleTheme.surveyId, isActive: true },
            { $set: sampleTheme },
            { upsert: true, new: true }
        );

        // Also add one for "1" so demo works visually
        await SurveyTheme.findOneAndUpdate(
            { surveyId: "1", isActive: true },
            { $set: { ...sampleTheme, surveyId: "1", bodyBackgroundColor: '#f0f4f8', headerBackgroundColor: '#1e3a8a' } },
            { upsert: true, new: true }
        );

        console.log('Sample themes seeded successfully');
    } catch (error) {
        console.error('Error seeding themes:', error);
    } finally {
        mongoose.disconnect();
    }
}

seedTheme();
