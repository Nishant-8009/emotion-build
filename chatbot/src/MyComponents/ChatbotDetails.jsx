import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './chatbotDetails.css';
import usePrivateRoute from './usePrivateRoute'; // Assuming you have implemented usePrivateRoute.js

const ChatbotDetails = () => {
    usePrivateRoute(); // Ensure authentication before rendering component

    const [formData, setFormData] = useState({
        chatbotName: '',
        chatbotGender: '',
        chatbotAge: '',
        chatbotCountry: '',
        chatbotIsStudying:'',
        chatbotDegree: '',
        chatbotCompany: '',
        userAge: '',
        userGender: '',
        userInterests: '',
        userIsStudying: '',
        userDegree: '',
        userCompany: '',
        specialDates: ''
    });

    const [errorMessage, setErrorMessage] = useState(''); // State for error message
    const [currentPage, setCurrentPage] = useState(1); // State to manage current page
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
        } else if (name === 'chatbotIsStudying') {
            const isStudying = value === 'true';
            setFormData(prevState => ({
                ...prevState,
                [name]: value,
                chatbotDegree: isStudying ? prevState.chatbotDegree : '',
                chatbotCompany: isStudying ? '' : prevState.chatbotCompany
            }));
        } else {
            setFormData({
                ...formData,
                [name]: value
            });
        }
    };
    

    const handleSubmitPage1 = (e) => {
        e.preventDefault();
        setCurrentPage(2); // Move to page 2
    };

    const handleSubmitForm = async (e) => {
        e.preventDefault();
        try {
            // Get JWT token from local storage or context
            const token = localStorage.getItem('jwtToken'); // Adjust as per your auth implementation

            const response = await fetch('https://bot-build-server.vercel.app/save-details', {
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

    const handleBack = () => {
        setCurrentPage(1); // Move back to page 1
    };

    return (
        <div className="" style={{margin:'30px'}}>
        <div className="details-wrapper">
            <h1>ChatMate Details</h1>
            {currentPage === 1 && (
                <form onSubmit={handleSubmitPage1}>
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
                            <textarea
                                name="userInterests"
                                placeholder="Your Interests and Hobbies"
                                value={formData.userInterests}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-box">
                            <textarea
                                name="specialDates"
                                placeholder="Special Dates (Format= `Event: <Date>,`)"
                                value={formData.specialDates}
                                onChange={handleChange}
                                required
                            />
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
            name="userDegree"
            placeholder="Your Degree"
            value={formData.userDegree}
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
                    <button type="submit">Next</button>
                </form>
            )}

            {currentPage === 2 && (
                <form onSubmit={handleSubmitForm}>
                    <div className="section">
                        <h2>Companion's Information</h2>
                        <div className="input-box">
                            <input
                                type="text"
                                name="chatbotName"
                                placeholder="Name your ChatMate"
                                value={formData.chatbotName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-box select-box">
                            <select
                                name="chatbotGender"
                                value={formData.chatbotGender}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select ChatMate Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div className="input-box">
                            <input
                                type="number"
                                name="chatbotAge"
                                placeholder="Age"
                                value={formData.chatbotAge}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-box">
                            <textarea
                                name="chatbotCountry"
                                placeholder="Country"
                                value={formData.chatbotCountry}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="input-box">
    <select
        name="chatbotIsStudying"
        value={formData.chatbotIsStudying}
        onChange={handleChange}
        required
    >
        <option value="">Is ChatMate Studying </option>
        <option value="true">Yes</option>
        <option value="false">No</option>
    </select>
</div>
{formData.chatbotIsStudying === 'true' && (
    <div className="input-box">
        <textarea
            name="chatbotDegree"
            placeholder="Degree"
            value={formData.chatbotDegree}
            onChange={handleChange}
            required
        />
    </div>
)}
{formData.chatbotIsStudying === 'false' && (
    <div className="input-box">
        <textarea
            name="chatbotCompany"
            placeholder="Company Name"
            value={formData.chatbotCompany}
            onChange={handleChange}
            required
        />
    </div>
)}

                    </div>
                    {/* Display Error Message */}
                    {errorMessage && <div className="error-message">{errorMessage}</div>}
                    <div className="button-container">
                        <button type="button" onClick={handleBack}>Back</button>
                        <button type="submit">Save Details</button>
                    </div>
                </form>
            )}
        </div>
        </div>
    );
};

export default ChatbotDetails;
