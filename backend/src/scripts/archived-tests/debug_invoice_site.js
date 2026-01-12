require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Site = require('../models/Site');
(async()=>{
  await mongoose.connect(process.env.MONGODB_URI);
  const inv = await Invoice.findById('17674609729560.107031558931179');
  if (!inv) return console.error('invoice not found');
  const out = {
    invoiceNo: inv.invoiceNo,
    siteId: inv.siteId,
    siteName: inv.siteName,
    client_field: inv.client,
    client_name_field: inv.client_name
  };
  console.log(JSON.stringify(out, null, 2));
  if (inv.siteId) {
    const site = await Site.findOne({ id: inv.siteId });
    if (site) console.log(JSON.stringify({ site_clientName: site.clientName, site_companyName: site.companyName, site_location: site.location, site_gstin: site.clientGstin }, null, 2));
  }
  process.exit(0);
})();