const mongoose = require('mongoose');
const Site = require('./models/Site');
require('dotenv').config();
const connectToDatabase = require('./utils/db');

async function debugMahesh() {
    await connectToDatabase();
    const sites = await Site.find({ username: 'mahesh' });
    console.log('Found sites for mahesh:', JSON.stringify(sites, null, 2));
    process.exit();
}

debugMahesh();
