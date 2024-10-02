import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const dbURI = process.env.MONGODB_URI ;

mongoose.connect(dbURI, {
  useNewUrlParser: true, // This option is no longer needed
  useUnifiedTopology: true, // This option is no longer needed
  dbName: 'chatbot', // Specify the database name if needed
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('MongoDB connected');
});

export default db;
