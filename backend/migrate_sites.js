const mongoose = require('mongoose');
const Site = require('./models/Site');
const connectToDatabase = require('./utils/db');
require('dotenv').config();

const SITE_CREDENTIALS = {
    's1': { username: 'minerva9', pass: 'minerva123' },
    's2': { username: 'minervaho', pass: 'minerva123' },
    's3': { username: 'royal', pass: 'royal123' },
    's4': { username: 'ceejay', pass: 'ceejay123' },
    's5': { username: 'sanjay', pass: 'sanjay123' },
    's6': { username: 'elara', pass: 'elara123' },
    's7': { username: 'ajmera', pass: 'ajmera123' },
    's8': { username: 'acme', pass: 'acme123' },
    's9': { username: 'shreeya', pass: 'shreeya123' },
    's10': { username: 'ambeoffice', pass: 'ambe123' },
    's11': { username: 'washroom', pass: 'washroom123' },
    's12': { username: 'minlo', pass: 'minlo123' },
    's13': { username: 'palacio', pass: 'palacio123' },
    's14': { username: 'bpinfra', pass: 'bpinfra123' },
    's15': { username: 'minsales', pass: 'minsales123' },
    's16': { username: 'rounder', pass: 'rounder123' }
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
            site.password = creds.pass;
            await site.save();
            console.log(`Updated ${site.name} (${site.id}) with username: ${creds.username}`);
        } else {
            // Generate default for others
            if (!site.username) {
                site.username = site.name.toLowerCase().replace(/\s+/g, '').substring(0, 10);
                site.password = 'ambe123';
                await site.save();
                console.log(`Generated defaults for ${site.name}: ${site.username}`);
            }
        }
    }

    console.log("Migration complete");
    process.exit(0);
}

migrate();
