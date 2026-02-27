const axios = require('axios');

async function test() {
    try {
        const res = await axios.get('http://localhost:3002/parl-cons/hierarchy/parliaments');
        console.log('Hierarchy Parliaments Response:', JSON.stringify(res.data, null, 2));

        const res2 = await axios.get('http://localhost:3002/parl-cons/parliaments');
        console.log('Legacy Parliaments Response:', JSON.stringify(res2.data, null, 2));
    } catch (e) {
        console.error('Error:', e.message);
    }
}
test();
