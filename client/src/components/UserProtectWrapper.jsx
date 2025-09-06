import React, { useContext, useEffect, useState } from 'react';
import AuthDataContext  from '../context/AuthDataContext';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserProtectWrapper = ({ children }) => {
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthDataContext);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    console.log('UserProtectWrapper - token:', token);
    console.log('UserProtectWrapper - user:', user);
    console.log('UserProtectWrapper - isLoading:', isLoading);
    
    if (!token) {
      console.log('UserProtectWrapper - No token, redirecting to login');
      navigate('/login', { state: { redirectTo: location.pathname } });
      return;
    }

    // Only fetch if user is not already set
    if (!user || !user._id) {
      console.log('UserProtectWrapper - Fetching user profile...');
      axios.get('http://localhost:5000/api/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      .then(response => {
        console.log("Profile Data",response.data);
        if (response.status === 200 && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
          setIsLoading(false);
        } else {
          throw new Error('Invalid user data');
        }
      })
      .catch(err => {
        console.log('UserProtectWrapper - Error fetching profile:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      });
    } else {
      console.log('UserProtectWrapper - User already loaded, setting loading to false');
      setIsLoading(false);
    }
  }, [token, user, setUser, navigate]);

  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center py-10 text-gray-600">Loading...</div>
    );
  }

  return <>{children}</>;
};

export default UserProtectWrapper; 