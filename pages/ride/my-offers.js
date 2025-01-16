// pages/ride/my-offers.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRide } from '../../context/Ride/RideContext';
import { Button, Tabs, Badge, Empty, Spin, message } from 'antd';
import {
    Car,
    MapPin,
    Calendar,
    Clock,
    Users,
    DollarSign,
    Package,
    Plus,
    Ban,
    CheckCircle,
    Star
} from 'lucide-react';
import Navbar from '../../components/Navigation/Navbar';
import styles from '../../styles/Rides/myOffers.module.css';
import LoadingAnimation from '../../components/LoadingAnimation';

const MyOffers = () => {
    const router = useRouter();
    const { currentUser, fetchCurrentUser } = useAuth();
    const { getUserRideOffers, completeRideOffer, loading } = useRide();
    const [offers, setOffers] = useState([]);
    const [activeTab, setActiveTab] = useState('active');

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (!currentUser?.isDriver) {
            message.error('Only drivers can access this page');
            // router.push('/user/profile');
            return;
        }
        fetchOffers();
    }, [currentUser]);

    const fetchOffers = async () => {
        try {
            const result = await getUserRideOffers();
            if (result.success) {
                setOffers(result.offers);
            } else {
                message.error('Failed to fetch your ride offers');
            }
        } catch (error) {
            console.error('Fetch offers error:', error);
            message.error('Error loading ride offers');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return '#2a9d8f';
            case 'full':
                return '#ff8a8a';
            case 'completed':
                return '#666666';
            case 'cancelled':
                return '#ff4d4f';
            default:
                return '#666666';
        }
    };

    const filterOffers = (status) => {
        return offers.filter(offer => offer.status === status);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (time) => {
        return time.padStart(5, '0');
    };

    const handleCancelOffer = async (offerId) => {
        // Add cancel logic here when implementing the feature
        message.info('Cancel feature coming soon');
    };

    const handleCompleteOffer = async (offerId, e) => {
        // Prevent the click from bubbling up to the card
        // e.stopPropagation();

        try {
            const result = await completeRideOffer(offerId);

            if (result.success) {
                message.success('Ride completed successfully');
                // Refresh the offers list
                await fetchOffers();
            } else {
                throw new Error(result.message || 'Failed to complete ride');
            }
        } catch (error) {
            console.error('Complete ride error:', error);
            message.error(error.message || 'Error completing ride');
        }
    };

    const handleManageOffer = (offerId) => {
        router.push(`/ride/offers/${offerId}/manage`);
    };


    const OfferCard = ({ offer }) => {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.offerCard}
            >
                <div onClick={() => handleManageOffer(offer._id)} className={styles.offerHeader}>
                    <div className={styles.routeInfo}>
                        <div className={styles.location}>
                            <MapPin className={styles.icon} />
                            <div>
                                <h3>{offer.origin.city}</h3>
                                <p className={styles.address}>{offer.origin.address}</p>
                            </div>
                        </div>
                        <div className={styles.arrow}>→</div>
                        <div className={styles.location}>
                            <MapPin className={styles.icon} />
                            <div>
                                <h3>{offer.destination.city}</h3>
                                <p className={styles.address}>{offer.destination.address}</p>
                            </div>
                        </div>
                    </div>
                    <Badge
                        status="default"
                        color={getStatusColor(offer.status)}
                        text={offer.status.toUpperCase()}
                        className={styles.statusBadge}
                    />
                </div>

                <div className={styles.offerDetails}>
                    <div className={styles.detailItem}>
                        <Calendar className={styles.icon} />
                        <span>{formatDate(offer.departureDate)}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <Clock className={styles.icon} />
                        <span>{formatTime(offer.departureTime)}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <Users className={styles.icon} />
                        <span>{offer.bookedSeats}/{offer.availableSeats} seats</span>
                    </div>
                    <div className={styles.detailItem}>
                        <DollarSign className={styles.icon} />
                        <span>${offer.pricePerSeat}/seat</span>
                    </div>
                </div>

                <div className={styles.offerPreferences}>
                    <div className={styles.preferenceItem}>
                        <Package className={styles.icon} />
                        <span>Luggage: {offer.allowedLuggage}</span>
                    </div>
                    <div className={styles.preferenceItem}>
                        {offer.smoking ? '🚬 Smoking allowed' : '🚭 No smoking'}
                    </div>
                    <div className={styles.preferenceItem}>
                        {offer.pets ? '🐾 Pets allowed' : '⛔ No pets'}
                    </div>
                </div>

                <div className={styles.vehicleInfo}>
                    <Car className={styles.icon} />
                    <span>
                        {offer.vehicle.model} ({offer.vehicle.year}) - {offer.vehicle.plateNumber}
                    </span>
                </div>

                <div className={styles.offerActions}>
                    {offer.status === 'active' && (
                        <Button
                            danger
                            onClick={() => handleCancelOffer(offer._id)}
                            className={styles.cancelButton}
                            icon={<Ban className={styles.buttonIcon} />}
                        >
                            Cancel Ride
                        </Button>
                    )}
                    {offer.status === 'full' && (
                        <Button
                            type="primary"
                            onClick={() => handleCompleteOffer(offer._id)}
                            className={styles.completeButton}
                            icon={<CheckCircle className={styles.buttonIcon} />}
                        >
                            Complete Ride
                        </Button>
                    )}
                </div>
                {offer.status === 'completed' && (
                    <Button
                        type="primary"
                        onClick={() => handleReviewClick(offer)}
                        icon={<Star className={styles.buttonIcon} />}
                    >
                        Review Passenger
                    </Button>
                )}
            </motion.div>
        );
    };

    // Tab items configuration
    const tabItems = [
        {
            key: 'active',
            label: `Active (${filterOffers('active').length})`,
            children: (
                loading ? (
                    <div className={styles.loadingContainer}>
                       <LoadingAnimation />
                    </div>
                ) : filterOffers('active').length > 0 ? (
                    <div className={styles.offersGrid}>
                        {filterOffers('active').map(offer => (
                            <OfferCard key={offer._id} offer={offer} />
                        ))}
                    </div>
                ) : (
                    <Empty
                        description="No active ride offers"
                        className={styles.empty}
                    />
                )
            )
        },
        {
            key: 'full',
            label: `Full (${filterOffers('full').length})`,
            children: (
                loading ? (
                    <div className={styles.loadingContainer}>
                        <Spin size="large" />
                    </div>
                ) : filterOffers('full').length > 0 ? (
                    <div className={styles.offersGrid}>
                        {filterOffers('full').map(offer => (
                            <OfferCard key={offer._id} offer={offer} />
                        ))}
                    </div>
                ) : (
                    <Empty
                        description="No full ride offers"
                        className={styles.empty}
                    />
                )
            )
        },
        {
            key: 'completed',
            label: `Completed (${filterOffers('completed').length})`,
            children: (
                loading ? (
                    <div className={styles.loadingContainer}>
                        <Spin size="large" />
                    </div>
                ) : filterOffers('completed').length > 0 ? (
                    <div className={styles.offersGrid}>
                        {filterOffers('completed').map(offer => (
                            <OfferCard key={offer._id} offer={offer} />
                        ))}
                    </div>
                ) : (
                    <Empty
                        description="No completed ride offers"
                        className={styles.empty}
                    />
                )
            )
        }
    ];
    return (
        <>
            <Navbar />
            <div className={styles.pageContainer}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.contentWrapper}
                >
                    <div className={styles.pageHeader}>
                        <div className={styles.headerLeft}>
                            <h1 className={styles.pageTitle}>My Ride Offers</h1>
                            {currentUser?.vehicle && (
                                <div className={styles.vehicleBadge}>
                                    <Car className={styles.vehicleIcon} />
                                    <span>
                                        {currentUser.vehicle.model} ({currentUser.vehicle.year})
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className={styles.headerRight}>
                            <Button
                                type="primary"
                                icon={<Plus size={16} />}
                                onClick={() => router.push('/ride/offer-ride')}
                                className={styles.createButton}
                            >
                                Create New Offer
                            </Button>
                        </div>
                    </div>

                    {!currentUser?.isDriver ? (
                        <div className={styles.driverVerificationRequired}>
                            <Car className={styles.verificationIcon} />
                            <h2>Driver Verification Required</h2>
                            <p>You need to be a verified driver to create and manage ride offers.</p>
                            <Button
                                type="primary"
                                onClick={() => router.push('/user/profile')}
                                className={styles.verificationButton}
                            >
                                Complete Verification
                            </Button>
                        </div>
                    ) : !currentUser?.vehicle ? (
                        <div className={styles.driverVerificationRequired}>
                            <Car className={styles.verificationIcon} />
                            <h2>Vehicle Information Required</h2>
                            <p>Please add your vehicle information before creating ride offers.</p>
                            <Button
                                type="primary"
                                onClick={() => router.push('/user/profile')}
                                className={styles.verificationButton}
                            >
                                Add Vehicle
                            </Button>
                        </div>
                    ) : (
                        <div className={styles.tabsContainer}>
                            <Tabs
                                activeKey={activeTab}
                                onChange={setActiveTab}
                                items={tabItems}
                                className={styles.tabs}
                            />
                        </div>
                    )}

                    {offers.length === 0 && !loading && currentUser?.isDriver && currentUser?.vehicle && (
                        <div className={styles.emptyStateContainer}>
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <div className={styles.emptyStateText}>
                                        <h3>No Ride Offers Yet</h3>
                                        <p>Start by creating your first ride offer</p>
                                    </div>
                                }
                            >
                                <Button
                                    type="primary"
                                    onClick={() => router.push('/ride/offer-ride')}
                                    icon={<Plus size={16} />}
                                >
                                    Create First Offer
                                </Button>
                            </Empty>
                        </div>
                    )}
                </motion.div>
            </div>
        </>
    );
};

export default MyOffers;