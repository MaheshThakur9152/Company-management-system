const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  invoiceNo: { type: String, required: true, unique: true },
  siteId: { type: String, required: true },
  siteName: String,
  billingPeriod: String,
  items: [{
    id: String,
    description: String,
    hsn: String,
    rate: Number,
    days: Number,
    persons: Number,
    amount: Number
  }],
  subTotal: Number,
  managementRate: Number,
  managementAmount: Number,
  materialCharges: Number,
  taxableAmount: Number,
  cgst: Number,
  sgst: Number,
  amount: Number,
  status: { type: String, enum: ['Paid', 'Unpaid', 'Approved', 'Pending Approval', 'Pending Payment'], default: 'Unpaid' },
  dueDate: String,
  generatedDate: String,
  paymentDate: String
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
