import React, { useState, useEffect, useRef } from 'react';
import './ChatPage.css';
import { Link } from 'react-router-dom';
import { RiArrowRightSLine } from "react-icons/ri";
import { BsThreeDotsVertical } from "react-icons/bs";
import { format, isToday, isYesterday } from 'date-fns';
import usePrivateRoute from './usePrivateRoute'; // Assuming you have implemented usePrivateRoute.js
import { useNavigate } from 'react-router-dom';
import user from '../user.png';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const ChatPage = () => {
  usePrivateRoute(); // Ensure authentication before rendering component
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [botName, setBotName] = useState("Assistant"); // Default bot name
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef(null);

  useEffect(() => {
    // Fetch messages from backend when component loads
    const fetchMessages = async () => {
      try {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
          throw new Error('JWT token not found!');
        }

        const response = await fetch('https://emotion-build-server-1.vercel.app/api/fetch_messages', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setMessages(data); // Update state with fetched messages
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    fetchMessages();
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    
  }, []);

  useEffect(() => {
    const chatBox = document.querySelector('.chat-box');
    chatBox.scrollTop = chatBox.scrollHeight;

  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async () => {
    if (input.trim()) {
      const token = localStorage.getItem('jwtToken');

      if (!token) {
        console.error('JWT token not found!');
        return;
      }
      const newMessage = {
        sender: 'user',
        text: input,
        timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        botName: botName
      };

      setMessages([...messages, newMessage]);
      setInput('');

      try {
        console.log(newMessage);
        const response = await fetch('https://emotion-build-server-1.vercel.app/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newMessage)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        const chatbotResponse = {
          sender: 'chatbot',
          text: data,
          timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
          botName: botName
        };
        console.log(data)

        // Add the chatbot's response to the message list
        setMessages(prevMessages => [...prevMessages, chatbotResponse]);
      } catch (error) {
        console.error('Error fetching chatbot response:', error);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatDate = (date) => {
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  const formatTime = (date) => {
    return format(date, 'HH:mm');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const handleEmojiSelect = (emoji) => {
    setInput(input + emoji.native);
    setShowEmojiPicker(false); 
  };

  const clearChatHandle = async () => {
    const token = localStorage.getItem('jwtToken');
    
    if (!token) {
      console.error('JWT token not found!');
      navigate('/login');
      return;
    }
    try {
      const response = await fetch('https://emotion-build-server-1.vercel.app/api/clearchat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        window.location.reload();
        console.log('Chat cleared successfully');
      } else {
        const errorMessage = await response.text();
        console.error(`Failed to clear chat: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('jwtToken');
      
      if (!token) {
        console.error('JWT token not found!');
        navigate('/login');
        return;
      }
      
      const response = await fetch('https://emotion-build-server-1.vercel.app/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Logout failed! HTTP status: ${response.status}`);
      }

      console.log('Logged out successfully');
      localStorage.removeItem('jwtToken');
      closeMenu();
      navigate('/login');

    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="chat-container">
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <div className="Navbar">
        <div className="bot-info">
          <img src={user} alt="Bot" className="bot-image" />
          <span className="bot-name">{botName}</span>
        </div>
        <div className="menu">
          <button className="menu-button" onClick={toggleMenu}>
            <BsThreeDotsVertical />
          </button>

          {isMenuOpen && (
            <div className="menu-content">
              <Link to="/bot-profile" className="menu-item" onClick={closeMenu}>{botName} Profile</Link>
              <Link to="/user-profile" className="menu-item" onClick={closeMenu}>Your Profile</Link>
              <Link to="/settings" className="menu-item" onClick={closeMenu}>Settings</Link>
              <button className="menu-item" onClick={clearChatHandle}>Clear Chat</button>
              <button className="menu-item" onClick={handleLogout}>Log Out</button>
            </div>
          )}
        </div>
      </div>

      <div className="chat-box">
        {messages.map((msg, index) => {
          const previousMsg = messages[index - 1];
          const showDate = !previousMsg || formatDate(new Date(previousMsg.timestamp)) !== formatDate(new Date(msg.timestamp));

          return (
            <div key={index} className="message-container">
              {showDate && (
                <div className="message-date">
                  {formatDate(new Date(msg.timestamp))}
                </div>
              )}
              <div className={`chat-message ${msg.sender === 'user' ? 'user-message' : 'chatbot-message'}`}>
                {msg.text}
                <div className="message-time">
                  {formatTime(new Date(msg.timestamp))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="input-container">
        <div className="emoji-button" onClick={toggleEmojiPicker}>
          <span role="img" aria-label="Smile">😊</span>
        </div>
        {showEmojiPicker && (
          <div className="emoji-picker" ref={emojiPickerRef}>
            <Picker data={data} onEmojiSelect={handleEmojiSelect} />
          </div>
        )}
        <textarea
          className="input-box"
          placeholder="Message"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
        />
        <button className="send-button" onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatPage;
