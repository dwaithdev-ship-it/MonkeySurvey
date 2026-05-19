const mongoose = require('mongoose');
const URI = 'mongodb+srv://dwaithdevkalyan_db_user:Dwaithdevkalyan123@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function run() {
    try {
        await mongoose.connect(URI);
        const updateTheme = {
            bodyBackgroundColor: '#F3F4F6', // Soft light gray background
            groupBackgroundColor: '#FFFFFF', // Pure white cards
            bodyTextColor: '#1F2937', // Dark gray text
            bodyIconColor: '#09C1D8', // Brand primary teal
            headerBackgroundColor: '#09C1D8', // Brand header
            headerTextColor: '#FFFFFF',
            groupTextColor: '#1F2937'
        };

        const result = await mongoose.connection.collection('survey_themes').updateOne(
            { surveyId: "6997e719071aea1670643e21" },
            { $set: updateTheme }
        );
        console.log('Update theme result:', result);
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
run();
