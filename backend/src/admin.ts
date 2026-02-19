import { Request, Response } from "express";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

// Ensure admin
export function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

// --- MEMBERS ---

export async function listMembers(req: Request, res: Response) {
  const users = await prisma.user.findMany({
    orderBy: { username: "asc" },
    select: { id: true, username: true, isAdmin: true, createdAt: true }
  });
  res.json(users);
}

export async function createMember(req: Request, res: Response) {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "Missing username or password" });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { username, password: hashed, isAdmin: false }
  });

  res.json(user);
}

export async function deleteMember(req: Request, res: Response) {
  const id = Number(req.params.id);
  await prisma.user.delete({ where: { id } });
  res.json({ ok: true });
}

export async function resetPassword(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { newPassword } = req.body;

  if (!newPassword)
    return res.status(400).json({ error: "Missing newPassword" });

  const hashed = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id },
    data: { password: hashed }
  });

  res.json({ ok: true });
}

// --- BOOKINGS TODAY (Admin View) ---
export async function adminTodayBookings(req: Request, res: Response) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const bookings = await prisma.booking.findMany({
    where: { date: today },
    include: { user: true },
    orderBy: { createdAt: "asc" }
  });

  const waitlist = await prisma.waitlistEntry.findMany({
    where: { date: today },
    include: { user: true },
    orderBy: { position: "asc" }
  });

  res.json({ bookings, waitlist });
}

// --- HISTORICAL ATTENDANCE ---
export async function attendanceHistory(req: Request, res: Response) {
  const allBookings = await prisma.booking.findMany({
    include: { user: true },
    orderBy: [{ date: "desc" }, { createdAt: "asc" }],
  });

  res.json(allBookings);
}

// --- SCHEDULE MANAGEMENT ---
export async function getSchedule(req: Request, res: Response) {
  const schedule = await prisma.classSchedule.findMany({
    orderBy: { dayOfWeek: "asc" }
  });
  res.json(schedule);
}

export async function updateSchedule(req: Request, res: Response) {
  const updates = req.body; // array of changes
  if (!Array.isArray(updates))
    return res.status(400).json({ error: "Expected array" });

  const ops = updates.map((u) =>
    prisma.classSchedule.update({
      where: { dayOfWeek: u.dayOfWeek },
      data: {
        startTime: u.startTime,
        capacity: u.capacity,
        enabled: u.enabled,
      },
    })
  );

  await prisma.$transaction(ops);

  res.json({ ok: true });
}
