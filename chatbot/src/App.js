import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Welcome from './MyComponents/Welcome';
import LoginForm from './MyComponents/LoginForm';
import SignupForm from './MyComponents/SignUp';
import OtpVerification from './MyComponents/OtpVerification';
import ChatPage from './MyComponents/ChatPage';
import ChatbotDetails from './MyComponents/ChatbotDetails';
import BotProfilePage from './MyComponents/BotProfilePage';
import UserProfilePage from './MyComponents/UserProfilePage';
import ForgotPasswordPage from './MyComponents/ForgotPasswordPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/login" element={<LoginForm />} />
      <Route path="/signup" element={<SignupForm />} />
      <Route path="/otp-verification" element={<OtpVerification />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/chatbot-details" element={<ChatbotDetails />} />
      <Route path="/user-profile" element={<UserProfilePage />} />
      <Route path="/bot-profile" element={<BotProfilePage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    </Routes>
  );
}

export default App;
