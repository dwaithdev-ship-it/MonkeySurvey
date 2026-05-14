const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/user-service/.env') });

// Define models (minimal schemas)
const UserSchema = new mongoose.Schema({
    username: String,
    email: String,
    phoneNumber: String
}, { strict: false });

const MSRUserSchema = new mongoose.Schema({
    username: String,
    companyEmail: String,
    phoneNumber: String
}, { strict: false, collection: 'msr_users' });

const User = mongoose.model('User', UserSchema);
const MSRUser = mongoose.model('MSRUser', MSRUserSchema);

async function checkConflicts() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const searchValues = {
            username: 'Sowjanya1',
            email: 'sr@gmail.com',
            // Phone number is not visible in screenshot, but I should check if it's there
        };

        console.log('\n--- Checking User Collection ---');
        const userByUsername = await User.findOne({ username: searchValues.username });
        const userByEmail = await User.findOne({ email: searchValues.email });
        
        if (userByUsername) console.log(`Conflict found in User: Username '${searchValues.username}' already exists.`);
        if (userByEmail) console.log(`Conflict found in User: Email '${searchValues.email}' already exists.`);
        if (!userByUsername && !userByEmail) console.log('No conflicts found in User collection.');

        console.log('\n--- Checking MSRUser Collection ---');
        const msrByUsername = await MSRUser.findOne({ username: searchValues.username });
        const msrByEmail = await MSRUser.findOne({ companyEmail: searchValues.email });

        if (msrByUsername) console.log(`Conflict found in MSRUser: Username '${searchValues.username}' already exists.`);
        if (msrByEmail) console.log(`Conflict found in MSRUser: Email '${searchValues.email}' already exists.`);
        if (!msrByUsername && !msrByEmail) console.log('No conflicts found in MSRUser collection.');

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkConflicts();
