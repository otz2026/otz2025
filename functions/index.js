const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

admin.initializeApp();

const GITHUB_TOKEN = functions.config().github.token;
const REPO_URL = 'https://api.github.com/repos/otz2026/otz2025/contents/SSTimeSS/subscriptions.json';

exports.sendNotification = functions.https.onRequest(async (req, res) => {
    const { message } = req.body;
    try {
        const response = await fetch(`${REPO_URL}?t=${Date.now()}`, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (!response.ok) throw new Error(`Не удалось загрузить subscriptions.json: ${response.status}`);
        const subscriptionsData = await response.json();
        const subscriptions = JSON.parse(Buffer.from(subscriptionsData.content, 'base64').toString()).subscriptions || [];

        const promises = subscriptions.map(sub => {
            try {
                const { token } = JSON.parse(sub);
                return admin.messaging().send({
                    token,
                    notification: {
                        title: 'OTZ Notification',
                        body: message
                    }
                }).catch(error => {
                    console.error(`Ошибка отправки уведомления для токена ${token}:`, error);
                });
            } catch (parseError) {
                console.error('Ошибка парсинга подписки:', parseError);
                return Promise.resolve();
            }
        });

        await Promise.all(promises);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Ошибка в Cloud Function:', error);
        res.status(500).json({ error: error.message });
    }
});

exports.saveSubscription = functions.https.onRequest(async (req, res) => {
    const { subscription } = req.body;
    try {
        // Получить текущий файл subscriptions.json
        const getResponse = await fetch(REPO_URL, {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        if (!getResponse.ok) throw new Error(`Не удалось получить subscriptions.json: ${getResponse.status}`);
        const fileData = await getResponse.json();
        const currentContent = JSON.parse(Buffer.from(fileData.content, 'base64').toString());
        const subscriptions = currentContent.subscriptions || [];

        // Добавить новую подписку, если её нет
        const subscriptionStr = JSON.stringify(subscription);
        if (!subscriptions.includes(subscriptionStr)) {
            subscriptions.push(subscriptionStr);
            const updatedContent = JSON.stringify({ subscriptions }, null, 2);
            const updateResponse = await fetch(REPO_URL, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: 'Update subscriptions.json',
                    content: Buffer.from(updatedContent).toString('base64'),
                    sha: fileData.sha
                })
            });
            if (!updateResponse.ok) throw new Error(`Не удалось обновить subscriptions.json: ${updateResponse.status}`);
            console.log('Подписка сохранена в GitHub');
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Ошибка сохранения подписки:', error);
        res.status(500).json({ error: error.message });
    }
});
