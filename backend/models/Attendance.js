const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, required: true }, // P, A, HD, etc.
  checkInTime: String,
  checkOutTime: String,
  type: { type: String, enum: ['IN', 'OUT'], default: 'IN' },
  deviceId: String,
  photoUrl: String,
  location: {
    lat: Number,
    lng: Number,
    address: String
  },
  isSynced: { type: Boolean, default: true },
  isLocked: { type: Boolean, default: false },
  remarks: String,
  overtimeHours: Number,
  supervisorName: String, // Name of the supervisor who logged this
  siteId: String // Added siteId for filtering
}, { timestamps: true });

// Compound index to ensure one record per employee per day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
