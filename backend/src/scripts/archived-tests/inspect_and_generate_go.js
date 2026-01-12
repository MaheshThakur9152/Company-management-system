require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Site = require('../models/Site');
const { createInvoiceWorkbook } = require('../billGenerator');

(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const inv = await Invoice.findById('17674609729560.107031558931179');
  if (!inv) { console.error('Invoice not found'); process.exit(1); }
  console.log('Invoice invoiceNo:', inv.invoiceNo);

  // Merge site
  let site = null;
  if (inv.siteId) site = await Site.findOne({ id: inv.siteId });
  if (!site && inv.siteName) site = await Site.findOne({ name: new RegExp(`^${inv.siteName.trim().replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}$`, 'i') });
  if (!site) console.log('Site not found');
  else console.log('Site location:', site.location);

  const invoiceData = inv.toObject ? inv.toObject() : inv;
  if (site) invoiceData.site = site.toObject ? site.toObject() : site;

  const workbook = await createInvoiceWorkbook(invoiceData);
  const ws = workbook.getWorksheet('SHREEYA') || workbook.worksheets[0];
  console.log('A8:', ws.getCell('A8').value);
  console.log('A9:', ws.getCell('A9').value);
  console.log('B9:', ws.getCell('B9').value);
  console.log('A11:', ws.getCell('A11').value);

  const out = '/tmp/go.xlsx';
  await workbook.xlsx.writeFile(out);
  console.log('Wrote to', out);
  process.exit(0);
})();