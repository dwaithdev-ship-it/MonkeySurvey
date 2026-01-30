const nodemailer = require('nodemailer');

async function testProvider(name, host, port, user, pass) {
    console.log(`\n--- Testing ${name} (${host}:${port}) ---`);
    console.log(`User: ${user}`);
    console.log(`Pass: ${pass.substring(0, 4)}...${pass.substring(pass.length - 4)}`);

    const transporter = nodemailer.createTransport({
        host: host,
        port: port,
        secure: port == 465,
        auth: { user: user, pass: pass },
        timeout: 10000
    });

    try {
        await transporter.verify();
        console.log(`✅ SUCCESS: ${name} connected!`);
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
        return false;
    }
}

async function runTests() {
    const user1 = 'dwaith.dev@mail.com';
    const user2 = 'dwaith.kalyan@gmail.com';
    const user3 = 'dwaithdevkalyan@gmail.com'; // From MONGODB_URI
    const rawPass = 'qgmv rcfa aepx ormp';
    const cleanPass = rawPass.replace(/\s+/g, '');

    const configs = [
        { name: 'Gmail - mail.com (587)', host: 'smtp.gmail.com', port: 587, user: user1, pass: rawPass },
        { name: 'Gmail - kalyan@gmail (587)', host: 'smtp.gmail.com', port: 587, user: user2, pass: rawPass },
        { name: 'Gmail - devkalyan@gmail (587)', host: 'smtp.gmail.com', port: 587, user: user3, pass: rawPass },
        { name: 'Gmail - mail.com (465)', host: 'smtp.gmail.com', port: 465, user: user1, pass: rawPass },
        { name: 'mail.com (587)', host: 'smtp.mail.com', port: 587, user: user1, pass: rawPass }
    ];

    for (const config of configs) {
        const success = await testProvider(config.name, config.host, config.port, config.user, config.pass);
        if (success) {
            console.log(`\n🏆 FOUND WORKING CONFIGURATION: ${config.name}`);
            console.log(`Update your .env with:`);
            console.log(`SMTP_HOST=${config.host}`);
            console.log(`SMTP_PASS=${config.pass}`);
            break;
        }
    }
}

runTests();
