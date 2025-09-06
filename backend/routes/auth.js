
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { body, validationResult } = require("express-validator");



function generateCaptcha() {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const question = `What is ${a} + ${b}`;
    const answer = a + b;
    const token = Buffer.from(`${a},${b}`).toString('base64');
    return { question, token, answer };
}

router.get('/captcha', (req, res) => {
    const { question, token } = generateCaptcha();
    res.json({ question, token });
});


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
    body("captchaAnswer")
        .notEmpty().withMessage("Captcha answer is required"),
    body("captchaToken")
        .notEmpty().withMessage("Captcha token is required"),
];

const validateLogin = [
    body("email")
        .isString().withMessage("Email must be a string")
        .notEmpty().withMessage("Email is required"),
    body("password")
        .isString().withMessage("Password must be a string")
        .notEmpty().withMessage("Password is required"),
    body("captchaAnswer")
        .notEmpty().withMessage("Captcha answer is required"),
    body("captchaToken")
        .notEmpty().withMessage("Captcha token is required"),
];

router.post("/register", validateSignup, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty())
            return res.status(400).json({ error: errors.array()[0].msg });
        const { firstName, lastName, email, password, role, studentId, department, captchaAnswer, captchaToken } = req.body;

        const decoded = Buffer.from(captchaToken, 'base64').toString();
        const [a, b] = decoded.split(',').map(Number);
        const expectedAnswer = a + b;
        if (parseInt(captchaAnswer) !== expectedAnswer) {
            return res.status(400).json({ error: "Invalid captcha answer" });
        }

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

        const { email, password, captchaAnswer, captchaToken, rememberMe } = req.body;

        const decoded = Buffer.from(captchaToken, "base64").toString();
        const [a, b] = decoded.split(",").map(Number);
        const expectedAnswer = a + b;
        if (parseInt(captchaAnswer) !== expectedAnswer) {
            return res.status(400).json({ error: "Invalid captcha answer" });
        }

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
