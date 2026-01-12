const ExcelJS = require('exceljs');
(async()=>{
  const path = '/home/mahesh/Company-management-system/frontend/public/Invoice_PI-2025-11-5.xlsx';
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet('SHREEYA') || wb.worksheets[0];

  console.log('F2:', ws.getCell('F2').value);
  console.log('F3:', ws.getCell('F3').value);
  console.log('F7:', ws.getCell('F7').value);

  const f3 = ws.getCell('F3').value ? ws.getCell('F3').value.toString().replace('Date:','').trim() : '';
  const f7 = ws.getCell('F7').value ? ws.getCell('F7').value.toString() : '';

  let invDate = new Date(f3);
  console.log('Parsed invDate:', invDate.toString(), 'valid:', !isNaN(invDate));

  // Attempt to parse month+year from F7 (billing period)
  const bp = f7;
  const m = bp.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s,]*([0-9]{4})/i);
  if (m) {
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const found = m[1];
    const year = Number(m[2]);
    const monthIndex = monthNames.findIndex(x => new RegExp('^'+x,'i').test(found));
    const daysInBp = new Date(year, monthIndex+1, 0).getDate();
    console.log('Billing period parsed month:', found, year, 'monthIndex:', monthIndex, 'daysInMonth:', daysInBp);
  } else {
    console.log('No month found in F7');
  }

  // Compute daysInMonth by previous-month logic on invDate
  let daysPrev = new Date(invDate.getFullYear(), invDate.getMonth(), 0).getDate();
  console.log('Days in previous month (based on invoice date):', daysPrev);

  // Inspect rows starting at 16 for up to 10 rows with non-empty description
  const startRow = 16;
  for (let i=0;i<10;i++){
    const r = ws.getRow(startRow+i);
    const desc = r.getCell(2).value;
    if (!desc) break;
    const rate = Number(r.getCell(4).value||0);
    const days = Number(r.getCell(5).value||0);
    const persons = Number(r.getCell(7).value||0);
    const amountCell = Number(r.getCell(8).value||0);

    const perDay_prev = rate/daysPrev;
    const raw_prev = perDay_prev*days*persons;

    console.log(`Row ${startRow+i}: desc='${desc}', rate=${rate}, days=${days}, persons=${persons}, amount_cell=${amountCell}, recomputed_prev=${Math.round(raw_prev)} (raw ${raw_prev})`);
  }
})();