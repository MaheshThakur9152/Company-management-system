const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
const connectToDatabase = require('./utils/db');

async function checkUsers() {
    await connectToDatabase();
    const users = await User.find({});
    console.log('Users:', JSON.stringify(users, null, 2));
    process.exit();
}

checkUsers();
