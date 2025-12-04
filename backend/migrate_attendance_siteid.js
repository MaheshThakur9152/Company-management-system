const mongoose = require('mongoose');
require('dotenv').config();
const connectToDatabase = require('./utils/db');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');

(async () => {
    await connectToDatabase();
    
    console.log("Starting migration of Attendance records...");
    
    const records = await Attendance.find({ siteId: { $exists: false } });
    console.log(`Found ${records.length} records missing siteId.`);
    
    let updated = 0;
    let failed = 0;
    
    for (const record of records) {
        // Fix missing ID
        if (!record.id) {
            record.id = `${record.employeeId}_${record.date}`;
            console.log(`Generated ID for record: ${record.id}`);
        }

        const emp = await Employee.findOne({ id: record.employeeId });
        if (emp && emp.siteId) {
            record.siteId = emp.siteId;
            try {
                await record.save();
                updated++;
                if (updated % 100 === 0) console.log(`Updated ${updated} records...`);
            } catch (err) {
                console.error(`Failed to save record ${record.id}: ${err.message}`);
                failed++;
            }
        } else {
            console.log(`Could not find siteId for employee ${record.employeeId} (Record Date: ${record.date})`);
            failed++;
        }
    }
    
    console.log(`Migration complete. Updated: ${updated}, Failed: ${failed}`);
    process.exit();
})();
