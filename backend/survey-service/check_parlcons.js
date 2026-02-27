const mongoose = require('mongoose');
const URI = 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function run() {
    try {
        await mongoose.connect(URI);
        const count = await mongoose.connection.collection('parlcons').countDocuments();
        console.log('Total ParlCons documents:', count);

        if (count > 0) {
            const sample = await mongoose.connection.collection('parlcons').findOne();
            console.log('Sample document:', sample);

            const uniqueParliaments = await mongoose.connection.collection('parlcons').distinct('parliament');
            console.log('Unique "parliament" values:', uniqueParliaments);

            const uniqueParlNames = await mongoose.connection.collection('parlcons').distinct('parl_name');
            console.log('Unique "parl_name" values:', uniqueParlNames);
        }

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}
run();
