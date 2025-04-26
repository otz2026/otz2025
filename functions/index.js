const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendNotification = functions.https.onRequest(async (req, res) => {
    const { message } = req.body;
    try {
        const subscriptionsResponse = await fetch('https://cors-anywhere.herokuapp.com/https://raw.githubusercontent.com/otz2026/otz2025/main/SSTimeSS/subscriptions.json');
        if (!subscriptionsResponse.ok) throw new Error('Не удалось загрузить subscriptions.json');
        const subscriptionsData = await subscriptionsResponse.json();
        const subscriptions = subscriptionsData.subscriptions || [];

        const promises = subscriptions.map(sub => {
            const { token } = JSON.parse(sub);
            return admin.messaging().send({
                token,
                notification: {
                    title: 'OTZ Notification',
                    body: message
                }
            }).catch(error => {
                console.error('Ошибка отправки уведомления:', error);
            });
        });

        await Promise.all(promises);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Ошибка в Cloud Function:', error);
        res.status(500).json({ error: error.message });
    }
});
