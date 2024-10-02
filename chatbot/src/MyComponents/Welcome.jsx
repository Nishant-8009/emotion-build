// MyComponents/Welcome.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import './Welcome.css';

const Welcome = () => {
  return (
    <div className="page-container">
      <h1 className="app-title">ByteBond</h1>
      <div className="buttons">
        <Link to="/login" className="button login-button" aria-label="Login">Login</Link>
        <Link to="/signup" className="button signup-button" aria-label="Sign Up">Sign Up</Link> 
      </div>
    </div>
  );
}

export default Welcome;



