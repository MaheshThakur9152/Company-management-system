const express = require('express');
const router = express.Router();
const billController = require('../controllers/billController');

// Demo route to download a sample invoice without DB (placed before param route)
router.get('/demo/download', billController.downloadDemo);

// GET /api/invoices/:id/download -> stream the invoice
router.get('/:id/download', billController.downloadBill);

module.exports = router;
