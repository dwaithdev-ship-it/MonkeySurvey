const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust if needed
require('dotenv').config();

const API_URL = 'http://localhost:3001/users'; // Directly hitting user service (mounted at /users)
const PHONE = '9988776655';
const PASS = 'TestPassword123!';
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://dwaithdevkalyan_db_user:2TfgyQfGmpiuImO9@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function resetUser() {
    console.log('--- RESETTING USER ---');
    await mongoose.connect(MONGO_URI);
    const user = await User.findOne({ phoneNumber: PHONE });
    if (user) {
        user.registeredDeviceId = null;
        user.activeSession = { token: null, deviceId: null };
        await user.save();
        console.log('User locks cleared.');
    } else {
        console.log('User not found in DB!');
    }
    await mongoose.disconnect();
}

async function login(deviceId, expectedStatus, label) {
    try {
        console.log(`\n--- ${label} [Device: ${deviceId}] ---`);
        const res = await axios.post(`${API_URL}/login`, {
            phoneNumber: PHONE,
            password: PASS,
            deviceId: deviceId
        });

        if (res.status === 200) {
            console.log('✅ Success: Login OK');
        } else {
            console.log(`❓ Unexpected Status: ${res.status}`);
        }
    } catch (err) {
        if (err.response) {
            console.log(`❌ Failed (As Expected?): ${err.response.status} - ${err.response.data.error?.code}`);
            console.log(`   Message: ${err.response.data.error?.message}`);

            if (err.response.status === expectedStatus) {
                console.log('   (This matches expectation)');
            } else {
                console.log(`   WARNNG: Expected ${expectedStatus} but got ${err.response.status}`);
            }
        } else {
            console.log('❌ Network/Server Error:', err.message);
        }
    }
}

async function runTest() {
    await resetUser();

    // 1. First Login (Device A) - Should register
    await login('DEVICE_A', 200, 'First Login');

    // 2. Re-login (Device A) - Should allow
    await login('DEVICE_A', 200, 'Re-Login Same Device');

    // 3. Login Device B - Should BLOCK
    await login('DEVICE_B', 403, 'Login Different Device');
}

runTest();
