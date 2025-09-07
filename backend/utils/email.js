const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html
        });
        return true;
    } catch (error) {
        console.error('Email send error:', error);
        return false;
    }
};

const sendOtpEmail = async (email, otp) => {
    const subject = 'Login OTP for College ERP';
    const html = `
        <h1>Your OTP for College ERP</h1>
        <p>Your One Time Password (OTP) is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 5 minutes.</p>
        <p>If you didn't request this OTP, please ignore this email.</p>
    `;
    return await sendEmail(email, subject, html);
};

module.exports = {
    sendOtpEmail
};
