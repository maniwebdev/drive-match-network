import React, { createContext, useState, useContext, useEffect } from 'react';
require('dotenv').config();
import { useRouter } from 'next/router';
import { message } from 'antd';
import moment from 'moment-timezone';

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
            // Add timezone and normalize time format
            const timezone = moment.tz.guess();
            const payload = {
                ...tripData,
                timezone,  // Add client's timezone to payload
                departureTime: tripData.departureTime.padStart(5, '0'), // Ensure HH:mm format
                departureDate: moment(tripData.departureDate)
                    .tz(timezone)
                    .format('YYYY-MM-DD')
            };
    
            // Convert recurrence dates to ISO format
            if (tripData.recurrence?.endDate) {
                payload.recurrence = {
                    ...tripData.recurrence,
                    endDate: moment(tripData.recurrence.endDate)
                        .tz(timezone)
                        .format('YYYY-MM-DD')
                };
            }
    
            const response = await fetch(`${API_URL}/api/tripRequestRoutes/trip/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken,
                },
                body: JSON.stringify(payload),
            });
    
            const data = await response.json();
    
            if (response.ok) {
                message.success('Trip request created successfully');
                // Update myTrips state with UTC-normalized trip
                const normalizedTrip = {
                    ...data.tripRequest,
                    departureDate: new Date(data.tripRequest.departureDate),
                    ...(data.tripRequest.recurrence?.endDate && {
                        recurrence: {
                            ...data.tripRequest.recurrence,
                            endDate: new Date(data.tripRequest.recurrence.endDate)
                        }
                    })
                };
                setMyTrips(prev => [normalizedTrip, ...prev]);
                return { success: true, trip: normalizedTrip };
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

    //edit the trip request
    const editTripRequest = async (tripId, updatedData) => {
        setLoading(true);
        setError(null);

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            message.error("You're not logged in");
            return { success: false };
        }

        try {
            const response = await fetch(`${API_URL}/api/tripRequestRoutes/trip/${tripId}/edit`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken,
                },
                body: JSON.stringify(updatedData),
            });

            const data = await response.json();

            if (response.ok) {
                message.success(data.message || 'Trip request updated successfully');
                // Update the myTrips state with the edited trip
                setMyTrips(prev =>
                    prev.map(trip =>
                        trip._id === tripId ? { ...trip, ...updatedData } : trip
                    )
                );
                return { success: true, trip: data.tripRequest };
            } else {
                throw new Error(data.message || 'Failed to update trip request');
            }
        } catch (err) {
            const errorMessage = err.message || 'Error updating trip request';
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

        try {
            const queryParams = new URLSearchParams();

            // Basic filters
            if (filters.originCity) queryParams.append('originCity', filters.originCity);
            if (filters.destinationCity) queryParams.append('destinationCity', filters.destinationCity);
            if (filters.seats) queryParams.append('seats', filters.seats);
            if (filters.luggageSize) queryParams.append('luggageSize', filters.luggageSize);
            if (filters.lat) queryParams.append('lat', filters.lat);
            if (filters.lng) queryParams.append('lng', filters.lng);

            // Handle urgent time filter
            if (filters.urgent) {
                const now = moment();
                queryParams.append('urgent', 'true');
                queryParams.append('urgentTime', now.format());
            } else if (filters.date) {
                const localDate = moment(filters.date).format('YYYY-MM-DD');
                queryParams.append('date', localDate);
            }

            const response = await fetch(
                `${API_URL}/api/tripRequestRoutes/trips/available?${queryParams}`,
                { headers: { 'auth-token': authToken } }
            );

            const data = await response.json();

            if (response.ok) {
                const trips = data.requests;
                setAvailableTrips(trips);
                return { success: true, trips };
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
        editTripRequest,
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