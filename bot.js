import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getMessaging, getToken } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging.js';

let pendingNewsletter = null;

export async function sendTelegramMessage(message, chatId, options = {}) {
    try {
        const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown',
                ...options
            })
        });
        if (!response.ok) throw new Error(`Ошибка Telegram API: ${response.status}`);
        console.log(`Сообщение отправлено в Telegram: ${chatId}`);
    } catch (error) {
        console.error('Ошибка отправки сообщения в Telegram:', error);
    }
}

export async function requestNotificationPermission() {
    if (!isPwaMode()) return;
    if (!('Notification' in window) || !('ServiceWorkerRegistration' in window)) {
        console.warn('Уведомления не поддерживаются в этом браузере');
        return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        console.log('Разрешение на уведомления получено');
        try {
            const app = initializeApp(CONFIG.FIREBASE_CONFIG);
            const messaging = getMessaging(app);
            const registration = await navigator.serviceWorker.ready;
            const token = await getToken(messaging, { serviceWorkerRegistration: registration });
            await saveSubscription({ token });
            console.log('FCM-токен зарегистрирован:', token);
        } catch (error) {
            console.error('Ошибка регистрации FCM-токена:', error);
        }
    } else {
        console.warn('Разрешение на уведомления отклонено');
    }
}

async function saveSubscription(subscription) {
    try {
        const response = await fetch(`${CONFIG.SUBSCRIPTIONS_URL}?t=${Date.now()}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('Не удалось загрузить subscriptions.json');
        const data = await response.json();
        const subscriptions = data.subscriptions || [];
        const subscriptionStr = JSON.stringify(subscription);
        if (!subscriptions.includes(subscriptionStr)) {
            subscriptions.push(subscriptionStr);
            const content = btoa(JSON.stringify({ subscriptions }, null, 2));
            const updateResponse = await fetch('https://api.github.com/repos/otz2026/otz2025/contents/SSTimeSS/subscriptions.json', {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${CONFIG.GITHUB_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Update subscriptions.json',
                    content,
                    sha: await getFileSha('subscriptions.json')
                })
            });
            if (!updateResponse.ok) throw new Error('Не удалось обновить subscriptions.json');
            console.log('Подписка сохранена в subscriptions.json');
        }
    } catch (error) {
        console.error('Ошибка сохранения подписки:', error);
    }
}

async function getFileSha(file) {
    try {
        const response = await fetch(`https://api.github.com/repos/otz2026/otz2025/contents/SSTimeSS/${file}`, {
            headers: { 'Authorization': `token ${CONFIG.GITHUB_TOKEN}` }
        });
        if (!response.ok) throw new Error(`Не удалось получить SHA для ${file}`);
        const data = await response.json();
        return data.sha;
    } catch (error) {
        console.error('Ошибка получения SHA:', error);
        return null;
    }
}

export async function handleTelegramCommand(command, text, chatId) {
    if (chatId !== CONFIG.ADMIN_CHAT_ID) {
        await sendTelegramMessage('У вас нет доступа к этой команде.', chatId);
        return;
    }
    if (command === '/start') {
        await sendTelegramMessage('Добро пожаловать! Выберите команду:', chatId, {
            reply_markup: {
                inline_keyboard: [[
                    { text: 'Отправить рассылку', callback_data: '/send' }
                ]]
            }
        });
    } else if (command === '/send' || command === '@send') {
        pendingNewsletter = true;
        await sendTelegramMessage('Введите текст для рассылки. Для отмены напишите @emty.', chatId);
    } else if (pendingNewsletter && text === '@emty') {
        pendingNewsletter = null;
        await sendTelegramMessage('Рассылка отменена.', chatId);
    } else if (pendingNewsletter) {
        pendingNewsletter = null;
        await sendNotification(text);
        await sendTelegramMessage('Рассылка отправлена!', chatId);
    }
}

export async function handleCallbackQuery(data, chatId) {
    if (data === '/send') {
        await handleTelegramCommand('/send', null, chatId);
    }
}

async function sendNotification(message) {
    try {
        const response = await fetch('https://us-central1-otz2025-57eec.cloudfunctions.net/sendNotification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });
        if (!response.ok) throw new Error('Не удалось отправить уведомление');
        console.log('Уведомление отправлено через Cloud Function');
    } catch (error) {
        console.error('Ошибка отправки уведомления:', error);
    }
}
