// pages/ride-requests.js
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Form, Input, DatePicker, InputNumber, Select, Button, Empty, Spin } from 'antd';
import { Search, Calendar, Users, Package } from 'lucide-react';
import { useTrip } from '../context/Ride/TripContext';
import moment from 'moment';
import styles from '../styles/RideRequests.module.css';
import Header from '../components/Navigation/Header';
import Footer from '../components/Navigation/Footer';

const { Option } = Select;

const RideRequests = () => {
    const router = useRouter();
    const { searchPublicRequests, loading } = useTrip();
    const [form] = Form.useForm();

    const [searchResults, setSearchResults] = useState([]);
    const [isSearched, setIsSearched] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const [searchParams, setSearchParams] = useState({
        originCity: '',
        destinationCity: '',
        departureDate: null,
        seats: 1,
        luggageSize: ''
    });

    // Load initial requests when page loads
    useEffect(() => {
        handleInitialSearch();
    }, []);

    const handleInitialSearch = async () => {
        try {
            const result = await searchPublicRequests({});
            if (result.success) {
                setSearchResults(result.requests);
                setIsSearched(true);
            }
        } catch (error) {
            console.error('Initial search error:', error);
        }
    };

    // Handler Functions
    const handleSearch = async () => {
        if (!searchParams.originCity.trim()) {
            message.warning('Please enter a departure city');
            return;
        }

        try {
            const formattedParams = {
                originCity: searchParams.originCity,
                destinationCity: searchParams.destinationCity,
                departureDate: searchParams.departureDate?.format('YYYY-MM-DD'),
                seats: searchParams.seats,
                luggageSize: searchParams.luggageSize
            };

            const result = await searchPublicRequests(formattedParams);

            if (result.success) {
                setSearchResults(result.requests);
                setIsSearched(true);

                document.querySelector('#searchResults')?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        } catch (error) {
            console.error('Search error:', error);
            message.error('Failed to search requests. Please try again.');
        }
    };

    const handleRequestSelect = (requestId) => {
        router.push(`/auth/login?redirect=/request/details/${requestId}`);
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
                <header className={styles.header}>
                    <Header />
                </header>

                <main className={styles.mainContent}>
                    <section className={styles.searchSection}>
                        <div className={styles.searchFormContainer}>
                            <div className={styles.searchHeaderText}>
                                <h1 className={styles.searchTitle}>Find Passenger Requests</h1>
                                <p className={styles.searchSubtitle}>Connect with passengers looking for rides</p>
                            </div>

                            <Form form={form} layout="vertical" className={styles.searchForm}>
                                {/* Search Fields */}
                                <div className={styles.mainSearchFields}>
                                    <Form.Item
                                        label="From"
                                        required
                                        className={styles.locationField}
                                    >
                                        <Input
                                            placeholder="Enter city (e.g., New York)"
                                            value={searchParams.originCity}
                                            onChange={(e) => setSearchParams(prev => ({
                                                ...prev,
                                                originCity: e.target.value
                                            }))}
                                            prefix={<Search className={styles.inputIcon} />}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="To"
                                        className={styles.locationField}
                                    >
                                        <Input
                                            placeholder="Enter destination city"
                                            value={searchParams.destinationCity}
                                            onChange={(e) => setSearchParams(prev => ({
                                                ...prev,
                                                destinationCity: e.target.value
                                            }))}
                                            prefix={<Search className={styles.inputIcon} />}
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Date"
                                        className={styles.dateField}
                                    >
                                        <DatePicker
                                            value={searchParams.departureDate}
                                            onChange={(date) => setSearchParams(prev => ({
                                                ...prev,
                                                departureDate: date
                                            }))}
                                            disabledDate={(current) => current && current < moment().startOf('day')}
                                            format="YYYY-MM-DD"
                                            className={styles.datePicker}
                                            placeholder="Choose travel date"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        label="Passengers"
                                        className={styles.seatsField}
                                    >
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

                                    <Button
                                        type="primary"
                                        onClick={handleSearch}
                                        loading={loading}
                                        className={styles.searchButton}
                                    >
                                        Find Requests
                                    </Button>
                                </div>

                                {/* Filters Section */}
                                <div className={styles.filtersSection}>
                                    <Button
                                        type="text"
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={styles.filterToggle}
                                    >
                                        {showFilters ? 'Hide Filters' : 'More Filters'}
                                    </Button>

                                    {showFilters && (
                                        <div className={styles.filtersContainer}>
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
                                                >
                                                    <Option value="small">Small (Backpack)</Option>
                                                    <Option value="medium">Medium (Carry-on)</Option>
                                                    <Option value="large">Large (Suitcase)</Option>
                                                </Select>
                                            </Form.Item>
                                        </div>
                                    )}
                                </div>
                            </Form>
                        </div>

                        {/* Would you like me to continue with the results display section? */}
                        {/* Search Results Section */}
                        <div className={styles.resultsSection}>
                            {loading ? (
                                <div className={styles.loadingState}>
                                    <Spin size="large" />
                                    <p>Finding ride requests...</p>
                                </div>
                            ) : !isSearched ? (
                                <div className={styles.initialState}>
                                    <div className={styles.initialStateContent}>
                                        <div className={styles.featureGrid}>
                                            <div className={styles.featureCard}>
                                                <Users className={styles.featureIcon} />
                                                <h3>Find Passengers</h3>
                                                <p>Connect with passengers looking for rides in your direction</p>
                                            </div>
                                            <div className={styles.featureCard}>
                                                <Calendar className={styles.featureIcon} />
                                                <h3>Flexible Matching</h3>
                                                <p>Find requests that match your travel schedule</p>
                                            </div>
                                            <div className={styles.featureCard}>
                                                <Package className={styles.featureIcon} />
                                                <h3>Passenger Preferences</h3>
                                                <p>View luggage requirements and travel preferences</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <div className={styles.noResults}>
                                    <Empty
                                        description={
                                            <div className={styles.noResultsContent}>
                                                <h3>No ride requests found</h3>
                                                <p>Try adjusting your search criteria or check back later</p>
                                            </div>
                                        }
                                    />
                                </div>
                            ) : (
                                <div className={styles.searchResults}>
                                    <h2 className={styles.resultsTitle}>
                                        Available Requests ({searchResults.length})
                                    </h2>
                                    <div className={styles.resultsList}>
                                        {searchResults.map((request) => (
                                            <div
                                                key={request._id}
                                                className={styles.requestCard}
                                                onClick={() => handleRequestSelect(request._id)}
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

                                                    <div className={styles.seatsRequired}>
                                                        <Users className={styles.seatIcon} />
                                                        <span>{request.numberOfSeats} seats needed</span>
                                                    </div>
                                                </div>

                                                <div className={styles.requestDetails}>
                                                    <div className={styles.routeInfo}>
                                                        <div className={styles.location}>
                                                            <span className={styles.cityName}>{request.origin.city}</span>
                                                            <span className={styles.address}>{request.origin.address}</span>
                                                        </div>
                                                        <div className={styles.arrow}>→</div>
                                                        <div className={styles.location}>
                                                            <span className={styles.cityName}>{request.destination.city}</span>
                                                            <span className={styles.address}>{request.destination.address}</span>
                                                        </div>
                                                    </div>

                                                    <div className={styles.tripInfo}>
                                                        <div className={styles.datetime}>
                                                            {moment(request.departureDate).format('MMM D, YYYY')} at {request.departureTime}
                                                        </div>
                                                        <div className={styles.preferences}>
                                                            <span className={styles.luggageInfo}>
                                                                {request.luggageSize} luggage
                                                            </span>
                                                            {request.additionalNotes && (
                                                                <>
                                                                    <span className={styles.separator}>•</span>
                                                                    <span className={styles.notes}>
                                                                        {request.additionalNotes}
                                                                    </span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    className={styles.viewDetailsButton}
                                                    onClick={() => handleRequestSelect(request._id)}
                                                >
                                                    View Request Details
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                </main>

                {/* Driver CTA Section */}
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
            </div>
            <Footer />
        </>
    );
};

export default RideRequests;