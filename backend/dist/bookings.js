"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayStatus = getTodayStatus;
exports.bookToday = bookToday;
exports.cancelToday = cancelToday;
const prisma_1 = require("./prisma");
const schedule_1 = require("./schedule");
function getTodayDateOnly() {
    return (0, schedule_1.toDateOnly)(new Date());
}
// GET /api/today
async function getTodayStatus(req, res) {
    const user = req.user;
    const today = getTodayDateOnly();
    const config = await (0, schedule_1.getTodaySchedule)(today);
    if (!config || !config.enabled) {
        return res.json({
            isClassDay: false,
            message: "No class today",
        });
    }
    const [bookings, waitlist] = await Promise.all([
        prisma_1.prisma.booking.findMany({
            where: { date: today },
            include: { user: true },
            orderBy: { createdAt: "asc" },
        }),
        prisma_1.prisma.waitlistEntry.findMany({
            where: { date: today },
            include: { user: true },
            orderBy: { position: "asc" },
        }),
    ]);
    const userBooking = bookings.find((b) => b.userId === user.id);
    const userWaitlist = waitlist.find((w) => w.userId === user.id);
    return res.json({
        isClassDay: true,
        date: today,
        dayOfWeek: today.getDay(),
        startTime: config.startTime,
        capacity: config.capacity,
        bookings: bookings.map((b) => ({
            id: b.id,
            username: b.user.username,
            createdAt: b.createdAt,
        })),
        waitlist: waitlist.map((w) => ({
            id: w.id,
            username: w.user.username,
            position: w.position,
            createdAt: w.createdAt,
        })),
        userStatus: {
            booked: Boolean(userBooking),
            waitlisted: Boolean(userWaitlist),
            position: userWaitlist?.position ?? null,
        },
    });
}
// POST /api/book
async function bookToday(req, res) {
    const user = req.user;
    const today = getTodayDateOnly();
    const config = await (0, schedule_1.getTodaySchedule)(today);
    if (!config || !config.enabled) {
        return res.status(400).json({ error: "No class today" });
    }
    // Already booked?
    const existingBooking = await prisma_1.prisma.booking.findFirst({
        where: { userId: user.id, date: today },
    });
    if (existingBooking) {
        return res.status(400).json({ error: "Already booked today" });
    }
    // Already waitlisted?
    const existingWait = await prisma_1.prisma.waitlistEntry.findFirst({
        where: { userId: user.id, date: today },
    });
    if (existingWait) {
        return res.status(400).json({ error: "Already on waitlist today" });
    }
    const bookingCount = await prisma_1.prisma.booking.count({
        where: { date: today },
    });
    if (bookingCount < config.capacity) {
        const booking = await prisma_1.prisma.booking.create({
            data: {
                userId: user.id,
                date: today,
            },
        });
        return res.json({ status: "BOOKED", bookingId: booking.id });
    }
    // Class is full → use waitlist
    const maxPos = await prisma_1.prisma.waitlistEntry.aggregate({
        where: { date: today },
        _max: { position: true },
    });
    const nextPosition = (maxPos._max.position ?? 0) + 1;
    const wait = await prisma_1.prisma.waitlistEntry.create({
        data: {
            userId: user.id,
            date: today,
            position: nextPosition,
        },
    });
    return res.json({
        status: "WAITLISTED",
        position: wait.position,
    });
}
// POST /api/cancel
async function cancelToday(req, res) {
    const user = req.user;
    const today = getTodayDateOnly();
    const config = await (0, schedule_1.getTodaySchedule)(today);
    if (!config || !config.enabled) {
        return res.status(400).json({ error: "No class today" });
    }
    const booking = await prisma_1.prisma.booking.findFirst({
        where: { userId: user.id, date: today },
    });
    const wait = await prisma_1.prisma.waitlistEntry.findFirst({
        where: { userId: user.id, date: today },
    });
    if (!booking && !wait) {
        return res.status(400).json({ error: "You have no booking or waitlist entry today" });
    }
    // If the user had a confirmed booking
    if (booking) {
        await prisma_1.prisma.booking.delete({ where: { id: booking.id } });
        // Promote first waitlist entry
        const next = await prisma_1.prisma.waitlistEntry.findFirst({
            where: { date: today },
            orderBy: { position: "asc" },
        });
        if (next) {
            await prisma_1.prisma.$transaction([
                prisma_1.prisma.waitlistEntry.delete({ where: { id: next.id } }),
                prisma_1.prisma.booking.create({
                    data: { userId: next.userId, date: today },
                }),
            ]);
        }
    }
    // If the user was on the waitlist
    if (wait) {
        await prisma_1.prisma.waitlistEntry.delete({ where: { id: wait.id } });
    }
    return res.json({ ok: true });
}
