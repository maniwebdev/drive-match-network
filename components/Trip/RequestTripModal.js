// components/Trip/RequestTripModal.js
import React, { useState } from 'react';
import { useAuth } from '../../context/Auth/AuthContext';
import { useTrip } from '../../context/Ride/TripContext';
import { motion } from 'framer-motion';
import { Steps, Button, Form, DatePicker, InputNumber, Select, Input, message, Modal } from 'antd';
import { MapPin, Calendar, Users, Package, Info, Clock } from 'lucide-react';
import moment from 'moment';
import LocationInput from '../../components/Rides/LocationInput';
import styles from '../../styles/Trips/requestTrip.module.css';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const RequestTripModal = ({ visible, onCancel, onSuccess }) => {
    const { currentUser } = useAuth();
    const { createTripRequest, loading } = useTrip();
    const [form] = Form.useForm();
    const [currentStep, setCurrentStep] = useState(0);

    const [tripData, setTripData] = useState({
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

    const handleOriginChange = (location) => {
        setTripData({
            ...tripData,
            origin: location
        });
    };

    const handleDestinationChange = (location) => {
        setTripData({
            ...tripData,
            destination: location
        });
    };

    const validateCurrentStep = () => {
        switch (currentStep) {
            case 0:
                if (!tripData.origin.address || !tripData.origin.coordinates.length ||
                    !tripData.destination.address || !tripData.destination.coordinates.length) {
                    message.error('Please fill in both pickup and drop-off locations');
                    return false;
                }
                return true;

            case 1:
                if (!tripData.departureDate || !tripData.departureTime) {
                    message.error('Please fill in departure date and time');
                    return false;
                }
                const selectedDate = moment(tripData.departureDate).startOf('day');
                const today = moment().startOf('day');
                if (selectedDate.isBefore(today)) {
                    message.error('Departure date cannot be in the past');
                    return false;
                }
                return true;

            case 2:
                if (!tripData.numberOfSeats) {
                    message.error('Please specify number of seats needed');
                    return false;
                }
                return true;

            case 3:
                if (tripData.recurrence.pattern !== 'none') {
                    if (!tripData.recurrence.endDate) {
                        message.error('Please specify an end date for the recurring trip');
                        return false;
                    }
                    if (tripData.recurrence.pattern === 'custom' && tripData.recurrence.customDays.length === 0) {
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
                    <Form.Item
                        label="Pickup Location"
                        required
                        className={styles.formItem}
                    >
                        <LocationInput
                            value={tripData.origin}
                            onChange={handleOriginChange}
                            placeholder="Enter pickup address"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Drop-off Location"
                        required
                        className={styles.formItem}
                    >
                        <LocationInput
                            value={tripData.destination}
                            onChange={handleDestinationChange}
                            placeholder="Enter drop-off address"
                        />
                    </Form.Item>
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
                                onChange={(value) => {
                                    const currentTime = tripData.departureTime || '';
                                    const newTime = `${value}:${currentTime.split(':')[1] || '00'}`;
                                    setTripData({ ...tripData, departureTime: newTime });
                                }}
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
                                onChange={(value) => {
                                    const currentTime = tripData.departureTime || '';
                                    const newTime = `${currentTime.split(':')[0] || '00'}:${value}`;
                                    setTripData({ ...tripData, departureTime: newTime });
                                }}
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
                                    pattern: value
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
                            label="End Date"
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
                                disabledDate={(current) => current && current < moment(tripData.departureDate).startOf('day')}
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
                                <Option value="Monday">Monday</Option>
                                <Option value="Tuesday">Tuesday</Option>
                                <Option value="Wednesday">Wednesday</Option>
                                <Option value="Thursday">Thursday</Option>
                                <Option value="Friday">Friday</Option>
                                <Option value="Saturday">Saturday</Option>
                                <Option value="Sunday">Sunday</Option>
                            </Select>
                        </Form.Item>
                    )}
                </motion.div>
            )
        }
    ];

    const handleSubmit = async () => {
        try {
            if (!validateCurrentStep()) {
                return;
            }

            const formattedData = {
                ...tripData,
                departureDate: tripData.departureDate?.format('YYYY-MM-DD'),
                recurrence: tripData.recurrence.pattern !== 'none' ? tripData.recurrence : undefined
            };

            const result = await createTripRequest(formattedData);

            if (result.success) {
                message.success('Trip request created successfully!');
                onSuccess();
            } else {
                message.error(result.message || 'Failed to create trip request');
            }
        } catch (error) {
            console.error('Submit error:', error);
            message.error('An error occurred while creating the trip request');
        }
    };

    return (
        <Modal
            title="Request a Trip"
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={800}
        >
            <div className={styles.pageContainer}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={styles.contentWrapper}
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