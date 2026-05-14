const mongoose = require('mongoose');

const URI = 'mongodb+srv://dwaithdevkalyan_db_user:Dwaithdevkalyan123@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey';

async function run() {
  await mongoose.connect(URI);
  console.log('Connected to DB');

  const email = 'dwaith@gmail.com';
  const username = 'Takshitha';

  const user = await mongoose.connection.db.collection('users').findOne({ email: email });
  const msrUser = await mongoose.connection.db.collection('msr_users').findOne({ 
    $or: [
      { companyEmail: email }, 
      { username: username }
    ] 
  });

  console.log('Standard User found:', user ? user.email : 'None');
  console.log('MSR User found (Email):', msrUser ? msrUser.companyEmail : 'None');
  console.log('MSR User found (Username):', msrUser ? msrUser.username : 'None');
  
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
