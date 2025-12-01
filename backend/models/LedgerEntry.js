const mongoose = require('mongoose');

const ledgerEntrySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  siteId: { type: String, required: true },
  date: { type: String, required: true },
  particulars: { type: String, required: true },
  vchType: { type: String, required: true },
  vchNo: { type: String, required: true },
  debit: { type: Number, default: 0 },
  credit: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
});

module.exports = mongoose.model('LedgerEntry', ledgerEntrySchema);
