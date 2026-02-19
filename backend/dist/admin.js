"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = requireAdmin;
exports.listMembers = listMembers;
exports.createMember = createMember;
exports.deleteMember = deleteMember;
exports.resetPassword = resetPassword;
exports.adminTodayBookings = adminTodayBookings;
exports.attendanceHistory = attendanceHistory;
exports.getSchedule = getSchedule;
exports.updateSchedule = updateSchedule;
const prisma_1 = require("./prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Ensure admin
function requireAdmin(req, res, next) {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ error: "Admin only" });
    }
    next();
}
// --- MEMBERS ---
async function listMembers(req, res) {
    const users = await prisma_1.prisma.user.findMany({
        orderBy: { username: "asc" },
        select: { id: true, username: true, isAdmin: true, createdAt: true }
    });
    res.json(users);
}
async function createMember(req, res) {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: "Missing username or password" });
    const hashed = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma_1.prisma.user.create({
        data: { username, password: hashed, isAdmin: false }
    });
    res.json(user);
}
async function deleteMember(req, res) {
    const id = Number(req.params.id);
    await prisma_1.prisma.user.delete({ where: { id } });
    res.json({ ok: true });
}
async function resetPassword(req, res) {
    const id = Number(req.params.id);
    const { newPassword } = req.body;
    if (!newPassword)
        return res.status(400).json({ error: "Missing newPassword" });
    const hashed = await bcryptjs_1.default.hash(newPassword, 10);
    await prisma_1.prisma.user.update({
        where: { id },
        data: { password: hashed }
    });
    res.json({ ok: true });
}
// --- BOOKINGS TODAY (Admin View) ---
async function adminTodayBookings(req, res) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookings = await prisma_1.prisma.booking.findMany({
        where: { date: today },
        include: { user: true },
        orderBy: { createdAt: "asc" }
    });
    const waitlist = await prisma_1.prisma.waitlistEntry.findMany({
        where: { date: today },
        include: { user: true },
        orderBy: { position: "asc" }
    });
    res.json({ bookings, waitlist });
}
// --- HISTORICAL ATTENDANCE ---
async function attendanceHistory(req, res) {
    const allBookings = await prisma_1.prisma.booking.findMany({
        include: { user: true },
        orderBy: [{ date: "desc" }, { createdAt: "asc" }],
    });
    res.json(allBookings);
}
// --- SCHEDULE MANAGEMENT ---
async function getSchedule(req, res) {
    const schedule = await prisma_1.prisma.classSchedule.findMany({
        orderBy: { dayOfWeek: "asc" }
    });
    res.json(schedule);
}
async function updateSchedule(req, res) {
    const updates = req.body; // array of changes
    if (!Array.isArray(updates))
        return res.status(400).json({ error: "Expected array" });
    const ops = updates.map((u) => prisma_1.prisma.classSchedule.update({
        where: { dayOfWeek: u.dayOfWeek },
        data: {
            startTime: u.startTime,
            capacity: u.capacity,
            enabled: u.enabled,
        },
    }));
    await prisma_1.prisma.$transaction(ops);
    res.json({ ok: true });
}
