const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const raw = req.header("Authorization");
    const token = raw?.startsWith("Bearer ") ? raw.replace("Bearer ", "") : req.cookies.token;

    if (!token) {
        return res.status(401).json({ error: "Access denied: missing token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
};

module.exports = auth;
