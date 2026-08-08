"use client";

import React from "react";
import {
  Users,
  UserCheck,
  CreditCard,
  Flag,
  Clock,
  ChevronRight,
  Calendar,
  MapPin,
  Activity,
  Plus,
  Database
} from "lucide-react";

interface Swayamsevak {
  id: string;
  name: string;
  phone: string;
  email: string;
  shakha: string;
  joiningDate: string;
  status: "active" | "inactive" | "touring";
  role: string;
  dakshina: number;
  age?: number;
}

interface Contribution {
  id: string;
  swayamsevakId: string | null;
  name: string;
  shakha: string;
  contributionDate: string;
  amount: number;
}

interface DashboardViewProps {
  swayamsevaks: Swayamsevak[];
  contributions: Contribution[];
  shakhas: any[];
  events: any[];
  onRegisterClick: () => void;
  formatINR: (value: number) => string;
  isMock: boolean;
  setView: (view: string) => void;
  attendanceLogs?: any[];
}

export default function DashboardView({
  swayamsevaks,
  contributions,
  shakhas,
  events = [],
  onRegisterClick,
  formatINR,
  isMock,
  setView,
  attendanceLogs = []
}: DashboardViewProps) {
  const totalSwayamsevaksCount = swayamsevaks.length;
  const activeSwayamsevaksCount = swayamsevaks.filter((m) => m.status === "active").length;
  const totalGuruDakshinaCollected = contributions.reduce((sum, c) => sum + c.amount, 0);



  const todayStr = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"
  const upcomingEvents = (events || [])
    .filter((ev) => ev.eventDate >= todayStr)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .slice(0, 3);

  return (
    <>
      <div className="sticky-header-container">
        <div className="dashboard-header" style={{ marginBottom: "16px" }}>
          <div className="header-title">
            <h1>Dashboard Overview</h1>
            <p>Welcome back! Here's what's happening at RSS Thiruvangoor today.</p>
          </div>
          <button className="btn-primary saffron" onClick={onRegisterClick}>
            <Plus size={16} /> Register Swayamsevak
          </button>
        </div>

        {isMock && (
          <div style={{
            backgroundColor: "#fffbeb",
            border: "1px solid #fef3c7",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            fontSize: "13px",
            color: "#b45309",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontWeight: 500
          }}>
            <Database size={16} />
            <span>
              <strong>Database URL Config:</strong> Currently operating in Local Fallback mode. Add your Vercel Neon postgres <code>DATABASE_URL</code> to <code>.env.local</code> to persist CRUD operations.
            </span>
          </div>
        )}

        {/* Metrics cards grid */}
        <div className="metrics-grid">
          <div className="metric-card active-saffron" onClick={() => setView("swayamsevaks")} style={{ cursor: "pointer" }}>
            <div className="metric-content">
              <span className="metric-label">Total Swayamsevaks</span>
              <span className="metric-value">{totalSwayamsevaksCount}</span>
              <span className="metric-subtext">Lifetime registered</span>
            </div>
            <div className="metric-icon saffron">
              <Users size={20} />
            </div>
          </div>

          <div className="metric-card active-saffron" onClick={() => setView("swayamsevaks")} style={{ cursor: "pointer" }}>
            <div className="metric-content">
              <span className="metric-label">Active Swayamsevaks</span>
              <span className="metric-value">{activeSwayamsevaksCount}</span>
              <span className="metric-subtext">Currently in training</span>
            </div>
            <div className="metric-icon green">
              <UserCheck size={20} />
            </div>
          </div>

          <div className="metric-card active-saffron" onClick={() => setView("dakshina")} style={{ cursor: "pointer" }}>
            <div className="metric-content">
              <span className="metric-label">Guru Dakshina</span>
              <span className="metric-value">{formatINR(totalGuruDakshinaCollected)}</span>
              <span className="metric-subtext">Total collection</span>
            </div>
            <div className="metric-icon yellow">
              <CreditCard size={20} />
            </div>
          </div>

          <div className="metric-card active-saffron" onClick={() => setView("shakhas")} style={{ cursor: "pointer" }}>
            <div className="metric-content">
              <span className="metric-label">Active Shakhas</span>
              <span className="metric-value">{shakhas.length}</span>
              <span className="metric-subtext">Units in Thiruvangoor</span>
            </div>
            <div className="metric-icon violet">
              <Flag size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid */}
      <div className="dashboard-grid-container">
        <div className="dashboard-panel-left">
          {/* Today's Shakhas */}
          <div className="content-panel">
            <div className="panel-header">
              <h3>
                <Clock /> Today's Shakhas
              </h3>
              <button
                onClick={() => setView("shakhas")}
                className="panel-header-link"
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                View Full Schedule <ChevronRight size={14} />
              </button>
            </div>

            <div className="shakha-list">
              {shakhas.map((shakha) => (
                <div key={shakha.id} className="shakha-item">
                  <div className="shakha-item-left">
                    <span className={`shakha-type-badge ${shakha.type}`}>
                      {shakha.type}
                    </span>
                    <div className="shakha-item-info">
                      <h4>{shakha.name}</h4>
                      <p>
                        <MapPin /> {shakha.location}
                      </p>
                    </div>
                  </div>
                  <div className="shakha-item-right">
                    <span className="shakha-time">{shakha.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events / Utsavs */}
          <div className="content-panel">
            <div className="panel-header">
              <h3>
                <Calendar /> Upcoming Utsavs & Events
              </h3>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Annual Calendar
              </span>
            </div>

            <div className="event-list">
              {upcomingEvents.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
                  No upcoming programs scheduled.
                </div>
              ) : (
                upcomingEvents.map((event) => {
                  const d = new Date(event.eventDate);
                  const day = isNaN(d.getTime()) ? "01" : d.getDate().toString().padStart(2, "0");
                  const month = isNaN(d.getTime()) ? "Oct" : d.toLocaleString("en-US", { month: "short" });

                  return (
                    <div key={event.id} className="event-item" onClick={() => setView("schedule")} style={{ cursor: "pointer" }}>
                      <div className="event-date-box">
                        <span className="event-date-day">{day}</span>
                        <span className="event-date-month">{month}</span>
                      </div>
                      <div className="event-details">
                        <h4>{event.name}</h4>
                        <p style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <MapPin size={12} /> {event.place}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right panel widgets */}
        <div className="dashboard-panel-right">
          {/* Daily Shakha Attendance Widget */}
          {(() => {
            const now = new Date();
            const todayFormatted = now.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            });
            const todayFormattedAlt = now.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric"
            });
            const todayIso = now.toISOString().split("T")[0];

            const isToday = (logDate: string) => {
              if (!logDate) return false;
              const trimmed = logDate.trim();
              return (
                trimmed === todayFormatted.trim() ||
                trimmed === todayFormattedAlt.trim() ||
                trimmed === todayIso.trim()
              );
            };

            let displayDate = todayFormatted;
            let activeLogs = attendanceLogs.filter((log) => isToday(log.logDate));
            let isCurrentDateData = true;

            if (activeLogs.length === 0 && attendanceLogs.length > 0) {
              const mostRecentDate = attendanceLogs[0].logDate;
              displayDate = mostRecentDate;
              activeLogs = attendanceLogs.filter(
                (log) => log.logDate.trim() === mostRecentDate.trim()
              );
              isCurrentDateData = false;
            }

            const presentCount = activeLogs.reduce((sum, log) => sum + (log.presentCount || 0), 0);
            const absentCount = activeLogs.reduce((sum, log) => sum + (log.absentCount || 0), 0);
            const absentReasonCount = activeLogs.reduce((sum, log) => sum + (log.absentReasonCount || 0), 0);

            return (
              <div className="content-panel" style={{ height: "auto" }}>
                <div className="panel-header" style={{ marginBottom: "16px" }}>
                  <h3>
                    <Activity /> Daily Shakha Attendance
                  </h3>
                  <span style={{
                    fontSize: "11.5px",
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: "12px",
                    backgroundColor: isCurrentDateData ? "var(--color-success-light)" : "var(--background-secondary)",
                    color: isCurrentDateData ? "var(--color-success)" : "var(--text-secondary)",
                    border: `1px solid ${isCurrentDateData ? "var(--color-success-border)" : "var(--border-color)"}`
                  }}>
                    {isCurrentDateData ? `Today (${todayFormatted})` : displayDate}
                  </span>
                </div>

                {activeLogs.length === 0 ? (
                  <div style={{
                    padding: "20px 16px",
                    textAlign: "center",
                    backgroundColor: "var(--background-secondary)",
                    borderRadius: "var(--radius-md)",
                    border: "1px dashed var(--border-color)"
                  }}>
                    <p style={{ margin: "0 0 12px 0", color: "var(--text-secondary)", fontSize: "13px" }}>
                      No Shakha attendance logged for today ({todayFormatted}).
                    </p>
                    <button
                      type="button"
                      className="btn-primary saffron"
                      onClick={() => setView("shakhas")}
                      style={{ fontSize: "12.5px", padding: "8px 14px", display: "inline-flex", gap: "6px", alignItems: "center" }}
                    >
                      <Plus size={14} /> Mark Today's Attendance
                    </button>
                  </div>
                ) : (
                  <div>
                    {activeLogs.length > 1 && (
                      <div className="status-indicator-list" style={{ marginBottom: "16px" }}>
                        <div className="status-indicator-row">
                          <div className="status-indicator-info green">
                            <UserCheck />
                            <span>Total Present</span>
                          </div>
                          <span className="status-indicator-val">{presentCount}</span>
                        </div>

                        <div className="status-indicator-row">
                          <div className="status-indicator-info orange">
                            <Clock />
                            <span>Total Excuse</span>
                          </div>
                          <span className="status-indicator-val">{absentReasonCount}</span>
                        </div>

                        <div className="status-indicator-row">
                          <div className="status-indicator-info red">
                            <Users />
                            <span>Total Absent</span>
                          </div>
                          <span className="status-indicator-val">{absentCount}</span>
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {activeLogs.map((log) => {
                        const total = (log.presentCount || 0) + (log.absentCount || 0) + (log.absentReasonCount || 0);
                        const pct = total > 0 ? Math.round(((log.presentCount || 0) / total) * 100) : 0;
                        const shakhaName = log.shakhaName || shakhas.find((s) => s.id === log.shakhaId)?.name || "Shakha Unit";

                        return (
                          <div
                            key={log.id}
                            style={{
                              padding: "14px",
                              backgroundColor: "var(--background-secondary)",
                              borderRadius: "var(--radius-md)",
                              border: "1px solid var(--border-color)"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                                {shakhaName}
                              </span>
                              <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-saffron)" }}>
                                {pct}% Present
                              </span>
                            </div>

                            <div style={{ display: "flex", gap: "14px", fontSize: "12.5px" }}>
                              <span style={{ color: "#16a34a", fontWeight: 600 }}>
                                Present: {log.presentCount}
                              </span>
                              <span style={{ color: "#d97706", fontWeight: 600 }}>
                                Excuse: {log.absentReasonCount}
                              </span>
                              <span style={{ color: "#dc2626", fontWeight: 600 }}>
                                Absent: {log.absentCount}
                              </span>
                            </div>

                            {log.remarks && (
                              <p style={{ margin: "8px 0 0 0", fontSize: "11.5px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                "{log.remarks}"
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: "14px", textAlign: "right" }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setView("shakhas")}
                        style={{ fontSize: "12px", padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <Plus size={13} /> Mark / Manage Attendance
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

            {/* Ghosh Equipment removed */}
        </div>
      </div>
    </>
  );
}
