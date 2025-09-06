const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
require("dotenv").config();


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

router.post("/forgot-password",
    body("email").isEmail().withMessage("Please provide a valid email"),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: errors.array()[0].msg });
            }

            const { email } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }

            const otp = generateOTP();
            user.resetPasswordOTP = otp;
            user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
            await user.save();

            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Password Reset OTP",
                text: `Your OTP for password reset is: ${otp}\nThis OTP will expire in 15 minutes.`
            };

            await transporter.sendMail(mailOptions);
            res.json({ message: "OTP sent to your email" });
        } catch (error) {
            console.error("Forgot password error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

router.post("/reset-password",
    [
        body("email").isEmail().withMessage("Please provide a valid email"),
        body("otp").notEmpty().withMessage("OTP is required"),
        body("newPassword")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters long")
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: errors.array()[0].msg });
            }

            const { email, otp, newPassword } = req.body;
            const user = await User.findOne({
                email,
                resetPasswordOTP: otp,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.status(400).json({ error: "Invalid or expired OTP" });
            }

            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
            user.resetPasswordOTP = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            res.json({ message: "Password reset successful" });
        } catch (error) {
            console.error("Reset password error:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

module.exports = router;
