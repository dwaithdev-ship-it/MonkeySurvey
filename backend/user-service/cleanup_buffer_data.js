const mongoose = require('mongoose');

const URI = 'mongodb+srv://dwaithdevkalyan_db_user:Dwaithdevkalyan123@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function run() {
  await mongoose.connect(URI);
  console.log('Connected to DB');

  // 1. Delete buffer survey
  const surveyResult = await mongoose.connection.db.collection('surveys').deleteOne({ title: 'MSR Municipal Survey' });
  console.log('Deleted buffer survey:', surveyResult.deletedCount);

  // 2. Delete buffer MSR users (keep admin)
  const msrResult = await mongoose.connection.db.collection('msr_users').deleteMany({ 
    username: { $ne: 'dwaithdevkalyan' } 
  });
  console.log('Deleted buffer MSR users:', msrResult.deletedCount);

  // 3. Delete buffer Standard users (keep admin)
  const userResult = await mongoose.connection.db.collection('users').deleteMany({ 
    email: { $ne: 'Dwaith.devkalyan@gmail.com' } 
  });
  console.log('Deleted buffer Standard users:', userResult.deletedCount);

  // 4. Clear all responses
  const respResult = await mongoose.connection.db.collection('responses').deleteMany({});
  const msrRespResult = await mongoose.connection.db.collection('msr_responses').deleteMany({});
  console.log('Cleared all responses:', respResult.deletedCount + msrRespResult.deletedCount);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
