const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://dwaithdevkalyan_db_user:Dwaithdevkalyan123@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function checkSurvey() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const surveyId = '6997e719071aea1670643e21';
    
    // Define a simple schema to just check existence
    const SurveySchema = new mongoose.Schema({}, { strict: false });
    const Survey = mongoose.model('Survey', SurveySchema, 'surveys');

    const survey = await Survey.findById(surveyId);
    if (survey) {
      console.log('Survey found!');
      console.log('Title:', survey.name || survey.title);
      console.log('Questions count:', (survey.questions || []).length);
      console.log('Status:', survey.status);
    } else {
      console.log('Survey NOT found in database.');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkSurvey();
