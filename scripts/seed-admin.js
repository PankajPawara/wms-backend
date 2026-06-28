require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User.model');
const env = require('../src/config/env');

const seedAdmin = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ employee_id: 'ADMIN001' });
  if (existing) {
    console.log('Admin already exists:', existing.employee_id);
    process.exit(0);
  }

  const admin = await User.create({
    employee_id: 'ADMIN001',
    name: 'System Admin',
    mobile: '9000000001',
    email: 'admin@warehouse.com',
    address: 'Warehouse HQ',
    password_hash: 'Admin@1234',
    role: 'admin',
    status: 'active',
    is_first_login: false,
  });

  console.log('Admin created successfully:');
  console.log('  Employee ID:', admin.employee_id);
  console.log('  Password:   Admin@1234');
  console.log('  Role:       admin');
  console.log('\nChange this password immediately after first login!');
  process.exit(0);
};

seedAdmin().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
