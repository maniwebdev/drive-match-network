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
    const [rideData, setRideData] = useState({
        origin: offer.origin,
        destination: offer.destination,
        departureDateTime: moment(offer.departureDateTime),
        availableSeats: offer.availableSeats,
        pricePerSeat: offer.pricePerSeat,
        allowedLuggage: offer.allowedLuggage,
        smoking: offer.smoking,
        pets: offer.pets,
    });

    // Update form when offer changes
    useEffect(() => {
        if (offer) {
            setRideData({
                origin: offer.origin,
                destination: offer.destination,
                departureDateTime: moment(offer.departureDateTime),
                availableSeats: offer.availableSeats,
                pricePerSeat: offer.pricePerSeat,
                allowedLuggage: offer.allowedLuggage,
                smoking: offer.smoking,
                pets: offer.pets,
            });
        }
    }, [offer]);

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
                if (!rideData.departureDateTime || !rideData.departureDateTime.isValid()) {
                    message.error('Invalid departure date/time');
                    return false;
                }
                if (rideData.departureDateTime.isBefore(moment())) {
                    message.error('Departure must be in the future');
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
            const updatePayload = {
                ...rideData,
                departureDateTime: rideData.departureDateTime.toISOString(),
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

            const result = await updateRideOffer(offer._id, updatePayload);

            if (result.success) {
                message.success('Ride updated successfully!');
                onSuccess();
            } else {
                message.error(result.message || 'Update failed');
            }
        } catch (error) {
            message.error('Error updating ride');
            console.error('Update error:', error);
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
                    <Form.Item label="Departure Date & Time" required>
                        <DatePicker
                            showTime
                            format="YYYY-MM-DD HH:mm"
                            className={styles.dateTimePicker}
                            value={rideData.departureDateTime}
                            onChange={datetime => setRideData(prev => ({
                                ...prev,
                                departureDateTime: datetime
                            }))}
                            disabledDate={current => current && current < moment().startOf('day')}
                        />
                    </Form.Item>
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