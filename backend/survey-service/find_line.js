const fs = require('fs');
const data = JSON.parse(fs.readFileSync('survey_dump.json', 'utf8'));
data.questions.forEach((q, i) => {
    if (q.type === 'line' || (q.question && q.question.includes('ప్రశ్నావలి'))) {
        console.log(`Q${i + 1}: Type=${q.type}, Text=${q.question}, Desc=${q.description}`);
    }
});
