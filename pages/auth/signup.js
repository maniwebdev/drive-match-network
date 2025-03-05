import React, { useState } from 'react';
import styles from '../../styles/Authentication/signup.module.css';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/Auth/AuthContext';
import { message, Spin } from 'antd';
import Image from 'next/image';
import { Eye, EyeOff, Shield, Users, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import TypeWriter from 'typewriter-effect';
import GoogleLoginButton from '../../components/Authentication/GoogleLoginButton';

const Signup = () => {
    const router = useRouter();
    const { signup } = useAuth();

    // State management
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isAgreedToTerms, setIsAgreedToTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                duration: 0.6,
                staggerChildren: 0.1
            }
        }
    };

    const featureCardVariants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.5 }
        }
    };

    const features = [
        {
            icon: <Shield className={styles.featureIcon} />,
            title: "Verified Community",
            description: "Join our trusted network of drivers and passengers"
        },
        {
            icon: <Users className={styles.featureIcon} />,
            title: "Safe Connections",
            description: "Connect with verified members for secure rides"
        },
        {
            icon: <Car className={styles.featureIcon} />,
            title: "Efficient Matching",
            description: "Find the perfect ride matches for your journey"
        }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        const lowercaseEmail = email.toLowerCase().trim();

        // Validation
        if (!lowercaseEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lowercaseEmail)) {
            message.error('Please enter a valid email address');
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
        if (!isAgreedToTerms) {
            message.error('Please agree to the terms and conditions');
            return;
        }

        setIsLoading(true);
        try {
            const result = await signup(lowercaseEmail, password);
            if (result.success) {
                message.success('Welcome to Drive Match Network! Please verify your email.');
                localStorage.setItem('userEmail', lowercaseEmail);
                router.push('/auth/verify-otp');
            } else {
                message.error(result.message || 'Signup failed');
            }
        } catch (error) {
            message.error('An error occurred during signup');
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
            {/* Left Section - Features */}
            <motion.div className={styles.featuresSection}>
                <motion.div className={styles.brandingContainer}>
                    <Image
                        src="/images/carlogo.png"
                        alt="Drive Match Network"
                        width={120}
                        height={120}
                        className={styles.logo}
                        priority={true}
                    />
                    <motion.h1 className={styles.brandName}>
                        Drive Match Network
                    </motion.h1>
                    <motion.div className={styles.tagline}>
                        <TypeWriter
                            options={{
                                strings: [
                                    'Join Our Trusted Community',
                                    'Connect with Safe Drivers',
                                    'Travel Better Together'
                                ],
                                autoStart: true,
                                loop: true
                            }}
                        />
                    </motion.div>
                </motion.div>

                <div className={styles.featuresContainer}>
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            className={styles.featureCard}
                            variants={featureCardVariants}
                            whileHover={{ scale: 1.02 }}
                        >
                            {feature.icon}
                            <div className={styles.featureContent}>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Right Section - Sign Up Form */}
            <motion.div className={styles.formSection}>
                <motion.div className={styles.formContainer}>
                    <h2 className={styles.welcomeText}>Create Account</h2>
                    <p className={styles.welcomeSubtext}>Join our community of trusted travelers</p>
                    <GoogleLoginButton text="Sign up with Google" />
                    <form onSubmit={handleSubmit} className={styles.signupForm}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email" className={styles.inputLabel}>
                                Email Address
                            </label>
                            <input
                                type="email"
                                id="email"
                                className={styles.input}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.inputLabel}>
                                Password
                            </label>
                            <div className={styles.passwordInputWrapper}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    className={styles.input}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a strong password"
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className={styles.eyeIcon} />
                                    ) : (
                                        <Eye className={styles.eyeIcon} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmPassword" className={styles.inputLabel}>
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className={styles.input}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                            />
                        </div>

                        <div className={styles.termsGroup}>
                            <label className={styles.termsLabel}>
                                <input
                                    type="checkbox"
                                    checked={isAgreedToTerms}
                                    onChange={(e) => setIsAgreedToTerms(e.target.checked)}
                                    className={styles.checkbox}
                                />
                                <span>I agree to the </span>
                                <motion.span
                                    className={styles.termsLink}
                                    onClick={() => router.push('/terms')}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    Terms of Service
                                </motion.span>
                            </label>
                        </div>

                        <motion.button
                            type="submit"
                            className={styles.signupButton}
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading ? <Spin /> : 'Create Account'}
                        </motion.button>
                    </form>

                    <p className={styles.loginPrompt}>
                        Already have an account?{' '}
                        <motion.span
                            onClick={() => router.push('/auth/login')}
                            className={styles.loginLink}
                            whileHover={{ scale: 1.02 }}
                        >
                            Log in
                        </motion.span>
                    </p>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default Signup;