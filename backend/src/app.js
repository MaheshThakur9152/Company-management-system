const express = require('express');
const cors = require('cors');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const cookieParser = require('cookie-parser');

// Models
const Site = require('./models/Site');
const Employee = require('./models/Employee');
const Attendance = require('./models/Attendance');
const Invoice = require('./models/Invoice');
const User = require('./models/User');
const LedgerEntry = require('./models/LedgerEntry');
const SalaryRecord = require('./models/SalaryRecord');
const LocationLog = require('./models/LocationLog');
const JobRole = require('./models/JobRole');

// Upload middleware and helpers
const upload = require('./middleware/upload');
const { uploadBufferToCloudinary } = require('./utils/cloudinaryHelper');
const { createLimiter } = require('./middleware/rateLimiter');

// Configure Cloudinary (will use env vars)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

app.set('trust proxy', 1); // Trust first proxy (required for express-rate-limit behind proxy)

// Debug middleware: log requests that include X-Forwarded-For so we can see
// which clients send that header and what the app trust proxy setting is.
app.use((req, res, next) => {
  if (req.headers['x-forwarded-for']) {
    console.warn('X-Forwarded-For header present:', req.headers['x-forwarded-for']);
    console.warn('app.get("trust proxy") =', req.app.get('trust proxy'), 'req.ip =', req.ip);
  }
  next();
});

// Temporary fix: sanitize suspicious forwarding headers if `trust proxy` is not set.
// This prevents express-rate-limit from throwing when a client erroneously sets
// X-Forwarded-For but the app isn't configured to trust proxies.
app.use((req, res, next) => {
  try {
    if (req.headers['x-forwarded-for'] && req.app.get('trust proxy') === false) {
      console.warn('Sanitizing X-Forwarded-For and related headers because trust proxy is false');
      delete req.headers['x-forwarded-for'];
      delete req.headers['forwarded'];
      delete req.headers['x-real-ip'];
    }
  } catch (err) {
    console.error('Header sanitization failed', err);
  }
  next();
});

app.use(cookieParser());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));

// Health Check
app.get('/', (req, res) => res.send('Ambe Backend is running!'));

// Image view/download routes preserved from original
app.get('/api/view/image/*', (req, res) => {
  try {
    let publicId = req.params[0];
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'di9eeahdy';
    if (!cloudName) return res.status(500).json({ error: 'Cloudinary config missing' });
    if (publicId) {
      if (publicId.startsWith('/')) publicId = publicId.substring(1);
      publicId = publicId.trim();
    }
    const viewUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;
    return res.redirect(viewUrl);
  } catch (error) { return res.status(500).json({ error: 'Failed to generate view URL' }); }
});

app.get('/api/download/image/*', (req, res) => {
  try {
    let publicId = req.params[0];
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'di9eeahdy';
    if (!cloudName) return res.status(500).json({ error: 'Cloudinary configuration missing' });
    if (publicId) {
      if (publicId.startsWith('/')) publicId = publicId.substring(1);
      publicId = publicId.trim();
    }
    const downloadUrl = `https://res.cloudinary.com/${cloudName}/image/upload/fl_attachment/${publicId}`;
    return res.redirect(downloadUrl);
  } catch (error) { return res.status(500).json({ error: 'Failed to generate download URL' }); }
});

// --- Routes (employees + uploads shown here) ---
app.get('/api/employees', async (req, res) => {
  try {
    const { site, sort, order } = req.query;
    let query = {};
    if (site) query.siteId = site;
    let sortOptions = {};
    if (sort) sortOptions[sort] = order === 'desc' ? -1 : 1;
    else sortOptions.name = 1;
    const employees = await Employee.find(query).sort(sortOptions);
    res.json(employees);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// single photo upload while creating employee
app.post('/api/employees', upload.single('photo'), async (req, res) => {
  try {
    const employeeData = { ...req.body };
    if (req.file) {
      try {
        const result = await uploadBufferToCloudinary(req.file.buffer, 'ambe_employees');
        if (result) employeeData.photoUrl = result.secure_url;
      } catch (err) { console.error('Cloudinary upload failed:', err); }
    } else if (employeeData.photoUrl && employeeData.photoUrl.startsWith('data:image')) {
      const uploadResult = await uploadToCloudinary(employeeData.photoUrl, 'ambe_employees');
      if (uploadResult) employeeData.photoUrl = uploadResult.secure_url;
    }
    const employee = new Employee(employeeData);
    await employee.save();
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
      } catch (err) { console.error('Cloudinary upload failed:', err); }
    } else if (employeeData.photoUrl && employeeData.photoUrl.startsWith('data:image')) {
      const uploadResult = await uploadToCloudinary(employeeData.photoUrl, 'ambe_employees');
      if (uploadResult) employeeData.photoUrl = uploadResult.secure_url;
    }
    const employee = await Employee.findOneAndUpdate({ id: req.params.id }, employeeData, { new: true });
    res.json(employee);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Upload multiple images with upload-specific rate-limiter
const uploadLimiter = createLimiter({ windowMs: 60 * 1000, max: 40, message: 'Too many uploads, slow down.' });
app.post('/api/uploads/images', uploadLimiter, upload.array('photos', 100), async (req, res) => {
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

// Voice AI Route
app.use('/api/voice', require('./api/voice'));

module.exports = app;
