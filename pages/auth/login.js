import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/Auth/AuthContext';
import { message, Spin } from 'antd';
import styles from '../../styles/Authentication/login.module.css';
import Image from 'next/image';
import { Eye, EyeOff, Car, MapPin, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import TypeWriter from 'typewriter-effect';
import { AuthTokenCheck } from '../../components/Authentication/AuthTokenCheck';
import GoogleLoginButton from '../../components/Authentication/GoogleLoginButton';

const Login = () => {
    const router = useRouter();
    const { login } = useAuth();
    const { isAuthenticated, isUserVerified, hasFetchedUserDetails } = AuthTokenCheck();
    // State management
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        if (hasFetchedUserDetails) {
            if (isAuthenticated && isUserVerified) {
                router.replace('/user/profile');
            }
            setIsLoading(false);
        }
    }, [hasFetchedUserDetails, isAuthenticated, isUserVerified, router]);

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

    const formVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5 }
        }
    };

    // Handle login submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            message.error('Please fill in all fields');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            message.error('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        try {
            await login(email, password);
            message.success('Welcome to Drive Match Network!');
            router.push('/user/profile');
        } catch (error) {
            message.error(error.message || 'Login failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        { icon: <Car className={styles.featureIcon} />, text: "Safe Rides" },
        { icon: <MapPin className={styles.featureIcon} />, text: "Smart Matching" },
        { icon: <Users className={styles.featureIcon} />, text: "Community" }
    ];

    return (
        <motion.div
            className={styles.pageContainer}
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Left Side - Features */}
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
                                    'Connect with Trusted Drivers',
                                    'Safe and Reliable Rides',
                                    'Join Our Community'
                                ],
                                autoStart: true,
                                loop: true,
                                deleteSpeed: 50,
                                delay: 80
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
                            whileHover={{ scale: 1.05 }}
                        >
                            {feature.icon}
                            <span>{feature.text}</span>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Right Side - Login Form */}
            <motion.div
                className={styles.formSection}
                variants={formVariants}
            >
                <motion.div className={styles.formContainer}>
                    <h2 className={styles.welcomeText}>Welcome Back</h2>
                    <p className={styles.welcomeSubtext}>Continue your journey with us</p>
                    <GoogleLoginButton text="Sign in with Google" />
                    <form onSubmit={handleSubmit} className={styles.loginForm}>
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
                                    placeholder="Enter your password"
                                    required
                                />
                                <button
                                    type="button"
                                    className={styles.passwordToggle}
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex="-1"
                                >
                                    {showPassword ? (
                                        <EyeOff className={styles.eyeIcon} />
                                    ) : (
                                        <Eye className={styles.eyeIcon} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className={styles.forgotPasswordRow}>
                            <motion.span
                                className={styles.forgotPasswordLink}
                                onClick={() => router.push('/auth/forgot-password')}
                                whileHover={{ scale: 1.05 }}
                            >
                                Forgot your password?
                            </motion.span>
                        </div>

                        <motion.button
                            type="submit"
                            className={styles.loginButton}
                            disabled={isLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isLoading ? <Spin /> : 'Log In'}
                        </motion.button>
                    </form>

                    <motion.p className={styles.signupPrompt}>
                        New to Drive Match Network?{' '}
                        <motion.span
                            className={styles.signupLink}
                            onClick={() => router.push('/auth/signup')}
                            whileHover={{ scale: 1.05 }}
                        >
                            Create an account
                        </motion.span>
                    </motion.p>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default Login;