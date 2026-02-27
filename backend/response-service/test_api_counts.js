async function testCounts() {
    try {
        const res1 = await fetch('http://localhost:3003/responses?surveyId=1&limit=1');
        const data1 = await res1.json();
        console.log('Survey 1 (MSR) Total:', data1.data.pagination.total);

        const res2 = await fetch('http://localhost:3003/responses?surveyId=2&limit=1');
        const data2 = await res2.json();
        console.log('Survey 2 (Prajab) Total:', data2.data.pagination.total);
    } catch (e) {
        console.error(e);
    }
}
testCounts();
