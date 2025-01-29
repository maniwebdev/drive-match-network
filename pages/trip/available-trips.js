// pages/trip/available-trips.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/Auth/AuthContext';
import { useTrip } from '../../context/Ride/TripContext';
import {
    Form,
    DatePicker,
    Select,
    Button,
    Empty,
    Spin,
    message,
    Input,
    Switch
} from 'antd';
import {
    Search,
    Calendar,
    Users,
    Package,
    MapPin,
    Filter,
    Car,
    Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import Navbar from '../../components/Navigation/Navbar';
import LocationInput from '../../components/Rides/LocationInput';
import styles from '../../styles/Trips/availableTrips.module.css';
import LoadingAnimation from '../../components/LoadingAnimation';

const { Option } = Select;
const { RangePicker } = DatePicker;

// Time display component
const TimeDisplay = ({ trip }) => {
    const now = moment();
    const tripDateTime = moment(trip.departureDate)
        .set({
            hour: parseInt(trip.departureTime.split(':')[0]),
            minute: parseInt(trip.departureTime.split(':')[1])
        });

    const minutesUntilDeparture = tripDateTime.diff(now, 'minutes');
    const isDeparted = minutesUntilDeparture <= 0;
    const isUrgent = minutesUntilDeparture <= 30 && minutesUntilDeparture > 0;

    if (isDeparted) {
        return <span className={styles.departedBadge}>Departed</span>;
    }

    if (isUrgent) {
        return (
            <div className={styles.urgentTimeContainer}>
                <span className={styles.urgentBadge}>
                    <Clock size={14} className={styles.clockIcon} />
                    Leaving in {minutesUntilDeparture} minutes
                </span>
            </div>
        );
    }

    return (
        <span className={styles.normalTime}>
            {tripDateTime.format('ddd, MMM D')} at {trip.departureTime}
        </span>
    );
};
const AvailableTrips = () => {
    const router = useRouter();
    const { currentUser } = useAuth();
    const { getAvailableTrips, loading } = useTrip();
    const [form] = Form.useForm();

    // States
    const [userLocation, setUserLocation] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [tripRequests, setTripRequests] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [isSearched, setIsSearched] = useState(false);

    // Search parameters
    const [searchParams, setSearchParams] = useState({
        origin: { city: '', coordinates: [] },
        destination: { city: '', coordinates: [] },
        date: null,
        luggageSize: null,
        seats: null,
        urgent: false
    });

    // Initial data fetch effect
    useEffect(() => {
        if (!currentUser?.isDriver || !currentUser?.driverVerification?.isVerified) {
           // message.error('Only verified drivers can access this page');
            return;
        }

        const fetchInitialTrips = async () => {
            if (!navigator.geolocation) {
                message.info('Geolocation is not supported by your browser');
                return;
            }

            setLoadingLocation(true);
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });

                const location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setUserLocation(location);

                const result = await getAvailableTrips({
                    lat: location.lat,
                    lng: location.lng
                });

                if (result.success) {
                    setTripRequests(result.trips);
                    setIsSearched(true);
                }
            } catch (error) {
                console.error('Error getting location:', error);
                message.error('Unable to get your location');
            } finally {
                setLoadingLocation(false);
            }
        };

        if (currentUser?.isDriver) {
            fetchInitialTrips();
        }
    }, [currentUser?.isDriver]);
    // Handler functions
    const handleLocationChange = (field, value) => {
        setSearchParams(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSearch = async () => {
        try {
            const now = moment();
            const searchData = {
                originCity: searchParams.origin.city,
                destinationCity: searchParams.destination.city,
                seats: searchParams.seats,
                luggageSize: searchParams.luggageSize,
                urgent: searchParams.urgent,
                urgentTime: now.toISOString() // Send current time in ISO format
            };

            // If not urgent and date is selected, format it properly
            if (!searchParams.urgent && searchParams.date) {
                searchData.date = moment(searchParams.date).format('YYYY-MM-DD');
            }

            if (userLocation) {
                searchData.lat = userLocation.lat;
                searchData.lng = userLocation.lng;
            }

            const result = await getAvailableTrips(searchData);

            if (result.success) {
                const processedTrips = result.trips.map(trip => {
                    const tripDateTime = moment(trip.departureDate)
                        .set({
                            hour: parseInt(trip.departureTime.split(':')[0]),
                            minute: parseInt(trip.departureTime.split(':')[1])
                        });

                    const minutesUntilDeparture = tripDateTime.diff(now, 'minutes');

                    return {
                        ...trip,
                        minutesUntilDeparture,
                        isUrgent: minutesUntilDeparture <= 30 && minutesUntilDeparture > 0
                    };
                }).filter(trip => trip.minutesUntilDeparture > 0);

                setTripRequests(processedTrips);
                setIsSearched(true);
            } else {
                message.error(result.error || 'Failed to search trip requests');
            }
        } catch (error) {
            console.error('Search error:', error);
            message.error('An error occurred while searching trip requests');
        }
    };

    const handleTripSelect = (tripId) => {
        router.push(`/trip/details/${tripId}`);
    };

    // Render Methods
    const renderSearchForm = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.searchFormContainer}
        >
            <Form form={form} layout="vertical" className={styles.searchForm}>
                <div className={styles.mainSearchFields}>
                    <Form.Item label="From City" className={styles.locationField}>
                        <LocationInput
                            value={searchParams.origin}
                            onChange={(value) => handleLocationChange('origin', value)}
                            placeholder="Enter origin city"
                        />
                    </Form.Item>

                    <Form.Item label="To City" className={styles.locationField}>
                        <LocationInput
                            value={searchParams.destination}
                            onChange={(value) => handleLocationChange('destination', value)}
                            placeholder="Enter destination city"
                        />
                    </Form.Item>

                    <Form.Item label="Date" className={styles.dateField}>
                        <DatePicker
                            value={searchParams.date}
                            onChange={(date) => setSearchParams(prev => ({
                                ...prev,
                                date: date
                            }))}
                            disabled={searchParams.urgent}
                            disabledDate={(current) => current && current < moment().startOf('day')}
                            format="YYYY-MM-DD"
                            className={styles.datePicker}
                            showNow
                            allowClear
                        />
                    </Form.Item>

                    <Button
                        type="primary"
                        icon={<Search />}
                        onClick={handleSearch}
                        loading={loading}
                        className={styles.searchButton}
                    >
                        Search
                    </Button>
                </div>
                <div className={styles.filtersSection}>
                    <Button
                        type="text"
                        icon={<Filter />}
                        onClick={() => setShowFilters(!showFilters)}
                        className={styles.filterToggle}
                    >
                        {showFilters ? 'Hide Filters' : 'Show Filters'}
                    </Button>

                    {showFilters && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className={styles.filtersContainer}
                        >
                            <Form.Item
                                label="Within 30 minutes"
                                className={styles.filterField}
                            >
                                <Switch
                                    checked={searchParams.urgent}
                                    onChange={(checked) => {
                                        setSearchParams(prev => ({
                                            ...prev,
                                            urgent: checked,
                                            date: checked ? null : prev.date
                                        }));
                                        // Trigger search immediately when urgent is toggled on
                                        if (checked) {
                                            setTimeout(() => handleSearch(), 0);
                                        }
                                    }}
                                />
                            </Form.Item>
                            <Form.Item
                                label="Max Seats"
                                className={styles.filterField}
                            >
                                <Input
                                    type="number"
                                    min="1"
                                    max="8"
                                    value={searchParams.seats}
                                    onChange={(e) => setSearchParams(prev => ({
                                        ...prev,
                                        seats: Number(e.target.value)
                                    }))}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Luggage Size"
                                className={styles.filterField}
                            >
                                <Select
                                    value={searchParams.luggageSize}
                                    onChange={(value) => setSearchParams(prev => ({
                                        ...prev,
                                        luggageSize: value
                                    }))}
                                    allowClear
                                    placeholder="Select luggage size"
                                >
                                    <Option value="small">Small</Option>
                                    <Option value="medium">Medium</Option>
                                    <Option value="large">Large</Option>
                                </Select>
                            </Form.Item>
                        </motion.div>
                    )}
                </div>
            </Form>
        </motion.div>
    );

    // Trip Card Component
    const TripCard = ({ trip }) => {
        const recurrenceText = formatRecurrence(trip.recurrence);

        return (
            <motion.div
                key={trip._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className={`${styles.tripCard} ${trip.isUrgent ? styles.urgentTrip : ''}`}
                onClick={() => handleTripSelect(trip._id)}
            >
                <div className={styles.tripHeader}>
                    <div className={styles.requesterInfo}>
                        <div className={styles.requesterAvatar}>
                            {trip.requester.profilePicture ? (
                                <img
                                    src={trip.requester.profilePicture.url}
                                    alt={trip.requester.fullName}
                                    className={styles.avatarImage}
                                />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {trip.requester.fullName[0]}
                                </div>
                            )}
                        </div>
                        <div className={styles.requesterDetails}>
                            <h3>{trip.requester.fullName}</h3>
                            <div className={styles.rating}>
                                ⭐ {trip.requester.rating?.toFixed(1) || 'New'}
                            </div>
                        </div>
                    </div>
                    {trip.isUrgent && (
                        <div className={styles.urgentBadge}>
                            Urgent Request
                        </div>
                    )}
                </div>

                <div className={styles.tripDetails}>
                    <div className={styles.locations}>
                        <div className={styles.locationItem}>
                            <MapPin className={styles.locationIcon} />
                            <div className={styles.locationText}>
                                <span className={styles.locationName}>
                                    {trip.origin.city}
                                </span>
                                <span className={styles.locationAddress}>
                                    {trip.origin.address}
                                </span>
                            </div>
                        </div>
                        <div className={styles.locationDivider}>→</div>
                        <div className={styles.locationItem}>
                            <MapPin className={styles.locationIcon} />
                            <div className={styles.locationText}>
                                <span className={styles.locationName}>
                                    {trip.destination.city}
                                </span>
                                <span className={styles.locationAddress}>
                                    {trip.destination.address}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className={styles.tripMeta}>
                        <div className={`${styles.metaItem} ${trip.isUrgent ? styles.urgentTime : ''}`}>
                            <Calendar size={16} />
                            <TimeDisplay trip={trip} />
                        </div>
                        <div className={styles.metaItem}>
                            <Users size={16} />
                            <span>{trip.numberOfSeats} seats</span>
                        </div>
                        <div className={styles.metaItem}>
                            <Package size={16} />
                            <span>{trip.luggageSize}</span>
                        </div>
                    </div>
                    {recurrenceText && (
                        <div className={styles.recurrence}>
                            <span className={styles.recurrenceBadge}>
                                {recurrenceText}
                            </span>
                        </div>
                    )}

                    {trip.additionalNotes && (
                        <div className={styles.notes}>
                            <p>{trip.additionalNotes}</p>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    const formatRecurrence = (recurrence) => {
        if (!recurrence || recurrence.pattern === 'none') return null;

        const patterns = {
            daily: 'Daily',
            weekly: 'Weekly',
            weekdays: 'Weekdays',
            custom: `Custom (${recurrence.customDays?.join(', ')})`
        };

        let text = patterns[recurrence.pattern] || '';
        if (recurrence.endDate) {
            text += ` until ${moment(recurrence.endDate).format('MMM D, YYYY')}`;
        }
        return text;
    };

    const renderSearchResults = () => {
        if (loadingLocation) {
            return (
                <div className={styles.loadingState}>
                    <LoadingAnimation />
                    <p>Finding trips near you...</p>
                </div>
            );
        }

        if (!isSearched) {
            return (
                <div className={styles.initialState}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={styles.initialStateContent}
                    >
                        <Car className={styles.initialStateIcon} />
                        <h2>Find Trip Requests</h2>
                        <p>Search for passengers looking for rides in your area</p>
                    </motion.div>
                </div>
            );
        }

        if (loading) {
            return (
                <div className={styles.loadingState}>
                    <Spin size="large" />
                    <p>Searching for trip requests...</p>
                </div>
            );
        }

        if (tripRequests.length === 0) {
            return (
                <div className={styles.noResults}>
                    <Empty
                        description={
                            <div className={styles.noResultsContent}>
                                <h3>No trip requests found</h3>
                                <p>Try adjusting your search criteria or check back later</p>
                            </div>
                        }
                    />
                </div>
            );
        }

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={styles.searchResults}
            >
                <h2 className={styles.resultsTitle}>
                    Available Trips ({tripRequests.length})
                </h2>
                <div className={styles.resultsList}>
                    {tripRequests.map((trip) => (
                        <TripCard key={trip._id} trip={trip} />
                    ))}
                </div>
            </motion.div>
        );
    };

    return (
        <>
            <Navbar />
            <div className={styles.pageContainer}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.contentWrapper}
                >
                    {!currentUser?.isDriver || !currentUser?.driverVerification?.isVerified ? (
                        <div className={styles.driverVerificationRequired}>
                            <Car className={styles.verificationIcon} />
                            <h2>Driver Verification Required</h2>
                            <p>Complete your driver profile to view trip requests</p>
                            <Button
                                type="primary"
                                onClick={() => router.push('/user/profile')}
                                className={styles.verificationButton}
                            >
                                Complete Verification
                            </Button>
                        </div>
                    ) : (
                        <>
                            {renderSearchForm()}
                            {renderSearchResults()}
                        </>
                    )}
                </motion.div>
            </div>
        </>
    );
};

export default AvailableTrips;