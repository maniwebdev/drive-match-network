//component/EditRideOfferModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Steps, Button, Form, DatePicker, InputNumber, Select, message } from 'antd';
import { MapPin, Calendar, Users, Package, DollarSign } from 'lucide-react';
import moment from 'moment';
import LocationInput from '../../components/Rides/LocationInput';
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
        origin: offer.origin,
        destination: offer.destination,
        departureDateTime: null,
        availableSeats: offer.availableSeats,
        pricePerSeat: offer.pricePerSeat,
        allowedLuggage: offer.allowedLuggage,
        smoking: offer.smoking,
        pets: offer.pets,
    });

    // Initialize date and time when modal opens
    useEffect(() => {
        if (offer && offer.departureDateTime) {
            const departureMoment = moment(offer.departureDateTime);

            // Reset all state when offer changes
            setCurrentStep(0);
            setSelectedDate(departureMoment);
            setSelectedTime(departureMoment);
            setRideData({
                offerId: offer._id,
                origin: offer.origin,
                destination: offer.destination,
                departureDateTime: departureMoment,
                availableSeats: offer.availableSeats,
                pricePerSeat: offer.pricePerSeat,
                allowedLuggage: offer.allowedLuggage,
                smoking: offer.smoking,
                pets: offer.pets,
            });
        }
    }, [offer._id]);

    const handleDateTimeChange = (date, time) => {
        if (date && time) {
            // Create a new moment object from the selected date
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
       // console.log('Selected date:', date?.format('YYYY-MM-DD'));
        setSelectedDate(date);
        if (date && selectedTime) {
            handleDateTimeChange(date, selectedTime);
        }
    };

    const handleTimeChange = time => {
      //  console.log('Selected time:', time?.format('HH:mm'));
        setSelectedTime(time);
        if (selectedDate && time) {
            handleDateTimeChange(selectedDate, time);
        }
    };

    // Location handlers
    const handleOriginChange = (location) => {
        setRideData(prev => ({
            ...prev,
            origin: {
                address: location.address,
                city: location.city,
                coordinates: location.coordinates
            }
        }));
    };

    const handleDestinationChange = (location) => {
        setRideData(prev => ({
            ...prev,
            destination: {
                address: location.address,
                city: location.city,
                coordinates: location.coordinates
            }
        }));
    };

    // Validation
    const validateCurrentStep = () => {
        switch (currentStep) {
            case 0:
                if (!rideData.origin?.coordinates?.length || !rideData.destination?.coordinates?.length) {
                    message.error('Please select valid locations');
                    return false;
                }
                return true;

            case 1:
                if (!selectedDate || !selectedTime) {
                    message.error('Please select both date and time');
                    return false;
                }

                // Create a new moment object for validation
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

            case 2:
                if (rideData.availableSeats < 1 || rideData.availableSeats > 8) {
                    message.error('Seats must be between 1-8');
                    return false;
                }
                if (rideData.pricePerSeat < 0) {
                    message.error('Price must be positive');
                    return false;
                }
                return true;

            default:
                return true;
        }
    };

    // Navigation
    const handleNext = () => validateCurrentStep() && setCurrentStep(prev => prev + 1);
    const handlePrev = () => setCurrentStep(prev => prev - 1);

    // Form submission
    const handleSubmit = async () => {
        if (!validateCurrentStep()) return;

        try {
            if (!offer._id) {
                throw new Error('No ride offer ID available');
            }

          //  console.log('Updating ride offer with ID:', offer._id);

            // Create a new moment object for submission
            const submissionDateTime = moment(selectedDate.format('YYYY-MM-DD'))
                .set({
                    hour: selectedTime.hour(),
                    minute: selectedTime.minute(),
                    second: 0
                });

          //  console.log('Submitting datetime:', submissionDateTime.format('YYYY-MM-DD HH:mm:ss'));

            const updatePayload = {
                ...rideData,
                departureDateTime: submissionDateTime.toISOString(),
                origin: {
                    address: rideData.origin.address,
                    city: rideData.origin.city,
                    coordinates: rideData.origin.coordinates
                },
                destination: {
                    address: rideData.destination.address,
                    city: rideData.destination.city,
                    coordinates: rideData.destination.coordinates
                }
            };

           // console.log('Update payload:', updatePayload);

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
                    <Form.Item label="Pickup Location" required>
                        <LocationInput
                            value={rideData.origin}
                            onChange={handleOriginChange}
                            placeholder="Enter pickup address"
                        />
                    </Form.Item>

                    <Form.Item label="Drop-off Location" required>
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
                            max={8}
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