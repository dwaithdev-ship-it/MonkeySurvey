const mongoose = require('mongoose');
const User = require('./models/User');
const MSRUser = require('./models/MSRUser');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

async function test() {
  try {
    await mongoose.connect(uri);
    console.log('Connected!');

    const name = 'Shruthi';
    const username = 'Shruthi';
    const password = 'hashedpassword123';
    const companyEmail = 'sruthi@gmail.com';
    const company = 'Shruthi';
    const phoneNumber = '9704260600';
    const demoTemplate = 'General';

    console.log('Saving MSRUser...');
    const user = new MSRUser({
      name,
      username,
      password,
      companyEmail,
      company,
      phoneNumber,
      demoTemplate
    });
    await user.save();
    console.log('MSRUser saved!');

    console.log('Saving standard User...');
    const firstName = (name || username || 'User').trim() || 'User';
    const lastName = (company || 'MSR').trim() || 'MSR';
    const standardUser = new User({
      email: companyEmail,
      password,
      firstName,
      lastName,
      role: 'creator',
      phoneNumber
    });
    await standardUser.save();
    console.log('Standard User saved!');

    // Cleanup
    await MSRUser.findByIdAndDelete(user._id);
    await User.findByIdAndDelete(standardUser._id);
    console.log('Cleaned up!');

  } catch (err) {
    console.error('ERROR OCCURRED:', err);
  } finally {
    await mongoose.disconnect();
  }
}
test();
