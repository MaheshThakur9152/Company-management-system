const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  biometricCode: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, default: 'Janitor' },
  siteId: { type: String, required: true },
  photoUrl: String,
  weeklyOff: { type: String, default: 'Sunday' },
  status: { type: String, enum: ['Active', 'Inactive', 'Pending', 'Deleted'], default: 'Active' },
  joiningDate: String,
  aadharNumber: String,
  panNumber: String,
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    branchName: String
  },
  salaryDetails: {
    baseSalary: Number,
    isDailyRated: Boolean,
    dailyRateOverride: Number,
    deductionBreakdown: {
      advance: Number,
      uniform: Number,
      shoes: Number,
      idCard: Number,
      cbre: Number,
      others: Number
    },
    allowancesBreakdown: {
      travelling: Number,
      others: Number
    },
    basic: Number,
    hra: Number,
    conveyance: Number,
    allowances: Number,
    deductions: Number,
    netSalary: Number,
    paymentType: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Employee', EmployeeSchema);
