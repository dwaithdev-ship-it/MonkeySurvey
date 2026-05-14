const mongoose = require('mongoose');

async function test(username, password) {
  const encodedUser = encodeURIComponent(username);
  const encodedPass = encodeURIComponent(password);
  const URI = `mongodb+srv://${encodedUser}:${encodedPass}@monkeysurvey.jufdxfk.mongodb.net/monkeysurvey?appName=monkeysurvey`;
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
  await test('Dwaith.devkalyan@gmail.com', 'Dwaithdevkalyan@123');
  process.exit(0);
}

run();
