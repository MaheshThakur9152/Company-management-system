// Lightweight server bootstrap that imports the express `app` configured in `src/app.js` and starts HTTP/SOCKET server.
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const connectToDatabase = require('../utils/db');
const http = require('http');
const { Server } = require('socket.io');
const app = require('../app');

// Local helpers & models used by API routes below
const upload = require('../middleware/upload');
const { uploadBufferToCloudinary } = require('../utils/cloudinaryHelper');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const Site = require('../models/Site');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const LedgerEntry = require('../models/LedgerEntry');
const SalaryRecord = require('../models/SalaryRecord');
const LocationLog = require('../models/LocationLog');
const JobRole = require('../models/JobRole');

(async () => {
  await connectToDatabase();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:5173/',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
        'https://ambeservice.com',
        'https://admin.ambeservice.com',
        'https://admin.ambeservice.com/'
      ],
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    socket.on('join_site', (siteId) => {
      socket.join(siteId);
      console.log(`User ${socket.id} joined site: ${siteId}`);
    });
    socket.on('disconnect', () => console.log('User disconnected:', socket.id));
  });

  // Attendance sync endpoint (accepts JSON array of records)
  const { createLimiter } = require('../middleware/rateLimiter');

  // Helper for base64 uploads with idempotent hashing
  const crypto = require('crypto');
  async function uploadBase64ToCloudinary(base64String, folder) {
    try {
      const data = (typeof base64String === 'string' && base64String.startsWith('data:'))
        ? base64String.substring(base64String.indexOf(',') + 1)
        : base64String;
      const hash = crypto.createHash('sha1').update(data).digest('hex');
      const publicId = `${folder}/${hash}`;
      try {
        const existing = await cloudinary.api.resource(publicId, { resource_type: 'image' });
        if (existing && existing.secure_url) return { secure_url: existing.secure_url, public_id: existing.public_id };
      } catch (e) {
        if (e && e.http_code && e.http_code !== 404) console.error('Cloudinary resource check failed:', e);
      }
      const uploadResponse = await cloudinary.uploader.upload(base64String, { public_id: publicId, resource_type: 'image', format: 'png', overwrite: false });
      return { secure_url: uploadResponse.secure_url, public_id: uploadResponse.public_id };
    } catch (err) {
      console.error('uploadBase64ToCloudinary failed', err);
      return null;
    }
  }

  const attendanceLimiter = createLimiter({ windowMs: 60 * 1000, max: 60, message: 'Too many attendance syncs, slow down.' });
  app.post('/api/attendance/sync', attendanceLimiter, async (req, res) => {
    try {
      const records = req.body;
      const bulkOps = [];
      const errors = [];
      const insertedRecords = [];
      for (const record of records) {
        const existingRecord = await mongoose.model('Attendance').findOne({ employeeId: record.employeeId, date: record.date });
        if (existingRecord) { errors.push({ employeeId: record.employeeId, error: 'Attendance already marked for this date.' }); continue; }
        if (!record.siteId) {
          const emp = await mongoose.model('Employee').findOne({ id: record.employeeId });
          if (emp) record.siteId = emp.siteId;
        }
        if (record.photoUrl && record.photoUrl.startsWith('data:image')) {
          const uploadResult = await uploadBase64ToCloudinary(record.photoUrl, 'ambe_attendance');
          if (uploadResult) record.photoUrl = uploadResult.secure_url;
        }
        const prepared = { ...record, isSynced: true, isLocked: true };
        bulkOps.push({ insertOne: { document: prepared } });
        insertedRecords.push(prepared);
      }
      let result = { insertedCount: 0 };
      if (bulkOps.length > 0) {
        try { result = await mongoose.model('Attendance').bulkWrite(bulkOps, { ordered: false }); }
        catch (err) { if (err.code === 11000 || err.writeErrors) { result = { insertedCount: err.result.nInserted }; } else { throw err; } }
        if (insertedRecords.length > 0) {
          const grouped = insertedRecords.reduce((acc, r) => { const sid = r.siteId || 'unknown'; acc[sid] = acc[sid] || []; acc[sid].push(r); return acc; }, {});
          for (const sid of Object.keys(grouped)) io.to(sid).emit('attendance_update', { message: 'New attendance synced', count: grouped[sid].length, records: grouped[sid] });
        }
      }
      res.json({ success: true, syncedCount: result.insertedCount || 0, errors });
    } catch (e) { console.error('attendance sync error', e); res.status(500).json({ error: e.message }); }
  });

  // --- Attendance emit batching to reduce socket churn ---
  const ATTENDANCE_EMIT_BATCH_MS = parseInt(process.env.ATTENDANCE_EMIT_BATCH_MS || '1000', 10);
  const attendanceEmitQueue = {}; // { [siteId]: { timer: NodeJS.Timeout|null, records: AttendanceRecord[] } }

  function scheduleAttendanceEmit(siteId, recordsToAdd) {
    try {
      if (!siteId) return;
      if (!attendanceEmitQueue[siteId]) attendanceEmitQueue[siteId] = { timer: null, records: [] };
      attendanceEmitQueue[siteId].records.push(...recordsToAdd);
      // If a timer is not already running, schedule one
      if (!attendanceEmitQueue[siteId].timer) {
        attendanceEmitQueue[siteId].timer = setTimeout(() => {
          const batch = attendanceEmitQueue[siteId].records.splice(0);
          attendanceEmitQueue[siteId].timer = null;
          try {
            io.to(siteId).emit('attendance_update', { message: 'New attendance synced (batched)', count: batch.length, records: batch });
            console.log(`Batched attendance emit for site ${siteId}, count ${batch.length}`);
          } catch (err) { console.error('Failed to emit batched attendance_update', err); }
        }, ATTENDANCE_EMIT_BATCH_MS);
      }
    } catch (err) { console.error('scheduleAttendanceEmit error', err); }
  }

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

  // Note: basic middleware (cookieParser, cors, json parser) is configured in `src/app.js`
  // Avoid re-applying here to prevent duplication and undefined references.


  // --- Routes ---

  // Health Check
  app.get('/', (req, res) => {
    res.send('Ambe Backend is running!');
  });

  // View Image
  app.get('/api/view/image/*', (req, res) => {
    try {
      let publicId = req.params[0];
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'di9eeahdy';
      if (!cloudName) return res.status(500).json({ error: "Cloudinary config missing" });
      if (publicId) {
        if (publicId.startsWith('/')) publicId = publicId.substring(1);
        publicId = publicId.trim();
      }
      const viewUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
      return res.redirect(viewUrl);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to generate view URL' });
    }
  });

  // Download Image
  app.get('/api/download/image/*', (req, res) => {
    try {
      let publicId = req.params[0];
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'di9eeahdy';
      if (!cloudName) return res.status(500).json({ error: "Cloudinary configuration missing" });
      if (publicId) {
        if (publicId.startsWith('/')) publicId = publicId.substring(1);
        publicId = publicId.trim();
      }
      const downloadUrl = `https://res.cloudinary.com/${cloudName}/image/upload/fl_attachment/${publicId}`;
      return res.redirect(downloadUrl);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to generate download URL' });
    }
  });

  // Sites
  app.get('/api/sites', async (req, res) => {
    try {
      const sites = await Site.find({}).sort({ name: 1 });
      res.json(sites);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/sites', async (req, res) => {
    try {
      const site = new Site(req.body);
      await site.save();
      io.emit('data_update', { type: 'sites' });
      res.json(site);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/sites/:id', async (req, res) => {
    try {
      const site = await Site.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
      io.emit('data_update', { type: 'sites' });
      res.json(site);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Employees
  app.get('/api/employees', async (req, res) => {
    try {
      const { site, sort, order } = req.query;
      let query = {};
      if (site) query.siteId = site;
      let sortOptions = {};
      if (sort) {
        sortOptions[sort] = order === 'desc' ? -1 : 1;
      } else {
        sortOptions.name = 1;
      }
      const employees = await Employee.find(query).sort(sortOptions);
      res.json(employees);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/employees', upload.single('photo'), async (req, res) => {
    try {
      const employeeData = { ...req.body };
      // If photo was uploaded as multipart/form-data
      if (req.file) {
        try {
          const result = await uploadBufferToCloudinary(req.file.buffer, 'ambe_employees');
          if (result) employeeData.photoUrl = result.secure_url;
        } catch (err) {
          console.error('Cloudinary upload failed:', err);
        }
      } else if (employeeData.photoUrl && employeeData.photoUrl.startsWith('data:image')) {
        const uploadResult = await uploadToCloudinary(employeeData.photoUrl, 'ambe_employees');
        if (uploadResult) employeeData.photoUrl = uploadResult.secure_url;
      }
      const employee = new Employee(employeeData);
      await employee.save();
      io.emit('data_update', { type: 'employees' });
      res.json(employee);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/employees/:id', upload.single('photo'), async (req, res) => {
    try {
      const employeeData = { ...req.body };
      if (req.file) {
        try {
          const result = await uploadBufferToCloudinary(req.file.buffer, 'ambe_employees');
          if (result) employeeData.photoUrl = result.secure_url;
        } catch (err) {
          console.error('Cloudinary upload failed:', err);
        }
      } else if (employeeData.photoUrl && employeeData.photoUrl.startsWith('data:image')) {
        const uploadResult = await uploadToCloudinary(employeeData.photoUrl, 'ambe_employees');
        if (uploadResult) employeeData.photoUrl = uploadResult.secure_url;
      }
      const employee = await Employee.findOneAndUpdate({ id: req.params.id }, employeeData, { new: true });
      io.emit('data_update', { type: 'employees' });
      res.json(employee);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Upload multiple images (multipart/form-data) and get back URLs
  app.post('/api/uploads/images', upload.array('photos', 100), async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
      const uploaded = [];
      for (const file of req.files) {
        try {
          const result = await uploadBufferToCloudinary(file.buffer, 'ambe_uploads');
          uploaded.push({ originalName: file.originalname, url: result.secure_url, public_id: result.public_id });
        } catch (err) {
          uploaded.push({ originalName: file.originalname, error: err.message });
        }
      }
      res.json({ uploaded });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Job Roles
  app.get('/api/roles', async (req, res) => {
    try {
      const roles = await JobRole.find({}).sort({ name: 1 });
      res.json(roles);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/roles', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name) return res.status(400).json({ error: "Role name is required" });
      const existing = await JobRole.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
      if (existing) return res.status(400).json({ error: "Role already exists" });
      const role = new JobRole({ name });
      await role.save();
      res.json(role);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Attendance
  app.get('/api/attendance', async (req, res) => {
    try {
      const { sort, order, site, employee, month, year, updatedAfter } = req.query;
      let query = {};
      let sortOptions = {};
      if (site) query.siteId = site;
      if (employee) query.employeeId = employee;
      if (month && year) {
        const m = month.toString().padStart(2, '0');
        query.date = { $regex: `^${year}-${m}` };
      }
      if (updatedAfter) {
        query.updatedAt = { $gt: new Date(updatedAfter) };
      }
      if (sort) {
        sortOptions[sort] = order === 'desc' ? -1 : 1;
      } else {
        sortOptions.date = -1;
      }
      const attendance = await Attendance.find(query).sort(sortOptions);
      res.json(attendance);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/attendance/sync', async (req, res) => {
    try {
      const records = req.body;
      const bulkOps = [];
      const errors = [];
      const insertedRecords = [];
      for (const record of records) {
        const existingRecord = await Attendance.findOne({ employeeId: record.employeeId, date: record.date });
        if (existingRecord) {
          errors.push({ employeeId: record.employeeId, error: "Attendance already marked for this date." });
          continue;
        }
        if (!record.siteId) {
          const emp = await Employee.findOne({ id: record.employeeId });
          if (emp) record.siteId = emp.siteId;
        }
        if (record.photoUrl && record.photoUrl.startsWith('data:image')) {
          const uploadResult = await uploadToCloudinary(record.photoUrl, 'ambe_attendance');
          if (uploadResult) record.photoUrl = uploadResult.secure_url;
        }
        const prepared = { ...record, isSynced: true, isLocked: true };
        bulkOps.push({ insertOne: { document: prepared } });
        insertedRecords.push(prepared);
      }
      let result = { insertedCount: 0 };
      if (bulkOps.length > 0) {
        try {
          result = await Attendance.bulkWrite(bulkOps, { ordered: false });
        } catch (err) {
          if (err.code === 11000 || err.writeErrors) {
            result = { insertedCount: err.result.nInserted };
          } else { throw err; }
        }
        // Emit inserted records grouped by site so clients can apply them without refetching
        if (insertedRecords.length > 0) {
          const grouped = insertedRecords.reduce((acc, r) => {
            const sid = r.siteId || 'unknown';
            acc[sid] = acc[sid] || [];
            acc[sid].push(r);
            return acc;
          }, {});
          for (const sid of Object.keys(grouped)) {
            // Schedule a batched emit to avoid too many socket events in high-throughput scenarios
            scheduleAttendanceEmit(sid, grouped[sid]);
          }
        }
      }
      res.json({ success: true, syncedCount: result.insertedCount || 0, errors });
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

  // Ledger
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

  // Salary Records
  app.get('/api/salary-records', async (req, res) => {
    try {
      const records = await SalaryRecord.find({});
      res.json(records);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.put('/api/salary-records/:id', async (req, res) => {
    try {
      const record = await SalaryRecord.findOneAndUpdate({ id: req.params.id }, req.body, { new: true, upsert: true });
      res.json(record);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Auth
  const sendOtpEmail = async (user, otp) => {
    const apiKey = process.env.BREVO_API_KEY;
    try {
      let targetEmail = user.email;
      if (user.userId === 'nandani') targetEmail = 'ambeservices.nandani@gmail.com';
      else if (user.userId === 'ambe') targetEmail = process.env.TEST_EMAIL_RECIPIENT || 'maheshthakurharishankar@gmail.com';

      if (apiKey && apiKey.startsWith('xsmtpsib-')) {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
          port: process.env.EMAIL_PORT || 587,
          auth: { user: process.env.EMAIL_USER, pass: apiKey }
        });
        await transporter.sendMail({
          from: `"${process.env.EMAIL_FROM_NAME || 'Ambe Service'}" <${process.env.EMAIL_FROM || 'media@ambeservice.com'}>`,
          to: targetEmail,
          subject: "Ambe Service Login OTP",
          html: `<div style="text-align:center;"><h1>Ambe Service</h1><p>Hello ${user.name},</p><p>Your OTP is:</p><h2 style="font-size:32px;letter-spacing:5px;">${otp}</h2><p>Valid for 10 minutes.</p></div>`
        });
        return;
      }

      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: 'Ambe Service', email: process.env.EMAIL_FROM || 'media@ambeservice.com' },
        to: [{ email: targetEmail, name: user.name }],
        subject: 'Ambe Service Login OTP',
        htmlContent: `<div style="text-align:center;"><h1>Ambe Service</h1><p>Hello ${user.name},</p><p>Your OTP is:</p><h2 style="font-size:32px;letter-spacing:5px;">${otp}</h2><p>Valid for 10 minutes.</p></div>`
      }, { headers: { 'api-key': apiKey, 'Content-Type': 'application/json' } });
    } catch (err) { console.error("Failed to send email", err.message); }
  };

  // Refresh token configuration and helpers
  const REFRESH_TOKEN_DAYS = parseInt(process.env.REFRESH_TOKEN_DAYS || '30', 10);

  function generateRefreshToken() {
    const token = crypto.randomBytes(64).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    return { token, hash };
  }

  async function addRefreshTokenForUser(user, tokenHash, deviceId) {
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
    user.refreshTokens = user.refreshTokens || [];
    user.refreshTokens.push({ tokenHash, deviceId: deviceId || 'web', createdAt: new Date(), expiresAt });
    // Keep only last 10 tokens
    if (user.refreshTokens.length > 10) user.refreshTokens.shift();
    await user.save();
    return expiresAt;
  }

  function setAuthCookie(res, token) {
    res.cookie('authToken', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
  }

  function setRefreshCookie(res, tokenPlain) {
    res.cookie('refreshToken', tokenPlain, { httpOnly: true, maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000, sameSite: 'lax' });
  }

  function escapeRegex(string) { return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  app.post('/api/auth/send-otp', async (req, res) => {
    try {
      const { username, deviceId } = req.body;
      const regex = new RegExp(`^${escapeRegex(username.trim())}$`, 'i');
      let user = await User.findOne({ $or: [{ userId: { $regex: regex } }, { email: { $regex: regex } }] });
      if (!user && username.toLowerCase() === 'nandani') {
        user = new User({ userId: 'nandani', name: 'Nandani', role: 'superadmin', email: 'ambeservices.nandani@gmail.com' });
      }
      if (!user) return res.status(400).json({ error: "User not found" });

      // If this device is already trusted for the user, issue tokens and skip OTP
      if (deviceId && Array.isArray(user.trustedDevices) && user.trustedDevices.includes(deviceId)) {
        const token = jwt.sign({ userId: user.userId, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
        const { token: refreshPlain, hash: refreshHash } = generateRefreshToken();
        await addRefreshTokenForUser(user, refreshHash, deviceId);
        setAuthCookie(res, token);
        setRefreshCookie(res, refreshPlain);
        const safeUser = { ...user.toObject() };
        delete safeUser.otp; delete safeUser.otpExpires; delete safeUser.refreshTokens; delete safeUser.password;
        return res.json({ success: true, message: 'Device trusted. Logged in.', ...safeUser, token });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`Generated OTP for ${user.userId || user.email}: ${otp}`);
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOtpEmail(user, otp);
      res.json({ success: true, message: "OTP sent" });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/auth/verify-otp', async (req, res) => {
    try {
      const { username, otp, deviceId, rememberDevice = true } = req.body;
      const regex = new RegExp(`^${escapeRegex(username.trim())}$`, 'i');
      const user = await User.findOne({ $or: [{ userId: { $regex: regex } }, { email: { $regex: regex } }] });
      if (!user || String(user.otp) !== String(otp) || user.otpExpires < Date.now()) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }

      // Clear OTP fields
      user.otp = null;
      user.otpExpires = null;

      // If client provided a deviceId and asked to remember it, add to trusted devices
      if (deviceId && rememberDevice) {
        user.trustedDevices = user.trustedDevices || [];
        if (!user.trustedDevices.includes(deviceId)) user.trustedDevices.push(deviceId);
      }

      // generate access token
      const token = jwt.sign({ userId: user.userId, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
      // generate refresh token and store hashed version in DB (link to device)
      const { token: refreshPlain, hash: refreshHash } = generateRefreshToken();
      await addRefreshTokenForUser(user, refreshHash, deviceId);

      // Set cookies
      setAuthCookie(res, token);
      setRefreshCookie(res, refreshPlain);

      await user.save();
      // Return user without sensitive fields
      const safeUser = { ...user.toObject() };
      delete safeUser.otp;
      delete safeUser.otpExpires;
      delete safeUser.refreshTokens;
      delete safeUser.password;
      res.json({ ...safeUser, token });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Refresh access token using refresh token cookie (rotates refresh token)
  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const refreshPlain = req.cookies.refreshToken;
      if (!refreshPlain) return res.status(401).json({ error: 'No refresh token' });
      const hash = crypto.createHash('sha256').update(refreshPlain).digest('hex');
      const user = await User.findOne({ 'refreshTokens.tokenHash': hash });
      if (!user) return res.status(401).json({ error: 'Invalid refresh token' });
      const tokenEntry = user.refreshTokens.find(t => t.tokenHash === hash && t.expiresAt && t.expiresAt > new Date());
      if (!tokenEntry) return res.status(401).json({ error: 'Expired or invalid refresh token' });

      // rotate refresh token
      const { token: newRefreshPlain, hash: newHash } = generateRefreshToken();
      tokenEntry.tokenHash = newHash;
      tokenEntry.createdAt = new Date();
      tokenEntry.expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
      await user.save();

      const accessToken = jwt.sign({ userId: user.userId, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
      setAuthCookie(res, accessToken);
      setRefreshCookie(res, newRefreshPlain);

      res.json({ success: true, token: accessToken });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Logout and revoke refresh token
  app.post('/api/auth/logout', async (req, res) => {
    try {
      const refreshPlain = req.cookies.refreshToken;
      if (refreshPlain) {
        const hash = crypto.createHash('sha256').update(refreshPlain).digest('hex');
        await User.updateOne({ 'refreshTokens.tokenHash': hash }, { $pull: { refreshTokens: { tokenHash: hash } } });
      }
      res.clearCookie('authToken');
      res.clearCookie('refreshToken');
      res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/login', async (req, res) => {
    const { email, password, deviceId } = req.body;
    if (mongoose.connection.readyState !== 1) {
      if (email === 'ambe' || email === 'admin@ambeservice.com') {
        return res.json({ userId: 'ambe', name: 'Ambe Admin (Offline)', role: 'admin', token: 'mock-token' });
      }
      return res.status(503).json({ error: 'Database not connected' });
    }
    try {
      const regex = new RegExp(`^${escapeRegex(email.trim())}$`, 'i');
      let user = await User.findOne({ $or: [{ email: { $regex: regex } }, { userId: { $regex: regex } }] });
      if (user && user.password === password) {
        // If deviceId provided and trusted, skip OTP and issue tokens
        if (deviceId && Array.isArray(user.trustedDevices) && user.trustedDevices.includes(deviceId)) {
          const token = jwt.sign({ userId: user.userId, role: user.role }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
          const { token: refreshPlain, hash: refreshHash } = generateRefreshToken();
          await addRefreshTokenForUser(user, refreshHash, deviceId);
          setAuthCookie(res, token);
          setRefreshCookie(res, refreshPlain);
          const safeUser = { ...user.toObject() };
          delete safeUser.password; delete safeUser.refreshTokens; delete safeUser.otp; delete safeUser.otpExpires;
          return res.json({ success: true, message: 'Logged in', ...safeUser, token });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`Login OTP for ${user.userId || user.email}: ${otp}`);
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();
        await sendOtpEmail(user, otp);
        return res.json({ requireOtp: true, userId: user.userId });
      }
      res.status(401).json({ error: 'Invalid credentials' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
      const user = await User.findOne({ userId: req.user.userId });
      res.json(user);
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/seed', async (req, res) => {
    try {
      const { MOCK_SITES, MOCK_EMPLOYEES, MOCK_INVOICES } = require('../scripts/seedData');
      await Site.deleteMany({});
      await Employee.deleteMany({});
      await Invoice.deleteMany({});
      await Site.insertMany(MOCK_SITES);
      await Employee.insertMany(MOCK_EMPLOYEES);
      await Invoice.insertMany(MOCK_INVOICES);
      res.json({ message: "Seeded successfully" });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  const PORT = process.env.PORT || 3002;

  // Graceful server error handling to avoid nodemon tight-restart loops when port is occupied
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Kill the process using that port or set a different PORT env var.`);
      // Exit with non-zero so process managers / nodemon know it failed and don't leave stray state
      process.exit(1);
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Ensure the process exits cleanly on SIGINT/SIGTERM
  process.on('SIGINT', () => {
    console.log('SIGINT received, closing server...');
    server.close(() => process.exit(0));
  });
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => process.exit(0));
  });
})();
