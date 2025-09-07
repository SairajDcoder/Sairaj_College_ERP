
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const EmailOtp = require('../models/EmailOtp');
const { sendOtpEmail } = require('../utils/email'); 
const { body, validationResult } = require("express-validator");




const auth = (req, res, next) => {
    const token =
        req.cookies?.token ||
        (req.header("Authorization")?.startsWith("Bearer ")
            ? req.header("Authorization").replace("Bearer ", "")
            : null);

    if (!token)
        return res.status(401).json({ error: "Access denied: missing token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});


const validateSignup = [
    body("firstName")
        .isString().withMessage("First name must be a string")
        .notEmpty().withMessage("First name is required"),
    body("lastName")
        .isString().withMessage("Last name must be a string")
        .notEmpty().withMessage("Last name is required"),
    body("email")
        .isEmail().withMessage("Please provide a valid email")
        .normalizeEmail(),
    body("password")
        .isString().withMessage("Password must be a string")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role")
        .isString().withMessage("Role must be a string")
        .notEmpty().withMessage("Role is required"),
    body("studentId")
        .optional().isString(),
    body("department")
        .optional().isString(),
];

const validateLogin = [
    body("email")
        .isString().withMessage("Email must be a string")
        .notEmpty().withMessage("Email is required"),
    body("password")
        .isString().withMessage("Password must be a string")
        .notEmpty().withMessage("Password is required")
];

const validateOtp = [
    body("userId")
        .notEmpty().withMessage("User ID is required"),
    body("otp")
        .isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits")
];

// Helper function to generate OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Step 1: Login with email and password
router.post('/login', validateLogin, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate and save OTP
        const otp = generateOTP();
        
        // Remove any existing OTPs for this user
        await EmailOtp.deleteMany({ userId: user._id });
        
        // Create new OTP record
        await EmailOtp.create({
            userId: user._id,
            email: user.email,
            otp
        });

        // Send OTP email
        const emailSent = await sendOtpEmail(user.email, otp);
        if (!emailSent) {
            return res.status(500).json({ error: 'Failed to send OTP email' });
        }

        res.json({ 
            message: 'OTP sent to your email',
            userId: user._id 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Step 2: Verify OTP and complete login
router.post('/verify-otp', validateOtp, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { userId, otp } = req.body;

        // Find OTP record
        const otpRecord = await EmailOtp.findOne({ userId });
        if (!otpRecord) {
            return res.status(400).json({ error: 'OTP expired or invalid' });
        }

        // Verify OTP
        if (otpRecord.otp !== otp) {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Get user data
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Delete used OTP
        await EmailOtp.deleteOne({ _id: otpRecord._id });

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({
            token,
            user
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post("/register", validateSignup, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ error: errors.array()[0].msg });
        const { firstName, lastName, email, password, role, studentId, department } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: "User already exists" });
        }

        user = new User({
            firstName,
            lastName,
            email,
            password,
            role,
            studentId,
            department
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                department: user.department
            },
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
});

const cookieOptions = (rememberMe) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : null, // 7 days if rememberMe checked
});

router.post("/login", validateLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ error: errors.array()[0].msg });

        const { email, password, rememberMe } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: rememberMe ? "7d" : "1h",
        });

        res.cookie("token", token, cookieOptions(rememberMe));

        res.json({
            message: "Login successful",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
                department: user.department,
            },
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// routes/auth.js
router.post("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    res.json({ message: "Logged out successfully" });
});


router.get("/users", auth, async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: "Server error", error: err.message });
    }
});

module.exports = router;
