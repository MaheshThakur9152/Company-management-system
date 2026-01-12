require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Site = require('../models/Site');
const { createInvoiceWorkbook } = require('../billGenerator');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 5 });

    // try to find an invoice referencing Ruparel / Elara
    let inv = await Invoice.findOne({ $or: [ { siteName: /Ruparel|Elara/i }, { 'client.name': /Ruparel|Elara/i }, { invoiceNo: /elara/i } ] }).lean();

    let site = null;

    if (!inv) {
      // try to find a Site
      site = await Site.findOne({ name: /Ruparel|Elara/i }).lean();
      if (site) {
        // create a sample invoice object
        inv = {
          invoiceNo: 'ELARA-TEST-01',
          date: new Date().toISOString(),
          billingPeriod: '1st to 30th November 2025',
          siteName: site.name,
          siteId: site.id,
          items: [ { description: 'Security Guards', hsn: 9985, rate: 12000, working_days: 30, persons: 2 } ]
        };
        inv.site = site;
      }
    } else {
      // if invoice found, try to attach site
      if (inv.siteId) site = await Site.findOne({ id: inv.siteId }).lean();
      if (!site && inv.siteName) site = await Site.findOne({ name: new RegExp(`^${inv.siteName.trim().replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}$`, 'i') }).lean();
      if (site) inv.site = site;
    }

    if (!inv) {
      // No site/invoice found: build a small sample using known Ruparel Elara address
      inv = {
        invoiceNo: 'ELARA-SAMPLE-01',
        date: new Date().toISOString(),
        billingPeriod: '1st to 30th November 2025',
        client_name: 'Ruparel Elara',
        client_address: 'Ruparel Elara, Ekta Nagar, New Link Road, Mumbai 400089, India',
        client_gstin: '',
        items: [ { description: 'Security Guards', hsn: 9985, rate: 15000, working_days: 30, persons: 2 } ]
      };
    }

    const workbook = await createInvoiceWorkbook(inv);
    const out = '/home/mahesh/Company-management-system/frontend/public/elara.xlsx';
    await workbook.xlsx.writeFile(out);
    console.log('Wrote elara.xlsx to', out);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.message);
    process.exit(1);
  }
})();