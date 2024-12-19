import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Tabs, message } from 'antd';
import {
    Star,
    Calendar,
    Car,
    MapPin,
    MessageSquare,
    Facebook,
    Twitter,
    Instagram
} from 'lucide-react';
import { useAuth } from '../../../context/Auth/AuthContext';
import Navbar from '../../../components/Navigation/Navbar';
import ReviewModal from '../../../components/Review/ReviewModal';
import styles from '../../../styles/Profile/userProfile.module.css';
import { useChat } from '../../../context/Chat/ChatContext';
import ReviewsDisplay from '../../../components/Review/ReviewsDisplay';

const UserProfileView = () => {
    // Router and Context
    const router = useRouter();
    const { id } = router.query;
    const { currentUser, fetchUserProfile } = useAuth();
    const { createChat } = useChat();
    // State Management
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewModalVisible, setReviewModalVisible] = useState(false);
    const [error, setError] = useState(null);

    // Fetch User Profile
    useEffect(() => {
        let isMounted = true;

        const fetchProfile = async () => {
            if (!id) return;

            try {
                setLoading(true);
                setError(null);

                const result = await fetchUserProfile(id);

                if (!isMounted) return;

                if (result.success) {
                    setUserProfile(result.user);
                } else {
                    setError(result.message);
                    message.error(result.message);
                }
            } catch (err) {
                if (!isMounted) return;
                setError('Failed to load profile');
                message.error('Error loading profile');
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchProfile();

        // Cleanup function to prevent state updates on unmounted component
        return () => {
            isMounted = false;
        };
    }, []);
    // Loading State
    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner} />
                <p>Loading profile...</p>
            </div>
        );
    }

    // Error State
    if (!userProfile) {
        return (
            <div className={styles.errorContainer}>
                <h2>User not found</h2>
                <button
                    onClick={() => router.back()}
                    className={styles.backButton}
                >
                    Go Back
                </button>
            </div>
        );
    }

    // Handle Review Modal
    const handleReviewSubmit = async () => {
        setReviewModalVisible(false);
        // Refresh the profile to show new review
        const response = await fetch(`/api/users/${id}`);
        const data = await response.json();
        if (data.success) {
            setUserProfile(data.user);
            message.success('Review submitted successfully');
        }
    };

    const handleSendMessage = async () => {
        if (!currentUser) {
            message.info('Please login to contact the driver');
            router.push('/auth/login');
            return;
        }

        try {
            const chat = await createChat(id);
            if (chat) {
                // Changed from router.push(`/chat/${id}`) to router.push(`/chat/${chat._id}`)
                router.push(`/chat/${chat._id}`);
            } else {
                message.error('Failed to create chat');
            }
        } catch (error) {
            console.error('Create chat error:', error);
            message.error('Error starting chat');
        }
    };

    // Tab Configuration
    const tabItems = [
        {
            key: '1',
            label: 'Profile Info',
            children: (
                <motion.div
                    className={styles.infoGrid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* Basic Info Card */}
                    <div className={styles.infoCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Basic Information</h2>
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Member Since</span>
                                <span className={styles.infoValue}>
                                    {new Date(userProfile?.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Bio</span>
                                <span className={styles.infoValue}>
                                    {userProfile?.bio || 'No bio added yet'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Total Trips</span>
                                <span className={styles.infoValue}>
                                    {userProfile?.totalTrips || 0} trips completed
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Social Links Card */}
                    <div className={styles.infoCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Social Links</h2>
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.socialLinks}>
                                {userProfile?.socialLinks?.facebook && (
                                    <motion.a
                                        href={userProfile.socialLinks.facebook}
                                        className={styles.socialLink}
                                        whileHover={{ scale: 1.05 }}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Facebook className={styles.socialIcon} />
                                        <span>Facebook</span>
                                    </motion.a>
                                )}
                                {userProfile?.socialLinks?.twitter && (
                                    <motion.a
                                        href={userProfile.socialLinks.twitter}
                                        className={styles.socialLink}
                                        whileHover={{ scale: 1.05 }}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Twitter className={styles.socialIcon} />
                                        <span>Twitter</span>
                                    </motion.a>
                                )}
                                {userProfile?.socialLinks?.instagram && (
                                    <motion.a
                                        href={userProfile.socialLinks.instagram}
                                        className={styles.socialLink}
                                        whileHover={{ scale: 1.05 }}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Instagram className={styles.socialIcon} />
                                        <span>Instagram</span>
                                    </motion.a>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            ),
        }
    ];

    // Add Driver Info Tab for Drivers
    if (userProfile?.isDriver) {
        tabItems.push({
            key: '2',
            label: 'Driver Info',
            children: (
                <motion.div
                    className={styles.infoGrid}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* Driver Verification Card */}
                    <div className={styles.infoCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Driver Verification</h2>
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.verificationStatus}>
                                <span className={`${styles.statusBadge} ${userProfile?.driverVerification?.isVerified ?
                                    styles.verified : styles.pending
                                    }`}>
                                    {userProfile?.driverVerification?.isVerified ?
                                        'Verified Driver' : 'Pending Verification'}
                                </span>
                            </div>
                            {userProfile?.driverVerification?.verificationDate && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Verified Since</span>
                                    <span className={styles.infoValue}>
                                        {new Date(userProfile.driverVerification.verificationDate)
                                            .toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vehicle Information Card */}
                    <div className={styles.infoCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Vehicle Information</h2>
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Vehicle Model</span>
                                <span className={styles.infoValue}>
                                    {userProfile?.vehicle?.model || 'Not specified'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Year</span>
                                <span className={styles.infoValue}>
                                    {userProfile?.vehicle?.year || 'Not specified'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Seating Capacity</span>
                                <span className={styles.infoValue}>
                                    {userProfile?.vehicle?.capacity
                                        ? `${userProfile.vehicle.capacity} seats`
                                        : 'Not specified'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ),
        });
    }
    // Add Reviews tab
    tabItems.push({
        key: '3',
        label: 'Reviews',
        children: (
            <ReviewsDisplay
                reviews={userProfile?.reviews || []}
                rating={userProfile?.rating}
                totalTrips={userProfile?.totalTrips}
                isDriver={userProfile?.isDriver}
            />
        )
    });

    return (
        <>
            <div>
                <Navbar />
            </div>
            <motion.div
                className={styles.pageContainer}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Cover Section */}
                <motion.div
                    className={styles.coverSection}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className={styles.coverPattern}></div>
                    <div className={styles.profileImageContainer}>
                        <motion.div
                            className={styles.imageWrapper}
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <Image
                                src={userProfile?.profilePicture?.url || '/images/carlogo.png'}
                                alt={`${userProfile?.fullName}'s profile picture`}
                                width={160}
                                height={160}
                                className={styles.profileImage}
                            />
                        </motion.div>

                        <motion.div
                            className={styles.userInfo}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h1 className={styles.userName}>{userProfile?.fullName}</h1>
                            <div className={styles.userStats}>
                                <div className={styles.statItem}>
                                    <Star className={styles.statIcon} />
                                    <span>{userProfile?.rating?.toFixed(1) || '0.0'}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <Calendar className={styles.statIcon} />
                                    <span>{userProfile?.totalTrips || '0'} trips</span>
                                </div>
                                {userProfile?.isDriver && (
                                    <div className={styles.driverBadge}>
                                        <Car className={styles.driverIcon} />
                                        <span>Driver</span>
                                    </div>
                                )}
                                {currentUser?._id !== id && (
                                    <motion.button
                                        className={styles.messageButton}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSendMessage}
                                    >
                                        <MessageSquare className={styles.messageIcon} />
                                        <span>Message</span>
                                    </motion.button>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Main Content with Tabs */}
                <div className={styles.mainContent}>
                    <Tabs
                        defaultActiveKey="1"
                        items={tabItems}
                        className={styles.profileTabs}
                        animated={{ inkBar: true, tabPane: true }}
                    />
                </div>

                {/* Review Modal */}
                {reviewModalVisible && (
                    <ReviewModal
                        isOpen={reviewModalVisible}
                        onClose={() => setReviewModalVisible(false)}
                        revieweeId={id}
                        revieweeRole={userProfile?.isDriver ? 'driver' : 'passenger'}
                        onReviewSubmitted={handleReviewSubmit}
                    />
                )}
            </motion.div>
        </>
    );
};

export default UserProfileView;