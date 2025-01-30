import React, { createContext, useState, useContext, useEffect } from 'react';
require('dotenv').config();
import { useRouter } from 'next/router';
import { message } from 'antd';

const RideContext = createContext();

export const useRide = () => {
    return useContext(RideContext);
};

const API_URL = process.env.NEXT_PUBLIC_Car_API_URL;

export const RideProvider = ({ children }) => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState(null);
    const [rideOffers, setRideOffers] = useState([]);
    const [rideRequests, setRideRequests] = useState([]);
    const [nearbyRides, setNearbyRides] = useState([]);

    // Create a new ride offer
    const createRideOffer = async (offerData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/rideRoute/offer/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': localStorage.getItem('authToken')
                },
                body: JSON.stringify(offerData)
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.errors
                    ? data.errors.map(err => err.msg).join(', ')
                    : data.message || 'Failed to create ride offer';
                setError(errorMessage);
                return { success: false, message: errorMessage };
            }

            return { success: true, rideOffer: data.rideOffer };

        } catch (err) {
            console.error('Network or server error:', err);
            const errorMessage = 'Network or server error. Please try again later.';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Update ride offer
    const updateRideOffer = async (offerId, updateData) => {
        setLoading(true);
        setError(null);

        try {
          //  console.log('Updating ride offer:', offerId);
           // console.log('Update data:', updateData);

            if (!offerId) {
                throw new Error('Ride offer ID is required for update');
            }
            const response = await fetch(`${API_URL}/api/rideRoute/offer/${offerId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': localStorage.getItem('authToken')
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, rideOffer: data.rideOffer };
            } else {
                return { success: false, message: data.message };
            }
        } catch (err) {
            return { success: false, message: 'Network error' };
        } finally {
            setLoading(false);
        }
    };
    // Search ride offers
    const searchRideOffers = async (searchParams, userLocation = null) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();

            // Add core search parameters
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
            if (searchParams.maxPrice && !isNaN(searchParams.maxPrice)) {
                params.append('maxPrice', searchParams.maxPrice);
            }
            if (searchParams.allowedLuggage) {
                params.append('allowedLuggage', searchParams.allowedLuggage);
            }

            // Add time filter if specified
            if (searchParams.timeFilter) {
                params.append('timeFilter', searchParams.timeFilter);
            }

            // Add location parameters
            if (userLocation?.lat && userLocation?.lng) {
                params.append('lat', userLocation.lat);
                params.append('lng', userLocation.lng);
                params.append('maxDistance', '20000');
            }

            const response = await fetch(
                `${API_URL}/api/rideRoute/offers/search?${params.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': localStorage.getItem('authToken')
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to search rides');
            }

            return {
                success: true,
                rideOffers: data.rideOffers,
                nearbyCount: userLocation ? data.rideOffers.length : 0
            };
        } catch (err) {
            console.error('Search error:', err);
            setError(err.message || 'Failed to search rides');
            return {
                success: false,
                message: err.message || 'Failed to search rides'
            };
        } finally {
            setLoading(false);
        }
    };

    // Create ride request
    const createRideRequest = async (requestData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/rideRoute/request/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': localStorage.getItem('authToken')
                },
                body: JSON.stringify(requestData)
            });

            const data = await response.json();

            if (response.ok) {
                message.success('Ride request created successfully');
                return {
                    success: true,
                    rideRequest: data.rideRequest,
                    matchingOffers: data.matchingOffers
                };
            } else {
                setError(data.message || 'Failed to create ride request');
                message.error(data.message || 'Failed to create ride request');
                return { success: false, message: data.message };
            }
        } catch (err) {
            setError('Network or server error');
            message.error('Network or server error');
            return { success: false, message: 'Network or server error' };
        } finally {
            setLoading(false);
        }
    };

    // Match request with ride offer
    const matchRideRequest = async (requestId, offerId) => {
        setLoading(true);
        setError(null);

        try {
            if (!requestId || !offerId) {
                throw new Error('Request ID and Offer ID are required');
            }

            const response = await fetch(
                `${API_URL}/api/rideRoute/request/${requestId}/match/${offerId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': localStorage.getItem('authToken')
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                message.success('Ride matched successfully');
                return {
                    success: true,
                    rideRequest: data.rideRequest,
                    rideOffer: data.rideOffer
                };
            } else {
                setError(data.message || 'Failed to match ride');
                message.error(data.message || 'Failed to match ride');
                return { success: false, message: data.message };
            }
        } catch (err) {
            const errorMessage = 'Error matching ride request';
            setError(errorMessage);
            message.error(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Get user's ride requests
    const getUserRideRequests = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/rideRoute/requests/my`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': localStorage.getItem('authToken')
                }
            });

            const data = await response.json();

            if (response.ok) {
                setRideRequests(data.requests);
                return { success: true, requests: data.requests };
            } else {
                setError(data.message || 'Failed to fetch ride requests');
                return { success: false, message: data.message };
            }
        } catch (err) {
            setError('Network or server error');
            return { success: false, message: 'Network or server error' };
        } finally {
            setLoading(false);
        }
    };

    // Get ride details
    const getRideDetails = async (rideId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/rideRoute/offer/${rideId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                return { success: true, ride: data.ride };
            } else {
                setError(data.message || 'Failed to fetch ride details');
                return { success: false, message: data.message };
            }
        } catch (err) {
            setError('Network or server error');
            return { success: false, message: 'Network or server error' };
        } finally {
            setLoading(false);
        }
    };

    // Get user's ride offers
    const getUserRideOffers = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/rideRoute/offers/my`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': localStorage.getItem('authToken')
                }
            });

            const data = await response.json();

            if (response.ok) {
                setRideOffers(data.offers);
                return { success: true, offers: data.offers };
            } else {
                setError(data.message || 'Failed to fetch ride offers');
                return { success: false, message: data.message };
            }
        } catch (err) {
            setError('Network or server error');
            return { success: false, message: 'Network or server error' };
        } finally {
            setLoading(false);
        }
    };

    const getOfferRequests = async (offerId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/api/rideRoute/offer/${offerId}/requests`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': localStorage.getItem('authToken')
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                return { success: true, requests: data.requests };
            } else {
                setError(data.message || 'Failed to fetch requests');
                return { success: false, message: data.message };
            }
        } catch (err) {
            setError('Network or server error');
            return { success: false, message: 'Network or server error' };
        } finally {
            setLoading(false);
        }
    };

    // Search nearby rides
    const searchNearbyRides = async (lat, lng, maxDistance) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/api/rideRoute/offers/nearby?lat=${lat}&lng=${lng}&maxDistance=${maxDistance}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                setNearbyRides(data.rides);
                return { success: true, rides: data.rides };
            } else {
                setError(data.message || 'Failed to fetch nearby rides');
                return { success: false, message: data.message };
            }
        } catch (err) {
            setError('Network or server error');
            return { success: false, message: 'Network or server error' };
        } finally {
            setLoading(false);
        }
    };

    // Cancel ride request
    const cancelRideRequest = async (requestId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/rideRoute/request/${requestId}/cancel`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': localStorage.getItem('authToken')
                }
            });

            const data = await response.json();

            if (response.ok) {
                message.success('Ride request cancelled successfully');
                return { success: true, request: data.request };
            } else {
                setError(data.message || 'Failed to cancel ride request');
                message.error(data.message || 'Failed to cancel ride request');
                return { success: false, message: data.message };
            }
        } catch (err) {
            setError('Network or server error');
            message.error('Network or server error');
            return { success: false, message: 'Network or server error' };
        } finally {
            setLoading(false);
        }
    };

    // Complete ride offer
    const completeRideOffer = async (offerId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/rideRoute/offer/${offerId}/complete`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': localStorage.getItem('authToken')
                }
            });

            const data = await response.json();

            if (response.ok) {
                message.success('Ride completed successfully');
                return { success: true, offer: data.offer };
            } else {
                setError(data.message || 'Failed to complete ride');
                message.error(data.message || 'Failed to complete ride');
                return { success: false, message: data.message };
            }
        } catch (err) {
            setError('Network or server error');
            message.error('Network or server error');
            return { success: false, message: 'Network or server error' };
        } finally {
            setLoading(false);
        }
    };

    const acceptRideRequest = async (requestId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/api/rideRoute/request/${requestId}/accept`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': localStorage.getItem('authToken')
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                message.success('Request accepted successfully');
                return { success: true, request: data.request, offer: data.offer };
            } else {
                setError(data.message || 'Failed to accept request');
                message.error(data.message || 'Failed to accept request');
                return { success: false, message: data.message };
            }
        } catch (err) {
            const errorMessage = 'Error accepting request';
            setError(errorMessage);
            message.error(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const rejectRideRequest = async (requestId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/api/rideRoute/request/${requestId}/reject`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': localStorage.getItem('authToken')
                    }
                }
            );

            const data = await response.json();

            if (response.ok) {
                message.success('Request rejected successfully');
                return { success: true, request: data.request, offer: data.offer };
            } else {
                setError(data.message || 'Failed to reject request');
                message.error(data.message || 'Failed to reject request');
                return { success: false, message: data.message };
            }
        } catch (err) {
            const errorMessage = 'Error rejecting request';
            setError(errorMessage);
            message.error(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Context value
    const contextValue = {
        loading,
        error,
        rideOffers,
        rideRequests,
        nearbyRides,
        createRideOffer,
        updateRideOffer,
        searchRideOffers,
        createRideRequest,
        getOfferRequests,
        matchRideRequest,
        getRideDetails,
        getUserRideRequests,
        getUserRideOffers,
        searchNearbyRides,
        cancelRideRequest,
        completeRideOffer,
        acceptRideRequest,
        rejectRideRequest,
    };

    return (
        <RideContext.Provider value={contextValue}>
            {children}
        </RideContext.Provider>
    );
};

export default RideProvider;