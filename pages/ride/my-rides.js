// pages/ride/my-rides.js
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRide } from '../../context/Ride/RideContext';
import {
    Tabs,
    Empty,
    Spin,
    Button,
    Badge,
    Modal,
    message,
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
    Ban,
    AlertCircle,
    Search,
    Star
} from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import Navbar from '../../components/Navigation/Navbar';
import styles from '../../styles/Rides/myRides.module.css';
import LoadingAnimation from '../../components/LoadingAnimation';

const { TabPane } = Tabs;

const MyRides = () => {
    // States
    const [activeTab, setActiveTab] = useState('upcoming');
    const [rideRequests, setRideRequests] = useState([]);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [refreshInterval, setRefreshInterval] = useState(null);
    const [pageLoading, setPageLoading] = useState(true);
    const [selectedRideForReview, setSelectedRideForReview] = useState(null);

    // Hooks
    const router = useRouter();
    const { currentUser, fetchCurrentUser } = useAuth();
    const {
        getUserRideRequests,
        cancelRideRequest,
        updateRequestStatus,
        loading
    } = useRide();

    // Fetch user and ride data
    useEffect(() => {
        const initializePage = async () => {
            try {
                setPageLoading(true);
                await fetchCurrentUser();
                await fetchRideRequests();
            } catch (error) {
                console.error('Initialization error:', error);
            } finally {
                setPageLoading(false);
            }
        };

        initializePage();
    }, []);

    // Helper Functions
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
            case 'completed':
                return '#666666';
            case 'expired':
                return '#ff8a8a';
            default:
                return '#666666';
        }
    };

    // Data fetching and management
    const fetchRideRequests = async () => {
        try {
            const result = await getUserRideRequests();
            if (result.success) {
                const currentDate = moment();
                const processedRequests = result.requests.map(request => {
                    if (request.status === 'active' && moment(request.expiryDate).isBefore(currentDate)) {
                        updateRequestStatus(request._id, 'expired');
                        return { ...request, status: 'expired' };
                    }
                    return request;
                });
                setRideRequests(processedRequests);
            } else {
                message.error('Failed to fetch your rides');
            }
        } catch (error) {
            console.error('Fetch rides error:', error);
            message.error('Error loading your rides');
        }
    };

    // Filter functions
    const filterRides = useCallback((status) => {
        const currentDate = moment();

        switch (status) {
            case 'upcoming':
                return rideRequests.filter(request =>
                    ['active', 'matched'].includes(request.status) &&
                    moment(request.departureDate).isAfter(currentDate)
                );
            case 'past':
                return rideRequests.filter(request =>
                    (request.status === 'completed' ||
                        moment(request.departureDate).isBefore(currentDate)) &&
                    request.status !== 'cancelled' &&
                    request.status !== 'expired'
                );
            case 'cancelled':
                return rideRequests.filter(request =>
                    request.status === 'cancelled'
                );
            case 'expired':
                return rideRequests.filter(request =>
                    request.status === 'expired' ||
                    (request.status === 'active' && moment(request.expiryDate).isBefore(currentDate))
                );
            default:
                return [];
        }
    }, [rideRequests]);

    // Action Handlers
    const handleCancelRequest = async () => {
        if (!selectedRequest) return;

        try {
            setProcessing(true);
            const result = await cancelRideRequest(selectedRequest._id);

            if (result.success) {
                message.success('Ride request cancelled successfully');
                setShowCancelModal(false);
                await fetchRideRequests(); // Refresh the list
            } else {
                throw new Error(result.message || 'Failed to cancel ride request');
            }
        } catch (error) {
            console.error('Cancel request error:', error);
            message.error(error.message || 'Error cancelling ride request');
        } finally {
            setProcessing(false);
        }
    };

    const handleViewRideDetails = (rideId) => {
        router.push(`/ride/details/${rideId}`);
    };

    const handleFindRide = () => {
        router.push('/ride/find-ride');
    };
    if (pageLoading) {
        return (
            <>
                <Navbar />
                <div className={styles.loadingContainer}>
                   <LoadingAnimation />
                </div>
            </>
        );
    }
    // Render Ride Card Component
    const renderRideCard = (request) => (
        <motion.div
            key={request._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.rideCard}
        >
            {/* Status and Price Header */}
            <div className={styles.cardHeader}>
                <Badge
                    status="default"
                    color={getStatusColor(request.status)}
                    text={request.status.toUpperCase()}
                    className={styles.statusBadge}
                />
                <div className={styles.priceInfo}>
                    <DollarSign className={styles.priceIcon} />
                    <span className={styles.priceAmount}>
                        {request.maxPrice.toFixed(2)}
                    </span>
                </div>
            </div>

            {/* Ride Details Section */}
            <div className={styles.rideDetails}>
                {/* Locations */}
                <div className={styles.locations}>
                    <div className={styles.locationPoint}>
                        <MapPin className={styles.locationIcon} />
                        <div>
                            <h4>{request.origin.city}</h4>
                            <p>{request.origin.address}</p>
                        </div>
                    </div>
                    <div className={styles.routeLine} />
                    <div className={styles.locationPoint}>
                        <MapPin className={styles.locationIcon} />
                        <div>
                            <h4>{request.destination.city}</h4>
                            <p>{request.destination.address}</p>
                        </div>
                    </div>
                </div>

                {/* Trip Info */}
                <div className={styles.tripInfo}>
                    <div className={styles.infoItem}>
                        <Calendar className={styles.icon} />
                        <span>{formatDate(request.departureDate)}</span>
                    </div>
                    {request.matchedRide && (
                        <div className={styles.infoItem}>
                            <Clock className={styles.icon} />
                            <span>{formatTime(request.matchedRide.departureTime)}</span>
                        </div>
                    )}
                    <div className={styles.infoItem}>
                        <Users className={styles.icon} />
                        <span>{request.numberOfSeats} seat(s)</span>
                    </div>
                    <div className={styles.infoItem}>
                        <Package className={styles.icon} />
                        <span>{request.luggageSize} luggage</span>
                    </div>
                </div>

                {/* Matched Ride Info */}
                {request.matchedRide && (
                    <div className={styles.matchedRideSection}>
                        <div className={styles.driverInfo}>
                            <div className={styles.driverAvatar}>
                                {request.matchedRide.driver.profilePicture ? (
                                    <img
                                        src={request.matchedRide.driver.profilePicture.url}
                                        alt={request.matchedRide.driver.fullName}
                                    />
                                ) : (
                                    <div className={styles.avatarPlaceholder}>
                                        {request.matchedRide.driver.fullName[0]}
                                    </div>
                                )}
                            </div>
                            <div className={styles.driverDetails}>
                                <h4>{request.matchedRide.driver.fullName}</h4>
                                <div className={styles.driverStats}>
                                    <span>⭐ {request.matchedRide.driver.rating.toFixed(1)}</span>
                                    <span>🚗 {request.matchedRide.driver.totalTrips} trips</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            type="primary"
                            onClick={() => handleViewRideDetails(request.matchedRide._id)}
                            className={styles.viewDetailsButton}
                        >
                            View Ride Details
                        </Button>
                    </div>
                )}

                {/* Action Buttons */}
                {['active', 'matched'].includes(request.status) && (
                    <div className={styles.cardActions}>
                        <Button
                            danger
                            icon={<Ban className={styles.buttonIcon} />}
                            onClick={() => {
                                setSelectedRequest(request);
                                setShowCancelModal(true);
                            }}
                            className={styles.cancelButton}
                        >
                            Cancel Request
                        </Button>
                    </div>
                )}
            </div>
            {request.status === 'completed' && request.matchedRide && (
                <div className={styles.cardActions}>
                    <Button
                        type="primary"
                        onClick={() => handleReviewClick(request)}
                        icon={<Star className={styles.buttonIcon} />}
                    >
                        Write Review
                    </Button>
                </div>
            )}
        </motion.div>
    );
    // Cancel Confirmation Modal
    const renderCancelModal = () => (
        <Modal
            title="Cancel Ride Request"
            open={showCancelModal}
            onCancel={() => setShowCancelModal(false)}
            footer={[
                <Button
                    key="back"
                    onClick={() => setShowCancelModal(false)}
                    disabled={processing}
                >
                    Keep Request
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    danger
                    loading={processing}
                    onClick={handleCancelRequest}
                >
                    Cancel Request
                </Button>
            ]}
            className={styles.cancelModal}
        >
            <div className={styles.modalContent}>
                <AlertCircle className={styles.warningIcon} />
                <div className={styles.warningText}>
                    <h4>Are you sure you want to cancel this ride request?</h4>
                    {selectedRequest?.matchedRide && (
                        <Alert
                            type="warning"
                            message="This will cancel your booking with the matched ride."
                            className={styles.matchedWarning}
                        />
                    )}
                    {moment(selectedRequest?.departureDate).isBefore(moment()) && (
                        <Alert
                            type="info"
                            message="This ride's departure date has passed."
                            className={styles.dateWarning}
                        />
                    )}
                </div>
            </div>
        </Modal>
    );

    // Render ride lists based on status
    const renderRidesList = (status) => {
        const filteredRides = filterRides(status);

        if (filteredRides.length === 0) {
            return (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                        <div className={styles.emptyState}>
                            <h3>No {status} rides</h3>
                            <p>
                                {status === 'upcoming'
                                    ? "You haven't booked any upcoming rides"
                                    : `No ${status} rides to show`}
                            </p>
                            {status === 'upcoming' && (
                                <Button
                                    type="primary"
                                    icon={<Search className={styles.buttonIcon} />}
                                    onClick={handleFindRide}
                                >
                                    Find a Ride
                                </Button>
                            )}
                        </div>
                    }
                />
            );
        }

        return (
            <div className={styles.ridesList}>
                {filteredRides.map(request => renderRideCard(request))}
            </div>
        );
    };

    // Main component render
    return (
        <>
            <Navbar />
            <div className={styles.pageContainer}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.contentWrapper}
                >
                    {/* Page Header */}
                    <div className={styles.pageHeader}>
                        <div className={styles.headerLeft}>
                            <h1 className={styles.pageTitle}>My Rides</h1>
                        </div>
                        <div className={styles.headerRight}>
                            <Button
                                type="primary"
                                icon={<Search className={styles.buttonIcon} />}
                                onClick={handleFindRide}
                                className={styles.findRideButton}
                            >
                                Find a Ride
                            </Button>
                        </div>
                    </div>

                    {/* Rides Container with Tabs */}
                    <div className={styles.ridesContainer}>
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            className={styles.tabs}
                        >
                            <TabPane
                                tab={`Upcoming (${filterRides('upcoming').length})`}
                                key="upcoming"
                            >
                                {renderRidesList('upcoming')}
                            </TabPane>
                            <TabPane
                                tab={`Past (${filterRides('past').length})`}
                                key="past"
                            >
                                {renderRidesList('past')}
                            </TabPane>
                            <TabPane
                                tab={`Cancelled (${filterRides('cancelled').length})`}
                                key="cancelled"
                            >
                                {renderRidesList('cancelled')}
                            </TabPane>
                            <TabPane
                                tab={`Expired (${filterRides('expired').length})`}
                                key="expired"
                            >
                                {renderRidesList('expired')}
                            </TabPane>
                        </Tabs>
                    </div>

                    {/* Modals */}
                    {renderCancelModal()}
                </motion.div>
            </div>

        </>
    );
};

export default MyRides;