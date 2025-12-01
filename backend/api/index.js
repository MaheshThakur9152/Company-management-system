const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectToDatabase = require('../utils/db');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// OTP Transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Set these in .env
    pass: process.env.EMAIL_PASS
  }
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
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:3000', 'https://ambeservice.com', 'https://admin.ambeservice.com'],
  credentials: true
}));

// THIS IS WHAT YOU'VE BEEN MISSING
app.options("*", cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174', 'http://localhost:3000', 'https://ambeservice.com', 'https://admin.ambeservice.com'],
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

// --- User Management (Admins) ---
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({ role: 'admin' });
    res.json(users);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const userData = req.body;
    // Ensure role is admin if not specified (or force it)
    userData.role = 'admin';
    
    // Normalize to lowercase
    if (userData.userId) userData.userId = userData.userId.toLowerCase().trim();
    if (userData.email) userData.email = userData.email.toLowerCase().trim();
    
    // Check if user exists
    const existing = await User.findOne({ $or: [{ email: userData.email }, { userId: userData.userId }] });
    if (existing) {
        return res.status(400).json({ error: "User with this email or ID already exists" });
    }

    // Handle Photo Upload
    if (userData.photoUrl && userData.photoUrl.startsWith('data:image')) {
      const url = await uploadToCloudinary(userData.photoUrl, 'ambe_users', `${userData.userId}_${Date.now()}`);
      if (url) userData.photoUrl = url;
    }

    const user = new User(userData);
    await user.save();
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ userId: req.params.id }, req.body, { new: true });
    res.json(user);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await User.findOneAndDelete({ userId: req.params.id });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- OTP Auth ---
const sendOtpEmail = async (user, otp) => {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        try {
            // For testing, force email to the specific testing account if it's Nandani or Ambe
            const targetEmail = (user.userId === 'nandani' || user.userId === 'ambe') 
                ? (process.env.TEST_EMAIL_RECIPIENT || 'maheshthakurharishankar@gmail.com')
                : user.email;

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: targetEmail, 
                subject: 'Ambe Service Login OTP',
                text: `Your OTP is: ${otp}`
            });
            console.log(`[OTP] Sent to ${targetEmail}`);
        } catch (err) {
            console.error("Failed to send email", err);
        }
    }
};

app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { username } = req.body;
        const normalizedUser = username ? username.trim() : '';
        const regex = new RegExp(`^${normalizedUser}$`, 'i');

        // Find User
        let user = await User.findOne({ $or: [{ userId: { $regex: regex } }, { email: { $regex: regex } }] });
        
        if (!user) {
             // Special case for initial Nandani setup if not exists
             if (normalizedUser.toLowerCase() === 'nandani') {
                user = new User({
                    userId: 'nandani',
                    name: 'Nandani',
                    role: 'superadmin',
                    email: process.env.TEST_EMAIL_RECIPIENT || 'maheshthakurharishankar@gmail.com',
                    trustedDevices: []
                });
             } else {
                return res.status(400).json({ error: "User not found" });
             }
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.otp = otp;
        user.otpExpires = otpExpires;
        
        // Ensure email is set for testing accounts
        if (user.userId === 'nandani' || user.userId === 'ambe') {
            user.email = process.env.TEST_EMAIL_RECIPIENT || 'maheshthakurharishankar@gmail.com';
        }
        
        await user.save();

        // Send Email
        console.log(`[OTP] Generated for ${user.name}: ${otp}`); 
        await sendOtpEmail(user, otp);

        res.json({ success: true, message: "OTP sent to registered email" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/verify-otp', async (req, res) => {
    try {
        const { username, otp, deviceId } = req.body;
        const normalizedUser = username ? username.trim() : '';
        const regex = new RegExp(`^${normalizedUser}$`, 'i');

        const user = await User.findOne({ $or: [{ userId: { $regex: regex } }, { email: { $regex: regex } }] });
        if (!user) return res.status(400).json({ error: "User not found" });

        if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });
        if (user.otpExpires < Date.now()) return res.status(400).json({ error: "OTP Expired" });

        // Clear OTP
        user.otp = null;
        user.otpExpires = null;

        // Trust Device
        if (deviceId) {
            if (!user.trustedDevices) user.trustedDevices = [];
            if (!user.trustedDevices.includes(deviceId)) {
                user.trustedDevices.push(deviceId);
            }
        }

        await user.save();

        res.json(user);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/auth/revoke-trust', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findOne({ userId });
        if (!user) return res.status(404).json({ error: "User not found" });

        user.trustedDevices = [];
        await user.save();
        
        res.json({ success: true, message: "User logged out from all devices (Trust revoked)" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Login (Mock Auth for now, but checking DB)
app.post('/api/login', async (req, res) => {
  let { email, password, deviceId } = req.body;

  // Normalize inputs
  const normalizedEmail = email ? email.trim() : '';
  const regex = new RegExp(`^${normalizedEmail}$`, 'i');
  
  try {
    // Check by email OR userId (username)
    let user = await User.findOne({ $or: [{ email: { $regex: regex } }, { userId: { $regex: regex } }] });
    
    if (user) {
        // Fix for Nandani if password is missing (Bootstrap fix)
        if (user.userId === 'nandani' && !user.password) {
            user.password = password || 'ambe123';
            await user.save();
        }

        // Simple password check
        if (user.password === password) {
             // Check Trusted Device
             if (deviceId && user.trustedDevices && user.trustedDevices.includes(deviceId)) {
                 return res.json(user);
             } else {
                 // Device not trusted -> Trigger OTP
                 // Generate OTP
                 const otp = Math.floor(100000 + Math.random() * 900000).toString();
                 const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
                 
                 user.otp = otp;
                 user.otpExpires = otpExpires;
                 
                 // Ensure email is set for testing accounts
                 if (user.userId === 'nandani' || user.userId === 'ambe') {
                    user.email = process.env.TEST_EMAIL_RECIPIENT || 'maheshthakurharishankar@gmail.com';
                 }

                 await user.save();
                 
                 console.log(`[OTP] Login Triggered for ${user.name}: ${otp}`);
                 await sendOtpEmail(user, otp);
                 
                 return res.json({ requireOtp: true, userId: user.userId, message: "New device detected. OTP sent." });
             }
        } else {
             return res.status(401).json({ error: 'Invalid Password' });
        }
    }
    
    // Fallback for initial setup if no users in DB
    if (!user) {
        // Auto-create 'ambe' user if requested
        if (normalizedEmail.toLowerCase() === 'ambe' && password === 'ambe123') {
             const newUser = new User({
                 userId: 'ambe',
                 name: 'Ambe Admin',
                 role: 'admin',
                 email: process.env.TEST_EMAIL_RECIPIENT || 'maheshthakurharishankar@gmail.com', // Default to testing email
                 password: 'ambe123',
                 trustedDevices: []
             });
             
             // Trigger OTP for first login
             const otp = Math.floor(100000 + Math.random() * 900000).toString();
             newUser.otp = otp;
             newUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
             await newUser.save();
             
             console.log(`[OTP] Created Ambe User: ${otp}`);
             await sendOtpEmail(newUser, otp);
             
             return res.json({ requireOtp: true, userId: 'ambe', message: "User created. OTP sent." });
        }

        // Auto-create 'nandani' user if requested (Bootstrap)
        if (normalizedEmail.toLowerCase() === 'nandani') {
             const newUser = new User({
                 userId: 'nandani',
                 name: 'Nandani',
                 role: 'superadmin',
                 email: process.env.TEST_EMAIL_RECIPIENT || 'maheshthakurharishankar@gmail.com',
                 password: password || 'ambe123', // Use provided password or default
                 trustedDevices: []
             });
             
             // Trigger OTP for first login
             const otp = Math.floor(100000 + Math.random() * 900000).toString();
             newUser.otp = otp;
             newUser.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
             await newUser.save();
             
             console.log(`[OTP] Created Nandani User: ${otp}`);
             await sendOtpEmail(newUser, otp);
             
             return res.json({ requireOtp: true, userId: 'nandani', message: "Superadmin created. OTP sent." });
        }

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
