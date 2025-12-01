require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectToDatabase = require('./utils/db');

const createMahesh = async () => {
    try {
        await connectToDatabase();
        console.log("Connected to DB");

        const userId = 'mahesh';
        // Using the email found in your codebase as a fallback/admin email
        const email = 'maheshthakurharishankar@gmail.com'; 
        const password = 'ambe123';

        let user = await User.findOne({ userId });
        if (user) {
            console.log("User 'mahesh' already exists. Updating...");
            user.email = email;
            user.password = password;
            user.role = 'admin';
            await user.save();
            console.log("User 'mahesh' updated.");
        } else {
            console.log("Creating user 'mahesh'...");
            user = new User({
                userId,
                name: 'Mahesh Thakur',
                role: 'admin',
                email,
                password,
                trustedDevices: []
            });
            await user.save();
            console.log("User 'mahesh' created.");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

createMahesh();
