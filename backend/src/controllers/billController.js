const path = require('path');
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const { createInvoiceWorkbook } = require('../billGenerator');

// Create a workbook and stream it to the response
async function generateExcelStream(invoiceData, res) {
  // Use the helper to get a populated workbook
  const workbook = await createInvoiceWorkbook(invoiceData);

  // Prepare filename (sanitize)
  const invNo = (invoiceData.invoiceNo || invoiceData.invoice_no || 'invoice').toString().replace(/\//g, '-').replace(/[^a-zA-Z0-9\-_.]/g, '_');
  const filename = `Invoice_${invNo}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  // Stream workbook directly to the response
  await workbook.xlsx.write(res);
  // Some clients require explicit end
  if (!res.writableEnded) res.end();
}

// Controller: GET /api/invoices/:id/download
exports.downloadBill = async (req, res) => {
  try {
    const invoiceId = req.params.id;

    // Try multiple lookup strategies: _id (ObjectId), custom id field, invoiceNo
    let invoice = null;
    if (mongoose.Types.ObjectId.isValid(invoiceId)) {
      invoice = await Invoice.findById(invoiceId);
    }
    if (!invoice) {
        // Try strict invoiceNo match first, then id
      invoice = await Invoice.findOne({ id: invoiceId }) || await Invoice.findOne({ invoiceNo: invoiceId });
    }
    if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });

    // Ensure we have a plain object
    let invoiceData = invoice.toObject ? invoice.toObject() : { ...invoice };

    // Fetch Site Details
    let site = null;
    const Site = require('../models/Site');
    if (invoiceData.siteId) {
        site = await Site.findOne({ id: invoiceData.siteId });
    }
    if (!site && invoiceData.siteName) {
        const safeName = invoiceData.siteName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        site = await Site.findOne({ name: new RegExp(`^${safeName}$`, 'i') });
    }

    // Construct the input strictly for billGenerator (like api/index.js was doing)
    // This ensures consistency between manual and API generation
    let billingPeriodRaw = invoiceData.billingPeriod || invoiceData.period || '';
    let billingPeriodExpanded = billingPeriodRaw;
    
    // Attempt to expand simplified periods like "Dec 2025"
    if (billingPeriodRaw && !/\d+\s*to\s*\d+/i.test(billingPeriodRaw)) {
        try {
             // Try to parse 'Month Year' like 'Dec 2025' or 'December 2025'
             const m = billingPeriodRaw.match(/(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s,]*([0-9]{4})/i);
             if (m) {
               const monthName = m[1];
               const year = Number(m[2]);
               const monthAbbr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
               const monthFull = ['January','February','March','April','May','June','July','August','September','October','November','December'];
               // match both abbreviations and full names (case-insensitive)
               const monthIndex = monthAbbr.findIndex((abbr, idx) => new RegExp('^'+abbr,'i').test(monthName) || new RegExp('^'+monthFull[idx],'i').test(monthName));
               if (monthIndex >= 0) {
                 const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
                 billingPeriodExpanded = `1st to ${daysInMonth} ${monthFull[monthIndex]} ${year}`;
               }
            } else if (invoice.generatedDate) {
              const d = new Date(invoice.generatedDate);
              const prev = new Date(d.getFullYear(), d.getMonth(), 1); 
              const days = new Date(prev.getFullYear(), prev.getMonth() + 1, 0).getDate();
              const monthFull = prev.toLocaleString('default', { month: 'long' });
              billingPeriodExpanded = `1st to ${days} ${monthFull} ${prev.getFullYear()}`;
            }
        } catch (e) { console.warn('Period expansion failed', e); }
    }

    const params = {
        invoiceNo: invoiceData.invoiceNo,
        date: invoiceData.generatedDate || new Date().toISOString(),
        billingPeriod: billingPeriodExpanded,
        site: site ? {
            name: site.name,
            location: site.location,
            clientName: site.clientName,
            clientGstin: site.clientGstin,
            companyName: site.companyName,
            workOrderNo: site.workOrderNo,
            workOrderDate: site.workOrderDate,
            workOrderEndDate: site.workOrderEndDate,
            id: site.id
        } : {},
        // Fallback or override client details
        client: {
             name: (invoiceData.client && invoiceData.client.name) || (site && (site.clientName || site.companyName)) || invoiceData.siteName,
             address: (invoiceData.client && invoiceData.client.address) || (site && site.location),
             gstin: (invoiceData.client && invoiceData.client.gstin) || (site && site.clientGstin)
        },
        items: invoiceData.items || [],
        amount: invoiceData.amount,
        subTotal: invoiceData.subTotal
    };

    // Logging debug info (optional, remove in prod if strict)
    console.log(`Generating bill [${params.invoiceNo}] for site [${site ? site.name : 'Unknown'}]`);

    await generateExcelStream(params, res);
  } catch (error) {
    console.error('Error generating invoice stream:', error);
    if (!res.headersSent) res.status(500).send('Server Error generating bill');
  }
};

// Demo endpoint (no DB); useful for quick testing
exports.downloadDemo = async (req, res) => {
  const sample = {
    invoiceNo: 'AS/25-26/200',
    date: '15 January 2026',
    billingPeriod: '1st to 31st December 2025',
    client: {
      name: 'Tech Corp India',
      address: 'Cyber City, Gurgaon',
      gstin: '07AAACT1234Q1Z5'
    },
    items: [
      { description: 'Security Guards', hsn: 9985, rate: 15000, working_days: 30, persons: 4 },
      { description: 'Housekeeping', hsn: 9985, rate: 12000, working_days: 30, persons: 2 }
    ]
  };

  try {
    await generateExcelStream(sample, res);
  } catch (err) {
    console.error('Error generating demo invoice:', err);
    if (!res.headersSent) res.status(500).send('Failed to generate demo invoice');
  }
};
