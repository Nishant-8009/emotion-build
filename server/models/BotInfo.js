import mongoose from 'mongoose';

const botInfoSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  chatbotName: { type: String, required: true },
  chatbotGender: { type: String, required: true },
  age: { type: Number },
  country: { type: String },
  isStudying: { type: Boolean },
  degree: { type: String },
  companyName: { type: String },
  institution: { type: String },
  hobbies: [String],
  skills: [String],
  personality: { type: String },
  image: { type: Buffer }, // Store image as a Buffer
}, { timestamps: true });

const BotInfo = mongoose.model('BotInfo', botInfoSchema);
export default BotInfo;
