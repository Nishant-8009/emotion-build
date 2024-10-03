import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './chatbotDetails.css';
import usePrivateRoute from './usePrivateRoute'; // Assuming you have implemented usePrivateRoute.js

const ChatbotDetails = () => {
    usePrivateRoute(); // Ensure authentication before rendering component

    const [formData, setFormData] = useState({
        userAge: '',
        userGender: '',
        userIsStudying: '',
        userInstitution: '',
        userCompany: '',
    });

    const [errorMessage, setErrorMessage] = useState(''); // State for error message
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
    
        if (name === 'userIsStudying') {
            const isStudying = value === 'true';
            setFormData(prevState => ({
                ...prevState,
                [name]: value,
                userDegree: isStudying ? prevState.userDegree : '',
                userCompany: isStudying ? '' : prevState.userCompany
            }));
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        try {
            // Get JWT token from local storage or context
            const token = localStorage.getItem('jwtToken'); // Adjust as per your auth implementation

            const response = await fetch('https://emotion-build-server-1.vercel.app/save-details', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Include JWT token in the request
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                navigate('/chat'); // Redirect to ChatPage upon successful form submission
            } else {
                const errorData = await response.json(); // Parse error response
                setErrorMessage(errorData.error || 'Failed to save details'); // Set error message
            }
        } catch (error) {
            console.error('Error saving details:', error);
            setErrorMessage('An error occurred while saving details. Please try again.'); // Set error message
        }
    };

    return (
        <div className="" style={{ margin: '30px' }}>
            <div className="details-wrapper">
                <h1>User Details</h1>
                <form onSubmit={handleSubmitForm}>
                    <div className="section">
                        <h2>User's Information</h2>
                        <div className="input-box">
                            <input
                                type="number"
                                name="userAge"
                                placeholder="Your Age"
                                value={formData.userAge}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-box select-box">
                            <select
                                name="userGender"
                                value={formData.userGender}
                                onChange={handleChange}
                                required
                            >
                                <option value="not specified">Select Your Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div className="input-box">
                            <select
                                name="userIsStudying"
                                value={formData.userIsStudying}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Are you Studying </option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                        {formData.userIsStudying === 'true' && (
                            <div className="input-box">
                                <textarea
                                    name="userInstitution"
                                    placeholder="Your Institution"
                                    value={formData.userInstitution}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}
                        {formData.userIsStudying === 'false' && (
                            <div className="input-box">
                                <textarea
                                    name="userCompany"
                                    placeholder="Your Company Name"
                                    value={formData.userCompany}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        )}
                    </div>
                    {/* Display Error Message */}
                    {errorMessage && <div className="error-message">{errorMessage}</div>}
                    <button type="submit">Save Details</button>
                </form>
            </div>
        </div>
    );
};

export default ChatbotDetails;
