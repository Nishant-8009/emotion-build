import React, { useState, useEffect } from 'react';
import './BotProfilePage.css';
import { GoPencil } from "react-icons/go";
import { useNavigate } from 'react-router-dom';
import usePrivateRoute from './usePrivateRoute';
import userimg from '../user.png';

const BotProfilePage = ({ bot }) => {
    usePrivateRoute();

    const navigate =  useNavigate();
    const [errorMessage, setErrorMessage] = useState('');

    const [formData, setFormData] = useState({
        botName: '',
        botGender: '',
        chatbotAge: '',
        chatbotDegree: '',
        chatbotCompany: '',
        chatbotCountry: '', 
        hobbies:'',
        skills:'',
        Personality:'',
        chatbotIsStudying: '',
        Institution:'',
        botImage: null
    });

    const [imagePreview, setImagePreview] = useState(null);
    useEffect(()=>{
        // Get JWT token from local storage or context
        const token = localStorage.getItem('jwtToken'); // Adjust as per your auth implementation
        const fetchBotData = async () => {
            try {
                const response = await fetch(`https://emotion-build-server.vercel.app/api/bot-info/`,{
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                if (response.ok) {
                    const data = await response.json();
                    // Populate form data with existing bot data
                    setFormData({
                        botName: data.chatbotName || '',
                        botGender: data.chatbotGender || '',
                        chatbotAge: data.age ||'',
                        chatbotCountry: data.country ||'',
                        chatbotIsStudying: data.isStudying ||'',
                        chatbotCompany: data.companyName || '',
                        chatbotDegree: data.degree || '',
                        hobbies: data.hobbies || '',
                        skills: data.skills ||'',
                        Personality: data.personality ||'',
                        Institution: data.institution ||'',
                        botImage: data.image || null // assuming bot_image stores image as blob or URL
                    });
                    if (data.image) {
                        setImagePreview(`data:image/jpeg;base64,${data.image}`);
                    }
                    
                } else {
                    console.error('Failed to fetch bot data:', await response.json());
                }
            } catch (error) {
                console.error('Error fetching bot data:', error);
            }
        };
        fetchBotData()
    },[]);
   

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({
                ...formData,
                botImage: file // Update formData with new image file
            });
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const onhandleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'chatbotIsStudying') {
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
    }
    const handleSave = async (e) => {
        e.preventDefault();
        const formDataToSend = new FormData();
        formDataToSend.append('botName', formData.botName);
        formDataToSend.append('botGender', formData.botGender);
        formDataToSend.append('chatbotAge', formData.chatbotAge);
        formDataToSend.append('chatbotDegree', formData.chatbotDegree);
        formDataToSend.append('chatbotCompany', formData.chatbotCompany);
        formDataToSend.append('chatbotCountry', formData.chatbotCountry);
        formDataToSend.append('hobbies', formData.hobbies);
        formDataToSend.append('skills', formData.skills);
        formDataToSend.append('Personality', formData.Personality);
        formDataToSend.append('Institution', formData.Institution);
        formDataToSend.append('chatbotIsStudying', formData.chatbotIsStudying);
        if (formData.botImage) {
            formDataToSend.append('botImage', formData.botImage);
        }
        try {
            // Get JWT token from local storage or context
            const token = localStorage.getItem('jwtToken'); // Adjust as per your auth implementation

            const response = await fetch('https://emotion-build-server.vercel.app/api/bot-details-update/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}` // Include JWT token in the request
                },
                body: formDataToSend
            });

            if (response.ok) {
                window.location.reload(); // Redirect to ChatPage upon successful form submission
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
        navigate('/chat');
    };

    return (

        <div className="bot-profile-container">
            <h1>Bot Profile</h1>
            <div className="image-upload">
                <label htmlFor="file-input">
                    <div className="image-preview-circle">
                     
                        {imagePreview ? (
                            <img src={imagePreview} alt="Bot" />
                        ) : (
                            <img src={userimg} alt="Bot" />
                        )}
                        <div className="edit-icon">
                            <GoPencil size={20} color={'white'}/>
                        </div>
                        
                    </div>
                </label>
                <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                />
            </div>
            <div className="input-box">
                <label>Bot Name :</label>
                <input type="text" name='botName' value={formData.botName} onChange={onhandleChange} />
            </div>
            <div className="input-box">
                <label>Bot Gender :</label>
                <select value={formData.botGender} name='botGender' onChange={onhandleChange}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <div className="input-box">
            <label>Age :</label>
                            <input
                                type="number"
                                name="chatbotAge"
                                placeholder="Age"
                                value={formData.chatbotAge}
                                onChange={onhandleChange}
                                required
                            />
                        </div>
            <div className="input-box">
            <label>Is Studying :</label>
                <select
                    name="chatbotIsStudying"
                    value={formData.chatbotIsStudying}
                    onChange={onhandleChange}
                    required
                >
                    <option value="">Is ChatMate Studying </option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>
            </div>
            {formData.chatbotIsStudying === 'true' && (
                <>
                <div className="input-box">
                    <label>Degree :</label>
                    <textarea
                        name="chatbotDegree"
                        placeholder="Degree"
                        value={formData.chatbotDegree}
                        onChange={onhandleChange}
                        required
                    />
                </div>
                <div className="input-box">
                <label>Institution :</label>
                <textarea
                    name="Institution"
                    placeholder="Institution"
                    value={formData.Institution}
                    onChange={onhandleChange}
                    required
                />
            </div>
            </>
            )}
            {formData.chatbotIsStudying === 'false' && (
                <div className="input-box">
                    <label>Company Name :</label>
                    <textarea
                        name="chatbotCompany"
                        placeholder="Company Name"
                        value={formData.chatbotCompany}
                        onChange={onhandleChange}
                        required
                    />
                </div>
            )}
                    <div className="input-box">
                    <label>Country :</label>
                            <textarea
                                name="chatbotCountry"
                                placeholder="Country"
                                value={formData.chatbotCountry}
                                onChange={onhandleChange}
                                required
                            />
                        </div>
                        <div className="input-box">
                    <label>Hobbies :</label>
                            <textarea
                                name="hobbies"
                                placeholder="Hobbies"
                                value={formData.hobbies}
                                onChange={onhandleChange}
                                required
                            />
                        </div>
                        <div className="input-box">
                    <label>Skills :</label>
                            <textarea
                                name="skills"
                                placeholder="Skills"
                                value={formData.skills}
                                onChange={onhandleChange}
                                required
                            />
                        </div>
                        <div className="input-box">
                    <label>Personality :</label>
                            <textarea
                                name="Personality"
                                placeholder="Personality"
                                value={formData.Personality}
                                onChange={onhandleChange}
                                required
                            />
                        </div>

            {errorMessage && <div className="error-message">{errorMessage}</div>}
            <button onClick={handleSave}>Save</button>
            <button onClick={handleBack}>Back</button>
        </div>
    );
};

export default BotProfilePage;
