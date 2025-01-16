// components/Loading/LoadingAnimation.js
import React from 'react';
import { motion } from 'framer-motion';
import styles from '../styles/LoadingAnimation.module.css';

const LoadingAnimation = () => {
    return (
        <div className={styles.container}>
            <div className={styles.loadingContent}>
                {/* Road Animation */}
                <div className={styles.road}>
                    <div className={styles.roadLine}></div>
                    <div className={styles.roadLine}></div>
                    <div className={styles.roadLine}></div>
                </div>

                {/* Car with Passengers */}
                <motion.div
                    className={styles.car}
                    animate={{
                        y: [-4, 4, -4],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                >
                    {/* Car Body */}
                    <div className={styles.carBody}>
                        {/* Windows */}
                        <div className={styles.windows}>
                            <div className={styles.window}></div>
                            <div className={styles.window}></div>
                        </div>
                        {/* Wheels */}
                        <motion.div
                            className={`${styles.wheel} ${styles.wheelFront}`}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.div
                            className={`${styles.wheel} ${styles.wheelBack}`}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                    </div>

                    {/* Passengers */}
                    <div className={styles.passengers}>
                        {[...Array(3)].map((_, index) => (
                            <motion.div
                                key={index}
                                className={styles.passenger}
                                animate={{ y: [-2, 2, -2] }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: index * 0.3,
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>
                </motion.div>

                {/* Loading Text */}
                <div className={styles.loadingText}>
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                    >
                        Drive Match Network
                    </motion.span>
                    <motion.div className={styles.dots}>
                        {[...Array(3)].map((_, index) => (
                            <motion.span
                                key={index}
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    delay: index * 0.2,
                                    ease: "easeInOut",
                                }}
                            >
                                .
                            </motion.span>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default LoadingAnimation;