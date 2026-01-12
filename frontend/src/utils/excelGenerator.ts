// Client-side Bill generation is deprecated in favor of server-side generation (billGenerator.js)
// This file now only supports Ledger generation and shared types.

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
  /** optional URL (relative to public/) or data URL for the company logo to use in PDFs */
  companyLogoUrl?: string;
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
  daysInMonth?: number; // optional: use for rate calculations if supplied
  // Template options (optional)
  templateUrl?: string;
  debug?: boolean;
}

/**
 * @deprecated Use server-side generation via /api/invoices/:id/download
 */
export const generateBillExcel = async (params: BillParams) => {
  console.error("Client-side generateBillExcel is deprecated. Please use the server-side API.");
  alert("This feature has been moved to the server to ensure correct formatting. Please update the application if you see this.");
  throw new Error("Client-side bill generation is disabled.");
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


