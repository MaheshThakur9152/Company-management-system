const mongoose = require('mongoose');
const Site = require('./models/Site');
require('dotenv').config();
const connectToDatabase = require('./utils/db');

async function clearBinding() {
    await connectToDatabase();
    // Clear for 'acme'
    const res = await Site.updateOne({ username: 'acme' }, { $set: { deviceId: null, deviceName: null } });
    console.log('Cleared binding for acme:', res);
    process.exit();
}

clearBinding();
