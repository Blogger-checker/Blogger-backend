const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

const sendWordCountRejection = async (email, authorName) => {
    const subject = 'Blog Submission: Word Count Issue';
    const text = `Dear ${authorName},\n\nYour blog submission has been rejected because it contains less than 800 words. Please update your content to meet the minimum word count requirement and submit again.\n\nBest regards,\nBlog Team`;
    
    await sendEmail(email, subject, text);
};

const sendPlagiarismRejection = async (email, authorName) => {
    const subject = 'Blog Submission: Plagiarism Detected';
    const text = `Dear ${authorName},\n\nYour blog submission has been rejected because it contains plagiarized content. Please ensure your content is original and submit again.\n\nBest regards,\nBlog Team`;
    
    await sendEmail(email, subject, text);
};

const sendPublicationConfirmation = async (email, authorName, publicUrl) => {
    const subject = 'Blog Published Successfully';
    const text = `Dear ${authorName},\n\nCongratulations! Your blog has been published successfully. You can view it at: ${publicUrl}\n\nBest regards,\nBlog Team`;
    
    await sendEmail(email, subject, text);
};

module.exports = {
    sendWordCountRejection,
    sendPlagiarismRejection,
    sendPublicationConfirmation
}; 