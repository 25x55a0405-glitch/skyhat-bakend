const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn('⚠  MONGO_URI not set — running without database. Some features will fail.');
    return;
  }

  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB Atlas connected successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.warn('⚠  Server will continue without database. Some features will fail.');
  }
};

module.exports = connectDB;
