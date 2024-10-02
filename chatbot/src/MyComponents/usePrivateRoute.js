import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const usePrivateRoute = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const jwtToken = localStorage.getItem('jwtToken');

    if (!jwtToken) {
      navigate('/'); // Redirect to login if no token
    } else {
      // Check access to the chat page
      fetch('https://bot-build-server.vercel.app/check-access', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      })
        .then(response => response.json())
        .then(data => {
          if (!data.accessGranted) {
            navigate('/chatbot-details'); // Redirect if access is not granted
          }
        })
        .catch(err => {
          console.error('Error checking access:', err);
          navigate('/'); // Redirect to login on error
        });
    }
  }, [navigate]);

  return null; // This hook doesn't render anything; it just handles the redirection logic
};

export default usePrivateRoute;
