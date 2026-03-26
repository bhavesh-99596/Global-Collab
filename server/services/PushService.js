require('dotenv').config();

class PushService {
    async sendPushNotification(userIds, title, message) {
        try {
            if (!process.env.ONESIGNAL_APP_ID || !process.env.ONESIGNAL_API_KEY) {
                console.warn('OneSignal not fully configured. Skipping push.');
                return;
            }

            if (!userIds || userIds.length === 0) return;

            const body = {
                app_id: process.env.ONESIGNAL_APP_ID,
                headings: { en: title },
                contents: { en: message },
                target_channel: 'push',
                include_aliases: {
                    external_id: userIds.map(id => id.toString())
                }
            };

            const response = await fetch('https://onesignal.com/api/v1/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${process.env.ONESIGNAL_API_KEY}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();
            console.log('OneSignal Push result:', data);
        } catch (err) {
            console.error('OneSignal push error:', err.message);
        }
    }
}

module.exports = new PushService();
