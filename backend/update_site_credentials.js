const mongoose = require('mongoose');
const Site = require('./models/Site');
const connectToDatabase = require('./utils/db');
require('dotenv').config();

async function updateSite() {
    await connectToDatabase();
    try {
        const site = await Site.findOne({ id: 's1' });
        if (site) {
            site.username = 'site1';
            site.password = 'ambe123';
            await site.save();
            console.log('Site s1 updated with username: site1');
        } else {
            console.log('Site s1 not found. Attempting to seed...');
            // If not found, maybe seed didn't run. Let's create it.
            const newSite = new Site({
                id: 's1',
                name: 'Min_CHS (Sales Office)',
                location: 'Minerva Building, Mumbai',
                latitude: 18.995,
                longitude: 72.82,
                username: 'site1',
                password: 'ambe123'
            });
            await newSite.save();
            console.log('Site s1 created with username: site1');
        }
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

updateSite();
