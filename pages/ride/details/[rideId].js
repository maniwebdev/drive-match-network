// pages/ride/details/[rideId].js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/Auth/AuthContext';
import { useRide } from '../../../context/Ride/RideContext';
import { useChat } from '../../../context/Chat/ChatContext';
import {
    Button,
    Card,
    Badge,
    Modal,
    InputNumber,
    Form,
    Divider,
    message,
    Spin,
    Tooltip,
    Alert
} from 'antd';
import {
    Car,
    MapPin,
    Calendar,
    Clock,
    Users,
    DollarSign,
    Package,
    MessageCircle,
    Star,
    PawPrint,
    ChevronLeft,
    AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import Navbar from '../../../components/Navigation/Navbar';
import LoadingAnimation from '../../../components/LoadingAnimation';
import styles from '../../../styles/Rides/rideDetails.module.css';

const RideDetails = () => {
    // Router and context hooks
    const router = useRouter();
    const { rideId } = router.query;
    const { currentUser } = useAuth();
    const { getRideDetails, loading } = useRide();
    const { createChat } = useChat();
    const [form] = Form.useForm();

    // State management
    const [ride, setRide] = useState(null);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Fetch ride details
    useEffect(() => {
        let mounted = true;

        const fetchRide = async () => {
            if (!rideId) return;

            try {
                setError(null);
                const result = await getRideDetails(rideId);

                if (!mounted) return;

                if (result.success) {
                    setRide(result.ride);
                } else {
                    throw new Error(result.message || 'Failed to fetch ride details');
                }
            } catch (err) {
                console.error('Fetch ride error:', err);
                setError('Unable to load ride details. Please try again.');
                message.error('Error loading ride details');
            }
        };

        fetchRide();

        return () => {
            mounted = false;
        };
    }, [rideId]);

    // Helper functions
    const formatDate = (date) => {
        return moment(date).format('dddd, MMMM D, YYYY');
    };

    const formatTime = (time) => {
        return moment(time, 'HH:mm').format('h:mm A');
    };

    // Event Handlers
    const handleContactDriver = async () => {
        if (!currentUser) {
            message.info('Please login to contact the driver');
            router.push(`/auth/login?redirect=/ride/details/${rideId}`);
            return;
        }

        try {
            setProcessing(true);
            const result = await createChat(ride.driver._id);

            if (result.success) {
                router.push(`/chat/${result.chat._id}`);
            } else {
                throw new Error(result.message || 'Failed to create chat');
            }
        } catch (error) {
            console.error('Create chat error:', error);
            message.error('Unable to start chat. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    const handleGoBack = () => {
        router.back();
    };
    // Render Components
    const renderHeader = () => (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.header}
        >
            <Button
                icon={<ChevronLeft className={styles.backIcon} />}
                onClick={handleGoBack}
                className={styles.backButton}
            >
                Back to Search
            </Button>

            <div className={styles.statusContainer}>
                <Badge
                    status={ride?.status === 'active' ? 'success' : 'default'}
                    text={ride?.status.toUpperCase()}
                    className={styles.statusBadge}
                />

                {ride?.status === 'active' && (
                    <span className={styles.seatsIndicator}>
                        {ride.availableSeats - ride.bookedSeats} seats left
                    </span>
                )}
            </div>
        </motion.div>
    );

    const renderDriverInfo = () => (
        <Card className={styles.driverCard}>
            <div className={styles.driverInfo}>
                <div className={styles.driverAvatar}>
                    {ride?.driver.profilePicture ? (
                        <img
                            src={ride.driver.profilePicture.url}
                            alt={ride.driver.fullName}
                            className={styles.avatarImage}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {ride?.driver.fullName[0]}
                        </div>
                    )}
                </div>

                <div className={styles.driverDetails}>
                    <h2 className={styles.driverName}>
                        {ride?.driver.fullName}
                    </h2>
                    <div className={styles.driverStats}>
                        <span className={styles.rating}>
                            <Star className={styles.statIcon} />
                            {ride?.driver.rating?.toFixed(1)}
                        </span>
                        <span className={styles.trips}>
                            <Car className={styles.statIcon} />
                            {ride?.driver.totalTrips} trips
                        </span>
                    </div>
                </div>

                <Button
                    type="primary"
                    icon={<MessageCircle className={styles.buttonIcon} />}
                    onClick={handleContactDriver}
                    loading={processing}
                    className={styles.contactButton}
                >
                    Contact Driver
                </Button>
            </div>

            <Divider className={styles.divider} />

            <div className={styles.vehicleInfo}>
                <h3 className={styles.sectionTitle}>Vehicle Information</h3>
                <div className={styles.vehicleDetails}>
                    <Car className={styles.vehicleIcon} />
                    <div className={styles.vehicleText}>
                        <span className={styles.vehicleModel}>
                            {ride?.vehicle.model} ({ride?.vehicle.year})
                        </span>
                        <span className={styles.plateNumber}>
                            {ride?.vehicle.plateNumber}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );

    const renderRideDetails = () => (
        <Card className={styles.rideCard}>
            <div className={styles.routeInfo}>
                <div className={styles.location}>
                    <div className={styles.locationIcon}>
                        <MapPin />
                    </div>
                    <div className={styles.locationDetails}>
                        <span className={styles.locationLabel}>Pickup Location</span>
                        <h3 className={styles.locationName}>{ride?.origin.city}</h3>
                        <p className={styles.locationAddress}>{ride?.origin.address}</p>
                    </div>
                </div>

                <div className={styles.routeDivider}>
                    <div className={styles.dividerLine} />
                </div>

                <div className={styles.location}>
                    <div className={styles.locationIcon}>
                        <MapPin />
                    </div>
                    <div className={styles.locationDetails}>
                        <span className={styles.locationLabel}>Dropoff Location</span>
                        <h3 className={styles.locationName}>{ride?.destination.city}</h3>
                        <p className={styles.locationAddress}>{ride?.destination.address}</p>
                    </div>
                </div>
            </div>

            <Divider className={styles.divider} />

            <div className={styles.tripDetails}>
                <div className={styles.detailItem}>
                    <Calendar className={styles.detailIcon} />
                    <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Date</span>
                        <span className={styles.detailValue}>
                            {formatDate(ride?.departureDate)}
                        </span>
                    </div>
                </div>

                <div className={styles.detailItem}>
                    <Clock className={styles.detailIcon} />
                    <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Departure Time</span>
                        <span className={styles.detailValue}>
                            {formatTime(ride?.departureTime)}
                        </span>
                    </div>
                </div>

                <div className={styles.detailItem}>
                    <Users className={styles.detailIcon} />
                    <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Available Seats</span>
                        <span className={styles.detailValue}>
                            {ride?.availableSeats - ride?.bookedSeats} of {ride?.availableSeats}
                        </span>
                    </div>
                </div>

                <div className={styles.detailItem}>
                    <DollarSign className={styles.detailIcon} />
                    <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Price per Seat</span>
                        <span className={styles.detailValue}>
                            ${ride?.pricePerSeat}
                        </span>
                    </div>
                </div>
            </div>

            <Divider className={styles.divider} />

            <div className={styles.preferences}>
                <h3 className={styles.sectionTitle}>Ride Preferences</h3>
                <div className={styles.preferencesList}>
                    <div className={styles.preferenceItem}>
                        <Package className={styles.preferenceIcon} />
                        <div className={styles.preferenceContent}>
                            <span className={styles.preferenceName}>Luggage Size</span>
                            <span className={styles.preferenceValue}>
                                {ride?.allowedLuggage.charAt(0).toUpperCase() +
                                    ride?.allowedLuggage.slice(1)}
                            </span>
                        </div>
                    </div>

                    <div className={styles.preferenceItem}>
                        <span className={`${styles.preferenceIcon} ${ride?.smoking ? styles.allowed : styles.notAllowed}`}>
                            {ride?.smoking ? '🚬' : '🚭'}
                        </span>
                        <div className={styles.preferenceContent}>
                            <span className={styles.preferenceName}>Smoking</span>
                            <span className={styles.preferenceValue}>
                                {ride?.smoking ? 'Allowed' : 'Not allowed'}
                            </span>
                        </div>
                    </div>

                    <div className={styles.preferenceItem}>
                        <PawPrint className={`${styles.preferenceIcon} ${ride?.pets ? styles.allowed : styles.notAllowed}`} />
                        <div className={styles.preferenceContent}>
                            <span className={styles.preferenceName}>Pets</span>
                            <span className={styles.preferenceValue}>
                                {ride?.pets ? 'Allowed' : 'Not allowed'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );

    // Main render with loading state
    if (loading || !ride) {
        return (
            <>
                <Navbar />
                <div className={styles.loadingContainer}>
                    <LoadingAnimation />
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className={styles.pageContainer}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.contentWrapper}
                >
                    {renderHeader()}

                    <div className={styles.detailsContainer}>
                        <div className={styles.mainContent}>
                            {renderRideDetails()}

                            {error && (
                                <Alert
                                    message="Error"
                                    description={error}
                                    type="error"
                                    showIcon
                                    className={styles.errorAlert}
                                />
                            )}
                        </div>

                        <div className={styles.sidebar}>
                            {renderDriverInfo()}
                        </div>
                    </div>
                </motion.div>
            </div>
        </>
    );
};

export default RideDetails;