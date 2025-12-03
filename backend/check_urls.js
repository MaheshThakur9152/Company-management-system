const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');
require('dotenv').config();

const connectToDatabase = require('./utils/db');

async function checkUrls() {
    await connectToDatabase();
    
    console.log('--- Employees with Photos ---');
    const employees = await Employee.find({ photoUrl: { $ne: null } }).limit(5);
    employees.forEach(e => console.log(`${e.name}: ${e.photoUrl}`));

    console.log('\n--- Attendance with Photos ---');
    const attendance = await Attendance.find({ photoUrl: { $ne: null } }).limit(5);
    attendance.forEach(a => console.log(`${a.date} - ${a.employeeId}: ${a.photoUrl}`));

    process.exit();
}

checkUrls();
