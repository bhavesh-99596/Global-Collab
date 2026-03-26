const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

class EmailService {
    async sendNotificationEmail(to, subject, text, html) {
        try {
            if (!process.env.SENDGRID_API_KEY || process.env.SENDGRID_API_KEY === '') {
                console.warn('SendGrid API Key not configured. Skipping email.');
                return false;
            }
            
            const msg = {
                to,
                from: process.env.EMAIL_FROM || 'noreply@globalcollab.com',
                subject,
                text,
                html: html || text,
            };
            
            await sgMail.send(msg);
            console.log(`Email sent successfully to ${to}`);
            return true;
        } catch (error) {
            console.error('SendGrid error:', error?.response?.body || error.message);
            return false;
        }
    }
}

module.exports = new EmailService();
