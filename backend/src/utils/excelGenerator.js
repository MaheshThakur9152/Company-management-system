const ExcelJS = require('exceljs');

const numberToWords = (num) => {
    const a = [
        '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
        'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
    ];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const inWords = (n) => {
        if ((n = n.toString()).length > 9) return 'overflow';
        const n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/) || [];
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

const generateBillExcel = async (params) => {
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
                left: 0.25, right: 0.25, top: 0.25, bottom: 0.25, header: 0.1, footer: 0.1
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
    const borderThin = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
    };

    const fontBase = { name: 'Aptos Narrow', size: 11, color: { theme: 1 } };
    const fontBold = { name: 'Aptos Narrow', size: 11, bold: true, color: { theme: 1 } };
    const fontHeader = { name: 'Aptos Narrow', size: 16, color: { argb: 'FFFF0000' }, bold: true };

    // --- Row Heights ---
    worksheet.getRow(2).height = 16;
    worksheet.getRow(14).height = 24;
    worksheet.getRow(16).height = 14.45;
    worksheet.getRow(30).height = 18;
    worksheet.getRow(32).height = 18; // Ref Row 31
    worksheet.getRow(34).height = 18; // Ref Row 33
    worksheet.getRow(38).height = 15.75; // Ref Row 37
    worksheet.getRow(39).height = 15;    // Ref Row 38
    worksheet.getRow(41).height = 14.45; // Ref Row 40

    function safeMerge(range) {
        try {
            worksheet.mergeCells(range);
        } catch (e) {
            // ignore
        }
    }

    // --- Row 1: Title ---
    safeMerge('A1:G1');
    const cellTitle = worksheet.getCell('A1');
    cellTitle.value = params.invoiceType || "TAX INVOICE";
    cellTitle.font = { name: 'Aptos Narrow', size: 14, bold: true };
    cellTitle.alignment = { horizontal: 'center', vertical: 'middle' };

    // --- Header Section ---
    safeMerge('A2:E2');
    const cellA2 = worksheet.getCell('A2');
    cellA2.value = params.companyName || 'AMBE SERVICE FACILITIES PRIVATE LIMITED';
    cellA2.font = fontHeader;
    cellA2.alignment = { horizontal: 'left', indent: 1 };
    cellA2.border = borderThin;
    worksheet.getRow(2).height = 22;

    // Small sanitization pass: collapse repeated identical header cells across A..E for top rows
    // Some templates have repeated values per column; normalize to single left cell to keep output tidy.
    const headerRowsToSanitize = [1,2,3,4,5,6,7,8,9,10,11,12];
    headerRowsToSanitize.forEach(rn => {
      try {
        const row = worksheet.getRow(rn);
        let lastVal = null;
        for (let c = 1; c <= 7; c++) {
          const cell = row.getCell(c);
          const val = (cell && cell.value) ? (typeof cell.value === 'string' ? cell.value.trim() : JSON.stringify(cell.value)) : null;
          if (val && lastVal === null) {
            lastVal = val;
          } else if (val && lastVal !== null && val === lastVal) {
            // clear duplicate
            cell.value = undefined;
          } else if (!val) {
            // keep searching
          } else {
            lastVal = val;
          }
        }
      } catch (e) { /* ignore sanitization errors */ }
    });

    safeMerge('F2:G2');
    worksheet.getCell('F2').border = borderThin;

    // Row 3-6: Address
    const addressLines = [
        "Shop No - 49 A, Ground Floor, Pooja Enclave CHS Ltd, ",
        "Ganesh Nagar, Kandivali (West), Mumbai 400 067.",
        "Contact No: 022 45066566 / 9619607537",
        "Email : contact@ambeservice.com / Website : ambeservice.com"
    ];

    addressLines.forEach((line, idx) => {
        const row = idx + 3;
        safeMerge(`A${row}:E${row}`);
        const cell = worksheet.getCell(`A${row}`);
        cell.value = line;
        cell.font = fontBase;
        cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true, indent: 1 };
        cell.border = { left: { style: 'thin' }, right: { style: 'thin' } };

        if (row === 3 || row === 6) {
            safeMerge(`F${row}:G${row}`);
            worksheet.getCell(`F${row}`).border = { right: { style: 'thin' }, left: { style: 'thin' } };
        }
    });

    // Invoice Details
    safeMerge('F4:G4');
    const cellF4 = worksheet.getCell('F4');
    cellF4.value = `Invoice No :  ${params.invoiceNo}`;
    cellF4.font = fontBase;
    cellF4.alignment = { horizontal: 'left', indent: 1 };
    cellF4.border = { left: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge('F5:G5');
    const cellF5 = worksheet.getCell('F5');
    cellF5.value = `Date:  ${params.date}`;
    cellF5.font = fontBase;
    cellF5.alignment = { horizontal: 'left', indent: 1 };
    cellF5.border = { left: { style: 'thin' }, right: { style: 'thin' } };

    // CIN
    safeMerge('A7:E7');
    const cellA7 = worksheet.getCell('A7');
    cellA7.value = "CIN NO. : U80200MH2023PTC412420";
    cellA7.font = fontBase;
    cellA7.alignment = { horizontal: 'left', indent: 1 };
    cellA7.border = { left: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge('F7:G7');
    worksheet.getCell('F7').border = { left: { style: 'thin' }, right: { style: 'thin' } };

    // GSTIN
    safeMerge('A8:E8');
    const cellA8 = worksheet.getCell('A8');
    cellA8.value = "GSTIN :  27AAZCA5609F1ZA";
    cellA8.font = fontBase;
    cellA8.alignment = { horizontal: 'left', indent: 1 };
    cellA8.border = { left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge('F8:G8');
    const cellF8 = worksheet.getCell('F8');
    cellF8.value = `Billing Period :${params.billingPeriod}`;
    cellF8.font = fontBase;
    cellF8.alignment = { horizontal: 'left', indent: 1 };
    cellF8.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

    // Name & Add of Party
    safeMerge('A9:E9');
    const cellA9 = worksheet.getCell('A9');
    cellA9.value = "Name & Add of Party";
    cellA9.font = { ...fontBase, size: 10 };
    cellA9.alignment = { horizontal: 'left', indent: 1 };
    cellA9.border = { left: { style: 'thin' }, top: { style: 'thin' }, right: { style: 'thin' } };

    const shouldShowWorkOrder = /facility|facilities/i.test((params.companyName || '').toString());

    safeMerge('F9:G9');
    const cellF9 = worksheet.getCell('F9');
    if (shouldShowWorkOrder) {
        cellF9.value = "Work Order Ref No. :";
        cellF9.font = { ...fontBase, size: 10 };
        cellF9.alignment = { horizontal: 'left', indent: 1 };
        cellF9.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' } };
    } else {
        cellF9.value = '';
        cellF9.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' } };
    }

    // Client Name
    safeMerge('A10:E10');
    const cellA10 = worksheet.getCell('A10');
    cellA10.value = params.site ? (params.site.clientName || "Lokhandwala Minerva CHS LTD (Prop.)") : '';
    cellA10.font = fontBold;
    cellA10.alignment = { horizontal: 'left', indent: 1 };
    cellA10.border = { left: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge('F10:G10');
    const cellF10 = worksheet.getCell('F10');
    if (shouldShowWorkOrder) {
        cellF10.value = params.workOrderNo;
        cellF10.font = { name: 'Bookman Old Style', size: 10 };
        cellF10.alignment = { horizontal: 'center' };
        cellF10.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    } else {
        cellF10.value = '';
        cellF10.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    }

    // Client Address
    safeMerge('A11:E11');
    const cellA11 = worksheet.getCell('A11');
    cellA11.value = params.site ? (params.site.location || "J.R. Boricha Marg. Mahalaxmi, Mumbai- 400011.") : '';
    cellA11.font = { ...fontBase, size: 10 };
    cellA11.alignment = { horizontal: 'left', vertical: 'top', wrapText: true, indent: 1 };
    cellA11.border = { left: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge('F11:G11');
    const cellF11 = worksheet.getCell('F11');
    if (shouldShowWorkOrder) {
        cellF11.value = "Work Order Period : ";
        cellF11.font = fontBase;
        cellF11.alignment = { horizontal: 'left', indent: 1 };
        cellF11.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' } };
    } else {
        cellF11.value = '';
        cellF11.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' } };
    }

    // Client GSTIN
    safeMerge('A12:E12');
    const cellA12 = worksheet.getCell('A12');
    cellA12.value = `GSTIN : ${params.site ? (params.site.clientGstin || '') : ''}`;
    cellA12.font = { ...fontBase, size: 10 };
    cellA12.alignment = { horizontal: 'left', indent: 1 };
    cellA12.border = { left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge('F12:G12');
    const cellF12 = worksheet.getCell('F12');
    if (shouldShowWorkOrder) {
        cellF12.value = params.workOrderPeriod;
        cellF12.font = fontBase;
        cellF12.alignment = { wrapText: true, horizontal: 'left', indent: 1 };
        cellF12.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    } else {
        cellF12.value = '';
        cellF12.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    }

    // Greeting
    safeMerge('A13:G14');
    const cellA13 = worksheet.getCell('A13');
    cellA13.value = "We thank you very much for valuable interest shown in our organzaion. We would like to submit  our bill for providing our services.";
    cellA13.font = fontBase;
    cellA13.alignment = { wrapText: true, vertical: 'top', horizontal: 'left', indent: 1 };
    cellA13.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };

    // Table Header
    const headers = ["Sr No", "Description of Services", "HSN \nCode", "Rate", "Working\n Days", "Persons", "Amount \n(RS)"];
    const headerRow = worksheet.getRow(15);
    headerRow.values = headers;

    ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
        safeMerge(`${col}15:${col}16`);
        const cell = worksheet.getCell(`${col}15`);
        cell.font = fontBase;
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.border = borderThin;
    });

    // Items
    let currentRow = 17;
    let subTotalRow = 0;

    params.items.forEach((item, index) => {
        const row = worksheet.getRow(currentRow);
        row.getCell(1).value = index + 1;
        row.getCell(2).value = item.description;
        row.getCell(3).value = item.hsn;
        row.getCell(4).value = Number(item.rate);
        row.getCell(5).value = Number(item.days);
        row.getCell(6).value = Number(item.persons) > 0 ? Number(item.persons) : null;
        row.getCell(7).value = Number(item.amount);

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

    while (currentRow < 28) {
        const row = worksheet.getRow(currentRow);
        for (let i = 1; i <= 7; i++) {
            const cell = row.getCell(i);
            cell.value = '';
            cell.border = { left: { style: 'thin' }, right: { style: 'thin' } };
        }
        row.height = 18;
        currentRow++;
    }

    const spacerRow = worksheet.getRow(currentRow);
    spacerRow.height = 20;

    subTotalRow = currentRow;

    safeMerge(`D${currentRow}:F${currentRow}`);
    const cellSubTotal = worksheet.getCell(`D${currentRow}`);
    cellSubTotal.value = "Sub Total";
    cellSubTotal.font = fontBase;
    cellSubTotal.alignment = { horizontal: 'left', indent: 1 };
    cellSubTotal.border = { left: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    const cellSubTotalVal = worksheet.getCell(`G${currentRow}`);
    cellSubTotalVal.value = { formula: `SUM(G17:G${currentRow - 1})` };
    cellSubTotalVal.numFmt = '0.00';
    cellSubTotalVal.alignment = { horizontal: 'right', indent: 1 };
    cellSubTotalVal.border = borderThin;

    ['A', 'B', 'C'].forEach(col => {
        worksheet.getCell(`${col}${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' } };
    });

    currentRow++;

    safeMerge(`D${currentRow}:F${currentRow}`);
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

    ['A', 'B', 'C'].forEach(col => {
        worksheet.getCell(`${col}${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    });

    currentRow++;

    // Bank & Totals
    safeMerge(`A${currentRow}:C${currentRow}`);
    const cellBankHeader = worksheet.getCell(`A${currentRow}`);
    cellBankHeader.value = "Bank Details";
    cellBankHeader.font = fontBold;
    cellBankHeader.alignment = { horizontal: 'left', indent: 1 };
    cellBankHeader.border = { left: { style: 'thin' }, top: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge(`D${currentRow}:F${currentRow}`);
    const cellTotalLabel = worksheet.getCell(`D${currentRow}`);
    cellTotalLabel.value = "Total ";
    cellTotalLabel.font = fontBold;
    cellTotalLabel.alignment = { horizontal: 'left', indent: 1 };
    cellTotalLabel.border = { left: { style: 'thin' }, top: { style: 'thin' }, right: { style: 'thin' } };

    const totalBeforeTaxRow = currentRow;
    const cellTotalVal = worksheet.getCell(`G${currentRow}`);
    cellTotalVal.value = { formula: `G${subTotalRow}+G${subTotalRow + 1}` };
    cellTotalVal.numFmt = '0.00';
    cellTotalVal.alignment = { horizontal: 'right', indent: 1 };
    cellTotalVal.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };

    currentRow++;

    // Bank Info
    safeMerge(`A${currentRow}:C${currentRow}`);
    const cellBankName = worksheet.getCell(`A${currentRow}`);
    cellBankName.value = `Bank Name :  ${params.bankDetails?.name || 'Axis bank'}`;
    cellBankName.font = { ...fontBase, size: 10 };
    cellBankName.border = { left: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge(`D${currentRow}:F${currentRow}`);
    const cellCgst = worksheet.getCell(`D${currentRow}`);
    cellCgst.value = `Add CGST @ ${params.cgstRate}%`;
    cellCgst.font = fontBold;
    cellCgst.border = { left: { style: 'thin' }, right: { style: 'thin' } };

    const cgstRow = currentRow;
    const cellCgstVal = worksheet.getCell(`G${currentRow}`);
    cellCgstVal.value = { formula: `G${totalBeforeTaxRow}*${params.cgstRate}%` };
    cellCgstVal.numFmt = '0.00';
    cellCgstVal.alignment = { horizontal: 'right', indent: 1 };
    cellCgstVal.border = borderThin;
    currentRow++;

    safeMerge(`A${currentRow}:C${currentRow}`);
    const cellAcc = worksheet.getCell(`A${currentRow}`);
    cellAcc.value = `Acc no : ${params.bankDetails?.accNo || '924020001871570'}`;
    cellAcc.font = { ...fontBase, size: 10 };
    cellAcc.border = { left: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge(`D${currentRow}:F${currentRow}`);
    const cellSgst = worksheet.getCell(`D${currentRow}`);
    cellSgst.value = `Add SGST @ ${params.sgstRate}%`;
    cellSgst.font = fontBold;
    cellSgst.border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };

    const sgstRow = currentRow;
    const cellSgstVal = worksheet.getCell(`G${currentRow}`);
    cellSgstVal.value = { formula: `G${totalBeforeTaxRow}*${params.sgstRate}%` };
    cellSgstVal.numFmt = '0.00';
    cellSgstVal.alignment = { horizontal: 'right', indent: 1 };
    cellSgstVal.border = { right: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, top: { style: 'thin' } };
    currentRow++;

    safeMerge(`A${currentRow}:C${currentRow}`);
    const cellIfsc = worksheet.getCell(`A${currentRow}`);
    cellIfsc.value = `IFSC Code: ${params.bankDetails?.ifsc || 'UTIB0001572'}   Branch: ${params.bankDetails?.branch || 'kandivali west,Link Road.'}`;
    cellIfsc.font = { ...fontBase, size: 10 };
    cellIfsc.border = { left: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge(`D${currentRow}:F${currentRow}`);
    worksheet.getCell(`D${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' } };
    worksheet.getCell(`G${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' } };
    currentRow++;

    // Words
    safeMerge(`A${currentRow}:C${currentRow}`);
    const cellWordsHeader = worksheet.getCell(`A${currentRow}`);
    cellWordsHeader.value = "Amount Chargeble in words(INR) : ";
    cellWordsHeader.font = fontBold;
    cellWordsHeader.border = { left: { style: 'thin' }, top: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge(`D${currentRow}:F${currentRow}`);
    worksheet.getCell(`D${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' } };
    worksheet.getCell(`G${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' } };
    currentRow++;

    const subTotalVal = params.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const mgmtVal = subTotalVal * (params.managementRate / 100);
    const totalBeforeTaxVal = subTotalVal + mgmtVal;
    const cgstVal = totalBeforeTaxVal * (params.cgstRate / 100);
    const sgstVal = totalBeforeTaxVal * (params.sgstRate / 100);
    const grandTotalVal = totalBeforeTaxVal + cgstVal + sgstVal;

    safeMerge(`A${currentRow}:C${currentRow}`);
    const cellWords = worksheet.getCell(`A${currentRow}`);
    cellWords.value = numberToWords(grandTotalVal);
    cellWords.font = { ...fontBase, size: 10 };
    cellWords.border = { left: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge(`D${currentRow}:F${currentRow}`);
    const cellGrandTotalLabel = worksheet.getCell(`D${currentRow}`);
    cellGrandTotalLabel.value = "Total Amount";
    cellGrandTotalLabel.font = fontBold;
    cellGrandTotalLabel.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };

    const cellGrandTotalVal = worksheet.getCell(`G${currentRow}`);
    cellGrandTotalVal.value = { formula: `SUM(G${totalBeforeTaxRow}+G${cgstRow}+G${sgstRow})` };
    cellGrandTotalVal.numFmt = '#,##0';
    cellGrandTotalVal.alignment = { horizontal: 'right', indent: 1 };
    cellGrandTotalVal.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };
    cellGrandTotalVal.font = fontBase;
    currentRow++;

    safeMerge(`A${currentRow}:C${currentRow}`);
    const cellWords2 = worksheet.getCell(`A${currentRow}`);
    cellWords2.value = "Only";
    cellWords2.border = { left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge(`D${currentRow}:F${currentRow}`);
    worksheet.getCell(`D${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    worksheet.getCell(`G${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
    currentRow++;

    safeMerge(`A${currentRow}:C${currentRow}`);
    worksheet.getCell(`A${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' } };
    safeMerge(`D${currentRow}:G${currentRow}`);
    worksheet.getCell(`D${currentRow}`).border = { left: { style: 'thin' }, right: { style: 'thin' } };
    currentRow++;

    // Terms & Signatory
    safeMerge(`A${currentRow}:C${currentRow + 5}`);
    const termsCell = worksheet.getCell(`A${currentRow}`);
    termsCell.value = params.terms || "Terms & condition : \nPayment can only be done in cheque/DD, NEFT, RTGS ";
    termsCell.font = fontBase;
    termsCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true, indent: 1 };
    termsCell.border = { left: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    safeMerge(`D${currentRow}:G${currentRow + 5}`);
    const signCell = worksheet.getCell(`D${currentRow}`);
    signCell.value = params.signatory || "For Ambe Service Facilities Pvt Ltd  \n\n\n\n\nAuthorized signatory\n";
    signCell.font = fontBase;
    signCell.alignment = { vertical: 'top', horizontal: 'right', wrapText: true, indent: 1 };
    signCell.border = { left: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    return await workbook.xlsx.writeBuffer();
};

module.exports = { generateBillExcel };
