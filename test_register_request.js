async function testRegistration() {
  try {
    const payload = {
      name: 'Shruthi Test',
      username: 'Shruthi_new',
      password: 'password123',
      companyEmail: 'sruthi_new@gmail.com',
      company: 'Shruthi',
      phoneNumber: '9704260601',
      demoTemplate: 'General'
    };

    console.log('Sending registration request...');
    const response = await fetch('http://localhost:3000/users/msr-register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRegistration();
