"use strict";
// 0 = Sunday, 1 = Monday, ... 6 = Saturday
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLASS_SCHEDULE = void 0;
exports.getTodayConfig = getTodayConfig;
exports.toDateOnly = toDateOnly;
exports.CLASS_SCHEDULE = {
    0: { enabled: false, startTime: "", capacity: 0 }, // Sunday
    1: { enabled: true, startTime: "18:00", capacity: 26 }, // Monday
    2: { enabled: false, startTime: "", capacity: 0 }, // Tuesday
    3: { enabled: true, startTime: "16:30", capacity: 24 }, // Wednesday
    4: { enabled: false, startTime: "", capacity: 0 }, // Thursday
    5: { enabled: true, startTime: "17:00", capacity: 24 }, // Friday
    6: { enabled: true, startTime: "08:00", capacity: 24 }, // Saturday
};
// Returns today's config
function getTodayConfig(date = new Date()) {
    const dow = date.getDay();
    return exports.CLASS_SCHEDULE[dow];
}
// Normalize a Date to midnight
function toDateOnly(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}
