import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';
import './LoginForm.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://emotion-build-server-1.vercel.app/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usernameOrEmail, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('jwtToken', data.token); // Store token in localStorage

        // Navigate based on server response
        navigate(data.navigate);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed');
    }
  };
  


  return (
    <div className='wrapper'>
      <form onSubmit={handleLogin}>
        <h1>Login</h1>
        {error && <div className='error'>{error}</div>}
        <div className='input-box'>
          <input
            type='text'
            placeholder='Email or Phone Number'
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            required
          />
          <FaUser className='icon' />
        </div>
        <div className='input-box'>
          <input
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FaLock className='icon' />
        </div>
        <div className='remember-forgot'>
          {/* <label>
            <input type='checkbox' /> Remember me
          </label> */}
          <a href='/forgot-password' >Forgot password?</a>
        </div>

        <button type='submit'>Login</button>

        <div className='register-link'>
          <p>
            Don't have an account? <a href='/signup'>Sign up</a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;
