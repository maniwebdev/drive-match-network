// pages/ride/find-ride.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRide } from '../../context/Ride/RideContext';
import { useTrip } from '../../context/Ride/TripContext';
import {
    Form,
    DatePicker,
    InputNumber,
    Select,
    Button,
    Empty,
    Spin,
    message,
    Input
} from 'antd';
import {
    Search,
    Calendar,
    Users,
    DollarSign,
    Package,
    MapPin,
    ArrowRight,
    Filter,
    Clock,
    X,
    ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import Navbar from '../../components/Navigation/Navbar';
import LocationInput from '../../components/Rides/LocationInput';
import styles from '../../styles/Rides/findRide.module.css';
import LoadingAnimation from '../../components/LoadingAnimation';

const { Option } = Select;

const FindRide = () => {
    const router = useRouter();
    const { currentUser } = useAuth();
    const { searchRideOffers, loading } = useRide();
    const { getMyTrips } = useTrip();
    const [form] = Form.useForm();

    const [searchResults, setSearchResults] = useState([]);
    const [isSearched, setIsSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [myTripRequests, setMyTripRequests] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);

    const [searchParams, setSearchParams] = useState({
        origin: {
            address: '',
            city: '',
            zipCode: ''
        },
        destination: {
            address: '',
            city: '',
            zipCode: ''
        },
        departureDate: null,
        departureTime: null,
        seats: 1,
        maxPrice: null,
        luggageSize: ''
    });
    // Generate time options in 15-minute intervals
    const generateTimeOptions = () => {
        const times = [];
        for (let hour = 0; hour < 24; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const formattedHour = hour.toString().padStart(2, '0');
                const formattedMinute = minute.toString().padStart(2, '0');
                times.push(`${formattedHour}:${formattedMinute}`);
            }
        }
        return times;
    };

    // Fetch user's trip requests on component mount
    useEffect(() => {
        const fetchTripRequests = async () => {
            if (currentUser) {
                const result = await getMyTrips();
                if (result.success) {
                    // Filter only active trip requests
                    const activeTrips = result.trips.filter(trip => trip.status === 'active');
                    setMyTripRequests(activeTrips);
                }
            }
        };
        fetchTripRequests();
    }, [currentUser]);

    // Handle trip selection from dropdown
    const handleTripSelect = (tripId) => {
        const selectedTrip = myTripRequests.find(trip => trip._id === tripId);
        if (selectedTrip) {
            setSelectedTrip(selectedTrip);
            setSearchParams({
                ...searchParams,
                origin: {
                    address: selectedTrip.origin.address,
                    city: selectedTrip.origin.city,
                    zipCode: selectedTrip.origin.zipCode
                },
                destination: {
                    address: selectedTrip.destination.address,
                    city: selectedTrip.destination.city,
                    zipCode: selectedTrip.destination.zipCode
                },
                departureDate: moment(selectedTrip.departureDate),
                departureTime: selectedTrip.departureTime,
                seats: selectedTrip.numberOfSeats,
                luggageSize: selectedTrip.luggageSize
            });
        }
    };

    // Handle search
    const handleSearch = async () => {
        if (!searchParams.origin.city) {
            message.error('Please fill in the pickup location');
            return;
        }

        try {
            const result = await searchRideOffers({
                origin: searchParams.origin,
                destination: searchParams.destination,
                departureDate: searchParams.departureDate?.format('YYYY-MM-DD'),
                departureTime: searchParams.departureTime,
                seats: searchParams.seats,
                maxPrice: searchParams.maxPrice,
                allowedLuggage: searchParams.luggageSize
            });

            if (result.success) {
                setSearchResults(result.rideOffers);
                setIsSearched(true);
            } else {
                message.error(result.message || 'Failed to search rides');
            }
        } catch (error) {
            console.error('Search error:', error);
            message.error('An error occurred while searching rides');
        }
    };

    // Handle clear filters
    const handleClearFilters = () => {
        setSearchParams({
            origin: { address: '', city: '', zipCode: '' },
            destination: { address: '', city: '', zipCode: '' },
            departureDate: null,
            departureTime: null,
            seats: 1,
            maxPrice: null,
            luggageSize: ''
        });
        setSelectedTrip(null);
        form.resetFields();
    };
    // Render search form
    const renderSearchForm = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.searchFormContainer}
        >
            <Form form={form} layout="vertical" className={styles.searchForm}>
                {/* Trip Request Dropdown */}
                <div className={styles.tripRequestSection}>
                    <Form.Item label="My Trip Requests" className={styles.tripRequestField}>
                        <Select
                            placeholder="Select from your trip requests"
                            value={selectedTrip?._id}
                            onChange={handleTripSelect}
                            allowClear
                            className={styles.tripSelect}
                        >
                            {myTripRequests.map(trip => (
                                <Option key={trip._id} value={trip._id}>
                                    <div className={styles.tripOption}>
                                        <ClipboardList size={16} className={styles.tripIcon} />
                                        <span>
                                            {trip.origin.city} → {trip.destination.city}
                                        </span>
                                        <span className={styles.tripDate}>
                                            {moment(trip.departureDate).format('MMM D')} at {trip.departureTime}
                                        </span>
                                    </div>
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </div>

                <div className={styles.mainSearchFields}>
                    {/* Origin Location */}
                    <Form.Item label="From" required className={styles.locationField}>
                        <Input
                            placeholder="Enter city or address"
                            value={searchParams.origin.city}
                            onChange={(e) => setSearchParams(prev => ({
                                ...prev,
                                origin: {
                                    ...prev.origin,
                                    city: e.target.value,
                                    address: e.target.value // Using same value for both as they're combined
                                }
                            }))}
                            className={styles.mainInput}
                        />
                        <Input
                            placeholder="Zip Code"
                            value={searchParams.origin.zipCode}
                            onChange={(e) => setSearchParams(prev => ({
                                ...prev,
                                origin: {
                                    ...prev.origin,
                                    zipCode: e.target.value
                                }
                            }))}
                            className={styles.zipInput}
                        />
                    </Form.Item>

                    {/* Destination Location */}
                    <Form.Item label="To" className={styles.locationField}>
                        <Input
                            placeholder="Enter city or address"
                            value={searchParams.destination.city}
                            onChange={(e) => setSearchParams(prev => ({
                                ...prev,
                                destination: {
                                    ...prev.destination,
                                    city: e.target.value,
                                    address: e.target.value // Using same value for both as they're combined
                                }
                            }))}
                            className={styles.mainInput}
                        />
                        <Input
                            placeholder="Zip Code"
                            value={searchParams.destination.zipCode}
                            onChange={(e) => setSearchParams(prev => ({
                                ...prev,
                                destination: {
                                    ...prev.destination,
                                    zipCode: e.target.value
                                }
                            }))}
                            className={styles.zipInput}
                        />
                    </Form.Item>

                    {/* Time Selector */}
                    <Form.Item label="Time" className={styles.timeField}>
                        <Select
                            value={searchParams.departureTime}
                            onChange={(time) => setSearchParams(prev => ({
                                ...prev,
                                departureTime: time
                            }))}
                            className={styles.timeSelect}
                            placeholder="Select time"
                        >
                            {generateTimeOptions().map(time => (
                                <Option key={time} value={time}>
                                    {time}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {/* Date Picker */}
                    <Form.Item label="Date" className={styles.dateField}>
                        <DatePicker
                            value={searchParams.departureDate}
                            onChange={(date) => setSearchParams(prev => ({
                                ...prev,
                                departureDate: date
                            }))}
                            disabledDate={(current) => current && current < moment().startOf('day')}
                            format="YYYY-MM-DD"
                            className={styles.datePicker}
                            placeholder="Select date"
                        />
                    </Form.Item>

                    {/* Search Button */}
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

                {/* Filters Section */}
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
                            exit={{ opacity: 0, height: 0 }}
                            className={styles.filtersContainer}
                        >
                            {/* Seats Filter */}
                            <Form.Item label="Seats" className={styles.filterField}>
                                <InputNumber
                                    min={1}
                                    max={8}
                                    value={searchParams.seats}
                                    onChange={(value) => setSearchParams(prev => ({
                                        ...prev,
                                        seats: value
                                    }))}
                                    className={styles.seatsInput}
                                />
                            </Form.Item>

                            {/* Price Filter */}
                            <Form.Item label="Maximum Price" className={styles.filterField}>
                                <InputNumber
                                    prefix={<DollarSign className={styles.inputIcon} />}
                                    min={0}
                                    value={searchParams.maxPrice}
                                    onChange={(value) => setSearchParams(prev => ({
                                        ...prev,
                                        maxPrice: value
                                    }))}
                                    className={styles.priceInput}
                                />
                            </Form.Item>

                            {/* Luggage Size Filter */}
                            <Form.Item label="Luggage Size" className={styles.filterField}>
                                <Select
                                    value={searchParams.luggageSize}
                                    onChange={(value) => setSearchParams(prev => ({
                                        ...prev,
                                        luggageSize: value
                                    }))}
                                    className={styles.select}
                                >
                                    <Option value="small">Small (Backpack)</Option>
                                    <Option value="medium">Medium (Carry-on)</Option>
                                    <Option value="large">Large (Suitcase)</Option>
                                </Select>
                            </Form.Item>

                            {/* Clear Filters Button */}
                            <div className={styles.clearFilters}>
                                <Button
                                    type="default"
                                    icon={<X size={16} />}
                                    onClick={handleClearFilters}
                                    className={styles.clearFiltersButton}
                                >
                                    Clear All Filters
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </Form>
        </motion.div>
    );

    // Render search results
    const renderSearchResults = () => {
        if (loading) {
            return (
                <div className={styles.loadingState}>
                    <Spin size="large" />
                    <p>Searching for rides...</p>
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
                        <Search className={styles.initialStateIcon} />
                        <h2>Find Your Perfect Ride</h2>
                        <p>Enter your travel details to search for available rides</p>
                    </motion.div>
                </div>
            );
        }

        if (searchResults.length === 0) {
            return (
                <div className={styles.noResults}>
                    <Empty
                        description={
                            <div className={styles.noResultsContent}>
                                <h3>No rides found</h3>
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
                    Available Rides ({searchResults.length})
                </h2>
                <div className={styles.resultsList}>
                    {searchResults.map((ride) => (
                        <motion.div
                            key={ride._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className={styles.rideCard}
                            onClick={() => router.push(`/ride/details/${ride._id}`)}
                        >
                            <div className={styles.rideHeader}>
                                <div className={styles.driverInfo}>
                                    <div className={styles.driverAvatar}>
                                        {ride.driver.profilePicture ? (
                                            <img
                                                src={ride.driver.profilePicture.url}
                                                alt={ride.driver.fullName}
                                                className={styles.avatarImage}
                                            />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                {ride.driver.fullName[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.driverDetails}>
                                        <h3 className={styles.driverName}>
                                            {ride.driver.fullName}
                                        </h3>
                                        <div className={styles.rating}>
                                            ⭐ {ride.driver.rating?.toFixed(1)}
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.ridePrice}>
                                    <span className={styles.priceAmount}>
                                        ${ride.pricePerSeat}
                                    </span>
                                    <span className={styles.priceLabel}>per seat</span>
                                </div>
                            </div>

                            <div className={styles.rideDetails}>
                                <div className={styles.locations}>
                                    <div className={styles.locationItem}>
                                        <MapPin className={styles.locationIcon} />
                                        <div className={styles.locationText}>
                                            <span className={styles.locationName}>
                                                {ride.origin.city}
                                            </span>
                                            <span className={styles.locationAddress}>
                                                {ride.origin.address}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.locationDivider}>→</div>
                                    <div className={styles.locationItem}>
                                        <MapPin className={styles.locationIcon} />
                                        <div className={styles.locationText}>
                                            <span className={styles.locationName}>
                                                {ride.destination.city}
                                            </span>
                                            <span className={styles.locationAddress}>
                                                {ride.destination.address}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.rideInfo}>
                                    <div className={styles.infoItem}>
                                        <Clock className={styles.infoIcon} />
                                        <span>
                                            {moment(ride.departureDateTime).format('MMM D, YYYY')}{' '}
                                            at {ride.departureTime}
                                        </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <Users className={styles.infoIcon} />
                                        <span>
                                            {ride.availableSeats - ride.bookedSeats}/{ride.availableSeats} seats
                                        </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <Package className={styles.infoIcon} />
                                        <span>
                                            Luggage: {ride.allowedLuggage}
                                        </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        {ride.smoking ? '🚬 Smoking allowed' : '🚭 No smoking'}
                                    </div>
                                    <div className={styles.infoItem}>
                                        {ride.pets ? '🐾 Pets allowed' : '⛔ No pets'}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        );
    };

    // Final component return
    return (
        <>
            <Navbar />
            <div className={styles.pageContainer}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.contentWrapper}
                >
                    {renderSearchForm()}
                    {renderSearchResults()}
                </motion.div>
            </div>
        </>
    );
};

export default FindRide;