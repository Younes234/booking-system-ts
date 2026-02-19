"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = require("./auth");
const bookings_1 = require("./bookings");
const admin_1 = require("./admin");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check
app.get("/api/health", (req, res) => {
    res.json({ ok: true });
});
// Public route
app.post("/api/login", auth_1.loginHandler);
// Protected test route
app.get("/api/protected", auth_1.authMiddleware, (req, res) => {
    res.json({
        message: "You accessed a protected route!",
        user: req.user
    });
});
app.get("/api/today", auth_1.authMiddleware, bookings_1.getTodayStatus);
app.post("/api/book", auth_1.authMiddleware, bookings_1.bookToday);
app.post("/api/cancel", auth_1.authMiddleware, bookings_1.cancelToday);
// ADMIN ROUTES
app.get("/api/admin/members", auth_1.authMiddleware, admin_1.requireAdmin, admin_1.listMembers);
app.post("/api/admin/members", auth_1.authMiddleware, admin_1.requireAdmin, admin_1.createMember);
app.delete("/api/admin/members/:id", auth_1.authMiddleware, admin_1.requireAdmin, admin_1.deleteMember);
app.post("/api/admin/members/:id/password", auth_1.authMiddleware, admin_1.requireAdmin, admin_1.resetPassword);
app.get("/api/admin/bookings/today", auth_1.authMiddleware, admin_1.requireAdmin, admin_1.adminTodayBookings);
app.get("/api/admin/bookings/history", auth_1.authMiddleware, admin_1.requireAdmin, admin_1.attendanceHistory);
app.get("/api/admin/schedule", auth_1.authMiddleware, admin_1.requireAdmin, admin_1.getSchedule);
app.post("/api/admin/schedule", auth_1.authMiddleware, admin_1.requireAdmin, admin_1.updateSchedule);
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
