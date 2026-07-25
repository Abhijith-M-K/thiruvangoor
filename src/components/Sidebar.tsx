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
  LogOut,
  X
} from "lucide-react";

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  handleLogout: () => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ currentView, setCurrentView, handleLogout, isOpen, setIsOpen }: SidebarProps) {
  const handleNavClick = (view: string) => {
    setCurrentView(view);
    setIsOpen(false);
  };

  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <div>
        <div className="sidebar-brand" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="sidebar-logo rss">
              <Flag fill="currentColor" />
            </div>
            <div className="brand-text">
              <h2>Rashtriya Swayamsevak Sangh</h2>
              <p>Admin Portal</p>
            </div>
          </div>
          <button 
            className="close-sidebar-btn" 
            onClick={() => setIsOpen(false)}
            style={{ 
              display: "none", 
              background: "none", 
              border: "none", 
              color: "var(--text-secondary)", 
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-menu">
          <button
            onClick={() => handleNavClick("dashboard")}
            className={`menu-item ${currentView === "dashboard" ? "active-saffron" : ""}`}
          >
            <LayoutDashboard /> Dashboard
          </button>
          
          <button
            onClick={() => handleNavClick("swayamsevaks")}
            className={`menu-item ${currentView === "swayamsevaks" ? "active-saffron" : ""}`}
          >
            <Users /> Swayamsevaks
          </button>

          <button
            onClick={() => handleNavClick("dakshina")}
            className={`menu-item ${currentView === "dakshina" ? "active-saffron" : ""}`}
          >
            <CreditCard /> Guru Dakshina
          </button>

          <button
            onClick={() => handleNavClick("shakhas")}
            className={`menu-item ${currentView === "shakhas" ? "active-saffron" : ""}`}
          >
            <Flag /> Shakha Sessions
          </button>

          <button
            onClick={() => handleNavClick("schedule")}
            className={`menu-item ${currentView === "schedule" ? "active-saffron" : ""}`}
          >
            <Clock /> Schedule
          </button>

          <button
            onClick={() => handleNavClick("karyakartas")}
            className={`menu-item ${currentView === "karyakartas" ? "active-saffron" : ""}`}
          >
            <UserCheck /> Trainers / Shikshaks
          </button>

          <button
            onClick={() => handleNavClick("sewa")}
            className={`menu-item ${currentView === "sewa" ? "active-saffron" : ""}`}
          >
            <Activity /> Sewa Projects
          </button>

          <button
            onClick={() => handleNavClick("bauddhik")}
            className={`menu-item ${currentView === "bauddhik" ? "active-saffron" : ""}`}
          >
            <BookOpen /> Bauddhik Tests
          </button>

          <button
            onClick={() => handleNavClick("reports")}
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
