import React, { useState, useEffect } from 'react';
import './UserProfilePage.css';
import { useNavigate } from 'react-router-dom';
import usePrivateRoute from './usePrivateRoute';


const BotProfilePage = ({ bot }) => {
    usePrivateRoute();

    const navigate =  useNavigate();
    const [errorMessage, setErrorMessage] = useState('');

    const [formData, setFormData] = useState({
        userAge: '',
        userGender: '',
        userHobbies: '',
        specialDates: '',
        companyName: '',
        isStudying: '', 
        degree:'',
        favouriteTopics:'',
        preferredCommunicationTimes:'',
        healthWellbeingDetails: '',
        institution:'',
        dailyRoutinePreferences: '',
        goalAspirations:'',
    });

    useEffect(()=>{
        // Get JWT token from local storage or context
        const token = localStorage.getItem('jwtToken'); // Adjust as per your auth implementation
        const fetchBotData = async () => {
            try {
                const response = await fetch(`https://emotion-build-server-1.vercel.app/api/user-info/`,{
                    method: 'GET',
                    headers: {

                      'Authorization': `Bearer ${token}`
                    }
                  });
                if (response.ok) {
                    const data = await response.json();
                    // Populate form data with existing bot data
                    setFormData({
                        userAge: data.userAge || '',
                        userGender: data.userGender || '',
                        userHobbies: data.userHobbies ||'',
                        favouriteTopics: data.favoriteTopics ||'',
                        specialDates: data.specialDates ||'',
                        companyName: data.companyName || '',
                        isStudying: data.isStudying || '',
                        degree: data.degree || '',
                        institution: data.institution ||'',
                        healthWellbeingDetails: data.healthWellbeingDetails ||'',
                        dailyRoutinePreferences: data.dailyRoutinePreferences ||'',
                        preferredCommunicationTimes: data.preferredCommunicationTimes || '',
                        goalAspirations: data.goalsAspirations ||''
                    });
                    
                } else {
                    console.error('Failed to fetch bot data:', await response.json());
                }
            } catch (error) {
                console.error('Error fetching bot data:', error);
            }
        };
        fetchBotData()
    },[]);
   

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
        formDataToSend.append('userAge', formData.userAge);
        formDataToSend.append('userGender', formData.userGender);
        formDataToSend.append('userHobbies', formData.userHobbies);
        formDataToSend.append('specialDates', formData.specialDates);
        formDataToSend.append('companyName', formData.companyName);
        formDataToSend.append('isStudying', formData.isStudying);
        formDataToSend.append('degree', formData.degree);
        formDataToSend.append('favouriteTopics', formData.favouriteTopics);
        formDataToSend.append('preferredCommunicationTimes', formData.preferredCommunicationTimes);
        formDataToSend.append('healthWellbeingDetails', formData.healthWellbeingDetails);
        formDataToSend.append('institution', formData.institution);
        formDataToSend.append('dailyRoutinePreferences', formData.dailyRoutinePreferences);
        formDataToSend.append('goalAspirations', formData.goalAspirations);
        
        try {
            // Get JWT token from local storage or context
            const token = localStorage.getItem('jwtToken'); // Adjust as per your auth implementation

            const response = await fetch('https://emotion-build-server-1.vercel.app/api/user-details-update/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Include JWT token in the request
                },
                body: JSON.stringify(formData) 
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
            <h1>Your Profile</h1>


<div className="input-box">
    <label>User Age:</label>
    <input
        type="number"
        name="userAge"
        placeholder="User Age"
        value={formData.userAge}
        onChange={onhandleChange}
        required
    />
</div>

<div className="input-box">
    <label>User Gender:</label>
    <select value={formData.userGender} name='userGender' onChange={onhandleChange} required>
        <option value="">Select</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
    </select>
</div>

<div className="input-box">
    <label>User Hobbies:</label>
    <textarea
        name="userHobbies"
        placeholder="User Hobbies"
        value={formData.userHobbies}
        onChange={onhandleChange}
        required
    />
</div>

<div className="input-box">
    <label>Special Dates:</label>
    <textarea
        name="specialDates"
        placeholder="Special Dates (e.g., anniversaries, birthdays)"
        value={formData.specialDates}
        onChange={onhandleChange}
        required
    />
</div>



<div className="input-box">
    <label>Is Studying:</label>
    <select
        name="isStudying"
        value={formData.isStudying}
        onChange={onhandleChange}
        required
    >
        <option value="">Is Studying</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
    </select>
</div>

{formData.isStudying === 'true' && (
    <>
        <div className="input-box">
            <label>Degree:</label>
            <textarea
                name="degree"
                placeholder="Degree"
                value={formData.degree}
                onChange={onhandleChange}
                required
            />
        </div>
        <div className="input-box">
            <label>Institution:</label>
            <textarea
                name="institution"
                placeholder="Institution"
                value={formData.institution}
                onChange={onhandleChange}
                required
            />
        </div>
    </>
)}
{formData.isStudying === 'false' && (
    <div className="input-box">
    <label>Company Name:</label>
    <textarea
        name="companyName"
        placeholder="Company Name"
        value={formData.companyName}
        onChange={onhandleChange}
        required
    />
</div>
)}

<div className="input-box">
    <label>Favourite Topics:</label>
    <textarea
        name="favouriteTopics"
        placeholder="Favourite Topics"
        value={formData.favouriteTopics}
        onChange={onhandleChange}
        required
    />
</div>

<div className="input-box">
    <label>Preferred Communication Times:</label>
    <textarea
        name="preferredCommunicationTimes"
        placeholder="Preferred Communication Times"
        value={formData.preferredCommunicationTimes}
        onChange={onhandleChange}
        required
    />
</div>

<div className="input-box">
    <label>Health and Wellbeing Details:</label>
    <textarea
        name="healthWellbeingDetails"
        placeholder="Health and Wellbeing Details"
        value={formData.healthWellbeingDetails}
        onChange={onhandleChange}
        required
    />
</div>

<div className="input-box">
    <label>Daily Routine Preferences:</label>
    <textarea
        name="dailyRoutinePreferences"
        placeholder="Daily Routine Preferences"
        value={formData.dailyRoutinePreferences}
        onChange={onhandleChange}
        required
    />
</div>

<div className="input-box">
    <label>Goals and Aspirations:</label>
    <textarea
        name="goalAspirations"
        placeholder="Goals and Aspirations"
        value={formData.goalAspirations}
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
