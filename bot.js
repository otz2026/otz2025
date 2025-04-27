async function sendTelegramMessage(message, chatId) {
    try {
        const TELEGRAM_BOT_TOKEN = '8170513399:AAFfVgPDMhCv8wT3ahXtZ49upujLmAjnh6A';
        const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(TELEGRAM_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML'
            })
        });
        if (!response.ok) throw new Error(`Error sending Telegram message: ${response.status}`);
        console.log('Telegram message sent');
        return response;
    } catch (error) {
        console.error('Error sending Telegram message:', error);
        throw error;
    }
}

async function requestNotificationPermission() {
    try {
        if (!('Notification' in window)) {
            console.warn('Notifications not supported');
            return;
        }
        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted');
            }
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
    }
}

function isPwaMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
}

window.sendTelegramMessage = sendTelegramMessage;
window.requestNotificationPermission = requestNotificationPermission;
