import React, { useState, useEffect } from 'react';
import styles from '../../styles/Layout/navbar.module.css';
import { useAuth } from '../../context/Auth/AuthContext';
import { useChat } from '../../context/Chat/ChatContext'; // Import ChatContext
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    User,
    Car,
    Search,
    Bell,
    LogOut,
    MessageSquare,
    HelpCircle,
    MapPin,
    UserPlus,
    LayoutGrid,
    ClipboardList,
} from 'lucide-react';
import { Badge, Dropdown } from 'antd';

const Navbar = () => {
    const router = useRouter();
    const { currentUser, fetchCurrentUser } = useAuth();
    const { unreadCount } = useChat(); // Access unreadCount from ChatContext
    const [scrolled, setScrolled] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    // Handle scroll and resize effects
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const logout = () => {
        localStorage.removeItem('authToken');
        router.push('/auth/login');
    };

    // Navigation items for normal users
    const userNavigationItems = [
        {
            label: 'Find a Ride',
            href: '/ride/find-ride',
            icon: <Search className={styles.menuIcon} />,
        },
        {
            label: 'My Trip Requests',
            href: '/trip/my-trips',
            icon: <ClipboardList className={styles.menuIcon} />,
        },
    ];

    // Navigation items for drivers
    const driverNavigationItems = [
        {
            label: 'Available Requests',
            href: '/trip/available-trips',
            icon: <UserPlus className={styles.menuIcon} />,
        },
        {
            label: 'My Offers',
            href: '/ride/my-offers',
            icon: <LayoutGrid className={styles.menuIcon} />,
        },
        {
            label: 'Offer a Ride',
            href: '/ride/offer-ride',
            icon: <Car className={styles.menuIcon} />,
        },
    ];

    // Select navigation items based on user role
    const navigationItems = currentUser?.isDriver ? driverNavigationItems : userNavigationItems;

    // User menu items (for dropdown)
    const userMenuItems = [
        {
            key: 'profile',
            label: (
                <div className={styles.menuItem}>
                    <User size={16} />
                    <div className={styles.menuItemContent}>
                        <span className={styles.menuItemTitle}>{currentUser?.fullName}</span>
                        <span className={styles.menuItemSubtitle}>{currentUser?.email}</span>
                    </div>
                </div>
            ),
            onClick: () => router.push('/user/profile'),
        },
        { type: 'divider' },
        ...(isMobile
            ? navigationItems.map((item) => ({
                key: item.label,
                label: (
                    <div className={styles.menuItem}>
                        {item.icon}
                        <span>{item.label}</span>
                    </div>
                ),
                onClick: () => router.push(item.href),
            }))
            : []),
        ...(isMobile ? [{ type: 'divider' }] : []),
        {
            key: 'help',
            label: (
                <div className={styles.menuItem}>
                    <HelpCircle size={16} />
                    <span>Help & Support</span>
                </div>
            ),
            onClick: () => router.push('/help'),
        },
        {
            key: 'logout',
            label: (
                <div className={`${styles.menuItem} ${styles.logoutItem}`}>
                    <LogOut size={16} />
                    <span>Logout</span>
                </div>
            ),
            onClick: logout,
        },
    ];

    const goToInbox = () => {
        router.push('/inbox/chats');
    };

    const goToNotifications = () => {
        router.push('/notifications');
    };

    return (
        <motion.nav
            className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className={styles.navContainer}>
                {/* Left Section - Logo */}
                <Link href="/" className={styles.logoContainer}>
                    <Image
                        src="/images/carlogo.png"
                        alt="Drive Match Network"
                        width={40}
                        height={40}
                        className={styles.logo}
                    />
                    <span className={styles.logoText}>Drive Match</span>
                </Link>

                {/* Center Section - Navigation Items (Hidden on mobile) */}
                {!isMobile && (
                    <div className={styles.navCenter}>
                        {navigationItems.map((item, index) => (
                            <Link
                                key={index}
                                href={item.href}
                                className={`${styles.navItem} ${router.pathname === item.href ? styles.active : ''
                                    }`}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={styles.navItemContent}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Right Section */}
                <div className={styles.navRight}>
                    {/* Messages */}
                    <motion.button
                        className={styles.messageBtn}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={goToInbox}
                    >
                        <Badge count={unreadCount} size="small">
                            <MessageSquare className={styles.messageIcon} />
                        </Badge>
                    </motion.button>

                    {/* User Menu Dropdown */}
                    <Dropdown
                        menu={{ items: userMenuItems }}
                        trigger={['click']}
                        placement="bottomRight"
                        overlayClassName={styles.dropdownWrapper}
                    >
                        <motion.div
                            className={styles.userMenu}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className={styles.userAvatar}>
                                <Image
                                    src={currentUser?.profilePicture?.url || '/images/carlogo.png'}
                                    alt={currentUser?.fullName || 'User'}
                                    width={32}
                                    height={32}
                                    className={styles.avatarImage}
                                />
                            </div>
                            {!isMobile && (
                                <div className={styles.userInfo}>
                                    <span className={styles.userName}>
                                        {currentUser?.fullName?.split(' ')[0] || 'User'}
                                    </span>
                                </div>
                            )}
                        </motion.div>
                    </Dropdown>
                </div>
            </div>
        </motion.nav>
    );
};

export default Navbar;