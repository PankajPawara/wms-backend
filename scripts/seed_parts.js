const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const PartsMaster = require('../src/models/PartsMaster.model');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wms_backend';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');

    console.log('Reading parts_db.json...');
    const rawData = fs.readFileSync(path.join(__dirname, '../../parts_db.json'), 'utf-8');
    const partsData = JSON.parse(rawData);

    console.log(`Found ${partsData.length} parts in JSON. Formatting...`);

    const formattedParts = partsData.map(p => ({
      partNo: p.p,
      barcode: p.b || p.p.replace(/-/g, ''),
      location: p.l || 'N/A',
      description: '', // default
      mrp: 0, // default
      packQty: 1,
      stockQty: 0,
      source: 'excel_import',
      isActive: true,
      lastSeenAt: new Date()
    }));

    console.log('Clearing existing PartsMaster data...');
    await PartsMaster.deleteMany({});

    console.log('Seeding PartsMaster data (this may take a moment)...');
    
    // Insert in batches to prevent memory issues with large datasets
    const batchSize = 1000;
    for (let i = 0; i < formattedParts.length; i += batchSize) {
      const batch = formattedParts.slice(i, i + batchSize);
      await PartsMaster.insertMany(batch);
      console.log(`Inserted ${i + batch.length} / ${formattedParts.length}`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
