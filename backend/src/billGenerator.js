const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
const numWords = require('num-words'); // Optional: convert numbers to words

/**
 * Generate an invoice XLSX from a template using exceljs
 * @param {Object} inputData - invoice data (see example at bottom)
 * @param {string} [options.templatePath] - optional override for template path
 * @returns {Promise<string>} - path to generated file
 */
async function createInvoiceWorkbook(inputData, options = {}) {
  // Return a populated Workbook instance (does not write to disk)
  const defaultTemplate = path.resolve(__dirname, '..', '..', 'frontend', 'public', 'Bills_real.xlsx');
  const templatePath = options.templatePath || defaultTemplate;

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  const worksheet = workbook.getWorksheet('SHREEYA') || workbook.worksheets[0];
  if (!worksheet) throw new Error('No worksheet found in template');

  // Normalize input fields (support both snake_case and camelCase)
  const invNo = inputData.invoiceNo || inputData.invoice_no || inputData.invoice_no;
  const dateVal = inputData.date || inputData.generatedDate || '';
  const periodRaw = inputData.billingPeriod || inputData.period || '';
  let period = periodRaw; // will normalize/format below if needed

  // Normalize site wrapper (if site object present)
  const siteInfo = inputData.site || {};

  // Build client values explicitly with clear precedence (prefer site fields first)
  let clientName = (siteInfo && (siteInfo.clientName || siteInfo.companyName)) || (inputData.client && (inputData.client.name || inputData.client.companyName)) || inputData.client_name || inputData.siteName || inputData.site_name || '';
  let clientAddress = (siteInfo && siteInfo.location) || (inputData.client && inputData.client.address) || inputData.client_address || inputData.site_location || '';
  let clientGstin = (siteInfo && (siteInfo.clientGstin || siteInfo.gstin)) || (inputData.client && (inputData.client.gstin || inputData.client.gst)) || inputData.client_gstin || '';

  // Debug: write resolved client values to /tmp only when explicitly enabled
  if (options && options.debug) {
    try {
      fs.appendFileSync('/tmp/builder_debug.txt', JSON.stringify({ time: new Date().toISOString(), hasSite: !!siteInfo, siteInfoSummary: { clientName: siteInfo && siteInfo.clientName, location: siteInfo && siteInfo.location, clientGstin: siteInfo && siteInfo.clientGstin }, inputClient: inputData.client || null, clientName, clientAddress, clientGstin }) + '\n');
    } catch (e) { /* ignore */ }
  }

  // Try to fetch Site by name (best-effort) to prefer canonical fields from Site if available
  if (inputData.siteName) {
    try {
      const Site = require('./models/Site');
      const safeName = inputData.siteName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const s = await Site.findOne({ name: new RegExp(`^${safeName}$`, 'i') });
      if (s) {
        clientName = s.clientName || s.companyName || clientName || s.name;
        clientAddress = s.location || clientAddress;
        clientGstin = s.clientGstin || clientGstin;
      }
    } catch (e) {
      // ignore DB errors here; fallbacks remain
    }
  }

  const client = inputData.client || {
    name: inputData.client_name || inputData.siteName || inputData.site_name || '',
    address: inputData.client_address || '',
    gstin: inputData.client_gstin || ''
  };

  // --- Header Info ---
  worksheet.getCell('F2').value = `Invoice No :  ${invNo || ''}`;
  // Format date if possible
  let formattedDateStr = dateVal || '';
  try {
    const d = new Date(dateVal);
    if (!isNaN(d)) formattedDateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) { /* leave as-is */ }
  worksheet.getCell('F3').value = `Date:  ${formattedDateStr}`;
  // Use the normalized/expanded period string
  worksheet.getCell('F7').value = `Billing Period : ${period || ''}`;

  // --- Client Info ---
  // Log resolved client values for debugging only when enabled
  if (options && options.debug) {
    try {
      fs.appendFileSync('/tmp/builder_debug.log', JSON.stringify({ time: new Date().toISOString(), clientName, clientAddress, clientGstin, period }) + '\n');
    } catch (e) { /* ignore */ }
  }
  // Use resolved clientName/address/gstin computed above
  // Write clientName into merged A8:E8 to preserve template merge and avoid duplicate repeated cells
  const displayName = (clientName || '').toString();
  try {
    worksheet.mergeCells('A8:E8');
  } catch (e) { /* ignore if already merged */ }
  const a8 = worksheet.getCell('A8');
  a8.value = displayName;
  a8.font = { ...a8.font, bold: true };
  a8.alignment = { horizontal: 'left', indent: 1 };

  const displayAddress = (clientAddress || '').toString();
  // Fill address into merged A9:E9 and enable wrapping so long addresses fit
  try {
    worksheet.mergeCells('A9:E9');
  } catch (e) { /* ignore if already merged */ }
  const a9 = worksheet.getCell('A9');
  a9.value = displayAddress;
  a9.alignment = { wrapText: true, vertical: 'top', horizontal: 'left', indent: 1 };
  if (displayAddress.length > 60) worksheet.getRow(9).height = 30;

  // GSTIN cell (A11 in some templates)
  try {
    worksheet.mergeCells('A11:E11');
  } catch (e) { /* ignore */ }
  worksheet.getCell('A11').value = clientGstin ? `GSTIN : ${clientGstin}` : '';

  // --- Line Items ---
  const startRow = 16;
  const footerRowIndex = 35; // approximate footer start in your template
  const maxRowsAvailable = footerRowIndex - startRow + 1;
  const items = inputData.items || [];

  // Insert rows if space is insufficient
  if (items.length > maxRowsAvailable) {
    const extra = items.length - maxRowsAvailable;
    worksheet.spliceRows(footerRowIndex, 0, ...Array(extra).fill([]));
  }

  let subTotal = 0;

  // --- Determine billing period and days in month ---
  // If a billingPeriod is provided, prefer it. Use it verbatim if it already contains a day range.
  // Otherwise, if it contains a Month + Year (e.g., "Nov 2025"), expand to "1st to <last> <Month> <Year>" and compute days.
  // Fallback to previous-month logic using dateVal.
  let daysInMonth = null;
  try {
    if (periodRaw && typeof periodRaw === 'string') {
      // If it already contains a date range like '1st to 30th', keep as-is and parse the month/year
      const rangeMatch = periodRaw.match(/(\d{1,2}(?:st|nd|rd|th)\s*to\s*\d{1,2}(?:st|nd|rd|th))\s*([A-Za-z]+)\s*([0-9]{4})/i);
      if (rangeMatch) {
        // Keep period as-is (use original spacing)
        period = periodRaw;
        const monthName = rangeMatch[2];
        const year = Number(rangeMatch[3]);
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const monthIndex = monthNames.findIndex(x => new RegExp('^'+x,'i').test(monthName));
        if (monthIndex >= 0) daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      } else {
        // Try to find 'Month Year' and expand to range
        const m = periodRaw.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s,]*([0-9]{4})/i);
        if (m) {
          const monthName = m[1];
          const year = Number(m[2]);
          const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const monthIndex = monthNames.findIndex(x => new RegExp('^'+x,'i').test(monthName));
          if (monthIndex >= 0) {
            daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
            period = `1st to ${daysInMonth} ${monthNames[monthIndex].replace(/\b[a-z]/g, c=>c.toLowerCase()).replace(/^./, s=>s.toUpperCase())} ${year}`;
            // The above preserves month capitalization (e.g., 'November')
          }
        }
      }
    }
  } catch (err) {
    // ignore parse errors
  }

  if (!daysInMonth) {
    // Fallback: previous month relative to invoice date
    const billDate = new Date(dateVal || Date.now());
    daysInMonth = new Date(billDate.getFullYear(), billDate.getMonth(), 0).getDate();
    // If the original periodRaw was missing, create a reasonable period string (fall back only)
    if (!period || String(period).trim() === '') {
      const mnames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const prevMonth = new Date(billDate.getFullYear(), billDate.getMonth()-1, 1);
      period = `1st to ${daysInMonth} ${mnames[prevMonth.getMonth()]} ${prevMonth.getFullYear()}`;
    }
  }

  items.forEach((item, i) => {
    const currentRow = startRow + i;
    const row = worksheet.getRow(currentRow);

    const rate = Number(item.rate || 0);
    const persons = Number(item.persons || 0);
    const workingDays = Number(item.working_days || item.workingDays || item.days || 0);

    // Per-day prorated calculation: (Rate / DaysInMonth) * workingDays
    // NOTE: Do NOT multiply by 'persons' per requested formula
    const perDayRate = daysInMonth > 0 ? (rate / daysInMonth) : 0;
    const rawAmount = perDayRate * workingDays;
    const finalAmount = Math.round(rawAmount);

    row.getCell(1).value = i + 1; // Sr No
    row.getCell(2).value = item.description || '';
    row.getCell(3).value = item.hsn || '';
    row.getCell(4).value = rate;
    row.getCell(5).value = workingDays || '';
    row.getCell(7).value = persons || 0; // Col G

    row.getCell(8).value = finalAmount; // Col H (rounded)

    subTotal += finalAmount;
    row.commit();
  });

  // --- Totals Calculation (rounded) ---
  const MGMT_PERCENT = 0.15; // 15%
  const GST_PERCENT = 0.09;  // 9% (CGST/SGST split)

  const mgmtCharges = Math.round(subTotal * MGMT_PERCENT);
  const totalBeforeTax = subTotal + mgmtCharges;
  const cgst = Math.round(totalBeforeTax * GST_PERCENT);
  const sgst = Math.round(totalBeforeTax * GST_PERCENT);
  const finalTotal = totalBeforeTax + cgst + sgst;

  // --- Writing Totals ---
  worksheet.getCell('H22').value = 0;                  // Material Charges (Example)
  worksheet.getCell('H23').value = subTotal;           // Sub Total
  worksheet.getCell('H24').value = mgmtCharges;        // Mgmt Charges
  worksheet.getCell('H26').value = totalBeforeTax;     // Total (Before Tax)
  worksheet.getCell('H28').value = cgst;               // Add CGST
  worksheet.getCell('H29').value = sgst;               // Add SGST
  worksheet.getCell('H32').value = finalTotal;         // Total (Exact)
  worksheet.getCell('H33').value = finalTotal - Math.floor(finalTotal);       // Round off (if any)
  worksheet.getCell('H34').value = Math.round(finalTotal);  // Total Amount (Final)

  // Amount in Words (Row 31 based on your JSON) with wrapping
  const finalAmountRounded = Math.round(finalTotal);
  const amountInWords = (numWords(finalAmountRounded) || '') + ' Only';
  const formattedWords = amountInWords.replace(/\b\w/g, l => l.toUpperCase());
  const wordsCell = worksheet.getCell('A31');
  wordsCell.value = formattedWords;
  wordsCell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
  if (formattedWords.length > 50) {
    worksheet.getRow(31).height = 30; // increase row height
  }

  return workbook;
}

async function generateInvoice(inputData, options = {}) {
  const safeInvoiceNo = (inputData.invoice_no || inputData.invoiceNo || 'invoice').replace(/\//g, '-').replace(/[^a-zA-Z0-9\-_.]/g, '_');
  const outputFilename = options.outputFilename || `Invoice_${safeInvoiceNo}.xlsx`;
  const outputPath = path.resolve(process.cwd(), outputFilename);

  const workbook = await createInvoiceWorkbook(inputData, options);
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}

module.exports = { createInvoiceWorkbook, generateInvoice };

// If run directly, create a sample invoice (quick demo)
if (require.main === module) {
  const sample = {
    invoice_no: 'AS/25-26/200',
    date: '15 January 2026',
    period: '1st to 31st December 2025',
    client_name: 'Tech Corp India',
    client_address: 'Cyber City, Gurgaon',
    client_gstin: '07AAACT1234Q1Z5',
    items: [
      { description: 'Security Guards', hsn: 9985, rate: 15000, working_days: 30, persons: 4 },
      { description: 'Housekeeping', hsn: 9985, rate: 12000, working_days: 30, persons: 2 }
    ]
  };

  (async () => {
    try {
      const out = await generateInvoice(sample);
      console.log('Generated:', out);
    } catch (err) {
      console.error('Error generating invoice:', err);
    }
  })();
}
