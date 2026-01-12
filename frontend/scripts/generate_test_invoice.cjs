const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

async function run() {
  const template = path.resolve(__dirname, '..', 'public', 'Template_bill_ambeservice.xlsx');
  const out = path.resolve(__dirname, '..', 'temp', 'test_generated_invoice.xlsx');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(template);

  // choose sheet
  const sheet = workbook.worksheets.find(s => /shreeya|invoice|proforma/i.test(s.name)) || workbook.worksheets[0];

  function numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (n) => {
      if ((n = n.toString()).length > 9) return 'overflow';
      const n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n_array) return '';
      let str = '';
      str += (Number(n_array[1]) !== 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
      str += (Number(n_array[2]) !== 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
      str += (Number(n_array[3]) !== 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
      str += (Number(n_array[4]) !== 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
      str += (Number(n_array[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
      return str;
    };
    return inWords(Math.floor(num)) + "Only";
  }

  function findCellContaining(needle) {
    const lowered = needle.toLowerCase();
    for (let r = 1; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      for (let c = 1; c <= Math.max(row.cellCount || 20, 20); c++) {
        const cv = row.getCell(c).value;
        const val = (cv && typeof cv === 'object' && cv.richText) ? cv.richText.map(t => t.text).join('') : String(cv || '');
        if (val && val.toLowerCase().includes(lowered)) return { r, c, val };
      }
    }
    return null;
  }

  const pl = findCellContaining('{{LINE_ITEMS_START}}');
  const headerCell = findCellContaining('description') || findCellContaining('sr no');
  const headerRow = headerCell ? headerCell.r : -1;
  const startRow = pl ? pl.r : (headerRow > 0 ? headerRow + 2 : 16);

  // Build header map (same logic as TypeScript gen)
  const headerMap = {};
  const headerKeys = {
    'sr no': 'sr_no', 'srno': 'sr_no',
    'description of services': 'description', 'description': 'description',
    'hsn code': 'hsn', 'hsn': 'hsn',
    'rate': 'rate',
    'working days': 'working_days',
    'persons': 'persons',
    'amount (rs)': 'amount', 'amount': 'amount'
  };

  const headerCandidates = [headerRow, headerRow + 1].filter(r => r > 0 && r <= sheet.rowCount);
  for (const rnum of headerCandidates) {
    const row = sheet.getRow(rnum);
    for (let c = 1; c <= Math.max(row.cellCount || 10, 10); c++) {
      const cv = row.getCell(c).value;
      const val = (cv && typeof cv === 'object' && cv.richText) ? cv.richText.map(t => t.text).join('') : String(cv || '');
      const low = val.toLowerCase().trim();
      for (const hk of Object.keys(headerKeys)) {
        if (low.includes(hk)) {
          const key = headerKeys[hk];
          if (!headerMap[key]) headerMap[key] = c;
        }
      }
    }
  }
  // defaults (column H=8 for Amount based on analysis)
  headerMap['sr_no'] = headerMap['sr_no'] || 1;
  headerMap['description'] = headerMap['description'] || 2;
  headerMap['hsn'] = headerMap['hsn'] || 3;
  headerMap['rate'] = headerMap['rate'] || 4;
  headerMap['working_days'] = headerMap['working_days'] || 5;
  headerMap['persons'] = headerMap['persons'] || 7;
  headerMap['amount'] = headerMap['amount'] || 8;

  console.log('Header map:', headerMap);

  // sample items
  const items = [{ description: 'Janitor Services', hsn: '9985', rate: 17500, workingDays: 26, persons: 1, amount: (17500 / 31) * 26 * 1 }];

  // find sample row to copy styles
  function findSampleRowCandidate(start) {
    for (let offset = 0; offset <= 4; offset++) {
      const r = start + offset;
      if (r < 1 || r > sheet.rowCount) continue;
      const row = sheet.getRow(r);
      for (let c = 1; c <= 8; c++) {
        const cell = row.getCell(c);
        if ((cell.value !== null && cell.value !== undefined && String(cell.value).trim() !== '') || (cell.border && Object.keys(cell.border).length > 0)) {
          return row;
        }
      }
    }
    return sheet.getRow(start);
  }

  const sampleRow = findSampleRowCandidate(startRow);
  const sampleRowHeight = sampleRow ? sampleRow.height : null;

  const blankRows = items.map(() => Array(sheet.columnCount || 8).fill(''));
  if (pl) {
    sheet.spliceRows(startRow, 1, ...blankRows);
  } else {
    sheet.spliceRows(startRow, 0, ...blankRows);
  }

  const lastInserted = startRow + items.length - 1;
  for (let idx = 0; idx < items.length; idx++) {
    const r = startRow + idx;
    const item = items[idx];
    const destRow = sheet.getRow(r);
    try { if (sampleRowHeight) destRow.height = sampleRowHeight; } catch (e) { }

    // Copy styles from sample row for columns A..H
    for (let col = 1; col <= 8; col++) {
      const srcCell = sampleRow.getCell(col);
      const dstCell = destRow.getCell(col);
      try {
        dstCell.font = srcCell.font || dstCell.font;
        dstCell.border = srcCell.border || dstCell.border;
        dstCell.alignment = srcCell.alignment || dstCell.alignment;
        dstCell.numFmt = srcCell.numFmt || dstCell.numFmt;
        dstCell.fill = srcCell.fill || dstCell.fill;
      } catch (e) { }
    }

    // Write values using headerMap
    const setCell = (headerKey, value, numFmt, align) => {
      const colIndex = headerMap[headerKey] || 8;
      const cell = destRow.getCell(colIndex);
      cell.value = value;
      if (numFmt) cell.numFmt = numFmt;
      if (align) cell.alignment = align;
    };

    setCell('sr_no', idx + 1, undefined, { horizontal: 'center' });
    setCell('description', item.description, undefined, { horizontal: 'left', indent: 1 });
    setCell('hsn', item.hsn, undefined, { horizontal: 'center' });
    setCell('rate', item.rate, '#,##0', { horizontal: 'right' });
    setCell('working_days', item.workingDays, undefined, { horizontal: 'center' });
    setCell('persons', item.persons, undefined, { horizontal: 'center' });
    setCell('amount', Math.round(item.amount), '#,##0', { horizontal: 'right' });
  }

  // replace placeholders for totals if found
  const amountColIndex = headerMap['amount'] || 8;

  function replacePlaceholder(key, value) {
    const p = findCellContaining(`{{${key}}}`);
    if (p) {
      console.log(`[DEBUG] Found {{${key}}} at R${p.r}C${p.c}`);

      // If found in non-amount column (like A), clear it to not overwrite labels
      if (p.c !== amountColIndex && amountColIndex > 0) {
        const colLetter = String.fromCharCode(64 + p.c);
        sheet.getCell(`${colLetter}${p.r}`).value = ''; // clear placeholder text
      }

      // Always write to Amount column
      const targetCol = amountColIndex || 8;
      const amtLetter = String.fromCharCode(64 + targetCol);
      const amtCell = sheet.getCell(`${amtLetter}${p.r}`);
      amtCell.value = Math.round(value);
      amtCell.numFmt = '#,##0';
      amtCell.alignment = { horizontal: 'right', indent: 1 };

      return `${amtLetter}${p.r}`;
    }
    // fallback find label
    const lbl = findCellContaining(key.replace(/_/g, ' '));
    if (lbl) {
      console.log(`[DEBUG] Found Label "${key.replace(/_/g, ' ')}" at R${lbl.r}C${lbl.c}`);
      const targetCol = amountColIndex || 8;
      const colLetter = String.fromCharCode(64 + targetCol);
      const cell = sheet.getCell(`${colLetter}${lbl.r}`);
      cell.value = Math.round(value);
      cell.numFmt = '#,##0';
      cell.alignment = { horizontal: 'right', indent: 1 };
      return `${colLetter}${lbl.r}`;
    }
    return null;
  }

  const subtotal = items.reduce((s, it, idx) => {
    // compute amount for the current item
    const amount = it.amount || ((it.rate / 31) * it.workingDays * it.persons);
    return s + amount;
  }, 0);
  const mgmt = subtotal * 0.15;
  const totalBefore = subtotal + mgmt;
  const cgst = totalBefore * 0.09;
  const sgst = totalBefore * 0.09;
  const total = totalBefore + cgst + sgst;

  replacePlaceholder('SUBTOTAL', subtotal);
  replacePlaceholder('MANAGEMENT', mgmt);
  replacePlaceholder('TOTAL_BEFORE_TAX', totalBefore);
  replacePlaceholder('CGST', cgst);
  replacePlaceholder('SGST', sgst);
  replacePlaceholder('GROSS_TOTAL', total);
  replacePlaceholder('TOTAL', total);

  // amount in words
  const words = numberToWords(Math.round(total));
  const wordsCell = findCellContaining('{{AMOUNT_IN_WORDS}}');
  if (wordsCell) {
    // Placeholder found (from prepare script)
    const colLetter = String.fromCharCode(64 + wordsCell.c);
    sheet.getCell(`${colLetter}${wordsCell.r}`).value = words;

    // Restore Label
    const labelRow = wordsCell.r - 2;
    if (labelRow > 0) {
      const lblCell = sheet.getCell(`A${labelRow}`);
      if (!lblCell.value || typeof lblCell.value === 'number') {
        lblCell.value = 'Amount Chargeble in words(INR) :';
      }
    }
  } else {
    // Fallback: look for label
    const lbl = findCellContaining('Chargeble in words'); // Search using same partial string
    if (lbl) {
      // Assuming value is 2 rows below in column A
      sheet.getCell(`A${lbl.r + 2}`).value = words;
    }
  }

  // clean any unexpected object values in columns H..J in the affected area (some readers render [object Object])
  const cleanStart = Math.max(1, startRow - 2);
  const cleanEnd = Math.min(sheet.rowCount, lastInserted + 50);
  for (let r = cleanStart; r <= cleanEnd; r++) {
    // for column H (8), only clear if it's an object type (not a number or string)
    if (sheet.columnCount >= 8) {
      try {
        const cell = sheet.getRow(r).getCell(8);
        // Only clear if the value is an object (not number/string/null/undefined)
        if (cell.value && typeof cell.value === 'object' && !Array.isArray(cell.value)) {
          cell.value = '';
        }
      } catch (e) { /* ignore */ }
    }
    // also clear columns 9-10 defensively (same logic)
    for (let c = 9; c <= Math.min(10, sheet.columnCount || 10); c++) {
      try {
        const cell = sheet.getRow(r).getCell(c);
        if (cell.value && typeof cell.value === 'object' && !Array.isArray(cell.value)) {
          cell.value = '';
        }
      } catch (e) { /* ignore */ }
    }
  }

  // add debug sheet
  const dbg = workbook.addWorksheet('GEN_DEBUG');
  dbg.getCell('A1').value = 'Template'; dbg.getCell('B1').value = template;
  dbg.getCell('A2').value = 'SelectedSheet'; dbg.getCell('B2').value = sheet.name;
  dbg.getCell('A3').value = 'InsertionRow'; dbg.getCell('B3').value = startRow;

  // collect debug JSON
  const debug = {
    template: template,
    sheet: sheet.name,
    insertionRow: startRow,
    headerRow: headerRow,
    headerMap: headerMap,
    sampleRow: sampleRow ? { index: sampleRow.number, height: sampleRow.height } : null,
    placeholders: {},
    pageSetup: sheet.pageSetup || null,
    columns: []
  };
  for (let ci = 1; ci <= Math.min(10, sheet.columnCount || 10); ci++) {
    const col = sheet.getColumn(ci);
    debug.columns.push({ index: ci, width: col && col.width ? col.width : null });
  }

  // capture placeholder positions
  const keys = ['{{SUBTOTAL}}', '{{MANAGEMENT}}', '{{TOTAL_BEFORE_TAX}}', '{{CGST}}', '{{SGST}}', '{{TOTAL}}', '{{AMOUNT_IN_WORDS}}'];
  for (const k of keys) {
    const p = findCellContaining(k);
    debug.placeholders[k] = p ? { r: p.r, c: p.c } : null;
  }

  // capture merges in the surrounding area (startRow - 10 .. startRow + 40)
  const merges = [];
  if (sheet._merges) {
    const mk = Array.from(sheet._merges.keys ? sheet._merges.keys() : Object.keys(sheet._merges));
    for (const m of mk) {
      merges.push(m);
    }
  }
  debug.merges = merges;

  const debugOutPath = out.replace(/\.xlsx$/, '.debug.json');
  require('fs').writeFileSync(debugOutPath, JSON.stringify(debug, null, 2));
  console.log('Wrote debug JSON to', debugOutPath);

  await workbook.xlsx.writeFile(out);
  console.log('Wrote', out);
}

run().catch(err => { console.error(err); process.exit(1); });