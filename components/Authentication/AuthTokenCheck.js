/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';

export const AuthTokenCheck = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [hasFetchedUserDetails, setHasFetchedUserDetails] = useState(false);
    const { currentUser, fetchCurrentUser } = useAuth();

    useEffect(() => {
        const authToken = localStorage.getItem('authToken');
        if (authToken) {
            setIsAuthenticated(true);
            fetchCurrentUser()
                .then(() => setHasFetchedUserDetails(true))
                .catch(() => setHasFetchedUserDetails(true)); // Ensure state is updated even if there's an error
        } else {
            setHasFetchedUserDetails(true); // No token, so no need to fetch user details
        }
    }, []);

    return { isAuthenticated, isUserVerified: currentUser?.isVerified > 0, hasFetchedUserDetails };
};