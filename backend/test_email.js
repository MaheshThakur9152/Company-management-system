require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.EMAIL_PORT || '465'),
  secure: process.env.EMAIL_SECURE === 'true', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true, // Enable debug output
  logger: true, // Log information to console
  connectionTimeout: 60000,
  greetingTimeout: 60000,
  socketTimeout: 60000
});

async function sendTestEmail() {
    console.log('Attempting to send email...');
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('Port:', process.env.EMAIL_PORT);
    console.log('User:', process.env.EMAIL_USER);
    
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'maheshthakurharishankar@gmail.com', // Sending to the test email mentioned in code
            subject: 'Test Email from Ambe Backend',
            text: 'If you see this, the SMTP configuration is working!'
        });
        console.log('Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

sendTestEmail();
