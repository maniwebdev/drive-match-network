import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from '../Auth/AuthContext';
import io from 'socket.io-client';
import { debounce } from 'lodash';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCf40sFEpU55NM-wDDcxzxMCkAyaDv6orY",
    authDomain: "drive-match-network-5b68e.firebaseapp.com",
    projectId: "drive-match-network-5b68e",
    storageBucket: "drive-match-network-5b68e.firebasestorage.app",
    messagingSenderId: "1057879481955",
    appId: "1:1057879481955:web:d3704baac88b1db31e6256",
    measurementId: "G-QNEKJD8C7T"
};

// Initialize Firebase (safe for both SSR and client-side)
const firebaseApp = initializeApp(firebaseConfig);

const ChatContext = createContext();
const API_URL = process.env.NEXT_PUBLIC_Car_API_URL;

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const [chatId, setChatId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [chats, setChats] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [socket, setSocket] = useState(null);
    const [error, setError] = useState(null);
    const { currentUser, fetchCurrentUser } = useAuth();
    const [audioChunks, setAudioChunks] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initialize Firebase Messaging and Push Notifications (Client-side only)
    useEffect(() => {
        if (typeof window === 'undefined' || !currentUser) return; // Skip during SSR or if no user

        const messaging = getMessaging(firebaseApp);

        const setupNotifications = async () => {
            if (!('serviceWorker' in navigator)) {
              //  console.log('Service Workers are not supported in this browser.');
                return;
            }

            try {
                // Register Service Worker silently
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
             //   console.log('Service Worker registered with scope:', registration.scope);

                // Check notification permission without throwing errors
                const permission = Notification.permission;
                if (permission === 'granted') {
                    const token = await getToken(messaging, { serviceWorkerRegistration: registration });
                  //  console.log('FCM Token:', token);
                    await sendFcmTokenToBackend(token);
                } else if (permission === 'default') {
                    // Request permission only if not previously decided
                    const newPermission = await Notification.requestPermission();
                    if (newPermission === 'granted') {
                        const token = await getToken(messaging, { serviceWorkerRegistration: registration });
                    //    console.log('FCM Token:', token);
                        await sendFcmTokenToBackend(token);
                    }
                    // No logging for 'denied' or 'default' to avoid clutter
                }
                // Silently handle 'denied' or 'blocked' cases (do nothing)
            } catch (err) {
                // Only log unexpected errors (not permission-related)
                if (err.code !== 'messaging/permission-blocked' && err.code !== 'messaging/permission-default') {
                    console.error('Unexpected error in notification setup:', err);
                }
            }
        };

        const sendFcmTokenToBackend = async (token) => {
            const authToken = localStorage.getItem('authToken');
            try {
                const response = await fetch(`${API_URL}/api/auth/updateFcmToken`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': authToken,
                    },
                    body: JSON.stringify({ fcmToken: token }),
                });
                if (!response.ok) {
                    console.error('Failed to send FCM token to backend:', response.statusText);
                }
            } catch (err) {
                console.error('Error sending FCM token to backend:', err);
            }
        };

        // Handle foreground notifications
        onMessage(messaging, (payload) => {
          //  console.log('Foreground message received:', payload);
            setUnreadCount((prev) => prev + 1);
        });

        setupNotifications();
        fetchUnreadCount();
    }, [currentUser]);

    // Optimized Message Deduplication Helper
    const handleNewMessage = useCallback((newMessage) => {
        setMessages((prevMessages) => {
            const messageIds = new Set(prevMessages.map((msg) => msg._id));
            if (!messageIds.has(newMessage._id)) {
                const updatedMessages = [...prevMessages, newMessage].sort((a, b) =>
                    new Date(a.createdAt) - new Date(b.createdAt)
                );
                return updatedMessages;
            }
            return prevMessages;
        });
    }, []);

    // Fetch initial unread message count
    const fetchUnreadCount = async () => {
        const authToken = localStorage.getItem('authToken');
        try {
            const response = await fetch(`${API_URL}/api/chatRoute/unreadCount`, {
                headers: {
                    'auth-token': authToken,
                },
            });
            const data = await response.json();
            setUnreadCount(data.unreadCount || 0);
        } catch (err) {
            console.error('Failed to fetch unread count:', err);
        }
    };

    // Initialize Socket Connection
    useEffect(() => {
        if (!currentUser) return;

        const newSocket = io(API_URL, {
            query: { userId: currentUser._id },
            transports: ['websocket'],
            upgrade: false,
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Socket connected successfully');
        });

        newSocket.on('receiveMessage', ({ content, senderId, chatId: receivedChatId, messageId }) => {
            if (receivedChatId === chatId) {
                const newMessage = {
                    _id: messageId || Date.now().toString(),
                    content,
                    sender: { _id: senderId },
                    senderId: senderId,
                    chat: receivedChatId,
                    type: 'text',
                    createdAt: new Date().toISOString(),
                    read: false,
                    notificationSent: false,
                };
                handleNewMessage(newMessage);
            }

            setChats((prevChats) =>
                prevChats.map((chat) =>
                    chat._id === receivedChatId
                        ? {
                            ...chat,
                            lastMessage: content,
                            lastMessageContent: content,
                            updatedAt: new Date().toISOString(),
                        }
                        : chat
                )
            );
        });

        newSocket.on('typing', () => {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 3000);
        });

        newSocket.on('recordingStarted', () => {
            setIsRecording(true);
        });

        newSocket.on('recordingStopped', () => {
            setIsRecording(false);
        });

        newSocket.on('error', (errorMessage) => {
            setError(errorMessage);
            console.error('Socket error:', errorMessage);
        });

        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [currentUser, chatId, handleNewMessage]);

    // File Message Listener
    useEffect(() => {
        if (!socket) return;

        socket.on('receiveFileMessage', (data) => {
            if (data.chatId === chatId) {
                const newMessage = {
                    _id: data.messageId,
                    sender: { _id: data.senderId },
                    senderId: data.senderId,
                    chat: data.chatId,
                    type: 'image',
                    imageUrl: data.imageUrl,
                    createdAt: data.createdAt || new Date().toISOString(),
                    read: false,
                };
                handleNewMessage(newMessage);
            }
        });

        socket.on('recordingStarted', ({ senderId }) => {
            if (senderId !== currentUser._id) {
                setIsRecording(true);
            }
        });

        socket.on('recordingStopped', ({ senderId }) => {
            if (senderId !== currentUser._id) {
                setIsRecording(false);
            }
        });

        return () => {
            socket.off('receiveFileMessage');
            socket.off('recordingStarted');
            socket.off('recordingStopped');
        };
    }, [socket, chatId, currentUser, handleNewMessage]);

    // Audio Message Listener
    useEffect(() => {
        if (!socket) return;

        socket.on('receiveAudioMessage', (data) => {
            if (data.chatId === chatId) {
                const newMessage = {
                    _id: data.messageId,
                    sender: data.senderId,
                    chat: data.chatId,
                    type: 'audio',
                    voiceUrl: data.voiceUrl,
                    createdAt: new Date().toISOString(),
                    read: false,
                };
                handleNewMessage(newMessage);
            }

            setChats((prevChats) =>
                prevChats.map((chat) =>
                    chat._id === data.chatId
                        ? {
                            ...chat,
                            lastMessage: 'Sent a voice message',
                            lastMessageContent: 'Sent a voice message',
                            updatedAt: new Date().toISOString(),
                        }
                        : chat
                )
            );
        });

        return () => {
            socket.off('receiveAudioMessage');
        };
    }, [socket, chatId, handleNewMessage]);

    // Listen for new messages via WebSocket
    useEffect(() => {
        if (socket) {
            socket.on('receiveMessage', (data) => {
                if (data.chatId !== chatId) {
                    setUnreadCount((prev) => prev + 1);
                }
            });
        }
        return () => {
            if (socket) socket.off('receiveMessage');
        };
    }, [socket, chatId]);

    // Create New Chat
    const createChat = async (participantId) => {
        setIsLoading(true);
        const authToken = localStorage.getItem('authToken');

        try {
            const response = await fetch(`${API_URL}/api/chatRoute/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken,
                },
                body: JSON.stringify({ participantId }),
            });

            if (!response.ok) {
                throw new Error('Failed to create chat');
            }

            const newChat = await response.json();
            setChats((prev) => [...prev, newChat]);
            setChatId(newChat._id);

            if (socket) {
                socket.emit('joinRoom', { chatId: newChat._id });
            }

            return newChat;
        } catch (err) {
            setError('Failed to create chat: ' + err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch User Chats with Pagination
    const fetchUserChats = useCallback(async (page = 1, limit = 10) => {
        setIsLoading(true);
        const authToken = localStorage.getItem('authToken');

        try {
            const response = await fetch(
                `${API_URL}/api/chatRoute/userChats?page=${page}&limit=${limit}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': authToken,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch chats');
            }

            const data = await response.json();
            setChats(data.chats);

            return {
                chats: data.chats,
                totalChats: data.totalChats,
                currentPage: data.page,
                totalPages: data.totalPages,
            };
        } catch (err) {
            setError('Failed to fetch chats: ' + err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch Messages for a Chat with Pagination
    const fetchMessages = useCallback(async (chatId, skip = 0, limit = 10) => {
        if (!chatId) return null;

        setIsLoading(true);
        const authToken = localStorage.getItem('authToken');

        try {
            const response = await fetch(
                `${API_URL}/api/chatRoute/messages/${chatId}?skip=${skip}&limit=${limit}`,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'auth-token': authToken,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }

            const fetchedMessages = await response.json();

            setMessages((prevMessages) => {
                if (skip > 0) {
                    const newMessages = [...fetchedMessages, ...prevMessages];
                    return Array.from(
                        new Map(newMessages.map((msg) => [msg._id, msg])).values()
                    );
                }
                return fetchedMessages;
            });

            return fetchedMessages;
        } catch (err) {
            setError('Failed to fetch messages: ' + err.message);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Send Text Message
    const sendMainMessage = async (chatId, content) => {
        if (!chatId || !content) return null;

        const authToken = localStorage.getItem('authToken');
        try {
            const response = await fetch(`${API_URL}/api/chatRoute/sendMainMessage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken,
                },
                body: JSON.stringify({ chatId, content }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const newMessage = await response.json();
            const messageWithSender = {
                ...newMessage,
                sender: currentUser._id,
                chat: chatId,
                createdAt: new Date().toISOString(),
                read: false,
                notificationSent: false,
            };

            setMessages((prev) => [...prev, messageWithSender]);

            if (socket) {
                socket.emit('sendMessage', {
                    chatId,
                    content,
                    senderId: currentUser._id,
                    messageId: newMessage._id,
                });
            }

            return newMessage;
        } catch (err) {
            setError('Failed to send message: ' + err.message);
            return null;
        }
    };

    // Audio Message Handling
    const sendAudioMessage = async (audioBlob, chatId) => {
        if (!socket || !chatId || !audioBlob) return;

        try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);

            reader.onloadend = () => {
                const base64Audio = reader.result.split(',')[1];
                const tempId = Date.now().toString();
                const tempMessage = {
                    _id: tempId,
                    sender: currentUser._id,
                    chat: chatId,
                    type: 'audio',
                    voiceUrl: URL.createObjectURL(audioBlob),
                    createdAt: new Date().toISOString(),
                    read: false,
                    isTemp: true,
                };

                setMessages((prev) => [...prev, tempMessage]);

                socket.emit('audioMessage', {
                    chatId,
                    senderId: currentUser._id,
                    audioChunk: base64Audio,
                    tempId,
                });
            };
        } catch (err) {
            setError('Failed to send audio message: ' + err.message);
        }
    };

    // Recording Handlers
    const startRecording = useCallback(
        (chatId) => {
            if (socket && chatId) {
                socket.emit('startRecording', {
                    chatId,
                    senderId: currentUser._id,
                });
            }
        },
        [socket, currentUser]
    );

    const stopRecording = useCallback(
        (chatId) => {
            if (socket && chatId) {
                socket.emit('stopRecording', {
                    chatId,
                    senderId: currentUser._id,
                });
            }
        },
        [socket, currentUser]
    );

    // Typing Indicator
    const handleTyping = debounce(() => {
        if (socket && chatId) {
            socket.emit('typing', { chatId });
        }
    }, 300);

    // Fetch User Profile
    const fetchUserProfile = async (userId) => {
        if (!userId) return null;

        const authToken = localStorage.getItem('authToken');
        try {
            const response = await fetch(`${API_URL}/api/chatRoute/profile/${userId}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user profile');
            }

            return await response.json();
        } catch (err) {
            setError('Failed to fetch user profile: ' + err.message);
            return null;
        }
    };

    // Join Chat Room
    const joinChatRoom = useCallback(
        (chatId) => {
            if (socket && chatId) {
                socket.emit('joinRoom', { chatId });
            }
        },
        [socket]
    );

    // Handle File Messages
    const sendFileMessage = useCallback(
        async (file, chatId) => {
            if (!file || !chatId) return null;

            const authToken = localStorage.getItem('authToken');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('chatId', chatId);

            try {
                const response = await fetch(`${API_URL}/api/chatRoute/sendFileMessage`, {
                    method: 'POST',
                    headers: {
                        'auth-token': authToken,
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Failed to upload image');
                }

                const { data } = await response.json();
                const newMessage = {
                    _id: data._id,
                    sender: currentUser._id,
                    chat: chatId,
                    type: 'image',
                    imageUrl: data.imageUrl,
                    createdAt: new Date().toISOString(),
                    read: false,
                };

                setMessages((prev) => [...prev, newMessage]);

                if (socket) {
                    socket.emit('sendFileMessage', {
                        chatId,
                        messageId: data._id,
                        senderId: currentUser._id,
                        type: 'image',
                        imageUrl: data.imageUrl,
                    });
                }

                return newMessage;
            } catch (err) {
                console.error('Failed to send image:', err);
                setError('Failed to send image: ' + err.message);
                return null;
            }
        },
        [currentUser, socket]
    );

    // Mark Messages as Read
    const markMessagesAsRead = useCallback(async (chatId) => {
        const authToken = localStorage.getItem('authToken');
        try {
            const response = await fetch(`${API_URL}/api/chatRoute/markAsRead/${chatId}`, {
                method: 'PATCH',
                headers: {
                    'auth-token': authToken,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setUnreadCount((prev) => Math.max(prev - (data.updatedMessagesCount || 0), 0));
            } else {
                console.error('Failed to mark messages as read:', response.statusText);
            }
        } catch (err) {
            console.error('Failed to mark messages as read:', err);
        }
    }, [setUnreadCount]);

    const contextValue = {
        socket,
        chatId,
        setChatId,
        messages,
        chats,
        isTyping,
        isRecording,
        isLoading,
        error,
        createChat,
        fetchUserChats,
        sendMainMessage,
        fetchMessages,
        sendAudioMessage,
        startRecording,
        stopRecording,
        handleTyping,
        fetchUserProfile,
        joinChatRoom,
        sendFileMessage,
        audioChunks,
        setAudioChunks,
        handleNewMessage,
        markMessagesAsRead,
        unreadCount,
    };

    return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};

export default ChatProvider;