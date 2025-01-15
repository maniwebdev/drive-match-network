import React, { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, Calendar, User, Shield, Search } from 'lucide-react';
import { Empty, Rate, Input, Spin } from 'antd';
import styles from '../../styles/Review/ReviewsDisplay.module.css';

const { Search: SearchInput } = Input;

const ReviewsDisplay = ({ reviews = [], rating = 0, totalTrips = 0, isDriver = false }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredReviews, setFilteredReviews] = useState(reviews);

    // Calculate rating distribution
    const ratingDistribution = {
        5: reviews.filter(review => review.rating === 5).length,
        4: reviews.filter(review => review.rating === 4).length,
        3: reviews.filter(review => review.rating === 3).length,
        2: reviews.filter(review => review.rating === 2).length,
        1: reviews.filter(review => review.rating === 1).length,
    };

    const totalReviews = reviews.length;

    // Get percentage for rating bar
    const getRatingPercentage = (count) => {
        return totalReviews ? (count / totalReviews) * 100 : 0;
    };

    // Handle search
    const handleSearch = (value) => {
        setSearchTerm(value);
        const filtered = reviews.filter(review =>
            review.comment.toLowerCase().includes(value.toLowerCase()) ||
            review.reviewer?.fullName.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredReviews(filtered);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className={styles.reviewsContainer}>
            {/* Stats Section */}
            <div className={styles.statsSection}>
                <div className={styles.overallRating}>
                    <h3 className={styles.ratingTitle}>Rating Overview</h3>
                    <div className={styles.ratingContent}>
                        <div className={styles.ratingNumber}>
                            {rating.toFixed(1)}
                            <Star className={styles.starIcon} size={24} />
                        </div>
                        <div className={styles.ratingMeta}>
                            <div className={styles.ratingCount}>
                                {totalReviews} reviews
                            </div>
                            <div className={styles.tripCount}>
                                <Calendar size={16} />
                                {totalTrips} trips completed
                            </div>
                            {isDriver && (
                                <div className={styles.driverBadge}>
                                    <Shield size={16} />
                                    Verified Driver
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Rating Bars */}
                <div className={styles.ratingBars}>
                    {[5, 4, 3, 2, 1].map((star) => (
                        <div key={star} className={styles.ratingBar}>
                            <div className={styles.barLabel}>
                                <span>{star}</span>
                                <Star className={styles.barStarIcon} size={14} />
                            </div>
                            <div className={styles.barContainer}>
                                <motion.div
                                    className={styles.barFill}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${getRatingPercentage(ratingDistribution[star])}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                />
                            </div>
                            <span className={styles.barCount}>
                                {ratingDistribution[star]}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search Section */}
            <div className={styles.searchSection}>
                <SearchInput
                    placeholder="Search reviews..."
                    onChange={(e) => handleSearch(e.target.value)}
                    prefix={<Search size={16} className={styles.searchIcon} />}
                    className={styles.searchInput}
                    allowClear
                />
            </div>

            {/* Reviews List */}
            <div className={styles.reviewsList}>
                {filteredReviews.length === 0 ? (
                    <Empty
                        description={
                            searchTerm
                                ? "No reviews match your search"
                                : "No reviews yet"
                        }
                        className={styles.emptyState}
                    />
                ) : (
                    filteredReviews.map((review) => (
                        <motion.div
                            key={review._id}
                            className={styles.reviewCard}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className={styles.reviewHeader}>
                                <div className={styles.reviewerInfo}>
                                    <div className={styles.reviewerAvatar}>
                                        <Image
                                            src={review.reviewer?.profilePicture?.url || '/images/carlogo.png'}
                                            alt={review.reviewer?.fullName}
                                            width={40}
                                            height={40}
                                            className={styles.avatarImage}
                                        />
                                    </div>
                                    <div className={styles.reviewerDetails}>
                                        <h4 className={styles.reviewerName}>
                                            {review.reviewer?.fullName}
                                        </h4>
                                        <span className={styles.reviewDate}>
                                            {formatDate(review.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.reviewRating}>
                                    <Rate
                                        disabled
                                        defaultValue={review.rating}
                                        character={<Star className={styles.rateStarIcon} />}
                                    />
                                </div>
                            </div>
                            <div className={styles.reviewContent}>
                                <p className={styles.reviewText}>{review.comment}</p>
                            </div>
                            {review.tripId && (
                                <div className={styles.tripBadge}>
                                    <User size={14} />
                                    Verified Trip
                                </div>
                            )}
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewsDisplay;