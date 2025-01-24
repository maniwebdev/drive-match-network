import React, { useState } from 'react';
import { Modal, Steps, Button, Form, DatePicker, InputNumber, Select, Input, message } from 'antd';
import { MapPin, Calendar, Users, Package, Info, Clock } from 'lucide-react';
import moment from 'moment';
import { useTrip } from '../../context/Ride/TripContext';
import LocationInput from '../../components/Rides/LocationInput';
import styles from '../../styles/Trips/EditTripModal.module.css';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const EditTripModal = ({ trip, visible, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const { editTripRequest, loading } = useTrip();
    const [currentStep, setCurrentStep] = useState(0);

    // Initialize tripData with proper moment objects
    const [tripData, setTripData] = useState({
        origin: trip.origin,
        destination: trip.destination,
        departureDate: moment(trip.departureDate),
        departureTime: trip.departureTime,
        numberOfSeats: trip.numberOfSeats,
        luggageSize: trip.luggageSize,
        additionalNotes: trip.additionalNotes,
        recurrence: {
            pattern: trip.recurrence?.pattern || 'none',
            endDate: trip.recurrence?.endDate ? moment(trip.recurrence.endDate) : null,
            customDays: trip.recurrence?.customDays || []
        }
    });

    // Location change handlers
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

    // Validation functions
    const validateCurrentStep = () => {
        switch (currentStep) {
            case 0: // Route
                if (!tripData.origin.address || !tripData.origin.coordinates.length ||
                    !tripData.destination.address || !tripData.destination.coordinates.length) {
                    message.error('Please fill in both pickup and drop-off locations');
                    return false;
                }
                return true;

            case 1: // Schedule
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

            case 2: // Details
                if (!tripData.numberOfSeats) {
                    message.error('Please specify number of seats needed');
                    return false;
                }
                return true;

            case 3: // Recurrence
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

    const handleSubmit = async () => {
        try {
            if (!validateCurrentStep()) {
                return;
            }

            const formattedData = {
                ...tripData,
                departureDate: tripData.departureDate?.format('YYYY-MM-DD'),
                recurrence: tripData.recurrence.pattern !== 'none' ? {
                    ...tripData.recurrence,
                    endDate: tripData.recurrence.endDate?.format('YYYY-MM-DD')
                } : undefined
            };

            const result = await editTripRequest(trip._id, formattedData);

            if (result.success) {
                message.success('Trip request updated successfully!');
                onSuccess();
            } else {
                message.error(result.message || 'Failed to update trip request');
            }
        } catch (error) {
            console.error('Submit error:', error);
            message.error('An error occurred while updating the trip request');
        }
    };

    const steps = [
        {
            title: 'Route',
            icon: <MapPin className={styles.stepIcon} />,
            content: (
                <div className={styles.stepContent}>
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
            className={styles.editModal}
            width={800}
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
                            Update Trip
                        </Button>
                    )}
                </div>
            </Form>
        </Modal>
    );
};

export default EditTripModal;