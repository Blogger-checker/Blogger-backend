const nodemailer = require('nodemailer');
require('dotenv').config();

// Debug: Log environment variables (remove in production)
console.log('Email Configuration:', {
    service: process.env.EMAIL_SERVICE,
    user: process.env.EMAIL_USER,
    hasPassword: !!process.env.EMAIL_PASSWORD
});

// Create transporter with more detailed configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
    if (error) {
        console.error('SMTP Configuration Error:', error);
    } else {
        console.log('SMTP Server is ready to take our messages');
    }
});

const sendEmail = async (to, subject, text) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            throw new Error('Email configuration is missing. Please check your .env file');
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully:', info.response);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw the error, just log it for now
        console.log('Email sending failed but continuing with the process');
        return null;
    }
};

const sendWordCountRejection = async (email, authorName) => {
    const subject = 'Blog Submission: Word Count Issue';
    const text = `Dear ${authorName},\n\nYour blog submission has been rejected because it contains less than 800 words. Please update your content to meet the minimum word count requirement and submit again.\n\nBest regards,\nBlog Team`;
    
    return await sendEmail(email, subject, text);
};

const sendPlagiarismRejection = async (email, authorName) => {
    const subject = 'Blog Submission: Plagiarism Detected';
    const text = `Dear ${authorName},\n\nYour blog submission has been rejected because it contains plagiarized content. Please ensure your content is original and submit again.\n\nBest regards,\nBlog Team`;
    
    return await sendEmail(email, subject, text);
};

const sendPublicationConfirmation = async (email, authorName, publicUrl) => {
    const subject = 'Blog Published Successfully';
    const text = `Dear ${authorName},\n\nCongratulations! Your blog has been published successfully. You can view it at: ${publicUrl}\n\nBest regards,\nBlog Team`;
    
    return await sendEmail(email, subject, text);
};

module.exports = {
    sendWordCountRejection,
    sendPlagiarismRejection,
    sendPublicationConfirmation
}; 