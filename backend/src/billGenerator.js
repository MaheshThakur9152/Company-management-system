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
  // Try several reasonable locations for the template so runtime (local, CI, Docker, Vercel, etc.) works reliably
  const candidates = [];
  // Default historically used in this repo
  candidates.push(path.resolve(__dirname, '..', '..', 'frontend', 'public', 'Bills_real.xlsx'));
  // Project-root locations (after build we copy frontend/dist to root/dist)
  candidates.push(path.resolve(process.cwd(), 'frontend', 'public', 'Bills_real.xlsx'));
  candidates.push(path.resolve(process.cwd(), 'dist', 'Bills_real.xlsx'));
  candidates.push(path.resolve(process.cwd(), 'public', 'Bills_real.xlsx'));
  // A backend-specific public folder (if you later move templates into backend/public)
  candidates.push(path.resolve(__dirname, '..', 'public', 'Bills_real.xlsx'));
  // Any explicit path supplied by caller takes precedence
  if (options.templatePath) candidates.unshift(path.resolve(options.templatePath));

  const found = candidates.find(p => fs.existsSync(p));
  if (!found) {
    console.error('Template lookup failed. Tried the following paths:\n' + candidates.join('\n'));
    throw new Error('Template not found. Looked in ' + candidates.join(', '));
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(found);

  // Prefer the worksheet named (case-insensitive) 'SHREEYA' but fall back to the first sheet
  let worksheet = workbook.getWorksheet('SHREEYA');
  if (!worksheet) {
    worksheet = workbook.worksheets.find(ws => (ws.name || '').toUpperCase() === 'SHREEYA') || workbook.worksheets[0];
  }
  if (!worksheet) throw new Error('No worksheet found in template');

  // Ensure header/footer are set as desired:
  // - Centered header should read "PROFORMA INVOICE"
  // - Clear footers so page numbers like "Page 1" do not appear when printing
  try {
    if (!worksheet.headerFooter) worksheet.headerFooter = {};
    worksheet.headerFooter.oddHeader = '&CPROFORMA INVOICE';
    worksheet.headerFooter.evenHeader = '&CPROFORMA INVOICE';
    worksheet.headerFooter.firstHeader = '&CPROFORMA INVOICE';
    worksheet.headerFooter.oddFooter = '';
    worksheet.headerFooter.evenFooter = '';
    worksheet.headerFooter.firstFooter = '';
  } catch (e) {
    // ignore if headerFooter is not supported by the template/library version
  }

  // Replace top company name in Row 1 with the selected company
  try {
    const vendorName = inputData.companyName || 'AMBE SERVICE';
    const cellA1 = worksheet.getRow(1).getCell(1);
    cellA1.value = vendorName;
    // Removed explicit size/bold override to keep "ditto same font and size"
  } catch (e) {
    // ignore any issues iterating the sheet
  }

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

  // Debug logging removed (previously wrote to /tmp)
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
  // Debug logging removed (previously wrote to /tmp)  // Use resolved clientName/address/gstin computed above
  // Write clientName across merged row (A8..D8) and uppercase to match your example
  const displayName = (clientName || '').toString();
  ['A8', 'B8', 'C8', 'D8'].forEach(cellAddr => { worksheet.getCell(cellAddr).value = displayName; });
  const displayAddress = (clientAddress || '').toString();
  // Fill address across A9..D9 and enable wrapping so long addresses fit
  ['A9', 'B9', 'C9', 'D9'].forEach(cellAddr => {
    const cell = worksheet.getCell(cellAddr);
    cell.value = displayAddress;
    cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
  });
  if (displayAddress.length > 60) worksheet.getRow(9).height = 30;
  worksheet.getCell('A11').value = clientGstin ? `GSTIN : ${clientGstin}` : '';

  // --- Vendor Details (Bank, Terms, Signatory) ---
  if (inputData.bankDetails) {
    const bd = inputData.bankDetails;

    // Helper: find a cell that contains the needle (case-insensitive). Returns {r,c} or null
    function findCell(needle) {
      const n = String(needle).toLowerCase();
      for (let r = 1; r <= worksheet.rowCount; r++) {
        const row = worksheet.getRow(r);
        for (let c = 1; c <= Math.min(worksheet.columnCount, 20); c++) {
          const txt = getCellText(row.getCell(c));
          if (txt && txt.toLowerCase().includes(n)) return { r, c };
        }
      }
      return null;
    }

    // Try several anchors in order of reliability
    const bankDetailsCell = findCell('bank details');
    const bankNameCell = findCell('bank name');
    const accNoCell = findCell('acc no') || findCell('account no');

    // Determine the column to write into (prefer the bank name or acc no column if present)
    let col = 1;
    if (bankNameCell) col = bankNameCell.c;
    else if (accNoCell) col = accNoCell.c;
    else if (bankDetailsCell) col = bankDetailsCell.c;

    // Safe writer that targets the resolved column
    function writeBankLine(rowIdx, text) {
      try {
        worksheet.getRow(rowIdx).getCell(col).value = text;
      } catch (e) { /* ignore write errors */ }
    }

    if (accNoCell) {
      const accRow = accNoCell.r;
      writeBankLine(accRow - 1, `Bank Name :  ${bd.name || bd.bankName}`);
      writeBankLine(accRow, `Acc no : ${bd.accNo || bd.accountNo}`);
      writeBankLine(accRow + 1, `IFSC Code: ${bd.ifsc || bd.ifscCode}   Branch: ${bd.branch || bd.branchName || ''}`);
    } else if (bankNameCell) {
      const r = bankNameCell.r;
      writeBankLine(r, `Bank Name :  ${bd.name || bd.bankName}`);
      writeBankLine(r + 1, `Acc no : ${bd.accNo || bd.accountNo}`);
      writeBankLine(r + 2, `IFSC Code: ${bd.ifsc || bd.ifscCode}   Branch: ${bd.branch || bd.branchName || ''}`);
    } else if (bankDetailsCell) {
      const r = bankDetailsCell.r;
      writeBankLine(r + 1, `Bank Name :  ${bd.name || bd.bankName}`);
      writeBankLine(r + 2, `Acc no : ${bd.accNo || bd.accountNo}`);
      writeBankLine(r + 3, `IFSC Code: ${bd.ifsc || bd.ifscCode}   Branch: ${bd.branch || bd.branchName || ''}`);
    } else {
      // Last-resort fallback: write near the totals area so it appears on the invoice
      const rowNearTotal = findRowByLabel(/total/i) || 26;
      writeBankLine(rowNearTotal + 2, `Bank Name :  ${bd.name || bd.bankName}`);
      writeBankLine(rowNearTotal + 3, `Acc no : ${bd.accNo || bd.accountNo}`);
      writeBankLine(rowNearTotal + 4, `IFSC Code: ${bd.ifsc || bd.ifscCode}   Branch: ${bd.branch || bd.branchName || ''}`);
    }
  }

  if (inputData.terms) {
    const termsRowIdx = findRowByLabel(/terms\s*&\s*condition/i);
    if (termsRowIdx) {
      worksheet.getRow(termsRowIdx + 1).getCell(1).value = inputData.terms;
    }
  }

  if (inputData.signatory) {
    const sigRowIdx = findRowByLabel(/authorized signatory/i) || findRowByLabel(/for ambe/i);
    if (sigRowIdx) {
      // Typically writes to the "For..." line which is a few rows above "Authorized signatory"
      const cell = worksheet.getRow(sigRowIdx - 4).getCell(6);
      cell.value = inputData.signatory;
      cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'right' };
    }
  }

  // --- Line Items ---
  // Dynamically detect header row and important column indices so the template can be edited without breaking the generator
  function getCellText(cell) {
    if (!cell) return '';
    const v = cell.value;
    if (!v) return '';
    if (typeof v === 'string') return v.trim();
    if (typeof v === 'number') return String(v);
    if (typeof v === 'object') {
      if (v.richText && Array.isArray(v.richText)) return v.richText.map(t => t.text).join('');
      if (v.text) return v.text;
      if (v.formula) return '';
      if (v.result !== undefined) return String(v.result);
    }
    return '';
  }

  // Find the header row using a scored search so we don't mis-detect a data row as the header
  // Accept more header variants (singular/plural/typos) to be robust across templates
  const headerPatterns = [/sr\s*no/i, /description/i, /hsn/i, /rate/i, /working\s*days|working days|working\s*day|working\s*day/i, /persons?/i, /\bover?t?ime\b/i, /\bamount\b/i];
  let headerRow = null;
  let bestScore = 0;
  const searchLimit = Math.min(40, worksheet.rowCount);
  for (let r = 1; r <= searchLimit; r++) {
    const row = worksheet.getRow(r);
    let score = 0;
    for (let c = 1; c <= Math.min(worksheet.columnCount, 60); c++) {
      const txt = getCellText(row.getCell(c));
      if (!txt) continue;
      headerPatterns.forEach(p => { if (p.test(txt)) score++; });
    }
    if (score > bestScore) { bestScore = score; headerRow = r; }
  }
  // require at least one header pattern match to be confident; otherwise fall back
  if (!headerRow || bestScore < 1) {
    headerRow = 15; // fallback
  }

  // Improved findCol that also uses simple substring fallbacks when regex fails
  function findCol(headerRegex, fallbackKeywords = []) {
    for (let c = 1; c <= Math.min(worksheet.columnCount, 60); c++) {
      const txt = getCellText(worksheet.getRow(headerRow).getCell(c));
      if (txt && headerRegex.test(txt)) return c;
    }
    if (fallbackKeywords && fallbackKeywords.length) {
      for (let c = 1; c <= Math.min(worksheet.columnCount, 60); c++) {
        const txt = getCellText(worksheet.getRow(headerRow).getCell(c)).toLowerCase();
        if (!txt) continue;
        for (const k of fallbackKeywords) {
          if (txt.indexOf(k) !== -1) return c;
        }
      }
    }
    return null;
  }

  const colSr = findCol(/sr\s*no/i, ['sr', 'sno']) || 1;
  const colDescription = findCol(/description/i, ['description', 'service', 'desc']) || 2;
  const colHsn = findCol(/hsn/i, ['hsn']) || 3;
  const colRate = findCol(/rate/i, ['rate', 'rs', '₹']) || 4;
  const colDays = findCol(/working\s*days|working days|working\s*day/i, ['working', 'day', 'days']) || findCol(/days/i, ['days']) || 5;
  const colPersons = findCol(/persons?/i, ['persons', 'person', 'no\.', 'count']) || 6;
  const colAmount = findCol(/\bamount\b/i, ['amount', 'amt', 'rs']) || 7;

  let startRow = headerRow + 1;
  // If the startRow still contains header-like values (due to multi-row headers or merged headers), skip down until we find a non-header row
  function rowLooksLikeHeader(r) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= Math.min(worksheet.columnCount, 60); c++) {
      const txt = getCellText(row.getCell(c));
      if (!txt) continue;
      for (const p of headerPatterns) if (p.test(txt)) return true;
    }
    return false;
  }
  while (rowLooksLikeHeader(startRow) && startRow <= worksheet.rowCount) startRow++;

  // Find footer start (first row that looks like 'Sub Total' / 'Management charges' or similar)
  let footerRowIndex = null;
  for (let r = startRow; r <= Math.min(startRow + 50, worksheet.rowCount); r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= Math.min(worksheet.columnCount, 20); c++) {
      const txt = getCellText(row.getCell(c));
      if (/material charges|sub\s*total|management charges|amount chargeble|total amount|round off|total\b/i.test(txt)) {
        footerRowIndex = r; break;
      }
    }
    if (footerRowIndex) break;
  }
  if (!footerRowIndex) footerRowIndex = 35; // fallback

  // Determine effective range for items
  const items = inputData.items || [];
  const requiredRows = items.length * 2;
  const maxRowsAvailable = footerRowIndex - startRow + 1;

  if (requiredRows > maxRowsAvailable) {
    const extra = requiredRows - maxRowsAvailable;
    worksheet.spliceRows(footerRowIndex, 0, ...Array(extra).fill([]));
  }

  // CRITICAL: Clear all cells in the Amount column from startRow to footer start 
  // to avoid summing leftover values from the template in the SUM() formula.
  const colAmountLetter = String.fromCharCode(64 + colAmount);
  for (let rCr = startRow; rCr < (footerRowIndex + (requiredRows > maxRowsAvailable ? (requiredRows - maxRowsAvailable) : 0)); rCr++) {
    try {
      const row = worksheet.getRow(rCr);
      row.getCell(colSr).value = null;
      row.getCell(colDescription).value = null;
      row.getCell(colAmount).value = null;
    } catch (e) { }
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
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = monthNames.findIndex(x => new RegExp('^' + x, 'i').test(monthName));
        if (monthIndex >= 0) daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      } else {
        // Try to find 'Month Year' and expand to range
        const m = periodRaw.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s,]*([0-9]{4})/i);
        if (m) {
          const monthName = m[1];
          const year = Number(m[2]);
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const monthIndex = monthNames.findIndex(x => new RegExp('^' + x, 'i').test(monthName));
          if (monthIndex >= 0) {
            daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
            period = `1st to ${daysInMonth} ${monthNames[monthIndex].replace(/\b[a-z]/g, c => c.toLowerCase()).replace(/^./, s => s.toUpperCase())} ${year}`;
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
      const mnames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      const prevMonth = new Date(billDate.getFullYear(), billDate.getMonth() - 1, 1);
      period = `1st to ${daysInMonth} ${mnames[prevMonth.getMonth()]} ${prevMonth.getFullYear()}`;
    }
  }

  // For each input item, write two rows: service row + overtime row
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const isAlreadyOt = (item.description || '').toLowerCase().includes('overtime') || (item.description || '').toLowerCase().includes('ot hrs');

    const serviceRowIdx = startRow + i * 2;
    const overtimeRowIdx = serviceRowIdx + 1;

    const rate = Number(item.rate || 0);
    const persons = Number(item.persons || 0);
    const workingDays = Number(item.working_days || item.workingDays || item.days || 0);
    const overtimeHours = Number(item.overtime_hours || item.overtimeHours || item.overtime || 0);

    const rateCellAddr = String.fromCharCode(64 + colRate) + serviceRowIdx;
    const daysCellAddr = String.fromCharCode(64 + colDays) + serviceRowIdx;
    const amountCellAddr = String.fromCharCode(64 + colAmount) + serviceRowIdx;
    const amountColLetter = String.fromCharCode(64 + colAmount);

    // Service row
    const srow = worksheet.getRow(serviceRowIdx);
    const perDayRate = daysInMonth > 0 ? (rate / daysInMonth) : 0;
    const rawAmount = perDayRate * workingDays;
    const finalAmount = Math.round(rawAmount);

    // Assign sequential Sr numbers for both service and overtime rows (increment per row)
    if (typeof rowCounter === 'undefined') rowCounter = 1;
    srow.getCell(colSr).value = rowCounter++;
    srow.getCell(colSr).alignment = Object.assign({}, srow.getCell(colSr).alignment || {}, { horizontal: 'right', vertical: 'top' });

    srow.getCell(colDescription).value = item.description || '';
    srow.getCell(colHsn).value = item.hsn || '';
    srow.getCell(colRate).value = rate;
    srow.getCell(colDays).value = workingDays || '';
    srow.getCell(colPersons).value = persons || 0;

    // Ensure service description wraps and keeps its original font size
    try {
      srow.getCell(colDescription).alignment = Object.assign({}, srow.getCell(colDescription).alignment || {}, { wrapText: true, vertical: 'top', horizontal: 'left' });
    } catch (e) { }

    const amountCell = srow.getCell(colAmount);
    // Use dynamic formula instead of hardcoded value: (Rate/DaysInMonth) * WorkingDays
    amountCell.value = {
      formula: `ROUND((${rateCellAddr}/${daysInMonth})*${daysCellAddr}, 0)`,
      result: finalAmount
    };
    srow.commit();

    // Overtime row (skip if item is already an OT item to avoid duplicate labels)
    if (isAlreadyOt) {
      // If it's already an OT item, we don't need the extra generated OT row.
      // We can just clear it or skip it. For now, we'll keep the loop simple and just not write to the OT row.
      continue;
    }

    const orow = worksheet.getRow(overtimeRowIdx);
    // Shorten overtime label to a compact short form
    const svcName = (item.description || '').toString().trim();
    const shortSvc = (svcName.split(/\s+/).slice(0, 2).join(' ')).replace(/[,;:]$/, '');
    const descText = `OT hrs (${shortSvc || svcName})`;
    // assign Sr No for overtime row too and right-align
    orow.getCell(colSr).value = rowCounter++;
    orow.getCell(colSr).alignment = Object.assign({}, orow.getCell(colSr).alignment || {}, { horizontal: 'right', vertical: 'top' });
    orow.getCell(colDescription).value = descText;

    // Merge HSN and Rate vertically across service+overtime rows for a clean look
    try { worksheet.mergeCells(serviceRowIdx, colHsn, overtimeRowIdx, colHsn); } catch (e) { }
    try { worksheet.mergeCells(serviceRowIdx, colRate, overtimeRowIdx, colRate); } catch (e) { }

    // Copy style (including borders) from service row to overtime row for consistency
    const colsToCopy = [colHsn, colRate, colDescription, colDays, colPersons, colAmount];
    colsToCopy.forEach(c => {
      try {
        const sc = srow.getCell(c);
        const oc = orow.getCell(c);
        // copy style objects where present
        if (sc && sc.style) oc.style = Object.assign({}, sc.style);
        // copy border; if template lacks a border for a side, set a thin border to preserve table grid
        const srcBorder = (sc && sc.border) ? JSON.parse(JSON.stringify(sc.border)) : null;
        const thin = { style: 'thin', color: { argb: 'FF000000' } };
        if (srcBorder) {
          oc.border = srcBorder;
          // also apply border to the service cell to ensure merged area keeps borders
          srow.getCell(c).border = JSON.parse(JSON.stringify(srcBorder));
        } else {
          oc.border = { top: thin, left: thin, bottom: thin, right: thin };
          if (srow.getCell(c) && !srow.getCell(c).border) srow.getCell(c).border = { top: thin, left: thin, bottom: thin, right: thin };
        }

        // Ensure vertical grid line between description and HSN exists: force right border on description and left border on HSN
        try {
          if (c === colDescription) {
            const scDesc = srow.getCell(colDescription);
            const ocDesc = orow.getCell(colDescription);
            scDesc.border = Object.assign({}, scDesc.border || {}, { right: thin });
            ocDesc.border = Object.assign({}, ocDesc.border || {}, { right: thin });
          }
          if (c === colHsn) {
            const scHsn = srow.getCell(colHsn);
            const ocHsn = orow.getCell(colHsn);
            scHsn.border = Object.assign({}, scHsn.border || {}, { left: thin });
            ocHsn.border = Object.assign({}, ocHsn.border || {}, { left: thin });
          }
          if (c === colRate) {
            const scRate = srow.getCell(colRate);
            const ocRate = orow.getCell(colRate);
            scRate.border = Object.assign({}, scRate.border || {}, { left: thin });
            ocRate.border = Object.assign({}, ocRate.border || {}, { left: thin });
          }
        } catch (e2) { }
      } catch (e) { }
    });

    // Slightly widen the description column for long overtime text so wrapping looks tidy (but cap so it doesn't break layout)
    try {
      const colObj = worksheet.getColumn(colDescription);
      const currentW = colObj && colObj.width ? colObj.width : 12;
      if (descText.length > 24 && (!currentW || currentW < 16)) colObj.width = 16;
    } catch (e) { }

    // Keep same font size/style as the service description for uniformity; enable wrapping and shrinkToFit
    try {
      const sFont = (srow.getCell(colDescription).font) || {};
      orow.getCell(colDescription).font = Object.assign({}, sFont);
    } catch (e) { }
    orow.getCell(colDescription).alignment = Object.assign({}, orow.getCell(colDescription).alignment || {}, { wrapText: true, vertical: 'top', horizontal: 'left', shrinkToFit: true });

    // Ensure the description row height expands for long text but not too tall to keep design tidy
    if (descText.length > 25) worksheet.getRow(overtimeRowIdx).height = Math.max(18, Math.min(28, Math.ceil(descText.length / 30) * 18));

    // Also ensure the service row retains a similar height so borders align nicely
    const desiredServiceHeight = Math.max(worksheet.getRow(serviceRowIdx).height || 15, worksheet.getRow(overtimeRowIdx).height || 15);
    worksheet.getRow(serviceRowIdx).height = desiredServiceHeight;
    worksheet.getRow(overtimeRowIdx).height = desiredServiceHeight;

    // Overtime hours placed in 'Working Days' column (as '8 hrs' style)
    orow.getCell(colDays).value = overtimeHours ? String(overtimeHours) + (String(overtimeHours).toLowerCase().includes('hr') ? '' : ' hrs') : '0';
    orow.getCell(colPersons).value = persons || 0;

    // Compute overtime amount as (rate / daysInMonth / 9) * overtimeHours (same as template formula)
    const overtimePerHour = daysInMonth > 0 ? (rate / daysInMonth / 9) : 0;
    const overtimeAmount = Math.round(overtimePerHour * (Number(overtimeHours) || 0));

    const otRateCellAddr = String.fromCharCode(64 + colRate) + overtimeRowIdx;
    const otDaysCellAddr = String.fromCharCode(64 + colDays) + overtimeRowIdx;
    const amountOverCell = orow.getCell(colAmount);

    // Formula for OT: (Rate / DaysInMonth / 9) * OT_Hours
    // Note: colRate is merged, so we use the serviceRowIdx cell address for rate
    amountOverCell.value = {
      formula: `ROUND((${rateCellAddr}/${daysInMonth}/9)*${otDaysCellAddr}, 0)`,
      result: overtimeAmount
    };

    // Re-apply border to merged HSN/Rate cell and enforce outer rectangle borders for the service+overtime block
    try {
      const topHsnCell = worksheet.getRow(serviceRowIdx).getCell(colHsn);
      const topRateCell = worksheet.getRow(serviceRowIdx).getCell(colRate);
      const thin = { style: 'thin', color: { argb: 'FF000000' } };
      const colsEnforce = [colSr, colDescription, colHsn, colRate, colDays, colPersons, colAmount];

      // Apply top border on service row and bottom border on overtime row for each column, plus left/right thin borders
      colsEnforce.forEach(c => {
        try {
          const sCell = worksheet.getRow(serviceRowIdx).getCell(c);
          const oCell = worksheet.getRow(overtimeRowIdx).getCell(c);

          sCell.border = Object.assign({}, sCell.border || {}, { top: thin, left: (sCell.border && sCell.border.left) || thin, right: (sCell.border && sCell.border.right) || thin });
          oCell.border = Object.assign({}, oCell.border || {}, { bottom: thin, left: (oCell.border && oCell.border.left) || thin, right: (oCell.border && oCell.border.right) || thin });
        } catch (e) { }
      });

      // Ensure HSN/Rate cells in both rows have full borders (covers merged area)
      for (let rr = serviceRowIdx; rr <= overtimeRowIdx; rr++) {
        try {
          const rHsn = worksheet.getRow(rr).getCell(colHsn);
          const rRate = worksheet.getRow(rr).getCell(colRate);
          if (topHsnCell && topHsnCell.border) rHsn.border = JSON.parse(JSON.stringify(topHsnCell.border)); else rHsn.border = Object.assign({}, rHsn.border || {}, { left: thin, top: thin, bottom: thin, right: thin });
          if (topRateCell && topRateCell.border) rRate.border = JSON.parse(JSON.stringify(topRateCell.border)); else rRate.border = Object.assign({}, rRate.border || {}, { left: thin, top: thin, bottom: thin, right: thin });
        } catch (e) { }
      }
    } catch (e) { }
    orow.commit();

    subTotal += finalAmount + overtimeAmount;
  }

  // Enforce a consistent grid for the item table: column widths, row heights and uniform thin borders
  try {
    const colsEnforce = [colSr, colDescription, colHsn, colRate, colDays, colPersons, colAmount];
    const tentativeLastRow = startRow + items.length * 2 - 1;

    // Determine last row that actually contains meaningful content (stop borders there)
    let actualLastDataRow = startRow - 1;
    for (let r = startRow; r <= tentativeLastRow; r++) {
      const row = worksheet.getRow(r);
      let has = false;
      for (const c of colsEnforce) {
        try {
          const t = getCellText(row.getCell(c));
          if (t && String(t).trim() !== '' && String(t).trim() !== '0' && String(t).trim() !== '0.00') { has = true; break; }
        } catch (e) { }
      }
      if (has) actualLastDataRow = r;
    }
    // If nothing found, fallback to the tentative end
    if (actualLastDataRow < startRow) actualLastDataRow = Math.max(startRow, tentativeLastRow);

    // Column widths (reasonable defaults)
    try { const cDesc = worksheet.getColumn(colDescription); if (!cDesc.width || cDesc.width < 18) cDesc.width = 20; } catch (e) { }
    try { const cHsn = worksheet.getColumn(colHsn); if (!cHsn.width || cHsn.width < 8) cHsn.width = 10; } catch (e) { }
    try { const cRate = worksheet.getColumn(colRate); if (!cRate.width || cRate.width < 10) cRate.width = 12; } catch (e) { }
    try { const cDays = worksheet.getColumn(colDays); if (!cDays.width || cDays.width < 8) cDays.width = 10; } catch (e) { }
    try { const cPersons = worksheet.getColumn(colPersons); if (!cPersons.width || cPersons.width < 6) cPersons.width = 8; } catch (e) { }
    try { const cAmount = worksheet.getColumn(colAmount); if (!cAmount.width || cAmount.width < 10) cAmount.width = 14; } catch (e) { }

    const thin = { style: 'thin', color: { argb: 'FF000000' } };
    for (let r = startRow; r <= actualLastDataRow; r++) {
      const row = worksheet.getRow(r);

      // Detect if row has meaningful content (avoid drawing borders on empty rows)
      let rowHasContent = false;
      for (const c of colsEnforce) {
        try {
          const t = getCellText(row.getCell(c));
          if (t && String(t).trim() !== '' && String(t).trim() !== '0' && String(t).trim() !== '0.00') { rowHasContent = true; break; }
        } catch (e) { }
      }
      if (!rowHasContent) continue; // skip empty rows entirely

      // Normalize height for rows in the items block
      if (!row.height || row.height < 16) row.height = 16;

      colsEnforce.forEach(c => {
        try {
          const cell = row.getCell(c);
          // preserve existing border sides if present, but ensure a thin grid exists
          const existing = cell.border || {};
          const top = existing.top || thin;
          const left = existing.left || thin;
          const bottom = existing.bottom || thin;
          const right = existing.right || thin;
          // For the first and last data row apply top/bottom explicitly
          if (r === startRow) cell.border = Object.assign({}, existing, { top: top, left: left, right: right });
          else if (r === actualLastDataRow) cell.border = Object.assign({}, existing, { bottom: bottom, left: left, right: right });
          else cell.border = Object.assign({}, existing, { left: left, right: right });
        } catch (e) { }
      });

      // Make sure description column alignment is consistent (left, wrap)
      try {
        const dcell = row.getCell(colDescription);
        dcell.alignment = Object.assign({}, dcell.alignment || {}, { wrapText: true, vertical: 'top', horizontal: 'left' });
        // match font with service row above if present
        try {
          const above = worksheet.getRow(Math.max(startRow, r - 1)).getCell(colDescription);
          if (above && above.font) dcell.font = Object.assign({}, above.font);
        } catch (e) { }
      } catch (e) { }

      row.commit();
    }

    // Clear borders on any rows after actualLastDataRow up to tentativeLastRow to remove stray lines
    try {
      for (let r = actualLastDataRow + 1; r <= tentativeLastRow; r++) {
        const row = worksheet.getRow(r);
        colsEnforce.forEach(c => {
          try { row.getCell(c).border = {}; } catch (e) { }
        });
        row.commit();
      }
    } catch (e) { }
  } catch (e) { }

  // --- Totals Calculation (rounded) ---
  const MGMT_PERCENT = (inputData.managementRate || 15) / 100;
  const GST_PERCENT = 0.09;  // 9% (CGST/SGST split)

  const mgmtCharges = Math.round(subTotal * MGMT_PERCENT);
  const totalBeforeTax = subTotal + mgmtCharges;
  const cgst = Math.round(totalBeforeTax * GST_PERCENT);
  const sgst = Math.round(totalBeforeTax * GST_PERCENT);
  const finalTotal = totalBeforeTax + cgst + sgst;

  // --- Writing Totals (only if template doesn't contain formulas in target cells) ---
  function findRowByLabel(regex) {
    for (let r = 1; r <= worksheet.rowCount; r++) {
      const row = worksheet.getRow(r);
      for (let c = 1; c <= worksheet.columnCount; c++) {
        const txt = getCellText(row.getCell(c));
        if (txt && regex.test(txt)) return r;
      }
    }
    return null;
  }

  function writeIfNotFormula(rowIdx, colIdx, value) {
    const cell = worksheet.getRow(rowIdx).getCell(colIdx);
    const v = cell && cell.value;
    if (v && typeof v === 'object' && v.formula) {
      // Don't overwrite template formulas
      return false;
    }
    worksheet.getRow(rowIdx).getCell(colIdx).value = value;
    return true;
  }

  const rowMaterial = findRowByLabel(/material charges/i);
  const rowSubTotal = findRowByLabel(/sub\s*total/i);
  const rowMgmt = findRowByLabel(/management charges/i);
  const rowCgst = findRowByLabel(/add cgst/i);
  const rowSgst = findRowByLabel(/add sgst/i);
  const rowRoundOff = findRowByLabel(/round off/i);

  // Improved Total Detection: some templates have multiple "Total" rows (Before Tax and Grand Total)
  const allTotalRows = [];
  for (let r = 1; r <= Math.min(worksheet.rowCount, 100); r++) {
    const row = worksheet.getRow(r);
    for (let c = 1; c <= 6; c++) {
      const txt = getCellText(row.getCell(c));
      if (txt && (/^total$/i.test(txt) || /total amount/i.test(txt) || /total\s*\(before/i.test(txt))) {
        allTotalRows.push(r);
        break;
      }
    }
  }

  // Row 26 is typically Total Before Tax, Row 32/34 are Grand Totals.
  let rowTotalBefore = allTotalRows.find(r => rowMgmt && r > rowMgmt && (!rowCgst || r < rowCgst));
  const grandTotalRows = allTotalRows.filter(r => (rowSgst && r > rowSgst) || (rowCgst && !rowSgst && r > rowCgst) || (/total amount/i.test(getCellText(worksheet.getRow(r).getCell(4)) || getCellText(worksheet.getRow(r).getCell(1)))));

  const amountColLetter = String.fromCharCode(64 + colAmount);
  const itemsEndRow = startRow + (items.length * 2) - 1;
  const itemsRange = `${amountColLetter}${startRow}:${amountColLetter}${itemsEndRow}`;

  if (rowMaterial) writeIfNotFormula(rowMaterial, colAmount, 0);

  if (rowSubTotal) {
    const cell = worksheet.getRow(rowSubTotal).getCell(colAmount);
    cell.value = { formula: `SUM(${itemsRange})`, result: subTotal };
  }

  if (rowMgmt) {
    const subtotalAddr = `${amountColLetter}${rowSubTotal}`;
    const cell = worksheet.getRow(rowMgmt).getCell(colAmount);
    cell.value = { formula: `ROUND(${subtotalAddr}*${MGMT_PERCENT}, 0)`, result: Math.round(subTotal * MGMT_PERCENT) };

    // Update label to reflect actual percentage
    const rowObj = worksheet.getRow(rowMgmt);
    for(let c=1; c<=6; c++) {
        const cVal = getCellText(rowObj.getCell(c));
        if (cVal && /management charges/i.test(cVal)) {
            rowObj.getCell(c).value = `Management charges @ ${(inputData.managementRate || 15)}%`;
            break;
        }
    }
  }

  if (rowTotalBefore) {
    const subtotalAddr = `${amountColLetter}${rowSubTotal}`;
    const mgmtAddr = `${amountColLetter}${rowMgmt}`;
    const cell = worksheet.getRow(rowTotalBefore).getCell(colAmount);
    cell.value = { formula: `${subtotalAddr}+${mgmtAddr}`, result: subTotal + Math.round(subTotal * MGMT_PERCENT) };
  }

  if (rowCgst) {
    const beforeTaxAddr = rowTotalBefore ? `${amountColLetter}${rowTotalBefore}` : (rowSubTotal ? `${amountColLetter}${rowSubTotal}` : null);
    if (beforeTaxAddr) {
      const cell = worksheet.getRow(rowCgst).getCell(colAmount);
      cell.value = { formula: `ROUND(${beforeTaxAddr}*0.09, 0)`, result: cgst };
    }
  }

  if (rowSgst) {
    const beforeTaxAddr = rowTotalBefore ? `${amountColLetter}${rowTotalBefore}` : (rowSubTotal ? `${amountColLetter}${rowSubTotal}` : null);
    if (beforeTaxAddr) {
      const cell = worksheet.getRow(rowSgst).getCell(colAmount);
      cell.value = { formula: `ROUND(${beforeTaxAddr}*0.09, 0)`, result: sgst };
    }
  }

  // Update ALL grand total rows (e.g., Row 32 and Row 34)
  grandTotalRows.forEach(r => {
    const beforeTaxAddr = rowTotalBefore ? `${amountColLetter}${rowTotalBefore}` : (rowSubTotal ? `${amountColLetter}${rowSubTotal}` : null);
    const cgstAddr = rowCgst ? `${amountColLetter}${rowCgst}` : null;
    const sgstAddr = rowSgst ? `${amountColLetter}${rowSgst}` : null;
    const cell = worksheet.getRow(r).getCell(colAmount);

    if (beforeTaxAddr) {
      let formula = beforeTaxAddr;
      if (cgstAddr) formula += `+${cgstAddr}`;
      if (sgstAddr) formula += `+${sgstAddr}`;
      cell.value = { formula: formula, result: finalTotal };
    } else {
      cell.value = finalTotal;
    }
    cell.numFmt = '#,##0';
  });

  if (rowRoundOff) {
    const lastGrandRow = grandTotalRows[grandTotalRows.length - 1] || rowTotalBefore;
    if (lastGrandRow) {
      const totalExactAddr = `${amountColLetter}${lastGrandRow}`;
      const cell = worksheet.getRow(rowRoundOff).getCell(colAmount);
      cell.value = { formula: `ROUND(${totalExactAddr}, 0)-${totalExactAddr}`, result: 0 };
    }
  }

  // Fallback to write to the previously hard-coded locations if dynamic lookup failed
  try {
    if (!rowSubTotal) writeIfNotFormula(23, colAmount, subTotal);
    if (!rowMgmt) writeIfNotFormula(24, colAmount, mgmtCharges);
    if (!rowTotalBefore) writeIfNotFormula(26, colAmount, totalBeforeTax);
    if (!rowCgst) writeIfNotFormula(28, colAmount, cgst);
    if (!rowSgst) writeIfNotFormula(29, colAmount, sgst);
    if (!rowTotalExact) {
      writeIfNotFormula(32, colAmount, finalTotal);
      writeIfNotFormula(34, colAmount, Math.round(finalTotal));
    }
    if (rowRoundOff) {
      // already handled above if row found
    } else {
      writeIfNotFormula(33, colAmount, finalTotal - Math.floor(finalTotal));
    }
  } catch (e) {
    // ignore fallback errors
  }
  // Amount in Words — try to detect the proper place instead of hard-coding A31
  const finalAmountRounded = Math.round(finalTotal);
  const amountInWords = (numWords(finalAmountRounded) || '') + ' Only';
  const formattedWords = amountInWords.replace(/\b\w/g, l => l.toUpperCase());
  const rowWordsLabel = (function () {
    for (let r = 1; r <= worksheet.rowCount; r++) {
      const row = worksheet.getRow(r);
      for (let c = 1; c <= worksheet.columnCount; c++) {
        const txt = getCellText(row.getCell(c));
        if (txt && /amount\s*charg(e|a)ble|amount\s*in\s*words/i.test(txt)) return r;
      }
    }
    return null;
  })();

  if (rowWordsLabel) {
    // Clear any likely stale values in the rows around the words labels (often templates have old hardcoded text)
    // Avoid clearing bank-related lines (IFSC/Bank/Acc) which may legitimately be long strings
    for (let r = rowWordsLabel - 1; r <= rowWordsLabel + 3; r++) {
      if (r === rowWordsLabel) continue;
      const cell = worksheet.getRow(r).getCell(1);
      if (typeof cell.value === 'string' && cell.value.length > 20) {
        const txt = cell.value;
        if (!/\b(ifsc|ifsc code|bank|acc(?:ount)?|branch)\b/i.test(txt)) {
          cell.value = '';
        }
      }
    }

    // try writing to the next row column A (common layout), else same row col A
    const targetRow = Math.min(worksheet.rowCount, rowWordsLabel + 1);
    const wordsCell = worksheet.getRow(targetRow).getCell(1);
    wordsCell.value = formattedWords;
    wordsCell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
    if (formattedWords.length > 50) worksheet.getRow(targetRow).height = 30;
  } else {
    // fallback to previous behavior
    const wordsCell = worksheet.getCell('A31');
    wordsCell.value = formattedWords;
    wordsCell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' };
    if (formattedWords.length > 50) worksheet.getRow(31).height = 30;
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
