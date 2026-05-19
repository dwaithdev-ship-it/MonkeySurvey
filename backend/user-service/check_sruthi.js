const mongoose = require('mongoose');
const User = require('./models/User');
const MSRUser = require('./models/MSRUser');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function checkSruthi() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected!');

    const email = 'sruthi@gmail.com';
    const username = 'Shruthi';
    const phone = '9704260600';

    console.log('\n--- Checking MSRUser Collection ---');
    const msrByEmail = await MSRUser.findOne({ companyEmail: email });
    console.log('MSRUser by email:', msrByEmail);

    const msrByUsername = await MSRUser.findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } });
    console.log('MSRUser by username (case-insensitive):', msrByUsername);

    const msrByPhone = await MSRUser.findOne({ phoneNumber: phone });
    console.log('MSRUser by phone:', msrByPhone);

    console.log('\n--- Checking User (Standard) Collection ---');
    const userByEmail = await User.findOne({ email: email });
    console.log('User by email:', userByEmail);

    const userByPhone = await User.findOne({ phoneNumber: phone });
    console.log('User by phone:', userByPhone);

    console.log('\n--- Checking Indexes ---');
    const userIndexes = await User.collection.indexes();
    console.log('User Indexes:', JSON.stringify(userIndexes, null, 2));

    const msrIndexes = await MSRUser.collection.indexes();
    console.log('MSRUser Indexes:', JSON.stringify(msrIndexes, null, 2));

  } catch (err) {
    console.error('Error during checks:', err);
  } finally {
    await mongoose.disconnect();
  }
}

checkSruthi();
