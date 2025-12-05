const mongoose = require('mongoose');

const locationLogSchema = new mongoose.Schema({
  supervisorId: { type: String, required: true },
  supervisorName: { type: String, required: true },
  siteId: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  status: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LocationLog', locationLogSchema);
