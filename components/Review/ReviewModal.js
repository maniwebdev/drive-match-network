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
    rideData,
    revieweeRole,
    revieweeId,
    onReviewSubmitted
}) => {
    const [form] = Form.useForm();
    const { createReview, loading } = useReview();
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            form.resetFields();
        }
    }, [isOpen, form]);

    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const reviewData = {
                rating: values.overallRating,
                comment: values.comment,
                categories: {
                    punctuality: values.punctuality,
                    communication: values.communication,
                    reliability: values.reliability
                },
                ...(revieweeRole === 'driver' && {
                    driverSpecificRatings: {
                        drivingSkill: values.drivingSkill,
                        vehicleCleanliness: values.vehicleCleanliness,
                        safetyMeasures: values.safetyMeasures
                    }
                })
            };

            const result = await createReview(rideData._id, reviewData);

            if (result.success) {
                message.success('Review submitted successfully');
                form.resetFields();
                onClose();
                if (onReviewSubmitted) {
                    onReviewSubmitted();
                }
            } else {
                throw new Error(result.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error('Submit review error:', error);
            message.error(error.message || 'Error submitting review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title={`Rate your ${revieweeRole}`}
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width={600}
            className={styles.reviewModal}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className={styles.reviewForm}
            >
                {/* Overall Rating */}
                <Form.Item
                    name="overallRating"
                    label="Overall Rating"
                    rules={[{ required: true, message: 'Please rate your experience' }]}
                    className={styles.ratingItem}
                >
                    <Rate
                        character={<Star className={styles.starIcon} />}
                        className={styles.rateField}
                    />
                </Form.Item>

                <Divider />

                {/* Common Categories */}
                <div className={styles.categorySection}>
                    <h4>Rate the following aspects:</h4>
                    <Space direction="vertical" className={styles.categories}>
                        <Form.Item
                            name="punctuality"
                            label={
                                <span className={styles.categoryLabel}>
                                    <Clock className={styles.categoryIcon} />
                                    Punctuality
                                </span>
                            }
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <Rate className={styles.categoryRate} />
                        </Form.Item>

                        <Form.Item
                            name="communication"
                            label={
                                <span className={styles.categoryLabel}>
                                    <MessageSquare className={styles.categoryIcon} />
                                    Communication
                                </span>
                            }
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <Rate className={styles.categoryRate} />
                        </Form.Item>

                        <Form.Item
                            name="reliability"
                            label={
                                <span className={styles.categoryLabel}>
                                    <ThumbsUp className={styles.categoryIcon} />
                                    Reliability
                                </span>
                            }
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <Rate className={styles.categoryRate} />
                        </Form.Item>
                    </Space>
                </div>
                {/* Driver-specific Categories */}
                {revieweeRole === 'driver' && (
                    <>
                        <Divider />
                        <div className={styles.categorySection}>
                            <h4>Rate the driver specifically:</h4>
                            <Space direction="vertical" className={styles.categories}>
                                <Form.Item
                                    name="drivingSkill"
                                    label={
                                        <span className={styles.categoryLabel}>
                                            <Car className={styles.categoryIcon} />
                                            Driving Skill
                                        </span>
                                    }
                                    rules={[{ required: true, message: 'Required' }]}
                                >
                                    <Rate className={styles.categoryRate} />
                                </Form.Item>

                                <Form.Item
                                    name="vehicleCleanliness"
                                    label={
                                        <span className={styles.categoryLabel}>
                                            <Sparkles className={styles.categoryIcon} />
                                            Vehicle Cleanliness
                                        </span>
                                    }
                                    rules={[{ required: true, message: 'Required' }]}
                                >
                                    <Rate className={styles.categoryRate} />
                                </Form.Item>

                                <Form.Item
                                    name="safetyMeasures"
                                    label={
                                        <span className={styles.categoryLabel}>
                                            <Shield className={styles.categoryIcon} />
                                            Safety Measures
                                        </span>
                                    }
                                    rules={[{ required: true, message: 'Required' }]}
                                >
                                    <Rate className={styles.categoryRate} />
                                </Form.Item>
                            </Space>
                        </div>
                    </>
                )}

                {/* Comment Section */}
                <Form.Item
                    name="comment"
                    label="Write your review"
                    rules={[
                        { required: true, message: 'Please write a review' },
                        { min: 10, message: 'Review must be at least 10 characters long' }
                    ]}
                    className={styles.commentSection}
                >
                    <TextArea
                        rows={4}
                        placeholder="Share your experience..."
                        maxLength={500}
                        showCount
                        className={styles.commentInput}
                    />
                </Form.Item>

                {/* Submit Button */}
                <Form.Item className={styles.submitSection}>
                    <Button
                        type="default"
                        onClick={onClose}
                        className={styles.cancelButton}
                        disabled={submitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        className={styles.submitButton}
                    >
                        Submit Review
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ReviewModal;