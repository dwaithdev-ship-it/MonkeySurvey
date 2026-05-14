const mongoose = require('mongoose');
const { hashPassword } = require('../shared/auth');

const URI = 'mongodb+srv://dwaithdevkalyan_db_user:Dwaithdevkalyan123@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function run() {
  await mongoose.connect(URI);
  console.log('Connected to DB');

  const hp = await hashPassword('Dwaithdevkalyan123');
  const email = 'Dwaith.devkalyan@gmail.com';

  await mongoose.connection.db.collection('users').updateOne(
    { email: email }, 
    { $set: { password: hp, registeredDeviceId: null, activeSession: {} } }
  );

  await mongoose.connection.db.collection('msr_users').updateOne(
    { companyEmail: email }, 
    { $set: { password: hp } }
  );

  console.log('SUCCESS: Admin Password Updated and Device Unlocked');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
