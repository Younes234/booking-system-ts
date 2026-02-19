import express from "express";
import cors from "cors";
import dotenv from "dotenv";

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
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

// Public route
app.post("/api/login", loginHandler);

// Protected test route
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


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
