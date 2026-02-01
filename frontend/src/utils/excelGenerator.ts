import { loadScript } from './scriptLoader';

export const ensureExcelJSLoaded = async () => {
  if ((window as any).ExcelJS) return (window as any).ExcelJS;
  await loadScript('https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js');
  return (window as any).ExcelJS;
};

export const ensureFileSaverLoaded = async () => {
  if ((window as any).saveAs) return (window as any).saveAs;
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js');
  return (window as any).saveAs;
};

export interface BillParams {
  site: any;
  companyName?: string;
  invoiceNo: string;
  date: string;
  billingPeriod: string;
  workOrderNo: string;
  workOrderDate: string;
  workOrderPeriod: string;
  items: any[];
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
  daysInMonth?: number;
}

export const generateBillExcel = async (params: BillParams) => {
  console.log('GENERATE BILL EXCEL STARTED v14 - INSERT ROW', params);

  const ExcelJS = await ensureExcelJSLoaded();
  const saveAs = await ensureFileSaverLoaded();

  function numberToWords(num: number): string {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (n: any): string => {
      if ((n = n.toString()).length > 9) return 'overflow';
      const n_array: any[] = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/) || [];
      if (!n_array) return '';
      let str = '';
      str += (Number(n_array[1]) !== 0) ? (a[Number(n_array[1])] || b[n_array[1][0]] + ' ' + a[n_array[1][1]]) + 'Crore ' : '';
      str += (Number(n_array[2]) !== 0) ? (a[Number(n_array[2])] || b[n_array[2][0]] + ' ' + a[n_array[1][1]]) + 'Lakh ' : '';
      str += (Number(n_array[3]) !== 0) ? (a[Number(n_array[3])] || b[n_array[3][0]] + ' ' + a[n_array[3][1]]) + 'Thousand ' : '';
      str += (Number(n_array[4]) !== 0) ? (a[Number(n_array[4])] || b[n_array[4][0]] + ' ' + a[n_array[4][1]]) + 'Hundred ' : '';
      str += (Number(n_array[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n_array[5])] || b[n_array[5][0]] + ' ' + a[n_array[5][1]]) : '';
      return str;
    };
    const whole = Math.floor(num);
    const fraction = Math.round((num - whole) * 100);
    let res = inWords(whole);
    if (fraction > 0) res += "and " + inWords(fraction) + "Paise ";
    return res + "Only";
  }

  const templateUrl = (params as any).templateUrl || '/Template_bill_ambeservice.xlsx';

  try {
    const resp = await fetch(templateUrl);
    if (!resp.ok) throw new Error('Template fetch failed');
    const buffer = await resp.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Pick the sheet with the most data
    let worksheet = workbook.worksheets[0];
    let maxFilled = -1;
    workbook.worksheets.forEach(ws => {
      let count = 0;
      for (let r = 1; r <= 20; r++) for (let c = 1; c <= 10; c++) if (ws.getRow(r).getCell(c).value) count++;
      if (count > maxFilled) { maxFilled = count; worksheet = ws; }
    });

    const getVal = (cell: any): string => {
      const v = cell.value;
      if (!v) return '';
      if (typeof v === 'object' && v.richText) return v.richText.map((t: any) => t.text).join('').trim();
      return String(v).trim();
    };

    const safeWrite = (r: number, c: number, val: any, style?: any) => {
      let cell = worksheet.getRow(r).getCell(c);
      if (cell.isMerged && cell.master) cell = worksheet.getCell(cell.master.address);
      cell.value = val;
      if (style) {
        if (style.font) cell.font = { ...cell.font, ...style.font };
        if (style.align) cell.alignment = { ...cell.alignment, ...style.align };
        if (style.numFmt) cell.numFmt = style.numFmt;
      }
      return cell;
    };

    const findCell = (needle: string) => {
      const n = needle.toLowerCase();
      for (let r = 1; r <= 100; r++) {
        const row = worksheet.getRow(r);
        for (let c = 1; c <= 20; c++) {
          if (getVal(row.getCell(c)).toLowerCase().includes(n)) return { r, c };
        }
      }
      return null;
    };

    // Replace basic info
    const compName = params.companyName || 'AMBE SERVICE';
    const compFont = { bold: true, size: 14, color: compName.includes('PRIVATE') ? { argb: 'FFFF0000' } : undefined };

    workbook.worksheets.forEach(ws => {
      for (let r = 1; r <= 15; r++) {
        for (let c = 1; c <= 15; c++) {
          const cell = ws.getRow(r).getCell(c);
          if (getVal(cell).toUpperCase().includes('AMBE')) {
            let target = cell.isMerged && cell.master ? ws.getCell(cell.master.address) : cell;
            target.value = compName;
            target.font = { ...target.font, ...compFont };
          }
        }
      }
    });

    const descCell = findCell('description');
    const startRow = (descCell?.r || 15) + 1;

    // Load Utils
    // @ts-ignore
    const { calculateBillableDays, computeLineAmount, computeFooterTotals, getHeaderKey } = await import('./calculationUtils');

    const headerRowNum = descCell?.r || 15;
    const headerMap: Record<string, number> = { sr_no: 1, description: 2, hsn: 3, rate: 4, working_days: 5, persons: 6, amount: 7 };
    const hRow = worksheet.getRow(headerRowNum);
    for (let c = 1; c <= 12; c++) {
      const k = getHeaderKey(getVal(hRow.getCell(c)));
      if (k) headerMap[k] = c;
    }

    const dm = params.daysInMonth || 31;
    let totalAmt = 0;
    const items = params.items || [];

    // Clear area first containing items
    for (let r = startRow; r <= startRow + items.length + 5; r++) {
      const row = worksheet.getRow(r);
      const v1 = getVal(row.getCell(1)).toLowerCase();
      if (v1.includes('sub total') || v1.includes('bank') || v1.includes('material')) break;
      row.getCell(headerMap.sr_no).value = null;
      row.getCell(headerMap.description).value = null;
      row.getCell(headerMap.amount).value = null;
    }

    items.forEach((item, i) => {
      const r = startRow + i;
      let days = item.workingDays;
      if (item.attendance) days = calculateBillableDays(item.attendance, dm);
      const amt = item.amount || computeLineAmount(item.rate, days, item.persons, dm);
      totalAmt += amt;

      const rCol = String.fromCharCode(64 + headerMap.rate);
      const dCol = String.fromCharCode(64 + headerMap.working_days);

      safeWrite(r, headerMap.sr_no, i + 1, { align: { horizontal: 'center' } });
      safeWrite(r, headerMap.description, item.description, { align: { horizontal: 'left' } });
      if (item.hsn) safeWrite(r, headerMap.hsn, item.hsn, { align: { horizontal: 'center' } });
      safeWrite(r, headerMap.rate, item.rate, { numFmt: '#,##0' });
      safeWrite(r, headerMap.working_days, days, { align: { horizontal: 'center' } });
      safeWrite(r, headerMap.persons, item.persons, { align: { horizontal: 'center' } });

      const amtCell = safeWrite(r, headerMap.amount, amt, { numFmt: '#,##0' });
      amtCell.value = { formula: `ROUND((${rCol}${r}/${dm})*${dCol}${r}, 0)`, result: amt };
    });

    const lastItemRow = startRow + items.length;
    const foot = computeFooterTotals(totalAmt, params.managementRate, params.cgstRate, params.sgstRate);

    const subTotalCell = findCell('sub total');
    if (subTotalCell) safeWrite(subTotalCell.r, headerMap.amount, totalAmt, { numFmt: '#,##0' });

    const mgmtCell = findCell('management');
    if (mgmtCell) safeWrite(mgmtCell.r, headerMap.amount, foot.management, { numFmt: '#,##0' });

    const cgstCell = findCell('cgst');
    if (cgstCell) safeWrite(cgstCell.r, headerMap.amount, foot.cgst, { numFmt: '#,##0' });

    const sgstCell = findCell('sgst');
    if (sgstCell) safeWrite(sgstCell.r, headerMap.amount, foot.sgst, { numFmt: '#,##0' });

    // Update ALL total rows below items
    for (let r = lastItemRow; r <= Math.min(worksheet.rowCount, 100); r++) {
      const v1 = getVal(worksheet.getRow(r).getCell(1)).toLowerCase();
      const v4 = getVal(worksheet.getRow(r).getCell(4)).toLowerCase();
      if (v1 === 'total' || v1.includes('total amount') || v4 === 'total') {
        safeWrite(r, headerMap.amount, foot.grandTotal, { numFmt: '#,##0', font: { bold: true } });
      }
    }

    // --- BANK DETAILS: DIRECT WRITE STRATEGY ---
    if (params.bankDetails) {
      const db = params.bankDetails;
      console.log('=== BANK DETAILS DEBUG ===');
      console.log('Bank details to write:', db);

      // Find specific cells for bank details
      const bankDetailsCell = findCell('bank details');
      const bankNameCell = findCell('bank name');
      const accNoCell = findCell('acc no');

      console.log('Found cells - Bank Details:', bankDetailsCell, 'Bank Name:', bankNameCell, 'Acc No:', accNoCell);

      // Determine the column to use (typically column 1 or where bank name is)
      let col = 1; // Default to column A
      if (bankNameCell) col = bankNameCell.c;
      else if (accNoCell) col = accNoCell.c;
      else if (bankDetailsCell) col = bankDetailsCell.c;

      const bFont = { name: 'Aptos Narrow', size: 10 };

      // Strategy: Find the Acc No row and write IFSC directly after it
      if (accNoCell) {
        const accNoRow = accNoCell.r;
        console.log('Acc No found at row:', accNoRow, 'col:', col);

        // Update Bank Name (row before Acc No)
        safeWrite(accNoRow - 1, col, `Bank Name :  ${db.name}`, { font: bFont });
        console.log('Bank Name written to row:', accNoRow - 1);

        // Update Acc No
        safeWrite(accNoRow, col, `Acc no : ${db.accNo}`, { font: bFont });
        console.log('Acc No written to row:', accNoRow);

        // IFSC Code - write to the row AFTER Acc No
        const ifscRow = accNoRow + 1;
        const ifscText = `IFSC Code: ${db.ifsc}   Branch: ${db.branch}`;
        console.log('Attempting to write IFSC to row:', ifscRow);

        // Check what's currently in that row
        const currentVal = getVal(worksheet.getRow(ifscRow).getCell(col));
        console.log('Current value in IFSC target row:', currentVal);

        // Get the row and ensure it's visible
        const rowIfsc = worksheet.getRow(ifscRow);
        rowIfsc.height = 18;
        rowIfsc.hidden = false;
        rowIfsc.outlineLevel = 0;

        // Get the cell
        let cellIfsc = rowIfsc.getCell(col);
        console.log('IFSC cell merged?', cellIfsc.isMerged, 'Master:', cellIfsc.master?.address);

        // Handle merged cells
        if (cellIfsc.isMerged && cellIfsc.master) {
          try {
            const masterAddr = cellIfsc.master.address;
            worksheet.unMergeCells(masterAddr);
            console.log('Unmerged cell at:', masterAddr);
          } catch (e) {
            console.log('Could not unmerge:', e);
          }
          cellIfsc = rowIfsc.getCell(col);
        }

        // Write the IFSC value
        cellIfsc.value = ifscText;
        cellIfsc.font = { ...bFont, bold: false, color: { argb: 'FF000000' } };
        cellIfsc.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };

        // Also try columns 2 and 3 for visibility
        rowIfsc.getCell(col + 1).value = null;
        rowIfsc.getCell(col + 2).value = null;

        console.log('IFSC Code written successfully:', ifscText);
        console.log('Final verification - cell value:', worksheet.getRow(ifscRow).getCell(col).value);
      } else if (bankNameCell) {
        // Fallback: use bank name cell position
        const bankNameRow = bankNameCell.r;
        console.log('Using Bank Name anchor at row:', bankNameRow);

        safeWrite(bankNameRow, col, `Bank Name :  ${db.name}`, { font: bFont });
        safeWrite(bankNameRow + 1, col, `Acc no : ${db.accNo}`, { font: bFont });

        // IFSC on row after Acc No
        const ifscRow = bankNameRow + 2;
        const ifscText = `IFSC Code: ${db.ifsc}   Branch: ${db.branch}`;

        const rowIfsc = worksheet.getRow(ifscRow);
        rowIfsc.height = 18;
        rowIfsc.hidden = false;

        const cellIfsc = rowIfsc.getCell(col);
        cellIfsc.value = ifscText;
        cellIfsc.font = { ...bFont, bold: false, color: { argb: 'FF000000' } };
        cellIfsc.alignment = { vertical: 'middle', horizontal: 'left' };

        console.log('IFSC written via Bank Name anchor at row:', ifscRow);
      } else if (bankDetailsCell) {
        // Last fallback: use "Bank Details" header
        const bdRow = bankDetailsCell.r;
        console.log('Using Bank Details anchor at row:', bdRow);

        safeWrite(bdRow + 1, col, `Bank Name :  ${db.name}`, { font: bFont });
        safeWrite(bdRow + 2, col, `Acc no : ${db.accNo}`, { font: bFont });

        // IFSC on row after Acc No
        const ifscRow = bdRow + 3;
        const ifscText = `IFSC Code: ${db.ifsc}   Branch: ${db.branch}`;

        const rowIfsc = worksheet.getRow(ifscRow);
        rowIfsc.height = 18;
        rowIfsc.hidden = false;

        const cellIfsc = rowIfsc.getCell(col);
        cellIfsc.value = ifscText;
        cellIfsc.font = { ...bFont, bold: false, color: { argb: 'FF000000' } };
        cellIfsc.alignment = { vertical: 'middle', horizontal: 'left' };

        console.log('IFSC written via Bank Details anchor at row:', ifscRow);
      } else {
        console.error('Could not find any bank details anchor in template!');
      }

      console.log('=== END BANK DETAILS DEBUG ===');
    }

    // Amount in words
    // Re-find it because row insertion shifted it down!
    const wordsLabel = findCell('chargeable in words') || findCell('amount chargeable');
    if (wordsLabel) {
      safeWrite(wordsLabel.r + 1, 1, numberToWords(foot.grandTotal), { font: { size: 10 }, align: { wrapText: true } });
      worksheet.getRow(wordsLabel.r + 1).height = 18;
    }

    if (params.terms) {
      const termsLabel = findCell('terms & condition');
      if (termsLabel) safeWrite(termsLabel.r + 1, termsLabel.c, params.terms, { font: { size: 10 } });
    }

    if (params.signatory) {
      const sigLabel = findCell('authorized signatory') || findCell('for ambe');
      if (sigLabel) safeWrite(sigLabel.r - 4, 6, params.signatory, { font: { bold: true, size: 11 } });
    }

    const bufferOut = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([bufferOut]), `${params.invoiceNo.replace(/\//g, '-')}.xlsx`);
  } catch (err) {
    console.error('Gen Error:', err);
    alert('Bill Generation Failed: ' + (err as any).message);
  }
};

export const generateLedgerExcel = async (p: any) => { };
