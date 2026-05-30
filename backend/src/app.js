const express = require("express");
const cors = require("cors");
const path = require('path');

// 1. Initialize app
const app = express();

// 2. Global middleware
app.use(cors());
app.use(express.json());

// 3. Basic route (test)
app.get("/", (req, res) => {
  res.send("API is running...");
});

// 4. Routes
const authRoutes = require("./routes/authRoutes");
const testRoutes = require("./routes/testRoutes");
const jobRoutes = require("./routes/jobRoutes");
const proposalRoutes = require("./routes/proposalRoutes");
const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);
app.use("/api/auth", authRoutes);
app.use('/api/test', testRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/proposals', proposalRoutes);
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Serve uploaded profile photos statically
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// 5. Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {},
  });
});

// 6. 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// 7. Export app
module.exports = app;