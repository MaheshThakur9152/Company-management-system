const mongoose = require('mongoose');

const salaryRecordSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  month: { type: Number, required: true },
  year: { type: Number, required: true },
  netSalary: { type: Number, required: true },
  grossSalary: { type: Number },
  totalDeductions: { type: Number },
  breakdown: { type: Object }, // Stores the snapshot of calculations
  status: { type: String, enum: ['Paid', 'Unpaid'], default: 'Unpaid' },
  paymentDate: { type: String },
  complianceStatus: { type: String, enum: ['Compliant', 'Non-Compliant', 'Pending'], default: 'Pending' },
  complianceRemarks: { type: String }
});

module.exports = mongoose.model('SalaryRecord', salaryRecordSchema);
