"use client";

import React from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Flag,
  Clock,
  UserCheck,
  Activity,
  BookOpen,
  FileText,
  LogOut
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  handleLogout: () => void;
}

export default function Sidebar({ currentView, setCurrentView, handleLogout }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-brand">
          <div className="sidebar-logo rss">
            <Flag fill="currentColor" />
          </div>
          <div className="brand-text">
            <h2>Rashtriya Swayamsevak Sangh</h2>
            <p>Admin Portal</p>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`menu-item ${currentView === "dashboard" ? "active-saffron" : ""}`}
          >
            <LayoutDashboard /> Dashboard
          </button>
          
          <button
            onClick={() => setCurrentView("swayamsevaks")}
            className={`menu-item ${currentView === "swayamsevaks" ? "active-saffron" : ""}`}
          >
            <Users /> Swayamsevaks
          </button>

          <button
            onClick={() => setCurrentView("dakshina")}
            className={`menu-item ${currentView === "dakshina" ? "active-saffron" : ""}`}
          >
            <CreditCard /> Guru Dakshina
          </button>

          <button
            onClick={() => setCurrentView("shakhas")}
            className={`menu-item ${currentView === "shakhas" ? "active-saffron" : ""}`}
          >
            <Flag /> Shakha Sessions
          </button>

          <button
            onClick={() => setCurrentView("schedule")}
            className={`menu-item ${currentView === "schedule" ? "active-saffron" : ""}`}
          >
            <Clock /> Schedule
          </button>

          <button
            onClick={() => setCurrentView("karyakartas")}
            className={`menu-item ${currentView === "karyakartas" ? "active-saffron" : ""}`}
          >
            <UserCheck /> Trainers / Shikshaks
          </button>

          <button
            onClick={() => setCurrentView("sewa")}
            className={`menu-item ${currentView === "sewa" ? "active-saffron" : ""}`}
          >
            <Activity /> Sewa Projects
          </button>

          <button
            onClick={() => setCurrentView("bauddhik")}
            className={`menu-item ${currentView === "bauddhik" ? "active-saffron" : ""}`}
          >
            <BookOpen /> Bauddhik Tests
          </button>

          <button
            onClick={() => setCurrentView("reports")}
            className={`menu-item ${currentView === "reports" ? "active-saffron" : ""}`}
          >
            <FileText /> Reports
          </button>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="profile-card">
          <div className="profile-info">
            <div className="profile-avatar rss">RSS</div>
            <div className="profile-meta">
              <h4>RSS Admin</h4>
              <p>rssthiruvangoor@...</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="logout-button"
            title="Logout from portal"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
