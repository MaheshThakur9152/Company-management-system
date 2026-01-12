require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Site = require('../models/Site');
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const invoice = await Invoice.findById('17674609729560.107031558931179');
  console.log('invoice id:', invoice ? (invoice.id || invoice._id) : 'invoice not found');
  console.log('invoice invoiceNo:', invoice ? invoice.invoiceNo : 'n/a');
  console.log('invoice siteId:', invoice ? invoice.siteId : 'n/a');
  console.log('invoice siteName:', invoice ? invoice.siteName : 'n/a');
  if (invoice && invoice.siteId) {
    const site = await Site.findOne({ id: invoice.siteId });
    if (site) {
      const s = site.toObject();
      console.log('site clientName:', s.clientName);
      console.log('site companyName:', s.companyName);
      console.log('site location:', s.location);
      console.log('site clientGstin:', s.clientGstin);
    } else console.log('site not found by siteId');
  } else {
    // try siteName
    const site = await Site.findOne({ name: /Sanjay/i });
    if (site) {
      const s = site.toObject();
      console.log('site by name clientName:', s.clientName);
      console.log('site by name companyName:', s.companyName);
      console.log('site by name location:', s.location);
      console.log('site by name clientGstin:', s.clientGstin);
    } else console.log('no site found with name pattern');
  }
  process.exit(0);
})();