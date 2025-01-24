import React, { useState } from 'react';
import { Modal, Steps, Button, Form, DatePicker, InputNumber, Select, Input, message } from 'antd';
import { MapPin, Calendar, Users, Package, Info, Clock, DollarSign } from 'lucide-react';
import moment from 'moment';
import LocationInput from '../../components/Rides/LocationInput';
import styles from '../../styles/Trips/EditTripModal.module.css';
import { useRide } from '../../context/Ride/RideContext';

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const EditRideOfferModal = ({ offer, visible, onCancel, onSuccess }) => {
    const [form] = Form.useForm();
    const { updateRideOffer } = useRide();
    const [currentStep, setCurrentStep] = useState(0);
    const [rideData, setRideData] = useState({
        origin: offer.origin,
        destination: offer.destination,
        departureDate: moment(offer.departureDate),
        departureTime: offer.departureTime,
        availableSeats: offer.availableSeats,
        pricePerSeat: offer.pricePerSeat,
        allowedLuggage: offer.allowedLuggage,
        smoking: offer.smoking,
        pets: offer.pets,
    });

    // Location change handlers
    const handleOriginChange = (location) => {
        setRideData({
            ...rideData,
            origin: location
        });
    };

    const handleDestinationChange = (location) => {
        setRideData({
            ...rideData,
            destination: location
        });
    };

    // Validation functions
    const validateCurrentStep = () => {
        switch (currentStep) {
            case 0: // Route
                if (!rideData.origin.address || !rideData.origin.coordinates.length ||
                    !rideData.destination.address || !rideData.destination.coordinates.length) {
                    message.error('Please fill in both pickup and drop-off locations');
                    return false;
                }
                return true;

            case 1: // Schedule
                if (!rideData.departureDate || !rideData.departureTime) {
                    message.error('Please fill in departure date and time');
                    return false;
                }
                const selectedDate = moment(rideData.departureDate).startOf('day');
                const today = moment().startOf('day');
                if (selectedDate.isBefore(today)) {
                    message.error('Departure date cannot be in the past');
                    return false;
                }
                return true;

            case 2: // Details
                if (!rideData.availableSeats || !rideData.pricePerSeat) {
                    message.error('Please specify available seats and price per seat');
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

            const formattedData = {
                ...rideData,
                departureDate: rideData.departureDate?.format('YYYY-MM-DD')
            };

            // Call the updateRideOffer function from your context
            const result = await updateRideOffer(offer._id, formattedData);

            if (result.success) {
                message.success('Ride offer updated successfully!');
                onSuccess();
            } else {
                message.error(result.message || 'Failed to update ride offer');
            }
        } catch (error) {
            console.error('Submit error:', error);
            message.error('An error occurred while updating the ride offer');
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
                            value={rideData.origin}
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
                            value={rideData.destination}
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
                            value={rideData.departureDate}
                            onChange={(date) => setRideData({ ...rideData, departureDate: date })}
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
                                value={rideData.departureTime ? rideData.departureTime.split(':')[0] : undefined}
                                onChange={(value) => {
                                    const currentTime = rideData.departureTime || '';
                                    const newTime = `${value}:${currentTime.split(':')[1] || '00'}`;
                                    setRideData({ ...rideData, departureTime: newTime });
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
                                value={rideData.departureTime ? rideData.departureTime.split(':')[1] : undefined}
                                onChange={(value) => {
                                    const currentTime = rideData.departureTime || '';
                                    const newTime = `${currentTime.split(':')[0] || '00'}:${value}`;
                                    setRideData({ ...rideData, departureTime: newTime });
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
                        label="Available Seats"
                        required
                        className={styles.formItem}
                    >
                        <InputNumber
                            min={1}
                            max={8}
                            className={styles.seatsInput}
                            value={rideData.availableSeats}
                            onChange={(value) => setRideData({ ...rideData, availableSeats: value })}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Price Per Seat"
                        required
                        className={styles.formItem}
                    >
                        <InputNumber
                            min={0}
                            className={styles.priceInput}
                            value={rideData.pricePerSeat}
                            onChange={(value) => setRideData({ ...rideData, pricePerSeat: value })}
                            prefix={<DollarSign className={styles.icon} />}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Luggage Size"
                        className={styles.formItem}
                    >
                        <Select
                            value={rideData.allowedLuggage}
                            onChange={(value) => setRideData({ ...rideData, allowedLuggage: value })}
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
                        <Select
                            value={rideData.smoking}
                            onChange={(value) => setRideData({ ...rideData, smoking: value })}
                            className={styles.select}
                        >
                            <Option value={true}>Yes</Option>
                            <Option value={false}>No</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item
                        label="Pets Allowed"
                        className={styles.formItem}
                    >
                        <Select
                            value={rideData.pets}
                            onChange={(value) => setRideData({ ...rideData, pets: value })}
                            className={styles.select}
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
            title="Edit Ride Offer"
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
                            className={styles.submitButton}
                        >
                            Update Ride Offer
                        </Button>
                    )}
                </div>
            </Form>
        </Modal>
    );
};

export default EditRideOfferModal;