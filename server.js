const express = require("express");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const cors = require("cors");
const rateLimit = require("express-rate-limit");
const routes = require("./routes");
const db = require("./config/connection");

const PORT = process.env.PORT || 5000;
const app = express();

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === "production" ? 300 : 1000,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
  handler: (req, res) => {
    res.status(429).json({
      message: "Too many requests. Please wait a moment and try again.",
    });
  },
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api", apiLimiter);
app.use(routes);

// Serve up static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/build")));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Log DB connection issues early, then start server once Mongo is available.
db.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

db.once("open", () => {
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}!`);
  });
});
