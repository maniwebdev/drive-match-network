// pages/terms.js
/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Legal/Terms.module.css';
import Header from '../components/Navigation/Header';
import Footer from '../components/Navigation/Footer';

const TermsAndConditions = () => {
    return (
        <>
            <Head>
                <title>Terms & Conditions - DriveMatch Network</title>
                <meta name="description" content="Terms and conditions for using DriveMatch Network's carpooling and ride-sharing services." />
            </Head>

            <div className={styles.pageContainer}>
                <Header />

                <main className={styles.mainContent}>
                    <div className={styles.contentWrapper}>
                        <h1 className={styles.pageTitle}>Terms and Conditions</h1>
                        <p className={styles.lastUpdated}>Last updated: February 4, 2025</p>

                        {/* Introduction */}
                        <section className={styles.section}>
                            <h2>1. Introduction</h2>
                            <p>Welcome to DriveMatch Network ("we," "our," or "us"). By accessing or using our website, mobile application, and services, you agree to be bound by these Terms and Conditions. Please read them carefully before using our platform.</p>
                        </section>

                        {/* Definitions */}
                        <section className={styles.section}>
                            <h2>2. Definitions</h2>
                            <div className={styles.definitionList}>
                                <div className={styles.definitionItem}>
                                    <h3>"Service"</h3>
                                    <p>Refers to the DriveMatch Network platform, including website, mobile application, and all related services.</p>
                                </div>
                                <div className={styles.definitionItem}>
                                    <h3>"User"</h3>
                                    <p>Any individual who accesses or uses our Service, whether as a driver or passenger.</p>
                                </div>
                                <div className={styles.definitionItem}>
                                    <h3>"Ride"</h3>
                                    <p>A journey arranged through our platform between a driver and passenger(s).</p>
                                </div>
                            </div>
                        </section>

                        {/* User Eligibility */}
                        <section className={styles.section}>
                            <h2>3. User Eligibility</h2>
                            <p>To use our Service, you must:</p>
                            <ul className={styles.bulletList}>
                                <li>Be at least 18 years old</li>
                                <li>Have the legal capacity to enter into binding contracts</li>
                                <li>Not be barred from using our services under applicable law</li>
                            </ul>
                            <p>Additional requirements for drivers:</p>
                            <ul className={styles.bulletList}>
                                <li>Valid driver's license</li>
                                <li>Clean driving record</li>
                                <li>Valid vehicle registration and insurance</li>
                                <li>Pass our verification process</li>
                            </ul>
                        </section>

                        {/* Account Registration */}
                        <section className={styles.section}>
                            <h2>4. Account Registration</h2>
                            <p>Users must provide accurate, current, and complete information during registration. You are responsible for:</p>
                            <ul className={styles.bulletList}>
                                <li>Maintaining the confidentiality of your account credentials</li>
                                <li>All activities that occur under your account</li>
                                <li>Notifying us immediately of any unauthorized use</li>
                            </ul>
                        </section>

                        {/* Service Rules */}
                        <section className={styles.section}>
                            <h2>5. Service Rules and User Conduct</h2>
                            <p>Users agree not to:</p>
                            <ul className={styles.bulletList}>
                                <li>Post false, inaccurate, or misleading information</li>
                                <li>Engage in any fraudulent or illegal activities</li>
                                <li>Harass, abuse, or harm other users</li>
                                <li>Use the service for commercial purposes without authorization</li>
                                <li>Attempt to bypass any security measures</li>
                            </ul>
                        </section>

                        {/* Ride and Fees */}
                        <section className={styles.section}>
                            <h2>6. Ride Cost Sharing</h2>
                            <p>By using our Service:</p>
                            <ul className={styles.bulletList}>
                                <li>All ride cost sharing arrangements are made directly between drivers and passengers</li>
                                <li>DriveMatch Network does not handle any monetary transactions between users</li>
                                <li>Users are responsible for arranging their own cost-sharing agreements</li>
                                <li>We recommend discussing and agreeing on cost-sharing details before the ride</li>
                                <li>Any financial arrangements or disputes are solely between the users involved</li>
                            </ul>
                            <div className={styles.noteBox}>
                                <p><strong>Note:</strong> DriveMatch Network is a platform for connecting drivers and passengers. We do not process payments or handle financial transactions between users at this time.</p>
                            </div>
                        </section>

                        {/* Cancellation Policy */}
                        <section className={styles.section}>
                            <h2>7. Cancellation Policy</h2>
                            <p>Our cancellation policy includes:</p>
                            <ul className={styles.bulletList}>
                                <li>Free cancellation up to 24 hours before ride time</li>
                                <li>Cancellation fees may apply within 24 hours of the ride</li>
                                <li>Different policies for drivers and passengers</li>
                                <li>Special circumstances considerations</li>
                            </ul>
                        </section>

                        {/* Liability */}
                        <section className={styles.section}>
                            <h2>8. Limitation of Liability</h2>
                            <p>DriveMatch Network:</p>
                            <ul className={styles.bulletList}>
                                <li>Is not responsible for the conduct of users</li>
                                <li>Does not guarantee the accuracy of user information</li>
                                <li>Is not liable for any direct, indirect, or consequential damages</li>
                            </ul>
                        </section>

                        {/* Privacy */}
                        <section className={styles.section}>
                            <h2>9. Privacy and Data Protection</h2>
                            <p>We protect your personal information as described in our <Link href="/privacy-policy" className={styles.link}>Privacy Policy</Link>. By using our Service, you consent to our data practices.</p>
                        </section>

                        {/* Changes to Terms */}
                        <section className={styles.section}>
                            <h2>10. Changes to Terms</h2>
                            <p>We reserve the right to modify these terms at any time. We will notify users of significant changes via:</p>
                            <ul className={styles.bulletList}>
                                <li>Email notification</li>
                                <li>In-app notification</li>
                                <li>Website announcement</li>
                            </ul>
                        </section>

                        {/* Contact Information */}
                        <section className={styles.section}>
                            <h2>11. Contact Us</h2>
                            <p>For questions about these Terms, please contact us at:</p>
                            <div className={styles.contactInfo}>
                                <p>Email: support@drivematch.com</p>
                                <p>Address: [Your Company Address]</p>
                                <p>Phone: [Your Contact Number]</p>
                            </div>
                        </section>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
};

export default TermsAndConditions;