const functions = require('firebase-functions');
const admin = require('firebase-admin');
const webpush = require('web-push');

admin.initializeApp();
const db = admin.firestore();

// Установите VAPID ключи
webpush.setVapidDetails(
    'mailto:your-email@example.com',
    'BOggY0HhFla2fEHn3W8VLiC9i-u4L8v9X3BUjKlRiiWHVTXN1r8aDl2Md5xCjog1PcyMxSBnHmBm6hY2fzp98iQ',
    '6NCh2AynP94T9NovPHo6iARGV7sw-ln6bqqZiMspftg'
);

exports.saveSubscription = functions.https.onRequest(async (req, res) => {
    try {
        const subscription = req.body;
        await db.collection('subscriptions').add(subscription);
        res.status(200).send('Subscription saved');
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).send('Error saving subscription');
    }
});

exports.sendNotification = functions.https.onRequest(async (req, res) => {
    try {
        const { message } = req.body;
        const subscriptions = await db.collection('subscriptions').get();
        const pushPromises = subscriptions.docs.map(async (doc) => {
            const subscription = doc.data();
            try {
                await webpush.sendNotification(subscription, JSON.stringify({
                    title: 'OTZ Notification',
                    body: message
                }));
            } catch (error) {
                console.error('Error sending notification:', error);
            }
        });
        await Promise.all(pushPromises);
        res.status(200).send('Notifications sent');
    } catch (error) {
        console.error('Error sending notifications:', error);
        res.status(500).send('Error sending notifications');
    }
});
