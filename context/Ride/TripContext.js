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
    const [availableRequests, setAvailableRequests] = useState([]);
    const router = useRouter();

    // Helper function to validate location data
    const validateLocation = (location) => {
        if (!location.address?.trim()) {
            throw new Error('Address is required');
        }
        if (!location.city?.trim()) {
            throw new Error('City is required');
        }
        if (!location.zipCode?.trim() || !/^\d{5}(-\d{4})?$/.test(location.zipCode)) {
            throw new Error('Valid zip code is required');
        }
        return {
            address: location.address.trim(),
            city: location.city.trim(),
            zipCode: location.zipCode.trim()
        };
    };

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
            // Validate location data
            const origin = validateLocation(tripData.origin);
            const destination = validateLocation(tripData.destination);

            // Get client's timezone
            const timezone = moment.tz.guess();

            // Prepare the request payload
            const payload = {
                ...tripData,
                origin,
                destination,
                timezone,
                departureTime: tripData.departureTime.padStart(5, '0'),
                departureDate: moment(tripData.departureDate)
                    .tz(timezone)
                    .format('YYYY-MM-DD')
            };

            // Handle recurrence dates if present
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

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create trip request');
            }

            // Normalize the response data
            const normalizedTrip = {
                ...data.tripRequest,
                departureDate: new Date(data.tripRequest.departureDate),
                origin: {
                    address: data.tripRequest.origin.address,
                    city: data.tripRequest.origin.city,
                    zipCode: data.tripRequest.origin.zipCode
                },
                destination: {
                    address: data.tripRequest.destination.address,
                    city: data.tripRequest.destination.city,
                    zipCode: data.tripRequest.destination.zipCode
                },
                ...(data.tripRequest.recurrence?.endDate && {
                    recurrence: {
                        ...data.tripRequest.recurrence,
                        endDate: new Date(data.tripRequest.recurrence.endDate)
                    }
                })
            };

            // Update state with the new trip
            setMyTrips(prev => [normalizedTrip, ...prev]);
            message.success('Trip request created successfully');

            return { success: true, trip: normalizedTrip };
        } catch (err) {
            const errorMessage = err.message || 'Error creating trip request';
            console.error('Create trip error:', err);
            message.error(errorMessage);
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    //edit the trip request
    // Edit trip request function
    const editTripRequest = async (tripId, updateData) => {
        setLoading(true);
        setError(null);

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            message.error("You're not logged in");
            return { success: false };
        }

        try {
            // Validate location data if provided
            if (updateData.origin) {
                updateData.origin = validateLocation(updateData.origin);
            }
            if (updateData.destination) {
                updateData.destination = validateLocation(updateData.destination);
            }

            // Get client's timezone
            const timezone = moment.tz.guess();

            // Format the update payload
            const payload = { ...updateData, timezone };

            // Handle date formatting
            if (payload.departureDate) {
                payload.departureDate = moment(payload.departureDate)
                    .tz(timezone)
                    .format('YYYY-MM-DD');
            }

            // Ensure time format is correct
            if (payload.departureTime) {
                payload.departureTime = payload.departureTime.padStart(5, '0');
            }

            // Handle recurrence updates
            if (payload.recurrence) {
                if (payload.recurrence.pattern === 'none') {
                    payload.recurrence = {
                        pattern: 'none',
                        endDate: null,
                        customDays: []
                    };
                } else if (payload.recurrence.endDate) {
                    payload.recurrence.endDate = moment(payload.recurrence.endDate)
                        .tz(timezone)
                        .format('YYYY-MM-DD');

                    // Validate custom days for custom pattern
                    if (payload.recurrence.pattern === 'custom') {
                        if (!payload.recurrence.customDays?.length) {
                            throw new Error('Custom days are required for custom recurrence pattern');
                        }

                        const validDays = [
                            'Monday', 'Tuesday', 'Wednesday',
                            'Thursday', 'Friday', 'Saturday', 'Sunday'
                        ];

                        if (!payload.recurrence.customDays.every(day => validDays.includes(day))) {
                            throw new Error('Invalid custom days provided');
                        }
                    }
                }
            }

            // Make the API request
            const response = await fetch(
                `${API_URL}/api/tripRequestRoutes/trip/${tripId}/edit`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': authToken,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.errors?.[0]?.msg ||
                    data.message ||
                    'Failed to update trip request'
                );
            }

            // Normalize the response data
            const normalizedTrip = {
                ...data.tripRequest,
                departureDate: moment(data.tripRequest.departureDate).toDate(),
                origin: {
                    address: data.tripRequest.origin.address,
                    city: data.tripRequest.origin.city,
                    zipCode: data.tripRequest.origin.zipCode
                },
                destination: {
                    address: data.tripRequest.destination.address,
                    city: data.tripRequest.destination.city,
                    zipCode: data.tripRequest.destination.zipCode
                }
            };

            // Handle recurrence data in normalized trip
            if (data.tripRequest.recurrence?.endDate) {
                normalizedTrip.recurrence = {
                    ...data.tripRequest.recurrence,
                    endDate: moment(data.tripRequest.recurrence.endDate).toDate()
                };
            }

            // Update local state
            setMyTrips(prev =>
                prev.map(trip =>
                    trip._id === tripId ? normalizedTrip : trip
                )
            );

            message.success('Trip request updated successfully');
            return {
                success: true,
                trip: normalizedTrip
            };

        } catch (err) {
            const errorMessage = err.message || 'Error updating trip request';
            console.error('Edit trip error:', err);
            message.error(errorMessage);
            setError(errorMessage);

            return {
                success: false,
                error: errorMessage
            };

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

    //public route for finding the trip requests from the users
    const searchPublicRequests = async (searchParams = {}, page = 1, limit = 10) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();

            // Add pagination parameters
            params.append('page', page);
            params.append('limit', limit);

            // Add search parameters
            if (searchParams.originCity?.trim()) {
                params.append('originCity', searchParams.originCity.trim());
            }
            if (searchParams.destinationCity?.trim()) {
                params.append('destinationCity', searchParams.destinationCity.trim());
            }
            if (searchParams.departureDate) {
                params.append('departureDate', searchParams.departureDate);
            }
            if (searchParams.seats && !isNaN(searchParams.seats)) {
                params.append('seats', searchParams.seats);
            }
            if (searchParams.luggageSize) {
                params.append('luggageSize', searchParams.luggageSize);
            }

            const response = await fetch(
                `${API_URL}/api/tripRequestRoutes/requests/public?${params.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch public requests');
            }

            // Update state with new data
            if (page === 1) {
                setAvailableRequests(data.tripRequests);
            } else {
                setAvailableRequests(prevRequests => [...prevRequests, ...data.tripRequests]);
            }

            return {
                success: true,
                requests: data.tripRequests,
                totalCount: data.totalCount,
                hasMore: data.hasMore,
                currentPage: data.currentPage,
                filters: data.filters
            };

        } catch (err) {
            console.error('Public requests search error:', err);
            setError(err.message || 'Failed to fetch public requests');
            return {
                success: false,
                message: err.message || 'Failed to fetch public requests'
            };
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
        availableRequests,
        getMyTrips,
        getTripDetails,
        searchPublicRequests,
    };

    return (
        <TripContext.Provider value={contextValue}>
            {children}
        </TripContext.Provider>
    );
};

export default TripProvider;