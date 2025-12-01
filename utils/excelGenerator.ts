// import ExcelJS from 'exceljs';
// import { saveAs } from 'file-saver';

import { loadScript } from './scriptLoader';

export const ensureExcelJSLoaded = async () => {
  if ((window as any).ExcelJS) return (window as any).ExcelJS;
  await loadScript('https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js');
  if (!(window as any).ExcelJS) {
     throw new Error("ExcelJS loaded but window.ExcelJS is undefined");
  }
  return (window as any).ExcelJS;
};

export const ensureFileSaverLoaded = async () => {
  if ((window as any).saveAs) return (window as any).saveAs;
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js');
  if (!(window as any).saveAs) {
     throw new Error("FileSaver loaded but window.saveAs is undefined");
  }
  return (window as any).saveAs;
};

interface BillItem {
  description: string;
  hsn: string;
  rate: number;
  workingDays: number;
  persons: number;
  amount: number;
}

export interface BillParams {
  site: any;
  companyName?: string;
  invoiceType?: string;
  invoiceNo: string;
  date: string;
  billingPeriod: string;
  workOrderNo: string;
  workOrderDate: string;
  workOrderPeriod: string;
  items: BillItem[];
  managementRate: number;
  cgstRate: number;
  sgstRate: number;
  bankDetails?: {
    name: string;
    accNo: string;
    ifsc: string;
    branch: string;
  };
  terms?: string;
  signatory?: string;
}

const numberToWords = (num: number): string => {
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: any): string => {
    if ((n = n.toString()).length > 9) return 'overflow';
    const n_array: any[] = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/) || [];
    if (!n_array) return '';
    let str = '';
    str += (Number(n_array[1]) !== 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
    str += (Number(n_array[2]) !== 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[2][1]]) + 'Lakh ' : '';
    str += (Number(n_array[3]) !== 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
    str += (Number(n_array[4]) !== 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
    str += (Number(n_array[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
    return str;
  };

  const whole = Math.floor(num);
  const fraction = Math.round((num - whole) * 100);
  
  let result = inWords(whole);
  if (fraction > 0) {
      result += "and " + inWords(fraction) + "Paise ";
  }
  return result + "Only";
};

export const generateBillExcel = async (params: BillParams) => {
  const ExcelJS = await ensureExcelJSLoaded();
  const saveAs = await ensureFileSaverLoaded();

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Bill', {
    views: [{ showGridLines: false, style: 'pageLayout' }],
    pageSetup: {
        paperSize: 9, // A4
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 1,
        margins: {
            left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.1, footer: 0.1
        },
        horizontalCentered: true
    },
    properties: {
        defaultRowHeight: 15
    }
  });

  // Exact Column Widths from Book2.xlsx
  worksheet.columns = [
    { width: 5.29 },   // A
    { width: 27.86 },  // B
    { width: 9.57 },   // C
    { width: 8.43 },   // D
    { width: 9.43 },   // E
    { width: 13.57 },  // F
    { width: 22.29 }   // G
  ];

  // --- Styles ---
  const borderThin: any = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  };
  
  const fontBase = { name: 'Aptos Narrow', size: 11, color: { theme: 1 } };
  const fontBold = { name: 'Aptos Narrow', size: 11, bold: true, color: { theme: 1 } };
  const fontHeader = { name: 'Aptos Narrow', size: 18, color: { argb: 'FFFF0000' }, bold: true };

  // --- Row Heights (Shifted +1 from Book2 analysis because we keep Title at Row 1) ---
  worksheet.getRow(2).height = 24;    // Ref Row 1
  worksheet.getRow(14).height = 14.45; // Ref Row 13
  worksheet.getRow(16).height = 14.45; // Ref Row 15
  worksheet.getRow(30).height = 15;    // Ref Row 29
  worksheet.getRow(32).height = 14.65; // Ref Row 31
  worksheet.getRow(34).height = 14.65; // Ref Row 33
  worksheet.getRow(38).height = 15.75; // Ref Row 37
  worksheet.getRow(39).height = 15;    // Ref Row 38
  worksheet.getRow(41).height = 14.45; // Ref Row 40

  // --- Row 1: Title ---
  worksheet.mergeCells('A1:G1');
  const cellTitle = worksheet.getCell('A1');
  cellTitle.value = params.invoiceType || "TAX INVOICE"; 
  cellTitle.font = { name: 'Aptos Narrow', size: 14, bold: true };
  cellTitle.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // --- Header Section ---
  
  // Row 2: Company Name
  worksheet.mergeCells('A2:E2');
  const cellA2 = worksheet.getCell('A2');
  cellA2.value = params.companyName || 'AMBE SERVICE FACILITIES PRIVATE LIMITED';
  cellA2.font = fontHeader;
  cellA2.alignment = { horizontal: 'left', indent: 1 };
  cellA2.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  
  // Right side of Row 2 (F-G)
  worksheet.mergeCells('F2:G2');
  const cellF2 = worksheet.getCell('F2');
  cellF2.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }, left: { style: 'thin' } };


  // Row 3-6: Address
  const addressLines = [
    "Shop No - 49 A, Ground Floor, Pooja Enclave CHS Ltd, ",
    "Ganesh Nagar, Kandivali (West), Mumbai 400 067.",
    "Contact No: 022 45066566 / 9619607537",
    "Email : contact@ambeservice.com / Website : ambeservice.com"
  ];

  addressLines.forEach((line, idx) => {
    const row = idx + 3;
    worksheet.mergeCells(`A${row}:E${row}`);
    const cell = worksheet.getCell(`A${row}`);
    cell.value = line;
    cell.font = fontBase;
    cell.alignment = { horizontal: 'left', vertical: 'top', indent: 1 };
    cell.border = { left: { style: 'thin' }, right: { style: 'thin' } };
    
    // Right side F-G
    if (row === 3 || row === 6) {
        worksheet.mergeCells(`F${row}:G${row}`);
        worksheet.getCell(`F${row}`).border = { right: { style: 'thin' }, left: { style: 'thin' } };
    }
  });

  // Invoice Details (Right Side)
  // F4: Proforma Invoice No
  worksheet.mergeCells('F4:G4');
  const cellF4 = worksheet.getCell('F4');
  cellF4.value = `Invoice No :  ${params.invoiceNo}`;
  cellF4.font = fontBase;
  cellF4.alignment = { horizontal: 'left', indent: 1 };
  cellF4.border = { left: { style: 'thin' }, right: { style: 'thin' } };

  // F5: Date
  worksheet.mergeCells('F5:G5');
  const cellF5 = worksheet.getCell('F5');
  cellF5.value = `Date:  ${params.date}`;
  cellF5.font = fontBase;
  cellF5.alignment = { horizontal: 'left', indent: 1 };
  cellF5.border = { left: { style: 'thin' }, right: { style: 'thin' } };

  // Row 7: CIN
  worksheet.mergeCells('A7:E7');
  const cellA7 = worksheet.getCell('A7');
  cellA7.value = "CIN NO. : U80200MH2023PTC412420";
  cellA7.font = fontBase;
  cellA7.alignment = { horizontal: 'left', indent: 1 };
  cellA7.border = { left: { style: 'thin' }, right: { style: 'thin' } };
  
  worksheet.mergeCells('F7:G7');
  worksheet.getCell('F7').border = { left: { style: 'thin' }, right: { style: 'thin' } };

  // Row 8: GSTIN & Billing Period
  worksheet.mergeCells('A8:E8');
  const cellA8 = worksheet.getCell('A8');
  cellA8.value = "GSTIN :  27AAZCA5609F1ZA";
  cellA8.font = fontBase;
  cellA8.alignment = { horizontal: 'left', indent: 1 };
  cellA8.border = { left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells('F8:G8');
  const cellF8 = worksheet.getCell('F8');
  cellF8.value = `Billing Period :${params.billingPeriod}`;
  cellF8.font = fontBase;
  cellF8.alignment = { horizontal: 'left', indent: 1 };
  cellF8.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

  // Row 9: Name & Add of Party Header
  worksheet.mergeCells('A9:E9');
  const cellA9 = worksheet.getCell('A9');
  cellA9.value = "Name & Add of Party";
  cellA9.font = { ...fontBase, size: 10 };
  cellA9.alignment = { horizontal: 'left', indent: 1 };
  cellA9.border = { left: { style: 'thin' }, top: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells('F9:G9');
  const cellF9 = worksheet.getCell('F9');
  cellF9.value = "Work Order Ref No. :";
  cellF9.font = { ...fontBase, size: 10 };
  cellF9.alignment = { horizontal: 'left', indent: 1 };
  cellF9.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' } };

  // Row 10: Client Name & Work Order No
  worksheet.mergeCells('A10:E10');
  const cellA10 = worksheet.getCell('A10');
  cellA10.value = params.site.clientName || "Lokhandwala Minerva CHS LTD (Prop.)"; 
  cellA10.font = fontBold;
  cellA10.alignment = { horizontal: 'left', indent: 1 };
  cellA10.border = { left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells('F10:G10');
  const cellF10 = worksheet.getCell('F10');
  cellF10.value = params.workOrderNo;
  cellF10.font = { name: 'Bookman Old Style', size: 10 };
  cellF10.alignment = { horizontal: 'center' };
  cellF10.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

  // Row 11: Client Address & Work Order Period Header
  worksheet.mergeCells('A11:E11');
  const cellA11 = worksheet.getCell('A11');
  cellA11.value = params.site.location || "J.R. Boricha Marg. Mahalaxmi, Mumbai- 400011.";
  cellA11.font = { ...fontBase, size: 10 };
  cellA11.alignment = { horizontal: 'left', indent: 1 };
  cellA11.border = { left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells('F11:G11');
  const cellF11 = worksheet.getCell('F11');
  cellF11.value = "Work Order Period : ";
  cellF11.font = fontBase;
  cellF11.alignment = { horizontal: 'left', indent: 1 };
  cellF11.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' } };

  // Row 12: Client GSTIN & Work Order Period Value
  worksheet.mergeCells('A12:E12');
  const cellA12 = worksheet.getCell('A12');
  cellA12.value = `GSTIN : ${params.site.clientGstin || '27AAACL5105AIZ7'}`;
  cellA12.font = { ...fontBase, size: 10 };
  cellA12.alignment = { horizontal: 'left', indent: 1 };
  cellA12.border = { left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells('F12:G12');
  const cellF12 = worksheet.getCell('F12');
  cellF12.value = params.workOrderPeriod;
  cellF12.font = fontBase;
  cellF12.alignment = { wrapText: true, horizontal: 'left', indent: 1 };
  cellF12.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

  // Row 13-14: Greeting Text
  worksheet.mergeCells('A13:G14');
  const cellA13 = worksheet.getCell('A13');
  cellA13.value = "We thank you very much for valuable interest shown in our organzaion. We would like to submit  our bill for providing our services.";
  cellA13.font = fontBase;
  cellA13.alignment = { wrapText: true, vertical: 'top', horizontal: 'left', indent: 1 };
  cellA13.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };

  // --- Table Header (Row 15-16) ---
  const headers = ["Sr No", "Description of Services", "HSN \nCode", "Rate", "Working\n Days", "Persons", "Amount \n(RS)"];
  const headerRow = worksheet.getRow(15);
  headerRow.values = headers;
  
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
    worksheet.mergeCells(`${col}15:${col}16`);
    const cell = worksheet.getCell(`${col}15`);
    cell.font = fontBase;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = borderThin;
  });

  // --- Items (Row 17 onwards) ---
  let currentRow = 17;
  let subTotalRow = 0;

  params.items.forEach((item, index) => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = index + 1;
    row.getCell(2).value = item.description;
    row.getCell(3).value = item.hsn;
    row.getCell(4).value = item.rate;
    row.getCell(5).value = item.workingDays;
    row.getCell(6).value = item.persons > 0 ? item.persons : null;
    
    if (item.description.toLowerCase().includes('overtime')) {
        row.getCell(7).value = { formula: `E${currentRow}*(D${currentRow}/31/9)` };
    } else {
        row.getCell(7).value = { formula: `E${currentRow}*(D${currentRow}/31)` };
    }

    // Apply styles to all cells in the row (1-7) explicitly to ensure borders are drawn even for empty cells
    for (let i = 1; i <= 7; i++) {
        const cell = row.getCell(i);
        cell.font = fontBase;
        cell.border = borderThin;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    row.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    row.getCell(7).alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
    row.getCell(7).numFmt = '0.00';
    row.getCell(4).numFmt = '#,##0';

    currentRow++;
  });

  // Fill empty rows
  while (currentRow < 28) {
    const row = worksheet.getRow(currentRow);
    for (let i = 1; i <= 7; i++) {
        const cell = row.getCell(i);
        cell.value = ''; // Ensure cell is written
        cell.border = { left: { style: 'thin' }, right: { style: 'thin' } };
    }
    currentRow++;
  }

  // --- Totals Section ---
  subTotalRow = currentRow;
  
  // Sub Total
  worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
  const cellSubTotal = worksheet.getCell(`D${currentRow}`);
  cellSubTotal.value = "Sub Total";
  cellSubTotal.font = fontBase;
  cellSubTotal.alignment = { horizontal: 'left', indent: 1 };
  cellSubTotal.border = { left: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  const cellSubTotalVal = worksheet.getCell(`G${currentRow}`);
  cellSubTotalVal.value = { formula: `SUM(G17:G${currentRow-1})` };
  cellSubTotalVal.numFmt = '0.00';
  cellSubTotalVal.alignment = { horizontal: 'right', indent: 1 };
  cellSubTotalVal.border = borderThin;
  
  // Borders for empty left cells (A, B, C)
  ['A', 'B', 'C'].forEach(col => {
      worksheet.getCell(`${col}${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' } };
  });

  currentRow++;

  // Management Charges
  worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
  const cellMgmt = worksheet.getCell(`D${currentRow}`);
  cellMgmt.value = `Management charges @ ${params.managementRate}%`;
  cellMgmt.font = fontBase;
  cellMgmt.alignment = { horizontal: 'left', indent: 1 };
  cellMgmt.border = { left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  
  const cellMgmtVal = worksheet.getCell(`G${currentRow}`);
  cellMgmtVal.value = { formula: `G${subTotalRow}*${params.managementRate}%` };
  cellMgmtVal.numFmt = '0.00';
  cellMgmtVal.alignment = { horizontal: 'right', indent: 1 };
  cellMgmtVal.border = borderThin;

  // Borders for empty left cells
  ['A', 'B', 'C'].forEach(col => {
      worksheet.getCell(`${col}${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
  });

  currentRow++;

  // Bank Details Header
  worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
  const cellBankHeader = worksheet.getCell(`A${currentRow}`);
  cellBankHeader.value = "Bank Details";
  cellBankHeader.font = fontBold;
  cellBankHeader.alignment = { horizontal: 'left', indent: 1 };
  cellBankHeader.border = { left: { style: 'thin' }, top: { style: 'thin' }, right: { style: 'thin' } };
  
  worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
  const cellTotalLabel = worksheet.getCell(`D${currentRow}`);
  cellTotalLabel.value = "Total ";
  cellTotalLabel.font = fontBold;
  cellTotalLabel.alignment = { horizontal: 'left', indent: 1 };
  cellTotalLabel.border = { left: { style: 'thin' }, top: { style: 'thin' }, right: { style: 'thin' } };
  
  const totalBeforeTaxRow = currentRow;
  const cellTotalVal = worksheet.getCell(`G${currentRow}`);
  cellTotalVal.value = { formula: `G${subTotalRow}+G${subTotalRow+1}` };
  cellTotalVal.numFmt = '0.00';
  cellTotalVal.alignment = { horizontal: 'right', indent: 1 };
  cellTotalVal.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };
  
  currentRow++;

  // Bank Name & CGST
  worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
  const cellBankName = worksheet.getCell(`A${currentRow}`);
  cellBankName.value = `Bank Name :  ${params.bankDetails?.name || 'Axis bank'}`;
  cellBankName.font = { ...fontBase, size: 10 };
  cellBankName.alignment = { horizontal: 'left', indent: 1 };
  cellBankName.border = { left: { style: 'thin' }, right: { style: 'thin' } };
  
  worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
  const cellCgst = worksheet.getCell(`D${currentRow}`);
  cellCgst.value = `Add CGST @ ${params.cgstRate}%`;
  cellCgst.font = fontBold;
  cellCgst.alignment = { horizontal: 'left', indent: 1 };
  cellCgst.border = { left: { style: 'thin' }, right: { style: 'thin' } };

  const cgstRow = currentRow;
  const cellCgstVal = worksheet.getCell(`G${currentRow}`);
  cellCgstVal.value = { formula: `G${totalBeforeTaxRow}*${params.cgstRate}%` };
  cellCgstVal.numFmt = '0.00';
  cellCgstVal.alignment = { horizontal: 'right', indent: 1 };
  cellCgstVal.border = borderThin;
  currentRow++;

  // Acc No & SGST
  worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
  const cellAcc = worksheet.getCell(`A${currentRow}`);
  cellAcc.value = `Acc no : ${params.bankDetails?.accNo || '924020001871570'}`;
  cellAcc.font = { ...fontBase, size: 10 };
  cellAcc.alignment = { horizontal: 'left', indent: 1 };
  cellAcc.border = { left: { style: 'thin' }, right: { style: 'thin' } };

  worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
  const cellSgst = worksheet.getCell(`D${currentRow}`);
  cellSgst.value = `Add SGST @ ${params.sgstRate}%`;
  cellSgst.font = fontBold;
  cellSgst.alignment = { horizontal: 'left', indent: 1 };
  cellSgst.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

  const sgstRow = currentRow;
  const cellSgstVal = worksheet.getCell(`G${currentRow}`);
  cellSgstVal.value = { formula: `G${totalBeforeTaxRow}*${params.sgstRate}%` };
  cellSgstVal.numFmt = '0.00';
  cellSgstVal.alignment = { horizontal: 'right', indent: 1 };
  cellSgstVal.border = { right: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, top: { style: 'thin' } };
  currentRow++;

  // IFSC & Empty
  worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
  const cellIfsc = worksheet.getCell(`A${currentRow}`);
  cellIfsc.value = `IFSC Code: ${params.bankDetails?.ifsc || 'UTIB0001572'}   Branch: ${params.bankDetails?.branch || 'kandivali west,Link Road.'}`;
  cellIfsc.font = { ...fontBase, size: 10 };
  cellIfsc.alignment = { horizontal: 'left', indent: 1 };
  cellIfsc.border = { left: { style: 'thin' }, right: { style: 'thin' } };

  // Empty D-G
  worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
  worksheet.getCell(`D${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getCell(`G${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' } };
  currentRow++;

  // Amount in Words Header
  worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
  const cellWordsHeader = worksheet.getCell(`A${currentRow}`);
  cellWordsHeader.value = "Amount Chargeble in words(INR) : ";
  cellWordsHeader.font = fontBold;
  cellWordsHeader.alignment = { horizontal: 'left', indent: 1 };
  cellWordsHeader.border = { left: { style: 'thin' }, top: { style: 'thin' }, right: { style: 'thin' } };
  
  // Empty D-G
  worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
  worksheet.getCell(`D${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.getCell(`G${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' } };
  currentRow++; 
  
  // Calculate Grand Total for Words
  const subTotalVal = params.items.reduce((sum, item) => {
      let amt = 0;
      if (item.description.toLowerCase().includes('overtime')) {
          amt = item.workingDays * (item.rate / 31 / 9);
      } else {
          amt = item.workingDays * (item.rate / 31);
      }
      return sum + amt;
  }, 0);
  const mgmtVal = subTotalVal * (params.managementRate / 100);
  const totalBeforeTaxVal = subTotalVal + mgmtVal;
  const cgstVal = totalBeforeTaxVal * (params.cgstRate / 100);
  const sgstVal = totalBeforeTaxVal * (params.sgstRate / 100);
  const grandTotalVal = totalBeforeTaxVal + cgstVal + sgstVal;

  // Amount in Words Value
  worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
  const cellWords = worksheet.getCell(`A${currentRow}`);
  cellWords.value = numberToWords(grandTotalVal);
  cellWords.font = { ...fontBase, size: 10 };
  cellWords.alignment = { horizontal: 'left', indent: 1 };
  cellWords.border = { left: { style: 'thin' }, right: { style: 'thin' } };
  
  // Total Amount Label
  worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
  const cellGrandTotalLabel = worksheet.getCell(`D${currentRow}`);
  cellGrandTotalLabel.value = "Total Amount";
  cellGrandTotalLabel.font = fontBold;
  cellGrandTotalLabel.alignment = { horizontal: 'left', indent: 1 };
  cellGrandTotalLabel.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };
  
  const cellGrandTotalVal = worksheet.getCell(`G${currentRow}`);
  cellGrandTotalVal.value = { formula: `SUM(G${totalBeforeTaxRow}+G${cgstRow}+G${sgstRow})` };
  cellGrandTotalVal.numFmt = '#,##0';
  cellGrandTotalVal.alignment = { horizontal: 'right', indent: 1 };
  cellGrandTotalVal.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };
  cellGrandTotalVal.font = fontBase;
  currentRow++;

  // Another row for words if needed (Empty)
  worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
  const cellWords2 = worksheet.getCell(`A${currentRow}`);
  cellWords2.value = "Only"; 
  cellWords2.border = { left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  
  // Empty D-G
  worksheet.mergeCells(`D${currentRow}:F${currentRow}`);
  worksheet.getCell(`D${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
  worksheet.getCell(`G${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
  currentRow++;

  // Spacer Row
  worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
  worksheet.getCell(`A${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' } };
  worksheet.mergeCells(`D${currentRow}:G${currentRow}`);
  worksheet.getCell(`D${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' } };
  currentRow++;

  // Terms & Conditions
  const termsStartRow = currentRow;
  worksheet.mergeCells(`A${currentRow}:C${currentRow+5}`);
  const termsCell = worksheet.getCell(`A${currentRow}`);
  termsCell.value = params.terms || "Terms & condition : \nPayment can only be done in cheque/DD, NEFT, RTGS ";
  termsCell.font = fontBase;
  termsCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true, indent: 1 };
  termsCell.border = { left: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  // Signatory
  worksheet.mergeCells(`D${currentRow}:G${currentRow+5}`);
  const signCell = worksheet.getCell(`D${currentRow}`);
  signCell.value = params.signatory || "For Ambe Service Facilities Pvt Ltd  \n\n\n\n\nAuthorized signatory\n";
  signCell.font = fontBase;
  signCell.alignment = { vertical: 'top', horizontal: 'right', wrapText: true, indent: 1 };
  signCell.border = { left: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

  // Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Sanitize site name for filename
  const sanitizedSiteName = params.site.name 
    ? params.site.name.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_') 
    : 'Site';
    
  saveAs(blob, `${sanitizedSiteName}_Invoice_${params.invoiceNo.replace(/\//g, '-')}.xlsx`);
};

export interface LedgerTransaction {
  date: string;
  particulars: string;
  vchType: string;
  vchNo: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface LedgerParams {
  companyName: string;
  accountName: string;
  period: string;
  transactions: LedgerTransaction[];
}

export const generateLedgerExcel = async (params: LedgerParams) => {
  const ExcelJS = await ensureExcelJSLoaded();
  const saveAs = await ensureFileSaverLoaded();
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Ledger', {
    views: [{ showGridLines: false }],
    pageSetup: {
        paperSize: 9, // A4
        orientation: 'portrait',
        fitToPage: true,
        fitToWidth: 1,
        margins: {
            left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3
        }
    }
  });

  // Columns
  worksheet.columns = [
    { width: 12 }, // Date
    { width: 40 }, // Particulars
    { width: 10 }, // Vch Type
    { width: 15 }, // Vch No
    { width: 15 }, // Debit
    { width: 15 }, // Credit
    { width: 15 }  // Balance
  ];

  // Styles
  const fontHeader = { name: 'Arial', size: 14, bold: true };
  const fontSubHeader = { name: 'Arial', size: 11, bold: true };
  const fontNormal = { name: 'Arial', size: 10 };
  const borderThin: any = {
    top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
  };

  // Header
  worksheet.mergeCells('A1:G1');
  const cellTitle = worksheet.getCell('A1');
  cellTitle.value = params.companyName;
  cellTitle.font = fontHeader;
  cellTitle.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A2:G2');
  const cellAddress = worksheet.getCell('A2');
  cellAddress.value = "Shop No - 49 A, Ground Floor, Pooja Enclave CHS Ltd, Ganesh Nagar, Kandivali (West), Mumbai 400 067.";
  cellAddress.font = { name: 'Arial', size: 9 };
  cellAddress.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A3:G3');
  const cellAccount = worksheet.getCell('A3');
  cellAccount.value = params.accountName;
  cellAccount.font = fontSubHeader;
  cellAccount.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A4:G4');
  const cellLedgerLabel = worksheet.getCell('A4');
  cellLedgerLabel.value = "Ledger Account";
  cellLedgerLabel.font = fontNormal;
  cellLedgerLabel.alignment = { horizontal: 'center' };

  worksheet.mergeCells('A5:G5');
  const cellPeriod = worksheet.getCell('A5');
  cellPeriod.value = params.period;
  cellPeriod.font = fontNormal;
  cellPeriod.alignment = { horizontal: 'center' };

  // Table Header
  const headers = ['Date', 'Particulars', 'Vch Type', 'Vch No.', 'Debit', 'Credit', 'Balance'];
  const headerRow = worksheet.getRow(7);
  headerRow.values = headers;
  headerRow.eachCell((cell) => {
    cell.font = { ...fontNormal, bold: true };
    cell.border = { bottom: { style: 'thin' }, top: { style: 'thin' } };
    cell.alignment = { horizontal: 'center' };
  });

  // Transactions
  let currentRow = 8;
  let totalDebit = 0;
  let totalCredit = 0;

  params.transactions.forEach(txn => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = new Date(txn.date).toLocaleDateString('en-GB');
    
    // Add To/By prefix logic
    let particulars = txn.particulars;
    if (txn.debit > 0) particulars = `To ${particulars}`;
    else if (txn.credit > 0) particulars = `By ${particulars}`;
    
    row.getCell(2).value = particulars;
    row.getCell(3).value = txn.vchType;
    row.getCell(4).value = txn.vchNo;
    row.getCell(5).value = txn.debit || null;
    row.getCell(6).value = txn.credit || null;
    
    // Format Balance
    const balAbs = Math.abs(txn.balance);
    const drCr = txn.balance > 0 ? 'Dr' : 'Cr';
    row.getCell(7).value = `${balAbs.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${drCr}`;

    // Alignment
    row.getCell(1).alignment = { horizontal: 'center' };
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'center' };
    row.getCell(5).alignment = { horizontal: 'right' };
    row.getCell(6).alignment = { horizontal: 'right' };
    row.getCell(7).alignment = { horizontal: 'right' };

    // Number format
    row.getCell(5).numFmt = '#,##0.00';
    row.getCell(6).numFmt = '#,##0.00';

    totalDebit += txn.debit;
    totalCredit += txn.credit;
    currentRow++;
  });

  // Totals
  const totalRow = worksheet.getRow(currentRow);
  totalRow.getCell(2).value = 'Total';
  totalRow.getCell(2).font = { ...fontNormal, bold: true };
  totalRow.getCell(2).alignment = { horizontal: 'right' };
  
  totalRow.getCell(5).value = totalDebit;
  totalRow.getCell(5).font = { ...fontNormal, bold: true };
  totalRow.getCell(5).numFmt = '#,##0.00';
  
  totalRow.getCell(6).value = totalCredit;
  totalRow.getCell(6).font = { ...fontNormal, bold: true };
  totalRow.getCell(6).numFmt = '#,##0.00';

  totalRow.getCell(5).border = { top: { style: 'thin' }, bottom: { style: 'double' } };
  totalRow.getCell(6).border = { top: { style: 'thin' }, bottom: { style: 'double' } };

  // Closing Balance
  currentRow += 2;
  const closingRow = worksheet.getRow(currentRow);
  const closingBal = params.transactions.length > 0 ? params.transactions[params.transactions.length - 1].balance : 0;
  const closingBalAbs = Math.abs(closingBal);
  const closingDrCr = closingBal > 0 ? 'Dr' : 'Cr';
  
  closingRow.getCell(6).value = 'Closing Balance:';
  closingRow.getCell(6).font = { ...fontNormal, bold: true };
  closingRow.getCell(7).value = `${closingBalAbs.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${closingDrCr}`;
  closingRow.getCell(7).font = { ...fontNormal, bold: true };
  closingRow.getCell(7).alignment = { horizontal: 'right' };

  // Save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const sanitizedAccount = params.accountName.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
  saveAs(blob, `Ledger_${sanitizedAccount}.xlsx`);
};
