require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');

(async () => {
  try {
    await connectDB();
    await mongoose.connection.dropDatabase();
    console.log('Database dropped.');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
