// pages/trip/my-trips.js
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/Auth/AuthContext';
import { useTrip } from '../../context/Ride/TripContext';
import { Button, Tabs, Badge, Empty, Spin, message, Modal } from 'antd';
import {
    MapPin,
    Calendar,
    Clock,
    Users,
    Plus,
    Ban,
    CheckCircle,
    Star,
    Package
} from 'lucide-react';
import Navbar from '../../components/Navigation/Navbar';
import styles from '../../styles/Trips/myTrips.module.css';
import EditTripModal from '../../components/Trip/EditTripModal';
import RequestTripModal from '../../components/Trip/RequestTripModal';
import moment from 'moment';

const MyTrips = () => {
    const router = useRouter();
    const { currentUser } = useAuth();
    const { getMyTrips, loading } = useTrip();
    const [trips, setTrips] = useState([]);
    const [activeTab, setActiveTab] = useState('active');
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);

    useEffect(() => {
        fetchTrips();
    }, []);

    const fetchTrips = async () => {
        try {
            const result = await getMyTrips();
            if (result.success) {
                setTrips(result.trips);
            } else {
                message.error('Failed to fetch your trip requests');
            }
        } catch (error) {
            console.error('Fetch trips error:', error);
            message.error('Error loading trip requests');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return '#2a9d8f';
            default:
                return '#666666';
        }
    };

    const filterTrips = (status) => {
        return trips.filter(trip => trip.status === status);
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

    const handleCancelTrip = async (tripId) => {
        // TODO: Implement cancel trip functionality
        message.info('Cancel feature coming soon');
    };

    const handleEdit = (trip) => {
        setSelectedTrip(trip);
        setEditModalVisible(true);
    };

    const handleEditSuccess = () => {
        setEditModalVisible(false);
        fetchTrips(); // Refresh the trips list
    };

    const handleRequestSuccess = () => {
        setRequestModalVisible(false);
        fetchTrips(); // Refresh the trips list
    };

    const TripCard = ({ trip, onEdit }) => {
        const handleDriverClick = (driverId) => {
            router.push(`/user/userprofile/${driverId}`);
            console.log(driverId, "This is driver id");
        };

        const formatRecurrence = (recurrence) => {
            if (!recurrence || recurrence.pattern === 'none') {
                return 'No recurrence';
            }

            let recurrenceText = '';
            switch (recurrence.pattern) {
                case 'daily':
                    recurrenceText = 'Daily';
                    break;
                case 'weekly':
                    recurrenceText = 'Weekly';
                    break;
                case 'weekdays':
                    recurrenceText = 'Weekdays (Mon-Fri)';
                    break;
                case 'custom':
                    recurrenceText = `Custom (${recurrence.customDays.join(', ')})`;
                    break;
                default:
                    recurrenceText = 'No recurrence';
            }

            if (recurrence.endDate) {
                recurrenceText += ` until ${moment(recurrence.endDate).format('MMM D, YYYY')}`;
            }

            return recurrenceText;
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={styles.tripCard}
            >
                <div className={styles.tripHeader}>
                    <div className={styles.routeInfo}>
                        <div className={styles.location}>
                            <MapPin className={styles.icon} />
                            <div>
                                <h3>{trip.origin.city}</h3>
                                <p className={styles.address}>{trip.origin.address}</p>
                            </div>
                        </div>
                        <div className={styles.arrow}>→</div>
                        <div className={styles.location}>
                            <MapPin className={styles.icon} />
                            <div>
                                <h3>{trip.destination.city}</h3>
                                <p className={styles.address}>{trip.destination.address}</p>
                            </div>
                        </div>
                    </div>
                    <Badge
                        status="default"
                        color={getStatusColor(trip.status)}
                        text={trip.status.toUpperCase()}
                        className={styles.statusBadge}
                    />
                </div>

                <div className={styles.tripDetails}>
                    <div className={styles.detailItem}>
                        <Calendar className={styles.icon} />
                        <span>{formatDate(trip.departureDate)}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <Clock className={styles.icon} />
                        <span>{formatTime(trip.departureTime)}</span>
                    </div>
                    <div className={styles.detailItem}>
                        <Users className={styles.icon} />
                        <span>{trip.numberOfSeats} seats needed</span>
                    </div>
                    <div className={styles.detailItem}>
                        <Package className={styles.icon} />
                        <span>Luggage: {trip.luggageSize}</span>
                    </div>
                </div>

                {trip.recurrence && trip.recurrence.pattern !== 'none' && (
                    <div className={styles.recurrenceDetails}>
                        <h4>Recurrence</h4>
                        <p>{formatRecurrence(trip.recurrence)}</p>
                    </div>
                )}

                {trip.acceptedDriver && (
                    <div onClick={() => handleDriverClick(trip.acceptedDriver._id)} className={styles.driverInfo}>
                        <h4>Accepted Driver</h4>
                        <div className={styles.driverDetails}>
                            <img
                                src={trip.acceptedDriver.profilePicture?.url || '/images/carlogo.png'}
                                alt={trip.acceptedDriver.fullName}
                                className={styles.driverAvatar}
                            />
                            <div>
                                <p className={styles.driverName}>{trip.acceptedDriver.fullName}</p>
                                <div className={styles.driverRating}>
                                    <Star className={styles.starIcon} />
                                    <span>{trip.acceptedDriver.rating.toFixed(1)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {trip.additionalNotes && (
                    <div className={styles.notes}>
                        <h4>Additional Notes</h4>
                        <p>{trip.additionalNotes}</p>
                    </div>
                )}

                <div className={styles.tripActions}>
                    {trip.status === 'active' && (
                        <>
                            <Button
                                type="primary"
                                onClick={() => onEdit(trip)}
                                className={styles.editButton}
                            >
                                Edit Request
                            </Button>
                            <Button
                                danger
                                onClick={() => handleCancelTrip(trip._id)}
                                className={styles.cancelButton}
                                icon={<Ban className={styles.buttonIcon} />}
                            >
                                Cancel Request
                            </Button>
                        </>
                    )}
                </div>
            </motion.div>
        );
    };

    const tabItems = [
        {
            key: 'active',
            label: `Active (${filterTrips('active').length})`,
            children: (
                loading ? (
                    <div className={styles.loadingContainer}>
                        <Spin size="large" />
                    </div>
                ) : filterTrips('active').length > 0 ? (
                    <div className={styles.tripsContainer}>
                        {filterTrips('active').map(trip => (
                            <TripCard key={trip._id} trip={trip} onEdit={handleEdit} />
                        ))}
                    </div>
                ) : (
                    <Empty
                        description="No active trip requests"
                        className={styles.empty}
                    />
                )
            )
        },
        {
            key: 'matched',
            label: `Matched (${filterTrips('matched').length})`,
            children: (
                loading ? (
                    <div className={styles.loadingContainer}>
                        <Spin size="large" />
                    </div>
                ) : filterTrips('matched').length > 0 ? (
                    <div className={styles.tripsContainer}>
                        {filterTrips('matched').map(trip => (
                            <TripCard key={trip._id} trip={trip} />
                        ))}
                    </div>
                ) : (
                    <Empty
                        description="No matched trips"
                        className={styles.empty}
                    />
                )
            )
        },
        {
            key: 'completed',
            label: `Completed (${filterTrips('completed').length})`,
            children: (
                loading ? (
                    <div className={styles.loadingContainer}>
                        <Spin size="large" />
                    </div>
                ) : filterTrips('completed').length > 0 ? (
                    <div className={styles.tripsContainer}>
                        {filterTrips('completed').map(trip => (
                            <TripCard key={trip._id} trip={trip} />
                        ))}
                    </div>
                ) : (
                    <Empty
                        description="No completed trips"
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
                            <h1 className={styles.pageTitle}>My Trip Requests</h1>
                        </div>
                        <div className={styles.headerRight}>
                            <Button
                                type="primary"
                                icon={<Plus size={16} />}
                                onClick={() => setRequestModalVisible(true)}
                                className={styles.createButton}
                            >
                                Request New Trip
                            </Button>
                        </div>
                    </div>

                    <div className={styles.tabsContainer}>
                        <Tabs
                            activeKey={activeTab}
                            onChange={setActiveTab}
                            items={tabItems}
                            className={styles.tabs}
                        />
                    </div>

                    {trips.length === 0 && !loading && (
                        <div className={styles.emptyStateContainer}>
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <div className={styles.emptyStateText}>
                                        <h3>No Trip Requests Yet</h3>
                                        <p>Start by requesting your first trip</p>
                                    </div>
                                }
                            >
                                <Button
                                    type="primary"
                                    onClick={() => setRequestModalVisible(true)}
                                    icon={<Plus size={16} />}
                                >
                                    Request First Trip
                                </Button>
                            </Empty>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Edit Trip Modal */}
            {selectedTrip && (
                <EditTripModal
                    trip={selectedTrip}
                    visible={editModalVisible}
                    onCancel={() => setEditModalVisible(false)}
                    onSuccess={handleEditSuccess}
                />
            )}

            {/* Request Trip Modal */}
            <RequestTripModal
                visible={requestModalVisible}
                onCancel={() => setRequestModalVisible(false)}
                onSuccess={handleRequestSuccess}
            />
        </>
    );
};

export default MyTrips;