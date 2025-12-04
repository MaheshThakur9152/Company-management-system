const mongoose = require('mongoose');
require('dotenv').config();
const connectToDatabase = require('./utils/db');
const Attendance = require('./models/Attendance');

(async () => {
    await connectToDatabase();
    
    console.log("Checking latest attendance records...");
    const records = await Attendance.find({}).sort({ date: -1, timestamp: -1 }).limit(10);
    
    records.forEach(r => {
        console.log(`Date: ${r.date}, Emp: ${r.employeeId}, Site: ${r.siteId}, Synced: ${r.isSynced}`);
    });
    
    process.exit();
})();
