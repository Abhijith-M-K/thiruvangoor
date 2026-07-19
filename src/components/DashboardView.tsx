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
  onRegisterClick: () => void;
  formatINR: (value: number) => string;
  isMock: boolean;
  setView: (view: string) => void;
}

export default function DashboardView({
  swayamsevaks,
  contributions,
  shakhas,
  onRegisterClick,
  formatINR,
  isMock,
  setView
}: DashboardViewProps) {
  const totalSwayamsevaksCount = swayamsevaks.length;
  const activeSwayamsevaksCount = swayamsevaks.filter((m) => m.status === "active").length;
  const totalGuruDakshinaCollected = contributions.reduce((sum, c) => sum + c.amount, 0);



  const events = [
    {
      id: "EV-01",
      title: "Vijayadashami Utsav",
      day: "20",
      month: "Oct",
      location: "Thiruvangoor Higher Secondary School Ground",
      type: "Varshik Utsav",
    },
    {
      id: "EV-02",
      title: "Guru Puja Utsav",
      day: "04",
      month: "Aug",
      location: "Thiruvangoor Community Hall",
      type: "Varshik Utsav",
    },
    {
      id: "EV-03",
      title: "Raksha Bandhan Milan",
      day: "28",
      month: "Aug",
      location: "Chemancheri Balagokulam Hall",
      type: "Milan",
    }
  ];

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
              <span className="metric-subtext">Outstanding: {formatINR(12000)}</span>
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
              {events.map((event) => (
                <div key={event.id} className="event-item">
                  <div className="event-date-box">
                    <span className="event-date-day">{event.day}</span>
                    <span className="event-date-month">{event.month}</span>
                  </div>
                  <div className="event-details">
                    <h4>{event.title}</h4>
                    <p>
                      <MapPin /> {event.location} • <Flag /> {event.type}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel widgets */}
        <div className="dashboard-panel-right">
          <div className="content-panel" style={{ height: "100%" }}>
            <div className="panel-header">
              <h3>
                <Activity /> Attendance Status
              </h3>
            </div>

            <div className="status-indicator-list">
              <div className="status-indicator-row">
                <div className="status-indicator-info green">
                  <UserCheck />
                  <span>Present Today</span>
                </div>
                <span className="status-indicator-val">74</span>
              </div>

              <div className="status-indicator-row">
                <div className="status-indicator-info orange">
                  <Clock />
                  <span>Touring / Pravas</span>
                </div>
                <span className="status-indicator-val">8</span>
              </div>

              <div className="status-indicator-row">
                <div className="status-indicator-info red">
                  <Users />
                  <span>Absent / Leave</span>
                </div>
                <span className="status-indicator-val">12</span>
              </div>
            </div>

            {/* Ghosh Equipment removed */}
          </div>
        </div>
      </div>
    </>
  );
}
