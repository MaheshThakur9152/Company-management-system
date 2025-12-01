const ExcelJS = require('exceljs');

async function listSheets() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile('F:/Ambe-app-go/Book2.xlsx');
    workbook.eachSheet((sheet, id) => {
        console.log(`Sheet ${id}: ${sheet.name}`);
    });
}

listSheets();
