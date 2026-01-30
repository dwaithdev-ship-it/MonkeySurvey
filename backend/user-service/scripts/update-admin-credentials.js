const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const { hashPassword } = require('../../shared/auth');

async function updateAdminCredentials() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const oldEmail = 'admin@monkeysurvey.com';
        const newEmail = 'dwaith.dev@mail.com';
        const newPassword = 'Dh@1thdev123';

        console.log(`Searching for admin user with email: ${oldEmail}`);
        let adminUser = await User.findOne({ email: oldEmail });

        if (!adminUser) {
            console.log(`Admin user with email ${oldEmail} not found.`);
            console.log(`Checking if admin user already exists with new email: ${newEmail}`);
            adminUser = await User.findOne({ email: newEmail });

            if (adminUser) {
                console.log('Admin user found with new email. Updating password...');
                adminUser.password = await hashPassword(newPassword);
                await adminUser.save();
                console.log('Admin password updated successfully.');
            } else {
                console.log('Admin user not found. Creating new admin user...');
                const hashedPassword = await hashPassword(newPassword);
                const newAdmin = new User({
                    email: newEmail,
                    password: hashedPassword,
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'admin'
                });
                await newAdmin.save();
                console.log('New admin user created successfully.');
            }
        } else {
            console.log('Admin user found. Updating email and password...');
            adminUser.email = newEmail;
            adminUser.password = await hashPassword(newPassword);
            await adminUser.save();
            console.log('Admin credentials updated successfully.');
        }

    } catch (error) {
        console.error('Error updating admin credentials:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

updateAdminCredentials();
