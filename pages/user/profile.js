import React, { useEffect, useState } from 'react';
import styles from '../../styles/Profile/profile.module.css';
import { useAuth } from '../../context/Auth/AuthContext';
import { Tabs, message } from 'antd';
import { motion } from 'framer-motion';
import { Camera, Edit2, MapPin, Star, Facebook, Twitter, Instagram, Calendar, Car } from 'lucide-react';
import Image from 'next/image';
import UpdateProfileModal from '../../components/Authentication/ProfileModal/UpdateProfileModal';
import Navbar from '../../components/Navigation/Navbar';
import { useReview } from '../../context/Review/ReviewContext';
import ReviewsDisplay from '../../components/Review/ReviewsDisplay';

const UserProfile = () => {
    const { currentUser, fetchCurrentUser, uploadProfilePicture } = useAuth();
    const { getUserReviews } = useReview();
    const [userReviews, setUserReviews] = useState({ reviews: [], stats: null });
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null);

    useEffect(() => {
        fetchCurrentUser();
    }, [])

    useEffect(() => {
        const fetchReviews = async () => {
            if (currentUser?._id) {
                const result = await getUserReviews(currentUser._id);
                if (result.success) {
                    setUserReviews(result);
                }
            }
        };
        fetchReviews();
    }, [currentUser?._id]);

    const handleProfilePictureChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const file = e.target.files[0];
                const maxSize = 5 * 1024 * 1024; // 5MB

                if (file.size > maxSize) {
                    message.error('Image size should be less than 5MB');
                    return;
                }

                await uploadProfilePicture(file);
                message.success('Profile picture updated successfully');
            } catch (error) {
                message.error('Failed to update profile picture');
            }
        }
    };

    const handleEditClick = (type) => {
        setModalType(type);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        setModalType(null);
    };

    // Tab items configuration
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
                            <motion.button
                                className={styles.editButton}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEditClick('basic')}
                            >
                                <Edit2 className={styles.editIcon} />
                            </motion.button>
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Phone Number</span>
                                <span className={styles.infoValue}>
                                    {currentUser?.phoneNumber || 'Not added'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Bio</span>
                                <span className={styles.infoValue}>
                                    {currentUser?.bio || 'No bio added yet'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Member Since</span>
                                <span className={styles.infoValue}>
                                    {new Date(currentUser?.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Social Links Card */}
                    <div className={styles.infoCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Social Links</h2>
                            <motion.button
                                className={styles.editButton}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEditClick('social')}
                            >
                                <Edit2 className={styles.editIcon} />
                            </motion.button>
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.socialLinks}>
                                <motion.a
                                    href={currentUser?.socialLinks?.facebook}
                                    className={styles.socialLink}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Facebook className={styles.socialIcon} />
                                    <span>Facebook</span>
                                </motion.a>
                                <motion.a
                                    href={currentUser?.socialLinks?.twitter}
                                    className={styles.socialLink}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Twitter className={styles.socialIcon} />
                                    <span>Twitter</span>
                                </motion.a>
                                <motion.a
                                    href={currentUser?.socialLinks?.instagram}
                                    className={styles.socialLink}
                                    whileHover={{ scale: 1.05 }}
                                >
                                    <Instagram className={styles.socialIcon} />
                                    <span>Instagram</span>
                                </motion.a>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )
        }
    ];

    // Add Driver Info tab if user is a driver
    if (currentUser?.isDriver) {
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
                            <motion.button
                                className={styles.editButton}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEditClick('driver')}
                            >
                                <Edit2 className={styles.editIcon} />
                            </motion.button>
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.verificationStatus}>
                                <span className={`${styles.statusBadge} ${currentUser?.driverVerification?.isVerified ? styles.verified : styles.pending}`}>
                                    {currentUser?.driverVerification?.isVerified ? 'Verified' : 'Pending Verification'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>License Number</span>
                                <span className={styles.infoValue}>
                                    {currentUser?.driverVerification?.licenseNumber || 'Not added'}
                                </span>
                            </div>
                            {currentUser?.driverVerification?.verificationDate && (
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Verified On</span>
                                    <span className={styles.infoValue}>
                                        {new Date(currentUser.driverVerification.verificationDate).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Vehicle Information Card */}
                    <div className={styles.infoCard}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>Vehicle Information</h2>
                            <motion.button
                                className={styles.editButton}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEditClick('vehicle')}
                            >
                                <Edit2 className={styles.editIcon} />
                            </motion.button>
                        </div>
                        <div className={styles.cardContent}>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Vehicle Model</span>
                                <span className={styles.infoValue}>
                                    {currentUser?.vehicle?.model || 'Not added'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Year</span>
                                <span className={styles.infoValue}>
                                    {currentUser?.vehicle?.year || 'Not added'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Plate Number</span>
                                <span className={styles.infoValue}>
                                    {currentUser?.vehicle?.plateNumber || 'Not added'}
                                </span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Seating Capacity</span>
                                <span className={styles.infoValue}>
                                    {currentUser?.vehicle?.capacity
                                        ? `${currentUser.vehicle.capacity} seats`
                                        : 'Not added'}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )
        });
    }

    // Add Reviews tab
    tabItems.push({
        key: '3',
        label: 'Reviews',
        children: (
            <motion.div
                className={styles.reviewsContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <ReviewsDisplay
                    reviews={userReviews.reviews}
                    rating={currentUser?.rating || 0}
                    totalTrips={currentUser?.totalTrips || 0}
                    isDriver={currentUser?.isDriver || false}
                />
            </motion.div>
        )
    });

    // Add Trip History tab
    tabItems.push({
        key: '4',
        label: 'Trip History',
        children: (
            <motion.div
                className={styles.tripsContainer}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className={styles.tripsHeader}>
                    <h2 className={styles.tripsTitle}>Your Trips</h2>
                    <div className={styles.tripStats}>
                        <div className={styles.tripStat}>
                            <span className={styles.statNumber}>{currentUser?.totalTrips || 0}</span>
                            <span className={styles.statLabel}>Total Trips</span>
                        </div>
                    </div>
                </div>
                <div className={styles.tripsList}>
                    <div className={styles.emptyTrips}>
                        <p>Trip history coming soon!</p>
                    </div>
                </div>
            </motion.div>
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
                                src={currentUser?.profilePicture?.url || '/images/carlogo.png'}
                                alt={`${currentUser?.fullName}'s profile picture`}
                                width={160}
                                height={160}
                                className={styles.profileImage}
                            />
                            <label className={styles.uploadButton}>
                                <Camera className={styles.cameraIcon} />
                                <input
                                    type="file"
                                    className={styles.fileInput}
                                    onChange={handleProfilePictureChange}
                                    accept="image/*"
                                />
                            </label>
                        </motion.div>

                        <motion.div
                            className={styles.userInfo}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <h1 className={styles.userName}>{currentUser?.fullName}</h1>
                            <div className={styles.userStats}>
                                <div className={styles.statItem}>
                                    <Star className={styles.statIcon} />
                                    <span>{currentUser?.rating?.toFixed(1) || '0.0'}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <Calendar className={styles.statIcon} />
                                    <span>{currentUser?.totalTrips || '0'} trips</span>
                                </div>
                                {currentUser?.isDriver && (
                                    <div className={styles.driverBadge}>
                                        <Car className={styles.driverIcon} />
                                        <span>Driver</span>
                                    </div>
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
                <UpdateProfileModal
                    visible={modalVisible}
                    onClose={handleModalClose}
                    type={modalType}
                />
            </motion.div>
        </>
    );
};

export default UserProfile;