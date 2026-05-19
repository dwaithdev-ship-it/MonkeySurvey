const mongoose = require('mongoose');
const User = require('./models/User');
const MSRUser = require('./models/MSRUser');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function checkShreya() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected!');

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

  } catch (err) {
    console.error('Error during checks:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkShreya();
