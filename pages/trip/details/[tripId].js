// pages/trip/details/[tripId].js
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../context/Auth/AuthContext';
import { useTrip } from '../../../context/Ride/TripContext';
import { useChat } from '../../../context/Chat/ChatContext';
import {
    Button,
    Card,
    Badge,
    Modal,
    Form,
    Divider,
    message,
    Tooltip,
    Alert
} from 'antd';
import {
    User,
    MapPin,
    Calendar,
    Clock,
    Users,
    Package,
    MessageCircle,
    Star,
    ChevronLeft,
    Car,
    AlertCircle,
    Check,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment-timezone';
import Navbar from '../../../components/Navigation/Navbar';
import LoadingAnimation from '../../../components/LoadingAnimation';
import styles from '../../../styles/Trips/tripDetails.module.css';

const TripDetails = () => {
    // Router and context hooks
    const router = useRouter();
    const { tripId } = router.query;
    const { currentUser } = useAuth();
    const { getTripDetails, acceptTripRequest, loading } = useTrip();
    const { createChat } = useChat();
    const [form] = Form.useForm();

    // State management
    const [trip, setTrip] = useState(null);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Fetch trip details on mount or tripId change
    useEffect(() => {
        let mounted = true;

        const fetchTrip = async () => {
            if (!tripId) return;

            try {
                setError(null);
                const result = await getTripDetails(tripId);

                if (!mounted) return;

                if (result.success) {
                    setTrip(result.trip);
                } else {
                    throw new Error(result.message || 'Failed to fetch trip details');
                }
            } catch (err) {
                console.error('Fetch trip error:', err);
                setError('Unable to load trip details. Please try again.');
                message.error('Error loading trip details');
            }
        };

        fetchTrip();

        return () => {
            mounted = false;
        };
    }, [tripId]);

    // Helper functions
    const formatDate = (date) => {
        return moment(date).format('dddd, MMMM D, YYYY');
    };

    const formatTime = (time) => {
        return moment(time, 'HH:mm').format('h:mm A');
    };

    const formatRecurrence = (recurrence) => {
        if (!recurrence || recurrence.pattern === 'none') {
            return null;
        }

        const patterns = {
            daily: 'Repeats daily',
            weekly: 'Repeats weekly',
            weekdays: 'Repeats on weekdays',
            custom: `Repeats on ${recurrence.customDays.join(', ')}`
        };

        let text = patterns[recurrence.pattern];
        if (recurrence.endDate) {
            text += ` until ${moment(recurrence.endDate).format('MMM D, YYYY')}`;
        }

        return text;
    };

    const isAcceptable = () => {
        if (!trip || !currentUser) return false;

        return (
            trip.status === 'active' &&
            currentUser.isDriver &&
            currentUser.driverVerification?.isVerified &&
            currentUser._id !== trip.requester._id &&
            !trip.acceptedDriver
        );
    };

    // Event Handlers
    const handleContactRequester = async () => {
        if (!currentUser) {
            message.info('Please login to contact the requester');
            router.push('/auth/login?redirect=/trip/details/${tripId}');
            return;
        }

        try {
            setProcessing(true);
            const result = await createChat(trip.requester._id);

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

    const handleAcceptTrip = () => {
        if (!currentUser) {
            message.info('Please login to accept this trip request');
            router.push('/auth/login?redirect=/trip/details/${tripId}');
            return;
        }

        if (!currentUser.isDriver) {
            message.error('Only verified drivers can accept trip requests');
            router.push('/user/become-driver');
            return;
        }

        if (!currentUser.driverVerification?.isVerified) {
            message.error('Please complete driver verification first');
            router.push('/user/driver-verification');
            return;
        }

        setShowAcceptModal(true);
    };

    const handleAcceptSubmit = async () => {
        try {
            setProcessing(true);
            setError(null);

            const result = await acceptTripRequest(tripId);

            if (result.success) {
                setShowAcceptModal(false);
                setShowConfirmation(true);
                await fetchTripDetails();
                message.success('Trip request accepted successfully!');
            } else {
                throw new Error(result.message || 'Failed to accept trip');
            }
        } catch (error) {
            console.error('Accept trip error:', error);
            setError(error.message || 'Unable to accept trip request. Please try again.');
            message.error(error.message || 'Error accepting trip request');
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
                Back to Trips
            </Button>

            {trip?.status && (
                <Badge
                    status={trip.status === 'active' ? 'success' : 'default'}
                    text={trip.status.toUpperCase()}
                    className={styles.statusBadge}
                />
            )}

            {trip?.recurrence?.pattern !== 'none' && (
                <Tooltip title={formatRecurrence(trip.recurrence)}>
                    <Badge
                        count="Recurring"
                        className={styles.recurringBadge}
                    />
                </Tooltip>
            )}
        </motion.div>
    );

    const renderRequesterInfo = () => (
        <Card className={styles.requesterCard}>
            <div className={styles.requesterInfo}>
                <div className={styles.requesterAvatar}>
                    {trip?.requester.profilePicture ? (
                        <img
                            src={trip.requester.profilePicture.url}
                            alt={trip.requester.fullName}
                            className={styles.avatarImage}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {trip?.requester.fullName[0]}
                        </div>
                    )}
                </div>

                <div className={styles.requesterDetails}>
                    <h2 className={styles.requesterName}>
                        {trip?.requester.fullName}
                    </h2>
                    <div className={styles.requesterStats}>
                        <span className={styles.rating}>
                            <Star className={styles.icon} />
                            {trip?.requester.rating?.toFixed(1)}
                        </span>
                        <span className={styles.trips}>
                            <Car className={styles.icon} />
                            {trip?.requester.totalTrips} trips
                        </span>
                    </div>
                </div>

                <Button
                    type="primary"
                    icon={<MessageCircle className={styles.messageIcon} />}
                    onClick={handleContactRequester}
                    loading={processing}
                    className={styles.contactButton}
                >
                    Contact Requester
                </Button>
            </div>

            {trip?.additionalNotes && (
                <>
                    <Divider className={styles.divider} />
                    <div className={styles.notes}>
                        <h3 className={styles.notesTitle}>Additional Notes</h3>
                        <p className={styles.notesContent}>
                            "{trip.additionalNotes}"
                        </p>
                    </div>
                </>
            )}
        </Card>
    );

    const renderTripDetails = () => (
        <Card className={styles.tripCard}>
            <div className={styles.routeInfo}>
                <div className={styles.location}>
                    <div className={styles.locationIcon}>
                        <MapPin />
                    </div>
                    <div className={styles.locationDetails}>
                        <span className={styles.locationLabel}>Pickup Location</span>
                        <h3 className={styles.locationName}>{trip?.origin.city}</h3>
                        <p className={styles.locationAddress}>{trip?.origin.address}</p>
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
                        <h3 className={styles.locationName}>{trip?.destination.city}</h3>
                        <p className={styles.locationAddress}>{trip?.destination.address}</p>
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
                            {formatDate(trip?.departureDate)}
                        </span>
                    </div>
                </div>

                <div className={styles.detailItem}>
                    <Clock className={styles.detailIcon} />
                    <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Time</span>
                        <span className={styles.detailValue}>
                            {formatTime(trip?.departureTime)}
                        </span>
                    </div>
                </div>

                <div className={styles.detailItem}>
                    <Users className={styles.detailIcon} />
                    <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Seats</span>
                        <span className={styles.detailValue}>
                            {trip?.numberOfSeats} needed
                        </span>
                    </div>
                </div>

                <div className={styles.detailItem}>
                    <Package className={styles.detailIcon} />
                    <div className={styles.detailContent}>
                        <span className={styles.detailLabel}>Luggage</span>
                        <span className={styles.detailValue}>
                            {trip?.luggageSize}
                        </span>
                    </div>
                </div>
            </div>
        </Card>
    );
    const renderAcceptModal = () => (
        <Modal
            title="Accept Trip Request"
            open={showAcceptModal}
            onCancel={() => setShowAcceptModal(false)}
            className={styles.modal}
            footer={[
                <Button
                    key="cancel"
                    onClick={() => setShowAcceptModal(false)}
                    icon={<X className={styles.modalIcon} />}
                    className={styles.cancelButton}
                >
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={processing}
                    onClick={handleAcceptSubmit}
                    icon={<Check className={styles.modalIcon} />}
                    className={styles.acceptButton}
                >
                    Accept Request
                </Button>
            ]}
        >
            <div className={styles.modalContent}>
                <Alert
                    message="Please confirm the trip details"
                    description="Make sure you can accommodate the following requirements:"
                    type="info"
                    showIcon
                    className={styles.modalAlert}
                />

                <ul className={styles.requirementsList}>
                    <li className={styles.requirementItem}>
                        <Users className={styles.requirementIcon} />
                        {trip?.numberOfSeats} passenger(s)
                    </li>
                    <li className={styles.requirementItem}>
                        <Package className={styles.requirementIcon} />
                        {trip?.luggageSize} luggage
                    </li>
                    <li className={styles.requirementItem}>
                        <MapPin className={styles.requirementIcon} />
                        Pickup from {trip?.origin.city}
                    </li>
                    <li className={styles.requirementItem}>
                        <MapPin className={styles.requirementIcon} />
                        Dropoff at {trip?.destination.city}
                    </li>
                </ul>

                {error && (
                    <Alert
                        message={error}
                        type="error"
                        showIcon
                        className={styles.errorAlert}
                    />
                )}
            </div>
        </Modal>
    );

    // Main render
    if (loading || !trip) {
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
                <div className={styles.contentWrapper}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={styles.mainContent}
                    >
                        {renderHeader()}

                        <div className={styles.contentGrid}>
                            <div className={styles.tripContent}>
                                {renderTripDetails()}

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
                                {renderRequesterInfo()}

                                {isAcceptable() && (
                                    <Button
                                        type="primary"
                                        size="large"
                                        onClick={handleAcceptTrip}
                                        className={styles.acceptTripButton}
                                        block
                                    >
                                        Accept Trip Request
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {renderAcceptModal()}

                <AnimatePresence>
                    {showConfirmation && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className={styles.confirmationToast}
                        >
                            <Alert
                                message="Trip Accepted Successfully!"
                                type="success"
                                showIcon
                                closable
                                onClose={() => setShowConfirmation(false)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};

export default TripDetails;