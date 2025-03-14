import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { message, Spin } from 'antd';
import Image from 'next/image';
import styles from '../../styles/Authentication/resetPassword.module.css';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowLeft, Shield, Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const ResetPassword = () => {
    const router = useRouter();
    const [formData, setFormData] = useState({
        otp: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState({
        password: false,
        confirmPassword: false
    });
    const [isLoading, setIsLoading] = useState(false);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.6, staggerChildren: 0.1 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.4 }
        }
    };

    const resetSteps = [
        {
            icon: <Shield className={styles.stepIcon} />,
            title: "Enter OTP",
            description: "Input the code sent to your email"
        },
        {
            icon: <Lock className={styles.stepIcon} />,
            title: "New Password",
            description: "Create a strong new password"
        },
        {
            icon: <CheckCircle className={styles.stepIcon} />,
            title: "Complete",
            description: "Access your account with new password"
        }
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        const { otp, password, confirmPassword } = formData;

        // Validation
        if (!otp || !password || !confirmPassword) {
            message.error('Please fill in all fields');
            return;
        }

        if (password.length < 8) {
            message.error('Password must be at least 8 characters long');
            return;
        }

        if (password !== confirmPassword) {
            message.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_Car_API_URL}/api/auth/resetpas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Otp: otp, password }),
            });

            const data = await response.json();

            if (data.success) {
                message.success('Password reset successful!');
                router.push('/auth/login');
            } else {
                throw new Error(data.msg || 'Failed to reset password');
            }
        } catch (error) {
            message.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            className={styles.pageContainer}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Left Section */}
            <motion.div className={styles.infoSection}>
                <div className={styles.brandingContainer}>
                    <Image
                        src="/images/carlogo.png"
                        alt="Drive Match Network"
                        width={120}
                        height={120}
                        className={styles.logo}
                        priority
                    />
                    <h1 className={styles.brandName}>Drive Match Network</h1>
                </div>

                <div className={styles.stepsContainer}>
                    {resetSteps.map((step, index) => (
                        <motion.div
                            key={index}
                            className={styles.stepCard}
                            variants={cardVariants}
                        >
                            {step.icon}
                            <div className={styles.stepContent}>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Right Section - Form */}
            <motion.div className={styles.formSection}>
                <motion.div 
                    className={styles.formContainer}
                    variants={cardVariants}
                >
                    <Link href="/auth/login" className={styles.backLink}>
                        <ArrowLeft size={18} />
                        <span>Back to Login</span>
                    </Link>

                    <div className={styles.formHeader}>
                        <h2>Reset Your Password</h2>
                        <p>Create a new secure password for your account</p>
                    </div>

                    <form onSubmit={handleResetPassword} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="otp">OTP Code</label>
                            <input
                                type="text"
                                id="otp"
                                name="otp"
                                value={formData.otp}
                                onChange={handleInputChange}
                                placeholder="Enter OTP code"
                                maxLength={6}
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="password">New Password</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPassword.password ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter new password"
                                    className={styles.input}
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowPassword(prev => ({
                                        ...prev,
                                        password: !prev.password
                                    }))}
                                >
                                    {showPassword.password ? (
                                        <EyeOff className={styles.eyeIcon} />
                                    ) : (
                                        <Eye className={styles.eyeIcon} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPassword.confirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    placeholder="Confirm new password"
                                    className={styles.input}
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowPassword(prev => ({
                                        ...prev,
                                        confirmPassword: !prev.confirmPassword
                                    }))}
                                >
                                    {showPassword.confirmPassword ? (
                                        <EyeOff className={styles.eyeIcon} />
                                    ) : (
                                        <Eye className={styles.eyeIcon} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <motion.button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading ? (
                                <div className={styles.spinnerContainer}>
                                    <Spin />
                                    <span>Resetting Password...</span>
                                </div>
                            ) : (
                                'Reset Password'
                            )}
                        </motion.button>
                    </form>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default ResetPassword;