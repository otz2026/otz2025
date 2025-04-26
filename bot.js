(function() {
    let pendingNewsletter = null;

    window.sendTelegramMessage = async function(message, chatId, options = {}) {
        try {
            const url = `https://api.telegram.org/bot${window.CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
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
    };

    window.requestNotificationPermission = async function() {
        if (!isPwaMode()) return;
        if (!('Notification' in window) || !('ServiceWorkerRegistration' in window)) {
            console.warn('Уведомления не поддерживаются в этом браузере');
            return;
        }
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Разрешение на уведомления получено');
                const app = firebase.initializeApp(window.CONFIG.FIREBASE_CONFIG);
                const messaging = firebase.messaging();
                const registration = await navigator.serviceWorker.ready;
                const token = await messaging.getToken({ serviceWorkerRegistration: registration });
                await saveSubscription({ token });
                console.log('FCM-токен зарегистрирован:', token);
            } else {
                console.warn('Разрешение на уведомления отклонено');
            }
        } catch (error) {
            console.error('Ошибка регистрации FCM-токена:', error);
        }
    };

    async function saveSubscription(subscription) {
        try {
            console.log('Сохранение подписки через Cloud Function...');
            const response = await fetch('https://us-central1-otz2025-57eec.cloudfunctions.net/saveSubscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription })
            });
            if (!response.ok) throw new Error(`Не удалось сохранить подписку: ${response.status}`);
            console.log('Подписка сохранена в GitHub');
        } catch (error) {
            console.error('Ошибка сохранения подписки:', error);
        }
    }

    window.handleTelegramCommand = async function(command, text, chatId) {
        if (chatId !== window.CONFIG.ADMIN_CHAT_ID) {
            await window.sendTelegramMessage('У вас нет доступа к этой команде.', chatId);
            return;
        }
        if (command === '/start') {
            await window.sendTelegramMessage('Добро пожаловать! Выберите команду:', chatId, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: 'Отправить рассылку', callback_data: '/send' }],
                        [{ text: 'Отменить рассылку', callback_data: '/cancel' }]
                    ]
                }
            });
        } else if (command === '/send' || command === '@send') {
            pendingNewsletter = true;
            await window.sendTelegramMessage('Введите текст для рассылки. Для отмены используйте /cancel.', chatId);
        } else if (command === '/cancel') {
            pendingNewsletter = null;
            await window.sendTelegramMessage('Рассылка отменена.', chatId);
        } else if (pendingNewsletter) {
            pendingNewsletter = null;
            await sendNotification(text);
            await window.sendTelegramMessage('Рассылка отправлена!', chatId);
        }
    };

    window.handleCallbackQuery = async function(data, chatId) {
        if (data === '/send' || data === '/cancel') {
            await window.handleTelegramCommand(data, null, chatId);
        }
    };

    async function sendNotification(message) {
        try {
            console.log('Отправка уведомления через Cloud Function...');
            const response = await fetch('https://us-central1-otz2025-57eec.cloudfunctions.net/sendNotification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });
            if (!response.ok) throw new Error(`Не удалось отправить уведомление: ${response.status}`);
            console.log('Уведомление отправлено через Cloud Function');
        } catch (error) {
            console.error('Ошибка отправки уведомления:', error);
        }
    }

    function isPwaMode() {
        return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    }
})();
