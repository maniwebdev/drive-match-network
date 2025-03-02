// pages/offer-ride.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/Auth/AuthContext';
import { useRide } from '../../context/Ride/RideContext';
import { message, Steps, Button, Form, DatePicker, InputNumber, Select, Switch, Input } from 'antd';
import { Car, MapPin, Calendar, Clock, Users, DollarSign, Package, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import moment from 'moment';
import Navbar from '../../components/Navigation/Navbar';
import styles from '../../styles/Rides/offerRide.module.css';
import TimeSelect from '../../components/Rides/TimeSelect';

const { Step } = Steps;
const { Option } = Select;

const OfferRide = () => {
    const router = useRouter();
    const { currentUser, fetchCurrentUser } = useAuth();
    const { createRideOffer, loading } = useRide();
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);

    const [offerData, setOfferData] = useState({
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
        waypoints: [],
        departureDate: null,
        departureTime: '',
        availableSeats: 1,
        pricePerSeat: 0,
        estimatedDuration: 0,
        allowedLuggage: 'medium',
        smoking: false,
        pets: false,
        vehicle: currentUser?.vehicle || null
    });

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (!currentUser?.isDriver) {
            message.error('Only verified drivers can offer rides');
            //  router.push('/user/profile');
        }
    }, [currentUser, router]);

    const handleDateChange = date => {
        setSelectedDate(date);
        if (date) {
            setOfferData(prev => ({
                ...prev,
                departureDate: date.format('YYYY-MM-DD')
            }));
        }
    };

    const handleTimeChange = time => {
        setSelectedTime(time);
        if (time) {
            // Extract time in HH:MM format
            let timeString;
            if (typeof time === 'string') {
                // If time is already a string in HH:MM format
                timeString = time;
            } else {
                // If time is a moment object
                timeString = time.format('HH:mm');
            }

            setOfferData(prev => ({
                ...prev,
                departureTime: timeString
            }));
        }
    };

    const handleOriginChange = (location) => {
        setOfferData({
            ...offerData,
            origin: {
                address: location.address || '',
                city: location.city || '',
                zipCode: location.zipCode || ''
            }
        });
    };

    const handleDestinationChange = (location) => {
        setOfferData({
            ...offerData,
            destination: {
                address: location.address || '',
                city: location.city || '',
                zipCode: location.zipCode || ''
            }
        });
    };

    const handleWaypointChange = (index, location) => {
        const newWaypoints = [...offerData.waypoints];
        newWaypoints[index] = {
            address: location.address || '',
            city: location.city || '',
            zipCode: location.zipCode || ''
        };
        setOfferData({
            ...offerData,
            waypoints: newWaypoints
        });
    };

    const validateCurrentStep = () => {
        switch (currentStep) {
            case 0:
                if (!offerData.origin.address || !offerData.origin.city || !offerData.origin.zipCode ||
                    !offerData.destination.address || !offerData.destination.city || !offerData.destination.zipCode) {
                    message.error('Please fill in all required route information');
                    return false;
                }
                if (!currentUser?.vehicle) {
                    message.error('Please add a vehicle in your profile first');
                    return false;
                }
                return true;

            case 1:
                if (!offerData.departureDate || !offerData.departureTime || !offerData.estimatedDuration) {
                    message.error('Please fill in all schedule information');
                    return false;
                }

                // Combine date and time for validation
                const selectedDateTime = moment(`${offerData.departureDate} ${offerData.departureTime}`, 'YYYY-MM-DD HH:mm');

                if (selectedDateTime.isBefore(moment().subtract(5, 'minutes'))) {
                    message.error('Departure time must be at least 5 minutes in the future');
                    return false;
                }
                return true;

            case 2:
                if (!offerData.availableSeats || !offerData.pricePerSeat) {
                    message.error('Please specify seats and price');
                    return false;
                }
                if (offerData.availableSeats > currentUser?.vehicle?.capacity) {
                    message.error(`Available seats cannot exceed vehicle capacity (${currentUser.vehicle.capacity})`);
                    return false;
                }
                return true;

            default:
                return true;
        }
    };

    const handleNext = () => {
        if (validateCurrentStep()) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        setCurrentStep(currentStep - 1);
    };

    const handleSubmit = async () => {
        try {
            if (!validateCurrentStep()) {
                return;
            }

            if (!currentUser?.vehicle) {
                message.error('Vehicle information is required');
                return;
            }

            const formattedData = {
                ...offerData,
                vehicle: {
                    model: currentUser.vehicle.model,
                    year: currentUser.vehicle.year,
                    plateNumber: currentUser.vehicle.plateNumber,
                    capacity: currentUser.vehicle.capacity
                },
                waypoints: offerData.waypoints.filter(wp =>
                    wp.address && wp.city && wp.zipCode
                )
            };

            const result = await createRideOffer(formattedData);

            if (result.success) {
                message.success('Ride offer created successfully!');
                router.push('/ride/my-offers');
            } else {
                message.error(result.message || 'Failed to create ride offer');
            }
        } catch (error) {
            console.error('Submit error:', error);
            message.error('An error occurred while creating the ride offer');
        }
    };

    const steps = [
        {
            title: 'Route',
            icon: <MapPin className={styles.stepIcon} />,
            content: (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={styles.stepContent}
                >
                    <div className={styles.vehicleInfo}>
                        <h3 className={styles.sectionTitle}>Your Vehicle</h3>
                        <div className={styles.vehicleDetails}>
                            {currentUser?.vehicle ? (
                                <div className={styles.vehicleItem}>
                                    <Car className={styles.vehicleIcon} />
                                    <div>
                                        <p className={styles.vehicleModel}>
                                            {currentUser.vehicle.model} ({currentUser.vehicle.year})
                                        </p>
                                        <p className={styles.vehiclePlate}>
                                            {currentUser.vehicle.plateNumber}
                                        </p>
                                        <p className={styles.vehicleCapacity}>
                                            Capacity: {currentUser.vehicle.capacity} seats
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.noVehicle}>
                                    <p>Please add a vehicle in your profile first</p>
                                    <Button
                                        type="primary"
                                        onClick={() => router.push('/user/profile')}
                                        className={styles.verificationButton}
                                    >
                                        Add Vehicle
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <Form.Item
                        label="Pickup Location"
                        required
                        className={styles.formItem}
                    >
                        <div className={styles.locationGroup}>
                            <Input
                                placeholder="Address"
                                value={offerData.origin.address}
                                onChange={(e) => handleOriginChange({
                                    ...offerData.origin,
                                    address: e.target.value
                                })}
                                className={styles.input}
                            />
                            <Input
                                placeholder="City"
                                value={offerData.origin.city}
                                onChange={(e) => handleOriginChange({
                                    ...offerData.origin,
                                    city: e.target.value
                                })}
                                className={styles.input}
                            />
                            <Input
                                placeholder="Zip Code"
                                value={offerData.origin.zipCode}
                                onChange={(e) => handleOriginChange({
                                    ...offerData.origin,
                                    zipCode: e.target.value
                                })}
                                className={styles.input}
                            />
                        </div>
                    </Form.Item>

                    <Form.Item
                        label="Drop-off Location"
                        required
                        className={styles.formItem}
                    >
                        <div className={styles.locationGroup}>
                            <Input
                                placeholder="Address"
                                value={offerData.destination.address}
                                onChange={(e) => handleDestinationChange({
                                    ...offerData.destination,
                                    address: e.target.value
                                })}
                                className={styles.input}
                            />
                            <Input
                                placeholder="City"
                                value={offerData.destination.city}
                                onChange={(e) => handleDestinationChange({
                                    ...offerData.destination,
                                    city: e.target.value
                                })}
                                className={styles.input}
                            />
                            <Input
                                placeholder="Zip Code"
                                value={offerData.destination.zipCode}
                                onChange={(e) => handleDestinationChange({
                                    ...offerData.destination,
                                    zipCode: e.target.value
                                })}
                                className={styles.input}
                            />
                        </div>
                    </Form.Item>
                    <div className={styles.waypointsSection}>
                        <h3 className={styles.sectionTitle}>Add Stops (Optional)</h3>
                        <Button
                            type="dashed"
                            className={styles.addWaypointButton}
                            onClick={() => {
                                setOfferData({
                                    ...offerData,
                                    waypoints: [...offerData.waypoints, {
                                        address: '',
                                        city: '',
                                        zipCode: ''
                                    }]
                                });
                            }}
                        >
                            Add Stop
                        </Button>

                        {offerData.waypoints.map((waypoint, index) => (
                            <div key={index} className={styles.waypointItem}>
                                <div className={styles.locationGroup}>
                                    <Input
                                        placeholder="Address"
                                        value={waypoint.address}
                                        onChange={(e) => handleWaypointChange(index, {
                                            ...waypoint,
                                            address: e.target.value
                                        })}
                                        className={styles.input}
                                    />
                                    <Input
                                        placeholder="City"
                                        value={waypoint.city}
                                        onChange={(e) => handleWaypointChange(index, {
                                            ...waypoint,
                                            city: e.target.value
                                        })}
                                        className={styles.input}
                                    />
                                    <Input
                                        placeholder="Zip Code"
                                        value={waypoint.zipCode}
                                        onChange={(e) => handleWaypointChange(index, {
                                            ...waypoint,
                                            zipCode: e.target.value
                                        })}
                                        className={styles.input}
                                    />
                                </div>
                                <Button
                                    danger
                                    onClick={() => {
                                        const newWaypoints = offerData.waypoints.filter((_, i) => i !== index);
                                        setOfferData({ ...offerData, waypoints: newWaypoints });
                                    }}
                                >
                                    Remove
                                </Button>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )
        },
        {
            title: 'Schedule',
            icon: <Calendar className={styles.stepIcon} />,
            content: (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={styles.stepContent}
                >
                    <div className={styles.datetimeContainer}>
                        <Form.Item
                            label="Departure Date"
                            required
                            className={styles.formItem}
                        >
                            <DatePicker
                                format="YYYY-MM-DD"
                                className={styles.dateInput}
                                value={selectedDate}
                                onChange={handleDateChange}
                                disabledDate={(current) =>
                                    current && current < moment().startOf('day')
                                }
                            />
                        </Form.Item>

                        <Form.Item
                            label="Departure Time"
                            required
                            className={styles.formItem}
                        >
                            <TimeSelect
                                value={selectedTime}
                                onChange={(time) => {
                                    // Pass the time string directly to our handler
                                    handleTimeChange(time);
                                }}
                                className={styles.timeInput}
                                currentDate={selectedDate}
                            />
                        </Form.Item>
                    </div>

                    <Form.Item
                        label="Estimated Duration (minutes)"
                        required
                        className={styles.formItem}
                    >
                        <InputNumber
                            min={1}
                            className={styles.durationInput}
                            value={offerData.estimatedDuration}
                            onChange={(value) => setOfferData({ ...offerData, estimatedDuration: value })}
                        />
                    </Form.Item>
                </motion.div>
            )
        },
        {
            title: 'Seats & Price',
            icon: <Users className={styles.stepIcon} />,
            content: (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={styles.stepContent}
                >
                    <Form.Item
                        label="Available Seats"
                        required
                        className={styles.formItem}
                    >
                        <InputNumber
                            min={1}
                            max={currentUser?.vehicle?.capacity || 8}
                            className={styles.seatsInput}
                            value={offerData.availableSeats}
                            onChange={(value) => setOfferData({ ...offerData, availableSeats: value })}
                        />
                        <div className={styles.helperText}>
                            Maximum {currentUser?.vehicle?.capacity || 8} seats based on your vehicle capacity
                        </div>
                    </Form.Item>

                    <Form.Item
                        label="Price per Seat"
                        required
                        className={styles.formItem}
                    >
                        <InputNumber
                            min={0}
                            prefix={<DollarSign className={styles.inputIcon} />}
                            className={styles.priceInput}
                            value={offerData.pricePerSeat}
                            onChange={(value) => setOfferData({ ...offerData, pricePerSeat: value })}
                        />
                    </Form.Item>

                    <div className={styles.pricingInfo}>
                        <h4>Total Potential Earnings</h4>
                        <p className={styles.earnings}>
                            ${(offerData.pricePerSeat * offerData.availableSeats).toFixed(2)}
                        </p>
                        <p className={styles.earningsNote}>
                            Based on full occupancy
                        </p>
                    </div>
                </motion.div>
            )
        },
        {
            title: 'Preferences',
            icon: <Info className={styles.stepIcon} />,
            content: (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={styles.stepContent}
                >
                    <Form.Item
                        label="Allowed Luggage Size"
                        className={styles.formItem}
                    >
                        <Select
                            value={offerData.allowedLuggage}
                            onChange={(value) => setOfferData({ ...offerData, allowedLuggage: value })}
                            className={styles.select}
                        >
                            <Option value="small">Small (Backpack)</Option>
                            <Option value="medium">Medium (Carry-on)</Option>
                            <Option value="large">Large (Suitcase)</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Smoking Allowed"
                        className={styles.formItem}
                    >
                        <div className={styles.preferenceItem}>
                            <Switch
                                checked={offerData.smoking}
                                onChange={(checked) => setOfferData({ ...offerData, smoking: checked })}
                                className={styles.switch}
                            />
                            <span className={styles.preferenceDescription}>
                                Allow smoking during the ride
                            </span>
                        </div>
                    </Form.Item>

                    <Form.Item
                        label="Pets Allowed"
                        className={styles.formItem}
                    >
                        <div className={styles.preferenceItem}>
                            <Switch
                                checked={offerData.pets}
                                onChange={(checked) => setOfferData({ ...offerData, pets: checked })}
                                className={styles.switch}
                            />
                            <span className={styles.preferenceDescription}>
                                Allow passengers to bring pets
                            </span>
                        </div>
                    </Form.Item>
                </motion.div>
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
                    <h1 className={styles.pageTitle}>Offer a Ride</h1>

                    {!currentUser?.isDriver ? (
                        <div className={styles.driverVerificationRequired}>
                            <Car className={styles.verificationIcon} />
                            <h2>Driver Verification Required</h2>
                            <p>You need to be a verified driver to offer rides.</p>
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
                            <div className={styles.stepsContainer}>
                                <Steps current={currentStep}>
                                    {steps.map(step => (
                                        <Step
                                            key={step.title}
                                            title={step.title}
                                            icon={step.icon}
                                            className={styles.step}
                                        />
                                    ))}
                                </Steps>
                            </div>

                            <div className={styles.formContainer}>
                                {steps[currentStep].content}

                                <div className={styles.buttonContainer}>
                                    {currentStep > 0 && (
                                        <Button
                                            onClick={handlePrev}
                                            className={styles.prevButton}
                                        >
                                            Previous
                                        </Button>
                                    )}
                                    {currentStep < steps.length - 1 && (
                                        <Button
                                            type="primary"
                                            onClick={handleNext}
                                            className={styles.nextButton}
                                        >
                                            Next
                                        </Button>
                                    )}
                                    {currentStep === steps.length - 1 && (
                                        <Button
                                            type="primary"
                                            onClick={handleSubmit}
                                            loading={loading}
                                            className={styles.submitButton}
                                        >
                                            Create Offer
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>
        </>
    );
};

export default OfferRide;