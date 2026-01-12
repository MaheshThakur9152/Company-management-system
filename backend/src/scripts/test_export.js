require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const Site = require('../models/Site');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const site = await Site.findOne({ name: /Ruparel Elara/i });
    if (!site) {
      console.error('Site Ruparel Elara not found');
      process.exit(1);
    }
    const token = jwt.sign({ userId: 'ambe', role: 'admin' }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '1h' });
    const month = 12; const year = 2025;
    const url = `http://localhost:${process.env.PORT || 3002}/api/invoices/export?siteId=${encodeURIComponent(site.id)}&month=${month}&year=${year}`;
    console.log('Requesting', url);
    const resp = await axios.get(url, { responseType: 'arraybuffer', headers: { Authorization: `Bearer ${token}` } });
    if (resp.status === 200) {
      const out = '/tmp/Export_Ruparel_Elara.xlsx';
      fs.writeFileSync(out, Buffer.from(resp.data));
      console.log('Saved to', out);
      process.exit(0);
    } else {
      console.error('Server returned', resp.status, resp.data.toString());
      process.exit(2);
    }
  } catch (err) {
    console.error('Error', err && err.message ? err.message : err);
    process.exit(1);
  }
})();