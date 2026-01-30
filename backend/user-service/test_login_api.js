
async function testLoginApi() {
    try {
        const url = 'http://localhost:3000/users/login';
        const payload = {
            email: 'dwaith.dev@mail.com',
            password: 'Dh@1thdev123'
        };

        console.log(`Sending POST to ${url}`);
        console.log('Payload:', payload);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        console.log('Response Status:', response.status);
        console.log('Response Data:', data);

        if (response.ok) {
            console.log('✅ LOGIN SUCCESSFUL via API');
        } else {
            console.log('❌ LOGIN FAILED via API');
        }

    } catch (error) {
        console.error('❌ LOGIN FAILED via API (Network Error)');
        console.error('Error:', error.message);
    }
}

testLoginApi();
