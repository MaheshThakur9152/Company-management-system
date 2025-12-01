const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['supervisor', 'admin', 'boss', 'superadmin'], required: true },
  assignedSites: [String],
  email: { type: String, required: true, unique: true },
  password: { type: String }, // In a real app, this should be hashed
  otp: { type: String },
  otpExpires: { type: Date },
  trustedDevices: { type: [String], default: [] }, // Array of device IDs
  photoUrl: { type: String } // Profile Photo
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
