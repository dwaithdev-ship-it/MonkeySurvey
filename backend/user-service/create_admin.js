const mongoose = require('mongoose');
const { hashPassword } = require('../shared/auth');

const URI = 'mongodb+srv://dwaithdevkalyan_db_user:Dwaithdevkalyan123@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function run() {
  await mongoose.connect(URI);
  console.log('Connected to DB');

  const password = 'Dwaithdevkalyan@123';
  const hashedPassword = await hashPassword(password);
  const email = 'Dwaith.devkalyan@gmail.com';

  // 1. Create standard user
  const user = {
    email: email,
    password: hashedPassword,
    firstName: 'Dwaith',
    lastName: 'Kalyan',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await mongoose.connection.db.collection('users').updateOne(
    { email: email },
    { $set: user },
    { upsert: true }
  );
  console.log('Admin user created in "users" collection');

  // 2. Create MSR user
  const msrUser = {
    username: 'dwaithdevkalyan',
    password: hashedPassword,
    companyEmail: email,
    name: 'Dwaith Kalyan',
    company: 'DwaithDev',
    phoneNumber: '1234567890',
    demoTemplate: 'General',
    role: 'admin',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await mongoose.connection.db.collection('msr_users').updateOne(
    { companyEmail: email },
    { $set: msrUser },
    { upsert: true }
  );
  console.log('MSR user created in "msr_users" collection');

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});


