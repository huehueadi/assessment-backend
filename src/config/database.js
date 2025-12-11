
import mongoose from 'mongoose';

const connectDatabase = async () => {
  try {
    const mongoURL = process.env.MONGODB_URI;
    
    await mongoose.connect(mongoURL);
    
    console.log('Connected to MongoDB successfully!');
    
  } catch (error) {
    console.error('MongoDB connection failed!', error.message);
    
    process.exit(1);
  }
};

export default connectDatabase;