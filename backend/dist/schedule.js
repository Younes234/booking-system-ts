"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDateOnly = toDateOnly;
exports.getTodaySchedule = getTodaySchedule;
const prisma_1 = require("./prisma");
// Normalize a date to midnight
function toDateOnly(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
async function getTodaySchedule(date = new Date()) {
    const dayOfWeek = date.getDay();
    const schedule = await prisma_1.prisma.classSchedule.findUnique({
        where: { dayOfWeek },
    });
    return schedule;
}
