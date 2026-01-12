const path = require('path');
const fs = require('fs');
const ExcelJS = require('exceljs');
async function analyzeOne(filePath, outPath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const meta = { file: path.basename(filePath), sheets: [] };
  for (const sheet of workbook.worksheets) {
    const sheetMeta = { name: sheet.name, rowCount: sheet.rowCount, columnCount: sheet.columnCount, sampleRows: [], merges: [] };
    const maxR = Math.min(sheet.rowCount || 200, 200);
    for (let r = 1; r <= Math.min(60, maxR); r++) {
      const row = sheet.getRow(r);
      const rowMeta = { r, height: row.height || null, vals: [] };
      for (let c = 1; c <= Math.min(10, sheet.columnCount || 10); c++) {
        const cv = row.getCell(c).value;
        const v = (cv && typeof cv === 'object' && cv.richText) ? cv.richText.map(t => t.text).join('') : String(cv || '');
        rowMeta.vals.push(v);
      }
      sheetMeta.sampleRows.push(rowMeta);
    }
    if (sheet.model && sheet.model.merges) {
      sheetMeta.merges = sheet.model.merges;
    } else if (sheet._merges) {
      // Fallback
      try { for (const k of Array.from(sheet._merges.keys())) sheetMeta.merges.push(k); } catch (e) { for (const k in sheet._merges) sheetMeta.merges.push(k); }
    }
    meta.sheets.push(sheetMeta);
  }
  fs.writeFileSync(outPath, JSON.stringify(meta, null, 2));
  console.log('Wrote', outPath);
}
(async () => {
  const inFile = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, '..', 'temp', 'test_generated_invoice.xlsx');
  const outFile = process.argv[3] ? path.resolve(process.argv[3]) : path.resolve(__dirname, '..', 'temp', 'test_generated_invoice-analysis.json');
  await analyzeOne(inFile, outFile);
})();