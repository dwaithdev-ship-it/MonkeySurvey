async function testArrayFix() {
    const payload = {
        surveyId: '2', // Prajabhipraya
        userName: 'Array Fix Tester',
        answers: [
            { questionId: 'q1', value: 'Voter Name' },
            { questionId: 'q2', value: [['Parliament A'], ['Assembly B'], ['Mandal C']] }, // Nested arrays
            { questionId: 'q3', value: 'Ward 5' }
        ]
    };

    try {
        console.log('--- SUBMITTING NESTED ARRAYS ---');
        const res = await fetch('http://localhost:3003/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('Status:', res.status);
        console.log('Parliament:', data.data.parliament);
        console.log('Assembly:', data.data.assembly);
        console.log('Mandal:', data.data.mandal);

        if (typeof data.data.parliament === 'string' && data.data.parliament === 'Parliament A') {
            console.log('\nSUCCESS: Parliament is a string.');
        } else {
            console.log('\nFAILURE: Parliament is not a string or has wrong value:', typeof data.data.parliament, data.data.parliament);
        }

    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testArrayFix();
