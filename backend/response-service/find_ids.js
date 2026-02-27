const mongoose = require('mongoose');
const URI = "mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey";

async function findIds() {
    await mongoose.connect(URI);
    const db = mongoose.connection;
    const prajab = await db.collection('surveys').findOne({
        $or: [{ name: /Prajābhiprāya/i }, { title: /Prajābhiprāya/i }]
    });

    function search(obj) {
        if (!obj) return;
        if (typeof obj === 'string' && /^\d{10,}$/.test(obj)) {
            console.log('Found ID-like string:', obj);
        }
        if (typeof obj === 'object') {
            Object.values(obj).forEach(search);
        }
    }

    console.log('Searching for 10+ digit IDs in Prajab survey doc...');
    search(prajab);

    await mongoose.disconnect();
}

findIds().catch(console.error);
