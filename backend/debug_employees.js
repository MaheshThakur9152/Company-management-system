const mongoose = require('mongoose');
require('dotenv').config();
const connectToDatabase = require('./utils/db');
const Employee = require('./models/Employee');

(async () => {
    await connectToDatabase();
    
    console.log("Checking employees...");
    const employees = await Employee.find({}).limit(10);
    
    employees.forEach(e => {
        console.log(`Emp: ${e.id}, Name: ${e.name}, Site: ${e.siteId}`);
    });
    
    process.exit();
})();
