/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { useChat } from '../../context/Chat/ChatContext';
import { useAuth } from '../../context/Auth/AuthContext';
import styles from '../../styles/Chat/Chat.module.css';
import {
    Send,
    Image as ImageIcon,
    Mic,
    User,
    ArrowLeft,
    MessageCircle,
    X,
    MoreVertical,
    Phone,
} from 'lucide-react';
import { message } from 'antd';

const ChatPage = () => {
    // Router and Refs
    const router = useRouter();
    const { id } = router.query;
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const fileInputRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordingTimeRef = useRef(null);

    // Context Hooks
    const {
        messages,
        chats,
        fetchMessages,
        sendMainMessage,
        fetchUserChats,
        isTyping,
        chatId,
        setChatId,
        error,
        socket,
        sendAudioMessage,
        startRecording,
        stopRecording,
        isRecording,
        handleTyping,
        sendFileMessage,
        markMessagesAsRead,
    } = useChat();

    const { currentUser, fetchCurrentUser } = useAuth();

    // State Management
    const [selectedChat, setSelectedChat] = useState(null);
    const [messageInput, setMessageInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMoreChats, setHasMoreChats] = useState(true);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);
    const [imagePreview, setImagePreview] = useState(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [isLocalRecording, setIsLocalRecording] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    // Initial Setup Effects
    useEffect(() => {
        if (!currentUser) {
            fetchCurrentUser();
            return;
        }

        const initializeChat = async () => {
            if (id) {
                setChatId(id);
                const result = await fetchUserChats(1, 20);
                if (result?.chats) {
                    const chat = result.chats.find((c) => c._id === id);
                    setSelectedChat(chat);
                }
            }
        };

        initializeChat();
    }, [id, currentUser]);

    useEffect(() => {
        if (chatId) {
            markMessagesAsRead(chatId);
        }
    }, [chatId]);

    // Socket Connection Effect
    useEffect(() => {
        if (chatId && socket) {
            socket.emit('joinRoom', { chatId });
        }
    }, [chatId, socket]);

    // Messages Auto-scroll Effect
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Chat Loading Effect
    useEffect(() => {
        const loadChats = async () => {
            const result = await fetchUserChats(1, 20);
            if (result?.chats) {
                setHasMoreChats(result.totalPages > 1);
            }
            setLoading(false);
        };
        loadChats();
    }, [fetchUserChats]);

    // Message Loading Effect
    useEffect(() => {
        if (chatId) {
            setHasMoreMessages(true);
            fetchMessages(chatId, 0, 10).then((fetchedMessages) => {
                if (fetchedMessages && fetchedMessages.length < 10) {
                    setHasMoreMessages(false);
                }
            });
            const chatData = chats.find((chat) => chat._id === chatId);
            setSelectedChat(chatData);
        }
    }, [chatId, chats, fetchMessages]);

    // Handler Functions
    const handleScroll = () => {
        if (
            chatContainerRef.current.scrollTop === 0 &&
            hasMoreMessages &&
            !loading
        ) {
            setLoading(true);
            const newSkip = messages.length;
            fetchMessages(chatId, newSkip, 10).then((fetchedMessages) => {
                if (fetchedMessages && fetchedMessages.length < 10) {
                    setHasMoreMessages(false);
                }
                setLoading(false);
            });
        }
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!validTypes.includes(file.type)) {
            alert('Please select a valid image file (JPEG, PNG, or GIF)');
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            alert('File size must be less than 5MB');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview({
                    url: reader.result,
                    file: file,
                });
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Error processing file. Please try again.');
        }
    };

    const startVoiceRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                await sendAudioMessage(audioBlob, chatId);
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();
            startRecording(chatId);
            setIsLocalRecording(true);

            let seconds = 0;
            recordingTimeRef.current = setInterval(() => {
                seconds += 1;
                setRecordingTime(seconds);
            }, 1000);
        } catch (err) {
            console.error('Failed to start recording:', err);
            alert('Could not access microphone. Please check your permissions.');
        }
    };

    const stopVoiceRecording = () => {
        if (mediaRecorderRef.current && isLocalRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
            stopRecording(chatId);
            clearInterval(recordingTimeRef.current);
            setRecordingTime(0);
            setIsLocalRecording(false);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isLocalRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
            stopRecording(chatId);
            clearInterval(recordingTimeRef.current);
            setRecordingTime(0);
            setIsLocalRecording(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const trimmedMessage = messageInput.trim();

        if (!trimmedMessage && !imagePreview) return;

        try {
            setIsSendingMessage(true);

            if (imagePreview) {
                await sendFileMessage(imagePreview.file, chatId);
                setImagePreview(null);
            } else {
                await sendMainMessage(chatId, trimmedMessage);
            }

            setMessageInput('');
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            console.error('Error sending message:', error);
            message.error('Failed to send message. Please try again.');
        } finally {
            setIsSendingMessage(false);
        }
    };

    const GoInbox = () => {
        router.push('/inbox/chats');
    };

    // JSX
    return (
        <>
            {!currentUser ? (
                <div className={styles.loginRequired}>
                    <div className={styles.loginContent}>
                        <User size={48} className={styles.loginIcon} />
                        <h2 className={styles.loginTitle}>Login Required</h2>
                        <p className={styles.loginMessage}>Please login to access your messages</p>
                        <button
                            onClick={() => router.push('/login')}
                            className={styles.loginButton}
                        >
                            Login to Continue
                        </button>
                    </div>
                </div>
            ) : (
                <div className={styles.chatContainer}>
                    {/* Sidebar */}
                    <div className={styles.sidebar}>
                        <div className={styles.sidebarHeader}>
                            <h1 className={styles.sidebarTitle}>Messages</h1>
                            <div className={styles.userInfo}>
                                <Image
                                    src={currentUser?.profilePicture?.url || '/images/carlogo.png'}
                                    alt={currentUser?.fullName}
                                    width={40}
                                    height={40}
                                    className={styles.currentUserAvatar}
                                />
                                <span className={styles.currentUserName}>
                                    {currentUser?.fullName}
                                </span>
                            </div>
                        </div>

                        <div className={styles.chatList}>
                            {loading ? (
                                <div className={styles.loadingState}>
                                    <div className={styles.loadingSpinner} />
                                    <p>Loading conversations...</p>
                                </div>
                            ) : chats.length === 0 ? (
                                <div className={styles.emptyChats}>
                                    <MessageCircle size={32} />
                                    <p>No conversations yet</p>
                                </div>
                            ) : (
                                chats.map((chat) => (
                                    <div
                                        key={chat._id}
                                        onClick={() => setChatId(chat._id)}
                                        className={`${styles.chatListItem} ${chatId === chat._id ? styles.activeChatItem : ''
                                            }`}
                                    >
                                        <Image
                                            src={
                                                chat.recipientDetails?.profilePicture?.url ||
                                                '/images/carlogo.png'
                                            }
                                            alt={chat.recipientDetails?.fullName}
                                            width={50}
                                            height={50}
                                            className={styles.chatListAvatar}
                                        />
                                        <div className={styles.chatListItemInfo}>
                                            <h3 className={styles.chatListItemName}>
                                                {chat.recipientDetails?.fullName}
                                            </h3>
                                            <p className={styles.chatListItemLastMessage}>
                                                {chat.lastMessage?.content || 'Start a conversation'}
                                            </p>
                                        </div>
                                        {chat.unreadCount > 0 && (
                                            <span className={styles.unreadBadge}>
                                                {chat.unreadCount}
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Chat Area */}
                    <div className={styles.mainChat}>
                        {selectedChat ? (
                            <>
                                {/* Chat Header */}
                                <div className={styles.chatHeader}>
                                    <div className={styles.chatHeaderLeft}>
                                        <button onClick={GoInbox} className={styles.backButton}>
                                            <ArrowLeft size={20} />
                                        </button>
                                        <Image
                                            src={
                                                selectedChat.recipientDetails?.profilePicture?.url ||
                                                '/images/carlogo.png'
                                            }
                                            alt={selectedChat.recipientDetails?.fullName}
                                            width={40}
                                            height={40}
                                            className={styles.chatHeaderAvatar}
                                        />
                                        <div
                                            onClick={() => {
                                                if (selectedChat?.recipientDetails?._id) {
                                                    router.push(
                                                        `/user/userprofile/${selectedChat.recipientDetails._id}`
                                                    );
                                                }
                                            }}
                                            className={styles.chatHeaderInfo}
                                        >
                                            <h2 className={styles.chatHeaderName}>
                                                {selectedChat.recipientDetails?.fullName}
                                            </h2>
                                            {isTyping ? (
                                                <p className={styles.typingIndicator}>typing...</p>
                                            ) : (
                                                <p className={styles.lastSeen}>
                                                    {selectedChat.recipientDetails?.lastActive
                                                        ? `Last seen ${new Date(
                                                            selectedChat.recipientDetails.lastActive
                                                        ).toLocaleString()}`
                                                        : 'Offline'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {/* 
                                      <div className={styles.chatHeaderRight}>
                                        <button
                                            className={styles.headerButton}
                                            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                        {showOptionsMenu && (
                                            <div className={styles.optionsMenu}>
                                                <button
                                                    onClick={() => {
                                                        if (selectedChat?.recipientDetails?._id) {
                                                            router.push(
                                                                `/user/userprofile/${selectedChat.recipientDetails._id}`
                                                            );
                                                            setShowOptionsMenu(false);
                                                        }
                                                    }}
                                                >
                                                    View Profile
                                                </button>
                                                <button onClick={() => window.print()}>
                                                    Export Chat
                                                </button>
                                                <button className={styles.dangerButton}>
                                                    Block User
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    */}
                                </div>

                                {/* Messages Container */}
                                <div
                                    ref={chatContainerRef}
                                    className={styles.messagesContainer}
                                    onScroll={handleScroll}
                                >
                                    {loading ? (
                                        <div className={styles.messagesLoading}>
                                            <div className={styles.loadingSpinner} />
                                            <p>Loading messages...</p>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className={styles.noMessages}>
                                            <MessageCircle size={48} />
                                            <p>No messages yet</p>
                                            <span>Start the conversation!</span>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((message) => (
                                                <div
                                                    key={message._id}
                                                    className={`${styles.messageWrapper} ${message.sender?._id === currentUser._id ||
                                                        message.senderId === currentUser._id ||
                                                        message.sender === currentUser._id
                                                        ? styles.outgoingMessage
                                                        : styles.incomingMessage
                                                        }`}
                                                >
                                                    <div className={styles.messageContent}>
                                                        {message.type === 'text' && (
                                                            <p className={styles.messageText}>
                                                                {message.content}
                                                            </p>
                                                        )}

                                                        {message.type === 'image' && (
                                                            <div className={styles.imageMessage}>
                                                                <Image
                                                                    src={message.imageUrl}
                                                                    alt="Shared image"
                                                                    width={200}
                                                                    height={200}
                                                                    className={styles.sharedImage}
                                                                    priority
                                                                    onLoad={(result) => {
                                                                        if (result.naturalWidth === 0) {
                                                                            console.error(
                                                                                'Failed to load image:',
                                                                                message.imageUrl
                                                                            );
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        {message.type === 'audio' && (
                                                            <div className={styles.audioMessage}>
                                                                <audio
                                                                    controls
                                                                    className={styles.audioPlayer}
                                                                >
                                                                    <source
                                                                        src={message.voiceUrl}
                                                                        type="audio/webm"
                                                                    />
                                                                    Your browser doesn't support audio
                                                                    playback.
                                                                </audio>
                                                            </div>
                                                        )}

                                                        <div className={styles.messageMetadata}>
                                                            <span className={styles.messageTime}>
                                                                {new Date(
                                                                    message.createdAt
                                                                ).toLocaleTimeString([], {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                })}
                                                            </span>
                                                            {(message.sender?._id === currentUser._id ||
                                                                message.senderId === currentUser._id ||
                                                                message.sender === currentUser._id) && (
                                                                    <span
                                                                        className={`${styles.messageStatus} ${message.read ? styles.read : ''
                                                                            }`}
                                                                    >
                                                                        {message.read ? '✓✓' : '✓'}
                                                                    </span>
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                {/* Message Input Area */}
                                <div
                                    className={`${styles.inputArea} ${isLocalRecording ? styles.recording : ''
                                        }`}
                                >
                                    {isLocalRecording ? (
                                        <div className={styles.recordingInterface}>
                                            <div className={styles.recordingInfo}>
                                                <span className={styles.recordingIndicator} />
                                                Recording: {Math.floor(recordingTime / 60)}:
                                                {(recordingTime % 60).toString().padStart(2, '0')}
                                            </div>
                                            <div className={styles.recordingActions}>
                                                <button
                                                    type="button"
                                                    onClick={cancelRecording}
                                                    className={styles.cancelRecordingButton}
                                                >
                                                    <X size={20} />
                                                    Cancel
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={stopVoiceRecording}
                                                    className={styles.sendRecordingButton}
                                                >
                                                    <Send size={20} />
                                                    Send
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {imagePreview && (
                                                <div className={styles.imagePreviewContainer}>
                                                    <div className={styles.imagePreviewWrapper}>
                                                        <Image
                                                            src={imagePreview.url}
                                                            alt="Preview"
                                                            width={200}
                                                            height={200}
                                                            className={styles.previewImage}
                                                        />
                                                        <button
                                                            onClick={() => setImagePreview(null)}
                                                            className={styles.removePreview}
                                                            aria-label="Remove image"
                                                        >
                                                            <X size={20} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            <form
                                                onSubmit={handleSendMessage}
                                                className={styles.messageForm}
                                            >
                                                <div className={styles.inputWrapper}>
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        onChange={handleFileSelect}
                                                        accept="image/*"
                                                        className={styles.hiddenInput}
                                                    />

                                                    <div className={styles.mediaButtons}>
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className={styles.mediaButton}
                                                            disabled={isLocalRecording}
                                                        >
                                                            <ImageIcon size={20} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onMouseDown={startVoiceRecording}
                                                            onMouseUp={
                                                                isLocalRecording
                                                                    ? stopVoiceRecording
                                                                    : undefined
                                                            }
                                                            onMouseLeave={
                                                                isLocalRecording
                                                                    ? cancelRecording
                                                                    : undefined
                                                            }
                                                            className={`${styles.mediaButton} ${isLocalRecording ? styles.recording : ''
                                                                }`}
                                                            disabled={imagePreview !== null}
                                                        >
                                                            <Mic size={20} />
                                                        </button>
                                                    </div>

                                                    <input
                                                        type="text"
                                                        value={messageInput}
                                                        onChange={(e) => {
                                                            setMessageInput(e.target.value);
                                                            handleTyping();
                                                        }}
                                                        placeholder="Type a message..."
                                                        className={styles.textInput}
                                                        disabled={isLocalRecording}
                                                    />

                                                    <button
                                                        type="submit"
                                                        className={`${styles.sendButton} ${!messageInput.trim() && !imagePreview
                                                            ? styles.disabled
                                                            : ''
                                                            }`}
                                                        disabled={
                                                            !messageInput.trim() &&
                                                            !imagePreview &&
                                                            isSendingMessage
                                                        }
                                                    >
                                                        {isSendingMessage ? (
                                                            <div className={styles.sendingSpinner} />
                                                        ) : (
                                                            <Send size={20} />
                                                        )}
                                                    </button>
                                                </div>
                                            </form>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className={styles.emptyChatState}>
                                <div className={styles.emptyChatContent}>
                                    <MessageCircle size={64} />
                                    <h2>Welcome to Messages</h2>
                                    <p>Select a conversation to start chatting</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatPage;