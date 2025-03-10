// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

firebase.initializeApp({
    apiKey: "AIzaSyCf40sFEpU55NM-wDDcxzxMCkAyaDv6orY",
    authDomain: "drive-match-network-5b68e.firebaseapp.com",
    projectId: "drive-match-network-5b68e",
    storageBucket: "drive-match-network-5b68e.firebasestorage.app",
    messagingSenderId: "1057879481955",
    appId: "1:1057879481955:web:d3704baac88b1db31e6256",
    measurementId: "G-QNEKJD8C7T"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('Received background message:', payload);

    const notificationTitle = payload.notification.title || 'New Message';
    const notificationOptions = {
        body: payload.notification.body || 'You have a new notification',
        icon: '/images/carlogo.png'
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});