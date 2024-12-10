import Head from 'next/head';
import { AuthProvider } from '../context/Auth/AuthContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </>
  );
}

export default MyApp;
