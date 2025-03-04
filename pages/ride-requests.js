// pages/ride/public-requests.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../context/Auth/AuthContext';
import { useTrip } from '../context/Ride/TripContext';
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
    Package,
    MapPin,
    ArrowRight,
    Filter,
    Clock,
    X,
    Info,
    AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import Navbar from '../components/Navigation/Navbar';
import styles from '../styles/RideRequests.module.css';
import Header from '../components/Navigation/Header';
import Footer from '../components/Navigation/Footer';
import Image from 'next/image';

const { Option } = Select;

const RideRequests = () => {
    const router = useRouter();
    const { currentUser } = useAuth();
    const { loading, searchPublicRequests } = useTrip();
    const [form] = Form.useForm();

    // State management
    const [searchResults, setSearchResults] = useState([]);
    const [isSearched, setIsSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [isTimeRangeEnabled, setIsTimeRangeEnabled] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

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
        luggageSize: ''
    });

    // Load initial requests when page loads
    useEffect(() => {
        handleInitialSearch();
    }, []);

    const handleInitialSearch = async () => {
        try {
            const initialSearchParams = {}; // Empty search to get recent requests
            const result = await searchPublicRequests(initialSearchParams);

            if (result.success) {
                setSearchResults(result.trips);
                setIsSearched(true);
                setHasMore(result.hasMore);
                setCurrentPage(1);
            }
        } catch (error) {
            console.error('Initial search error:', error);
        }
    };

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
        // Reset pagination
        setCurrentPage(1);

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
                luggageSize: searchParams.luggageSize
            };

            // Add time-related filters based on mode selection
            if (isTimeRangeEnabled && searchParams.startTime && searchParams.endTime) {
                searchFilters.startTime = searchParams.startTime;
                searchFilters.endTime = searchParams.endTime;

                // Show time range in search criteria message
                const timeRangeMessage = `Searching trips between ${searchParams.startTime} and ${searchParams.endTime}`;
                message.info(timeRangeMessage);
            } else if (searchParams.departureTime) {
                searchFilters.departureTime = searchParams.departureTime;
            }

            const result = await searchPublicRequests(searchFilters, 1);

            if (result.success) {
                setSearchResults(result.trips);
                setIsSearched(true);
                setHasMore(result.hasMore);

                // Show result count feedback
                if (result.trips.length === 0) {
                    message.info('No trip requests found matching your criteria. Try adjusting your filters.');
                } else {
                    message.success(`Found ${result.totalCount} trip requests matching your criteria.`);
                }

                // Scroll to results
                document.querySelector('#searchResults')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            } else {
                message.error(result.message || 'Failed to search trip requests');
            }
        } catch (error) {
            console.error('Search error:', error);
            message.error('An error occurred while searching trip requests');
        }
    };

    // Load more results (pagination)
    const handleLoadMore = async () => {
        const nextPage = currentPage + 1;

        try {
            const searchFilters = {
                originCity: searchParams.origin.city,
                originZipCode: searchParams.origin.zipCode,
                destinationCity: searchParams.destination.city,
                destinationZipCode: searchParams.destination.zipCode,
                departureDate: searchParams.departureDate ? searchParams.departureDate.format('YYYY-MM-DD') : null,
                seats: searchParams.seats,
                luggageSize: searchParams.luggageSize
            };

            if (isTimeRangeEnabled && searchParams.startTime && searchParams.endTime) {
                searchFilters.startTime = searchParams.startTime;
                searchFilters.endTime = searchParams.endTime;
            } else if (searchParams.departureTime) {
                searchFilters.departureTime = searchParams.departureTime;
            }

            const result = await searchPublicRequests(searchFilters, nextPage);

            if (result.success) {
                setSearchResults(prev => [...prev, ...result.trips]);
                setHasMore(result.hasMore);
                setCurrentPage(nextPage);
            } else {
                message.error(result.message || 'Failed to load more results');
            }
        } catch (error) {
            console.error('Load more error:', error);
            message.error('Failed to load more results');
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
            luggageSize: ''
        });

        // Reset mode states
        setIsTimeRangeEnabled(false);
        setTimeSliderValues([8 * 4, 18 * 4]); // Reset to default time range

        // Reset form fields
        form.resetFields();

        // Provide feedback
        message.success('All filters have been cleared');
    };

    // Handle request selection
    const handleRequestSelect = (requestId) => {
        if (currentUser) {
            router.push(`/trip/details/${requestId}`);
        } else {
            router.push(`/auth/login?redirect=/trip/details/${requestId}`);
        }
    };

    // Render search form
    const renderSearchForm = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={styles.searchFormContainer}
        >
            <div className={styles.searchHeaderText}>
                <h1 className={styles.searchTitle}>Find Passenger Requests</h1>
                <p className={styles.searchSubtitle}>Connect with passengers looking for rides</p>
            </div>

            <Form form={form} layout="vertical" className={styles.searchForm}>
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

                    {/* Time Selection */}
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
                        Search Trip Requests
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
        if (loading && currentPage === 1) {
            return (
                <div className={styles.loadingState}>
                    <Spin size="large" />
                    <p>Searching for trip requests...</p>
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
                        <h2>Find Public Trip Requests</h2>
                        <p>Enter travel details to find passengers looking for rides</p>
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
                id="searchResults"
            >
                <h2 className={styles.resultsTitle}>
                    Public Trip Requests ({searchResults.length})
                </h2>
                <div className={styles.resultsList}>
                    {searchResults.map((request) => (
                        <motion.div
                            key={request._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className={styles.requestCard}
                            onClick={() => handleRequestSelect(request._id)}
                        >
                            <div className={styles.requestHeader}>
                                <div className={styles.passengerInfo}>
                                    <div className={styles.passengerAvatar}>
                                        {request.requester?.profilePicture ? (
                                            <Image
                                                src={request.requester.profilePicture.url}
                                                alt={request.requester.fullName}
                                                className={styles.avatarImage}
                                            />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                {request.requester?.fullName?.[0] || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.passengerDetails}>
                                        <h3 className={styles.passengerName}>
                                            {request.requester?.fullName || 'Anonymous User'}
                                        </h3>
                                        <div className={styles.rating}>
                                            ⭐ {request.requester?.rating?.toFixed(1) || 'N/A'}
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.seatsNeeded}>
                                    <Users className={styles.infoIcon} />
                                    <span>{request.numberOfSeats} seats needed</span>
                                </div>
                            </div>

                            <div className={styles.requestDetails}>
                                <div className={styles.locations}>
                                    <div className={styles.locationItem}>
                                        <MapPin className={styles.locationIcon} />
                                        <div className={styles.locationText}>
                                            <span className={styles.locationName}>
                                                {request.origin.city}
                                            </span>
                                            <span className={styles.locationAddress}>
                                                {request.origin.address}
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
                                                {request.destination.city}
                                            </span>
                                            <span className={styles.locationAddress}>
                                                {request.destination.address}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.requestInfo}>
                                    <div className={styles.infoItem}>
                                        <Clock className={styles.infoIcon} />
                                        <span>
                                            {moment(request.departureDate).format('MMM D, YYYY')}{' '}
                                            at {request.departureTime}
                                        </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <Package className={styles.infoIcon} />
                                        <span>
                                            Luggage: {request.luggageSize}
                                        </span>
                                    </div>

                                    {request.flexibleTiming && (
                                        <div className={styles.flexibleTiming}>
                                            <Clock className={styles.infoIcon} />
                                            <span>Flexible timing: {request.timeRange?.earliest} - {request.timeRange?.latest}</span>
                                        </div>
                                    )}
                                </div>

                                {request.isUrgent && (
                                    <div className={styles.urgentBadge}>
                                        <AlertCircle className={styles.urgentIcon} />
                                        Urgent Request
                                    </div>
                                )}

                                <Button
                                    type="primary"
                                    className={styles.matchButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRequestSelect(request._id);
                                    }}
                                >
                                    View Details
                                </Button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {hasMore && (
                    <div className={styles.loadMoreContainer}>
                        <Button
                            onClick={handleLoadMore}
                            loading={loading}
                            className={styles.loadMoreButton}
                        >
                            Load More Requests
                        </Button>
                    </div>
                )}
            </motion.div>
        );
    };

    // Render the Driver CTA section
    const renderDriverCTA = () => {
        if (currentUser) return null; // Don't show CTA to logged-in users

        return (
            <section className={styles.ctaSection}>
                <h2>Are You a Driver?</h2>
                <p>Help passengers reach their destinations and earn while driving</p>
                <div className={styles.ctaButtons}>
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => router.push('/auth/signup')}
                        className={styles.signupButton}
                    >
                        Register as Driver
                    </Button>
                    <Button
                        size="large"
                        onClick={() => router.push('/auth/login')}
                        className={styles.loginButton}
                    >
                        Login
                    </Button>
                </div>
            </section>
        );
    };

    return (
        <>
            <Head>
                <title>Drive Match Network - Find Ride Requests</title>
                <meta name="description" content="Find passengers looking for rides. Connect with travelers and offer rides as a verified driver." />
                <meta name="keywords" content="ride requests, carpooling, ride sharing, passengers, drivers" />
                <link rel="canonical" href="https://drivematchnetwork.com/ride-requests" />
            </Head>

            <div className={styles.pageContainer}>
                {currentUser ? <Navbar /> : <Header />}

                <main className={styles.mainContent}>
                    <div className={styles.contentWrapper}>
                        {renderSearchForm()}
                        {renderSearchResults()}
                    </div>
                    {renderDriverCTA()}
                </main>

                <Footer />
            </div>
        </>
    );
};

export default RideRequests;