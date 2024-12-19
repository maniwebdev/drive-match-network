// context/Review/ReviewContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { debounce } from 'lodash';

const ReviewContext = createContext();
const API_URL = process.env.NEXT_PUBLIC_Car_API_URL;

export const useReview = () => useContext(ReviewContext);

export const ReviewProvider = ({ children }) => {
    const { currentUser } = useAuth();

    // State management
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [userStats, setUserStats] = useState(null);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalReviews: 0
    });

    // Create a review
    const createReview = async (rideId, reviewData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/review/create/${rideId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': localStorage.getItem('authToken')
                },
                body: JSON.stringify(reviewData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create review');
            }

            return {
                success: true,
                review: data.review
            };
        } catch (err) {
            setError(err.message || 'Error creating review');
            return {
                success: false,
                message: err.message
            };
        } finally {
            setLoading(false);
        }
    };

    // Get reviews for a user
    const getUserReviews = async (userId, options = {}) => {
        setLoading(true);
        setError(null);

        try {
            const {
                role = '',
                page = 1,
                limit = 10
            } = options;

            const queryParams = new URLSearchParams({
                role,
                page,
                limit
            }).toString();

            const response = await fetch(
                `${API_URL}/api/reviews/user/${userId}?${queryParams}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch reviews');
            }

            setReviews(data.reviews);
            setPagination(data.pagination);
            setUserStats(data.statistics);

            return {
                success: true,
                reviews: data.reviews,
                stats: data.statistics,
                pagination: data.pagination
            };
        } catch (err) {
            setError(err.message || 'Error fetching reviews');
            return {
                success: false,
                message: err.message
            };
        } finally {
            setLoading(false);
        }
    };

    // Get reviews for a specific ride
    const getRideReviews = async (rideId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/api/reviews/ride/${rideId}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch ride reviews');
            }

            return {
                success: true,
                reviews: data.reviews
            };
        } catch (err) {
            setError(err.message || 'Error fetching ride reviews');
            return {
                success: false,
                message: err.message
            };
        } finally {
            setLoading(false);
        }
    };

    // Get user statistics
    const getUserStats = async (userId, role = '') => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/api/reviews/stats/${userId}?role=${role}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch user stats');
            }

            setUserStats(data.statistics);

            return {
                success: true,
                statistics: data.statistics
            };
        } catch (err) {
            setError(err.message || 'Error fetching user stats');
            return {
                success: false,
                message: err.message
            };
        } finally {
            setLoading(false);
        }
    };
    // Report a review
    const reportReview = async (reviewId, reason) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/api/reviews/report/${reviewId}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': localStorage.getItem('authToken')
                    },
                    body: JSON.stringify({ reason })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to report review');
            }

            return {
                success: true,
                message: data.message
            };
        } catch (err) {
            setError(err.message || 'Error reporting review');
            return {
                success: false,
                message: err.message
            };
        } finally {
            setLoading(false);
        }
    };

    // Respond to a review
    const respondToReview = async (reviewId, response) => {
        setLoading(true);
        setError(null);

        try {
            const result = await fetch(
                `${API_URL}/api/reviews/respond/${reviewId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': localStorage.getItem('authToken')
                    },
                    body: JSON.stringify({ response })
                }
            );

            const data = await result.json();

            if (!result.ok) {
                throw new Error(data.message || 'Failed to respond to review');
            }

            // Update the reviews state if the review exists in it
            setReviews(prevReviews =>
                prevReviews.map(review =>
                    review._id === reviewId
                        ? { ...review, response }
                        : review
                )
            );

            return {
                success: true,
                review: data.review
            };
        } catch (err) {
            setError(err.message || 'Error responding to review');
            return {
                success: false,
                message: err.message
            };
        } finally {
            setLoading(false);
        }
    };

    // Delete a review
    const deleteReview = async (reviewId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/api/reviews/${reviewId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'auth-token': localStorage.getItem('authToken')
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete review');
            }

            // Remove the review from state if it exists
            setReviews(prevReviews =>
                prevReviews.filter(review => review._id !== reviewId)
            );

            return {
                success: true,
                message: data.message
            };
        } catch (err) {
            setError(err.message || 'Error deleting review');
            return {
                success: false,
                message: err.message
            };
        } finally {
            setLoading(false);
        }
    };

    // Check if user can review a ride
    const canReviewRide = async (rideId) => {
        try {
            const response = await fetch(
                `${API_URL}/api/reviews/ride/${rideId}`,
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
                throw new Error(data.message);
            }

            // Check if user has already reviewed this ride
            const hasReviewed = data.reviews.some(
                review => review.reviewer._id === currentUser?._id
            );

            return {
                success: true,
                canReview: !hasReviewed
            };
        } catch (err) {
            console.error('Error checking review capability:', err);
            return {
                success: false,
                canReview: false,
                message: err.message
            };
        }
    };

    // Get reported reviews (admin only)
    const getReportedReviews = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/api/reviews/admin/reported`,
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
                throw new Error(data.message || 'Failed to fetch reported reviews');
            }

            return {
                success: true,
                reviews: data.reviews
            };
        } catch (err) {
            setError(err.message || 'Error fetching reported reviews');
            return {
                success: false,
                message: err.message
            };
        } finally {
            setLoading(false);
        }
    };
    // Handle reported review (admin only)
    const handleReportedReview = async (reviewId, action, reason) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_URL}/api/reviews/admin/handle-report/${reviewId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': localStorage.getItem('authToken')
                    },
                    body: JSON.stringify({ action, reason })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to handle reported review');
            }

            return {
                success: true,
                message: data.message
            };
        } catch (err) {
            setError(err.message || 'Error handling reported review');
            return {
                success: false,
                message: err.message
            };
        } finally {
            setLoading(false);
        }
    };

    // Reset state
    const resetState = () => {
        setReviews([]);
        setUserStats(null);
        setPagination({
            currentPage: 1,
            totalPages: 1,
            totalReviews: 0
        });
        setError(null);
    };

    // Cleanup effect
    useEffect(() => {
        return () => {
            resetState();
        };
    }, []);

    // Context value
    const contextValue = {
        // State
        loading,
        error,
        reviews,
        userStats,
        pagination,

        // Core functions
        createReview,
        getUserReviews,
        getRideReviews,
        getUserStats,

        // Interaction functions
        reportReview,
        respondToReview,
        deleteReview,
        canReviewRide,

        // Admin functions
        getReportedReviews,
        handleReportedReview,

        // Utility functions
        resetState,
    };

    return (
        <ReviewContext.Provider value={contextValue}>
            {children}
        </ReviewContext.Provider>
    );
};

export default ReviewProvider;