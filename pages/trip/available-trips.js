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
    message
} from 'antd';
import {
    Search,
    Calendar,
    Users,
    Package,
    MapPin,
    Filter,
    Car
} from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import Navbar from '../../components/Navigation/Navbar';
import LocationInput from '../../components/Rides/LocationInput';
import styles from '../../styles/Trips/availableTrips.module.css';
import LoadingAnimation from '../../components/LoadingAnimation';

const { Option } = Select;

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
        origin: {
            city: '',
            coordinates: []
        },
        destination: {
            city: '',
            coordinates: []
        },
        departureDate: null,
        luggageSize: null
    });
    // Check if user is a verified driver
    useEffect(() => {
        if (!currentUser?.isDriver || !currentUser?.driverVerification?.isVerified) {
            message.error('Only verified drivers can access this page');
            //   router.push('/user/profile');
        }
    }, [currentUser, router]);

    // Get user location and nearby trip requests
    useEffect(() => {
        const getUserLocation = async () => {
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

                // Search for nearby trips
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

        getUserLocation();
    }, []);

    // Handler functions
    const handleLocationChange = (field, value) => {
        setSearchParams(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSearch = async () => {
        if (!searchParams.origin.city && !searchParams.destination.city && !searchParams.departureDate) {
            message.warning('Please enter at least one search criteria');
            return;
        }

        try {
            const searchData = {
                originCity: searchParams.origin.city,
                destinationCity: searchParams.destination.city,
                departureDate: searchParams.departureDate?.format('YYYY-MM-DD'),
                luggageSize: searchParams.luggageSize,
                ...(userLocation && {
                    lat: userLocation.lat,
                    lng: userLocation.lng
                })
            };

            const result = await getAvailableTrips(searchData);

            if (result.success) {
                setTripRequests(result.trips);
                setIsSearched(true);
            } else {
                message.error(result.message || 'Failed to search trip requests');
            }
        } catch (error) {
            console.error('Search error:', error);
            message.error('An error occurred while searching trip requests');
        }
    };

    const handleTripSelect = (tripId) => {
        router.push(`/trip/details/${tripId}`);
    };
    {/*
     const renderSearchForm = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.searchFormContainer}
        >
            <Form
                form={form}
                layout="vertical"
                className={styles.searchForm}
            >
                <div className={styles.mainSearchFields}>
                    <Form.Item
                        label="City From"
                        className={styles.locationField}
                    >
                        <LocationInput
                            value={searchParams.origin}
                            onChange={(value) => handleLocationChange('origin', value)}
                            placeholder="Enter origin city"
                        />
                    </Form.Item>

                    <Form.Item
                        label="City To"
                        className={styles.locationField}
                    >
                        <LocationInput
                            value={searchParams.destination}
                            onChange={(value) => handleLocationChange('destination', value)}
                            placeholder="Enter destination city"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Date"
                        className={styles.dateField}
                    >
                        <DatePicker
                            value={searchParams.departureDate}
                            onChange={(date) => setSearchParams(prev => ({ ...prev, departureDate: date }))}
                            disabledDate={(current) => current && current < moment().startOf('day')}
                            format="YYYY-MM-DD"
                            className={styles.datePicker}
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
                                label="Luggage Size"
                                className={styles.filterField}
                            >
                                <Select
                                    value={searchParams.luggageSize}
                                    onChange={(value) => setSearchParams(prev => ({
                                        ...prev,
                                        luggageSize: value
                                    }))}
                                    className={styles.select}
                                    allowClear
                                >
                                    <Option value="small">Small (Backpack)</Option>
                                    <Option value="medium">Medium (Carry-on)</Option>
                                    <Option value="large">Large (Suitcase)</Option>
                                </Select>
                            </Form.Item>
                        </motion.div>
                    )}
                </div>
            </Form>
        </motion.div>
    );    
        */}
    const renderSearchResults = () => {
        if (loadingLocation) {
            return (
                <div className={styles.loadingState}>
                    <LoadingAnimation />
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
                    Available Trip Requests ({tripRequests.length})
                </h2>
                <div className={styles.resultsList}>
                    {tripRequests.map((trip) => (
                        <motion.div
                            key={trip._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className={styles.tripCard}
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
                                        <h3 className={styles.requesterName}>
                                            {trip.requester.fullName}
                                        </h3>
                                        <div className={styles.rating}>
                                            ⭐ {trip.requester.rating?.toFixed(1)}
                                        </div>
                                    </div>
                                </div>
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

                                <div className={styles.tripInfo}>
                                    <div className={styles.infoItem}>
                                        <Calendar className={styles.infoIcon} />
                                        <span>
                                            {moment(trip.departureDate).format('ddd, MMM D, YYYY')} at {trip.departureTime}
                                        </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <Users className={styles.infoIcon} />
                                        <span>
                                            {trip.numberOfSeats} seats needed
                                        </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <Package className={styles.infoIcon} />
                                        <span>
                                            Luggage: {trip.luggageSize}
                                        </span>
                                    </div>
                                </div>

                                {trip.additionalNotes && (
                                    <div className={styles.notes}>
                                        <p>{trip.additionalNotes}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
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
                            <p>You need to be a verified driver to view trip requests.</p>
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
                            {/*  {renderSearchForm()}*/}
                            {renderSearchResults()}
                        </>
                    )}
                </motion.div>
            </div>
        </>
    );
};

export default AvailableTrips;