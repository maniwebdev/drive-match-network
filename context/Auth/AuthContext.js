import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
require('dotenv').config();
import { useRouter } from 'next/router';
import { message } from 'antd';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

const API_URL = process.env.NEXT_PUBLIC_Car_API_URL;

export const AuthProvider = ({ children }) => {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [authToken, setAuthToken] = useState(null);

    useEffect(() => {
        setAuthToken(localStorage.getItem('authToken'));
    }, []);

    const signup = async (email, password) => {
        // setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setCurrentUser(data.user);
                localStorage.setItem('authToken', data.authtoken);
                setAuthToken(data.authtoken);
                return { success: true, authtoken: data.authtoken }; // Explicitly return success status and token
            } else {
                setError(data.error || 'An error occurred during signup.');
                return { success: false, message: data.error }; // Return error status and message
            }
        } catch (err) {
            setError('Network or server error.');
            return { success: false, message: 'Network or server error.' }; // Return error status and message for catch block
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || "Login failed.");
            }

            // Set the token in localStorage AFTER you've checked for success and parsed the response
            localStorage.setItem('authToken', data.authtoken);

            // If you have another method to set the token elsewhere (like in-memory for the app), you can call it here
            setAuthToken(data.authtoken);
            setCurrentUser(data.user);
            return data.user;  // return user data upon successful login

        } catch (error) {
            console.error('Login failed:', error.message);
            throw error;  // Propagate the error up to be caught by the calling component
        }
    };

    // 
    const fetchCurrentUser = async () => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            //  console.error("No auth token available.");
            setError("You're not logged in.");
            // router.push('/')
            return; // Exit if no authToken is found
        }

        //  setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/auth/fetchuser`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    'auth-token': authToken,
                },
            });

            const json = await response.json();
            if (!response.ok) {
                throw new Error(json.message || "Could not fetch user.");
            }
            setCurrentUser(json); // Assuming the response directly returns the user object
        } catch (err) {
            // setError(err.message);
            //   console.error(err);
            // console.log("ono")
        } finally {
            setLoading(false);
        }
    };

    const updateBasicProfile = async (updateData) => {
        setLoading(true);
        setError(null);

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            message.error("You're not logged in");
            return { success: false, message: "Authentication required" };
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/profile/update/${currentUser?._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken,
                },
                body: JSON.stringify({
                    fullName: updateData.fullName,
                    phoneNumber: updateData.phoneNumber,
                    bio: updateData.bio,
                    socialLinks: updateData.socialLinks,
                    isDriver: updateData.isDriver,
                    driverVerification: updateData.driverVerification,
                    vehicle: updateData.vehicle
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setCurrentUser(data.user); // Update the current user state
                message.success(data.message || 'Profile updated successfully');
                return { success: true, user: data.user };
            } else if (data.errors) {
                // Handle validation errors
                const errorMessages = data.errors.map(err => err.msg).join(', ');
                message.error(errorMessages);
                return { success: false, message: errorMessages };
            } else {
                throw new Error(data.error || 'Failed to update profile');
            }
        } catch (err) {
            const errorMessage = err.message || 'Failed to update profile';
            message.error(errorMessage);
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const uploadProfilePicture = async (file) => {
        const authToken = localStorage.getItem('authToken'); // Ensure authToken is available
        setError(null);

        // Create FormData to handle the file upload
        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const response = await fetch(`${API_URL}/api/auth/imageupload`, {
                method: 'POST',
                headers: {
                    'auth-token': authToken, // Include auth token for authorization
                },
                body: formData,  // Send the FormData containing the image file
            });

            const data = await response.json();

            if (response.ok) {
                setCurrentUser(data.user); // Update the user state with new profile picture
                return { success: true, imagePath: data.imagePath };
            } else {
                setError(data.error || 'An error occurred while uploading the image.');
                return { success: false, message: data.error };
            }
        } catch (err) {
            setError('Network or server error.');
            return { success: false, message: 'Network or server error.' };
        }
    };

    const contextValue = {
        currentUser,
        loading,
        error,
        login,
        signup,
        authToken,
        fetchCurrentUser,
        setCurrentUser,
        updateBasicProfile,
        uploadProfilePicture,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};