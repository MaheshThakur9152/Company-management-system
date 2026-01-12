require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Site = require('../models/Site');
const { createInvoiceWorkbook } = require('../billGenerator');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { maxPoolSize: 5 });
    const invId = process.argv[2] || '17674609729560.107031558931179';
    let inv = null;
    try {
      inv = await Invoice.findById(invId).lean();
    } catch (e) {
      // ignore cast errors
    }
    if (!inv) {
      // try invoiceNo fallback
      inv = await Invoice.findOne({ invoiceNo: invId }).lean();
    }
    if (!inv) {
      // try id in other fields
      inv = await Invoice.findOne({ id: invId }).lean();
    }
    if (!inv) { console.error('Invoice not found', invId); process.exit(2); }

    let site = null;
    if (inv.siteId) site = await Site.findOne({ id: inv.siteId }).lean();
    if (!site && inv.siteName) site = await Site.findOne({ name: new RegExp(`^${inv.siteName.trim().replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}$`, 'i') }).lean();

    const invoiceData = { ...inv };
    if (site) invoiceData.site = site;

    const workbook = await createInvoiceWorkbook(invoiceData);
    const ws = workbook.getWorksheet('SHREEYA') || workbook.worksheets[0];

    const a8 = ws.getCell('A8').value || '';
    const a9 = ws.getCell('A9').value || '';
    const b9 = ws.getCell('B9').value || '';
    const a11 = ws.getCell('A11').value || '';

    console.log('A8 length:', (a8 && a8.toString().length) || 0);
    console.log('A9 length:', (a9 && a9.toString().length) || 0);
    console.log('B9 length:', (b9 && b9.toString().length) || 0);
    console.log('A11 length:', (a11 && a11.toString().length) || 0);

    const out = '/home/mahesh/Company-management-system/frontend/public/go.xlsx';
    await workbook.xlsx.writeFile(out);
    console.log('Wrote to', out);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.message);
    process.exit(1);
  }
})();