// pages/privacy-policy.js
/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import Head from 'next/head';
import styles from '../styles/Legal/Privacy.module.css';
import Header from '../components/Navigation/Header';
import { Shield, UserCheck, MapPin, Bell, Mail, Lock } from 'lucide-react';

const PrivacyPolicy = () => {
    return (
        <>
            <Head>
                <title>Privacy Policy - DriveMatch Network</title>
                <meta name="description" content="Learn about how DriveMatch Network collects, uses, and protects your personal information." />
            </Head>

            <div className={styles.pageContainer}>
                <Header />

                <main className={styles.mainContent}>
                    <div className={styles.contentWrapper}>
                        <h1 className={styles.pageTitle}>Privacy Policy</h1>
                        <p className={styles.lastUpdated}>Last updated: February 4, 2025</p>

                        {/* Introduction */}
                        <section className={styles.section}>
                            <div className={styles.sectionIcon}>
                                <Shield className={styles.icon} />
                            </div>
                            <h2>1. Introduction</h2>
                            <p>At DriveMatch Network, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.</p>
                        </section>

                        {/* Information We Collect */}
                        <section className={styles.section}>
                            <div className={styles.sectionIcon}>
                                <UserCheck className={styles.icon} />
                            </div>
                            <h2>2. Information We Collect</h2>

                            <h3>2.1 Information You Provide</h3>
                            <ul className={styles.bulletList}>
                                <li>Account Information (name, email, phone number)</li>
                                <li>Profile Information (profile picture, bio)</li>
                                <li>For Drivers: Driver's license information</li>
                                <li>Vehicle Information (for drivers)</li>
                                <li>Travel preferences and requirements</li>
                            </ul>

                            <h3>2.2 Information Automatically Collected</h3>
                            <ul className={styles.bulletList}>
                                <li>Device information (IP address, browser type)</li>
                                <li>Usage data (features accessed, interactions)</li>
                                <li>Location data (with your permission)</li>
                                <li>Cookies and similar tracking technologies</li>
                            </ul>
                        </section>

                        {/* How We Use Your Information */}
                        <section className={styles.section}>
                            <div className={styles.sectionIcon}>
                                <MapPin className={styles.icon} />
                            </div>
                            <h2>3. How We Use Your Information</h2>
                            <p>We use your information to:</p>
                            <ul className={styles.bulletList}>
                                <li>Provide and improve our services</li>
                                <li>Match drivers with passengers</li>
                                <li>Ensure platform safety and security</li>
                                <li>Communicate important updates</li>
                                <li>Analyze and improve our platform</li>
                                <li>Comply with legal obligations</li>
                            </ul>
                        </section>

                        {/* Information Sharing */}
                        <section className={styles.section}>
                            <div className={styles.sectionIcon}>
                                <Bell className={styles.icon} />
                            </div>
                            <h2>4. Information Sharing</h2>
                            <p>We may share your information with:</p>
                            <ul className={styles.bulletList}>
                                <li>Other users (as needed for ride arrangements)</li>
                                <li>Service providers and partners</li>
                                <li>Legal authorities when required by law</li>
                            </ul>
                            <div className={styles.noteBox}>
                                <p><strong>Note:</strong> We never sell your personal information to third parties.</p>
                            </div>
                        </section>

                        {/* Data Security */}
                        <section className={styles.section}>
                            <div className={styles.sectionIcon}>
                                <Lock className={styles.icon} />
                            </div>
                            <h2>5. Data Security</h2>
                            <p>We implement appropriate security measures to protect your information:</p>
                            <ul className={styles.bulletList}>
                                <li>Encryption of sensitive data</li>
                                <li>Regular security assessments</li>
                                <li>Access controls and authentication</li>
                                <li>Secure data storage practices</li>
                            </ul>
                        </section>

                        {/* Your Rights */}
                        <section className={styles.section}>
                            <div className={styles.sectionIcon}>
                                <UserCheck className={styles.icon} />
                            </div>
                            <h2>6. Your Rights and Choices</h2>
                            <p>You have the right to:</p>
                            <ul className={styles.bulletList}>
                                <li>Access your personal information</li>
                                <li>Correct inaccurate data</li>
                                <li>Request deletion of your data</li>
                                <li>Opt-out of marketing communications</li>
                                <li>Control your privacy settings</li>
                            </ul>
                        </section>

                        {/* Cookies */}
                        <section className={styles.section}>
                            <h2>7. Cookies and Tracking Technologies</h2>
                            <p>We use cookies and similar technologies to:</p>
                            <ul className={styles.bulletList}>
                                <li>Remember your preferences</li>
                                <li>Analyze platform usage</li>
                                <li>Improve user experience</li>
                                <li>Maintain platform security</li>
                            </ul>
                            <p>You can manage cookie preferences through your browser settings.</p>
                        </section>

                        {/* Children's Privacy */}
                        <section className={styles.section}>
                            <h2>8. Children's Privacy</h2>
                            <p>Our service is not intended for users under 18 years of age. We do not knowingly collect information from children.</p>
                        </section>

                        {/* Contact Information */}
                        <section className={styles.section}>
                            <div className={styles.sectionIcon}>
                                <Mail className={styles.icon} />
                            </div>
                            <h2>9. Contact Us</h2>
                            <p>For privacy-related questions or concerns, please contact us at:</p>
                            <div className={styles.contactInfo}>
                                <p>Email: support@drivematch.com</p>
                                <p>Address: [Your Company Address]</p>
                            </div>
                        </section>

                        {/* Updates to Policy */}
                        <section className={styles.section}>
                            <h2>10. Changes to This Policy</h2>
                            <p>We may update this Privacy Policy periodically. We will notify you of any significant changes via:</p>
                            <ul className={styles.bulletList}>
                                <li>Email notification</li>
                                <li>Notice on our platform</li>
                                <li>Updated "Last modified" date</li>
                            </ul>
                        </section>
                    </div>
                </main>
            </div>
        </>
    );
};

export default PrivacyPolicy;