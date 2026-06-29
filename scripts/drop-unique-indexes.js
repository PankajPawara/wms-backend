const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected.');

    const db = mongoose.connection.db;
    const collection = db.collection('inventories');

    console.log('Fetching indexes for "inventories" collection...');
    let indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Identify unique indexes to drop
    const uniqueIndexes = indexes.filter(idx => idx.unique && (idx.name.includes('part_no') || idx.name.includes('barcode')));
    
    for (const idx of uniqueIndexes) {
      console.log(`Dropping unique index: ${idx.name}...`);
      await collection.dropIndex(idx.name);
      console.log(`Dropped index: ${idx.name}`);
    }

    console.log('Indexes after dropping:');
    indexes = await collection.indexes();
    console.log(indexes);

    console.log('Creating standard non-unique indexes...');
    await collection.createIndex({ barcode: 1 });
    await collection.createIndex({ part_no: 1 });
    console.log('Done!');

    await mongoose.disconnect();
    console.log('Disconnected.');
  } catch (err) {
    console.error('Error running script:', err);
    process.exit(1);
  }
};

run();
