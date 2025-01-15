import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from '../Auth/AuthContext';
import { debounce } from 'lodash';
import { message } from 'antd';

const ReviewContext = createContext();
const API_URL = process.env.NEXT_PUBLIC_Car_API_URL;

export const useReview = () => useContext(ReviewContext);

export const ReviewProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Create a review for a user
    const createReview = async (userId, reviewData) => {
        setLoading(true);
        setError(null);

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            message.error("You must be logged in to leave a review");
            return { success: false, message: "Authentication required" };
        }

        try {
            const response = await fetch(`${API_URL}/api/review/create/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken,
                },
                body: JSON.stringify(reviewData),
            });

            const data = await response.json();

            if (response.ok) {
                message.success('Review submitted successfully');
                return { success: true, review: data.review };
            } else {
                throw new Error(data.message || 'Failed to submit review');
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to submit review';
            message.error(errorMessage);
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Get reviews for a specific user
    const getUserReviews = async (userId) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/review/user/${userId}`);
            const data = await response.json();

            if (response.ok) {
                return {
                    success: true,
                    reviews: data.reviews,
                    stats: data.stats
                };
            } else {
                throw new Error(data.message || 'Failed to fetch reviews');
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to fetch reviews';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Get reviews given by the current user
    const getGivenReviews = async () => {
        setLoading(true);
        setError(null);

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            return { success: false, message: "Authentication required" };
        }

        try {
            const response = await fetch(`${API_URL}/api/review/given`, {
                headers: {
                    'auth-token': authToken,
                }
            });
            const data = await response.json();

            if (response.ok) {
                return { success: true, reviews: data.reviews };
            } else {
                throw new Error(data.message || 'Failed to fetch reviews');
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to fetch reviews';
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Delete a review
    const deleteReview = async (reviewId) => {
        setLoading(true);
        setError(null);

        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
            message.error("You must be logged in to delete a review");
            return { success: false, message: "Authentication required" };
        }

        try {
            const response = await fetch(`${API_URL}/api/review/${reviewId}`, {
                method: 'DELETE',
                headers: {
                    'auth-token': authToken,
                }
            });

            const data = await response.json();

            if (response.ok) {
                message.success('Review deleted successfully');
                return { success: true };
            } else {
                throw new Error(data.message || 'Failed to delete review');
            }
        } catch (error) {
            const errorMessage = error.message || 'Failed to delete review';
            message.error(errorMessage);
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Check if user has already reviewed another user
    const hasReviewed = async (revieweeId) => {
        const authToken = localStorage.getItem('authToken');
        if (!authToken || !currentUser) {
            return false;
        }

        try {
            const givenReviews = await getGivenReviews();
            if (givenReviews.success) {
                return givenReviews.reviews.some(review =>
                    review.reviewee._id === revieweeId
                );
            }
            return false;
        } catch (error) {
            console.error('Error checking review status:', error);
            return false;
        }
    };

    const contextValue = {
        loading,
        error,
        createReview,
        getUserReviews,
        getGivenReviews,
        deleteReview,
        hasReviewed,
    };

    return (
        <ReviewContext.Provider value={contextValue}>
            {children}
        </ReviewContext.Provider>
    );
};

export default ReviewProvider;