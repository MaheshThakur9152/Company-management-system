// Prepare templates: add stable placeholders and named ranges for reliable injection
const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

async function prepare(filePath) {
  console.log('Preparing', filePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  function selectBestSheet() {
    const sheets = workbook.worksheets;
    const preferred = sheets.find(s => /invoice|proforma|shreeya|sheet|bill/i.test(s.name));
    if (preferred) return preferred;
    // fallback to largest
    let best = sheets[0];
    let bestCount = -1;
    for (const s of sheets) {
      let used = 0;
      const cap = Math.min(s.rowCount || 100, 200);
      for (let r = 1; r <= cap; r++) {
        const row = s.getRow(r);
        for (let c = 1; c <= Math.max(row.cellCount || 10, 10); c++) {
          const v = row.getCell(c).value;
          if (v !== null && v !== undefined && String(v).trim() !== '') { used++; break; }
        }
      }
      if (used > bestCount) { best = s; bestCount = used; }
    }
    return best;
  }

  const sheet = selectBestSheet();

  // Find header row
  function findCellContaining(needle, exact = false) {
    const lowered = exact ? needle.toLowerCase() : needle.toLowerCase().trim();
    for (let r = 1; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r);
      for (let c = 1; c <= Math.max(row.cellCount || 20, 20); c++) {
        const cv = row.getCell(c).value;
        const val = (cv && typeof cv === 'object' && cv.richText) ? cv.richText.map(t => t.text).join('') : String(cv || '');
        const vLower = exact ? val.toLowerCase() : val.toLowerCase().trim();
        if (exact) {
          if (vLower === lowered) return { r, c, val };
        } else {
          if (vLower.includes(lowered)) return { r, c, val };
        }
      }
    }
    return null;
  }

  const header = findCellContaining('description') || findCellContaining('sr no') || findCellContaining('description of services') || findCellContaining('description of service');
  const startRow = header ? header.r + 2 : 17;

  // Backup original file
  const bak = filePath + '.bak';
  if (!fs.existsSync(bak)) fs.copyFileSync(filePath, bak);

  // Insert placeholder in column A at startRow
  sheet.getCell(`A${startRow}`).value = '{{LINE_ITEMS_START}}';
  // Note: Not adding a defined name due to exceljs limitations here; visible placeholder is sufficient for the injector to find the insertion point.
  console.log('Inserted LINE_ITEMS_START at', sheet.name, startRow);

  // Find footer labels and add named ranges to G column
  const labels = [
    { label: 'Sub Total', name: 'SUBTOTAL' },
    { label: 'Management charges', name: 'MANAGEMENT' },
    { label: 'Total', name: 'TOTAL_BEFORE_TAX', exact: true }, // Row 26 exact match
    { label: 'Add CGST', name: 'CGST' },
    { label: 'Add SGST', name: 'SGST' },
    { label: 'Total ', name: 'GROSS_TOTAL', exact: true }, // Row 32 exact match (with space?)
    { label: 'Total Amount', name: 'TOTAL' }, // Row 34
    { label: 'Chargeble in words', name: 'AMOUNT_IN_WORDS', offsetRow: 2, col: 'A' } // Label at 29, Value at 31
  ];

  for (const L of labels) {
    const found = findCellContaining(L.label, L.exact);
    if (found) {
      let row = found.r;
      let col = String.fromCharCode(64 + found.c);

      if (L.offsetRow) row += L.offsetRow;
      if (L.col) col = L.col;
      else if (L.name !== 'AMOUNT_IN_WORDS') col = 'H'; // Default to H for amounts

      sheet.getCell(`${col}${row}`).value = `{{${L.name}}}`;
      console.log('Set', L.name, '->', `${sheet.name}!$${col}$${row}`);
    } else {
      console.warn('Label not found for', L.label);
    }
  }

  await workbook.xlsx.writeFile(filePath);
  console.log('Patched', filePath);
}

(async () => {
  try {
    const base = path.resolve(__dirname, '..', 'public');
    const files = ['Real-template.xlsx', 'Template_bill_ambeservice.xlsx'];
    for (const f of files) {
      const p = path.join(base, f);
      if (!fs.existsSync(p)) { console.warn('Missing', p); continue; }
      await prepare(p);
    }
    console.log('All templates prepared');
  } catch (err) { console.error(err); process.exit(1); }
})();