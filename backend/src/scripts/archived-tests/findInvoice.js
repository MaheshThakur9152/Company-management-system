require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const connectToDatabase = require('../utils/db');
const Invoice = require('../models/Invoice');

(async () => {
  await connectToDatabase();
  // Search strategies: client name in 'siteName' or invoice fields, and billingPeriod contains 'Nov' or 'November' and 2025
  const nameRegex = /sanjay\s*puri/i;
  const periodRegex = /nov(ember)?\s*2025/i;

  const bySiteName = await Invoice.find({ siteName: { $regex: nameRegex } }).limit(10);
  const byClientName = await Invoice.find({ 'client.name': { $regex: nameRegex } }).limit(10);
  const byBillingPeriod = await Invoice.find({ billingPeriod: { $regex: periodRegex } }).limit(20);

  console.log('Matches by siteName:', bySiteName.map(i => ({ id: i.id || i._id, invoiceNo: i.invoiceNo, siteName: i.siteName, billingPeriod: i.billingPeriod })));
  console.log('Matches by client.name:', byClientName.map(i => ({ id: i.id || i._id, invoiceNo: i.invoiceNo, siteName: i.siteName, billingPeriod: i.billingPeriod })));
  console.log('Matches by billingPeriod:', byBillingPeriod.map(i => ({ id: i.id || i._id, invoiceNo: i.invoiceNo, siteName: i.siteName, billingPeriod: i.billingPeriod })));

  // Also try searching descriptions for 'Sanjay'
  const byItems = await Invoice.find({ 'items.description': { $regex: /sanjay/i } }).limit(20);
  console.log('Matches by item description:', byItems.map(i => ({ id: i.id || i._id, invoiceNo: i.invoiceNo, siteName: i.siteName, billingPeriod: i.billingPeriod })));

  process.exit(0);
})();
