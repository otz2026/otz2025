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
        if (!response.ok) throw new Error(`Ошибка Telegram API: ${response.status} ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('Ошибка отправки сообщения в Telegram:', error);
        throw error;
    }
}

async function requestNotificationPermission() {
    try {
        if ('Notification' in window && Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Разрешение на уведомления получено');
                await subscribeToPush();
            }
        }
    } catch (error) {
        console.error('Ошибка запроса разрешения на уведомления:', error);
    }
}

async function subscribeToPush() {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: 'BOggY0HhFla2fEHn3W8VLiC9i-u4L8v9X3BUjKlRiiWHVTXN1r8aDl2Md5xCjog1PcyMxSBnHmBm6hY2fzp98iQ' 
        });
        await fetch('https://us-central1-otz2025-57eec.cloudfunctions.net/saveSubscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });
        console.log('Подписка сохранена');
    } catch (error) {
        console.error('Ошибка подписки на push-уведомления:', error);
    }
}

async function handleTelegramCommand(command, message, chatId) {
    try {
        let responseText;
        switch (command) {
            case '/start':
                responseText = 'Добро пожаловать в OTZ Bot! Используйте /send для отправки уведомлений или /cancel для отмены.';
                await sendTelegramMessage(responseText, chatId);
                break;
            case '/send':
                responseText = message ? 'Уведомление отправлено!' : 'Пожалуйста, укажите сообщение после /send';
                if (message) {
                    await fetch('https://us-central1-otz2025-57eec.cloudfunctions.net/sendNotification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message })
                    });
                }
                await sendTelegramMessage(responseText, chatId);
                break;
            case '/cancel':
                responseText = 'Действие отменено.';
                await sendTelegramMessage(responseText, chatId);
                break;
            default:
                responseText = 'Неизвестная команда. Используйте /start, /send или /cancel.';
                await sendTelegramMessage(responseText, chatId);
        }
    } catch (error) {
        console.error('Ошибка обработки команды:', error);
        await sendTelegramMessage('Произошла ошибка. Попробуйте снова.', chatId);
    }
}

window.sendTelegramMessage = sendTelegramMessage;
window.requestNotificationPermission = requestNotificationPermission;
window.handleTelegramCommand = handleTelegramCommand;
