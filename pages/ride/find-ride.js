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
    Input,
    Switch,
    Tooltip,
    Slider
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
    ClipboardList,
    Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import Navbar from '../../components/Navigation/Navbar';
import styles from '../../styles/Rides/findRide.module.css';
import Image from 'next/image';

const { Option } = Select;

const FindRide = () => {
    const router = useRouter();
    const { currentUser } = useAuth();
    const { searchRideOffers, loading } = useRide();
    const { getMyTrips } = useTrip();
    const [form] = Form.useForm();

    // State management
    const [searchResults, setSearchResults] = useState([]);
    const [isSearched, setIsSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [myTripRequests, setMyTripRequests] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);
    const [isTimeRangeEnabled, setIsTimeRangeEnabled] = useState(true);

    // Time slider state
    const [timeSliderValues, setTimeSliderValues] = useState([8 * 4, 18 * 4]); // 8:00 AM to 6:00 PM by default

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
        startTime: null,
        endTime: null,
        seats: 1,
        maxPrice: null,
        luggageSize: ''
    });

    // Convert slider value to time format (HH:MM)
    const sliderValueToTime = (value) => {
        const hours = Math.floor(value / 4);
        const minutes = (value % 4) * 15;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    // Convert time string to slider value
    const timeToSliderValue = (timeString) => {
        if (!timeString) return null;
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 4 + Math.round(minutes / 15);
    };

    // Generate marks for the time slider
    const generateTimeMarks = () => {
        const marks = {};
        for (let hour = 0; hour <= 24; hour += 6) {
            marks[hour * 4] = `${hour}:00`;
        }
        return marks;
    };

    // Handle time slider change
    const handleTimeSliderChange = (values) => {
        setTimeSliderValues(values);

        const startTime = sliderValueToTime(values[0]);
        const endTime = sliderValueToTime(values[1]);

        setSearchParams(prev => ({
            ...prev,
            startTime,
            endTime
        }));
    };

    // Time options generator (15-minute intervals)
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
                try {
                    const result = await getMyTrips();
                    if (result.success) {
                        // Filter only active trip requests
                        const activeTrips = result.trips.filter(trip => trip.status === 'active');
                        setMyTripRequests(activeTrips);
                    } else {
                        message.error('Failed to fetch your trip requests');
                    }
                } catch (error) {
                    console.error('Fetch trips error:', error);
                    message.error('Error loading trip requests');
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
            const departureDateTime = moment(selectedTrip.departureDate);
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
                departureDate: departureDateTime,
                departureTime: selectedTrip.departureTime,
                seats: selectedTrip.numberOfSeats,
                luggageSize: selectedTrip.luggageSize
            });

            // If trip has flexible timing, set as time range
            if (selectedTrip.flexibleTiming && selectedTrip.timeRange) {
                setIsTimeRangeEnabled(true);
                const startSliderValue = timeToSliderValue(selectedTrip.timeRange.earliest);
                const endSliderValue = timeToSliderValue(selectedTrip.timeRange.latest);

                if (startSliderValue !== null && endSliderValue !== null) {
                    setTimeSliderValues([startSliderValue, endSliderValue]);
                }

                setSearchParams(prev => ({
                    ...prev,
                    startTime: selectedTrip.timeRange.earliest,
                    endTime: selectedTrip.timeRange.latest,
                    departureTime: null
                }));
            } else {
                // Otherwise use exact time
                setIsTimeRangeEnabled(false);
                setSearchParams(prev => ({
                    ...prev,
                    departureTime: selectedTrip.departureTime,
                    startTime: null,
                    endTime: null
                }));
            }
        }
    };

    // Handle time range toggle
    const handleTimeRangeToggle = (enabled) => {
        setIsTimeRangeEnabled(enabled);
        if (!enabled) {
            // Reset time range values when disabling
            setSearchParams(prev => ({
                ...prev,
                startTime: null,
                endTime: null
            }));
        } else {
            // Reset exact time when enabling time range
            setSearchParams(prev => ({
                ...prev,
                departureTime: null
            }));

            // Set default slider values
            handleTimeSliderChange([8 * 4, 18 * 4]);
        }
    };

    // Handle search with proper date formatting
    const handleSearch = async () => {
        // Validate required fields
        if (!searchParams.origin.city) {
            message.error('Please fill in the pickup location');
            return;
        }

        try {
            // Build search filters object with PROPERLY FORMATTED date
            const searchFilters = {
                originCity: searchParams.origin.city,
                originZipCode: searchParams.origin.zipCode,
                destinationCity: searchParams.destination.city,
                destinationZipCode: searchParams.destination.zipCode,
                // Format date as YYYY-MM-DD for consistent comparison
                departureDate: searchParams.departureDate ? searchParams.departureDate.format('YYYY-MM-DD') : null,
                seats: searchParams.seats,
                maxPrice: searchParams.maxPrice,
                allowedLuggage: searchParams.luggageSize
            };

            // Add time-related filters based on mode selection
            if (isTimeRangeEnabled && searchParams.startTime && searchParams.endTime) {
                searchFilters.startTime = searchParams.startTime;
                searchFilters.endTime = searchParams.endTime;

                // Show time range in search criteria message
                const timeRangeMessage = `Searching rides between ${searchParams.startTime} and ${searchParams.endTime}`;
                message.info(timeRangeMessage);
            } else if (searchParams.departureTime) {
                searchFilters.departureTime = searchParams.departureTime;
            }

            const result = await searchRideOffers(searchFilters);

            if (result.success) {
                setSearchResults(result.rideOffers);
                setIsSearched(true);

                // Show result count feedback
                if (result.rideOffers.length === 0) {
                    message.info('No rides found matching your criteria. Try adjusting your filters.');
                } else {
                    message.success(`Found ${result.rideOffers.length} rides matching your criteria.`);
                }
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
        // Reset all search parameters
        setSearchParams({
            origin: { address: '', city: '', zipCode: '' },
            destination: { address: '', city: '', zipCode: '' },
            departureDate: null,
            departureTime: null,
            startTime: null,
            endTime: null,
            seats: 1,
            maxPrice: null,
            luggageSize: ''
        });

        // Reset selection and mode states
        setSelectedTrip(null);
        setIsTimeRangeEnabled(true);
        setTimeSliderValues([8 * 4, 18 * 4]); // Reset to default time range

        // Reset form fields
        form.resetFields();

        // Provide feedback
        message.success('All filters have been cleared');
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
                {myTripRequests.length > 0 && (
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
                )}

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
                                    address: e.target.value
                                }
                            }))}
                            prefix={<MapPin size={16} className={styles.inputIcon} />}
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
                                    address: e.target.value
                                }
                            }))}
                            prefix={<MapPin size={16} className={styles.inputIcon} />}
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

                    {/* Time Preference Toggle and Time Selection */}
                    <Form.Item
                        label={
                            <div className={styles.timeLabel}>
                                <span>Time</span>
                                <div className={styles.timeToggleWrapper}>
                                    <span className={styles.timeToggleLabel}>
                                        {isTimeRangeEnabled ? 'Time Range' : 'Exact Time'}
                                    </span>
                                    <Switch
                                        size="small"
                                        checked={isTimeRangeEnabled}
                                        onChange={handleTimeRangeToggle}
                                        className={styles.timeToggleSwitch}
                                    />
                                    <Tooltip title="Switch between exact time or a time range">
                                        <Info size={14} className={styles.infoIcon} />
                                    </Tooltip>
                                </div>
                            </div>
                        }
                        className={styles.timeField}
                    >
                        {isTimeRangeEnabled ? (
                            <div className={styles.timeSliderContainer}>
                                <div className={styles.timeSliderValues}>
                                    <span>{sliderValueToTime(timeSliderValues[0])}</span>
                                    <span>to</span>
                                    <span>{sliderValueToTime(timeSliderValues[1])}</span>
                                </div>
                                <Slider
                                    range
                                    min={0}
                                    max={96} // 24 hours * 4 (15-min intervals)
                                    step={1}
                                    value={timeSliderValues}
                                    onChange={handleTimeSliderChange}
                                    marks={generateTimeMarks()}
                                    tooltip={{
                                        formatter: value => sliderValueToTime(value)
                                    }}
                                    className={styles.timeSlider}
                                />
                            </div>
                        ) : (
                            <Select
                                placeholder="Select time"
                                value={searchParams.departureTime}
                                onChange={(time) => setSearchParams(prev => ({
                                    ...prev,
                                    departureTime: time
                                }))}
                                className={styles.timeSelect}
                                suffixIcon={<Clock size={16} className={styles.clockIcon} />}
                                showSearch
                                optionFilterProp="children"
                                allowClear
                            >
                                {generateTimeOptions().map(time => (
                                    <Option key={time} value={time}>
                                        {time}
                                    </Option>
                                ))}
                            </Select>
                        )}
                    </Form.Item>

                    {/* Search Button */}
                    <Button
                        type="primary"
                        icon={<Search size={18} />}
                        onClick={handleSearch}
                        loading={loading}
                        className={styles.searchButton}
                    >
                        Search Rides
                    </Button>
                </div>

                {/* Filters Section */}
                <div className={styles.filtersSection}>
                    <Button
                        type="text"
                        icon={<Filter size={16} />}
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
                            <div className={styles.filterGrid}>
                                {/* Date Picker */}
                                <Form.Item label="Travel Date" className={styles.filterField}>
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
                                        suffixIcon={<Calendar size={16} className={styles.calendarIcon} />}
                                    />
                                </Form.Item>

                                {/* Seats Filter */}
                                <Form.Item label="Seats Needed" className={styles.filterField}>
                                    <InputNumber
                                        min={1}
                                        max={8}
                                        value={searchParams.seats}
                                        onChange={(value) => setSearchParams(prev => ({
                                            ...prev,
                                            seats: value
                                        }))}
                                        className={styles.seatsInput}
                                        prefix={<Users size={16} className={styles.inputIcon} />}
                                    />
                                </Form.Item>

                                {/* Price Filter */}
                                <Form.Item label="Maximum Price" className={styles.filterField}>
                                    <InputNumber
                                        prefix={<DollarSign size={16} className={styles.inputIcon} />}
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
                                        className={styles.luggageSelect}
                                        placeholder="Select size"
                                        allowClear
                                        suffixIcon={<Package size={16} className={styles.inputIcon} />}
                                    >
                                        <Option value="small">Small (Backpack)</Option>
                                        <Option value="medium">Medium (Carry-on)</Option>
                                        <Option value="large">Large (Suitcase)</Option>
                                    </Select>
                                </Form.Item>
                            </div>

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
                                            <Image
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
                                    <div className={styles.locationDivider}>
                                        <ArrowRight className={styles.arrowIcon} />
                                    </div>
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
                                </div>

                                <div className={styles.ridePrefs}>
                                    <div className={styles.prefItem}>
                                        {ride.smoking ? '🚬 Smoking allowed' : '🚭 No smoking'}
                                    </div>
                                    <div className={styles.prefItem}>
                                        {ride.pets ? '🐾 Pets allowed' : '⛔ No pets'}
                                    </div>
                                </div>

                                {selectedTrip && (
                                    <Button
                                        type="primary"
                                        className={styles.viewButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/ride/details/${ride._id}`)
                                        }}
                                    >
                                        View Details
                                    </Button>
                                )}
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