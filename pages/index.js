/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
import Head from 'next/head'
import Image from 'next/image'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion';
import { AuthTokenCheck } from '../components/Authentication/AuthTokenCheck';
import { useRouter } from 'next/router';
import Header from '../components/Navigation/Header';
import {
  MapPin,
  Users,
  Clock,
  Banknote,
  ShieldCheck,
  MessageSquare,
  Star,
  Car
} from 'lucide-react';
import styles from '../styles/Home.module.css'
import LoadingAnimation from '../components/LoadingAnimation';

export default function Home() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const { isAuthenticated, isUserVerified, hasFetchedUserDetails } = AuthTokenCheck();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  React.useEffect(() => {
    if (hasFetchedUserDetails) {
      if (isAuthenticated && isUserVerified) {
        router.replace('/user/profile');
      }
      setIsLoading(false);
    }
  }, [hasFetchedUserDetails, isAuthenticated, isUserVerified, router]);

  if (isLoading) return <LoadingAnimation />;

  return (
    <div className={styles.container}>
      <Head>
        <title>Drive Match Network - Smart Carpooling Platform</title>
        <meta name="description" content="Drive Match Network connects drivers and passengers for convenient, cost-effective carpooling. Save money, reduce traffic, and travel smarter with our secure ride-sharing platform." />
        <meta name="keywords" content="carpooling, ride sharing, car sharing, commute, eco-friendly transport, drive match network" />
        <meta property="og:title" content="Drive Match Network - Smart Carpooling Platform" />
        <meta property="og:description" content="Connect with drivers and passengers. Share rides, split costs, and make your commute more sustainable." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <Header />

        {/* Hero Section */}
        <section className={styles.hero}>
          <motion.div
            className={styles.heroContent}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Transform Your Daily
                <span className={styles.heroHighlight}>Commute</span>
              </h1>
              <p className={styles.heroDescription}>
                Connect with drivers and passengers, share rides, and make
                travel more affordable and sustainable.
              </p>
              <div className={styles.heroButtons}>
                <motion.button
                  className={styles.primaryButton}
                  onClick={() => router.push('/auth/signup')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Sharing Rides
                </motion.button>
                <motion.button
                  className={styles.secondaryButton}
                  onClick={() => router.push('#how-it-works')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  How It Works
                </motion.button>
              </div>
            </div>

            <div className={styles.heroImageWrapper}>
              <Image
                src="/images/heroimage.png"
                alt="Carpooling illustration"
                width={600}
                height={400}
                priority
                className={styles.heroImage}
              />
            </div>
          </motion.div>
        </section>

        {/* Key Features Section */}
        <section className={styles.features}>
          <h2 className={styles.sectionTitle}>Why Choose Drive Match Network?</h2>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <ShieldCheck className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Secure Platform</h3>
              <p className={styles.featureDescription}>Verified drivers and secure messaging system for your safety</p>
            </div>
            <div className={styles.featureCard}>
              <Banknote className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Cost Effective</h3>
              <p className={styles.featureDescription}>Split travel costs and save money on your daily commute</p>
            </div>
            <div className={styles.featureCard}>
              <MessageSquare className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Easy Communication</h3>
              <p className={styles.featureDescription}>Built-in chat system for seamless coordination</p>
            </div>
            <div className={styles.featureCard}>
              <Car className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Flexible Rides</h3>
              <p className={styles.featureDescription}>Find rides that match your schedule and route</p>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className={styles.howItWorks}>
          <div className={styles.sectionContainer}>
            <h2 className={styles.sectionTitle}>How It Works</h2>
            <p className={styles.sectionSubtitle}>Get started with Drive Match Network in three simple steps</p>

            <div className={styles.stepsContainer}>
              <motion.div
                className={styles.step}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <span className={styles.stepNumber}>1</span>
                <h3 className={styles.stepTitle}>Create Your Profile</h3>
                <p className={styles.stepDescription}>
                  Sign up and complete your profile. Verify your identity to start using the platform.
                </p>
              </motion.div>

              <motion.div
                className={styles.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className={styles.stepNumber}>2</span>
                <h3 className={styles.stepTitle}>Find or Offer Rides</h3>
                <p className={styles.stepDescription}>
                  Search for available rides along your route or offer seats in your vehicle.
                </p>
              </motion.div>

              <motion.div
                className={styles.step}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <span className={styles.stepNumber}>3</span>
                <h3 className={styles.stepTitle}>Travel Together</h3>
                <p className={styles.stepDescription}>
                  Connect through our chat system, share rides, and split costs efficiently.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
        {/* Benefits Section */}
        <section id="benefits" className={styles.benefits}>
          <div className={styles.sectionContainer}>
            <h2 className={styles.sectionTitle}>Benefits of Carpooling</h2>
            <div className={styles.benefitsGrid}>
              <motion.div
                className={styles.benefitCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <Banknote size={32} className={styles.benefitIcon} />
                <h3 className={styles.benefitTitle}>Save Money</h3>
                <p className={styles.benefitDescription}>
                  Reduce your travel costs by sharing expenses with fellow travelers
                </p>
              </motion.div>

              <motion.div
                className={styles.benefitCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Users size={32} className={styles.benefitIcon} />
                <h3 className={styles.benefitTitle}>Meet People</h3>
                <p className={styles.benefitDescription}>
                  Connect with like-minded individuals during your daily commute
                </p>
              </motion.div>

              <motion.div
                className={styles.benefitCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Clock size={32} className={styles.benefitIcon} />
                <h3 className={styles.benefitTitle}>Flexible Schedule</h3>
                <p className={styles.benefitDescription}>
                  Find rides that match your timing and route preferences
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className={styles.faqSection}>
          <div className={styles.sectionContainer}>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <div className={styles.faqContainer}>
              <motion.div
                className={styles.faqItem}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <h3 className={styles.faqQuestion}>How does payment work?</h3>
                <p className={styles.faqAnswer}>
                  Passengers and drivers can discuss and agree on cost-sharing arrangements
                  through our platform's messaging system.
                </p>
              </motion.div>

              <motion.div
                className={styles.faqItem}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <h3 className={styles.faqQuestion}>Is it safe to carpool with strangers?</h3>
                <p className={styles.faqAnswer}>
                  We implement user verification and provide a secure messaging system.
                  Both drivers and passengers can view profiles and make informed decisions.
                </p>
              </motion.div>

              <motion.div
                className={styles.faqItem}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <h3 className={styles.faqQuestion}>Can I choose who I travel with?</h3>
                <p className={styles.faqAnswer}>
                  Yes, you have full control over who you choose to travel with.
                  Review profiles and chat before confirming any ride arrangements.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className={styles.ctaSection}>
          <motion.div
            className={styles.ctaContainer}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <h2 className={styles.ctaTitle}>Ready to Start Your Journey?</h2>
            <p className={styles.ctaDescription}>
              Join Drive Match Network today and transform your daily commute
            </p>
            <motion.button
              className={styles.ctaButton}
              onClick={() => router.push('/auth/signup')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Now
            </motion.button>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <Image
                src="/images/carlogo.png"
                alt="Drive Match Network Logo"
                width={40}
                height={40}
                className={styles.footerLogo}
              />
              <h3 className={styles.footerTitle}>Drive Match Network</h3>
              <p className={styles.footerSubtitle}>Smart Carpooling Platform</p>
            </div>

            <div className={styles.footerLinksContainer}>
              <div className={styles.footerLinks}>
                <h4 className={styles.footerLinksTitle}>Quick Links</h4>
                <a href="#how-it-works" className={styles.footerLink}>How It Works</a>
                <a href="#benefits" className={styles.footerLink}>Benefits</a>
                <a href="#faq" className={styles.footerLink}>FAQ</a>
              </div>

              <div className={styles.footerLinks}>
                <h4 className={styles.footerLinksTitle}>Legal</h4>
                <a href="/privacy" className={styles.footerLink}>Privacy Policy</a>
                <a href="/terms" className={styles.footerLink}>Terms of Service</a>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p className={styles.copyright}>
              &copy; {new Date().getFullYear()} Drive Match Network. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}