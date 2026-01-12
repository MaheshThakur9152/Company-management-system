/*
 * Analyze Excel templates and write JSON metadata about styles, merges, columns, rows, and sample cells.
 * Outputs JSON to frontend/temp/...
 */

const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');

async function analyze(filePath, outPath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const meta = {
    file: path.basename(filePath),
    sheets: []
  };

  for (const sheet of workbook.worksheets) {
    const sheetMeta = {
      name: sheet.name,
      rowCount: sheet.rowCount,
      columnCount: sheet.columnCount,
      pageSetup: sheet.pageSetup || null,
      columns: [],
      merges: [],
      sampleRows: [],
      namedRanges: []
    };

    // columns widths (first 50 cols)
    const colCap = Math.min(sheet.columnCount || 50, 50);
    for (let c = 1; c <= colCap; c++) {
      const col = sheet.getColumn(c);
      sheetMeta.columns.push({ index: c, width: col && col.width ? col.width : null });
    }

    // merges
    try {
      if (sheet._merges) {
        try {
          for (const key of Array.from(sheet._merges.keys())) {
            sheetMeta.merges.push(key);
          }
        } catch (e2) {
          // older exceljs might expose merges differently
          try {
            for (const k in sheet._merges) sheetMeta.merges.push(k);
          } catch (e3) { /* ignore */ }
        }
      }
    } catch (e) { /* ignore */ }

    // sample rows: first 60 rows or sheet.rowCount
    const maxR = Math.min(sheet.rowCount || 200, 200);
    const sampleRowLimit = Math.min(60, maxR);
    for (let r = 1; r <= sampleRowLimit; r++) {
      const row = sheet.getRow(r);
      const rowMeta = { r, height: row.height || null, cells: {} };
      const colLimit = Math.min(sheet.columnCount || 20, 20);
      for (let c = 1; c <= colLimit; c++) {
        const cell = row.getCell(c);
        if (!cell) continue;
        const cv = cell.value;
        let text = '';
        if (cv === null || cv === undefined) text = '';
        else if (typeof cv === 'object') {
          if (cv.richText) text = cv.richText.map(t => t.text).join('');
          else if (cv.text) text = cv.text;
          else if (cv.formula) text = String(cv.result || '') + ' (formula)';
          else text = JSON.stringify(cv);
        } else {
          text = String(cv);
        }
        const style = cell.style || {};
        rowMeta.cells[c] = {
          address: cell.address,
          value: text,
          font: style.font || null,
          alignment: style.alignment || null,
          border: style.border || null,
          fill: style.fill || null,
          numFmt: style.numFmt || null,
          isMerged: false
        };
        try {
          if (sheet._merges) {
            const mergeKeys = Array.from(sheet._merges.keys ? sheet._merges.keys() : Object.keys(sheet._merges));
            for (const mk of mergeKeys) if (mk.includes(cell.address)) { rowMeta.cells[c].isMerged = true; break; }
          }
        } catch (e) { /* ignore */ }
      }
      sheetMeta.sampleRows.push(rowMeta);
    }

    // extract named ranges/defined names
    try {
      if (workbook.definedNames && workbook.definedNames.model && workbook.definedNames.model.definedNames) {
        for (const dn of workbook.definedNames.model.definedNames) {
          sheetMeta.namedRanges.push(dn);
        }
      }
    } catch (e) { /* ignore */ }

    meta.sheets.push(sheetMeta);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(meta, null, 2), 'utf8');
  console.log('Wrote', outPath);
}

(async () => {
  try {
    const base = path.resolve(__dirname, '..', 'public');
    const real = path.join(base, 'Real-template.xlsx');
    const ambe = path.join(base, 'Template_bill_ambeservice.xlsx');
    await analyze(real, path.resolve(__dirname, '..', 'temp', 'real-template-analysis.json'));
    await analyze(ambe, path.resolve(__dirname, '..', 'temp', 'ambe-template-analysis.json'));
    console.log('Analysis complete');
  } catch (err) {
    console.error('Error analyzing templates:', err);
    process.exit(1);
  }
})();
