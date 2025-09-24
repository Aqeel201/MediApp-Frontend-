// api.js
import axios from 'axios';


// Function to register a user
const registerUser = async (userData) => {
  try {
    const response = await axios.post('http://192.168.18.5:3001/api/register', userData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 201 || response.status === 200) {
      return {
        success: true,
        token: response.data.token, // Assuming the token is sent in the response
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Registration failed',
      };
    }
  } catch (error) {
    console.error('Error during registration:', error);
    return {
      success: false,
      message: error.response?.data?.message || 'An error occurred during registration.',
    };
  }
};

module.exports = {
  registerUser,
};
