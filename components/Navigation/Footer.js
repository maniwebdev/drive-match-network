// components/Footer/Footer.js
import React from 'react';
import Link from 'next/link';
import { Twitter, Facebook, Linkedin, Heart } from 'lucide-react';
import styles from '../../styles/Layout/Footer.module.css';

const Footer = () => {
    return (
        <footer className={styles.footer}>
            <div className={styles.footerContent}>
                {/* Company Info */}
                <div className={styles.companyInfo}>
                    <div className={styles.companyLogo}>
                        DriveMatch
                    </div>
                    <p className={styles.companyDescription}>
                        Connecting drivers and passengers for a sustainable and affordable way to travel.
                    </p>
                </div>

                {/* Quick Links */}
                <div className={styles.linksSection}>
                    <h3>Quick Links</h3>
                    <div className={styles.links}>
                        <Link href="/about" className={styles.link}>
                            About Us
                        </Link>
                        <Link href="/how-it-works" className={styles.link}>
                            How It Works
                        </Link>
                        <Link href="/contact" className={styles.link}>
                            Contact Us
                        </Link>
                    </div>
                </div>

                {/* Legal Links */}
                <div className={styles.linksSection}>
                    <h3>Legal</h3>
                    <div className={styles.links}>
                        <Link href="/privacy-policy" className={styles.link}>
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className={styles.link}>
                            Terms & Conditions
                        </Link>
                        <Link href="/guidelines" className={styles.link}>
                            Community Guidelines
                        </Link>
                    </div>
                </div>

                {/* Social Links */}
                <div className={styles.socialSection}>
                    <h3>Connect With Us</h3>
                    <div className={styles.socialLinks}>
                        <a
                            href="https://twitter.com/drivematch"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialLink}
                        >
                            <Twitter size={20} />
                        </a>
                        <a
                            href="https://facebook.com/drivematch"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialLink}
                        >
                            <Facebook size={20} />
                        </a>
                        <a
                            href="https://linkedin.com/company/drivematch"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.socialLink}
                        >
                            <Linkedin size={20} />
                        </a>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className={styles.bottomBar}>
                <div className={styles.bottomContent}>
                    <p className={styles.copyright}>
                        © {new Date().getFullYear()} DriveMatch. All rights reserved.
                    </p>
                    <p className={styles.credit}>
                        Made with <Heart size={14} className={styles.heartIcon} /> by{' '}
                        <a
                            href="https://www.maniwebdev.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.creditLink}
                        >
                            ManiWebDev
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;