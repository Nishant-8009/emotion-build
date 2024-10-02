import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './signUp.css';

export const SignUp = () => {
    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        password: '',
        phoneNumber: ''
    });
    const [error, setError] = useState('');


    const navigate = useNavigate();

    const handleChange = (e) => {
        // Allow only numbers and '+'
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch('https://bot-build-server.vercel.app/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                navigate('/otp-verification', { state: { email: formData.email } });
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Login failed');
                console.error(response);
            }
        } catch (error) {
            console.error('Error sending OTP:', error);
        }
    };

    return (
        <div className="signup-wrapper">
            <meta name="viewport" content="width=device-width, initial-scale=1.0"/>

            <form onSubmit={handleSubmit}>
                <h1>Sign Up</h1>
                <div className="input-box">
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="input-box">
                    <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="input-box">
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="input-box">
                    <input
                        type="password"
                        name="password"
                        placeholder="Create Your Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="input-box">
                    <input
                        type="tel"
                        name="phoneNumber"
                        placeholder="Phone Number"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        inputMode="tel" // Ensures appropriate mobile keyboard
                        pattern="[0-9+]*" // Allows only numeric characters and '+'
                        required
                    />
                </div>
                {error && <div className='error'>{error}</div>}
                <button type="submit">Sign Up</button>
            </form>
        </div>
    );
};

export default SignUp;
