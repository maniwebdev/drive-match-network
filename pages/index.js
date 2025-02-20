import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Form, Input, DatePicker, InputNumber, Select, Button, Empty, Spin } from 'antd';
import { Search, Calendar, Users, Package } from 'lucide-react';
import { useRide } from '../context/Ride/RideContext';
import moment from 'moment';
import styles from '../styles/Home.module.css';
import Header from '../components/Navigation/Header';
import Footer from '../components/Navigation/Footer';
import { AuthTokenCheck } from '../components/Authentication/AuthTokenCheck';
import LoadingAnimation from '../components/LoadingAnimation';

const { Option } = Select;

const HomePage = () => {
  const router = useRouter();
  const { isAuthenticated, isUserVerified, hasFetchedUserDetails } = AuthTokenCheck();
  const { searchPublicRides, loading } = useRide();
  const [form] = Form.useForm();

  const [searchResults, setSearchResults] = useState([]);
  const [isSearched, setIsSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const [searchParams, setSearchParams] = useState({
    originCity: '',
    destinationCity: '',
    departureDate: null,
    seats: 1,
    maxPrice: null,
    luggageSize: ''
  });

  React.useEffect(() => {
    if (hasFetchedUserDetails) {
      if (isAuthenticated && isUserVerified) {
        router.replace('/user/profile');
      }
      setIsLoading(false);
    }
  }, [hasFetchedUserDetails, isAuthenticated, isUserVerified, router]);
  // Load initial rides when page loads
  useEffect(() => {
    handleInitialSearch();
  }, []);
  if (isLoading) return <LoadingAnimation />;
  const handleInitialSearch = async () => {
    try {
      const result = await searchPublicRides({});
      if (result.success) {
        setSearchResults(result.rideOffers);
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
        maxPrice: searchParams.maxPrice,
        allowedLuggage: searchParams.luggageSize
      };

      const result = await searchPublicRides(formattedParams);

      if (result.success) {
        setSearchResults(result.rideOffers);
        setIsSearched(true);

        // Scroll to results
        document.querySelector('#searchResults')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error('Failed to search rides. Please try again.');
    }
  };

  const handleRideSelect = (rideId) => {
    // Redirect to login if viewing ride details
    router.push(`/auth/login?redirect=/ride/details/${rideId}`);
  };

  return (
    <>
      <Head>
        <title>Drive Match Network - Find Your Perfect Ride</title>
        <meta name="description" content="Find and share rides with trusted drivers. Save money, reduce carbon footprint, and travel comfortably with Drive Match Network's carpooling service." />
        <meta name="keywords" content="carpooling, ride sharing, transportation, sustainable travel, shared rides" />
        <link rel="canonical" href="https://drivematchnetwork.com" />

        {/* Open Graph tags */}
        <meta property="og:title" content="Drive Match Network - Find Your Perfect Ride" />
        <meta property="og:description" content="Find and share rides with trusted drivers. Save money, reduce carbon footprint, and travel comfortably." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://drivematchnetwork.com" />

        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Drive Match Network - Find Your Perfect Ride" />
        <meta name="twitter:description" content="Find and share rides with trusted drivers. Save money, reduce carbon footprint, and travel comfortably." />
      </Head>

      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <Header />
        </header>

        <main className={styles.mainContent}>
          {/* Search Form Section */}
          <section className={styles.searchSection}>
            <div className={styles.searchFormContainer}>
              <Form form={form} layout="vertical" className={styles.searchForm}>
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
                    Find Rides
                  </Button>
                </div>

                {/* Advanced Filters Toggle */}
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
                        label="Max Price"
                        className={styles.filterField}
                      >
                        <InputNumber
                          min={0}
                          value={searchParams.maxPrice}
                          onChange={(value) => setSearchParams(prev => ({
                            ...prev,
                            maxPrice: value
                          }))}
                          className={styles.priceInput}
                          prefix="$"
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
            {/* Search Results Section */}
            <div className={styles.resultsSection}>
              {loading ? (
                <div className={styles.loadingState}>
                  <Spin size="large" />
                  <p>Finding available rides...</p>
                </div>
              ) : !isSearched ? (
                <div className={styles.initialState}>
                  <div className={styles.initialStateContent}>
                    <div className={styles.featureGrid}>
                      <div className={styles.featureCard}>
                        <Users className={styles.featureIcon} />
                        <h3>Trusted Community</h3>
                        <p>Join thousands of verified users sharing rides daily</p>
                      </div>
                      <div className={styles.featureCard}>
                        <Calendar className={styles.featureIcon} />
                        <h3>Flexible Travel</h3>
                        <p>Find rides for any day that suits your schedule</p>
                      </div>
                      <div className={styles.featureCard}>
                        <Package className={styles.featureIcon} />
                        <h3>Convenient Options</h3>
                        <p>Choose rides based on your luggage and preferences</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <div className={styles.noResults}>
                  <Empty
                    description={
                      <div className={styles.noResultsContent}>
                        <h3>No rides available</h3>
                        <p>Try adjusting your search criteria or check back later</p>
                      </div>
                    }
                  />
                </div>
              ) : (
                <div className={styles.searchResults}>
                  <h2 className={styles.resultsTitle}>
                    Available Rides ({searchResults.length})
                  </h2>
                  <div className={styles.resultsList}>
                    {searchResults.map((ride) => (
                      <div
                        key={ride._id}
                        className={styles.rideCard}
                        onClick={() => handleRideSelect(ride._id)}
                      >
                        <div className={styles.rideHeader}>
                          <div className={styles.ridePrice}>
                            <span className={styles.priceAmount}>
                              ${ride.pricePerSeat}
                            </span>
                            <span className={styles.priceLabel}>per seat</span>
                          </div>
                          <div className={styles.rideSeats}>
                            <Users className={styles.seatIcon} />
                            <span>{ride.availableSeats - ride.bookedSeats} seats left</span>
                          </div>
                        </div>

                        <div className={styles.rideDetails}>
                          <div className={styles.routeInfo}>
                            <div className={styles.location}>
                              <span className={styles.cityName}>{ride.origin.city}</span>
                              <span className={styles.address}>{ride.origin.address}</span>
                            </div>
                            <div className={styles.arrow}>→</div>
                            <div className={styles.location}>
                              <span className={styles.cityName}>{ride.destination.city}</span>
                              <span className={styles.address}>{ride.destination.address}</span>
                            </div>
                          </div>

                          <div className={styles.rideInfo}>
                            <div className={styles.datetime}>
                              {moment(ride.departureDateTime).format('MMM D, YYYY h:mm A')}
                            </div>
                            <div className={styles.preferences}>
                              <span className={styles.luggageInfo}>
                                {ride.allowedLuggage} luggage
                              </span>
                              <span className={styles.separator}>•</span>
                              <span>{ride.smoking ? '🚬 Smoking' : '🚭 No smoking'}</span>
                              <span className={styles.separator}>•</span>
                              <span>{ride.pets ? '🐾 Pets allowed' : '⛔ No pets'}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          className={styles.viewDetailsButton}
                          onClick={() => handleRideSelect(ride._id)}
                        >
                          View Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
        {/* Trust Indicators Section */}
        <section id='choose' className={styles.trustSection}>
          <div className={styles.trustContent}>
            <h2>Why Choose Drive Match Network?</h2>
            <div className={styles.trustGrid}>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>🔒</div>
                <h3>Verified Users</h3>
                <p>All drivers are verified through our comprehensive verification process</p>
              </div>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>💰</div>
                <h3>Fair Pricing</h3>
                <p>Transparent pricing with no hidden fees</p>
              </div>
              <div className={styles.trustItem}>
                <div className={styles.trustIcon}>⭐</div>
                <h3>Rated Community</h3>
                <p>Read reviews and ratings from other travelers</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id='how-it-works' className={styles.howItWorksSection}>
          <h2>How It Works</h2>
          <div className={styles.stepsGrid}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3>Search</h3>
              <p>Enter your destination and travel date</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>Choose</h3>
              <p>Select from available rides that match your needs</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Book</h3>
              <p>Book your seat and travel together</p>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className={styles.ctaSection}>
          <h2>Ready to Start Your Journey?</h2>
          <p>Join our community of travelers today</p>
          <div className={styles.ctaButtons}>
            <Button
              type="primary"
              size="large"
              onClick={() => router.push('/auth/register')}
              className={styles.signupButton}
            >
              Sign Up Now
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

export default HomePage;