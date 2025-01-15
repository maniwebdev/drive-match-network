// components/Modals/ReviewModal.js
import React, { useState, useEffect } from 'react';
import {
    Modal,
    Rate,
    Input,
    Form,
    Button,
    Divider,
    message,
    Space
} from 'antd';
import {
    Star,
    Clock,
    MessageSquare,
    ThumbsUp,
    Car,
    Shield,
    Sparkles
} from 'lucide-react';
import { useReview } from '../../context/Review/ReviewContext';
import styles from '../../styles/Review/ReviewModal.module.css';

const { TextArea } = Input;

const ReviewModal = ({
    isOpen,
    onClose,
    userToReview,
    onReviewSubmitted,
    isDriver = false
}) => {
    const [form] = Form.useForm();
    const { createReview, loading } = useReview();
    const [rating, setRating] = useState(0);

    useEffect(() => {
        if (!isOpen) {
            form.resetFields();
            setRating(0);
        }
    }, [isOpen, form]);

    const handleSubmit = async (values) => {
        if (rating === 0) {
            message.warning('Please select a rating');
            return;
        }

        try {
            const reviewData = {
                rating: rating,
                comment: values.comment,
                tripId: values.tripId, // If you're implementing trip-specific reviews
                tripType: isDriver ? 'RideOffer' : 'RideRequest'
            };

            const result = await createReview(userToReview._id, reviewData);

            if (result.success) {
                message.success('Review submitted successfully');
                onClose();
                if (onReviewSubmitted) {
                    onReviewSubmitted(result.review);
                }
            }
        } catch (error) {
            message.error('Failed to submit review');
        }
    };

    return (
        <Modal
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={500}
            className={styles.reviewModal}
            title={
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>
                        Rate your experience with {userToReview?.fullName}
                    </h2>
                </div>
            }
        >
            <div className={styles.modalContent}>
                {/* User Info Section */}
                <div className={styles.userInfo}>
                    <img
                        src={userToReview?.profilePicture?.url || '/images/carlogo.png'}
                        alt={userToReview?.fullName}
                        className={styles.userAvatar}
                    />
                    <div className={styles.userDetails}>
                        <h3 className={styles.userName}>{userToReview?.fullName}</h3>
                        {isDriver && (
                            <span className={styles.driverBadge}>
                                <Car size={16} />
                                Driver
                            </span>
                        )}
                    </div>
                </div>

                <Divider className={styles.divider} />

                {/* Rating Section */}
                <div className={styles.ratingSection}>
                    <h4 className={styles.ratingTitle}>Overall Rating</h4>
                    <Rate
                        className={styles.rateStars}
                        value={rating}
                        onChange={setRating}
                        character={<Star className={styles.starIcon} />}
                    />
                    <div className={styles.ratingHint}>
                        {rating > 0 ? (
                            <div className={styles.selectedRating}>
                                <Sparkles size={16} />
                                {rating === 5 && "Excellent!"}
                                {rating === 4 && "Very Good!"}
                                {rating === 3 && "Good"}
                                {rating === 2 && "Fair"}
                                {rating === 1 && "Poor"}
                            </div>
                        ) : (
                            <span className={styles.ratingPlaceholder}>
                                Select your rating
                            </span>
                        )}
                    </div>
                </div>

                {/* Review Form */}
                <Form
                    form={form}
                    onFinish={handleSubmit}
                    layout="vertical"
                    className={styles.reviewForm}
                >
                    <Form.Item
                        name="comment"
                        rules={[
                            { required: true, message: 'Please write your review' },
                            { min: 10, message: 'Review must be at least 10 characters' }
                        ]}
                    >
                        <TextArea
                            placeholder="Share your experience..."
                            rows={4}
                            className={styles.reviewInput}
                            maxLength={500}
                            showCount
                        />
                    </Form.Item>

                    {/* Submit Button */}
                    <div className={styles.submitSection}>
                        <Button
                            type="default"
                            onClick={onClose}
                            className={styles.cancelButton}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={loading}
                            className={styles.submitButton}
                            disabled={rating === 0}
                        >
                            Submit Review
                        </Button>
                    </div>
                </Form>
            </div>
        </Modal>
    );
};

export default ReviewModal;