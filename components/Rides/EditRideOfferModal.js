// //component/EditRideOfferModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Steps, Button, Form, DatePicker, InputNumber, Select, Input, message } from 'antd';
import { MapPin, Calendar, Users, Package, DollarSign, Car } from 'lucide-react';
import moment from 'moment';
import styles from '../../styles/Trips/EditTripModal.module.css';
import { useRide } from '../../context/Ride/RideContext';

const { Step } = Steps;
const { Option } = Select;

const EditRideOfferModal = ({ offer, visible, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const { updateRideOffer } = useRide();
    const [currentStep, setCurrentStep] = useState(0);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTime, setSelectedTime] = useState(null);

    const [rideData, setRideData] = useState({
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
        vehicle: {
            model: '',
            year: null,
            plateNumber: '',
            capacity: null
        },
        departureDateTime: null,
        availableSeats: 1,
        pricePerSeat: 0,
        allowedLuggage: 'medium',
        smoking: false,
        pets: false,
        estimatedDuration: 0
    });

    // Initialize form data when modal opens
    useEffect(() => {
        if (offer && visible) {
            const departureMoment = moment(offer.departureDateTime);

            setCurrentStep(0);
            setSelectedDate(departureMoment);
            setSelectedTime(departureMoment);

            setRideData({
                origin: {
                    address: offer.origin.address || '',
                    city: offer.origin.city || '',
                    zipCode: offer.origin.zipCode || ''
                },
                destination: {
                    address: offer.destination.address || '',
                    city: offer.destination.city || '',
                    zipCode: offer.destination.zipCode || ''
                },
                vehicle: {
                    model: offer.vehicle?.model || '',
                    year: offer.vehicle?.year || null,
                    plateNumber: offer.vehicle?.plateNumber || '',
                    capacity: offer.vehicle?.capacity || null
                },
                departureDateTime: departureMoment,
                availableSeats: offer.availableSeats || 1,
                pricePerSeat: offer.pricePerSeat || 0,
                allowedLuggage: offer.allowedLuggage || 'medium',
                smoking: offer.smoking || false,
                pets: offer.pets || false,
                estimatedDuration: offer.estimatedDuration || 0
            });
        }
    }, [offer, visible]);
    // Date and Time handlers
    const handleDateTimeChange = (date, time) => {
        if (date && time) {
            const combinedDateTime = moment(date.format('YYYY-MM-DD'))
                .set({
                    hour: time.hour(),
                    minute: time.minute(),
                    second: 0
                });

            if (combinedDateTime.isValid()) {
                setRideData(prev => ({
                    ...prev,
                    departureDateTime: combinedDateTime
                }));
            }
        }
    };

    const handleDateChange = date => {
        setSelectedDate(date);
        if (date && selectedTime) {
            handleDateTimeChange(date, selectedTime);
        }
    };

    const handleTimeChange = time => {
        setSelectedTime(time);
        if (selectedDate && time) {
            handleDateTimeChange(selectedDate, time);
        }
    };

    // Location handlers
    const handleOriginChange = (field, value) => {
        setRideData(prev => ({
            ...prev,
            origin: {
                ...prev.origin,
                [field]: value
            }
        }));
    };

    const handleDestinationChange = (field, value) => {
        setRideData(prev => ({
            ...prev,
            destination: {
                ...prev.destination,
                [field]: value
            }
        }));
    };

    // Vehicle handlers
    const handleVehicleChange = (field, value) => {
        setRideData(prev => ({
            ...prev,
            vehicle: {
                ...prev.vehicle,
                [field]: value
            }
        }));
    };

    // Validation functions
    const validateLocation = (location, type) => {
        if (!location.address?.trim()) {
            message.error(`${type} address is required`);
            return false;
        }
        if (!location.city?.trim()) {
            message.error(`${type} city is required`);
            return false;
        }
        if (!location.zipCode?.trim() || !/^\d{5}(-\d{4})?$/.test(location.zipCode)) {
            message.error(`Valid ${type} zip code is required`);
            return false;
        }
        return true;
    };

    const validateVehicle = () => {
        const { vehicle } = rideData;
        if (!vehicle.model?.trim()) {
            message.error('Vehicle model is required');
            return false;
        }
        if (!vehicle.year || vehicle.year < 1900 || vehicle.year > new Date().getFullYear() + 1) {
            message.error('Invalid vehicle year');
            return false;
        }
        if (!vehicle.plateNumber?.trim()) {
            message.error('Vehicle plate number is required');
            return false;
        }
        if (!vehicle.capacity || vehicle.capacity < 1 || vehicle.capacity > 8) {
            message.error('Vehicle capacity must be between 1 and 8');
            return false;
        }
        return true;
    };

    // Step validation
    const validateCurrentStep = () => {
        switch (currentStep) {
            case 0: // Vehicle and Route
                if (!validateVehicle()) return false;
                if (!validateLocation(rideData.origin, 'Origin')) return false;
                if (!validateLocation(rideData.destination, 'Destination')) return false;
                return true;

            case 1: // Schedule
                if (!selectedDate || !selectedTime) {
                    message.error('Please select both date and time');
                    return false;
                }
                const selectedDateTime = moment(selectedDate.format('YYYY-MM-DD'))
                    .set({
                        hour: selectedTime.hour(),
                        minute: selectedTime.minute(),
                        second: 0
                    });
                if (selectedDateTime.isBefore(moment().subtract(5, 'minutes'))) {
                    message.error('Departure time must be at least 5 minutes in the future');
                    return false;
                }
                return true;

            case 2: // Details
                if (rideData.availableSeats < 1 || rideData.availableSeats > rideData.vehicle.capacity) {
                    message.error(`Available seats must be between 1 and ${rideData.vehicle.capacity}`);
                    return false;
                }
                if (rideData.pricePerSeat < 0) {
                    message.error('Price must be positive');
                    return false;
                }
                if (!rideData.estimatedDuration || rideData.estimatedDuration < 1) {
                    message.error('Please provide a valid estimated duration');
                    return false;
                }
                return true;

            default:
                return true;
        }
    };
    // Navigation handlers
    const handleNext = () => validateCurrentStep() && setCurrentStep(prev => prev + 1);
    const handlePrev = () => setCurrentStep(prev => prev - 1);

    // Form submission
    const handleSubmit = async () => {
        if (!validateCurrentStep()) return;

        try {
            if (!offer._id) {
                throw new Error('No ride offer ID available');
            }

            // Create a new moment object for submission
            const submissionDateTime = moment(selectedDate.format('YYYY-MM-DD'))
                .set({
                    hour: selectedTime.hour(),
                    minute: selectedTime.minute(),
                    second: 0
                });

            const updatePayload = {
                ...rideData,
                departureDateTime: submissionDateTime.toISOString(),
            };

            const result = await updateRideOffer(offer._id, updatePayload);

            if (result.success) {
                message.success('Ride updated successfully!');
                onSuccess();
            } else {
                throw new Error(result.message || 'Update failed');
            }
        } catch (error) {
            console.error('Update error:', error);
            message.error(error.message || 'Error updating ride');
        }
    };

    // Step configurations
    const steps = [
        {
            title: 'Route',
            icon: <MapPin className={styles.stepIcon} />,
            content: (
                <div className={styles.stepContent}>
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Pickup Location</h3>
                        <Form.Item label="Address" required>
                            <Input
                                value={rideData.origin.address}
                                onChange={e => handleOriginChange('address', e.target.value)}
                                placeholder="Enter pickup address"
                            />
                        </Form.Item>

                        <Form.Item label="City" required>
                            <Input
                                value={rideData.origin.city}
                                onChange={e => handleOriginChange('city', e.target.value)}
                                placeholder="Enter city"
                            />
                        </Form.Item>

                        <Form.Item label="Zip Code" required>
                            <Input
                                value={rideData.origin.zipCode}
                                onChange={e => handleOriginChange('zipCode', e.target.value)}
                                placeholder="Enter zip code"
                            />
                        </Form.Item>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Drop-off Location</h3>
                        <Form.Item label="Address" required>
                            <Input
                                value={rideData.destination.address}
                                onChange={e => handleDestinationChange('address', e.target.value)}
                                placeholder="Enter drop-off address"
                            />
                        </Form.Item>

                        <Form.Item label="City" required>
                            <Input
                                value={rideData.destination.city}
                                onChange={e => handleDestinationChange('city', e.target.value)}
                                placeholder="Enter city"
                            />
                        </Form.Item>

                        <Form.Item label="Zip Code" required>
                            <Input
                                value={rideData.destination.zipCode}
                                onChange={e => handleDestinationChange('zipCode', e.target.value)}
                                placeholder="Enter zip code"
                            />
                        </Form.Item>
                    </div>
                </div>
            )
        },
        {
            title: 'Schedule',
            icon: <Calendar className={styles.stepIcon} />,
            content: (
                <div className={styles.stepContent}>
                    <div className={styles.datetimeContainer}>
                        <Form.Item label="Departure Date" required>
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

                        <Form.Item label="Departure Time" required>
                            <DatePicker
                                picker="time"
                                format="HH:mm"
                                className={styles.timeInput}
                                value={selectedTime}
                                onChange={handleTimeChange}
                                disabledTime={(current) => {
                                    if (selectedDate?.isSame(moment(), 'day')) {
                                        const now = moment();
                                        return {
                                            disabledHours: () =>
                                                Array.from({ length: now.hour() }, (_, i) => i),
                                            disabledMinutes: (selectedHour) =>
                                                selectedHour === now.hour() ?
                                                    Array.from({ length: now.minute() + 1 }, (_, i) => i) : []
                                        };
                                    }
                                    return {};
                                }}
                            />
                        </Form.Item>

                        <Form.Item label="Estimated Duration (minutes)" required>
                            <InputNumber
                                min={1}
                                value={rideData.estimatedDuration}
                                onChange={value => setRideData(prev => ({
                                    ...prev,
                                    estimatedDuration: value
                                }))}
                                placeholder="Enter estimated duration"
                            />
                        </Form.Item>
                    </div>
                </div>
            )
        },
        {
            title: 'Details',
            icon: <Users className={styles.stepIcon} />,
            content: (
                <div className={styles.stepContent}>
                    <Form.Item label="Available Seats" required>
                        <InputNumber
                            min={1}
                            max={rideData.vehicle.capacity || 8}
                            value={rideData.availableSeats}
                            onChange={value => setRideData(prev => ({
                                ...prev,
                                availableSeats: value
                            }))}
                        />
                    </Form.Item>

                    <Form.Item label="Price Per Seat" required>
                        <InputNumber
                            min={0}
                            value={rideData.pricePerSeat}
                            onChange={value => setRideData(prev => ({
                                ...prev,
                                pricePerSeat: value
                            }))}
                            prefix={<DollarSign className={styles.icon} />}
                        />
                    </Form.Item>

                    <Form.Item label="Luggage Size">
                        <Select
                            value={rideData.allowedLuggage}
                            onChange={value => setRideData(prev => ({
                                ...prev,
                                allowedLuggage: value
                            }))}
                        >
                            <Option value="small">Small</Option>
                            <Option value="medium">Medium</Option>
                            <Option value="large">Large</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Smoking Allowed">
                        <Select
                            value={rideData.smoking}
                            onChange={value => setRideData(prev => ({
                                ...prev,
                                smoking: value
                            }))}
                        >
                            <Option value={true}>Yes</Option>
                            <Option value={false}>No</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Pets Allowed">
                        <Select
                            value={rideData.pets}
                            onChange={value => setRideData(prev => ({
                                ...prev,
                                pets: value
                            }))}
                        >
                            <Option value={true}>Yes</Option>
                            <Option value={false}>No</Option>
                        </Select>
                    </Form.Item>
                </div>
            )
        }
    ];

    return (
        <Modal
            key={offer._id}
            title="Edit Ride Offer"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
            className={styles.modal}
        >
            <Steps current={currentStep} className={styles.steps}>
                {steps.map(step => (
                    <Step key={step.title} title={step.title} icon={step.icon} />
                ))}
            </Steps>

            <Form form={form} layout="vertical" className={styles.form}>
                {steps[currentStep].content}

                <div className={styles.actions}>
                    {currentStep > 0 && (
                        <Button onClick={handlePrev} className={styles.prevButton}>
                            Back
                        </Button>
                    )}

                    {currentStep < steps.length - 1 ? (
                        <Button type="primary" onClick={handleNext}>
                            Next
                        </Button>
                    ) : (
                        <Button type="primary" onClick={handleSubmit}>
                            Save Changes
                        </Button>
                    )}
                </div>
            </Form>
        </Modal>
    );
};

export default EditRideOfferModal;