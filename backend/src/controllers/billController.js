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

    try {
      const fs = require('fs');
      fs.writeFileSync('/tmp/invoice_debug.json', JSON.stringify({ time: new Date().toISOString(), client: invoiceData.client, site: invoiceData.site || null }, null, 2));
    } catch (e) { /* noop */ }
    await generateExcelStream(invoiceData, res);
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

// GET /api/invoices/export?siteId=...&month=MM&year=YYYY
exports.exportInvoices = async (req, res) => {
  try {
    const Site = require('../models/Site');
    const siteId = req.query.siteId || req.query.site || null;
    const month = req.query.month ? parseInt(req.query.month) : null; // 1-12
    const year = req.query.year ? parseInt(req.query.year) : null;

    if (!siteId) return res.status(400).json({ msg: 'Missing siteId parameter' });

    // Find site
    let site = await Site.findOne({ id: siteId }) || await Site.findOne({ name: new RegExp(`^${String(siteId).trim().replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}$`, 'i') });
    const siteNameForFile = site ? (site.name || site.clientName || site.id) : siteId;

    // Build invoice query
    const filter = { siteId: siteId };
    let invoices = await Invoice.find(filter).lean();

    // If month/year provided, prefer billingPeriod contains Month Year OR generatedDate month/year
    if (month && year) {
      const monthNameShort = new Date(year, month - 1).toLocaleString('default', { month: 'short' });
      invoices = invoices.filter(inv => {
        const bp = String(inv.billingPeriod || '') || '';
        if (bp && bp.toLowerCase().includes(monthNameShort.toLowerCase()) && bp.includes(String(year))) return true;
        const gd = inv.generatedDate || inv.date || inv.dateGenerated || inv.generated_date;
        if (gd) {
          try {
            const d = new Date(gd);
            if (!isNaN(d) && (d.getMonth() + 1) === month && d.getFullYear() === year) return true;
          } catch (e) { }
        }
        return false;
      });
    }

    if (!invoices || invoices.length === 0) return res.status(404).json({ msg: 'No invoices found for the given filters' });

    const MAX_SHEETS = 120;
    if (invoices.length > MAX_SHEETS) return res.status(413).json({ msg: `Too many invoices to export at once (${invoices.length}). Limit: ${MAX_SHEETS}` });

    const ExcelJS = require('exceljs');
    const masterWorkbook = new ExcelJS.Workbook();

    // Prepare helper to copy worksheet content (values, styles, merges, column widths, row heights)
    function copyWorksheet(src, dest) {
      // copy columns widths
      src.columns.forEach((col, idx) => {
        if (!col) return;
        const dcol = dest.getColumn(idx + 1);
        if (col.width) dcol.width = col.width;
      });

      // copy rows and cells
      src.eachRow({ includeEmpty: true }, (row, rowNumber) => {
        const destRow = dest.getRow(rowNumber);
        destRow.height = row.height;
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const dcell = destRow.getCell(colNumber);
          dcell.value = cell.value;
          dcell.style = Object.assign({}, cell.style || {});
          if (cell.numFmt) dcell.numFmt = cell.numFmt;
          if (cell.alignment) dcell.alignment = Object.assign({}, cell.alignment);
          if (cell.border) dcell.border = Object.assign({}, cell.border);
          if (cell.font) dcell.font = Object.assign({}, cell.font);
          if (cell.fill) dcell.fill = Object.assign({}, cell.fill);
        });
        destRow.commit();
      });

      // copy merges
      try {
        // src._merges is an internal map of merge ranges
        if (src._merges && typeof src._merges.keys === 'function') {
          for (const rng of src._merges.keys()) {
            try { dest.mergeCells(rng); } catch (e) { /* ignore invalid merges */ }
          }
        }
      } catch (e) { /* ignore */ }
    }

    // For each invoice, create a workbook and copy its primary worksheet into master workbook
    for (const inv of invoices) {
      // Merge site data like in downloadBill
      let invoiceData = inv;
      try {
        if (inv.siteId && !inv.site) {
          const s = await Site.findOne({ id: inv.siteId }) || await Site.findOne({ name: new RegExp(`^${String(inv.siteName||'').trim().replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}$`, 'i') });
          if (s) invoiceData.site = s.toObject ? s.toObject() : s;
        }
      } catch (e) { /* ignore */ }

      const wb = await createInvoiceWorkbook(invoiceData, { debug: false });
      const srcWs = wb.getWorksheet('SHREEYA') || wb.worksheets[0];
      const safeName = (inv.invoiceNo || inv.id || 'invoice').toString().replace(/[\\/:*?"<>|\[\]]+/g, '_').slice(0, 31);
      const destWs = masterWorkbook.addWorksheet(safeName);
      copyWorksheet(srcWs, destWs);
    }

    // Stream master workbook
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    const fileName = `Invoices_${(siteNameForFile || 'site')}_${month ? `${month}-${year}` : new Date().toISOString().slice(0,10)}.xlsx`.replace(/\s+/g, '_');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    await masterWorkbook.xlsx.write(res);
    if (!res.writableEnded) res.end();

  } catch (err) {
    console.error('Error exporting invoices:', err);
    if (!res.headersSent) res.status(500).json({ msg: 'Server error exporting invoices' });
  }
};
