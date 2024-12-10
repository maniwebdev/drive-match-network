// import Head from 'next/head'
// import Image from 'next/image'
// import styles from '../styles/Home.module.css'

// export default function Home() {
//   return (
//     <div>
//       <Head>
//         <title>Drive Match Network</title>
//         <meta name="description" content="Drive Match Network" />
//         <link rel="icon" href="/favicon.ico" />
//       </Head>

//       <main>
       
//       </main>
//     </div>
//   )
// }
import Head from 'next/head'
import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div style={styles.container}>
      <Head>
        <title>Drive Match Network</title>
        <meta name="description" content="Drive Match Network - Coming Soon" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet" />
      </Head>

      <main style={styles.main}>
        <div style={{
          ...styles.content,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s ease-out'
        }}>
          <div style={styles.emojiContainer}>
            <span style={styles.emoji} className="carEmoji">🚗</span>
            <span style={styles.emoji} className="peopleEmoji">👥</span>
            <span style={styles.emoji} className="earthEmoji">🌍</span>
          </div>
          
          <h1 style={styles.title}>Drive Match Network</h1>
          <p style={styles.subtitle}>The Future of Carpooling is Coming Soon</p>
          
          <div style={styles.features}>
            <div style={styles.feature}>
              <span style={styles.featureEmoji}>💰</span>
              <p>Save Money</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureEmoji}>🌱</span>
              <p>Reduce Carbon Footprint</p>
            </div>
            <div style={styles.feature}>
              <span style={styles.featureEmoji}>🤝</span>
              <p>Meet New People</p>
            </div>
          </div>

          <div style={styles.newsletter}>
            <input 
              type="email" 
              placeholder="Enter your email for updates"
              style={styles.input}
            />
            <button style={styles.button}>
              Notify Me
            </button>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .carEmoji {
          animation: driveAround 3s infinite;
        }
        
        .peopleEmoji {
          animation: bounce 2s infinite;
        }
        
        .earthEmoji {
          animation: rotate 10s linear infinite;
        }
        
        @keyframes driveAround {
          0% { transform: translateX(-20px); }
          50% { transform: translateX(20px); }
          100% { transform: translateX(-20px); }
        }
        
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Poppins', sans-serif",
    color: 'white',
    textAlign: 'center',
    padding: '20px',
  },
  main: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  content: {
    padding: '40px',
    borderRadius: '20px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
  },
  emojiContainer: {
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
  },
  emoji: {
    fontSize: '40px',
    display: 'inline-block',
  },
  title: {
    fontSize: '3rem',
    fontWeight: '700',
    marginBottom: '10px',
    background: 'linear-gradient(to right, #fff, #e0e0e0)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '1.5rem',
    marginBottom: '40px',
    opacity: '0.9',
  },
  features: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    marginBottom: '40px',
    flexWrap: 'wrap',
  },
  feature: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  featureEmoji: {
    fontSize: '30px',
  },
  newsletter: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  input: {
    padding: '12px 20px',
    borderRadius: '25px',
    border: 'none',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    fontSize: '1rem',
    minWidth: '250px',
    outline: 'none',
    '::placeholder': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
  },
  button: {
    padding: '12px 30px',
    borderRadius: '25px',
    border: 'none',
    background: 'white',
    color: '#764ba2',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    ':hover': {
      transform: 'scale(1.05)',
    },
  },
};