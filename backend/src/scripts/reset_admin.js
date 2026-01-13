const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: '../.env' });

const connectToDatabase = require('../utils/db');

async function resetAdmin() {
    await connectToDatabase();
    
    const adminUser = {
        userId: 'admin',
        name: 'Admin',
        email: 'admin@ambeservice.com',
        password: '', // No default password; set a secure password after creation
        role: 'admin',
        trustedDevices: []
    };

    try {
        let user = await User.findOne({ userId: 'admin' });
        if (user) {
            user.password = '';
            user.email = 'admin@ambeservice.com';
            await user.save();
            console.log('Admin user updated. Please set a secure password for the admin user.');
        } else {
            user = new User(adminUser);
            await user.save();
            console.log('Admin user created. Please set a secure password for the admin user.');
        }
    } catch (error) {
        console.error('Error resetting admin:', error);
    } finally {
        mongoose.disconnect();
    }
}

resetAdmin();
