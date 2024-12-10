/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { message, Spin } from 'antd';
import Image from 'next/image';
import styles from '../../styles/Authentication/forgotPassword.module.css';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, ShieldAlert, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const ForgotPassword = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
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

    const handleForgotPassword = async (e) => {
        e.preventDefault();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            message.error('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_Car_API_URL}/api/auth/forgot`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase() }),
            });

            const data = await response.json();

            if (data.success) {
                message.success('Recovery instructions sent to your email');
                localStorage.setItem('resetEmail', email.toLowerCase());
                router.push('/auth/reset-password');
            } else {
                throw new Error(data.error || 'Failed to process request');
            }
        } catch (error) {
            message.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const securitySteps = [
        {
            icon: <Mail className={styles.stepIcon} />,
            title: "Enter Email",
            description: "Provide your registered email address"
        },
        {
            icon: <ShieldAlert className={styles.stepIcon} />,
            title: "Check Email",
            description: "Receive secure reset instructions"
        },
        {
            icon: <CheckCircle className={styles.stepIcon} />,
            title: "Reset Password",
            description: "Create your new secure password"
        }
    ];

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
                    {securitySteps.map((step, index) => (
                        <motion.div
                            key={index}
                            className={styles.stepCard}
                            variants={cardVariants}
                            whileHover={{ scale: 1.02 }}
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
                        <h2>Password Recovery</h2>
                        <p>Enter your email address to receive password reset instructions</p>
                    </div>

                    <form onSubmit={handleForgotPassword} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                className={styles.input}
                            />
                        </div>

                        <motion.button
                            type="submit"
                            className={styles.submitButton}
                            disabled={isLoading || !email}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading ? (
                                <div className={styles.spinnerContainer}>
                                    <Spin />
                                    <span>Sending Instructions...</span>
                                </div>
                            ) : (
                                'Send Recovery Instructions'
                            )}
                        </motion.button>
                    </form>

                    <p className={styles.securityNote}>
                        For security reasons, we'll send instructions only to registered email addresses.
                    </p>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default ForgotPassword;