const path = require('path');
const ExcelJS = require('exceljs');
(async ()=>{
  const p = path.resolve(__dirname, '..','public','Template_bill_ambeservice.xlsx');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(p);
  const s = wb.worksheets.find(x=>/shreeya|invoice|proforma/i.test(x.name)) || wb.worksheets[0];
  console.log('Sheet:', s.name);
  for (let r=20; r<=36; r++) {
    const row = s.getRow(r);
    const vals = [];
    for (let c=1;c<=7;c++) {
      const cv = row.getCell(c).value;
      const v = (cv && typeof cv === 'object' && cv.richText) ? cv.richText.map(t=>t.text).join('') : String(cv||'');
      vals.push(v.replace(/\n/g,' '));
    }
    console.log(r, vals);
  }
  // individual placeholders
  const keys = ['{{LINE_ITEMS_START}}','{{SUBTOTAL}}','{{MANAGEMENT}}','{{TOTAL_BEFORE_TAX}}','{{CGST}}','{{SGST}}','{{TOTAL}}','{{AMOUNT_IN_WORDS}}'];
  for (const k of keys) {
    let found=false;
    for (let r=1;r<=s.rowCount;r++){
      const row = s.getRow(r);
      for (let c=1;c<=s.columnCount;c++){
        const cv = row.getCell(c).value;
        const v = (cv && typeof cv === 'object' && cv.richText) ? cv.richText.map(t=>t.text).join('') : String(cv||'');
        if (v && v.includes(k)) { console.log('Found',k,'at',r,c); found=true; break; }
      }
      if(found) break;
    }
    if(!found) console.log('Not found',k);
  }
})();