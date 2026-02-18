const axios = require('axios');

const API_URL = 'http://localhost:3000/users'; // Hitting Gateway
const PHONE = '9988776655';
const PASS = 'TestPassword123!';

async function loginViaGateway() {
    try {
        console.log(`\n--- Login via Gateway [Device: GW_TEST] ---`);
        const res = await axios.post(`${API_URL}/login`, {
            phoneNumber: PHONE,
            password: PASS,
            deviceId: 'GW_TEST'
        });

        if (res.status === 200) {
            console.log('✅ Success: Login via Gateway OK');
            console.log('Token:', res.data.data.token ? 'Yes' : 'No');
        } else {
            console.log(`❓ Unexpected Status: ${res.status}`);
        }
    } catch (err) {
        if (err.response) {
            console.log(`❌ Failed: ${err.response.status} - ${err.response.statusText}`);
            console.log('Data:', err.response.data);
        } else {
            console.log('❌ Network/Server Error:', err.message);
        }
    }
}

loginViaGateway();
