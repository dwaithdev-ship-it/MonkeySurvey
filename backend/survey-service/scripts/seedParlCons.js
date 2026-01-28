const mongoose = require('mongoose');
const ParlCons = require('../models/ParlCons');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const sampleData = [
    // Zaheerabad
    { parl_name: "Zaheerabad", muni_name: "Angole Jupilet" },
    { parl_name: "Zaheerabad", muni_name: "Akhir" },
    { parl_name: "Zaheerabad", muni_name: "Kapra" },
    { parl_name: "Zaheerabad", muni_name: "Malkajgiri" },
    { parl_name: "Zaheerabad", muni_name: "Zaheerabad" },
    { parl_name: "Zaheerabad", muni_name: "Narayanpet" },
    { parl_name: "Zaheerabad", muni_name: "Bidar" },
    { parl_name: "Zaheerabad", muni_name: "Kamareddy" },
    { parl_name: "Zaheerabad", muni_name: "Yellareddy" },

    // Chevella
    { parl_name: "Chevella", muni_name: "Parigi" },
    { parl_name: "Chevella", muni_name: "Chevella" },
    { parl_name: "Chevella", muni_name: "Moinabad" },
    { parl_name: "Chevella", muni_name: "Shankarpally" },
    { parl_name: "Chevella", muni_name: "Tandur" },
    { parl_name: "Chevella", muni_name: "Vikarabad" },

    // Malkajgiri
    { parl_name: "Malkajgiri", muni_name: "Aliyabad" },
    { parl_name: "Malkajgiri", muni_name: "Muduchinthalapally" },
    { parl_name: "Malkajgiri", muni_name: "Yellampet" },

    // NagarKurnool
    { parl_name: "NagarKurnool", muni_name: "Alampur" },
    { parl_name: "NagarKurnool", muni_name: "Gadwel" },
    { parl_name: "NagarKurnool", muni_name: "Leeja" },
    { parl_name: "NagarKurnool", muni_name: "Wadeepally" },
    { parl_name: "NagarKurnool", muni_name: "Kalwakurthy" },
    { parl_name: "NagarKurnool", muni_name: "Kollapur" },
    { parl_name: "NagarKurnool", muni_name: "NagarKurnool" },
    { parl_name: "NagarKurnool", muni_name: "Kothakota" },
    { parl_name: "NagarKurnool", muni_name: "Pebbair" },
    { parl_name: "NagarKurnool", muni_name: "Wanaparthy" },
    { parl_name: "NagarKurnool", muni_name: "Amangal" },

    // Mahabubnagar
    { parl_name: "Mahabubnagar", muni_name: "Mahaboobnagar corp" },
    { parl_name: "Mahabubnagar", muni_name: "Shadnagar" },
    { parl_name: "Mahabubnagar", muni_name: "Bhoothpur" },
    { parl_name: "Mahabubnagar", muni_name: "Devarakadra" },
    { parl_name: "Mahabubnagar", muni_name: "Kosgi" },
    { parl_name: "Mahabubnagar", muni_name: "Maddur" },
    { parl_name: "Mahabubnagar", muni_name: "Makthal" },
    { parl_name: "Mahabubnagar", muni_name: "Naryanapet" },
    { parl_name: "Mahabubnagar", muni_name: "Kodangal" },
    { parl_name: "Mahabubnagar", muni_name: "Amarchinta" },
    { parl_name: "Mahabubnagar", muni_name: "Atmakur" }
];

async function seed() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            console.error('MONGODB_URI not found in environment');
            process.exit(1);
        }
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Clean existing data
        await ParlCons.deleteMany({});

        // Insert new data
        await ParlCons.insertMany(sampleData);
        console.log('✅ Successfully seeded parl_cons with expanded Parliament data');

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();
