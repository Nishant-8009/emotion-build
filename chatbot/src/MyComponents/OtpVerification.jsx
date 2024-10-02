// MyComponents/OtpVerification.jsx

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './OtpVerification.css';

const OtpVerification = () => {
    const [otp, setOtp] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { email } = location.state;
    const [error, setError] = useState('');

    
    const handleOtpChange = (e) => {
        setOtp(e.target.value);
        setError('');
    };

    const handleVerifyOtp = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('https://emotion-build-server.vercel.app/verifyotp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, otp })
            });

            if (response.ok) {
                const data = await response.json();
                const { token } = data;
                localStorage.setItem('jwtToken', token); // Store JWT token in localStorage
                navigate('/chatbot-details');
            } else {    
                const errorText = await response.text();
                setError(errorText); // Set error text directly
                console.error('Invalid OTP');
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
        }
    };

    return (
        <div className="otp-verification-wrapper">
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

            <h1>OTP Verification</h1>
            <form onSubmit={handleVerifyOtp}>
                <p>
                    We have sent an OTP to your email: {email}.
                </p>
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
                <button type="submit">Verify OTP</button>
            </form>
        </div>
    );
};

export default OtpVerification;
