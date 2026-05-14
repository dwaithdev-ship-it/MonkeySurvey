const mongoose = require('mongoose');
const URI = "mongodb+srv://dwaithdevkalyan_db_user:Dwaithdevkalyan123@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey";

async function inspectPrajab() {
    await mongoose.connect(URI);
    const db = mongoose.connection;
    const prajab = await db.collection('surveys').findOne({
        $or: [{ name: /Prajābhiprāya/i }, { title: /Prajābhiprāya/i }]
    });
    console.log(JSON.stringify(prajab, null, 2));
    await mongoose.disconnect();
}

inspectPrajab().catch(console.error);


