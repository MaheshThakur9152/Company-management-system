const express = require('express');

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const cors = require('cors');
const mongoose = require('mongoose'); // Added mongoose
require('dotenv').config();
const connectToDatabase = require('../utils/db');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken'); // Import JWT
const cookieParser = require('cookie-parser');


// Connect to Database
(async () => {
  await connectToDatabase(); // Uncommented to allow DB connection

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// OTP Transporter
console.log('Configuring SMTP Transporter...');
console.log('SMTP Host:', process.env.EMAIL_HOST || 'smtp-relay.brevo.com');
console.log('SMTP Port:', process.env.EMAIL_PORT || '587');
console.log('SMTP User:', process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + '***' : 'Not Set');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER, // Set these in .env
    pass: process.env.EMAIL_PASS
  },
  // Add these to help with connection issues
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Helper function for Cloudinary upload
const uploadToCloudinary = async (base64String, folder) => {
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64String, {
      folder: folder,
      resource_type: 'image',
      quality: 100, // No compression
      format: 'png' // Convert to PNG
    });
    return uploadResponse.public_id; // Return public_id directly
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
const LocationLog = require('../models/LocationLog');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for now (App + Web)
    methods: ["GET", "POST"]
  },
  allowEIO3: true // Allow older clients (Android socket.io-client 2.x uses EIO3 sometimes)
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('join_site', (siteId) => {
    socket.join(siteId);
    console.log(`User ${socket.id} joined site: ${siteId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Middleware to authenticate JWT from cookie or header
const authenticateToken = (req, res, next) => {
  const token = req.cookies.authToken || req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

app.use(cookieParser());

app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5173/', 
    'http://127.0.0.1:5173', 
    'http://localhost:3000', 
    'https://ambeservice.com', 
    'https://admin.ambeservice.com',
    'https://admin.ambeservice.com/'
  ],
  credentials: true
}));

// THIS IS WHAT YOU'VE BEEN MISSING
app.options("*", cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5173/', 
    'http://127.0.0.1:5173', 
    'http://localhost:3000', 
    'https://ambeservice.com', 
    'https://admin.ambeservice.com',
    'https://admin.ambeservice.com/'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Increased limit for base64 images


// --- Routes ---

// Health Check
app.get('/', (req, res) => {
  res.send('Ambe Backend is running!');
});

// View Image (Redirect to Cloudinary URL for display)
app.get('/api/view/image/*', (req, res) => {
  try {
    const publicId = req.params[0];
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    if (!cloudName) return res.status(500).json({ error: "Cloudinary config missing" });

    const viewUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
    return res.redirect(viewUrl);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate view URL' });
  }
});

// Download Image (Forces download via fl_attachment)
app.get('/api/download/image/*', (req, res) => {
  try {
    const publicId = req.params[0]; // full cloudinary public_id
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

    if (!cloudName) {
      console.error("Cloudinary Cloud Name not set!");
      return res.status(500).json({ error: "Cloudinary configuration missing" });
    }

    // fl_attachment forces download
    const downloadUrl =
      `https://res.cloudinary.com/${cloudName}/image/upload/fl_attachment/${publicId}`;

    console.log(`Redirecting to: ${downloadUrl}`);
    return res.redirect(downloadUrl);

  } catch (error) {
    console.error("Download Error:", error);
    return res.status(500).json({ error: 'Failed to generate download URL' });
  }
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
    
    // Force username to lowercase if provided
    if (siteData.username) {
        siteData.username = siteData.username.toLowerCase();
    }

    // Auto-generate username/password if missing
    if (!siteData.username && siteData.name) {
        siteData.username = siteData.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12);
    }
    if (!siteData.password) {
        siteData.password = 'ambe123';
    }

    const site = new Site(siteData);
    await site.save();
    io.emit('data_update', { type: 'sites' });
    res.json(site);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/sites/:id', async (req, res) => {
  try {
    // Force username to lowercase if provided
    if (req.body.username) {
        req.body.username = req.body.username.toLowerCase();
    }
    const site = await Site.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    io.emit('data_update', { type: 'sites' });
    res.json(site);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Employees
app.get('/api/employees', async (req, res) => {
  try {
    const { sort, order, site } = req.query;
    let query = { status: { $ne: 'Deleted' } };
    let sortOptions = {};

    // Filter by site
    if (site) query.siteId = site;

    // Sort options
    if (sort) {
      sortOptions[sort] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.name = 1; // Default sort by name asc
    }

    const employees = await Employee.find(query).sort(sortOptions);
    res.json(employees);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/employees', async (req, res) => {
  try {
    const employeeData = req.body;
    
    // Handle Photo Upload
    if (employeeData.photoUrl && employeeData.photoUrl.startsWith('data:image')) {
      const publicId = await uploadToCloudinary(employeeData.photoUrl, 'ambe_employees');
      if (publicId) employeeData.photoUrl = publicId;
    }

    const employee = new Employee(employeeData);
    await employee.save();
    io.emit('data_update', { type: 'employees' }); // Notify clients
    res.json(employee);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/employees/:id', async (req, res) => {
  try {
    const employeeData = req.body;

    // Handle Photo Upload
    if (employeeData.photoUrl && employeeData.photoUrl.startsWith('data:image')) {
      const publicId = await uploadToCloudinary(employeeData.photoUrl, 'ambe_employees');
      if (publicId) employeeData.photoUrl = publicId;
    }

    const employee = await Employee.findOneAndUpdate({ id: req.params.id }, employeeData, { new: true });
    io.emit('data_update', { type: 'employees' }); // Notify clients
    res.json(employee);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Attendance
app.get('/api/attendance', async (req, res) => {
  try {
    const { sort, order, site, employee, month, year, updatedAfter } = req.query;
    console.log('GET /api/attendance query:', req.query);
    let query = {};
    let sortOptions = {};

    // Filter by site
    if (site) query.siteId = site;

    // Filter by employee
    if (employee) query.employeeId = employee;

    // Filter by month/year
    if (month && year) {
      // Since date is stored as String (YYYY-MM-DD), we must use String comparison or Regex
      // We cannot use Date objects for comparison against String fields
      const m = month.toString().padStart(2, '0');
      query.date = { $regex: `^${year}-${m}` };
    }

    // Efficient Polling: Get only records updated after a certain time
    if (updatedAfter) {
        query.updatedAt = { $gt: new Date(updatedAfter) };
    }

    // Sort options
    if (sort) {
      sortOptions[sort] = order === 'desc' ? -1 : 1;
    } else {
      sortOptions.date = -1; // Default sort by date desc
    }

    console.log('GET /api/attendance mongo query:', query);
    const attendance = await Attendance.find(query).sort(sortOptions);
    console.log(`Found ${attendance.length} records`);
    res.json(attendance);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/attendance/sync', async (req, res) => {
  try {
    const records = req.body; // Array of records
    const bulkOps = [];
    const errors = [];
    
    for (const record of records) {
      // 1. Prevent Multiple Attendance Check
      const existingRecord = await Attendance.findOne({ 
          employeeId: record.employeeId, 
          date: record.date 
      });

      if (existingRecord) {
          // STRICT LOCK: If ANY record exists for this employee on this date, REJECT IT.
          // This prevents multiple devices from logging the same attendance.
          errors.push({
              employeeId: record.employeeId,
              error: "Attendance already marked for this date. Updates are locked."
          });
          continue; 
      }

      // Ensure siteId is present
      if (!record.siteId) {
          const emp = await Employee.findOne({ id: record.employeeId });
          if (emp) {
              record.siteId = emp.siteId;
          }
      }

      // Handle Photo Upload to Cloudinary if it's a base64 string
      if (record.photoUrl && record.photoUrl.startsWith('data:image')) {
        const publicId = await uploadToCloudinary(record.photoUrl, 'ambe_attendance');
        if (publicId) record.photoUrl = publicId;
      }

      // Prepare bulk operation
      // CHANGED: Use insertOne to strictly prevent duplicates (Race Condition Fix)
      // If a record exists (from another device), this will fail with E11000
      bulkOps.push({
        insertOne: {
          document: { ...record, isSynced: true, isLocked: true }
        }
      });
    }

    let result = { matchedCount: 0, modifiedCount: 0, upsertedCount: 0, insertedCount: 0 };
    if (bulkOps.length > 0) {
        try {
            // ordered: false ensures we process all records even if some fail (duplicates)
            result = await Attendance.bulkWrite(bulkOps, { ordered: false });
        } catch (err) {
            // Handle BulkWriteError
            if (err.code === 11000 || err.writeErrors) {
                // Filter out duplicate key errors (we treat them as "already synced")
                const nonDuplicateErrors = err.writeErrors ? err.writeErrors.filter(e => e.code !== 11000) : [];
                
                if (nonDuplicateErrors.length > 0) {
                    throw err; // Re-throw if there are real errors
                }
                
                // If only duplicates, we consider it a success (idempotent)
                // We can count how many were inserted vs failed
                result = { 
                    insertedCount: err.result.nInserted, 
                    modifiedCount: 0, 
                    upsertedCount: 0 
                };
            } else {
                throw err;
            }
        }
        
        // Emit Socket Event to all clients in the same site (if siteId is available in records)
        // Assuming all records in a sync batch belong to the same site (usually true for a supervisor)
        if (records.length > 0) {
             // We need to fetch siteId for at least one employee to know which room to emit to
             // Or pass siteId in the sync body. For now, let's fetch it.
             const emp = await Employee.findOne({ id: records[0].employeeId });
             if (emp && emp.siteId) {
                 io.to(emp.siteId).emit('attendance_update', { 
                     message: 'New attendance synced', 
                     count: (result.insertedCount || 0) + (result.upsertedCount || 0) + (result.modifiedCount || 0)
                 });
             }
        }
    }

    res.json({ 
        success: true, 
        syncedCount: (result.insertedCount || 0) + (result.upsertedCount || 0) + (result.modifiedCount || 0), 
        errors: errors,
        details: result 
    });
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
      const publicId = await uploadToCloudinary(userData.photoUrl, 'ambe_users');
      if (publicId) userData.photoUrl = publicId;
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
            let targetEmail = user.email;
            if (user.userId === 'nandani') {
                targetEmail = 'ambeservices.nandani@gmail.com';
            } else if (user.userId === 'ambe') {
                targetEmail = process.env.TEST_EMAIL_RECIPIENT || 'maheshthakurharishankar@gmail.com';
            }

            await transporter.sendMail({
                from: process.env.EMAIL_FROM || 'media@ambeservice.com', // Use verified sender email
                to: targetEmail, 
                subject: 'Ambe Service Login OTP',
                html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #eeeeee; }
    .header h1 { color: #333333; margin: 0; }
    .content { padding: 20px 0; text-align: center; }
    .otp-code { font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; margin: 20px 0; }
    .footer { text-align: center; color: #888888; font-size: 12px; padding-top: 20px; border-top: 1px solid #eeeeee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ambe Service</h1>
    </div>
    <div class="content">
      <p>Hello ${user.name || 'User'},</p>
      <p>You requested a login OTP. Please use the code below to complete your verification:</p>
      <div class="otp-code">${otp}</div>
      <p>This code is valid for 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Ambe Service. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
                `
            });
            console.log(`[OTP] Sent to ${targetEmail}`);
        } catch (err) {
            console.error("Failed to send email", err);
        }
    }
};

// Helper to escape regex characters
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

app.post('/api/auth/send-otp', async (req, res) => {
    try {
        const { username } = req.body;
        const normalizedUser = (username && typeof username === 'string') ? username.trim() : '';
        const escapedUser = escapeRegex(normalizedUser);
        const regex = new RegExp(`^${escapedUser}$`, 'i');

        // Find User
        let user = await User.findOne({ $or: [{ userId: { $regex: regex } }, { email: { $regex: regex } }] });
        
        if (!user) {
             // Special case for initial Nandani setup if not exists
             if (normalizedUser.toLowerCase() === 'nandani') {
                user = new User({
                    userId: 'nandani',
                    name: 'Nandani',
                    role: 'superadmin',
                    email: 'ambeservices.nandani@gmail.com',
                    trustedDevices: []
                });
             } else {
                return res.status(400).json({ error: "User not found" });
             }
        }

        // Check if OTP already exists and is valid
        if (user.otp && user.otpExpires > Date.now()) {
            return res.json({ success: true, message: "OTP already sent to registered email" });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.otp = otp;
        user.otpExpires = otpExpires;
        
        // Ensure email is set for testing accounts
                 if (user.userId === 'nandani' || user.userId === 'ambe' || user.userId === 'admin') {
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
        console.log('Verify OTP Request:', req.body); // Log request
        const { username, otp, deviceId } = req.body;
        const normalizedUser = (username && typeof username === 'string') ? username.trim() : '';
        const escapedUser = escapeRegex(normalizedUser);
        const regex = new RegExp(`^${escapedUser}$`, 'i');

        const user = await User.findOne({ $or: [{ userId: { $regex: regex } }, { email: { $regex: regex } }] });
        if (!user) {
            console.log('Verify OTP: User not found for', username);
            return res.status(400).json({ error: "User not found" });
        }

        console.log(`Verify OTP: Checking for ${user.userId}. Expected: ${user.otp}, Received: ${otp}`);

        // Ensure string comparison
        if (String(user.otp).trim() !== String(otp).trim()) {
             console.log('Verify OTP: Invalid OTP');
             return res.status(400).json({ error: "Invalid OTP" });
        }
        if (user.otpExpires < Date.now()) {
             console.log('Verify OTP: Expired');
             return res.status(400).json({ error: "OTP Expired" });
        }

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

        // Generate JWT
        const token = jwt.sign(
            { userId: user.userId, role: user.role, email: user.email },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: '24h' }
        );

        // Set HTTP-only cookie
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: false, // Set to true in production with HTTPS
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.json({ ...user.toObject(), token });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ userId: req.user.userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
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

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('authToken');
    res.json({ success: true, message: 'Logged out successfully' });
});

// Login (Mock Auth for now, but checking DB)
app.post('/api/login', async (req, res) => {
  console.log('Login Request Body:', req.body); // Added logging
  let { email, password, deviceId } = req.body;

  // DB Connection Check - Prevent Timeout if DB is down
  if (mongoose.connection.readyState !== 1) {
      console.log('⚠️ DB Not Connected. Using Mock Login for connectivity test.');
      if (email === 'admin@ambeservice.com' || email === 'ambe') {
          return res.json({ 
              userId: 'ambe', 
              name: 'Ambe Admin (Offline Mode)', 
              role: 'admin', 
              email: email,
              token: 'mock-offline-token'
          });
      }
      return res.status(503).json({ error: 'Database not connected. Please check server logs.' });
  }

  try {
    // Normalize inputs
    const normalizedEmail = (email && typeof email === 'string') ? email.trim() : '';
    const escapedEmail = escapeRegex(normalizedEmail);
    const regex = new RegExp(`^${escapedEmail}$`, 'i');

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
             // Check if OTP already exists and is valid
             if (user.otp && user.otpExpires > Date.now()) {
                 return res.json({ requireOtp: true, userId: user.userId, message: "OTP already sent to registered email." });
             }

             // ALWAYS Trigger OTP (Trusted Device check bypassed)
             // Generate OTP
             const otp = Math.floor(100000 + Math.random() * 900000).toString();
             const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
             
             user.otp = otp;
             user.otpExpires = otpExpires;
             
             // Ensure email is set for testing accounts
             if (user.userId === 'nandani') {
                user.email = 'ambeservices.nandani@gmail.com';
             } else if (user.userId === 'ambe' || user.userId === 'admin') {
                user.email = process.env.TEST_EMAIL_RECIPIENT || 'maheshthakurharishankar@gmail.com';
             }

             await user.save();
             
             console.log(`[OTP] Login Triggered for ${user.name}: ${otp}`);
             await sendOtpEmail(user, otp);
             
             return res.json({ requireOtp: true, userId: user.userId, message: "OTP sent to registered email." });
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
                 email: 'ambeservices.nandani@gmail.com',
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

// Supervisor Location Log
app.post('/api/supervisor/location', async (req, res) => {
    try {
        const log = new LocationLog(req.body);
        await log.save();
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Get Location Logs (for Admin and Supervisor)
app.get('/api/supervisor/location', authenticateToken, async (req, res) => {
    try {
        const { date } = req.query;
        let query = {};
        
        // If supervisor, only show their own logs
        if (req.user.role === 'supervisor') {
            query.supervisorId = req.user.userId;
        }

        if (date) {
            const start = new Date(date);
            const end = new Date(date);
            end.setDate(end.getDate() + 1);
            query.timestamp = { $gte: start, $lt: end };
        }
        const logs = await LocationLog.find(query).sort({ timestamp: -1 });
        res.json(logs);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Supervisor Login
app.post('/api/supervisor/login', async (req, res) => {
    try {
        const { username, password, deviceId, deviceName } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Username and password required" });

        const cleanUser = username.trim();
        const cleanPass = password.trim().toLowerCase().replace(/\s/g, '');

        // Find site by username (Case Insensitive)
        const escapedUser = escapeRegex(cleanUser);
        const site = await Site.findOne({ username: { $regex: new RegExp(`^${escapedUser}$`, 'i') } });
        
        if (!site) {
            return res.status(401).json({ error: "Invalid Username" });
        }

        // Check password (case insensitive, ignore spaces)
        const dbPass = (site.password || 'ambe123').toLowerCase().replace(/\s/g, '');
        
        if (cleanPass === dbPass) {
            // Device Binding Check
            if (deviceId) {
                // STRICT BINDING REMOVED: Allow multiple devices as per user request
                // We update this to track the last active device, but we don't block others.
                site.deviceId = deviceId;
                site.deviceName = deviceName || 'Unknown Android Device';
                await site.save();
            }

            const userData = {
                userId: `sup-${site.id}`,
                name: `${site.name} Supervisor`,
                email: `${cleanUser}@ambeservice.com`,
                role: 'supervisor',
                assignedSites: [site.id]
            };

            // Generate JWT for supervisor
            const token = jwt.sign(
                { userId: userData.userId, role: userData.role, email: userData.email },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '24h' }
            );

            // Set HTTP-only cookie
            res.cookie('authToken', token, {
                httpOnly: true,
                secure: false, // Set to true in production
                sameSite: 'lax',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });

            return res.json({ ...userData, token });
        } else {
            return res.status(401).json({ error: "Invalid Password" });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Revoke Supervisor Device (Admin Only)
app.post('/api/supervisor/revoke-device', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const { siteId } = req.body;
        const site = await Site.findOne({ id: siteId });
        
        if (!site) return res.status(404).json({ error: "Site not found" });

        site.deviceId = null;
        site.deviceName = null;
        await site.save();

        res.json({ success: true, message: "Device binding revoked successfully" });
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
  const PORT = process.env.PORT || 3002; // Changed to 3002 to avoid conflicts
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Accessible at http://localhost:${PORT}`);
    console.log(`Accessible at http://127.0.0.1:${PORT}`);
    // console.log(`Accessible at http://<YOUR_LAN_IP>:${PORT}`);
  });
}

module.exports = app;
})();
