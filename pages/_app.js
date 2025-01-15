import Head from 'next/head';
import { AuthProvider } from '../context/Auth/AuthContext';
import '../styles/globals.css';
import RideProvider from '../context/Ride/RideContext';
import ChatProvider from '../context/Chat/ChatContext';
import ReviewProvider from '../context/Review/ReviewContext';
import TripProvider from '../context/Ride/TripContext';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <AuthProvider>
        <RideProvider>
          <TripProvider>
            <ChatProvider>
              <ReviewProvider>
                <Component {...pageProps} />
              </ReviewProvider>
            </ChatProvider>
          </TripProvider>
        </RideProvider>
      </AuthProvider>
    </>
  );
}

export default MyApp;
