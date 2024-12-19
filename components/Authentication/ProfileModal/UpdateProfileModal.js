/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from 'react';
import styles from '../../../styles/Profile/updateModal.module.css';
import { Modal, Form, Input, Switch, message } from 'antd';
import { useAuth } from '../../../context/Auth/AuthContext';
import { motion } from 'framer-motion';
import { Facebook, Twitter, Instagram, Car, AlertCircle, CreditCard, Users } from 'lucide-react';

const UpdateProfileModal = ({ visible, onClose, type }) => {
    const [form] = Form.useForm();
    const { currentUser, updateBasicProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isDriver, setIsDriver] = useState(currentUser?.isDriver || false);

    // Set form values when modal opens
    useEffect(() => {
        if (visible) {
            switch (type) {
                case 'basic':
                    form.setFieldsValue({
                        fullName: currentUser?.fullName || '',
                        phoneNumber: currentUser?.phoneNumber || '',
                        bio: currentUser?.bio || '',
                        isDriver: currentUser?.isDriver || false
                    });
                    setIsDriver(currentUser?.isDriver || false);
                    break;

                case 'social':
                    form.setFieldsValue({
                        facebook: currentUser?.socialLinks?.facebook || '',
                        twitter: currentUser?.socialLinks?.twitter || '',
                        instagram: currentUser?.socialLinks?.instagram || ''
                    });
                    break;

                case 'driver':
                    form.setFieldsValue({
                        licenseNumber: currentUser?.driverVerification?.licenseNumber || ''
                    });
                    break;

                case 'vehicle':
                    form.setFieldsValue({
                        model: currentUser?.vehicle?.model || '',
                        year: currentUser?.vehicle?.year || '',
                        plateNumber: currentUser?.vehicle?.plateNumber || '',
                        capacity: currentUser?.vehicle?.capacity || ''
                    });
                    break;
            }
        }
    }, [visible, currentUser, type, form]);

    // Get modal title based on type
    const getModalTitle = () => {
        switch (type) {
            case 'basic':
                return 'Update Basic Information';
            case 'social':
                return 'Update Social Links';
            case 'driver':
                return 'Update Driver Verification';
            case 'vehicle':
                return 'Update Vehicle Information';
            default:
                return 'Update Profile';
        }
    };

    // Form submit handler
    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            let updateData = {};

            switch (type) {
                case 'basic':
                    updateData = {
                        fullName: values.fullName,
                        phoneNumber: values.phoneNumber,
                        bio: values.bio,
                        isDriver: values.isDriver
                    };
                    break;

                case 'social':
                    updateData = {
                        socialLinks: {
                            facebook: values.facebook,
                            twitter: values.twitter,
                            instagram: values.instagram
                        }
                    };
                    break;

                case 'driver':
                    updateData = {
                        driverVerification: {
                            licenseNumber: values.licenseNumber,
                            isVerified: false,
                            verificationDate: new Date()
                        }
                    };
                    break;

                case 'vehicle':
                    updateData = {
                        vehicle: {
                            model: values.model,
                            year: parseInt(values.year),
                            plateNumber: values.plateNumber.toUpperCase(),
                            capacity: parseInt(values.capacity)
                        }
                    };
                    break;
            }

            const result = await updateBasicProfile(updateData);
            if (result.success) {
                message.success(`Successfully updated ${type} information`);
                onClose();
                form.resetFields();
            }
        } catch (error) {
            message.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    // Form rendering based on type
    const renderForm = () => {
        switch (type) {
            case 'basic':
                return (
                    <div className={styles.formContainer}>
                        <Form.Item
                            name="fullName"
                            label="Full Name"
                            rules={[
                                { required: true, message: 'Please enter your full name' },
                                { min: 3, message: 'Name must be at least 3 characters' },
                                { max: 50, message: 'Name cannot exceed 50 characters' }
                            ]}
                        >
                            <Input
                                className={styles.input}
                                placeholder="Enter your full name"
                            />
                        </Form.Item>

                        <Form.Item
                            name="phoneNumber"
                            label="Phone Number"
                            rules={[
                                { required: true, message: 'Please enter your phone number' },
                                {
                                    pattern: /^(\+92|0)?[0-9]{10}$/,
                                    message: 'Please enter a valid Pakistani phone number'
                                }
                            ]}
                        >
                            <Input
                                className={styles.input}
                                placeholder="Enter your phone number"
                            />
                        </Form.Item>

                        <Form.Item
                            name="bio"
                            label="Bio"
                            rules={[
                                { max: 500, message: 'Bio cannot exceed 500 characters' }
                            ]}
                        >
                            <Input.TextArea
                                className={styles.textArea}
                                placeholder="Tell us about yourself"
                                rows={4}
                            />
                        </Form.Item>

                        <Form.Item
                            name="isDriver"
                            label={
                                <span className={styles.driverLabel}>
                                    <Car size={18} /> Register as Driver
                                </span>
                            }
                            valuePropName="checked"
                        >
                            <Switch
                                className={styles.driverSwitch}
                                onChange={(checked) => setIsDriver(checked)}
                            />
                        </Form.Item>

                        {isDriver && (
                            <div className={styles.driverNote}>
                                <AlertCircle size={16} className={styles.noteIcon} />
                                <span>After registering as a driver, you'll need to provide vehicle and license information in the Driver Info tab.</span>
                            </div>
                        )}
                    </div>
                );

            case 'social':
                return (
                    <div className={styles.formContainer}>
                        <Form.Item
                            name="facebook"
                            label={
                                <span className={styles.socialLabel}>
                                    <Facebook size={18} /> Facebook
                                </span>
                            }
                            rules={[
                                { type: 'url', message: 'Please enter a valid URL' }
                            ]}
                        >
                            <Input
                                className={styles.input}
                                placeholder="Enter your Facebook profile URL"
                            />
                        </Form.Item>

                        <Form.Item
                            name="twitter"
                            label={
                                <span className={styles.socialLabel}>
                                    <Twitter size={18} /> Twitter
                                </span>
                            }
                            rules={[
                                { type: 'url', message: 'Please enter a valid URL' }
                            ]}
                        >
                            <Input
                                className={styles.input}
                                placeholder="Enter your Twitter profile URL"
                            />
                        </Form.Item>

                        <Form.Item
                            name="instagram"
                            label={
                                <span className={styles.socialLabel}>
                                    <Instagram size={18} /> Instagram
                                </span>
                            }
                            rules={[
                                { type: 'url', message: 'Please enter a valid URL' }
                            ]}
                        >
                            <Input
                                className={styles.input}
                                placeholder="Enter your Instagram profile URL"
                            />
                        </Form.Item>
                    </div>
                );
            case 'driver':
                return (
                    <div className={styles.formContainer}>
                        <Form.Item
                            name="licenseNumber"
                            label={
                                <span className={styles.formLabel}>
                                    <CreditCard size={18} /> License Number
                                </span>
                            }
                            rules={[
                                { required: true, message: 'Please enter your license number' },
                                { min: 5, message: 'License number must be at least 5 characters' },
                                { max: 20, message: 'License number cannot exceed 20 characters' }
                            ]}
                        >
                            <Input
                                className={styles.input}
                                placeholder="Enter your driving license number"
                            />
                        </Form.Item>

                        <div className={styles.verificationNote}>
                            <AlertCircle size={16} className={styles.noteIcon} />
                            <div className={styles.noteContent}>
                                <h4>Verification Process</h4>
                                <ul>
                                    <li>Your license will be verified by our team</li>
                                    <li>Verification usually takes 24-48 hours</li>
                                    <li>You'll be notified once verified</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                );

            case 'vehicle':
                return (
                    <div className={styles.formContainer}>
                        <Form.Item
                            name="model"
                            label={
                                <span className={styles.formLabel}>
                                    <Car size={18} /> Vehicle Model
                                </span>
                            }
                            rules={[
                                { required: true, message: 'Please enter vehicle model' },
                                { min: 2, message: 'Model name must be at least 2 characters' },
                                { max: 50, message: 'Model name cannot exceed 50 characters' }
                            ]}
                        >
                            <Input
                                className={styles.input}
                                placeholder="e.g., Toyota Corolla"
                            />
                        </Form.Item>

                        <Form.Item
                            name="year"
                            label="Manufacturing Year"
                            rules={[
                                { required: true, message: 'Please enter manufacturing year' },
                                {
                                    validator: (_, value) => {
                                        const currentYear = new Date().getFullYear();
                                        if (value && (value < 1990 || value > currentYear)) {
                                            return Promise.reject(`Please enter a year between 1990 and ${currentYear}`);
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Input
                                className={styles.input}
                                type="number"
                                placeholder={`e.g., ${new Date().getFullYear()}`}
                            />
                        </Form.Item>

                        <Form.Item
                            name="plateNumber"
                            label="License Plate Number"
                            rules={[
                                { required: true, message: 'Please enter plate number' },
                                {
                                  //  pattern: /^[A-Z0-9-]+$/,
                                    message: 'Please enter a valid plate number format (e.g., ABC-123)'
                                }
                            ]}
                        >
                            <Input
                                className={styles.input}
                                placeholder="e.g., ABC-123"
                                style={{ textTransform: 'uppercase' }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="capacity"
                            label={
                                <span className={styles.formLabel}>
                                    <Users size={18} /> Seating Capacity
                                </span>
                            }
                            rules={[
                                { required: true, message: 'Please enter seating capacity' },
                               // { type: 'number', min: 1, max: 8, message: 'Capacity must be between 1 and 8' }
                            ]}
                        >
                            <Input
                                className={styles.input}
                                type="number"
                                placeholder="Number of seats (1-8)"
                            />
                        </Form.Item>
                    </div>
                );
        }
    };

    return (
        <Modal
            title={
                <motion.h3
                    className={styles.modalTitle}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    {getModalTitle()}
                </motion.h3>
            }
            open={visible}
            onCancel={onClose}
            okText="Update"
            confirmLoading={loading}
            okButtonProps={{
                className: styles.updateButton
            }}
            cancelButtonProps={{
                className: styles.cancelButton
            }}
            onOk={() => form.submit()}
            className={styles.modal}
            maskClosable={false}
            width={500}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                className={styles.form}
                validateTrigger={['onBlur', 'onChange']}
            >
                {renderForm()}
            </Form>
        </Modal>
    );
};

export default UpdateProfileModal;
