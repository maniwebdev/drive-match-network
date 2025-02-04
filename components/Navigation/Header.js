// components/Landing/Header.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import styles from '../../styles/Layout/Header.module.css';

const Header = () => {
    const router = useRouter();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Navigation Links
    const navigationLinks = [
        { title: 'Find Rides', href: '/' },
        { title: 'Ride Requests', href: '/ride-requests' },
        { title: 'How It Works', href: '#how-it-works' },
        { title: 'Why Choose', href: '#choose' },
    ];

    return (
        <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
            <div className={styles.headerContainer}>
                {/* Logo Section */}
                <Link href="/" className={styles.logoContainer}>
                    <Image
                        src="/images/carlogo.png"
                        alt="CarPool Logo"
                        width={40}
                        height={40}
                        className={styles.logo}
                    />
                    <span className={styles.logoText}>DriveMatch</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className={styles.desktopNav}>
                    {navigationLinks.map((link) => (
                        <Link
                            key={link.title}
                            href={link.href}
                            className={styles.navLink}
                        >
                            {link.title}
                        </Link>
                    ))}
                </nav>

                {/* Auth Buttons */}
                <div className={styles.authButtons}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={styles.loginButton}
                        onClick={() => router.push('/auth/login')}
                    >
                        Login
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={styles.signupButton}
                        onClick={() => router.push('/auth/signup')}
                    >
                        Sign Up
                    </motion.button>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className={styles.mobileMenuButton}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            className={styles.mobileMenu}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <nav className={styles.mobileNav}>
                                {navigationLinks.map((link) => (
                                    <Link
                                        key={link.title}
                                        href={link.href}
                                        className={styles.mobileNavLink}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.title}
                                    </Link>
                                ))}
                                <div className={styles.mobileAuthButtons}>
                                    <button
                                        className={styles.mobileLoginButton}
                                        onClick={() => router.push('/auth/login')}
                                    >
                                        Login
                                    </button>
                                    <button
                                        className={styles.mobileSignupButton}
                                        onClick={() => router.push('/auth/signup')}
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
};

export default Header;