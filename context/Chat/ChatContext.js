import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from '../Auth/AuthContext';
import io from 'socket.io-client';
import { debounce } from 'lodash';

const ChatContext = createContext();
const API_URL = process.env.NEXT_PUBLIC_Car_API_URL;

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    // State Management for Chat Functionality
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

    // Message deduplication helper
    const handleNewMessage = (newMessage) => {
        setMessages(prevMessages => {
            const messageExists = prevMessages.some(msg => msg._id === newMessage._id);
            if (messageExists) return prevMessages;

            // Sort messages by timestamp if message has createdAt
            const updatedMessages = [...prevMessages, newMessage].sort((a, b) =>
                new Date(a.createdAt) - new Date(b.createdAt)
            );

            return updatedMessages;
        });
    };

    // Initialize Socket Connection
    useEffect(() => {
        if (!currentUser) return;

        const newSocket = io(API_URL, {
            query: { userId: currentUser._id },
            transports: ['websocket'],
            upgrade: false
        });

        setSocket(newSocket);

        // Socket Event Listeners
        newSocket.on('connect', () => {
            console.log('Socket connected successfully');
        });

        // Single receiveMessage handler
        newSocket.on('receiveMessage', ({ content, senderId, chatId, messageId }) => {

            const newMessage = {
                _id: messageId || Date.now().toString(),
                content,
                sender: {
                    _id: senderId // Add sender object structure to match populated messages
                },
                senderId: senderId, // Keep this for compatibility
                chat: chatId,
                type: 'text',
                createdAt: new Date().toISOString(),
                read: false,
                notificationSent: false
            };

            setMessages(prevMessages => [...prevMessages, newMessage]);

            // Also update the chat's last message
            setChats(prevChats =>
                prevChats.map(chat =>
                    chat._id === chatId
                        ? {
                            ...chat,
                            lastMessage: content,
                            lastMessageContent: content,
                            updatedAt: new Date().toISOString()
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

        // Cleanup on unmount
        return () => {
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [currentUser]);

    useEffect(() => {
        if (!socket) return;

        socket.on('receiveFileMessage', (data) => {
            const newMessage = {
                _id: data.messageId,
                sender: {
                    _id: data.senderId // Add sender object structure
                },
                senderId: data.senderId, // Keep this for compatibility
                chat: data.chatId,
                type: 'image',
                imageUrl: data.imageUrl,
                createdAt: data.createdAt || new Date().toISOString(),
                read: false
            };

            setMessages(prev => [...prev, newMessage]);
        });

        socket.on('recordingStarted', ({ senderId }) => {
            // Only set recording state if it's not the current user
            if (senderId !== currentUser._id) {
                setIsRecording(true);
            }
        });

        socket.on('recordingStopped', ({ senderId }) => {
            // Only update recording state if it's not the current user
            if (senderId !== currentUser._id) {
                setIsRecording(false);
            }
        });

        return () => {
            socket.off('receiveFileMessage');
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;

        // Add audio message receiver
        socket.on('receiveAudioMessage', (data) => {
            const newMessage = {
                _id: data.messageId,
                sender: data.senderId,
                chat: data.chatId,
                type: 'audio',
                voiceUrl: data.voiceUrl,
                createdAt: new Date().toISOString(),
                read: false
            };

            setMessages(prev => [...prev, newMessage]);

            // Update chat's last message
            setChats(prevChats =>
                prevChats.map(chat =>
                    chat._id === data.chatId
                        ? {
                            ...chat,
                            lastMessage: "Sent a voice message",
                            lastMessageContent: "Sent a voice message",
                            updatedAt: new Date().toISOString()
                        }
                        : chat
                )
            );
        });

        return () => {
            socket.off('receiveAudioMessage');
        };
    }, [socket]);

    // Create New Chat
    const createChat = async (participantId) => {
        setIsLoading(true);
        const authToken = localStorage.getItem('authToken');

        try {
            const response = await fetch(`${API_URL}/api/chatRoute/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken
                },
                body: JSON.stringify({ participantId }) // Changed from participantEmail
            });

            if (!response.ok) {
                throw new Error('Failed to create chat');
            }

            const newChat = await response.json();
            setChats(prev => [...prev, newChat]);
            setChatId(newChat._id);

            // Join the socket room for this chat
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
                        'auth-token': authToken
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch chats');
            }

            const data = await response.json();

            // Update chats with recipient details and last message info
            setChats(data.chats);

            return {
                chats: data.chats,
                totalChats: data.totalChats,
                currentPage: data.page,
                totalPages: data.totalPages
            };
        } catch (err) {
            setError('Failed to fetch chats: ' + err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Continue in Part 2...
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
                        'auth-token': authToken
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch messages');
            }

            const fetchedMessages = await response.json();

            setMessages(prevMessages => {
                if (skip > 0) {
                    // Append older messages to the start
                    const newMessages = [...fetchedMessages, ...prevMessages];
                    // Remove duplicates based on message ID
                    return Array.from(new Map(newMessages.map(msg => [msg._id, msg])).values());
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
                    'auth-token': authToken
                },
                body: JSON.stringify({ chatId, content })
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const newMessage = await response.json();

            // Add sender's message immediately to the UI
            const messageWithSender = {
                ...newMessage,
                sender: currentUser._id,
                chat: chatId,
                createdAt: new Date().toISOString(),
                read: false,
                notificationSent: false
            };

            setMessages(prev => [...prev, messageWithSender]);

            // Emit the message to other users
            if (socket) {
                socket.emit('sendMessage', {
                    chatId,
                    content,
                    senderId: currentUser._id,
                    messageId: newMessage._id
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

                // Emit immediately to show local recording
                const tempId = Date.now().toString();
                const tempMessage = {
                    _id: tempId,
                    sender: currentUser._id,
                    chat: chatId,
                    type: 'audio',
                    voiceUrl: URL.createObjectURL(audioBlob), // Local URL for immediate playback
                    createdAt: new Date().toISOString(),
                    read: false,
                    isTemp: true
                };

                setMessages(prev => [...prev, tempMessage]);

                // Send to server
                socket.emit('audioMessage', {
                    chatId,
                    senderId: currentUser._id,
                    audioChunk: base64Audio,
                    tempId
                });
            };
        } catch (err) {
            setError('Failed to send audio message: ' + err.message);
        }
    };

    // Recording Handlers
    const startRecording = useCallback((chatId) => {
        if (socket && chatId) {
            socket.emit('startRecording', {
                chatId,
                senderId: currentUser._id
            });
        }
    }, [socket, currentUser]);

    const stopRecording = useCallback((chatId) => {
        if (socket && chatId) {
            socket.emit('stopRecording', {
                chatId,
                senderId: currentUser._id
            });
        }
    }, [socket, currentUser]);

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
                    'auth-token': authToken
                }
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
    const joinChatRoom = useCallback((chatId) => {
        if (socket && chatId) {
            socket.emit('joinRoom', { chatId });
        }
    }, [socket]);

    // Handle File Messages
    const sendFileMessage = useCallback(async (file, chatId) => {
        if (!file || !chatId) return null;

        const authToken = localStorage.getItem('authToken');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatId', chatId);

        try {
            const response = await fetch(`${API_URL}/api/chatRoute/sendFileMessage`, {
                method: 'POST',
                headers: {
                    'auth-token': authToken
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to upload image');
            }

            const { data } = await response.json();

            // Create a new message object with the correct image URL
            const newMessage = {
                _id: data._id,
                sender: currentUser._id,
                chat: chatId,
                type: 'image',
                imageUrl: data.imageUrl, // Use imageUrl from response
                createdAt: new Date().toISOString(),
                read: false
            };

            // Update local state
            setMessages(prev => [...prev, newMessage]);

            // Emit to socket with the correct URL
            if (socket) {
                socket.emit('sendFileMessage', {
                    chatId,
                    messageId: data._id,
                    senderId: currentUser._id,
                    type: 'image',
                    imageUrl: data.imageUrl // Send imageUrl in socket event
                });
            }

            return newMessage;
        } catch (err) {
            console.error('Failed to send image:', err);
            setError('Failed to send image: ' + err.message);
            return null;
        }
    }, [currentUser, socket]);

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
        setAudioChunks
    };

    return (
        <ChatContext.Provider value={contextValue}>
            {children}
        </ChatContext.Provider>
    );
};

export default ChatProvider;