const axios = require('axios');

async function test() {
    try {
        const data = {
            name: "Srihari",
            username: "Srihari",
            password: "password123",
            companyEmail: "sr@gmail.com",
            company: "Sr",
            phoneNumber: "9638527415",
            demoTemplate: "General" // I'll add this since it's required
        };
        
        const res = await axios.post('http://localhost:3001/users/msr-register', data);
        console.log('Success:', res.data);
    } catch (e) {
        console.log('Error Status:', e.response?.status);
        console.log('Error Data:', JSON.stringify(e.response?.data, null, 2));
    }
}

test();
