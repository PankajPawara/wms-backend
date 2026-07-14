require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User.model.js');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select('+password_hash').sort({ createdAt: -1 }).limit(5);
    for (const u of users) {
      console.log('User:', u.employee_id, 'Hash:', u.password_hash);
    }
  } catch(e) { console.error(e); }
  mongoose.disconnect();
});
