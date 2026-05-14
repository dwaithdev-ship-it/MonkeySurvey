const mongoose = require('mongoose');
const User = require('./models/User');
const MSRUser = require('./models/MSRUser');
require('dotenv').config();

async function clean() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected');
        
        const phone = '9638527415';
        
        const res1 = await MSRUser.deleteMany({ phoneNumber: phone });
        const res2 = await User.deleteMany({ phoneNumber: phone });
        
        console.log('Deleted MSR Users:', res1.deletedCount);
        console.log('Deleted Standard Users:', res2.deletedCount);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

clean();
