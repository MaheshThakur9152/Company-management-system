const ExcelJS = require('exceljs');
(async () => {
  const wb = new ExcelJS.Workbook();
  const path = '/home/mahesh/Company-management-system/frontend/public/elara.xlsx';
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet('SHREEYA') || wb.worksheets[0];
  console.log('A8:', ws.getCell('A8').value);
  console.log('A9:', ws.getCell('A9').value);
  console.log('A11:', ws.getCell('A11').value);
})();