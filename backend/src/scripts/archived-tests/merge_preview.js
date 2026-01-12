require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Site = require('../models/Site');
(async()=>{
  await mongoose.connect(process.env.MONGODB_URI);
  const inv = await Invoice.findById('17674609729560.107031558931179');
  console.log('invoice.raw client:', inv.client, 'client_name:', inv.client_name, 'siteName:', inv.siteName);
  const s = await Site.findOne({ id: inv.siteId }) || await Site.findOne({ name: /sanjay/i });
  console.log('site doc sample:', s?{clientName:s.clientName, companyName:s.companyName, name:s.name, location:s.location, clientGstin:s.clientGstin}: 'site not found');
  const invoiceData = inv.toObject ? inv.toObject() : inv;
  if (s) {
    const so = s.toObject();
    invoiceData.site = so;
    invoiceData.client = invoiceData.client || {};
    invoiceData.client.name = so.clientName || so.companyName || invoiceData.client.name || so.name || invoiceData.siteName;
    invoiceData.client.address = so.location || invoiceData.client.address || invoiceData.client_address || invoiceData.site_location;
    invoiceData.client.gstin = so.clientGstin || invoiceData.client.gstin || invoiceData.client_gstin;
  }
  console.log('merged client:', invoiceData.client);
  process.exit(0);
})();