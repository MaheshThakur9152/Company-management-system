const mongoose = require('mongoose');
const Site = require('./models/Site');
require('dotenv').config();
const connectToDatabase = require('./utils/db');

async function clearBinding() {
    await connectToDatabase();
    const res = await Site.updateOne({ username: 'mahesh' }, { $set: { deviceId: null, deviceName: null } });
    console.log('Cleared binding for mahesh:', res);
    process.exit();
}

clearBinding();
