const mongoose = require('mongoose');
const User = require('../backend/user-service/models/User');
const MSRUser = require('../backend/user-service/models/MSRUser');

const MONGO_URI = 'mongodb+srv://dwaithdevkalyan_db_user:Dwaithdevkalyan123@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function checkShreya() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');

  const msrUsers = await MSRUser.find({
    $or: [
      { username: /shreya/i },
      { name: /shreya/i },
      { companyEmail: /shreya/i }
    ]
  });
  console.log('MSR Users matching shreya:', JSON.stringify(msrUsers, null, 2));

  const standardUsers = await User.find({
    $or: [
      { email: /shreya/i },
      { firstName: /shreya/i },
      { lastName: /shreya/i }
    ]
  });
  console.log('Standard Users matching shreya:', JSON.stringify(standardUsers, null, 2));

  await mongoose.disconnect();
}

checkShreya();
