// pages/trip/details/[tripId].js
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
    Spin,
    Tooltip
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
    Car
} from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import Navbar from '../../../components/Navigation/Navbar';
import styles from '../../../styles/Trips/tripDetails.module.css';
import LoadingAnimation from '../../../components/LoadingAnimation';

const TripDetails = () => {
    const router = useRouter();
    const { tripId } = router.query;
    const { currentUser } = useAuth();
    const { getTripDetails, acceptTripRequest, loading } = useTrip();
    const { createChat } = useChat();
    const [form] = Form.useForm();

    // State
    const [trip, setTrip] = useState(null);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Fetch trip details
    useEffect(() => {
        if (tripId) {
            fetchTripDetails();
        }
    }, [tripId]);

    const fetchTripDetails = async () => {
        try {
            const result = await getTripDetails(tripId);
            if (result.success) {
                setTrip(result.trip);
            } else {
                message.error('Failed to fetch trip details');
                router.push('/trip/available-trips');
            }
        } catch (error) {
            console.error('Fetch trip details error:', error);
            message.error('Error loading trip details');
            router.push('/trip/available-trips');
        }
    };
    // Helper functions
    const formatDate = (date) => {
        return moment(date).format('dddd, MMMM D, YYYY');
    };

    const formatTime = (time) => {
        return moment(time, 'HH:mm').format('h:mm A');
    };

    // Handler functions
    const handleContactRequester = async () => {
        if (!currentUser) {
            message.info('Please login to contact the requester');
            router.push('/auth/login');
            return;
        }

        try {
            const chat = await createChat(trip.requester._id);
            if (chat) {
                router.push(`/chat/${chat._id}`);
            } else {
                message.error('Failed to create chat');
            }
        } catch (error) {
            console.error('Create chat error:', error);
            message.error('Error starting chat');
        }
    };

    const handleAcceptTrip = () => {
        if (!currentUser) {
            message.info('Please login to accept this trip request');
            router.push('/auth/login');
            return;
        }

        if (!currentUser.isDriver || !currentUser.driverVerification?.isVerified) {
            message.error('Only verified drivers can accept trip requests');
            router.push('/user/profile');
            return;
        }

        setShowAcceptModal(true);
    };

    const handleAcceptSubmit = async () => {
        try {
            setProcessing(true);

            const result = await acceptTripRequest(tripId);

            if (result.success) {
                message.success('Trip request accepted successfully!');
                setShowAcceptModal(false);
                await fetchTripDetails();
            } else {
                throw new Error(result.message || 'Failed to accept trip');
            }
        } catch (error) {
            console.error('Accept trip error:', error);
            message.error(error.message || 'Error accepting trip request');
        } finally {
            setProcessing(false);
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    // Check if the trip is acceptable
    const isAcceptable = () => {
        if (!trip || !currentUser) return false;
        return (
            trip.status === 'active' &&
            currentUser.isDriver &&
            currentUser.driverVerification?.isVerified &&
            currentUser._id !== trip.requester._id
        );
    };
    // Render components
    const renderHeader = () => (
        <div className={styles.header}>
            <Button
                icon={<ChevronLeft />}
                onClick={handleGoBack}
                className={styles.backButton}
            >
                Back to Trips
            </Button>
            <Badge
                status="default"
                color={trip?.status === 'active' ? '#2a9d8f' : '#666666'}
                text={trip?.status.toUpperCase()}
                className={styles.statusBadge}
            />
        </div>
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
                    <h2 className={styles.requesterName}>{trip?.requester.fullName}</h2>
                    <div className={styles.requesterStats}>
                        <span className={styles.rating}>
                            <Star className={styles.icon} />
                            {trip?.requester.rating.toFixed(1)}
                        </span>
                        <span className={styles.trips}>
                            <Car className={styles.icon} />
                            {trip?.requester.totalTrips} trips
                        </span>
                    </div>
                </div>
                <Button
                    type="primary"
                    icon={<MessageCircle />}
                    onClick={handleContactRequester}
                    className={styles.contactButton}
                >
                    Contact Requester
                </Button>
            </div>

            {trip?.additionalNotes && (
                <>
                    <Divider className={styles.divider} />
                    <div className={styles.notes}>
                        <h3>Additional Notes</h3>
                        <p>{trip.additionalNotes}</p>
                    </div>
                </>
            )}
        </Card>
    );
    const renderTripDetails = () => (
        <Card className={styles.tripCard}>
            <div className={styles.routeInfo}>
                <div className={styles.location}>
                    <MapPin className={styles.icon} />
                    <div>
                        <span className={styles.locationLabel}>Pickup</span>
                        <h3 className={styles.locationName}>{trip?.origin.city}</h3>
                        <p className={styles.locationAddress}>{trip?.origin.address}</p>
                    </div>
                </div>

                <div className={styles.routeDivider}>
                    <div className={styles.dividerLine} />
                </div>

                <div className={styles.location}>
                    <MapPin className={styles.icon} />
                    <div>
                        <span className={styles.locationLabel}>Dropoff</span>
                        <h3 className={styles.locationName}>{trip?.destination.city}</h3>
                        <p className={styles.locationAddress}>{trip?.destination.address}</p>
                    </div>
                </div>
            </div>

            <Divider className={styles.divider} />

            <div className={styles.tripDetails}>
                <div className={styles.detailItem}>
                    <Calendar className={styles.icon} />
                    <div>
                        <span className={styles.detailLabel}>Date</span>
                        <span className={styles.detailValue}>
                            {formatDate(trip?.departureDate)}
                        </span>
                    </div>
                </div>

                <div className={styles.detailItem}>
                    <Clock className={styles.icon} />
                    <div>
                        <span className={styles.detailLabel}>Departure Time</span>
                        <span className={styles.detailValue}>
                            {formatTime(trip?.departureTime)}
                        </span>
                    </div>
                </div>

                <div className={styles.detailItem}>
                    <Users className={styles.icon} />
                    <div>
                        <span className={styles.detailLabel}>Seats Needed</span>
                        <span className={styles.detailValue}>
                            {trip?.numberOfSeats}
                        </span>
                    </div>
                </div>

                <div className={styles.detailItem}>
                    <Package className={styles.icon} />
                    <div>
                        <span className={styles.detailLabel}>Luggage Size</span>
                        <span className={styles.detailValue}>
                            {trip?.luggageSize.charAt(0).toUpperCase() + trip?.luggageSize.slice(1)}
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
            className={styles.modal}
            onCancel={() => setShowAcceptModal(false)}
            footer={[
                <Button
                    key="cancel"
                    onClick={() => setShowAcceptModal(false)}
                >
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={processing}
                    onClick={handleAcceptSubmit}
                >
                    Accept Request
                </Button>
            ]}
        >
            <div className={styles.modalContent}>
                <p>You are about to accept this trip request. Make sure you can accommodate:</p>
                <ul>
                    <li>{trip?.numberOfSeats} passenger(s)</li>
                    <li>{trip?.luggageSize} luggage</li>
                    <li>Pickup from {trip?.origin.city}</li>
                    <li>Dropoff at {trip?.destination.city}</li>
                </ul>
                <p>Are you sure you want to accept this trip request?</p>
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
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.contentWrapper}
                >
                    {renderHeader()}

                    <div className={styles.detailsContainer}>
                        <div className={styles.mainContent}>
                            {renderTripDetails()}
                        </div>
                        <div className={styles.sidebar}>
                            {renderRequesterInfo()}
                            {isAcceptable() && (
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={handleAcceptTrip}
                                    className={styles.acceptButton}
                                    block
                                >
                                    Accept Trip Request
                                </Button>
                            )}
                        </div>
                    </div>

                    {renderAcceptModal()}
                </motion.div>
            </div>
        </>
    );
};

export default TripDetails;