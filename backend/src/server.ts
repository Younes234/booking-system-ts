import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import { loginHandler, authMiddleware } from "./auth";
import { getTodayStatus, bookToday, cancelToday } from "./bookings";
import {
  listMembers,
  createMember,
  deleteMember,
  resetPassword,
  adminTodayBookings,
  attendanceHistory,
  getSchedule,
  updateSchedule,
  requireAdmin
} from "./admin";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

// ✅ SAFE CORS (only allow your frontend + localhost)
const allowedOrigins = [
  "http://localhost:5173",
  "https://allstylesbooking.vercel.app",
];

const corsOptions = {
  origin: (origin: string | undefined, cb: Function) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return cb(null, true);
    }
    return cb(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

// 🔒 Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

app.use(express.json());
app.use("/api", apiLimiter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Public route
app.post("/api/login", loginLimiter, loginHandler);

// Protected routes
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You accessed a protected route!",
    user: req.user
  });
});

app.get("/api/today", authMiddleware, getTodayStatus);
app.post("/api/book", authMiddleware, bookToday);
app.post("/api/cancel", authMiddleware, cancelToday);

// ADMIN ROUTES
app.get("/api/admin/members", authMiddleware, requireAdmin, listMembers);
app.post("/api/admin/members", authMiddleware, requireAdmin, createMember);
app.delete("/api/admin/members/:id", authMiddleware, requireAdmin, deleteMember);
app.post("/api/admin/members/:id/password", authMiddleware, requireAdmin, resetPassword);

app.get("/api/admin/bookings/today", authMiddleware, requireAdmin, adminTodayBookings);
app.get("/api/admin/bookings/history", authMiddleware, requireAdmin, attendanceHistory);

app.get("/api/admin/schedule", authMiddleware, requireAdmin, getSchedule);
app.post("/api/admin/schedule", authMiddleware, requireAdmin, updateSchedule);

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});