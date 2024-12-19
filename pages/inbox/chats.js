import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useChat } from '../../context/Chat/ChatContext';
import { useAuth } from '../../context/Auth/AuthContext';
import styles from '../../styles/Chat/Inbox.module.css';
import {
    MessageCircle,
    User,
    Check,
    CheckCheck
} from 'lucide-react';
import Navbar from '../../components/Navigation/Navbar';

const Inbox = () => {
    const router = useRouter();
    const { fetchUserChats, loading } = useChat();
    const { currentUser, fetchCurrentUser } = useAuth();

    // State
    const [chats, setChats] = useState([]);
    const [error, setError] = useState(null);

    // Load chats when user is available
    useEffect(() => {
        if (!currentUser){
            fetchCurrentUser();
        }
        if (currentUser) {
            loadChats();
        }
    }, [currentUser]);

    const loadChats = async () => {
        try {
            setError(null);
            const result = await fetchUserChats(1, 20);
            if (result?.chats) {
                setChats(result.chats);
                //console.log('Loaded chats:', result.chats); // Debug log
            }
        } catch (err) {
            console.error('Error loading chats:', err);
            setError('Failed to load chats');
        }
    };

    const handleChatClick = (chatId) => {
        router.push(`/chat/${chatId}`);
    };

    const formatMessageTime = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 24 * 60 * 60 * 1000) {
            return date.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        if (date.getFullYear() === now.getFullYear()) {
            return date.toLocaleDateString([], { 
                month: 'short', 
                day: 'numeric' 
            });
        }
        return date.toLocaleDateString([], { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    // Login required state
    if (!currentUser) {
        return (
            <>
                <Navbar />
                <div className={styles.loginRequired}>
                    <User size={48} />
                    <h2>Login Required</h2>
                    <p>Please login to access your messages</p>
                    <button
                        onClick={() => router.push('/auth/login')}
                        className={styles.loginButton}
                    >
                        Login to Continue
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className={styles.inboxContainer}>
                <div className={styles.header}>
                    <h1>Messages</h1>
                </div>

                {error && (
                    <div className={styles.errorState}>
                        <p>{error}</p>
                        <button 
                            onClick={loadChats} 
                            className={styles.retryButton}
                        >
                            Retry
                        </button>
                    </div>
                )}

                <div className={styles.chatList}>
                    {loading && chats.length === 0 ? (
                        <div className={styles.loadingState}>
                            <div className={styles.loadingSpinner} />
                            <p>Loading conversations...</p>
                        </div>
                    ) : chats.length === 0 ? (
                        <div className={styles.emptyState}>
                            <MessageCircle size={48} />
                            <h2>No Messages Yet</h2>
                            <p>Start a conversation with someone</p>
                        </div>
                    ) : (
                        chats.map((chat) => (
                            <div
                                key={chat._id}
                                className={styles.chatItem}
                                onClick={() => handleChatClick(chat._id)}
                            >
                                <div className={styles.chatItemContent}>
                                    <Image
                                        src={chat.recipientDetails?.profilePicture?.url || '/images/carlogo.png'}
                                        alt={chat.recipientDetails?.fullName}
                                        width={50}
                                        height={50}
                                        className={styles.avatar}
                                    />
                                    <div className={styles.chatInfo}>
                                        <div className={styles.chatHeader}>
                                            <h3>{chat.recipientDetails?.fullName}</h3>
                                            <span className={styles.timestamp}>
                                                {formatMessageTime(chat.lastMessage?.createdAt || chat.createdAt)}
                                            </span>
                                        </div>
                                        <div className={styles.lastMessage}>
                                            <p>
                                                {chat.lastMessage?.type === 'text' ? (
                                                    chat.lastMessage.content
                                                ) : chat.lastMessage?.type === 'image' ? (
                                                    'Sent an image'
                                                ) : chat.lastMessage?.type === 'audio' ? (
                                                    'Sent a voice message'
                                                ) : (
                                                    'Start a conversation'
                                                )}
                                            </p>
                                            {chat.unreadCount > 0 && (
                                                <span className={styles.unreadBadge}>
                                                    {chat.unreadCount}
                                                </span>
                                            )}
                                        </div>
                                        {chat.lastMessage?.senderId === currentUser._id && (
                                            <div className={styles.messageStatus}>
                                                {chat.lastMessage.read ? (
                                                    <CheckCheck size={16} className={styles.readIcon} />
                                                ) : (
                                                    <Check size={16} />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
};

export default Inbox;