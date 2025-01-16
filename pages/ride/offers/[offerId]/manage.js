// pages/ride/offers/[offerId]/manage.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../context/Auth/AuthContext';
import { useRide } from '../../../../context/Ride/RideContext';
import { useChat } from '../../../../context/Chat/ChatContext'; // Adding Chat context
import {
    Button,
    Tabs,
    Badge,
    Empty,
    Spin,
    Modal,
    message,
    Alert,
    Tooltip
} from 'antd';
import {
    Car,
    MapPin,
    Calendar,
    Clock,
    Users,
    DollarSign,
    Package,
    ChevronLeft,
    CheckCircle,
    XCircle,
    MessageCircle,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import Navbar from '../../../../components/Navigation/Navbar';
import styles from '../../../../styles/Rides/manageOffer.module.css';
import LoadingAnimation from '../../../../components/LoadingAnimation';

const { TabPane } = Tabs;

const ManageOffer = () => {
    const router = useRouter();
    const { offerId } = router.query;
    const { currentUser, fetchCurrentUser } = useAuth();
    const { getRideDetails, loading, rejectRideRequest, getOfferRequests, acceptRideRequest, } = useRide();
    const { createChat } = useChat();
    // State declarations
    const [offer, setOffer] = useState(null);
    const [bookingRequests, setBookingRequests] = useState([]);
    const [activeTab, setActiveTab] = useState('active');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [processing, setProcessing] = useState(false);

    // Effects
    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (offerId) {
            fetchOfferDetails();
        }
    }, [offerId]);

    useEffect(() => {
        if (offer && currentUser && offer.driver._id !== currentUser._id) {
            message.error('You are not authorized to manage this offer');
            router.push('/ride/my-offers');
        }
    }, [offer, currentUser]);

    // Main data fetching function
    const fetchOfferDetails = async () => {
        try {
            const result = await getRideDetails(offerId);
            if (result.success) {
                setOffer(result.ride);

                // Fetch ride requests
                const requestsResult = await getOfferRequests(offerId);
                if (requestsResult.success) {
                    setBookingRequests(requestsResult.requests);
                } else {
                    message.error('Failed to fetch booking requests');
                }
            } else {
                message.error('Failed to fetch ride details');
                router.push('/ride/my-offers');
            }
        } catch (error) {
            console.error('Fetch offer details error:', error);
            message.error('Error loading ride details');
            router.push('/ride/my-offers');
        }
    };

    // Helper functions
    const formatDate = (date) => {
        return moment(date).format('ddd, MMM D, YYYY');
    };

    const formatTime = (time) => {
        return moment(time, 'HH:mm').format('h:mm A');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return '#2a9d8f';
            case 'matched':
                return '#52c41a';
            case 'cancelled':
                return '#ff4d4f';
            case 'expired':
                return '#666666';
            default:
                return '#666666';
        }
    };
    // Handler functions
    const handleAcceptRequest = async (request) => {
        if (offer.availableSeats - offer.bookedSeats < request.numberOfSeats) {
            message.error('Not enough seats available');
            return;
        }
        setSelectedRequest(request);
        setActionType('accept');
        setShowActionModal(true);
    };

    const handleRejectRequest = async (request) => {
        setSelectedRequest(request);
        setActionType('reject');
        setShowActionModal(true);
    };

    const handleRequestAction = async () => {
        if (!selectedRequest || !actionType) return;

        setProcessing(true);
        try {
            let result;
            if (actionType === 'accept') {
                result = await acceptRideRequest(selectedRequest._id);
            } else {
                result = await rejectRideRequest(selectedRequest._id);
            }

            if (result.success) {
                // Close modal and refresh data
                setShowActionModal(false);
                await fetchOfferDetails();
            } else {
                throw new Error(result.message || `Failed to ${actionType} request`);
            }
        } catch (error) {
            console.error('Request action error:', error);
            message.error(error.message || `Failed to ${actionType} request`);
        } finally {
            setProcessing(false);
        }
    };

    const handleContactPassenger = async (passengerId) => {
        try {
            const result = await createChat(passengerId);
            if (result.success) {
                router.push('/messages');
            } else {
                message.error('Failed to create chat');
            }
        } catch (error) {
            console.error('Create chat error:', error);
            message.error('Error starting chat');
        }
    };

    const handleGoBack = () => {
        router.push('/ride/my-offers');
    };

    // Filter functions
    const filterRequests = (status) => {
        return bookingRequests.filter(request => request.status === status);
    };
    // Render functions
    const renderRideDetails = () => (
        <div className={styles.rideDetailsCard}>
            <div className={styles.routeInfo}>
                <div className={styles.location}>
                    <MapPin className={styles.icon} />
                    <div>
                        <span className={styles.locationLabel}>Pickup</span>
                        <h3 className={styles.locationName}>{offer?.origin.city}</h3>
                        <p className={styles.locationAddress}>{offer?.origin.address}</p>
                    </div>
                </div>

                <div className={styles.routeDivider}>
                    <div className={styles.dividerLine} />
                </div>

                <div className={styles.location}>
                    <MapPin className={styles.icon} />
                    <div>
                        <span className={styles.locationLabel}>Dropoff</span>
                        <h3 className={styles.locationName}>{offer?.destination.city}</h3>
                        <p className={styles.locationAddress}>{offer?.destination.address}</p>
                    </div>
                </div>
            </div>

            <div className={styles.rideInfo}>
                <div className={styles.infoItem}>
                    <Calendar className={styles.icon} />
                    <div>
                        <span className={styles.infoLabel}>Date</span>
                        <span className={styles.infoValue}>
                            {formatDate(offer?.departureDate)}
                        </span>
                    </div>
                </div>
                <div className={styles.infoItem}>
                    <Clock className={styles.icon} />
                    <div>
                        <span className={styles.infoLabel}>Time</span>
                        <span className={styles.infoValue}>
                            {formatTime(offer?.departureTime)}
                        </span>
                    </div>
                </div>
                <div className={styles.infoItem}>
                    <Users className={styles.icon} />
                    <div>
                        <span className={styles.infoLabel}>Seats</span>
                        <span className={styles.infoValue}>
                            {offer?.bookedSeats}/{offer?.availableSeats} booked
                        </span>
                    </div>
                </div>
                <div className={styles.infoItem}>
                    <DollarSign className={styles.icon} />
                    <div>
                        <span className={styles.infoLabel}>Price</span>
                        <span className={styles.infoValue}>
                            ${offer?.pricePerSeat} per seat
                        </span>
                    </div>
                </div>
            </div>

            <div className={styles.preferences}>
                <div className={styles.preferenceItem}>
                    <Package className={styles.icon} />
                    <span>Luggage: {offer?.allowedLuggage}</span>
                </div>
                <div className={styles.preferenceItem}>
                    {offer?.smoking ? '🚬 Smoking allowed' : '🚭 No smoking'}
                </div>
                <div className={styles.preferenceItem}>
                    {offer?.pets ? '🐾 Pets allowed' : '⛔ No pets'}
                </div>
            </div>
        </div>
    );
    const renderBookingRequest = (request) => (
        <motion.div
            key={request._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.requestCard}
        >
            <div className={styles.requestHeader}>
                <div className={styles.passengerInfo}>
                    <div className={styles.passengerAvatar}>
                        {request.passenger.profilePicture ? (
                            <img
                                src={request.passenger.profilePicture.url}
                                alt={request.passenger.fullName}
                                className={styles.avatarImage}
                            />
                        ) : (
                            <div className={styles.avatarPlaceholder}>
                                {request.passenger.fullName[0]}
                            </div>
                        )}
                    </div>
                    <div className={styles.passengerDetails}>
                        <h3>{request.passenger.fullName}</h3>
                        <div className={styles.requestStats}>
                            <span>
                                ⭐ {request.passenger.rating.toFixed(1)}
                            </span>
                            <span>
                                🚗 {request.passenger.totalTrips} trips
                            </span>
                        </div>
                    </div>
                </div>
                <Badge
                    status="default"
                    color={getStatusColor(request.status)}
                    text={request.status.toUpperCase()}
                    className={styles.statusBadge}
                />
            </div>

            <div className={styles.requestDetails}>
                <div className={styles.detailItem}>
                    <Users className={styles.icon} />
                    <span>{request.numberOfSeats} seats requested</span>
                </div>
                <div className={styles.detailItem}>
                    <Package className={styles.icon} />
                    <span>{request.luggageSize} luggage</span>
                </div>
                {request.additionalNotes && (
                    <div className={styles.notes}>
                        <p>{request.additionalNotes}</p>
                    </div>
                )}
            </div>

            {request.status === 'active' && (
                <div className={styles.requestActions}>
                    <Tooltip title={
                        offer.availableSeats - offer.bookedSeats < request.numberOfSeats
                            ? "Not enough seats available"
                            : "Accept booking request"
                    }>
                        <Button
                            type="primary"
                            icon={<CheckCircle className={styles.buttonIcon} />}
                            onClick={() => handleAcceptRequest(request)}
                            className={styles.acceptButton}
                            disabled={offer.availableSeats - offer.bookedSeats < request.numberOfSeats}
                        >
                            Accept
                        </Button>
                    </Tooltip>
                    <Button
                        danger
                        icon={<XCircle className={styles.buttonIcon} />}
                        onClick={() => handleRejectRequest(request)}
                        className={styles.rejectButton}
                    >
                        Reject
                    </Button>
                    <Button
                        icon={<MessageCircle className={styles.buttonIcon} />}
                        onClick={() => handleContactPassenger(request.passenger._id)}
                        className={styles.messageButton}
                    >
                        Message
                    </Button>
                </div>
            )}
        </motion.div>
    );

    const renderActionModal = () => (
        <Modal
            title={`${actionType === 'accept' ? 'Accept' : 'Reject'} Booking Request`}
            open={showActionModal}
            onCancel={() => setShowActionModal(false)}
            footer={[
                <Button
                    key="cancel"
                    onClick={() => setShowActionModal(false)}
                    disabled={processing}
                >
                    Cancel
                </Button>,
                <Button
                    key="submit"
                    type={actionType === 'accept' ? 'primary' : 'danger'}
                    loading={processing}
                    onClick={handleRequestAction}
                >
                    {actionType === 'accept' ? 'Accept Request' : 'Reject Request'}
                </Button>
            ]}
            className={styles.actionModal}
        >
            <div className={styles.modalContent}>
                <p>
                    Are you sure you want to {actionType} the booking request from{' '}
                    <strong>{selectedRequest?.passenger.fullName}</strong> for{' '}
                    <strong>{selectedRequest?.numberOfSeats}</strong> seats?
                </p>
                {actionType === 'accept' && (
                    <Alert
                        message="Seat Availability Check"
                        description={
                            <div>
                                <p>Available seats: {offer.availableSeats - offer.bookedSeats}</p>
                                <p>Requested seats: {selectedRequest?.numberOfSeats}</p>
                            </div>
                        }
                        type={
                            offer.availableSeats - offer.bookedSeats >= selectedRequest?.numberOfSeats
                                ? 'info'
                                : 'warning'
                        }
                        showIcon
                    />
                )}
            </div>
        </Modal>
    );
    // Main render with loading state
    if (loading || !offer) {
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
                    <div className={styles.header}>
                        <Button
                            icon={<ChevronLeft />}
                            onClick={handleGoBack}
                            className={styles.backButton}
                        >
                            Back to My Offers
                        </Button>
                        <Badge
                            status="default"
                            color={getStatusColor(offer.status)}
                            text={offer.status.toUpperCase()}
                            className={styles.statusBadge}
                        />
                    </div>

                    <div className={styles.mainContent}>
                        <div className={styles.rideDetailsSection}>
                            <h2 className={styles.sectionTitle}>Ride Details</h2>
                            {renderRideDetails()}
                        </div>

                        <div className={styles.bookingsSection}>
                            <h2 className={styles.sectionTitle}>Booking Requests</h2>
                            <Tabs
                                activeKey={activeTab}
                                onChange={setActiveTab}
                                className={styles.tabs}
                            >
                                <TabPane
                                    tab={`Active (${filterRequests('active').length})`}
                                    key="active"
                                >
                                    {filterRequests('active').length > 0 ? (
                                        <div className={styles.requestsList}>
                                            {filterRequests('active').map(request =>
                                                renderBookingRequest(request)
                                            )}
                                        </div>
                                    ) : (
                                        <Empty description="No active requests" />
                                    )}
                                </TabPane>
                                <TabPane
                                    tab={`Matched (${filterRequests('matched').length})`}
                                    key="matched"
                                >
                                    {filterRequests('matched').length > 0 ? (
                                        <div className={styles.requestsList}>
                                            {filterRequests('matched').map(request =>
                                                renderBookingRequest(request)
                                            )}
                                        </div>
                                    ) : (
                                        <Empty description="No matched requests" />
                                    )}
                                </TabPane>
                                <TabPane
                                    tab={`Cancelled (${filterRequests('cancelled').length})`}
                                    key="cancelled"
                                >
                                    {filterRequests('cancelled').length > 0 ? (
                                        <div className={styles.requestsList}>
                                            {filterRequests('cancelled').map(request =>
                                                renderBookingRequest(request)
                                            )}
                                        </div>
                                    ) : (
                                        <Empty description="No cancelled requests" />
                                    )}
                                </TabPane>
                                <TabPane
                                    tab={`Expired (${filterRequests('expired').length})`}
                                    key="expired"
                                >
                                    {filterRequests('expired').length > 0 ? (
                                        <div className={styles.requestsList}>
                                            {filterRequests('expired').map(request =>
                                                renderBookingRequest(request)
                                            )}
                                        </div>
                                    ) : (
                                        <Empty description="No expired requests" />
                                    )}
                                </TabPane>
                            </Tabs>
                        </div>
                    </div>
                    {renderActionModal()}
                </motion.div>
            </div>
        </>
    );
};

export default ManageOffer;