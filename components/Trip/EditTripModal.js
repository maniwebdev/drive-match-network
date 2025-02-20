//components/EditTripModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Steps, Button, Form, DatePicker, InputNumber, Select, Input, message } from 'antd';
import { MapPin, Calendar, Users, Package, Info, Clock, AlertCircle } from 'lucide-react';
import moment from 'moment';
import { useTrip } from '../../context/Ride/TripContext';
import styles from '../../styles/Trips/EditTripModal.module.css';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const EditTripModal = ({ trip, visible, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const { editTripRequest, loading } = useTrip();
    const [currentStep, setCurrentStep] = useState(0);

    // Initialize trip data state
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

    // Initialize data when modal opens or trip changes
    useEffect(() => {
        if (trip && visible) {
            setTripData({
                origin: {
                    address: trip.origin.address || '',
                    city: trip.origin.city || '',
                    zipCode: trip.origin.zipCode || ''
                },
                destination: {
                    address: trip.destination.address || '',
                    city: trip.destination.city || '',
                    zipCode: trip.destination.zipCode || ''
                },
                departureDate: moment(trip.departureDate),
                departureTime: trip.departureTime || '',
                numberOfSeats: trip.numberOfSeats || 1,
                luggageSize: trip.luggageSize || 'small',
                additionalNotes: trip.additionalNotes || '',
                recurrence: {
                    pattern: trip.recurrence?.pattern || 'none',
                    endDate: trip.recurrence?.endDate ? moment(trip.recurrence.endDate) : null,
                    customDays: trip.recurrence?.customDays || []
                }
            });
            setCurrentStep(0);
        }
    }, [trip, visible]);
    // Location handlers
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

    // Location validation
    const validateLocation = (location, type) => {
        if (!location.address?.trim()) {
            message.error(`${type} address is required`);
            return false;
        }
        if (!location.city?.trim()) {
            message.error(`${type} city is required`);
            return false;
        }
        if (!location.zipCode?.trim() || !validateZipCode(location.zipCode)) {
            message.error(`Valid ${type} zip code is required`);
            return false;
        }
        return true;
    };

    // Date and time validation
    const validateDateTime = () => {
        if (!tripData.departureDate) {
            message.error('Departure date is required');
            return false;
        }

        if (!tripData.departureTime) {
            message.error('Departure time is required');
            return false;
        }

        const now = moment();
        const [hours, minutes] = tripData.departureTime.split(':').map(Number);
        const selectedDateTime = moment(tripData.departureDate)
            .hour(hours)
            .minute(minutes)
            .second(0);

        // If date is in future, any time is valid
        if (selectedDateTime.isAfter(now, 'day')) {
            return true;
        }

        // If it's today, check if time is at least 15 minutes from now
        // if (selectedDateTime.isSame(now, 'day')) {
        //     const minimumTime = moment().add(15, 'minutes');
        //     if (selectedDateTime.isBefore(minimumTime)) {
        //         message.error('For today, departure time must be at least 15 minutes from now');
        //         return false;
        //     }
        // }

        // If date is in past
        if (selectedDateTime.isBefore(now, 'day')) {
            message.error('Departure date cannot be in the past');
            return false;
        }

        return true;
    };

    // Recurrence validation
    const validateRecurrence = () => {
        if (tripData.recurrence.pattern !== 'none') {
            if (!tripData.recurrence.endDate) {
                message.error('End date is required for recurring trips');
                return false;
            }

            if (tripData.recurrence.endDate.isBefore(tripData.departureDate)) {
                message.error('End date must be after departure date');
                return false;
            }

            if (tripData.recurrence.pattern === 'custom' &&
                (!tripData.recurrence.customDays || tripData.recurrence.customDays.length === 0)) {
                message.error('Please select at least one day for custom recurrence');
                return false;
            }
        }
        return true;
    };

    // Step validation
    const validateCurrentStep = () => {
        switch (currentStep) {
            case 0: // Route
                if (!validateLocation(tripData.origin, 'Origin')) return false;
                if (!validateLocation(tripData.destination, 'Destination')) return false;
                return true;

            case 1: // Schedule
                return validateDateTime();

            case 2: // Details
                if (!tripData.numberOfSeats || tripData.numberOfSeats < 1 || tripData.numberOfSeats > 8) {
                    message.error('Number of seats must be between 1 and 8');
                    return false;
                }
                if (tripData.additionalNotes?.length > 500) {
                    message.error('Additional notes must not exceed 500 characters');
                    return false;
                }
                return true;

            case 3: // Recurrence
                return validateRecurrence();

            default:
                return true;
        }
    };

    // Navigation handlers
    const handleNext = () => {
        if (validateCurrentStep()) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        setCurrentStep(prev => prev - 1);
    };

    // Form submission
    const handleSubmit = async () => {
        try {
            if (!validateCurrentStep()) return;

            // Get client's timezone
            const timezone = moment.tz.guess();

            // Format the data for submission
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
                departureDate: tripData.departureDate.format('YYYY-MM-DD'),
                departureTime: tripData.departureTime,
                numberOfSeats: tripData.numberOfSeats,
                luggageSize: tripData.luggageSize,
                additionalNotes: tripData.additionalNotes?.trim(),
                timezone,
                recurrence: tripData.recurrence.pattern !== 'none' ? {
                    pattern: tripData.recurrence.pattern,
                    endDate: tripData.recurrence.endDate?.format('YYYY-MM-DD'),
                    customDays: tripData.recurrence.customDays
                } : undefined
            };

            const result = await editTripRequest(trip._id, formattedData);

            if (result.success) {
                message.success('Trip request updated successfully!');
                onSuccess();
            } else {
                throw new Error(result.error || 'Failed to update trip request');
            }
        } catch (error) {
            console.error('Submit error:', error);
            message.error(error.message || 'Failed to update trip request');
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
                        <Form.Item
                            label="Address"
                            required
                            className={styles.formItem}
                        >
                            <Input
                                value={tripData.origin.address}
                                onChange={e => handleLocationChange('origin', 'address', e.target.value)}
                                placeholder="Enter pickup address"
                            />
                        </Form.Item>

                        <Form.Item
                            label="City"
                            required
                            className={styles.formItem}
                        >
                            <Input
                                value={tripData.origin.city}
                                onChange={e => handleLocationChange('origin', 'city', e.target.value)}
                                placeholder="Enter city"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Zip Code"
                            required
                            className={styles.formItem}
                        >
                            <Input
                                value={tripData.origin.zipCode}
                                onChange={e => handleLocationChange('origin', 'zipCode', e.target.value)}
                                placeholder="Enter zip code"
                            />
                        </Form.Item>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Drop-off Location</h3>
                        <Form.Item
                            label="Address"
                            required
                            className={styles.formItem}
                        >
                            <Input
                                value={tripData.destination.address}
                                onChange={e => handleLocationChange('destination', 'address', e.target.value)}
                                placeholder="Enter drop-off address"
                            />
                        </Form.Item>

                        <Form.Item
                            label="City"
                            required
                            className={styles.formItem}
                        >
                            <Input
                                value={tripData.destination.city}
                                onChange={e => handleLocationChange('destination', 'city', e.target.value)}
                                placeholder="Enter city"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Zip Code"
                            required
                            className={styles.formItem}
                        >
                            <Input
                                value={tripData.destination.zipCode}
                                onChange={e => handleLocationChange('destination', 'zipCode', e.target.value)}
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
                    <Form.Item
                        label="Departure Date"
                        required
                        className={styles.formItem}
                    >
                        <DatePicker
                            className={styles.datePicker}
                            value={tripData.departureDate}
                            onChange={(date) => setTripData(prev => ({
                                ...prev,
                                departureDate: date
                            }))}
                            disabledDate={(current) => current && current < moment().startOf('day')}
                            format="YYYY-MM-DD"
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
                                value={tripData.departureTime.split(':')[0]}
                                onChange={(value) => {
                                    const minutes = tripData.departureTime.split(':')[1] || '00';
                                    setTripData(prev => ({
                                        ...prev,
                                        departureTime: `${value}:${minutes}`
                                    }));
                                }}
                            >
                                {Array.from({ length: 24 }, (_, i) => {
                                    // Only apply time restrictions if it's today
                                    if (tripData.departureDate?.isSame(moment(), 'day')) {
                                        const currentHour = moment().hour();
                                        const minimumHour = moment().add(15, 'minutes').hour();
                                        if (i < minimumHour) return null;
                                    }
                                    return (
                                        <Option key={i} value={i.toString().padStart(2, '0')}>
                                            {i.toString().padStart(2, '0')}
                                        </Option>
                                    );
                                }).filter(Boolean)}
                            </Select>
                            <span className={styles.timeSeparator}>:</span>
                            <Select
                                placeholder="Minute"
                                className={styles.timeSelect}
                                value={tripData.departureTime.split(':')[1]}
                                onChange={(value) => {
                                    const hours = tripData.departureTime.split(':')[0] || '00';
                                    setTripData(prev => ({
                                        ...prev,
                                        departureTime: `${hours}:${value}`
                                    }));
                                }}
                            >
                                {Array.from({ length: 12 }, (_, i) => {
                                    const minute = i * 5;
                                    // Only apply minute restrictions if it's today and current hour
                                    if (tripData.departureDate?.isSame(moment(), 'day') &&
                                        parseInt(tripData.departureTime.split(':')[0]) === moment().hour()) {
                                        const currentMinute = moment().minute();
                                        const minimumMinute = moment().add(15, 'minutes').minute();
                                        if (minute <= minimumMinute) return null;
                                    }
                                    return (
                                        <Option key={minute} value={minute.toString().padStart(2, '0')}>
                                            {minute.toString().padStart(2, '0')}
                                        </Option>
                                    );
                                }).filter(Boolean)}
                            </Select>
                        </div>
                    </Form.Item>
                </div>
            )
        },
        {
            title: 'Details',
            icon: <Users className={styles.stepIcon} />,
            content: (
                <div className={styles.stepContent}>
                    <Form.Item
                        label="Number of Seats Needed"
                        required
                        className={styles.formItem}
                    >
                        <InputNumber
                            min={1}
                            max={8}
                            value={tripData.numberOfSeats}
                            onChange={(value) => setTripData(prev => ({
                                ...prev,
                                numberOfSeats: value
                            }))}
                            className={styles.numberInput}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Luggage Size"
                        className={styles.formItem}
                    >
                        <Select
                            value={tripData.luggageSize}
                            onChange={(value) => setTripData(prev => ({
                                ...prev,
                                luggageSize: value
                            }))}
                            className={styles.select}
                        >
                            <Option value="small">
                                <Package size={16} className={styles.optionIcon} />
                                Small (Backpack)
                            </Option>
                            <Option value="medium">
                                <Package size={16} className={styles.optionIcon} />
                                Medium (Carry-on)
                            </Option>
                            <Option value="large">
                                <Package size={16} className={styles.optionIcon} />
                                Large (Suitcase)
                            </Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Additional Notes"
                        className={styles.formItem}
                    >
                        <TextArea
                            value={tripData.additionalNotes}
                            onChange={(e) => setTripData(prev => ({
                                ...prev,
                                additionalNotes: e.target.value
                            }))}
                            placeholder="Any special requirements or notes"
                            maxLength={500}
                            showCount
                            rows={4}
                            className={styles.textArea}
                        />
                    </Form.Item>
                </div>
            )
        },
        {
            title: 'Recurrence',
            icon: <Calendar className={styles.stepIcon} />,
            content: (
                <div className={styles.stepContent}>
                    <Form.Item
                        label="Recurrence Pattern"
                        className={styles.formItem}
                    >
                        <Select
                            value={tripData.recurrence.pattern}
                            onChange={(value) => setTripData(prev => ({
                                ...prev,
                                recurrence: {
                                    ...prev.recurrence,
                                    pattern: value,
                                    customDays: value === 'custom' ? prev.recurrence.customDays : []
                                }
                            }))}
                            className={styles.select}
                        >
                            <Option value="none">No Recurrence</Option>
                            <Option value="daily">Daily</Option>
                            <Option value="weekly">Weekly</Option>
                            <Option value="weekdays">Weekdays (Mon-Fri)</Option>
                            <Option value="custom">Custom Days</Option>
                        </Select>
                    </Form.Item>

                    {tripData.recurrence.pattern !== 'none' && (
                        <Form.Item
                            label="End Date"
                            required
                            className={styles.formItem}
                        >
                            <DatePicker
                                className={styles.datePicker}
                                value={tripData.recurrence.endDate}
                                onChange={(date) => setTripData(prev => ({
                                    ...prev,
                                    recurrence: {
                                        ...prev.recurrence,
                                        endDate: date
                                    }
                                }))}
                                disabledDate={(current) =>
                                    current && current.isBefore(tripData.departureDate, 'day')
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
                                onChange={(values) => setTripData(prev => ({
                                    ...prev,
                                    recurrence: {
                                        ...prev.recurrence,
                                        customDays: values
                                    }
                                }))}
                                className={styles.select}
                                placeholder="Select days of the week"
                            >
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                                    .map(day => (
                                        <Option key={day} value={day}>
                                            {day}
                                        </Option>
                                    ))
                                }
                            </Select>
                        </Form.Item>
                    )}
                </div>
            )
        }
    ];
    return (
        <Modal
            title="Edit Trip Request"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
            className={styles.modal}
            destroyOnClose
        >
            <div className={styles.modalContent}>
                <Steps current={currentStep} className={styles.steps}>
                    {steps.map(step => (
                        <Step
                            key={step.title}
                            title={step.title}
                            icon={step.icon}
                        />
                    ))}
                </Steps>

                <Form
                    form={form}
                    layout="vertical"
                    className={styles.form}
                >
                    <div className={styles.formContent}>
                        {steps[currentStep].content}
                    </div>

                    <div className={styles.buttonContainer}>
                        {currentStep > 0 && (
                            <Button
                                onClick={handlePrev}
                                className={styles.prevButton}
                                icon={<AlertCircle size={16} />}
                            >
                                Previous
                            </Button>
                        )}

                        {currentStep < steps.length - 1 ? (
                            <Button
                                type="primary"
                                onClick={handleNext}
                                className={styles.nextButton}
                            >
                                Next
                            </Button>
                        ) : (
                            <Button
                                type="primary"
                                onClick={handleSubmit}
                                loading={loading}
                                className={styles.submitButton}
                            >
                                Update Trip
                            </Button>
                        )}
                    </div>
                </Form>
            </div>
        </Modal>
    );
};

export default EditTripModal;