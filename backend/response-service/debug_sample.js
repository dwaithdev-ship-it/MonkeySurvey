const mongoose = require('mongoose');
const URI = "mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey";

async function checkSample() {
    await mongoose.connect(URI);
    const db = mongoose.connection;

    console.log('Sample MSR Response:');
    const msrResp = await db.collection('msr_responses').findOne({ surveyId: '6978f3428722d9744093cd3c' });
    console.log(JSON.stringify(msrResp, null, 2));

    console.log('\nSample Prajab Response:');
    const prajabResp = await db.collection('msr_responses').findOne({ surveyId: '6997e719071aea1670643e21' });
    console.log(JSON.stringify(prajabResp, null, 2));

    await mongoose.disconnect();
}

checkSample().catch(console.error);
