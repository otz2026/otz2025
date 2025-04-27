async function sendTelegramMessage(message, chatId) {
    try {
        const response = await fetch('https://us-central1-otz2025-57eec.cloudfunctions.net/sendTelegramMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, chatId })
        });
        if (!response.ok) throw new Error(`Error sending Telegram message: ${response.status} ${response.statusText}`);
        return await response.json();
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
                if (isPwaMode()) {
                    await subscribeToPush();
                }
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
            applicationServerKey: 'BOggY0HhFla2fEHn3W8VLiC9i-u4L8v9X3BUjKlRiiWHVTXN1r8aDl2Md5xCjog1PcyMxSBnHmBm6hY2fzp98iQ'
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

function isPwaMode() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
}

window.sendTelegramMessage = sendTelegramMessage;
window.requestNotificationPermission = requestNotificationPermission;
