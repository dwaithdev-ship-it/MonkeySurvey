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

async function seedTSMunicipalSurvey() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // 1. Create/Get Admin User
        const adminEmail = 'admin@monkeysurvey.com';
        let adminUser = await User.findOne({ email: adminEmail });

        if (!adminUser) {
            console.log('Admin user not found. Creating...');
            adminUser = new User({
                email: adminEmail,
                password: 'admin123',
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
        const jsonPath = path.join(__dirname, '../../../ts-municipal-survey.json');
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
            if (type === 'multiple_choice') {
                type = 'checkbox';
            }

            let questionText = q.question;
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
            status: 'active',
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

seedTSMunicipalSurvey();
