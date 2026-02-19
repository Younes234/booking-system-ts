import React, { useEffect, useState } from "react";
import {
  login,
  fetchToday,
  bookTodayApi,
  cancelTodayApi,
  getToken,
  setToken,
  adminListMembers,
  adminCreateMember,
  adminDeleteMember,
  adminResetMemberPassword,
  adminGetTodayBookings,
  adminGetAttendanceHistory,
  adminGetSchedule,
  adminUpdateSchedule,
} from "./api";
import type { User, TodayStatus, Member, ClassScheduleEntry } from "./api";

type AdminTab = "members" | "today" | "history" | "schedule";

const DEFAULT_WEEK_SCHEDULE: ClassScheduleEntry[] = [
  { id: 0, dayOfWeek: 0, startTime: "10:00", capacity: 24, enabled: true },
  { id: 1, dayOfWeek: 1, startTime: "18:00", capacity: 24, enabled: true },
  { id: 2, dayOfWeek: 2, startTime: "", capacity: 0, enabled: false },
  { id: 3, dayOfWeek: 3, startTime: "18:00", capacity: 24, enabled: true },
  { id: 4, dayOfWeek: 4, startTime: "", capacity: 0, enabled: false },
  { id: 5, dayOfWeek: 5, startTime: "18:00", capacity: 24, enabled: true },
  { id: 6, dayOfWeek: 6, startTime: "12:00", capacity: 24, enabled: true },
];

function dayName(d: number) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d];
}

function App() {
  // Auth / user
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Booking
  const [today, setToday] = useState<TodayStatus | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  // Admin
  const [adminTab, setAdminTab] = useState<AdminTab>("members");
  const [members, setMembers] = useState<Member[]>([]);
  const [newMemberUsername, setNewMemberUsername] = useState("");
  const [newMemberPassword, setNewMemberPassword] = useState("");
  const [adminTodayData, setAdminTodayData] = useState<{
    bookings: any[];
    waitlist: any[];
  } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [schedule, setSchedule] = useState<ClassScheduleEntry[]>(DEFAULT_WEEK_SCHEDULE);
  const [adminMessage, setAdminMessage] = useState("");

  // -------------------- SHARED LOADERS --------------------

  async function loadToday() {
    setActionMessage("");
    try {
      const data = await fetchToday();
      setToday(data);
    } catch (err: any) {
      setActionMessage(err?.response?.data?.error ?? "Failed to load today’s class.");
    }
  }

  async function loadAdminMembers() {
    try {
      const data = await adminListMembers();
      setMembers(data);
    } catch (err: any) {
      setAdminMessage(err?.response?.data?.error ?? "Failed to load members.");
    }
  }

  async function loadAdminTodayBookings() {
    setAdminMessage("");
    try {
      const data = await adminGetTodayBookings();
      setAdminTodayData(data);
    } catch (err: any) {
      setAdminMessage(err?.response?.data?.error ?? "Failed to load today's bookings.");
    }
  }

  async function loadAdminHistory() {
    setAdminMessage("");
    try {
      const data = await adminGetAttendanceHistory();
      setHistory(data);
    } catch (err: any) {
      setAdminMessage(err?.response?.data?.error ?? "Failed to load history.");
    }
  }

  async function loadAdminSchedule() {
    setAdminMessage("");
    try {
      const data = await adminGetSchedule();
      setSchedule(data);
    } catch (err: any) {
      setAdminMessage(err?.response?.data?.error ?? "Failed to load schedule.");
    }
  }

  // Initial load if already logged in
  useEffect(() => {
    if (user && getToken()) {
      loadToday();
      if (user.isAdmin) {
        loadAdminMembers();
        loadAdminSchedule();
      }
    }
  }, []);

  // -------------------- AUTH --------------------

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    try {
      const data = await login(usernameInput, passwordInput);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));

      setSchedule(DEFAULT_WEEK_SCHEDULE); // base schedule for non-admin
      await loadToday();
      if (data.user.isAdmin) {
        await Promise.all([loadAdminMembers(), loadAdminSchedule()]);
      }
    } catch (err: any) {
      setLoginError(err?.response?.data?.error ?? "Login failed.");
    }
  }

  function handleLogout() {
    setToken(null);
    localStorage.removeItem("user");
    setUser(null);
    setToday(null);
    setMembers([]);
    setAdminTodayData(null);
    setHistory([]);
    setSchedule(DEFAULT_WEEK_SCHEDULE);
    setAdminMessage("");
    setActionMessage("");
  }

  // -------------------- MEMBER ACTIONS --------------------

  async function handleBook() {
    setActionMessage("");
    try {
      const res = await bookTodayApi();
      if (res.status === "BOOKED") {
        setActionMessage("You are booked for today's class.");
      } else if (res.status === "WAITLISTED") {
        setActionMessage(`Class is full. You are on the waitlist (position ${res.position}).`);
      }
      await loadToday();
    } catch (err: any) {
      setActionMessage(err?.response?.data?.error ?? "Booking failed.");
    }
  }

  async function handleCancel() {
    setActionMessage("");
    try {
      await cancelTodayApi();
      setActionMessage("Your booking or waitlist entry has been cancelled.");
      await loadToday();
    } catch (err: any) {
      setActionMessage(err?.response?.data?.error ?? "Cancellation failed.");
    }
  }

  // -------------------- ADMIN ACTIONS --------------------

  async function handleCreateMember(e: React.FormEvent) {
    e.preventDefault();
    setAdminMessage("");
    if (!newMemberUsername || !newMemberPassword) {
      setAdminMessage("Username and password required.");
      return;
    }
    try {
      await adminCreateMember(newMemberUsername, newMemberPassword);
      setNewMemberUsername("");
      setNewMemberPassword("");
      await loadAdminMembers();
      setAdminMessage("Member created.");
    } catch (err: any) {
      setAdminMessage(err?.response?.data?.error ?? "Failed to create member.");
    }
  }

  async function handleDeleteMember(id: number) {
    if (!window.confirm("Delete this member?")) return;
    setAdminMessage("");
    try {
      await adminDeleteMember(id);
      await loadAdminMembers();
      setAdminMessage("Member deleted.");
    } catch (err: any) {
      setAdminMessage(err?.response?.data?.error ?? "Failed to delete member.");
    }
  }

  async function handleResetPassword(id: number) {
    const newPassword = window.prompt("Enter new password:");
    if (!newPassword) return;
    setAdminMessage("");
    try {
      await adminResetMemberPassword(id, newPassword);
      setAdminMessage("Password reset.");
    } catch (err: any) {
      setAdminMessage(err?.response?.data?.error ?? "Failed to reset password.");
    }
  }

  async function handleSaveSchedule() {
    setAdminMessage("");
    try {
      await adminUpdateSchedule(
        schedule.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          capacity: s.capacity,
          enabled: s.enabled,
        }))
      );
      setAdminMessage("Schedule updated.");
    } catch (err: any) {
      setAdminMessage(err?.response?.data?.error ?? "Failed to update schedule.");
    }
  }

  // -------------------- LOGIN PAGE --------------------

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-inner">
          <div className="login-brand">
            <h1>Allstyles Striking</h1>
            <img src="/allstyles-logo.png" className="app-logo" alt="Allstyles logo" />
          </div>

          <div className="card">
            <h2>Log In</h2>
            <form onSubmit={handleLogin} className="mt-12">
              <label className="muted">Username</label>
              <input
                className="input"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
              />

              <label className="muted mt-12">Password</label>
              <input
                className="input"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
              />

              {loginError && (
                <p className="message error" style={{ marginTop: 8 }}>
                  {loginError}
                </p>
              )}

              <button type="submit" style={{ width: "100%", marginTop: 14 }}>
                Log In
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // -------------------- MAIN APP --------------------

  const isClassDay = today?.isClassDay && today.capacity && today.capacity > 0;
  const bookedCount = today?.bookings?.length ?? 0;
  const capacity = today?.capacity ?? 0;
  const spotsLeft = Math.max(capacity - bookedCount, 0);
  const progressPct = capacity > 0 ? Math.min(100, (bookedCount / capacity) * 100) : 0;

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header-left">
          <div className="sub">
            Bookings & cancellations only apply to <strong>today</strong>.
          </div>
        </div>

        <div className="app-header-right">
          <div className="muted" style={{ fontSize: 24 }}>
            Logged in as <strong>{user.username}</strong>
          </div>
          <button className="secondary" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <div className="main-grid">
        <section className="card" aria-live="polite">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="row">
              <div className="pill">
                {isClassDay
                  ? `${new Date().toLocaleDateString("en-GB", {
                      weekday: "long",
                    })} · ${today?.startTime}`
                  : "No class"}
              </div>
            </div>
            <div className="row">
              <span className="pill">
                <span className="count">{spotsLeft}</span>
                <span className="muted">spots left</span>
              </span>
            </div>
          </div>

          <div className="progress">
            <span style={{ width: `${progressPct}%` }} />
          </div>
          <div className="muted">
            {isClassDay ? (
              <>
                {bookedCount}/{capacity} booked
              </>
            ) : (
              "No class today."
            )}
          </div>
        

          {isClassDay && (
            <>
              <div>
                <div className="muted">Participants:</div>
                <div className="list">
                  {bookedCount === 0 && (
                    <span className="muted">No one booked yet.</span>
                  )}
                  {today?.bookings?.map((b) => (
                    <span key={b.id} className="chip">
                      {b.username}
                    </span>
                  ))}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleBook();
                }}
                style={{ display: "flex", gap: 10, marginTop: 12 }}
              >
                <button type="submit" disabled={!isClassDay || spotsLeft === 0}>
                  Book
                </button>
              </form>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCancel();
                }}
                style={{ display: "flex", gap: 10, marginTop: 10 }}
              >
                <button type="submit" className="danger secondary">
                  Cancel
                </button>
              </form>
            </>
          )}

          {actionMessage && <p className="message mt-8">{actionMessage}</p>}
        </section>
      </div>

      {/* ---------------- ADMIN PANEL ---------------- */}
      {user.isAdmin && (
        <section className="card mt-20">
          <h2>Admin Panel</h2>

          <div className="admin-tabs mt-12">
            <button
              className={adminTab === "members" ? "" : "secondary"}
              onClick={() => {
                setAdminTab("members");
                loadAdminMembers();
              }}
            >
              Members
            </button>
            <button
              className={adminTab === "today" ? "" : "secondary"}
              onClick={() => {
                setAdminTab("today");
                loadAdminTodayBookings();
              }}
            >
              Today
            </button>
            <button
              className={adminTab === "history" ? "" : "secondary"}
              onClick={() => {
                setAdminTab("history");
                loadAdminHistory();
              }}
            >
              History
            </button>
            <button
              className={adminTab === "schedule" ? "" : "secondary"}
              onClick={() => {
                setAdminTab("schedule");
                loadAdminSchedule();
              }}
            >
              Schedule
            </button>
          </div>

          {adminMessage && <p className="message mt-8">{adminMessage}</p>}

          {/* MEMBERS TAB */}
          {adminTab === "members" && (
            <div className="admin-section">
              <h3>Add Member</h3>
              <form onSubmit={handleCreateMember} className="mt-8">
                <label className="muted">Username</label>
                <input
                  className="input"
                  value={newMemberUsername}
                  onChange={(e) => setNewMemberUsername(e.target.value)}
                />
                <label className="muted mt-8">Password</label>
                <input
                  className="input"
                  type="password"
                  value={newMemberPassword}
                  onChange={(e) => setNewMemberPassword(e.target.value)}
                />
                <button type="submit" className="mt-12">
                  Create Member
                </button>
              </form>

              <h3 className="mt-20">All Members</h3>
              <div className="admin-list mt-8">
                {members.map((m) => (
                  <div key={m.id} className="week-day">
                    <div className="row" style={{ justifyContent: "space-between" }}>
                      <div>
                        <strong>{m.username}</strong>{" "}
                        {m.isAdmin && <span className="muted">(admin)</span>}
                      </div>
                      <div className="row">
                        <button
                          className="secondary"
                          onClick={() => handleResetPassword(m.id)}
                        >
                          Reset Password
                        </button>
                        {!m.isAdmin && (
                          <button
                            className="danger secondary"
                            onClick={() => handleDeleteMember(m.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TODAY TAB */}
          {adminTab === "today" && (
            <div className="admin-section">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3>Today's Bookings</h3>
                <button className="secondary" onClick={loadAdminTodayBookings}>
                  Refresh
                </button>
              </div>

              <h4 className="mt-12">Booked</h4>
              <div className="admin-list">
                {adminTodayData?.bookings.map((b) => (
                  <div key={b.id} className="week-day">
                    {b.user.username}
                  </div>
                ))}
                {(!adminTodayData || adminTodayData.bookings.length === 0) && (
                  <p className="muted mt-8">No bookings yet.</p>
                )}
              </div>

              <h4 className="mt-16">Waitlist</h4>
              <div className="admin-list">
                {adminTodayData?.waitlist.map((w) => (
                  <div key={w.id} className="week-day">
                    {w.user.username} (pos {w.position})
                  </div>
                ))}
                {(!adminTodayData || adminTodayData.waitlist.length === 0) && (
                  <p className="muted mt-8">No one on waitlist.</p>
                )}
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {adminTab === "history" && (
            <div className="admin-section">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3>Attendance History</h3>
                <button className="secondary" onClick={loadAdminHistory}>
                  Load History
                </button>
              </div>
              <div className="admin-list mt-8">
                {history.map((b) => (
                  <div key={b.id} className="week-day">
                    {new Date(b.date).toLocaleDateString()} — {b.user.username}
                  </div>
                ))}
                {history.length === 0 && (
                  <p className="muted mt-8">No history yet.</p>
                )}
              </div>
            </div>
          )}

          {/* SCHEDULE TAB */}
          {adminTab === "schedule" && (
            <div className="admin-section">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3>Class Schedule</h3>
                <button className="secondary" onClick={loadAdminSchedule}>
                  Refresh
                </button>
              </div>

              <div className="admin-list mt-8">
                {schedule.map((s) => (
                  <div key={s.id} className="week-day">
                    <strong>{dayName(s.dayOfWeek)}</strong>

                    <div className="mt-8">
                      <label className="muted">
                        <input
                          type="checkbox"
                          checked={s.enabled}
                          onChange={(e) =>
                            setSchedule((prev) =>
                              prev.map((x) =>
                                x.id === s.id ? { ...x, enabled: e.target.checked } : x
                              )
                            )
                          }
                          style={{ marginRight: 6 }}
                        />
                        Enabled
                      </label>
                    </div>

                    <div className="mt-8">
                      <label className="muted">Start Time</label>
                      <input
                        className="input"
                        value={s.startTime}
                        onChange={(e) =>
                          setSchedule((prev) =>
                            prev.map((x) =>
                              x.id === s.id ? { ...x, startTime: e.target.value } : x
                            )
                          )
                        }
                      />
                    </div>

                    <div className="mt-8">
                      <label className="muted">Capacity</label>
                      <input
                        className="input"
                        type="number"
                        value={s.capacity}
                        onChange={(e) =>
                          setSchedule((prev) =>
                            prev.map((x) =>
                              x.id === s.id
                                ? { ...x, capacity: Number(e.target.value) }
                                : x
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button className="mt-12" onClick={handleSaveSchedule}>
                Save Schedule
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
