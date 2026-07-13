require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const db = mongoose.connection.db;
  const hash = await bcrypt.hash('Pass@1234', 12);
  await db.collection('users').updateOne({employee_id: '15'}, {$set: {password_hash: hash}});
  console.log('Password reset to Pass@1234');
  process.exit(0);
});
