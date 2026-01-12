require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const inv = await Invoice.findById('17674609729560.107031558931179');
  if (!inv) { console.log('Invoice not found'); process.exit(1); }
  console.log('invoice invoiceNo:', inv.invoiceNo);
  console.log('invoice siteId:', inv.siteId);
  console.log('invoice siteName:', inv.siteName);
  console.log('invoice client field (raw):', inv.client);
  console.log('client_name:', inv.client_name);
  process.exit(0);
})();