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
    MessageCircle,
    Star,
    PawPrint,
    ChevronLeft,
} from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import Navbar from '../../../components/Navigation/Navbar';
import styles from '../../../styles/Rides/rideDetails.module.css';
import LoadingAnimation from '../../../components/LoadingAnimation';

const RideDetails = () => {
    const router = useRouter();
    const { rideId } = router.query;
    const { currentUser } = useAuth();
    const { getRideDetails, matchRideRequest, createRideRequest, loading } = useRide();
    const { createChat } = useChat();
    const [form] = Form.useForm();

    // State
    const [ride, setRide] = useState(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [bookingSeats, setBookingSeats] = useState(1);
    const [processing, setProcessing] = useState(false);

    // Fetch ride details
    useEffect(() => {
        if (rideId) {
            fetchRideDetails();
        }
    }, [rideId]);

    const fetchRideDetails = async () => {
        try {
            const result = await getRideDetails(rideId);
            if (result.success) {
                setRide(result.ride);
            } else {
                message.error('Failed to fetch ride details');
                router.push('/ride/find-ride');
            }
        } catch (error) {
            console.error('Fetch ride details error:', error);
            message.error('Error loading ride details');
            router.push('/ride/find-ride');
        }
    };
    // Helper functions
    const formatDate = (date) => {
        return moment(date).format('dddd, MMMM D, YYYY');
    };

    const formatTime = (time) => {
        return moment(time, 'HH:mm').format('h:mm A');
    };

    const calculateTotalPrice = () => {
        return ride ? (ride.pricePerSeat * bookingSeats) : 0;
    };

    // Handler functions
    const handleContactDriver = async () => {
        if (!currentUser) {
            message.info('Please login to contact the driver');
            router.push('/auth/login');
            return;
        }

        try {
            const chat = await createChat(ride.driver._id);
            console.log(ride.driver._id)
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

    const handleBookingSubmit = async () => {
        try {
            setProcessing(true);

            // First create the ride request
            const requestData = {
                origin: ride.origin,
                destination: ride.destination,
                departureDate: ride.departureDate,
                numberOfSeats: bookingSeats,
                maxPrice: ride.pricePerSeat * bookingSeats,
                luggageSize: ride.allowedLuggage,
                flexibleTiming: false,
                // Add any other required fields from your RideRequest model
            };

            // Create request
            const createResult = await createRideRequest(requestData);

            if (!createResult.success) {
                throw new Error(createResult.message || 'Failed to create request');
            }

            // Then match it with the ride offer
            const matchResult = await matchRideRequest(
                createResult.rideRequest._id,
                ride._id
            );

            if (matchResult.success) {
                message.success('Ride booked successfully!');
                setShowBookingModal(false);
                router.push('/ride/my-rides');
            } else {
                // If matching fails, we should probably cancel the request
                // You might want to add a cancelRideRequest call here
                throw new Error(matchResult.message || 'Failed to match ride');
            }
        } catch (error) {
            console.error('Booking error:', error);
            message.error(error.message || 'Error booking ride');
        } finally {
            setProcessing(false);
        }
    };

    const handleGoBack = () => {
        router.back();
    };

    // Check if the ride is bookable
    const isBookable = () => {
        if (!ride) return false;
        return (
            ride.status === 'active' &&
            ride.availableSeats > ride.bookedSeats &&
            (!currentUser || currentUser._id !== ride.driver._id)
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
                Back to Search
            </Button>
            <Badge
                status="default"
                color={ride?.status === 'active' ? '#2a9d8f' : '#666666'}
                text={ride?.status.toUpperCase()}
                className={styles.statusBadge}
            />
        </div>
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
                    <h2 className={styles.driverName}>{ride?.driver.fullName}</h2>
                    <div className={styles.driverStats}>
                        <span className={styles.rating}>
                            <Star className={styles.icon} />
                            {ride?.driver.rating.toFixed(1)}
                        </span>
                        <span className={styles.trips}>
                            <Car className={styles.icon} />
                            {ride?.driver.totalTrips} trips
                        </span>
                    </div>
                </div>
                <Button
                    type="primary"
                    icon={<MessageCircle />}
                    onClick={handleContactDriver}
                    className={styles.contactButton}
                >
                    Contact Driver
                </Button>
            </div>

            <Divider className={styles.divider} />

            <div className={styles.vehicleInfo}>
                <h3>Vehicle Information</h3>
                <div className={styles.vehicleDetails}>
                    <Car className={styles.icon} />
                    <span>
                        {ride?.vehicle.model} ({ride?.vehicle.year}) - {ride?.vehicle.plateNumber}
                    </span>
                </div>
            </div>
        </Card>
    );

    const renderRideDetails = () => (
        <Card className={styles.rideCard}>
            <div className={styles.routeInfo}>
                <div className={styles.location}>
                    <MapPin className={styles.icon} />
                    <div>
                        <span className={styles.locationLabel}>Pickup</span>
                        <h3 className={styles.locationName}>{ride?.origin.city}</h3>
                        <p className={styles.locationAddress}>{ride?.origin.address}</p>
                    </div>
                </div>

                <div className={styles.routeDivider}>
                    <div className={styles.dividerLine} />
                </div>

                <div className={styles.location}>
                    <MapPin className={styles.icon} />
                    <div>
                        <span className={styles.locationLabel}>Dropoff</span>
                        <h3 className={styles.locationName}>{ride?.destination.city}</h3>
                        <p className={styles.locationAddress}>{ride?.destination.address}</p>
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
                            {formatDate(ride?.departureDate)}
                        </span>
                    </div>
                </div>

                <div className={styles.detailItem}>
                    <Clock className={styles.icon} />
                    <div>
                        <span className={styles.detailLabel}>Departure Time</span>
                        <span className={styles.detailValue}>
                            {formatTime(ride?.departureTime)}
                        </span>
                    </div>
                </div>

                <div className={styles.detailItem}>
                    <Users className={styles.icon} />
                    <div>
                        <span className={styles.detailLabel}>Available Seats</span>
                        <span className={styles.detailValue}>
                            {ride?.availableSeats - ride?.bookedSeats} of {ride?.availableSeats}
                        </span>
                    </div>
                </div>

                <div className={styles.detailItem}>
                    <DollarSign className={styles.icon} />
                    <div>
                        <span className={styles.detailLabel}>Price per Seat</span>
                        <span className={styles.detailValue}>
                            ${ride?.pricePerSeat}
                        </span>
                    </div>
                </div>
            </div>

            <Divider className={styles.divider} />

            <div className={styles.preferences}>
                <h3>Ride Preferences</h3>
                <div className={styles.preferencesList}>
                    <div className={styles.preferenceItem}>
                        <Package className={styles.icon} />
                        <span>
                            Luggage Size: {ride?.allowedLuggage.charAt(0).toUpperCase() +
                                ride?.allowedLuggage.slice(1)}
                        </span>
                    </div>
                    <div className={styles.preferenceItem}>
                        <span className={styles.preferenceIcon}>
                            {ride?.smoking ? '🚬' : '🚭'}
                        </span>
                        <span>{ride?.smoking ? 'Smoking allowed' : 'No smoking'}</span>
                    </div>
                    <div className={styles.preferenceItem}>
                        <PawPrint className={styles.icon} />
                        <span>{ride?.pets ? 'Pets allowed' : 'No pets'}</span>
                    </div>
                </div>
            </div>
        </Card>
    );

    // Main render
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