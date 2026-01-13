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
      invoice = await Invoice.findOne({ id: invoiceId }) || await Invoice.findOne({ invoiceNo: invoiceId });
    }
    if (!invoice) return res.status(404).json({ msg: 'Invoice not found' });

    let invoiceData = invoice.toObject ? invoice.toObject() : invoice;

    // If this invoice references a site, fetch site details and merge them (without overwriting existing invoice fields)
    try {
      const Site = require('../models/Site');
      let site = null;
      if (invoiceData.siteId) site = await Site.findOne({ id: invoiceData.siteId });
      // If site not found using siteId, try to find by siteName (case-insensitive exact)
      if (!site && invoiceData.siteName) {
        const safeName = invoiceData.siteName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        site = await Site.findOne({ name: new RegExp(`^${safeName}$`, 'i') });
      }

      if (site) {
        const s = site.toObject ? site.toObject() : site;
        invoiceData.site = s;
        // Explicitly override invoice client fields with site canonical fields when available
        invoiceData.client = invoiceData.client || {};
        if (s.clientName) invoiceData.client.name = s.clientName;
        else if (s.companyName) invoiceData.client.name = s.companyName;
        else invoiceData.client.name = invoiceData.client.name || s.name || invoiceData.siteName;

        if (s.location) invoiceData.client.address = s.location;
        else invoiceData.client.address = invoiceData.client.address || invoiceData.client_address || invoiceData.site_location || '';

        if (s.clientGstin) invoiceData.client.gstin = s.clientGstin;
        else invoiceData.client.gstin = invoiceData.client.gstin || invoiceData.client_gstin || '';
      }
    } catch (mergeErr) {
      console.warn('Failed to merge site info into invoiceData:', mergeErr.message);
    }

    // Debug dump removed (previously wrote invoice debug to /tmp)    await generateExcelStream(invoiceData, res);
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
