const ExcelJS = require('exceljs');
(async()=>{
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('/tmp/Invoice_sanjay_babli4.xlsx');
  const ws = wb.getWorksheet('SHREEYA') || wb.worksheets[0];
  let found = false;
  ws.eachRow((row) => {
    row.eachCell((cell) => {
      try {
        if (cell.value && cell.value.toString().toLowerCase().includes('sanjay')) {
          console.log('Found at row', row.number, 'cell', cell.address, 'value:', cell.value);
          found = true;
        }
      } catch (e) { }
    });
  });
  if (!found) console.log('No sanjay found');
})();