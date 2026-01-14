const ExcelJS = require('exceljs');
const path = require('path');
(async ()=>{
  const file = '/home/mahesh/Documents/Company-management-system/backend/Invoice_AS-25-26-200.xlsx';
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.readFile(file);
  } catch(e) { console.error('ERR_READ', e); process.exit(2); }
  console.log('WORKSHEETS:');
  wb.worksheets.forEach((ws, i)=>console.log(i, ws.name, 'rows', ws.rowCount, 'cols', ws.columnCount));
  const ws = wb.getWorksheet('SHREEYA') || wb.worksheets[0];
  console.log('USING SHEET:', ws.name);
  const cellsToCheck = ['F2','F3','F7','A8','A9','A11','A16','B16','H16','H22','H23','H24','H26','H28','H29','H31','A31'];
  cellsToCheck.forEach(c=>{
    const cell = ws.getCell(c);
    console.log(c, '->', JSON.stringify(cell.value));
  });
  // show rows 1..20 to inspect header/title and item rows
  console.log('\nROWS 1..20 DETAILS:');
  for(let r=1;r<=20;r++){
    const row = ws.getRow(r);
    const vals = [];
    for(let c=1;c<=10;c++) vals.push(row.getCell(c).value || '');
    console.log(r, vals.map(v=>{ try { return JSON.stringify(v).slice(0,50);}catch(e){return String(v);} }).join(' | '));
  }

  console.log('\nROW STYLES for item rows (rows 16..19)');
  for(let r=16;r<=19;r++){
    const row = ws.getRow(r);
    for(let c=2;c<=7;c++){
      const cell = row.getCell(c);
      if(cell && (cell.font || cell.border || cell.alignment)){
        console.log('R',r,'C',c, 'font', cell.font && cell.font.size, 'border', !!cell.border, 'align', !!cell.alignment);
      }
    }
  }

  // show header row 15
  console.log('\nROW 15 (header) DETAILS:');
  for(let c=1;c<=20;c++){
    const cell = ws.getRow(15).getCell(c);
    if(cell.value) console.log('Col',c, 'Addr', cell.address, 'Type', typeof cell.value, JSON.stringify(cell.value));
  }

  // show rows 16..18 in detail
  console.log('\nROWS 16..18 DETAILS:');
  for(let r=16;r<=18;r++){
    const row = ws.getRow(r);
    for(let c=1;c<=20;c++){
      const cell = row.getCell(c);
      if(cell.value) console.log('R',r,'C',c, cell.address, JSON.stringify(cell.value));
    }
  }

  // totals rows 22..30
  console.log('\nROWS 22..30 DETAILS:');
  for(let r=22;r<=30;r++){
    const row = ws.getRow(r);
    for(let c=1;c<=20;c++){
      const cell = row.getCell(c);
      if(cell.value) console.log('R',r,'C',c, cell.address, JSON.stringify(cell.value));
    }
  }
  // print names
  console.log('\nNAMES (defined names):');
  try{ 
    if(wb.definedNames) {
      wb.definedNames.forEach((name)=>console.log(name.name, name.ranges));
    } else console.log('No definedNames');
  } catch(e){console.log('ERR names',e)}
  // list tables
  console.log('\nTABLES:');
  try{ ws.model && ws.model.tables && console.log(ws.model.tables); }catch(e){console.log('ERR tables',e)}
})();