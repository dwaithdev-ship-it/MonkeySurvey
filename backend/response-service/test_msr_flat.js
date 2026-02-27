const payload = {
    surveyId: '1', // MSR
    userName: 'Tester',
    answers: [
        { questionId: 'q1', value: 'P1' },
        { questionId: 'q2', value: ['P1', 'A1'] },
        { questionId: 'q3', value: 'M1' },
        { questionId: 'q4', value: 'S1' }
    ]
};

async function testMSR() {
    try {
        const res = await fetch('http://localhost:3003/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('MSR Submit Status:', res.status);
        if (data.success) {
            console.log('MSR Response Keys:', Object.keys(data.data).filter(k => k.startsWith('Question_')));
        }
    } catch (e) { console.error(e); }
}
testMSR();
