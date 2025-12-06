require('dotenv').config();
const axios = require('axios');

async function sendTestEmail() {
    console.log('Attempting to send email via Brevo API...');
    const apiKey = process.env.BREVO_API_KEY;
    
    try {
        const emailData = {
            sender: {
                name: 'Ambe Service Test',
                email: process.env.EMAIL_FROM || 'media@ambeservice.com'
            },
            to: [
                {
                    email: 'maheshthakurharishankar@gmail.com',
                    name: 'Test Recipient'
                }
            ],
            subject: 'Test Email from Ambe Backend (Brevo API)',
            textContent: 'If you see this, the Brevo API configuration is working!'
        };

        const response = await axios.post('https://api.brevo.com/v3/smtp/email', emailData, {
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            }
        });

        console.log('Email sent successfully!');
        console.log('Message ID:', response.data.messageId);
    } catch (error) {
        console.error('Error sending email:', error.response ? error.response.data : error.message);
    }
}

sendTestEmail();
