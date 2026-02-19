import axios from "axios";

const API_BASE_URL = "http://localhost:4000/api";

// --- Token helpers ---

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem("token", token);
  } else {
    localStorage.removeItem("token");
  }
}

// --- Axios instance ---

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Types ---

export type User = {
  id: number;
  username: string;
  isAdmin: boolean;
};

export type TodayStatus = {
  isClassDay: boolean;
  date?: string;
  dayOfWeek?: number;
  startTime?: string;
  capacity?: number;
  bookings?: { id: number; username: string; createdAt: string }[];
  waitlist?: { id: number; username: string; position: number; createdAt: string }[];
  userStatus?: {
    booked: boolean;
    waitlisted: boolean;
    position: number | null;
  };
  message?: string;
};

// Admin types
export type Member = {
  id: number;
  username: string;
  isAdmin: boolean;
  createdAt: string;
};

export type AdminTodayBooking = {
  id: number;
  date: string;
  createdAt: string;
  user: {
    id: number;
    username: string;
  };
};

export type AdminWaitlistEntry = {
  id: number;
  date: string;
  position: number;
  createdAt: string;
  user: {
    id: number;
    username: string;
  };
};

export type ClassScheduleEntry = {
  id: number;
  dayOfWeek: number;
  startTime: string;
  capacity: number;
  enabled: boolean;
};

// --- Public / member APIs ---

export async function login(username: string, password: string): Promise<{
  token: string;
  user: User;
}> {
  const res = await api.post("/login", { username, password });
  return res.data;
}

export async function fetchToday(): Promise<TodayStatus> {
  const res = await api.get("/today");
  return res.data;
}

export async function bookTodayApi(): Promise<{ status: string; bookingId?: number; position?: number }> {
  const res = await api.post("/book");
  return res.data;
}

export async function cancelTodayApi(): Promise<{ ok: boolean }> {
  const res = await api.post("/cancel");
  return res.data;
}

// --- Admin APIs ---

// Members
export async function adminListMembers(): Promise<Member[]> {
  const res = await api.get("/admin/members");
  return res.data;
}

export async function adminCreateMember(username: string, password: string): Promise<Member> {
  const res = await api.post("/admin/members", { username, password });
  return res.data;
}

export async function adminDeleteMember(id: number): Promise<{ ok: boolean }> {
  const res = await api.delete(`/admin/members/${id}`);
  return res.data;
}

export async function adminResetMemberPassword(id: number, newPassword: string): Promise<{ ok: boolean }> {
  const res = await api.post(`/admin/members/${id}/password`, { newPassword });
  return res.data;
}

// Bookings today (admin view)
export async function adminGetTodayBookings(): Promise<{
  bookings: AdminTodayBooking[];
  waitlist: AdminWaitlistEntry[];
}> {
  const res = await api.get("/admin/bookings/today");
  return res.data;
}

// Historical attendance
export async function adminGetAttendanceHistory(): Promise<AdminTodayBooking[]> {
  const res = await api.get("/admin/bookings/history");
  return res.data;
}

// Schedule
export async function adminGetSchedule(): Promise<ClassScheduleEntry[]> {
  const res = await api.get("/admin/schedule");
  return res.data;
}

export async function adminUpdateSchedule(
  updates: { dayOfWeek: number; startTime: string; capacity: number; enabled: boolean }[]
): Promise<{ ok: boolean }> {
  const res = await api.post("/admin/schedule", updates);
  return res.data;
}
