const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const connectToDatabase = require('./utils/db');

async function resetAdmin() {
    await connectToDatabase();
    
    const adminUser = {
        userId: 'admin',
        name: 'Admin',
        email: 'admin@ambeservice.com',
        password: 'ambe123', // Default password
        role: 'admin',
        trustedDevices: []
    };

    try {
        let user = await User.findOne({ userId: 'admin' });
        if (user) {
            user.password = 'ambe123';
            user.email = 'admin@ambeservice.com';
            await user.save();
            console.log('Admin user updated. Password set to: ambe123');
        } else {
            user = new User(adminUser);
            await user.save();
            console.log('Admin user created. Password set to: ambe123');
        }
    } catch (error) {
        console.error('Error resetting admin:', error);
    } finally {
        mongoose.disconnect();
    }
}

resetAdmin();
