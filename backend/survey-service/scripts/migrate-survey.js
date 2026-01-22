const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://localhost:27017/monkeysurvey';
const ATLAS_URI = 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function migrateSurvey() {
    let localConn, atlasConn;
    try {
        console.log('--- Starting Survey Migration ---');

        // Connect to local
        console.log('Connecting to local MongoDB...');
        localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
        console.log('✓ Connected to local');

        // Connect to Atlas
        console.log('Connecting to MongoDB Atlas Cluster...');
        atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
        console.log('✓ Connected to Atlas');

        // Define generic schemas
        const SurveySchema = new mongoose.Schema({}, { strict: false, collection: 'surveys' });
        const ResponseSchema = new mongoose.Schema({}, { strict: false, collection: 'responses' });

        const LocalSurvey = localConn.model('Survey', SurveySchema);
        const AtlasSurvey = atlasConn.model('Survey', SurveySchema);
        const LocalResponse = localConn.model('Response', ResponseSchema);
        const AtlasResponse = atlasConn.model('Response', ResponseSchema);

        // Find the survey
        const surveyTitle = "TS Municipal Survey 2026";
        console.log(`Searching for survey: "${surveyTitle}"...`);
        const survey = await LocalSurvey.findOne({ title: surveyTitle }).lean();

        if (!survey) {
            console.error(`✗ Survey "${surveyTitle}" not found in local database.`);
            return;
        }

        console.log(`✓ Found survey: ${survey._id}`);

        // Find responses
        console.log('Fetching responses for this survey...');
        const responses = await LocalResponse.find({ surveyId: survey._id }).lean();
        console.log(`✓ Found ${responses.length} responses.`);

        // Migrate Survey
        console.log(`Migrating survey to Atlas...`);
        const existingSurvey = await AtlasSurvey.findById(survey._id);
        if (existingSurvey) {
            console.log(`- Survey already exists on Atlas. Skipping survey creation.`);
        } else {
            await AtlasSurvey.create(survey);
            console.log(`+ Migrated survey "${surveyTitle}" successfully.`);
        }

        // Migrate Responses
        console.log(`Migrating responses to Atlas...`);
        let respSuccess = 0;
        let respSkip = 0;
        let respFail = 0;

        for (const response of responses) {
            try {
                const existingResp = await AtlasResponse.findById(response._id);
                if (existingResp) {
                    respSkip++;
                    continue;
                }
                await AtlasResponse.create(response);
                respSuccess++;
            } catch (err) {
                console.error(`✗ Failed to migrate response ${response._id}:`, err.message);
                respFail++;
            }
        }

        console.log('\n--- Migration Summary ---');
        console.log(`Survey: ${surveyTitle}`);
        console.log(`Responses Migrated: ${respSuccess}`);
        console.log(`Responses Skipped: ${respSkip}`);
        console.log(`Responses Failed: ${respFail}`);

    } catch (error) {
        console.error('Migration failed with critical error:', error);
    } finally {
        if (localConn) await localConn.close();
        if (atlasConn) await atlasConn.close();
        console.log('Connections closed.');
    }
}

migrateSurvey();
