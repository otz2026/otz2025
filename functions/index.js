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

// Telegram Bot Token
const TELEGRAM_BOT_TOKEN = '8170513399:AAFfVgPDMhCv8wT3ahXtZ49upujLmAjnh6A';
const ADMIN_CHAT_ID = '5665980031';
const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

// Отправка сообщения в Telegram
async function sendTelegramMessage(message, chatId) {
    try {
        const response = await fetch(`${TELEGRAM_API_URL}${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        if (!response.ok) throw new Error(`Telegram API error: ${response.status} ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('Error sending Telegram message:', error);
        throw error;
    }
}

// Webhook для обработки Telegram-команд
exports.telegramWebhook = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', 'https://otz2026.github.io');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    try {
        const update = req.body;
        if (!update.message || !update.message.text) {
            return res.status(200).send('No message');
        }

        const chatId = update.message.chat.id.toString();
        const text = update.message.text.trim();
        const command = text.split(' ')[0].toLowerCase();
        const message = text.slice(text.indexOf(' ') + 1).trim() || null;

        let responseText;

        switch (command) {
            case '/start':
                responseText = 'Send the message that needs to be sent here. To cancel, press /cancel.';
                await sendTelegramMessage(responseText, chatId);
                break;
            case '/send':
                if (!message) {
                    responseText = 'Please provide a message after /send. For example: /send Hello!';
                    await sendTelegramMessage(responseText, chatId);
                    break;
                }
                try {
                    const subscriptions = await db.collection('subscriptions').get();
                    if (subscriptions.empty) {
                        responseText = 'Failed to send notification: No subscriptions found';
                        await sendTelegramMessage(responseText, chatId);
                        break;
                    }
                    const pushPromises = subscriptions.docs.map(async (doc) => {
                        const subscription = doc.data();
                        try {
                            await webpush.sendNotification(subscription, JSON.stringify({
                                title: 'OTZ Notification',
                                body: message
                            }));
                        } catch (error) {
                            console.error('Error sending notification to subscription:', error);
                        }
                    });
                    await Promise.all(pushPromises);
                    responseText = 'Notification sent successfully!';
                } catch (error) {
                    responseText = `Failed to send notification: ${error.message}`;
                }
                await sendTelegramMessage(responseText, chatId);
                break;
            case '/cancel':
                responseText = 'Action cancelled.';
                await sendTelegramMessage(responseText, chatId);
                break;
            default:
                responseText = 'Unknown command. Use /start, /send, or /cancel.';
                await sendTelegramMessage(responseText, chatId);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error processing Telegram webhook:', error);
        res.status(500).send('Error');
    }
});

// Сохранение подписки
exports.saveSubscription = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', 'https://otz2026.github.io');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    try {
        const subscription = req.body;
        await db.collection('subscriptions').add(subscription);
        res.status(200).send('Subscription saved');
    } catch (error) {
        console.error('Error saving subscription:', error);
        res.status(500).send(`Error saving subscription: ${error.message}`);
    }
});

// Отправка уведомления
exports.sendNotification = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', 'https://otz2026.github.io');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).send('Message is required');
        }
        const subscriptions = await db.collection('subscriptions').get();
        if (subscriptions.empty) {
            return res.status(404).send('No subscriptions found');
        }
        const pushPromises = subscriptions.docs.map(async (doc) => {
            const subscription = doc.data();
            try {
                await webpush.sendNotification(subscription, JSON.stringify({
                    title: 'OTZ Notification',
                    body: message
                }));
            } catch (error) {
                console.error('Error sending notification to subscription:', error);
            }
        });
        await Promise.all(pushPromises);
        res.status(200).send('Notifications sent');
    } catch (error) {
        console.error('Error sending notifications:', error);
        res.status(500).send(`Error sending notifications: ${error.message}`);
    }
});

// Вызов /start при посещении сайта
exports.triggerStartCommand = functions.https.onRequest(async (req, res) => {
    res.set('Access-Control-Allow-Origin', 'https://otz2026.github.io');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    
    try {
        await sendTelegramMessage('Send the message that needs to be sent here. To cancel, press /cancel.', ADMIN_CHAT_ID);
        res.status(200).send('Start command triggered');
    } catch (error) {
        console.error('Error triggering start command:', error);
        res.status(500).send(`Error: ${error.message}`);
    }
});
