
import mongoose from 'mongoose';

const connectDatabase = async () => {
  try {
    const mongoURL = process.env.MONGODB_URI;
    
    await mongoose.connect(mongoURL);
    
    console.log('✅ Connected to MongoDB successfully!');
    console.log('📦 Database:', mongoURL);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed!');
    console.error('Error:', error.message);
    
    process.exit(1);
  }
};

export default connectDatabase;