const mongoose = require('mongoose');

async function test(username, password) {
  const encodedPass = encodeURIComponent(password);
  const URI = `mongodb+srv://${username}:${encodedPass}@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey`;
  console.log(`Testing ${username} : ${password} ...`);
  try {
    await mongoose.connect(URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ SUCCESS for ${username}`);
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.error(`❌ FAILED for ${username}: ${err.message}`);
    return false;
  }
}

async function run() {
  await test('dwaithdevkalyan_db_user', 'Dwaithdevkalyan@123');
  await test('dwaithdevkalyan', 'Dwaithdevkalyan@123');
  await test('Dwaith.devkalyan', 'Dwaithdevkalyan@123');
  process.exit(0);
}

run();
