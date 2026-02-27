const payload = {
    surveyId: '6997e719071aea1670643e21',
    userName: 'Tester',
    answers: [
        { questionId: 'q1', value: 'First Val' },
        { questionId: 'q2', value: ['Part A', 'Part B'] },
        { questionId: 'q14', value: 'Fourteenth Val' },
        { questionId: 'q29', value: 'Twenty-ninth Val' }
    ]
};

async function test() {
    try {
        const res = await fetch('http://localhost:3003/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        console.log('Status:', res.status);
        if (data.success) {
            console.log('Q1:', data.data.Question_1);
            console.log('Q2:', data.data.Question_2);
            console.log('Q14:', data.data.Question_14);
            console.log('Q29:', data.data.Question_29);

            if (typeof data.data.Question_2 === 'string' && data.data.Question_1 !== '') {
                console.log('SUCCESS: Values are correctly stringified and not empty.');
            } else {
                console.log('FAILURE: Issues detected.');
            }
        } else {
            console.log('Error:', data.error);
        }
    } catch (e) {
        console.error(e);
    }
}
test();
