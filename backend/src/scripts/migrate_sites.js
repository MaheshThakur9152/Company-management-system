const mongoose = require('mongoose');
const Site = require('../models/Site');
const connectToDatabase = require('../utils/db');
require('dotenv').config({ path: '../.env' });

const SITE_CREDENTIALS = {
    's1': { username: 'minerva9', pass: '' },
    's2': { username: 'minervaho', pass: '' },
    's3': { username: 'royal', pass: '' },
    's4': { username: 'ceejay', pass: '' },
    's5': { username: 'sanjay', pass: '' },
    's6': { username: 'elara', pass: '' },
    's7': { username: 'ajmera', pass: '' },
    's8': { username: 'acme', pass: '' },
    's9': { username: 'shreeya', pass: '' },
    's10': { username: 'ambeoffice', pass: '' },
    's11': { username: 'washroom', pass: '' },
    's12': { username: 'minlo', pass: '' },
    's13': { username: 'palacio', pass: '' },
    's14': { username: 'bpinfra', pass: '' },
    's15': { username: 'minsales', pass: '' },
    's16': { username: 'rounder', pass: '' }
};

async function migrate() {
    await connectToDatabase();
    console.log("Connected to DB");

    const sites = await Site.find({});
    console.log(`Found ${sites.length} sites`);

    for (const site of sites) {
        const creds = SITE_CREDENTIALS[site.id];
        if (creds) {
            site.username = creds.username;
            // Do not set default passwords in bulk; leave empty so admin can set a secure password
            site.password = '';
            await site.save();
            console.log(`Updated ${site.name} (${site.id}) with username: ${creds.username}`);
        } else {
            // Generate default for others
            if (!site.username) {
                site.username = site.name.toLowerCase().replace(/\s+/g, '').substring(0, 10);
                site.password = '';
                await site.save();
                console.log(`Generated defaults for ${site.name}: ${site.username}`);
            }
        }
    }

    console.log("Migration complete");
    process.exit(0);
}

migrate();
