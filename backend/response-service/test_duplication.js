async function testDuplication() {
    const payload = {
        surveyId: '1',
        userName: 'Test User Dupe',
        answers: [
            { questionId: 'q1', value: 'Option A' },
            { questionId: 'q2', value: ['Parl 1', 'Assem 1', 'Mand 1'] }
        ]
    };

    try {
        console.log('--- FIRST SUBMISSION ---');
        const res1 = await fetch('http://localhost:3003/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data1 = await res1.json();
        console.log('Status:', res1.status);
        console.log('Data ID:', data1.data._id);

        console.log('\n--- SECOND SUBMISSION (DUPLICATE) ---');
        const res2 = await fetch('http://localhost:3003/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data2 = await res2.json();
        console.log('Status:', res2.status);
        console.log('Data ID:', data2.data._id);
        console.log('Message:', data2.message);

        if (data1.data._id === data2.data._id) {
            console.log('\nSUCCESS: Duplication prevented, same ID returned.');
        } else {
            console.log('\nFAILURE: Duplication NOT prevented, different IDs returned.');
        }

    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testDuplication();
