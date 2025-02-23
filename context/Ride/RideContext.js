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
    const [publicRides, setPublicRides] = useState([]);
    const [totalRides, setTotalRides] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

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

    // Create a new ride offer
    const createRideOffer = async (offerData) => {
        setLoading(true);
        setError(null);

        try {
            // Validate location data
            const origin = validateLocation(offerData.origin);
            const destination = validateLocation(offerData.destination);

            // Validate and format waypoints if they exist
            const waypoints = offerData.waypoints?.map(waypoint => {
                if (waypoint.address || waypoint.city || waypoint.zipCode) {
                    return validateLocation(waypoint);
                }
                return null;
            }).filter(Boolean) || [];

            // Ensure departureDateTime is a proper Date object and convert to ISO string
            const departureDateTime = offerData.departureDateTime instanceof Date
                ? offerData.departureDateTime
                : new Date(offerData.departureDateTime);

            // Prepare the request data
            const requestData = {
                ...offerData,
                origin,
                destination,
                waypoints,
                departureDateTime: departureDateTime.toISOString()
            };

            const response = await fetch(`${API_URL}/api/rideRoute/offer/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': localStorage.getItem('authToken')
                },
                body: JSON.stringify(requestData)
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
            console.error('Error creating ride offer:', err);
            const errorMessage = err.message || 'Failed to create ride offer. Please try again.';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Search ride offers
    const searchRideOffers = async (searchParams) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();

            // Location parameters
            if (searchParams.origin?.city) {
                params.append('originCity', searchParams.origin.city);
            }
            if (searchParams.origin?.zipCode) {
                params.append('originZipCode', searchParams.origin.zipCode);
            }
            if (searchParams.destination?.city) {
                params.append('destinationCity', searchParams.destination.city);
            }
            if (searchParams.destination?.zipCode) {
                params.append('destinationZipCode', searchParams.destination.zipCode);
            }

            // Date and time parameters
            if (searchParams.departureDate) {
                params.append('departureDate', searchParams.departureDate);
            }
            if (searchParams.departureTime) {
                params.append('departureTime', searchParams.departureTime);
            }

            // Other filters
            if (searchParams.seats && !isNaN(searchParams.seats)) {
                params.append('seats', searchParams.seats);
            }
            if (searchParams.maxPrice && !isNaN(searchParams.maxPrice)) {
                params.append('maxPrice', searchParams.maxPrice);
            }
            if (searchParams.allowedLuggage) {
                params.append('allowedLuggage', searchParams.allowedLuggage);
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

            // Format the ride offers with proper date/time handling
            const formattedOffers = data.rideOffers.map(offer => ({
                ...offer,
                origin: {
                    city: offer.origin.city,
                    address: offer.origin.address,
                    zipCode: offer.origin.zipCode
                },
                destination: {
                    city: offer.destination.city,
                    address: offer.destination.address,
                    zipCode: offer.destination.zipCode
                },
                departureTime: new Date(offer.departureDateTime).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                })
            }));

            setRideOffers(formattedOffers);

            return {
                success: true,
                rideOffers: formattedOffers,
                count: data.count
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

    // Update ride offer
    const updateRideOffer = async (offerId, updateData) => {
        setLoading(true);
        setError(null);

        try {
            if (!offerId) {
                throw new Error('Ride offer ID is required for update');
            }

            // Location validation helper function
            const validateLocation = (location, name) => {
                if (location) {
                    if (!location.address?.trim()) {
                        throw new Error(`${name} address is required`);
                    }
                    if (!location.city?.trim()) {
                        throw new Error(`${name} city is required`);
                    }
                    if (!location.zipCode?.trim() || !/^\d{5}(-\d{4})?$/.test(location.zipCode)) {
                        throw new Error(`Valid ${name} zip code is required`);
                    }
                    return {
                        address: location.address.trim(),
                        city: location.city.trim(),
                        zipCode: location.zipCode.trim()
                    };
                }
                return null;
            };

            // Validate and format locations if provided
            if (updateData.origin) {
                updateData.origin = validateLocation(updateData.origin, 'Origin');
            }
            if (updateData.destination) {
                updateData.destination = validateLocation(updateData.destination, 'Destination');
            }
            if (updateData.waypoints) {
                updateData.waypoints = updateData.waypoints
                    .map((waypoint, index) => {
                        if (waypoint.address || waypoint.city || waypoint.zipCode) {
                            return validateLocation(waypoint, `Waypoint ${index + 1}`);
                        }
                        return null;
                    })
                    .filter(Boolean);
            }

            // Validate departure date time if provided
            if (updateData.departureDateTime) {
                const departureDateTime = new Date(updateData.departureDateTime);
                if (isNaN(departureDateTime.getTime())) {
                    throw new Error('Invalid departure date and time');
                }
                if (departureDateTime <= new Date()) {
                    throw new Error('Departure time must be in the future');
                }
                updateData.departureDateTime = departureDateTime.toISOString();
            }

            // Validate numeric fields
            if (updateData.availableSeats) {
                const seats = parseInt(updateData.availableSeats);
                if (isNaN(seats) || seats < 1 || seats > 8) {
                    throw new Error('Available seats must be between 1 and 8');
                }
            }

            if (updateData.pricePerSeat) {
                const price = parseFloat(updateData.pricePerSeat);
                if (isNaN(price) || price < 0) {
                    throw new Error('Price per seat must be a positive number');
                }
            }

            if (updateData.estimatedDuration) {
                const duration = parseInt(updateData.estimatedDuration);
                if (isNaN(duration) || duration < 1) {
                    throw new Error('Estimated duration must be a positive number');
                }
            }

            // Validate allowed luggage if provided
            if (updateData.allowedLuggage &&
                !['small', 'medium', 'large'].includes(updateData.allowedLuggage)) {
                throw new Error('Invalid luggage size');
            }

            // Make the API request
            const response = await fetch(`${API_URL}/api/rideRoute/offer/${offerId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': localStorage.getItem('authToken')
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMessage = data.errors
                    ? data.errors.map(err => err.msg).join(', ')
                    : data.message || 'Failed to update ride offer';
                throw new Error(errorMessage);
            }

            // Update local state if needed
            if (data.success) {
                // Update the ride offers list if it exists
                setRideOffers(prevOffers =>
                    prevOffers.map(offer =>
                        offer._id === offerId ? data.rideOffer : offer
                    )
                );

                // Show success message
                message.success('Ride offer updated successfully');
            }

            return {
                success: true,
                rideOffer: data.rideOffer,
                message: 'Ride offer updated successfully'
            };

        } catch (err) {
            console.error('Error updating ride offer:', err);
            const errorMessage = err.message || 'Failed to update ride offer. Please try again.';
            setError(errorMessage);
            message.error(errorMessage);

            return {
                success: false,
                message: errorMessage
            };

        } finally {
            setLoading(false);
        }
    };

    // Add this new function in the RideProvider
    const searchPublicRides = async (searchParams = {}, userLocation = null, page = 1, limit = 10) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();

            // Add pagination parameters
            params.append('page', page);
            params.append('limit', limit);

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

            // Add location parameters if available
            if (userLocation?.lat && userLocation?.lng) {
                params.append('lat', userLocation.lat);
                params.append('lng', userLocation.lng);
                params.append('maxDistance', '20000');
            }

            const response = await fetch(
                `${API_URL}/api/rideRoute/offers/public?${params.toString()}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch public rides');
            }

            // Update state with new data
            if (page === 1) {
                setPublicRides(data.rideOffers);
            } else {
                setPublicRides(prevRides => [...prevRides, ...data.rideOffers]);
            }

            // Update pagination state
            setTotalRides(data.totalCount);
            setCurrentPage(data.currentPage);
            setHasMore(data.hasMore);

            return {
                success: true,
                rideOffers: data.rideOffers,
                totalCount: data.totalCount,
                hasMore: data.hasMore,
                currentPage: data.currentPage,
                filters: data.filters,
                nearbyCount: userLocation ? data.rideOffers.length : 0
            };

        } catch (err) {
            console.error('Public rides search error:', err);
            setError(err.message || 'Failed to fetch public rides');
            return {
                success: false,
                message: err.message || 'Failed to fetch public rides'
            };
        } finally {
            setLoading(false);
        }
    };

    // Add loadMorePublicRides function for pagination
    const loadMorePublicRides = async (searchParams = {}, userLocation = null) => {
        if (!hasMore || loading) return;

        const nextPage = currentPage + 1;
        return await searchPublicRides(searchParams, userLocation, nextPage);
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
        publicRides,
        totalRides,
        currentPage,
        hasMore,
        searchPublicRides,
        loadMorePublicRides
    };

    return (
        <RideContext.Provider value={contextValue}>
            {children}
        </RideContext.Provider>
    );
};

export default RideProvider;