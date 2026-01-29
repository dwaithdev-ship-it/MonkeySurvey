const mongoose = require('mongoose');
const User = require('./models/User');
const MSRUser = require('./models/MSRUser');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function verifyLoginFix(phoneNumber) {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        console.log(`\n--- Simulating Login for Phone: ${phoneNumber} ---`);

        // 1. Direct Lookup
        let user = await User.findOne({ phoneNumber });

        if (user) {
            console.log('SUCCESS: User found directly by phone number.');
            console.log(`User: ${user.firstName} ${user.lastName} (${user.email})`);
            return;
        }

        console.log('FAIL: User NOT found by phone number directly.');
        console.log('Executing Self-Healing Logic...');

        // 2. MSR Lookup
        const msrUser = await MSRUser.findOne({ phoneNumber });
        if (!msrUser) {
            console.log('FAIL: MSRUser not found with this phone number either.');
            return;
        }
        console.log(`FOUND MSRUser: ${msrUser.username} with email ${msrUser.companyEmail}`);

        // 3. Email Lookup
        user = await User.findOne({ email: msrUser.companyEmail });
        if (!user) {
            console.log(`FAIL: User not found by email ${msrUser.companyEmail}`);
            return;
        }
        console.log(`FOUND User by email: ${user._id}`);

        // 4. Update
        console.log('Syncing phone number...');
        user.phoneNumber = phoneNumber;
        await user.save();
        console.log('FIX APPLIED: Phone number synced to User record.');

        // 5. Verify
        const verify = await User.findOne({ phoneNumber });
        if (verify) {
            console.log('VERIFICATION: Success! User now findable by phone number.');
        } else {
            console.log('VERIFICATION FAILED.');
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

// You can pass phone number as arg, or we can look for *any* MSRUser to test
const phoneArg = process.argv[2];

if (phoneArg) {
    verifyLoginFix(phoneArg);
} else {
    // Find a candidate to test
    (async () => {
        try {
            await mongoose.connect(MONGO_URI);
            const msrUser = await MSRUser.findOne({ phoneNumber: { $ne: null } });
            if (msrUser) {
                console.log(`Auto-detected test candidate: ${msrUser.phoneNumber}`);
                // Disconnect so the main function can reconnect cleanly or pass connection? 
                // Easier to just run the function logic here or call it.
                // Let's just spawn a new process in the instruction
                console.log('Please run: node verify_login_fix.js ' + msrUser.phoneNumber);
            } else {
                console.log('No MSR users found to test with.');
            }
        } catch (e) { }
        finally { await mongoose.disconnect(); }
    })();
}
