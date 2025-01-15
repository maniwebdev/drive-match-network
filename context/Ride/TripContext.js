import React, { createContext, useState, useContext, useEffect } from 'react';
require('dotenv').config();
import { useRouter } from 'next/router';
import { message } from 'antd';

const TripContext = createContext();

export const useTrip = () => {
    return useContext(TripContext);
};

const API_URL = process.env.NEXT_PUBLIC_Car_API_URL;

export const TripProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [myTrips, setMyTrips] = useState([]);
    const [availableTrips, setAvailableTrips] = useState([]);
    const router = useRouter();

    // Create a new trip request
    const createTripRequest = async (tripData) => {
        setLoading(true);
        setError(null);

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            message.error("You're not logged in");
            return { success: false };
        }

        try {
            const response = await fetch(`${API_URL}/api/tripRequestRoutes/trip/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken,
                },
                body: JSON.stringify(tripData),
            });

            const data = await response.json();

            if (response.ok) {
                message.success('Trip request created successfully');
                // Update myTrips state with new trip
                setMyTrips(prev => [data.tripRequest, ...prev]);
                return { success: true, trip: data.tripRequest };
            } else {
                throw new Error(data.message || 'Failed to create trip request');
            }
        } catch (err) {
            const errorMessage = err.message || 'Error creating trip request';
            message.error(errorMessage);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Get all available trip requests (for drivers)
    const getAvailableTrips = async (filters = {}) => {
        setLoading(true);
        setError(null);

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            message.error("You're not logged in");
            return { success: false };
        }

        try {
            const queryParams = new URLSearchParams();
            if (filters.city) queryParams.append('city', filters.city);
            if (filters.date) queryParams.append('date', filters.date);

            const response = await fetch(
                `${API_URL}/api/tripRequestRoutes/trips/available?${queryParams}`,
                {
                    headers: {
                        'auth-token': authToken,
                    },
                }
            );

            const data = await response.json();

            if (response.ok) {
                setAvailableTrips(data.requests);
                return { success: true, trips: data.requests };
            } else {
                throw new Error(data.message || 'Failed to fetch available trips');
            }
        } catch (err) {
            const errorMessage = err.message || 'Error fetching available trips';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Get user's own trip requests
    const getMyTrips = async () => {
        setLoading(true);
        setError(null);

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            message.error("You're not logged in");
            return { success: false };
        }

        try {
            const response = await fetch(`${API_URL}/api/tripRequestRoutes/mytrips`, {
                headers: {
                    'auth-token': authToken,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setMyTrips(data.requests);
                return { success: true, trips: data.requests };
            } else {
                throw new Error(data.message || 'Failed to fetch your trips');
            }
        } catch (err) {
            const errorMessage = err.message || 'Error fetching your trips';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Get trip request details
    const getTripDetails = async (tripId) => {
        setLoading(true);
        setError(null);

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            message.error("You're not logged in");
            return { success: false };
        }

        try {
            const response = await fetch(`${API_URL}/api/tripRequestRoutes/trip/${tripId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken,
                },
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, trip: data.trip };
            } else {
                throw new Error(data.message || 'Failed to fetch trip details');
            }
        } catch (err) {
            const errorMessage = err.message || 'Error fetching trip details';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Accept trip request
    const acceptTripRequest = async (tripId) => {
        setLoading(true);
        setError(null);

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            message.error("You're not logged in");
            return { success: false };
        }

        try {
            const response = await fetch(`${API_URL}/api/tripRequestRoutes/trip/${tripId}/accept`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken,
                },
            });

            const data = await response.json();

            if (response.ok) {
                message.success(data.message || 'Trip request accepted successfully');
                // Update available trips list if it exists
                setAvailableTrips(prev => prev.filter(trip => trip._id !== tripId));
                return { success: true, trip: data.tripRequest };
            } else {
                throw new Error(data.message || 'Failed to accept trip request');
            }
        } catch (err) {
            const errorMessage = err.message || 'Error accepting trip request';
            message.error(errorMessage);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Context value
    const contextValue = {
        loading,
        error,
        myTrips,
        availableTrips,
        createTripRequest,
        getAvailableTrips,
        acceptTripRequest,
        getMyTrips,
        getTripDetails,
    };

    return (
        <TripContext.Provider value={contextValue}>
            {children}
        </TripContext.Provider>
    );
};

export default TripProvider;