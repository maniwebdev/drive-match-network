// pages/ride/available-requests.js
/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRide } from '../../context/Ride/RideContext';
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
    ClipboardList,
    MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import Navbar from '../../components/Navigation/Navbar';
import styles from '../../styles/Trips/availableTrips.module.css';
import { useTrip } from '../../context/Ride/TripContext';

const { Option } = Select;
const AvailableRequests = () => {
    const router = useRouter();
    const { currentUser } = useAuth();
    const { loading: rideLoading, getAvailableTrips } = useTrip();
    const { getUserRideOffers } = useRide();
    const [form] = Form.useForm();

    // State management
    const [searchResults, setSearchResults] = useState([]);
    const [isSearched, setIsSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [myRideOffers, setMyRideOffers] = useState([]);
    const [selectedRide, setSelectedRide] = useState(null);

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
        luggageSize: ''
    });

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

    useEffect(() => {
        const fetchRideOffers = async () => {
            if (currentUser?.isDriver) {
                try {
                    const result = await getUserRideOffers();
                    if (result.success) {
                        // Only show active ride offers in dropdown
                        const activeOffers = result.offers.filter(
                            offer => offer.status === 'active'
                        );
                        setMyRideOffers(activeOffers);
                    } else {
                        message.error('Failed to fetch your ride offers');
                    }
                } catch (error) {
                    console.error('Fetch offers error:', error);
                    message.error('Error loading ride offers');
                }
            }
        };
        fetchRideOffers();
    }, [currentUser]);

    // Handle ride offer selection
    const handleRideSelect = (rideId) => {
        const selectedOffer = myRideOffers.find(offer => offer._id === rideId);
        if (selectedOffer) {
            setSelectedRide(selectedOffer);
            const departureDateTime = moment(selectedOffer.departureDateTime);
            setSearchParams({
                ...searchParams,
                origin: {
                    address: selectedOffer.origin.address,
                    city: selectedOffer.origin.city,
                    zipCode: selectedOffer.origin.zipCode
                },
                destination: {
                    address: selectedOffer.destination.address,
                    city: selectedOffer.destination.city,
                    zipCode: selectedOffer.destination.zipCode
                },
                departureDate: departureDateTime,
                departureTime: departureDateTime.format('HH:mm'),
                seats: selectedOffer.availableSeats - selectedOffer.bookedSeats, // Consider booked seats
                luggageSize: selectedOffer.allowedLuggage
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
            const result = await getAvailableTrips({
                originCity: searchParams.origin.city,
                originZipCode: searchParams.origin.zipCode,
                destinationCity: searchParams.destination.city,
                destinationZipCode: searchParams.destination.zipCode,
                departureDate: searchParams.departureDate?.format('YYYY-MM-DD'),
                departureTime: searchParams.departureTime,
                seats: searchParams.seats,
                luggageSize: searchParams.luggageSize
            });

            if (result.success) {
                setSearchResults(result.trips);
                setIsSearched(true);
            } else {
                message.error(result.message || 'Failed to search trip requests');
            }
        } catch (error) {
            console.error('Search error:', error);
            message.error('An error occurred while searching trip requests');
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
            luggageSize: ''
        });
        setSelectedRide(null);
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
                {/* Ride Offer Dropdown */}
                <div className={styles.rideOfferSection}>
                    <Form.Item label="My Ride Offers" className={styles.rideOfferField}>
                        <Select
                            placeholder="Select from your ride offers"
                            value={selectedRide?._id}
                            onChange={handleRideSelect}
                            allowClear
                            className={styles.rideSelect}
                        >
                            {myRideOffers.map(offer => (
                                <Option key={offer._id} value={offer._id}>
                                    <div className={styles.offerOption}>
                                        <ClipboardList size={16} className={styles.offerIcon} />
                                        <span>
                                            {offer.origin.city} → {offer.destination.city}
                                        </span>
                                        <span className={styles.offerDate}>
                                            {moment(offer.departureDateTime).format('MMM D')} at {moment(offer.departureDateTime).format('HH:mm')}
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
                                    address: e.target.value
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
                                    address: e.target.value
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
                        loading={rideLoading}
                        className={styles.searchButton}
                    >
                        Search Requests
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
        if (rideLoading) {
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
                        <h2>Find Trip Requests</h2>
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
            >
                <h2 className={styles.resultsTitle}>
                    Available Trip Requests ({searchResults.length})
                </h2>
                <div className={styles.resultsList}>
                    {searchResults.map((request) => (
                        <motion.div
                            key={request._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className={styles.requestCard}
                            onClick={() => router.push(`/trip/details/${request._id}`)}
                        >
                            <div className={styles.requestHeader}>
                                <div className={styles.passengerInfo}>
                                    <div className={styles.passengerAvatar}>
                                        {request.requester.profilePicture ? (
                                            <img
                                                src={request.requester.profilePicture.url}
                                                alt={request.requester.fullName}
                                                className={styles.avatarImage}
                                            />
                                        ) : (
                                            <div className={styles.avatarPlaceholder}>
                                                {request.requester.fullName[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.passengerDetails}>
                                        <h3 className={styles.passengerName}>
                                            {request.requester.fullName}
                                        </h3>
                                        <div className={styles.rating}>
                                            ⭐ {request.requester.rating?.toFixed(1)}
                                        </div>
                                    </div>
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
                                    <div className={styles.locationDivider}>→</div>
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
                                        <Users className={styles.infoIcon} />
                                        <span>
                                            {request.numberOfSeats} seats needed
                                        </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <Package className={styles.infoIcon} />
                                        <span>
                                            Luggage: {request.luggageSize}
                                        </span>
                                    </div>

                                    {request.additionalNotes && (
                                        <div className={styles.infoItem}>
                                            <MessageSquare className={styles.infoIcon} />
                                            <span className={styles.notes}>
                                                "{request.additionalNotes}"
                                            </span>
                                        </div>
                                    )}

                                    {request.flexibleTiming && (
                                        <div className={styles.flexibleTiming}>
                                            <Clock className={styles.infoIcon} />
                                            <span>Flexible timing: {request.timeRange.earliest} - {request.timeRange.latest}</span>
                                        </div>
                                    )}
                                </div>

                                {request.isUrgent && (
                                    <div className={styles.urgentBadge}>
                                        <AlertCircle className={styles.urgentIcon} />
                                        Urgent Request
                                    </div>
                                )}

                                {selectedRide && (
                                    <Button
                                        type="primary"
                                        className={styles.matchButton}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            router.push(`/trip/details/${request._id}`)
                                        }}
                                    >
                                        Open
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

export default AvailableRequests;