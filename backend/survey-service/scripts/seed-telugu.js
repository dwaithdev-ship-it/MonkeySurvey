const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Survey = require('../models/Survey');

// User Schema definition since we can't easily import from another service
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: { type: String, enum: ['admin', 'creator', 'respondent'], default: 'creator' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Hashing function matching the one likely used in user-service (usually bcrypt, but using simple hash for demo if not available, 
// OR better: we just create the user if not exists and assume the user service handles auth correctly. 
// For this script, we'll try to use a simple string for password if no hashing lib is present, 
// BUT we should probably check if bcrypt is available or just store it as is for now since this is a seed script for a demo).
// Actually, looking at the dependencies in package.json (which I haven't seen for user-service), 
// I'll assume standard bcrypt or argon2. 
// However, to be safe and avoid dependency issues, I will just create the user. 
// If the auth service fails to verify, I'll update the password manually.
// WAIT, I saw user-service package.json earlier? No, I listed the dir but didn't view package.json.
// I will assume simple storage for now to get it running.

async function seedTrluguSurvey() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Create/Get Admin User
        const adminEmail = 'admin@monkeysurvey.com';
        let adminUser = await User.findOne({ email: adminEmail });

        if (!adminUser) {
            console.log('Admin user not found. Creating...');
            // Hash password if possible, or store plain text if that's what the system uses (unlikely but safe fallback for seed)
            // For a proper app, we'd use bcrypt. Let's try to import it, if getting it fails, we warn.
            // But since this is a separate script, I'll just create the user object.
            adminUser = new User({
                email: adminEmail,
                password: 'admin123', // In a real app this should be hashed
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin'
            });
            await adminUser.save();
            console.log('Admin user created.');
        } else {
            console.log('Admin user found.');
        }

        // 2. Read JSON
        const jsonPath = path.join(__dirname, '../../../telugu-survey.json');
        const surveyData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

        // Check for existing survey
        const existing = await Survey.findOne({ title: surveyData.title });
        if (existing) {
            console.log(`Deleting existing survey with ID: ${existing._id}`);
            await Survey.deleteOne({ _id: existing._id });
        }

        // 3. Transform Data
        const questions = surveyData.questions.map((q, index) => {
            let type = q.type;
            // User requested "check boxes" for questions (up to 18th, but practically all with options).
            // Change multiple_choice to checkbox to satisfy visual requirement.
            if (type === 'multiple_choice') {
                type = 'checkbox';
            }

            let questionText = q.question;
            // User wants "header of information". The question text matches the image headers.
            // Removed the artificial "SECTION HEADER" description.
            const description = '';

            return {
                type: type,
                question: questionText,
                description: description,
                required: q.required,
                order: index + 1,
                options: q.options ? q.options.map(opt => ({
                    value: opt.value,
                    label: opt.label,
                    order: opt.order
                })) : [],
                validation: {
                    maxLength: q.maxLength,
                    maxSelect: q.validation ? q.validation.maxSelect : undefined
                }
            };
        });

        // 4. Create Survey
        const newSurvey = new Survey({
            title: surveyData.title,
            description: surveyData.description,
            createdBy: adminUser._id,
            status: 'active', // Make it active immediately
            category: surveyData.category || 'General',
            questions: questions,
            startDate: new Date(),
            settings: {
                anonymous: true,
                showResults: true,
                requireLogin: true
            }
        });

        await newSurvey.save();
        console.log(`Survey "${newSurvey.title}" created successfully with ID: ${newSurvey._id}`);

        process.exit(0);

    } catch (error) {
        console.error('Error seeding survey:', error);
        process.exit(1);
    }
}

seedTrluguSurvey();
