require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const connectToDatabase = require('./utils/db');
const User = require('./models/User');
const Site = require('./models/Site');
const Employee = require('./models/Employee');
const LocationLog = require('./models/LocationLog');

const cleanupData = async () => {
    await connectToDatabase();

    console.log('Cleaning up test data...');

    // 1. Remove Location Logs for Mahesh
    const logs = await LocationLog.deleteMany({ supervisorId: 'mahesh' });
    console.log(`Deleted ${logs.deletedCount} location logs.`);

    // 2. Remove Supervisor User
    const users = await User.deleteOne({ userId: 'mahesh' });
    console.log(`Deleted ${users.deletedCount} user(s).`);

    // 3. Remove Site
    const sites = await Site.deleteOne({ id: 'site_mahesh_test' });
    console.log(`Deleted ${sites.deletedCount} site(s).`);

    // 4. Remove Employee
    const employees = await Employee.deleteOne({ id: 'emp_mahesh_test' });
    console.log(`Deleted ${employees.deletedCount} employee(s).`);

    console.log('Cleanup complete.');
    process.exit(0);
};

cleanupData().catch(err => {
    console.error(err);
    process.exit(1);
});
