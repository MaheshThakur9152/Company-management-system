const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  activeWorkers: { type: Number, default: 0 },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  geofenceRadius: { type: Number, default: 200 },
  clientName: String,
  clientGstin: String,
  clientEmail: String,
  clientContact: String,
  workOrderNo: String,
  workOrderDate: String,
  workOrderEndDate: String,
  billingRate: Number,
  companyName: String,
  username: { type: String, unique: true, sparse: true }, // Username for supervisor login
  password: { type: String, default: 'ambe123' }, // Password for supervisor login
  status: { type: String, enum: ['Active', 'Pending', 'Deleted'], default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Site', SiteSchema);
