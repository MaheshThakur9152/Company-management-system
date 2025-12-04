const mongoose = require('mongoose');
require('dotenv').config();
const connectToDatabase = require('./utils/db');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');

(async () => {
    await connectToDatabase();
    
    const record = {
        employeeId: 'e108',
        date: '2099-01-01', // Future date to avoid conflict
        status: 'P'
        // siteId is missing
    };
    
    console.log("Before fallback:", record);
    
    if (!record.siteId) {
          const emp = await Employee.findOne({ id: record.employeeId });
          if (emp) {
              console.log("Found employee:", emp.name, emp.siteId);
              record.siteId = emp.siteId;
          } else {
              console.log("Employee not found");
          }
    }
    
    console.log("After fallback:", record);
    
    // Clean up
    process.exit();
})();
