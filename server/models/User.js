import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true, required: true },
  username: { type: String, required: true },
  fullName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  otp: { type: String }, // Optional if you want to store OTP here
  lastOnlineTime: {
    type: String, // Store as String (ISO 8601 format)
    default: () => new Date().toISOString() // Default value as current date/time in ISO format
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
