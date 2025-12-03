require('dotenv').config();
const mongoose = require('mongoose');
const connectToDatabase = require('./utils/db');
const User = require('./models/User');
const Site = require('./models/Site');
const Employee = require('./models/Employee');
const LocationLog = require('./models/LocationLog');

const seedData = async () => {
    await connectToDatabase();

    const siteId = 'site_mahesh_test';
    const siteLat = 19.205167;
    const siteLng = 72.822722;

    // 1. Create Site
    console.log('Creating Site...');
    await Site.findOneAndUpdate(
        { id: siteId },
        {
            id: siteId,
            name: 'Test Site - Mahesh',
            location: 'Kandivali West',
            latitude: siteLat,
            longitude: siteLng,
            geofenceRadius: 200,
            activeWorkers: 1,
            status: 'Active',
            username: 'mahesh_site', // Optional, for site-specific login if used
            password: 'ambe123'
        },
        { upsert: true, new: true }
    );

    // 2. Create Supervisor User
    console.log('Creating Supervisor User...');
    await User.findOneAndUpdate(
        { userId: 'mahesh' },
        {
            userId: 'mahesh',
            name: 'Mahesh Supervisor',
            email: 'mahesh@ambeservice.com',
            password: 'ambe123',
            role: 'supervisor',
            assignedSites: [siteId],
            trustedDevices: [] // Clear trusted devices to allow easy login
        },
        { upsert: true, new: true }
    );

    // 3. Create Employee
    console.log('Creating Employee...');
    await Employee.findOneAndUpdate(
        { id: 'emp_mahesh_test' },
        {
            id: 'emp_mahesh_test',
            biometricCode: 'M001',
            name: 'Mahesh Employee',
            role: 'Supervisor',
            siteId: siteId,
            status: 'Active',
            salaryDetails: { baseSalary: 15000 }
        },
        { upsert: true, new: true }
    );

    // 4. Create Location Logs
    console.log('Creating Location Logs...');
    const today = new Date();
    
    // Log 1: In Range (9:00 AM)
    const timeIn = new Date(today);
    timeIn.setHours(9, 0, 0, 0);
    
    await LocationLog.create({
        supervisorId: 'mahesh',
        supervisorName: 'Mahesh Supervisor',
        siteId: siteId,
        latitude: siteLat, // Exact location
        longitude: siteLng,
        status: 'In Range',
        timestamp: timeIn
    });

    // Log 2: Out of Range (6:00 PM)
    const timeOut = new Date(today);
    timeOut.setHours(18, 0, 0, 0);

    await LocationLog.create({
        supervisorId: 'mahesh',
        supervisorName: 'Mahesh Supervisor',
        siteId: siteId,
        latitude: 19.210000, // Far away
        longitude: 72.830000,
        status: 'Out of Range',
        timestamp: timeOut
    });

    console.log('Seed data created successfully!');
    process.exit(0);
};

seedData().catch(err => {
    console.error(err);
    process.exit(1);
});
