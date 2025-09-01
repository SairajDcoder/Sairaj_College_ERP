const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

// ✅ Import routes
const authRoutes = require("./routes/auth");
const passwordRoutes = require("./routes/password");

// ✅ Use routes
app.use("/api/auth", authRoutes);
app.use("/api/password", passwordRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("College ERP Backend Running 🚀");
});

const PORT = process.env.PORT || 5000;



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
