const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://localhost:27017/monkeysurvey';
const ATLAS_URI = 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function migrate() {
    let localConn, atlasConn;
    try {
        console.log('--- Starting User Migration ---');

        // Connect to local
        console.log('Connecting to local MongoDB...');
        localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
        console.log('✓ Connected to local');

        // Connect to Atlas
        console.log('Connecting to MongoDB Atlas Cluster...');
        atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
        console.log('✓ Connected to Atlas');

        // Define generic schemas to read/write raw data
        const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
        const LocalUser = localConn.model('User', UserSchema);
        const AtlasUser = atlasConn.model('User', UserSchema);

        // Fetch local users
        console.log('Fetching users from local database...');
        const users = await LocalUser.find({}).lean();
        console.log(`Found ${users.length} users locally.`);

        if (users.length === 0) {
            console.log('No users found to migrate. Exiting.');
            return;
        }

        // Insert into Atlas
        console.log('Migrating users to Atlas...');
        let successCount = 0;
        let failCount = 0;
        let skipCount = 0;

        for (const user of users) {
            try {
                // Check if user exists in Atlas
                const existing = await AtlasUser.findOne({ email: user.email });
                if (existing) {
                    console.log(`- Skipping ${user.email} (already exists in Atlas)`);
                    skipCount++;
                    continue;
                }

                // Remove _id if you want Atlas to generate new ones, 
                // but usually better to keep them if they are referenced elsewhere.
                // For this migration, we'll keep them to maintain consistency.
                await AtlasUser.create(user);
                console.log(`+ Migrated ${user.email} successfully`);
                successCount++;
            } catch (err) {
                console.error(`✗ Failed to migrate ${user.email}:`, err.message);
                failCount++;
            }
        }

        console.log('\n--- Migration Summary ---');
        console.log(`Total local users: ${users.length}`);
        console.log(`Successfully migrated: ${successCount}`);
        console.log(`Skipped (duplicates): ${skipCount}`);
        console.log(`Failed: ${failCount}`);

    } catch (error) {
        console.error('Migration failed with critical error:', error);
    } finally {
        if (localConn) await localConn.close();
        if (atlasConn) await atlasConn.close();
        console.log('Connections closed.');
    }
}

migrate();
