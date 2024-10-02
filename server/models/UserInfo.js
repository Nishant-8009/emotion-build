import mongoose from 'mongoose';

const userInfoSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userAge: { type: Number },
  userGender: { type: String },
  userHobbies: [String],
  specialDates: { type: String },
  companyName: { type: String },
  isStudying: { type: Boolean },
  degree: { type: String },
  favoriteTopics: { type: String },
  preferredCommunicationTimes: { type: String },
  healthWellbeingDetails: { type: String },
  institution: { type: String },
  dailyRoutinePreferences: { type: String },
  goalsAspirations: { type: String },
}, { timestamps: true });

const UserInfo = mongoose.model('UserInfo', userInfoSchema);
export default UserInfo;
