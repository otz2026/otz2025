const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

async function sendTelegramMessage(message, chatId) {
    try {
        const response = await fetch(`${TELEGRAM_API_URL}${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
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

async function requestNotificationPermission() {
    try {
        if ('Notification' in window && Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted');
                await subscribeToPush();
            }
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
}

async function subscribeToPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BOggY0HhFla2fEHn3W8VLiC9i-u4L8v9X3BUjKlRiiWHVTXN1r8aDl2Md5xCjog1PcyMxSBnHmBm6hY2fzp98iQ' // Замените на ваш VAPID ключ
        });
        const response = await fetch('https://us-central1-otz2025-57eec.cloudfunctions.net/saveSubscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        if (!response.ok) throw new Error(`Failed to save subscription: ${response.status}`);
        console.log('Subscription saved');
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
    }
}

async function handleTelegramCommand(command, message, chatId) {
    try {
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
                    const response = await fetch('https://us-central1-otz2025-57eec.cloudfunctions.net/sendNotification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message })
                    });
                    if (!response.ok) {
                        throw new Error(`Failed to send notification: ${response.status} ${response.statusText}`);
                    }
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
    } catch (error) {
        console.error('Error handling command:', error);
        await sendTelegramMessage(`An error occurred: ${error.message}. Try again.`, chatId);
    }
}

window.sendTelegramMessage = sendTelegramMessage;
window.requestNotificationPermission = requestNotificationPermission;
window.handleTelegramCommand = handleTelegramCommand;
