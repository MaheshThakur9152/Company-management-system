const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  status: { type: String, required: true }, // P, A, HD, etc.
  checkInTime: String,
  photoUrl: String,
  location: {
    lat: Number,
    lng: Number
  },
  isSynced: { type: Boolean, default: true },
  isLocked: { type: Boolean, default: false },
  remarks: String,
  overtimeHours: Number
}, { timestamps: true });

// Compound index to ensure one record per employee per day
AttendanceSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
