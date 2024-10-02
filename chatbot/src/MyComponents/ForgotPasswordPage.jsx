// MyComponents/ForgotPasswordPage.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Forgot.css';

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [otpSent, setOtpSent] = useState(false); // State to manage OTP sent status
    const navigate = useNavigate();

    const handleEmailChange = (e) => {
        setEmail(e.target.value);
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
    };

    const handleConfirmPasswordChange = (e) => {
        setConfirmPassword(e.target.value);
    };

    const handleOtpChange = (e) => {
        setOtp(e.target.value);
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();

        // Check if passwords match
        if (password !== confirmPassword) {
            setError("Passwords do not match. Please enter matching passwords.");
            return;
        }

        try {
            // Send OTP request to backend
            const response = await fetch('https://emotion-build-server-1.vercel.app/api/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({email}),
            });

            if (response.ok) {
                setOtpSent(true); // Set OTP sent status to true
                setError('');
                console.log('OTP sent successfully to:', email);
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to send OTP. Please try again.');
            }
        } catch (error) {
            setError('Failed to send OTP. Please try again.');
        }
    };

    const handleVerifyOtpAndUpdatePassword = async (e) => {
        e.preventDefault();

        try {
            // Verify OTP and update password
            const response = await fetch('https://emotion-build-server-1.vercel.app/api/verify-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, otp, password }),
            });

            if (response.ok) {
                // Navigate to login page or a success page after successful password update
                navigate('/login');
            } else {
                const data = await response.json();
                setError(data.message || 'Failed to verify OTP or update password. Please try again.');
            }
        } catch (error) {
            setError('Failed to verify OTP or update password. Please try again.');
        }
    };

    return (
        <div className="forgot-password-wrapper">
            <h1>Forgot Password</h1>
            {!otpSent ? (
                <form onSubmit={handleSendOtp}>
                    <div className="input-box">
                        <input
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={handleEmailChange}
                            required
                        />
                    </div>
                    <div className="input-box">
                        <input
                            type="password"
                            name="password"
                            placeholder="Enter new password"
                            value={password}
                            onChange={handlePasswordChange}
                            required
                        />
                    </div>
                    <div className="input-box">
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit">Send OTP</button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtpAndUpdatePassword}>
                    <div className="input-box">
                        <input
                            type="text"
                            name="otp"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={handleOtpChange}
                            required
                        />
                    </div>
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit">Verify OTP and Update Password</button>
                </form>
            )}
        </div>
    );
};

export default ForgotPasswordPage;
