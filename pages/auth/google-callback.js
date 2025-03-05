import { useEffect } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/Authentication/google-callback.module.css';
import LoadingAnimation from '../../components/LoadingAnimation';

const GoogleCallback = () => {
    const router = useRouter();

    useEffect(() => {
        if (router.query.token) {
            // Store the auth token in localStorage
            localStorage.setItem('authToken', router.query.token);

            // Redirect to home or dashboard
            setTimeout(() => {
                router.push('/user/profile');
            }, 2500); // Slightly longer timeout to see the animation
        } else if (router.query.error) {
            // Handle error case
            setTimeout(() => {
                router.push('/auth/login?error=google_auth_failed');
            }, 2000);
        }
    }, [router.query]);

    return (
        <div className={styles.callbackContainer}>
            <div className={styles.loadingWrapper}>
                <h2 className={styles.title}>Welcome to Drive Match Network</h2>
                <div className={styles.animationContainer}>
                    <LoadingAnimation />
                </div>
                <p className={styles.loadingMessage}>Completing authentication, please wait...</p>
            </div>
        </div>
    );
};

export default GoogleCallback;