const mongoose = require('mongoose');

const connectToDatabase = async () => {
  if (mongoose.connection.readyState >= 1) {
    console.log('=> using existing database connection');
    return;
  }

  console.log('=> using new database connection');
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    mongoose.connection.on('connected', () => {
        console.log('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
    });

  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectToDatabase;
