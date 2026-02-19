import { prisma } from "./prisma";

// Normalize a date to midnight
export function toDateOnly(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getTodaySchedule(date = new Date()) {
  const dayOfWeek = date.getDay();
  const schedule = await prisma.classSchedule.findUnique({
    where: { dayOfWeek },
  });
  return schedule;
}
