require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const connectToDatabase = require('../utils/db');
const Invoice = require('../models/Invoice');
const { createInvoiceWorkbook } = require('../billGenerator');
const path = require('path');
const fs = require('fs');

// Compute working days using rules:
// present => +1
// absent => -1
// weekoff => +1
// weekoff but present (wop) => +2
function computeWorkingDays(attendanceDays) {
  // attendanceDays: array of status strings: 'present','absent','weekoff','wop'
  let total = 0;
  for (const s of attendanceDays) {
    if (s === 'present') total += 1;
    else if (s === 'absent') total -= 1;
    else if (s === 'weekoff') total += 1;
    else if (s === 'wop') total += 2; // weekoff but present
    else {
      // Unknown status treated as 0
    }
  }
  return total;
}

(async () => {
  await connectToDatabase();

  // For demo: find Sanjay Puri invoice for Nov 2025
  const invoice = await Invoice.findOne({ siteName: /Sanjay\s*puri/i, billingPeriod: /Nov(?:ember)?\s*2025/i });
  if (!invoice) {
    console.error('Invoice for Sanjay Nov 2025 not found');
    process.exit(1);
  }

  // Example attendance sample for the month (length 30 for Nov 2025)
  // Construct a realistic mixture: 20 present, 2 absent, 6 weekoff, 2 wop
  // Represent as an array of 30 statuses (order not important)
  const attendanceSample = [];
  attendanceSample.push(...Array(20).fill('present'));
  attendanceSample.push(...Array(2).fill('absent'));
  attendanceSample.push(...Array(6).fill('weekoff'));
  attendanceSample.push(...Array(2).fill('wop'));

  const computed = computeWorkingDays(attendanceSample);
  console.log('Computed workingDays from sample attendance:', computed);

  // Verify rule behavior on small known cases
  const test = computeWorkingDays(['present','absent','weekoff','wop']);
  console.log('Sanity test (present, absent, weekoff, wop) =>', test);
  if (test === (1 - 1 + 1 + 2)) console.log('yess'); else console.log('no');

  // Now prepare invoiceData using invoice from DB but override working_days for each item using computed
  const invoiceData = invoice.toObject ? invoice.toObject() : invoice;
  invoiceData.items = (invoiceData.items || []).map(it => ({ ...it, working_days: computed }));

  // Generate workbook and save to frontend public as mahesh.xlsx
  const workbook = await createInvoiceWorkbook(invoiceData);
  // Save to repo frontend/public (project root -> ../.. -> ..)
  const outPath = path.resolve(__dirname, '..', '..', '..', 'frontend', 'public', 'mahesh.xlsx');
  await workbook.xlsx.writeFile(outPath);
  console.log('Generated invoice saved to', outPath);

  process.exit(0);
})();