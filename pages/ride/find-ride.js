// // pages/ride/find-ride.js
// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/router';
// import { useAuth } from '../../context/Auth/AuthContext';
// import { useRide } from '../../context/Ride/RideContext';
// import {
//     Form,
//     DatePicker,
//     InputNumber,
//     Select,
//     Button,
//     Empty,
//     Spin,
//     message
// } from 'antd';
// import {
//     Search,
//     Calendar,
//     Users,
//     DollarSign,
//     Package,
//     MapPin,
//     ArrowRight,
//     Filter
// } from 'lucide-react';
// import { motion } from 'framer-motion';
// import moment from 'moment';
// import Navbar from '../../components/Navigation/Navbar';
// import LocationInput from '../../components/Rides/LocationInput';
// import styles from '../../styles/Rides/findRide.module.css';

// const { Option } = Select;

// const FindRide = () => {
//     const router = useRouter();
//     const { currentUser } = useAuth();
//     const { searchRideOffers, loading } = useRide();
//     const [form] = Form.useForm();
//     const [userLocation, setUserLocation] = useState(null);
//     const [nearbyRides, setNearbyRides] = useState([]);
//     const [loadingLocation, setLoadingLocation] = useState(false);

//     // State management
//     const [searchParams, setSearchParams] = useState({
//         origin: {
//             address: '',
//             city: '',
//             coordinates: []
//         },
//         destination: {
//             address: '',
//             city: '',
//             coordinates: []
//         },
//         departureDate: null,
//         seats: 1,
//         maxPrice: null,
//         luggageSize: 'medium'
//     });

//     const [searchResults, setSearchResults] = useState([]);
//     const [showFilters, setShowFilters] = useState(false);
//     const [isSearched, setIsSearched] = useState(false);
//     const [initialLoadDone, setInitialLoadDone] = useState(false);

//     useEffect(() => {
//         const getUserLocation = async () => {
//             if (!navigator.geolocation) {
//                 message.info('Geolocation is not supported by your browser');
//                 return;
//             }

//             setLoadingLocation(true);
//             try {
//                 const position = await new Promise((resolve, reject) => {
//                     navigator.geolocation.getCurrentPosition(resolve, reject);
//                 });

//                 const location = {
//                     lat: position.coords.latitude,
//                     lng: position.coords.longitude
//                 };
//                 setUserLocation(location);

//                 // Search for nearby rides with minimal parameters
//                 const result = await searchRideOffers({
//                     // Add minimum date filter to only show future rides
//                     departureDate: moment().format('YYYY-MM-DD')
//                 }, location);

//                 if (result.success) {
//                     setSearchResults(result.rideOffers); // Update searchResults instead of nearbyRides
//                     setIsSearched(true); // Set this to true to show the results
//                 }
//             } catch (error) {
//                 console.error('Error getting location:', error);
//                 message.error('Unable to get your location');
//             } finally {
//                 setLoadingLocation(false);
//             }
//         };

//         getUserLocation();
//     }, []);

//     // Initial query params handling
//     useEffect(() => {
//         const {
//             originCity,
//             destinationCity,
//             date,
//             seats
//         } = router.query;

//         if (!initialLoadDone && (originCity || destinationCity || date || seats)) {
//             setSearchParams(prev => ({
//                 ...prev,
//                 origin: { ...prev.origin, city: originCity || '' },
//                 destination: { ...prev.destination, city: destinationCity || '' },
//                 departureDate: date ? moment(date) : null,
//                 seats: seats ? parseInt(seats) : 1
//             }));

//             handleSearch({
//                 originCity,
//                 destinationCity,
//                 departureDate: date,
//                 seats: seats ? parseInt(seats) : 1
//             });
//         }
//         setInitialLoadDone(true);
//     }, [router.query]);

//     // Add this useEffect for cleanup
//     useEffect(() => {
//         return () => {
//             setSearchResults([]);
//             setIsSearched(false);
//         };
//     }, []);

//     // Handler functions
//     const handleLocationChange = (field, value) => {
//         setSearchParams(prev => ({
//             ...prev,
//             [field]: value
//         }));
//     };

//     const handleSearch = async (overrideParams) => {
//         const searchData = overrideParams || {
//             originCity: searchParams.origin?.city,
//             destinationCity: searchParams.destination?.city,
//             departureDate: searchParams.departureDate?.format('YYYY-MM-DD'),
//             seats: searchParams.seats,
//             ...(searchParams.maxPrice && { maxPrice: searchParams.maxPrice }),
//             ...(searchParams.luggageSize && { allowedLuggage: searchParams.luggageSize })
//         };

//         // Validate required fields
//         if (!overrideParams && (!searchData.originCity || !searchData.destinationCity || !searchData.departureDate)) {
//             message.error('Please fill in all required fields');
//             return;
//         }

//         try {
//             console.log('Searching with params:', searchData); // Debug log
//             const result = await searchRideOffers(searchData, userLocation);
//             console.log('Search result:', result); // Debug log

//             if (result.success) {
//                 setSearchResults(result.rideOffers);
//                 setIsSearched(true);

//                 // Only update URL if it's a new search (not from URL params)
//                 if (!overrideParams) {
//                     router.push({
//                         pathname: '/ride/find-ride',
//                         query: {
//                             originCity: searchData.originCity,
//                             destinationCity: searchData.destinationCity,
//                             date: searchData.departureDate,
//                             seats: searchData.seats
//                         }
//                     }, undefined, { shallow: true });
//                 }
//             } else {
//                 message.error(result.message || 'Failed to search rides');
//             }
//         } catch (error) {
//             console.error('Search error:', error);
//             message.error('An error occurred while searching rides');
//         }
//     };

//     const handleRideSelect = (rideId) => {
//         router.push(`/ride/details/${rideId}`);
//     };



//     // Render functions
//     const renderSearchForm = () => (
//         <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             className={styles.searchFormContainer}
//         >
//             <Form
//                 form={form}
//                 layout="vertical"
//                 className={styles.searchForm}
//             >
//                 <div className={styles.mainSearchFields}>
//                     <Form.Item
//                         label="From"
//                         required
//                         className={styles.locationField}
//                     >
//                         <LocationInput
//                             value={searchParams.origin}
//                             onChange={(value) => handleLocationChange('origin', value)}
//                             placeholder="Enter pickup location"
//                         />
//                     </Form.Item>

//                     <div className={styles.arrowIcon}>
//                         <ArrowRight />
//                     </div>

//                     <Form.Item
//                         label="To"
//                         required
//                         className={styles.locationField}
//                     >
//                         <LocationInput
//                             value={searchParams.destination}
//                             onChange={(value) => handleLocationChange('destination', value)}
//                             placeholder="Enter destination"
//                         />
//                     </Form.Item>

//                     <Form.Item
//                         label="Date"
//                         required
//                         className={styles.dateField}
//                     >
//                         <DatePicker
//                             value={searchParams.departureDate}
//                             onChange={(date) => setSearchParams(prev => ({ ...prev, departureDate: date }))}
//                             disabledDate={(current) => current && current < moment().startOf('day')}
//                             format="YYYY-MM-DD"
//                             className={styles.datePicker}
//                         />
//                     </Form.Item>

//                     <Form.Item
//                         label="Seats"
//                         className={styles.seatsField}
//                     >
//                         <InputNumber
//                             min={1}
//                             max={8}
//                             value={searchParams.seats}
//                             onChange={(value) => setSearchParams(prev => ({ ...prev, seats: value }))}
//                             className={styles.seatsInput}
//                         />
//                     </Form.Item>

//                     <Button
//                         type="primary"
//                         icon={<Search />}
//                         onClick={() => handleSearch()}
//                         loading={loading}
//                         className={styles.searchButton}
//                     >
//                         Search
//                     </Button>
//                 </div>
//                 {/* Advanced Filters Section */}
//                 <div className={styles.filtersSection}>
//                     <Button
//                         type="text"
//                         icon={<Filter />}
//                         onClick={() => setShowFilters(!showFilters)}
//                         className={styles.filterToggle}
//                     >
//                         {showFilters ? 'Hide Filters' : 'Show Filters'}
//                     </Button>

//                     {showFilters && (
//                         <motion.div
//                             initial={{ opacity: 0, height: 0 }}
//                             animate={{ opacity: 1, height: 'auto' }}
//                             exit={{ opacity: 0, height: 0 }}
//                             className={styles.filtersContainer}
//                         >
//                             <Form.Item
//                                 label="Maximum Price"
//                                 className={styles.filterField}
//                             >
//                                 <InputNumber
//                                     prefix={<DollarSign className={styles.inputIcon} />}
//                                     min={0}
//                                     value={searchParams.maxPrice}
//                                     onChange={(value) => setSearchParams(prev => ({
//                                         ...prev,
//                                         maxPrice: value
//                                     }))}
//                                     className={styles.priceInput}
//                                 />
//                             </Form.Item>

//                             <Form.Item
//                                 label="Luggage Size"
//                                 className={styles.filterField}
//                             >
//                                 <Select
//                                     value={searchParams.luggageSize}
//                                     onChange={(value) => setSearchParams(prev => ({
//                                         ...prev,
//                                         luggageSize: value
//                                     }))}
//                                     className={styles.select}
//                                 >
//                                     <Option value="small">Small (Backpack)</Option>
//                                     <Option value="medium">Medium (Carry-on)</Option>
//                                     <Option value="large">Large (Suitcase)</Option>
//                                 </Select>
//                             </Form.Item>
//                         </motion.div>
//                     )}
//                 </div>
//             </Form>
//         </motion.div>
//     );

//     const renderSearchResults = () => {
//         if (!isSearched) {
//             return (
//                 <div className={styles.initialState}>
//                     <motion.div
//                         initial={{ opacity: 0, y: 20 }}
//                         animate={{ opacity: 1, y: 0 }}
//                         className={styles.initialStateContent}
//                     >
//                         <Search className={styles.initialStateIcon} />
//                         <h2>Find Your Perfect Ride</h2>
//                         <p>Enter your travel details to search for available rides</p>
//                     </motion.div>
//                 </div>
//             );
//         }

//         if (loading) {
//             return (
//                 <div className={styles.loadingState}>
//                     <Spin size="large" />
//                     <p>Searching for rides...</p>
//                 </div>
//             );
//         }

//         if (searchResults.length === 0) {
//             return (
//                 <div className={styles.noResults}>
//                     <Empty
//                         description={
//                             <div className={styles.noResultsContent}>
//                                 <h3>No rides found</h3>
//                                 <p>Try adjusting your search criteria or check back later</p>
//                             </div>
//                         }
//                     />
//                 </div>
//             );
//         }

//         return (
//             <motion.div
//                 initial={{ opacity: 0 }}
//                 animate={{ opacity: 1 }}
//                 className={styles.searchResults}
//             >
//                 <h2 className={styles.resultsTitle}>
//                     Available Rides ({searchResults.length})
//                 </h2>
//                 <div className={styles.resultsList}>
//                     {searchResults.map((ride) => (
//                         <motion.div
//                             key={ride._id}
//                             initial={{ opacity: 0, y: 20 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             whileHover={{ scale: 1.02 }}
//                             className={styles.rideCard}
//                             onClick={() => handleRideSelect(ride._id)}
//                         >
//                             <div className={styles.rideHeader}>
//                                 <div className={styles.driverInfo}>
//                                     <div className={styles.driverAvatar}>
//                                         {ride.driver.profilePicture ? (
//                                             <img
//                                                 src={ride.driver.profilePicture.url}
//                                                 alt={ride.driver.fullName}
//                                                 className={styles.avatarImage}
//                                             />
//                                         ) : (
//                                             <div className={styles.avatarPlaceholder}>
//                                                 {ride.driver.fullName[0]}
//                                             </div>
//                                         )}
//                                     </div>
//                                     <div className={styles.driverDetails}>
//                                         <h3 className={styles.driverName}>
//                                             {ride.driver.fullName}
//                                         </h3>
//                                         <div className={styles.rating}>
//                                             ⭐ {ride.driver.rating.toFixed(1)}
//                                         </div>
//                                     </div>
//                                 </div>
//                                 <div className={styles.ridePrice}>
//                                     <span className={styles.priceAmount}>
//                                         ${ride.pricePerSeat}
//                                     </span>
//                                     <span className={styles.priceLabel}>per seat</span>
//                                 </div>
//                             </div>

//                             <div className={styles.rideDetails}>
//                                 <div className={styles.locations}>
//                                     <div className={styles.locationItem}>
//                                         <MapPin className={styles.locationIcon} />
//                                         <div className={styles.locationText}>
//                                             <span className={styles.locationName}>
//                                                 {ride.origin.city}
//                                             </span>
//                                             <span className={styles.locationAddress}>
//                                                 {ride.origin.address}
//                                             </span>
//                                         </div>
//                                     </div>
//                                     <div className={styles.locationDivider}>→</div>
//                                     <div className={styles.locationItem}>
//                                         <MapPin className={styles.locationIcon} />
//                                         <div className={styles.locationText}>
//                                             <span className={styles.locationName}>
//                                                 {ride.destination.city}
//                                             </span>
//                                             <span className={styles.locationAddress}>
//                                                 {ride.destination.address}
//                                             </span>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 <div className={styles.rideInfo}>
//                                     <div className={styles.infoItem}>
//                                         <Calendar className={styles.infoIcon} />
//                                         <span>
//                                             {moment(ride.departureDate).format('ddd, MMM D, YYYY')} at {ride.departureTime}
//                                         </span>
//                                     </div>
//                                     <div className={styles.infoItem}>
//                                         <Users className={styles.infoIcon} />
//                                         <span>
//                                             {ride.availableSeats - ride.bookedSeats}/{ride.availableSeats} seats
//                                         </span>
//                                     </div>
//                                     <div className={styles.infoItem}>
//                                         <Package className={styles.infoIcon} />
//                                         <span>
//                                             Luggage: {ride.allowedLuggage}
//                                         </span>
//                                     </div>
//                                     <div className={styles.infoItem}>
//                                         {ride.smoking ? '🚬 Smoking allowed' : '🚭 No smoking'}
//                                     </div>
//                                     <div className={styles.infoItem}>
//                                         {ride.pets ? '🐾 Pets allowed' : '⛔ No pets'}
//                                     </div>
//                                 </div>
//                             </div>
//                         </motion.div>
//                     ))}
//                 </div>
//             </motion.div>
//         );
//     };

//     // Main render
//     return (
//         <>
//             <Navbar />
//             <div className={styles.pageContainer}>
//                 <motion.div
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     className={styles.contentWrapper}
//                 >
//                     {renderSearchForm()}
//                     {renderSearchResults()}
//                 </motion.div>
//             </div>
//         </>
//     );
// };

// export default FindRide;
// pages/ride/find-ride.js
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
    message
} from 'antd';
import {
    Search,
    Calendar,
    Users,
    DollarSign,
    Package,
    MapPin,
    ArrowRight,
    Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import Navbar from '../../components/Navigation/Navbar';
import LocationInput from '../../components/Rides/LocationInput';
import styles from '../../styles/Rides/findRide.module.css';

const { Option } = Select;

const FindRide = () => {
    // Router and context hooks
    const router = useRouter();
    const { currentUser } = useAuth();
    const { searchRideOffers, loading } = useRide();
    const [form] = Form.useForm();

    // Location and loading states
    const [userLocation, setUserLocation] = useState(null);
    const [nearbyRides, setNearbyRides] = useState([]);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Search parameters state
    const [searchParams, setSearchParams] = useState({
        origin: {
            address: '',
            city: '',
            coordinates: []
        },
        destination: {
            address: '',
            city: '',
            coordinates: []
        },
        departureDate: null,
        seats: 1,
        maxPrice: null,
        luggageSize: 'medium'
    });

    // UI states
    const [searchResults, setSearchResults] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [isSearched, setIsSearched] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    // Location and nearby rides effect
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

                // Search for nearby rides with minimal parameters
                const result = await searchRideOffers({
                    departureDate: moment().format('YYYY-MM-DD')
                }, location);

                if (result.success) {
                    setSearchResults(result.rideOffers);
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

    // URL query parameters effect
    useEffect(() => {
        const {
            originCity,
            destinationCity,
            date,
            seats
        } = router.query;

        if (!initialLoadDone && (originCity || destinationCity || date || seats)) {
            setSearchParams(prev => ({
                ...prev,
                origin: { ...prev.origin, city: originCity || '' },
                destination: { ...prev.destination, city: destinationCity || '' },
                departureDate: date ? moment(date) : null,
                seats: seats ? parseInt(seats) : 1
            }));

            handleSearch({
                originCity,
                destinationCity,
                departureDate: date,
                seats: seats ? parseInt(seats) : 1
            });
        }
        setInitialLoadDone(true);
    }, [router.query]);

    // Cleanup effect
    useEffect(() => {
        return () => {
            setSearchResults([]);
            setIsSearched(false);
        };
    }, []);

    // Handler functions
    const handleLocationChange = (field, value) => {
        setSearchParams(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSearch = async (overrideParams) => {
        const searchData = overrideParams || {
            originCity: searchParams.origin?.city,
            destinationCity: searchParams.destination?.city,
            departureDate: searchParams.departureDate?.format('YYYY-MM-DD'),
            seats: searchParams.seats,
            ...(searchParams.maxPrice && { maxPrice: searchParams.maxPrice }),
            ...(searchParams.luggageSize && { allowedLuggage: searchParams.luggageSize })
        };

        // Validate required fields
        if (!overrideParams && (!searchData.originCity || !searchData.destinationCity || !searchData.departureDate)) {
            message.error('Please fill in all required fields');
            return;
        }

        try {
          //  console.log('Searching with params:', searchData);
            const result = await searchRideOffers(searchData, userLocation);
         //   console.log('Search result:', result);

            if (result.success) {
                setSearchResults(result.rideOffers);
                setIsSearched(true);

                // Only update URL if it's a new search (not from URL params)
                if (!overrideParams) {
                    router.push({
                        pathname: '/ride/find-ride',
                        query: {
                            originCity: searchData.originCity,
                            destinationCity: searchData.destinationCity,
                            date: searchData.departureDate,
                            seats: searchData.seats
                        }
                    }, undefined, { shallow: true });
                }
            } else {
                message.error(result.message || 'Failed to search rides');
            }
        } catch (error) {
            console.error('Search error:', error);
            message.error('An error occurred while searching rides');
        }
    };

    const handleRideSelect = (rideId) => {
        router.push(`/ride/details/${rideId}`);
    };
    // Render search form
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
                        label="From"
                        required
                        className={styles.locationField}
                    >
                        <LocationInput
                            value={searchParams.origin}
                            onChange={(value) => handleLocationChange('origin', value)}
                            placeholder="Enter pickup location"
                        />
                    </Form.Item>

                    <div className={styles.arrowIcon}>
                        <ArrowRight />
                    </div>

                    <Form.Item
                        label="To"
                        required
                        className={styles.locationField}
                    >
                        <LocationInput
                            value={searchParams.destination}
                            onChange={(value) => handleLocationChange('destination', value)}
                            placeholder="Enter destination"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Date"
                        required
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

                    <Form.Item
                        label="Seats"
                        className={styles.seatsField}
                    >
                        <InputNumber
                            min={1}
                            max={8}
                            value={searchParams.seats}
                            onChange={(value) => setSearchParams(prev => ({ ...prev, seats: value }))}
                            className={styles.seatsInput}
                        />
                    </Form.Item>

                    <Button
                        type="primary"
                        icon={<Search />}
                        onClick={() => handleSearch()}
                        loading={loading}
                        className={styles.searchButton}
                    >
                        Search
                    </Button>
                </div>

                {/* Advanced Filters Section */}
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
                            <Form.Item
                                label="Maximum Price"
                                className={styles.filterField}
                            >
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
                        </motion.div>
                    )}
                </div>
            </Form>
        </motion.div>
    );
    // Render search results
    const renderSearchResults = () => {
        if (loadingLocation) {
            return (
                <div className={styles.loadingState}>
                    <Spin size="large" />
                    <p>Finding rides near you...</p>
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

        if (loading) {
            return (
                <div className={styles.loadingState}>
                    <Spin size="large" />
                    <p>Searching for rides...</p>
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
                    {isSearched && searchResults === nearbyRides ? 
                        'Nearby Rides' : 
                        'Available Rides'} ({searchResults.length})
                </h2>
                <div className={styles.resultsList}>
                    {searchResults.map((ride) => (
                        <motion.div
                            key={ride._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className={styles.rideCard}
                            onClick={() => handleRideSelect(ride._id)}
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
                                        <Calendar className={styles.infoIcon} />
                                        <span>
                                            {moment(ride.departureDate).format('ddd, MMM D, YYYY')} at {ride.departureTime}
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
    // Main render
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

// Export the component
export default FindRide;