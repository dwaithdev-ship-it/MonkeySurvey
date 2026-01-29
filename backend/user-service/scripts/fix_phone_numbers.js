const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const User = require('../models/User');
const MSRUser = require('../models/MSRUser');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

const fixPhoneNumbers = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const msrUsers = await MSRUser.find({});
        console.log(`Found ${msrUsers.length} MSR users`);

        let updatedCount = 0;
        let errorCount = 0;

        for (const msrUser of msrUsers) {
            if (!msrUser.companyEmail || !msrUser.phoneNumber) {
                console.log(`Skipping MSR User ${msrUser.username} - missing email or phone`);
                continue;
            }

            try {
                const user = await User.findOne({ email: msrUser.companyEmail });

                if (user) {
                    if (user.phoneNumber !== msrUser.phoneNumber) {
                        console.log(`Updating user ${user.email} with phone ${msrUser.phoneNumber}`);
                        user.phoneNumber = msrUser.phoneNumber;

                        // Explicitly mark modified if needed, though assignment usually handles it
                        // Mongoose might ignore if schema doesn't match, but we verified schema has phoneNumber

                        await user.save();
                        updatedCount++;
                    } else {
                        console.log(`User ${user.email} already has correct phone number`);
                    }
                } else {
                    console.warn(`No standard user found for MSR User ${msrUser.username} (${msrUser.companyEmail})`);
                }
            } catch (err) {
                console.error(`Error updating user ${msrUser.companyEmail}:`, err.message);
                errorCount++;
            }
        }

        console.log('-----------------------------------');
        console.log(`Migration Complete`);
        console.log(`Updated: ${updatedCount}`);
        console.log(`Errors: ${errorCount}`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.connection.close();
    }
};

fixPhoneNumbers();
