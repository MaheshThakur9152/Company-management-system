// import jsPDF from 'jspdf';
import { BillParams } from './excelGenerator';
import { loadScript } from './scriptLoader';

const ensureJSPDFLoaded = async () => {
  if ((window as any).jspdf) return (window as any).jspdf;
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
  if (!(window as any).jspdf) {
     throw new Error("jsPDF loaded but window.jspdf is undefined");
  }
  return (window as any).jspdf;
};

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

export const generateBillPDF = async (params: BillParams) => {
    const jspdf = await ensureJSPDFLoaded();
    const { jsPDF } = jspdf;
    const doc = new jsPDF();

    // -- Grid Configuration --
    const margin = 10;
    const pageWidth = 210;
    const contentWidth = pageWidth - (margin * 2);

    // Column Widths (mm) based on Excel ratios
    // A: 5.29, B: 27.86, C: 9.57, D: 8.43, E: 9.43, F: 13.57, G: 22.29 -> Total 96.44
    const ratios = [5.29, 27.86, 9.57, 8.43, 9.43, 13.57, 22.29];
    const totalRatio = ratios.reduce((a, b) => a + b, 0);
    const colWidths = ratios.map(r => (r / totalRatio) * contentWidth);

    // X Coordinates for columns 0..7
    const xCoords = [margin];
    colWidths.forEach(w => xCoords.push(xCoords[xCoords.length - 1] + w));

    let y = 10; // Start Y

    // Helper to draw a cell
    // colIndex: 0-based index of start column
    // colSpan: number of columns to span
    const drawCell = (
        colIndex: number,
        colSpan: number,
        height: number,
        text: string | string[],
        options: {
            align?: 'left' | 'center' | 'right',
            bold?: boolean,
            fontSize?: number,
            color?: string,
            valign?: 'top' | 'middle',
            noBorder?: boolean,
            borders?: { top?: boolean, bottom?: boolean, left?: boolean, right?: boolean }
        } = {}
    ) => {
        const x = xCoords[colIndex];
        const w = xCoords[colIndex + colSpan] - x;

        // Draw Box
        if (!options.noBorder) {
            if (options.borders) {
                // Draw specific lines
                if (options.borders.top !== false) doc.line(x, y, x + w, y);
                if (options.borders.bottom !== false) doc.line(x, y + height, x + w, y + height);
                if (options.borders.left !== false) doc.line(x, y, x, y + height);
                if (options.borders.right !== false) doc.line(x + w, y, x + w, y + height);
            } else {
                // Draw full rect
                doc.rect(x, y, w, height);
            }
        }

        // Text
        if (text) {
            doc.setFont("helvetica", options.bold ? "bold" : "normal");
            doc.setFontSize(options.fontSize || 9);
            doc.setTextColor(options.color === 'red' ? 255 : 0, 0, 0);

            let textX = x + 2;
            if (options.align === 'center') textX = x + w / 2;
            else if (options.align === 'right') textX = x + w - 2;

            let textY = y + 4;
            if (options.valign === 'middle') textY = y + (height / 2) + 1;

            doc.text(String(text), textX, textY, { align: options.align || 'left', maxWidth: w - 4 });

            // Reset color
            doc.setTextColor(0, 0, 0);
        }
    };

// --- Row 1: Title ---
drawCell(0, 7, 8, "TAX INVOICE", { align: 'center', bold: true, fontSize: 14, valign: 'middle' });
y += 8;

// --- Row 2: Company Name ---
drawCell(0, 5, 8, "AMBE SERVICE FACILITIES PRIVATE LIMITED", { bold: true, fontSize: 14, color: 'red', valign: 'middle', borders: { bottom: false } });
drawCell(5, 2, 8, "", { borders: { bottom: false, left: false } }); // Right side empty
y += 8;

// --- Row 3-6: Address ---
const addressHeight = 20;
const addressLines = [
    "Shop No - 49 A, Ground Floor, Pooja Enclave CHS Ltd,",
    "Ganesh Nagar, Kandivali (West), Mumbai 400 067.",
    "Contact No: 022 45066566 / 9619607537",
    "Email : contact@ambeservice.com / Website : ambeservice.com"
];
drawCell(0, 5, addressHeight, addressLines, { fontSize: 9, borders: { top: false, bottom: false } });

// Right Side Header Details (Invoice No, Date)
// We need to split this height into rows manually or just draw text at offsets
// Let's draw the right box outline
drawCell(5, 2, addressHeight, "", { borders: { top: false, bottom: false, left: false } });

// Draw text inside right box manually
doc.setFontSize(9);
doc.text(`Invoice No : ${params.invoiceNo}`, xCoords[5] + 2, y + 5);
doc.text(`Date: ${params.date}`, xCoords[5] + 2, y + 10);

y += addressHeight;

// --- Row 7: CIN ---
drawCell(0, 5, 6, "CIN NO. : U80200MH2023PTC412420", { valign: 'middle', borders: { top: false } });
drawCell(5, 2, 6, "", { borders: { top: false, left: false } });
y += 6;

// --- Row 8: GSTIN & Billing Period ---
drawCell(0, 5, 6, "GSTIN : 27AAZCA5609F1ZA", { valign: 'middle' });
drawCell(5, 2, 6, `Billing Period : ${params.billingPeriod}`, { valign: 'middle' });
y += 6;

// --- Row 9: Headers ---
drawCell(0, 5, 6, "Name & Add of Party", { fontSize: 8, valign: 'middle' });
drawCell(5, 2, 6, "Work Order Ref No. :", { fontSize: 8, valign: 'middle' });
y += 6;

// --- Row 10: Client Name & WO No ---
drawCell(0, 5, 6, params.site.clientName || "Lokhandwala Minerva CHS LTD (Prop.)", { bold: true, valign: 'middle' });
drawCell(5, 2, 6, params.workOrderNo, { align: 'center', valign: 'middle' });
y += 6;

// --- Row 11: Client Addr & WO Period Header ---
drawCell(0, 5, 6, params.site.location || "J.R. Boricha Marg. Mahalaxmi, Mumbai- 400011.", { fontSize: 8, valign: 'middle' });
drawCell(5, 2, 6, "Work Order Period : ", { valign: 'middle' });
y += 6;

// --- Row 12: Client GSTIN & WO Period Value ---
drawCell(0, 5, 6, `GSTIN : ${params.site.clientGstin || '27AAACL5105AIZ7'}`, { fontSize: 8, valign: 'middle' });
drawCell(5, 2, 6, params.workOrderPeriod, { valign: 'middle' });
y += 6;

// --- Row 13: Greeting ---
drawCell(0, 7, 10, "We thank you very much for valuable interest shown in our organzaion. We would like to submit our bill for providing our services.", { valign: 'top' });
y += 10;

// --- Items Header ---
const headerHeight = 10;
drawCell(0, 1, headerHeight, "Sr No", { align: 'center', bold: true, valign: 'middle' });
drawCell(1, 1, headerHeight, "Description of Services", { align: 'center', bold: true, valign: 'middle' });
drawCell(2, 1, headerHeight, "HSN\nCode", { align: 'center', bold: true, valign: 'middle' });
drawCell(3, 1, headerHeight, "Rate", { align: 'center', bold: true, valign: 'middle' });
drawCell(4, 1, headerHeight, "Working\nDays", { align: 'center', bold: true, valign: 'middle' });
drawCell(5, 1, headerHeight, "Persons", { align: 'center', bold: true, valign: 'middle' });
drawCell(6, 1, headerHeight, "Amount\n(RS)", { align: 'center', bold: true, valign: 'middle' });
y += headerHeight;

// --- Items ---
const itemHeight = 6;
let subTotal = 0;

params.items.forEach((item, i) => {
    let amt = 0;
    if (item.description.toLowerCase().includes('overtime')) {
        amt = item.workingDays * (item.rate / 31 / 9);
    } else {
        amt = item.workingDays * (item.rate / 31);
    }
    subTotal += amt;

    drawCell(0, 1, itemHeight, (i + 1).toString(), { align: 'center', valign: 'middle' });
    drawCell(1, 1, itemHeight, item.description, { valign: 'middle' });
    drawCell(2, 1, itemHeight, item.hsn, { align: 'center', valign: 'middle' });
    drawCell(3, 1, itemHeight, item.rate.toLocaleString(), { align: 'center', valign: 'middle' });
    drawCell(4, 1, itemHeight, item.workingDays.toString(), { align: 'center', valign: 'middle' });
    drawCell(5, 1, itemHeight, item.persons > 0 ? item.persons.toString() : "", { align: 'center', valign: 'middle' });
    drawCell(6, 1, itemHeight, amt.toFixed(2), { align: 'right', valign: 'middle' });
    y += itemHeight;
});

// Fill empty rows to push totals down
    const targetY = 200;
    while (y + itemHeight < targetY) {
        drawCell(0, 1, itemHeight, "", { borders: { top: false, bottom: false } });
        drawCell(1, 1, itemHeight, "", { borders: { top: false, bottom: false } });
        drawCell(2, 1, itemHeight, "", { borders: { top: false, bottom: false } });
        drawCell(3, 1, itemHeight, "", { borders: { top: false, bottom: false } });
        drawCell(4, 1, itemHeight, "", { borders: { top: false, bottom: false } });
        drawCell(5, 1, itemHeight, "", { borders: { top: false, bottom: false } });
        drawCell(6, 1, itemHeight, "", { borders: { top: false, bottom: false } });
        y += itemHeight;
    }
    doc.line(xCoords[0], y, xCoords[7], y);

// --- Totals ---
const mgmtAmt = subTotal * (params.managementRate / 100);
const totalBeforeTax = subTotal + mgmtAmt;
const cgstAmt = totalBeforeTax * (params.cgstRate / 100);
const sgstAmt = totalBeforeTax * (params.sgstRate / 100);
const grandTotal = totalBeforeTax + cgstAmt + sgstAmt;

// Sub Total
drawCell(0, 3, 6, "", { borders: { top: false, bottom: false, right: false } }); // Empty left
drawCell(3, 3, 6, "Sub Total", { valign: 'middle' });
drawCell(6, 1, 6, subTotal.toFixed(2), { align: 'right', valign: 'middle' });
y += 6;

// Mgmt
drawCell(0, 3, 6, "", { borders: { top: false, bottom: false, right: false } });
drawCell(3, 3, 6, `Management charges @ ${params.managementRate}%`, { valign: 'middle' });
drawCell(6, 1, 6, mgmtAmt.toFixed(2), { align: 'right', valign: 'middle' });
y += 6;

// Bank Header
drawCell(0, 3, 6, "Bank Details", { bold: true, valign: 'middle' });
drawCell(3, 4, 6, "", { borders: { top: true, bottom: false, left: true, right: true } }); // Empty right block
y += 6;

// Bank Name + Total
drawCell(0, 3, 6, `Bank Name : ${params.bankDetails?.name || 'Axis bank'}`, { valign: 'middle' });
drawCell(3, 3, 6, "Total", { bold: true, valign: 'middle' });
drawCell(6, 1, 6, totalBeforeTax.toFixed(2), { align: 'right', valign: 'middle' });
y += 6;

// Acc + CGST
drawCell(0, 3, 6, `Acc no : ${params.bankDetails?.accNo || '924020001871570'}`, { valign: 'middle' });
drawCell(3, 3, 6, `Add CGST @ ${params.cgstRate}%`, { bold: true, valign: 'middle' });
drawCell(6, 1, 6, cgstAmt.toFixed(2), { align: 'right', valign: 'middle' });
y += 6;

// IFSC + SGST
drawCell(0, 3, 6, `IFSC Code: ${params.bankDetails?.ifsc || 'UTIB0001572'}   Branch: ${params.bankDetails?.branch || 'kandivali west,Link Road.'}`, { fontSize: 8, valign: 'middle' });
drawCell(3, 3, 6, `Add SGST @ ${params.sgstRate}%`, { bold: true, valign: 'middle' });
drawCell(6, 1, 6, sgstAmt.toFixed(2), { align: 'right', valign: 'middle' });
y += 6;

// Words Header
drawCell(0, 3, 6, "Amount Chargeble in words(INR) :", { bold: true, valign: 'middle' });
drawCell(3, 4, 6, "", { borders: { top: false, bottom: false, left: true, right: true } });
y += 6;

// Words Value + Grand Total
drawCell(0, 3, 6, numberToWords(grandTotal), { valign: 'middle' });
drawCell(3, 3, 6, "Total Amount", { bold: true, valign: 'middle' });
drawCell(6, 1, 6, Math.round(grandTotal).toLocaleString(), { align: 'right', valign: 'middle' });
y += 6;

// Only
drawCell(0, 3, 6, "Only", { valign: 'middle' });
drawCell(3, 4, 6, "", { borders: { top: false, bottom: true, left: true, right: true } });
y += 6;

// Terms + Signatory
const termsHeight = 30;
drawCell(0, 3, termsHeight, params.terms || ["Terms & condition :", "Payment can only be done in cheque/DD, NEFT, RTGS"], { bold: true });

// Signatory
drawCell(3, 4, termsHeight, "", { borders: { top: true, bottom: true, left: true, right: true } });
// Draw text manually for right align
const signatoryText = params.signatory || "For Ambe Service Facilities Pvt Ltd\n\n\n\n\nAuthorized signatory";
const signatoryLines = signatoryText.split('\n');
signatoryLines.forEach((line, idx) => {
    doc.text(line, xCoords[7] - 2, y + 5 + (idx * 5), { align: 'right' });
});

doc.save(`Bill-${params.invoiceNo.replace(/\//g, '-')}.pdf`);
};

export const generateLedgerPDF = async (params: {
    companyName: string;
    accountName: string;
    period: string;
    transactions: any[];
}) => {
    const jspdf = await ensureJSPDFLoaded();
    const { jsPDF } = jspdf;
    const doc = new jsPDF();
    const pageWidth = 210;
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);

    let y = 15;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(params.companyName, pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Shop No - 49 A, Ground Floor, Pooja Enclave CHS Ltd,", pageWidth / 2, y, { align: 'center' });
    y += 4;
    doc.text("Ganesh Nagar, Kandivali (West), Mumbai 400 067.", pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(params.accountName, pageWidth / 2, y, { align: 'center' });
    y += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Ledger Account", pageWidth / 2, y, { align: 'center' });
    y += 5;

    doc.text(params.period, pageWidth / 2, y, { align: 'center' });
    y += 8;

    // Table Header
    // Cols: Date(22), Particulars(48), VchType(20), VchNo(20), Debit(25), Credit(25), Balance(30)
    const cols = [
        { header: 'Date', width: 22, align: 'left' },
        { header: 'Particulars', width: 48, align: 'left' },
        { header: 'Vch Type', width: 20, align: 'left' },
        { header: 'Vch No.', width: 20, align: 'center' },
        { header: 'Debit', width: 25, align: 'right' },
        { header: 'Credit', width: 25, align: 'right' },
        { header: 'Balance', width: 30, align: 'right' }
    ];

    let x = margin;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    
    // Draw Header Line Top
    doc.line(margin, y - 4, pageWidth - margin, y - 4);
    
    cols.forEach(col => {
        doc.text(col.header, x + (col.align === 'right' ? col.width : (col.align === 'center' ? col.width/2 : 0)), y, { align: col.align as any });
        x += col.width;
    });
    
    // Draw Header Line Bottom
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 6;

    // Rows
    doc.setFont("helvetica", "normal");
    let totalDebit = 0;
    let totalCredit = 0;

    params.transactions.forEach(txn => {
        if (y > 280) {
            doc.addPage();
            y = 15;
        }

        x = margin;
        
        // Date
        doc.text(new Date(txn.date).toLocaleDateString('en-GB'), x, y);
        x += cols[0].width;

        // Particulars
        let particulars = txn.particulars;
        if (txn.debit > 0) particulars = `To ${particulars}`;
        else if (txn.credit > 0) particulars = `By ${particulars}`;
        
        // Truncate particulars if too long
        if (particulars.length > 30) particulars = particulars.substring(0, 27) + '...';
        doc.text(particulars, x, y);
        x += cols[1].width;

        // Vch Type
        doc.text(txn.vchType, x, y);
        x += cols[2].width;

        // Vch No
        doc.text(txn.vchNo, x + cols[3].width/2, y, { align: 'center' });
        x += cols[3].width;

        // Debit
        if (txn.debit) {
            doc.text(txn.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 }), x + cols[4].width, y, { align: 'right' });
        }
        x += cols[4].width;

        // Credit
        if (txn.credit) {
            doc.text(txn.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }), x + cols[5].width, y, { align: 'right' });
        }
        x += cols[5].width;

        // Balance
        const balAbs = Math.abs(txn.balance);
        const drCr = txn.balance > 0 ? 'Dr' : 'Cr';
        doc.text(`${balAbs.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${drCr}`, x + cols[6].width, y, { align: 'right' });

        totalDebit += txn.debit;
        totalCredit += txn.credit;
        y += 6;
    });

    // Totals
    if (y > 260) {
        doc.addPage();
        y = 15;
    }

    y += 2;
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;

    const totalLabelX = margin + cols[0].width + cols[1].width + cols[2].width + cols[3].width - 5;
    doc.setFont("helvetica", "bold");
    doc.text("Total", totalLabelX, y, { align: 'right' });
    
    // Debit Total
    let debitX = margin + cols[0].width + cols[1].width + cols[2].width + cols[3].width + cols[4].width;
    doc.text(totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 }), debitX, y, { align: 'right' });

    // Credit Total
    let creditX = debitX + cols[5].width;
    doc.text(totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 }), creditX, y, { align: 'right' });

    y += 2;
    doc.line(margin, y, pageWidth - margin, y);
    doc.line(margin, y + 1, pageWidth - margin, y + 1); // Double line

    // Closing Balance
    y += 8;
    const closingBal = params.transactions.length > 0 ? params.transactions[params.transactions.length - 1].balance : 0;
    const closingBalAbs = Math.abs(closingBal);
    const closingDrCr = closingBal > 0 ? 'Dr' : 'Cr';

    doc.text("Closing Balance", totalLabelX, y, { align: 'right' });
    doc.text(`${closingBalAbs.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ${closingDrCr}`, creditX + cols[6].width, y, { align: 'right' });

    const sanitizedAccount = params.accountName.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
    doc.save(`Ledger_${sanitizedAccount}.pdf`);
};
