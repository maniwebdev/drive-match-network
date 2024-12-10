// /* eslint-disable react/no-unescaped-entities */
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ArrowLeft, Timer, Shield, Mail, LockKeyhole } from 'lucide-react';
import { motion } from 'framer-motion';
import styles from '../../styles/Authentication/VerifyOTP.module.css';
import { message } from 'antd';

const VerifyOTP = () => {
    const router = useRouter();
    const [otp, setOtp] = useState(['', '', '', '', '', '']); // Changed to 6 digits
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(600);
    const [canResend, setCanResend] = useState(true);
    const inputRefs = useRef([]);

    const verificationSteps = [
        {
            icon: <Mail className={styles.stepIcon} />,
            title: "Check Email",
            description: "We've sent a code to your email"
        },
        {
            icon: <Shield className={styles.stepIcon} />,
            title: "Enter Code",
            description: "Type the verification code here"
        },
        {
            icon: <LockKeyhole className={styles.stepIcon} />,
            title: "Verify Account",
            description: "Complete your account setup"
        }
    ];

    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, 6);
        const expiryTime = localStorage.getItem('otpExpiry');
        if (expiryTime) {
            const remaining = Math.max(0, Math.floor((parseInt(expiryTime) - Date.now()) / 1000));
            setTimeRemaining(remaining);
            setCanResend(remaining === 0);
        }
    }, []);

    useEffect(() => {
        let timer;
        if (timeRemaining > 0) {
            timer = setInterval(() => {
                setTimeRemaining(prev => {
                    const newTime = prev - 1;
                    if (newTime === 0) setCanResend(true);
                    return newTime;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [timeRemaining]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const handleChange = (value, index) => {
        const sanitizedValue = value.replace(/[^0-9]/g, '').slice(0, 1);
        
        setOtp(currentOtp => {
            const newOtp = [...currentOtp];
            newOtp[index] = sanitizedValue;
            return newOtp;
        });

        if (sanitizedValue && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                inputRefs.current[index - 1].focus();
            } else {
                const newOtp = [...otp];
                newOtp[index] = '';
                setOtp(newOtp);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1].focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
        const newOtp = [...otp];

        for (let i = 0; i < pastedData.length; i++) {
            newOtp[i] = pastedData[i];
        }

        setOtp(newOtp);
        const focusIndex = Math.min(5, pastedData.length - 1);
        inputRefs.current[focusIndex].focus();
    };

    const handleVerify = async () => {
        if (otp.join('').length !== 6) {
            message.error('Please enter the complete verification code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_Car_API_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Otp: otp.join('') }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess(true);
                message.success('Account verified successfully!');
                localStorage.removeItem('otpExpiry');
                setTimeout(() => router.push('/auth/login'), 2000);
            } else {
                throw new Error(data.error || 'Invalid verification code');
            }
        } catch (error) {
            setError(error.message);
            setOtp(['', '', '', '', '', '']);
            inputRefs.current[0].focus();
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!canResend) return;

        setIsLoading(true);
        const userEmail = localStorage.getItem('userEmail');

        if (!userEmail) {
            setError('Email not found. Please try signing up again.');
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_Car_API_URL}/api/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail }),
            });

            const data = await response.json();

            if (data.success) {
                message.success('New verification code sent!');
                setCanResend(false);
                setTimeRemaining(data.expiresIn);
                localStorage.setItem('otpExpiry', Date.now() + (data.expiresIn * 1000));
                setOtp(['', '', '', '', '', '']);
                inputRefs.current[0].focus();
            } else {
                throw new Error(data.error || 'Failed to resend code');
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            className={styles.pageContainer}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            <Head>
                <title>Verify Account - Drive Match Network</title>
                <meta name="description" content="Verify your Drive Match Network account to start connecting with trusted drivers and passengers." />
            </Head>

            {/* Left Section - Steps */}
            <div className={styles.stepsSection}>
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
                    {verificationSteps.map((step, index) => (
                        <motion.div
                            key={index}
                            className={styles.stepCard}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            {step.icon}
                            <div className={styles.stepContent}>
                                <h3>{step.title}</h3>
                                <p>{step.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Right Section - Verification Form */}
            <div className={styles.formSection}>
                <div className={styles.formContainer}>
                    {success ? (
                        <motion.div 
                            className={styles.successContent}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <CheckCircle2 className={styles.successIcon} />
                            <h2>Verification Successful!</h2>
                            <p>Redirecting to login...</p>
                        </motion.div>
                    ) : (
                        <>
                            <div className={styles.formHeader}>
                                <h2>Account Verification</h2>
                                <p>Enter the 6-digit code sent to your email</p>
                            </div>

                            <div className={styles.otpContainer}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => inputRefs.current[index] = el}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleChange(e.target.value, index)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        onPaste={index === 0 ? handlePaste : undefined}
                                        className={`${styles.otpInput} ${error ? styles.error : ''}`}
                                    />
                                ))}
                            </div>

                            {timeRemaining > 0 && (
                                <div className={styles.timer}>
                                    <Timer size={16} />
                                    <span>Code expires in {formatTime(timeRemaining)}</span>
                                </div>
                            )}

                            {error && (
                                <div className={styles.errorMessage}>
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <motion.button
                                className={styles.verifyButton}
                                onClick={handleVerify}
                                disabled={isLoading || otp.join('').length !== 6}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isLoading ? 'Verifying...' : 'Verify Account'}
                            </motion.button>

                            <div className={styles.bottomActions}>
                                <button
                                    onClick={handleResendOTP}
                                    className={styles.resendButton}
                                    disabled={!canResend || isLoading}
                                >
                                    {canResend ? 'Resend Code' : `Wait ${formatTime(timeRemaining)}`}
                                </button>

                                <Link href="/auth/login" className={styles.backLink}>
                                    <ArrowLeft size={16} />
                                    <span>Back to Login</span>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default VerifyOTP;