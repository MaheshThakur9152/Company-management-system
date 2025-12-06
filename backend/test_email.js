const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');

async function sendTestEmail() {
    console.log('Attempting to send email via Brevo...');
    console.log('API Key Available:', process.env.BREVO_API_KEY ? 'Yes' : 'No');
    const apiKey = process.env.BREVO_API_KEY;
    
    try {
        // Check for SMTP Key
        if (apiKey && apiKey.startsWith('xsmtpsib-')) {
             console.log('Detected SMTP Key. Switching to Nodemailer transport.');
             const nodemailer = require('nodemailer');
             
             const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
                port: process.env.EMAIL_PORT || 587,
                secure: false, 
                auth: {
                    user: process.env.EMAIL_USER, 
                    pass: apiKey 
                }
             });

             const info = await transporter.sendMail({
                from: `"${process.env.EMAIL_FROM_NAME || 'Ambe Service'}" <${process.env.EMAIL_FROM || 'media@ambeservice.com'}>`,
                to: 'maheshthakurharishankar@gmail.com',
                subject: "Test Email from Ambe Backend (SMTP Fallback)",
                text: "If you see this, the SMTP configuration is working with your new key!"
             });
             console.log('Email sent successfully via SMTP!');
             console.log('Message ID:', info.messageId);
             return;
        }

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
