const mongoose = require('mongoose');
const User = require('./models/User');
const MSRUser = require('./models/MSRUser');
require('dotenv').config();

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');
        
        const username = 'Srihari';
        const email = 'sr@gmail.com';
        const phone = '9638527415';
        
        const msr = await MSRUser.findOne({ $or: [{ username }, { companyEmail: email }] });
        const std = await User.findOne({ $or: [{ email }, { phoneNumber: phone }] });
        
        console.log('MSR User:', msr);
        console.log('Standard User:', std);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
