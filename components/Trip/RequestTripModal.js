// // components/Trip/RequestTripModal.js
import React, { useState } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useTrip } from '../../context/Ride/TripContext';
import { motion } from 'framer-motion';
import { Steps, Button, Form, DatePicker, InputNumber, Select, Input, message, Modal } from 'antd';
import { MapPin, Calendar, Users, Package, Info, Clock } from 'lucide-react';
import moment from 'moment';
import styles from '../../styles/Trips/requestTrip.module.css';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const RequestTripModal = ({ visible, onCancel, onSuccess }) => {
    const { currentUser } = useAuth();
    const { createTripRequest, loading } = useTrip();
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);

    // Updated initial state with new location structure
    const [tripData, setTripData] = useState({
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
        departureTime: '',
        numberOfSeats: 1,
        luggageSize: 'small',
        additionalNotes: '',
        recurrence: {
            pattern: 'none',
            endDate: null,
            customDays: []
        }
    });
    // Location change handlers
    const handleLocationChange = (type, field, value) => {
        setTripData(prev => ({
            ...prev,
            [type]: {
                ...prev[type],
                [field]: value
            }
        }));
    };

    // Validate zip code format
    const validateZipCode = (zipCode) => {
        return /^\d{5}(-\d{4})?$/.test(zipCode);
    };

    // Update time handlers
    const updateDepartureTime = (hours, minutes) => {
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        setTripData(prev => ({ ...prev, departureTime: timeString }));
    };

    // Validation functions
    const validateCurrentStep = () => {
        switch (currentStep) {
            case 0: // Route
                if (!tripData.origin.address || !tripData.origin.city || !tripData.origin.zipCode ||
                    !tripData.destination.address || !tripData.destination.city || !tripData.destination.zipCode) {
                    message.error('Please fill in all location fields');
                    return false;
                }
                if (!validateZipCode(tripData.origin.zipCode)) {
                    message.error('Invalid origin zip code format');
                    return false;
                }
                if (!validateZipCode(tripData.destination.zipCode)) {
                    message.error('Invalid destination zip code format');
                    return false;
                }
                return true;

            case 1: // Schedule
                if (!tripData.departureDate || !tripData.departureTime) {
                    message.error('Please fill in departure date and time');
                    return false;
                }

                const selectedDateTime = moment(tripData.departureDate)
                    .set({
                        hour: parseInt(tripData.departureTime.split(':')[0]),
                        minute: parseInt(tripData.departureTime.split(':')[1])
                    });

                // if (selectedDateTime.isBefore(moment())) {
                //     message.error('Departure time must be in the future');
                //     return false;
                // }
                // return true;

            case 2: // Details
                if (!tripData.numberOfSeats || tripData.numberOfSeats < 1 || tripData.numberOfSeats > 8) {
                    message.error('Please specify a valid number of seats (1-8)');
                    return false;
                }
                if (tripData.additionalNotes && tripData.additionalNotes.length > 500) {
                    message.error('Additional notes cannot exceed 500 characters');
                    return false;
                }
                return true;

            case 3: // Recurrence
                if (tripData.recurrence.pattern !== 'none') {
                    if (!tripData.recurrence.endDate) {
                        message.error('Please specify an end date for the recurring trip');
                        return false;
                    }
                    if (moment(tripData.recurrence.endDate).isBefore(tripData.departureDate)) {
                        message.error('End date must be after the start date');
                        return false;
                    }
                    if (tripData.recurrence.pattern === 'custom' &&
                        (!tripData.recurrence.customDays || tripData.recurrence.customDays.length === 0)) {
                        message.error('Please select at least one day for custom recurrence');
                        return false;
                    }
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
                    <div className={styles.locationSection}>
                        <h3 className={styles.sectionTitle}>Pickup Location</h3>
                        <div className={styles.locationGroup}>
                            <Form.Item
                                label="Street Address"
                                required
                                className={styles.formItem}
                            >
                                <Input
                                    placeholder="Enter street address"
                                    value={tripData.origin.address}
                                    onChange={(e) => handleLocationChange('origin', 'address', e.target.value)}
                                    className={styles.input}
                                />
                            </Form.Item>

                            <Form.Item
                                label="City"
                                required
                                className={styles.formItem}
                            >
                                <Input
                                    placeholder="Enter city"
                                    value={tripData.origin.city}
                                    onChange={(e) => handleLocationChange('origin', 'city', e.target.value)}
                                    className={styles.input}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Zip Code"
                                required
                                className={styles.formItem}
                            >
                                <Input
                                    placeholder="Enter zip code"
                                    value={tripData.origin.zipCode}
                                    onChange={(e) => handleLocationChange('origin', 'zipCode', e.target.value)}
                                    className={styles.input}
                                />
                            </Form.Item>
                        </div>
                    </div>

                    <div className={styles.locationSection}>
                        <h3 className={styles.sectionTitle}>Drop-off Location</h3>
                        <div className={styles.locationGroup}>
                            <Form.Item
                                label="Street Address"
                                required
                                className={styles.formItem}
                            >
                                <Input
                                    placeholder="Enter street address"
                                    value={tripData.destination.address}
                                    onChange={(e) => handleLocationChange('destination', 'address', e.target.value)}
                                    className={styles.input}
                                />
                            </Form.Item>

                            <Form.Item
                                label="City"
                                required
                                className={styles.formItem}
                            >
                                <Input
                                    placeholder="Enter city"
                                    value={tripData.destination.city}
                                    onChange={(e) => handleLocationChange('destination', 'city', e.target.value)}
                                    className={styles.input}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Zip Code"
                                required
                                className={styles.formItem}
                            >
                                <Input
                                    placeholder="Enter zip code"
                                    value={tripData.destination.zipCode}
                                    onChange={(e) => handleLocationChange('destination', 'zipCode', e.target.value)}
                                    className={styles.input}
                                />
                            </Form.Item>
                        </div>
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
                    <Form.Item
                        label="Departure Date"
                        required
                        className={styles.formItem}
                    >
                        <DatePicker
                            className={styles.datePicker}
                            value={tripData.departureDate}
                            onChange={(date) => setTripData({ ...tripData, departureDate: date })}
                            disabledDate={(current) => current && current < moment().startOf('day')}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Departure Time"
                        required
                        className={styles.formItem}
                    >
                        <div className={styles.timeSelectionContainer}>
                            <Select
                                placeholder="Hour"
                                className={styles.timeSelect}
                                value={tripData.departureTime ? tripData.departureTime.split(':')[0] : undefined}
                                onChange={(value) => updateDepartureTime(
                                    value,
                                    tripData.departureTime?.split(':')[1] || '00'
                                )}
                            >
                                {Array.from({ length: 24 }, (_, i) => (
                                    <Option key={i} value={i.toString().padStart(2, '0')}>
                                        {i.toString().padStart(2, '0')}
                                    </Option>
                                ))}
                            </Select>
                            <span className={styles.timeSeparator}>:</span>
                            <Select
                                placeholder="Minute"
                                className={styles.timeSelect}
                                value={tripData.departureTime ? tripData.departureTime.split(':')[1] : undefined}
                                onChange={(value) => updateDepartureTime(
                                    tripData.departureTime?.split(':')[0] || '00',
                                    value
                                )}
                            >
                                {Array.from({ length: 12 }, (_, i) => i * 5).map(minute => (
                                    <Option key={minute} value={minute.toString().padStart(2, '0')}>
                                        {minute.toString().padStart(2, '0')}
                                    </Option>
                                ))}
                            </Select>
                        </div>
                    </Form.Item>
                </motion.div>
            )
        },
        {
            title: 'Details',
            icon: <Users className={styles.stepIcon} />,
            content: (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={styles.stepContent}
                >
                    <Form.Item
                        label="Number of Seats Needed"
                        required
                        className={styles.formItem}
                    >
                        <InputNumber
                            min={1}
                            max={8}
                            className={styles.seatsInput}
                            value={tripData.numberOfSeats}
                            onChange={(value) => setTripData({ ...tripData, numberOfSeats: value })}
                        />
                        <div className={styles.helperText}>
                            Maximum 8 seats per request
                        </div>
                    </Form.Item>

                    <Form.Item
                        label="Luggage Size"
                        className={styles.formItem}
                    >
                        <Select
                            value={tripData.luggageSize}
                            onChange={(value) => setTripData({ ...tripData, luggageSize: value })}
                            className={styles.select}
                        >
                            <Option value="small">Small (Backpack)</Option>
                            <Option value="medium">Medium (Carry-on)</Option>
                            <Option value="large">Large (Suitcase)</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Additional Notes"
                        className={styles.formItem}
                    >
                        <TextArea
                            placeholder="Any special requirements or notes for the driver"
                            value={tripData.additionalNotes}
                            onChange={(e) => setTripData({ ...tripData, additionalNotes: e.target.value })}
                            rows={4}
                            maxLength={500}
                            className={styles.textArea}
                            showCount
                        />
                    </Form.Item>
                </motion.div>
            )
        },
        {
            title: 'Recurrence',
            icon: <Calendar className={styles.stepIcon} />,
            content: (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={styles.stepContent}
                >
                    <Form.Item
                        label="Recurrence Pattern"
                        className={styles.formItem}
                    >
                        <Select
                            value={tripData.recurrence.pattern}
                            onChange={(value) => setTripData({
                                ...tripData,
                                recurrence: {
                                    ...tripData.recurrence,
                                    pattern: value,
                                    customDays: value === 'custom' ? [] : tripData.recurrence.customDays,
                                    endDate: value === 'none' ? null : tripData.recurrence.endDate
                                }
                            })}
                            className={styles.select}
                        >
                            <Option value="none">No Recurrence</Option>
                            <Option value="daily">Daily</Option>
                            <Option value="weekly">Weekly</Option>
                            <Option value="weekdays">Weekdays (Mon-Fri)</Option>
                            <Option value="custom">Custom</Option>
                        </Select>
                    </Form.Item>

                    {tripData.recurrence.pattern !== 'none' && (
                        <Form.Item
                            label="Recurrence End Date"
                            required
                            className={styles.formItem}
                        >
                            <DatePicker
                                className={styles.datePicker}
                                value={tripData.recurrence.endDate}
                                onChange={(date) => setTripData({
                                    ...tripData,
                                    recurrence: {
                                        ...tripData.recurrence,
                                        endDate: date
                                    }
                                })}
                                disabledDate={(current) =>
                                    current && current < moment(tripData.departureDate).startOf('day')
                                }
                            />
                        </Form.Item>
                    )}

                    {tripData.recurrence.pattern === 'custom' && (
                        <Form.Item
                            label="Select Days"
                            required
                            className={styles.formItem}
                        >
                            <Select
                                mode="multiple"
                                value={tripData.recurrence.customDays}
                                onChange={(value) => setTripData({
                                    ...tripData,
                                    recurrence: {
                                        ...tripData.recurrence,
                                        customDays: value
                                    }
                                })}
                                className={styles.select}
                            >
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                                    .map(day => (
                                        <Option key={day} value={day}>{day}</Option>
                                    ))
                                }
                            </Select>
                        </Form.Item>
                    )}
                </motion.div>
            )
        }
    ];

    const handleSubmit = async () => {
        try {
            if (!validateCurrentStep()) return;

            const timezone = moment.tz.guess();

            // Format the data with the new location structure
            const formattedData = {
                origin: {
                    address: tripData.origin.address.trim(),
                    city: tripData.origin.city.trim(),
                    zipCode: tripData.origin.zipCode.trim()
                },
                destination: {
                    address: tripData.destination.address.trim(),
                    city: tripData.destination.city.trim(),
                    zipCode: tripData.destination.zipCode.trim()
                },
                departureDate: tripData.departureDate?.format('YYYY-MM-DD'),
                departureTime: tripData.departureTime,
                timezone,
                numberOfSeats: tripData.numberOfSeats,
                luggageSize: tripData.luggageSize,
                additionalNotes: tripData.additionalNotes.trim(),
                recurrence: tripData.recurrence.pattern !== 'none' ? {
                    pattern: tripData.recurrence.pattern,
                    endDate: tripData.recurrence.endDate?.format('YYYY-MM-DD'),
                    customDays: tripData.recurrence.pattern === 'custom' ?
                        tripData.recurrence.customDays : undefined
                } : undefined
            };

            const result = await createTripRequest(formattedData);

            if (result.success) {
                message.success('Trip request created successfully!');
                onSuccess();
                onCancel();
            } else {
                throw new Error(result.message || 'Failed to create trip request');
            }
        } catch (error) {
            console.error('Submit error:', error);
            message.error(error.message || 'An error occurred while creating the trip request');
        }
    };
    return (
        <Modal
            title={
                <div className={styles.modalHeader}>
                    <h2 className={styles.modalTitle}>Request a Trip</h2>
                    <p className={styles.modalSubtitle}>Fill in your trip details to find a driver</p>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
            className={styles.tripRequestModal}
        >
            <div className={styles.modalContainer}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.modalContent}
                >
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
                        <Form
                            form={form}
                            layout="vertical"
                            className={styles.form}
                        >
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
                                        Submit Request
                                    </Button>
                                )}
                            </div>
                        </Form>
                    </div>
                </motion.div>
            </div>
        </Modal>
    );
};

export default RequestTripModal;