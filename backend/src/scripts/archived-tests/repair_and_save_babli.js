const ExcelJS = require('exceljs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Site = require('../models/Site');
const fs = require('fs');
(async()=>{
  // Find site details to use for replacement
  await mongoose.connect(process.env.MONGODB_URI);
  const site = await Site.findOne({ name: /sanjay/i });
  if (!site) return console.error('Site not found');
  const fullName = (site.clientName || site.companyName || site.name || '').toString();
  const gstin = site.clientGstin || '';

  const src = '/tmp/Invoice_sanjay_babli9.xlsx';
  const out = '/home/mahesh/Company-management-system/frontend/public/babli.xlsx';

  if (!fs.existsSync(src)) return console.error('Source file not found:', src);

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(src);
  const ws = wb.getWorksheet('SHREEYA') || wb.worksheets[0];

  // Replace any cell containing 'Sanjay puri' (case-insensitive) with fullName
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      try {
        if (cell.value && typeof cell.value.toString === 'function' && cell.value.toString().toLowerCase().includes('sanjay')) {
          cell.value = fullName;
        }
      } catch (e) {}
    });
  });

  // Ensure GSTIN cell (A11) is correct
  if (gstin) ws.getCell('A11').value = `GSTIN : ${gstin}`;
  // Ensure Billing Period is full (we already computed in workbook, but ensure formatting prefix)
  const f7 = ws.getCell('F7').value ? ws.getCell('F7').value.toString() : '';
  if (!f7.toLowerCase().includes('billing period')) ws.getCell('F7').value = `Billing Period : ${f7}`;

  await wb.xlsx.writeFile(out);
  console.log('Saved repaired invoice to', out);
  process.exit(0);
})();