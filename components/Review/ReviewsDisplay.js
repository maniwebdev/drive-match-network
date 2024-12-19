import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import styles from '../../styles/Review/ReviewsDisplay.module.css';

const ReviewsDisplay = ({ reviews, rating, totalTrips, isDriver }) => {
    return (
        <motion.div
            className={styles.reviewsContainer}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
        >
            <div className={styles.reviewsHeader}>
                <div className={styles.ratingOverview}>
                    <h2 className={styles.ratingTitle}>Overall Rating</h2>
                    <div className={styles.ratingValue}>
                        <Star className={styles.starIcon} />
                        <span>{rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <p className={styles.totalReviews}>
                        Based on {totalTrips || 0} trips
                    </p>
                </div>
            </div>

            <div className={styles.reviewsList}>
                {reviews?.length > 0 ? (
                    reviews.map((review) => (
                        <motion.div
                            key={review._id}
                            className={styles.reviewCard}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className={styles.reviewHeader}>
                                <div className={styles.reviewerInfo}>
                                    <Image
                                        src={review.reviewer?.profilePicture?.url || '/images/carlogo.png'}
                                        alt={review.reviewer?.fullName}
                                        width={40}
                                        height={40}
                                        className={styles.reviewerAvatar}
                                    />
                                    <div className={styles.reviewerDetails}>
                                        <h3 className={styles.reviewerName}>
                                            {review.reviewer?.fullName}
                                        </h3>
                                        <span className={styles.reviewDate}>
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.reviewRating}>
                                    <Star className={styles.starIcon} />
                                    <span>{review.rating.toFixed(1)}</span>
                                </div>
                            </div>

                            <p className={styles.reviewComment}>{review.comment}</p>
                            
                            <div className={styles.reviewCategories}>
                                <div className={styles.categoryItem}>
                                    <span className={styles.categoryLabel}>Punctuality</span>
                                    <div className={styles.categoryRating}>
                                        <Star className={styles.categoryIcon} />
                                        <span>{review.categories.punctuality}</span>
                                    </div>
                                </div>
                                <div className={styles.categoryItem}>
                                    <span className={styles.categoryLabel}>Communication</span>
                                    <div className={styles.categoryRating}>
                                        <Star className={styles.categoryIcon} />
                                        <span>{review.categories.communication}</span>
                                    </div>
                                </div>
                                <div className={styles.categoryItem}>
                                    <span className={styles.categoryLabel}>Reliability</span>
                                    <div className={styles.categoryRating}>
                                        <Star className={styles.categoryIcon} />
                                        <span>{review.categories.reliability}</span>
                                    </div>
                                </div>

                                {isDriver && review.driverSpecificRatings && (
                                    <>
                                        <div className={styles.categoryItem}>
                                            <span className={styles.categoryLabel}>Driving Skill</span>
                                            <div className={styles.categoryRating}>
                                                <Star className={styles.categoryIcon} />
                                                <span>{review.driverSpecificRatings.drivingSkill}</span>
                                            </div>
                                        </div>
                                        <div className={styles.categoryItem}>
                                            <span className={styles.categoryLabel}>Vehicle Cleanliness</span>
                                            <div className={styles.categoryRating}>
                                                <Star className={styles.categoryIcon} />
                                                <span>{review.driverSpecificRatings.vehicleCleanliness}</span>
                                            </div>
                                        </div>
                                        <div className={styles.categoryItem}>
                                            <span className={styles.categoryLabel}>Safety Measures</span>
                                            <div className={styles.categoryRating}>
                                                <Star className={styles.categoryIcon} />
                                                <span>{review.driverSpecificRatings.safetyMeasures}</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className={styles.emptyReviews}>
                        <p>No reviews yet</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ReviewsDisplay;