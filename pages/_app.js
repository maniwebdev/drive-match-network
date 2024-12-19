import Head from 'next/head';
import { AuthProvider } from '../context/Auth/AuthContext';
import '../styles/globals.css';
import RideProvider from '../context/Ride/RideContext';
import ChatProvider from '../context/Chat/ChatContext';
import ReviewProvider from '../context/Review/ReviewContext';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <AuthProvider>
        <RideProvider>
          <ChatProvider>
            <ReviewProvider>
              <Component {...pageProps} />
            </ReviewProvider>
          </ChatProvider>
        </RideProvider>
      </AuthProvider>
    </>
  );
}

export default MyApp;
