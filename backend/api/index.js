const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectToDatabase = require('../utils/db');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function for Cloudinary upload
const uploadToCloudinary = async (base64String, folder, publicId) => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64String, {
      folder: folder,
      public_id: publicId,
      resource_type: 'image'
    });
    return uploadResponse.secure_url;
  } catch (error) {
    console.error('Cloudinary upload failed:', error);
    return null;
  }
};

// Models
const Site = require('../models/Site');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const LedgerEntry = require('../models/LedgerEntry');
const SalaryRecord = require('../models/SalaryRecord');

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://ambeservice.com', 'https://admin.ambeservice.com'],
  credentials: true
}));

// THIS IS WHAT YOU'VE BEEN MISSING
app.options("*", cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://ambeservice.com', 'https://admin.ambeservice.com'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images

// Middleware to connect to DB
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// --- Routes ---

// Health Check
app.get('/', (req, res) => {
  res.send('Ambe Backend is running!');
});

// Sites
app.get('/api/sites', async (req, res) => {
  try {
    // Return sites with username/password for Admin to see
    const sites = await Site.find({ status: { $ne: 'Deleted' } });
    res.json(sites);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sites', async (req, res) => {
  try {
    const siteData = req.body;
    
    // Auto-generate username/password if missing
    if (!siteData.username && siteData.name) {
        siteData.username = siteData.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12);
    }
    if (!siteData.password) {
        siteData.password = 'ambe123';
    }

    const site = new Site(siteData);
    await site.save();
    res.json(site);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/sites/:id', async (req, res) => {
  try {
    const site = await Site.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(site);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Employees
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await Employee.find({ status: { $ne: 'Deleted' } });
    res.json(employees);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/employees', async (req, res) => {
  try {
    const employeeData = req.body;
    
    // Handle Photo Upload
    if (employeeData.photoUrl && employeeData.photoUrl.startsWith('data:image')) {
      const url = await uploadToCloudinary(employeeData.photoUrl, 'ambe_employees', `${employeeData.id}_${Date.now()}`);
      if (url) employeeData.photoUrl = url;
    }

    const employee = new Employee(employeeData);
    await employee.save();
    res.json(employee);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const employeeData = req.body;

    // Handle Photo Upload
    if (employeeData.photoUrl && employeeData.photoUrl.startsWith('data:image')) {
      const url = await uploadToCloudinary(employeeData.photoUrl, 'ambe_employees', `${req.params.id}_${Date.now()}`);
      if (url) employeeData.photoUrl = url;
    }

    const employee = await Employee.findOneAndUpdate({ id: req.params.id }, employeeData, { new: true });
    res.json(employee);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Attendance
app.get('/api/attendance', async (req, res) => {
  try {
    const attendance = await Attendance.find({});
    res.json(attendance);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/attendance/sync', async (req, res) => {
  try {
    const records = req.body; // Array of records
    const bulkOps = [];
    
    for (const record of records) {
      // Handle Photo Upload to Cloudinary if it's a base64 string
      if (record.photoUrl && record.photoUrl.startsWith('data:image')) {
        const url = await uploadToCloudinary(record.photoUrl, 'ambe_attendance', `${record.employeeId}_${record.date}_${Date.now()}`);
        if (url) record.photoUrl = url;
      }

      // Prepare bulk operation
      bulkOps.push({
        updateOne: {
          filter: { employeeId: record.employeeId, date: record.date },
          update: { $set: { ...record, isSynced: true, isLocked: true } },
          upsert: true
        }
      });
    }

    let result = { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
    if (bulkOps.length > 0) {
        result = await Attendance.bulkWrite(bulkOps);
    }

    res.json({ success: true, syncedCount: records.length, details: result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete Attendance Photo
app.delete('/api/attendance/photo/:employeeId/:date', async (req, res) => {
  try {
    const { employeeId, date } = req.params;
    const record = await Attendance.findOne({ employeeId, date });
    
    if (record) {
        record.photoUrl = null;
        await record.save();
    }
    
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Invoices
app.get('/api/invoices', async (req, res) => {
  try {
    const invoices = await Invoice.find({});
    res.json(invoices);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const invoice = new Invoice(req.body);
    await invoice.save();
    res.json(invoice);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(invoice);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Ledger Entries
app.get('/api/ledger', async (req, res) => {
  try {
    const entries = await LedgerEntry.find({});
    res.json(entries);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/ledger', async (req, res) => {
  try {
    const entry = new LedgerEntry(req.body);
    await entry.save();
    res.json(entry);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/ledger/:id', async (req, res) => {
  try {
    const entry = await LedgerEntry.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    res.json(entry);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/ledger/:id', async (req, res) => {
  try {
    await LedgerEntry.findOneAndDelete({ id: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Salary Records
app.get('/api/salary-records', async (req, res) => {
  try {
    const records = await SalaryRecord.find({});
    res.json(records);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/salary-records', async (req, res) => {
  try {
    const record = new SalaryRecord(req.body);
    await record.save();
    res.json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/salary-records/:id', async (req, res) => {
  try {
    const record = await SalaryRecord.findOneAndUpdate({ id: req.params.id }, req.body, { new: true, upsert: true });
    res.json(record);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Login (Mock Auth for now, but checking DB)
app.post('/api/login', async (req, res) => {
  let { email, password } = req.body;

  // Normalize inputs (trim whitespace and lowercase for boss check)
  const normalizedEmail = email ? email.trim().toLowerCase() : '';
  const normalizedPassword = password ? password.trim().toLowerCase() : '';

  // Hardcoded Boss Login (Case Insensitive & Whitespace Tolerant)
  if (normalizedEmail === 'boss' && normalizedPassword === 'boss') {
    return res.json({ userId: 'boss', name: 'Boss', role: 'boss', email: 'boss' });
  }

  // In real app, check password hash
  // For now, we just check if user exists or use hardcoded logic from frontend
  // But let's try to find user in DB
  try {
    let user = await User.findOne({ email });
    
    // Fallback for initial setup if no users in DB
    if (!user) {
        if (email === 'admin@ambeservice.com') {
            return res.json({ userId: 'admin', name: 'Admin', role: 'admin', email });
        }
        return res.status(401).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Supervisor Login
app.post('/api/supervisor/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Username and password required" });

        const cleanUser = username.trim().toLowerCase();
        const cleanPass = password.trim().toLowerCase().replace(/\s/g, '');

        // Find site by username
        const site = await Site.findOne({ username: cleanUser });
        
        if (!site) {
            return res.status(401).json({ error: "Invalid Username" });
        }

        // Check password (case insensitive, ignore spaces)
        const dbPass = (site.password || 'ambe123').toLowerCase().replace(/\s/g, '');
        
        if (cleanPass === dbPass) {
            return res.json({
                userId: `sup-${site.id}`,
                name: `${site.name} Supervisor`,
                email: `${cleanUser}@ambeservice.com`,
                role: 'supervisor',
                assignedSites: [site.id]
            });
        } else {
            return res.status(401).json({ error: "Invalid Password" });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Seed Endpoint (For initial data population)
app.post('/api/seed', async (req, res) => {
    try {
        // Force seed for now to fix missing data
        const { MOCK_SITES, MOCK_EMPLOYEES, MOCK_INVOICES } = require('../seedData'); 
        
        // Clear existing data to avoid duplicates if re-seeding
        await Site.deleteMany({});
        await Employee.deleteMany({});
        await Invoice.deleteMany({});
        
        // Seed Sites
        if (MOCK_SITES && MOCK_SITES.length > 0) {
            await Site.insertMany(MOCK_SITES);
        }

        // Seed Employees
        if (MOCK_EMPLOYEES && MOCK_EMPLOYEES.length > 0) {
            await Employee.insertMany(MOCK_EMPLOYEES);
        }

        // Seed Invoices
        if (MOCK_INVOICES && MOCK_INVOICES.length > 0) {
            await Invoice.insertMany(MOCK_INVOICES);
        }
        
        return res.json({ message: "Database seeded successfully with initial sites, employees, and invoices." });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Local Development
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Accessible at http://localhost:${PORT}`);
    console.log(`Accessible at http://127.0.0.1:${PORT}`);
    // console.log(`Accessible at http://<YOUR_LAN_IP>:${PORT}`);
  });
}

module.exports = app;
