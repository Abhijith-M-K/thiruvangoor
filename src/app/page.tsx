"use client";

import React, { useState, useEffect } from "react";
import { Mail, Lock, ChevronRight, Flag, ShieldAlert, Users, X } from "lucide-react";

import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/DashboardView";
import SwayamsevaksView from "@/components/SwayamsevaksView";
import DakshinaView from "@/components/DakshinaView";
import ShakhasView from "@/components/ShakhasView";
import GenericPlaceholderView from "@/components/GenericPlaceholderView";
import MemberModal from "@/components/MemberModal";

// Swayamsevak Type Definition
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

interface Shakha {
  id: string;
  name: string;
  type: string;
  time: string;
  location: string;
  mukhyaShikshak: string;
  attendance: number;
}

export default function Page() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string>("rssthiruvangoor@gmail.com");
  const [authPassword, setAuthPassword] = useState<string>("Thiruvangoor@123");
  const [authError, setAuthError] = useState<string>("");

  // Navigation state
  const [currentView, setCurrentView] = useState<string>("dashboard");

  // Toast notifications state
  const [toasts, setToasts] = useState<{ id: string; message: string; type: "success" | "error" | "info" }[]>([]);
  // Custom Delete Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Global Om loader states
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>("Loading...");

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Intercept navigation to display premium Om transition loader
  const handleNavigate = (viewName: string) => {
    if (viewName === currentView) return;

    setActionLoading(true);
    let msg = "Loading View Details...";
    if (viewName === "dashboard") msg = "Loading RSS Portal Dashboard...";
    else if (viewName === "swayamsevaks") msg = "Synchronizing Swayamsevak Roster...";
    else if (viewName === "dakshina") msg = "Loading Guru Dakshina Ledger...";
    else if (viewName === "shakhas") msg = "Loading Shakha Assembly Sessions...";
    else if (viewName === "schedule") msg = "Loading Calendar Schedule...";
    else if (viewName === "trainers") msg = "Loading Instructors & Shikshaks...";
    else if (viewName === "projects") msg = "Loading Seva Projects...";
    else if (viewName === "tools") msg = "Loading Buddhist Tools & Assets...";
    else if (viewName === "reports") msg = "Generating Analytical Reports...";

    setActionMessage(msg);

    setTimeout(() => {
      setCurrentView(viewName);
      if (viewName === "swayamsevaks") {
        fetchSwayamsevaks();
      } else {
        setActionLoading(false);
      }
    }, 600);
  };

  // Core Data State
  const [swayamsevaks, setSwayamsevaks] = useState<Swayamsevak[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [shakhas, setShakhas] = useState<Shakha[]>([]);
  const [isDbMock, setIsDbMock] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [shakhaFilter, setShakhaFilter] = useState<string>("all");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingSwayamsevak, setEditingSwayamsevak] = useState<Swayamsevak | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    name: "",
    phone: "",
    email: "",
    shakha: "Bal Shakha",
    joiningDate: "",
    status: "active" as "active" | "inactive" | "touring",
    role: "Swayamsevak"
  });

  // Load auth state and fetch database details on mount
  useEffect(() => {
    const authStatus = localStorage.getItem("rss_admin_auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
    fetchSwayamsevaks();
    fetchContributions();
    fetchShakhas();
  }, []);

  // Fetch from Neon database API Route
  const fetchSwayamsevaks = async () => {
    try {
      setLoading(true);
      setActionLoading(true);
      setActionMessage("Synchronizing Swayamsevak Roster...");
      const res = await fetch("/api/swayamsevaks");
      const result = await res.json();
      if (result.data) {
        setSwayamsevaks(result.data);
      }
      setIsDbMock(!!result.isMock);
    } catch (error) {
      console.error("Failed to load Swayamsevaks:", error);
    } finally {
      setLoading(false);
      setActionLoading(false);
    }
  };

  // Fetch contributions list
  const fetchContributions = async () => {
    try {
      const res = await fetch("/api/contributions");
      const result = await res.json();
      if (result.data) {
        setContributions(result.data);
      }
    } catch (error) {
      console.error("Failed to load contributions:", error);
    }
  };

  // Handle Add Contribution (POST)
  const handleAddContribution = async (payload: Omit<Contribution, "id" | "contributionDate">) => {
    const newId = `CON-${Math.floor(10000 + Math.random() * 90000)}`;
    const todayStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const newContribution: Contribution = {
      id: newId,
      contributionDate: todayStr,
      ...payload
    };

    try {
      setActionLoading(true);
      setActionMessage("Recording Guru Dakshina contribution...");
      setContributions([newContribution, ...contributions]);

      const res = await fetch("/api/contributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newContribution)
      });
      const data = await res.json();
      
      if (data.error) {
        showToast(`Recording failed: ${data.error}`, "error");
      } else {
        showToast("Guru Dakshina contribution recorded successfully!", "success");
      }
      
      await fetchContributions();
    } catch (err: any) {
      showToast(`Network error: ${err.message || err}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Contribution (PUT)
  const handleEditContribution = async (payload: Contribution) => {
    try {
      setActionLoading(true);
      setActionMessage("Updating contribution record...");
      setContributions(contributions.map((c) => (c.id === payload.id ? payload : c)));

      const res = await fetch(`/api/contributions/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.error) {
        showToast(`Update failed: ${data.error}`, "error");
      } else {
        showToast("Contribution record updated successfully!", "success");
      }

      await fetchContributions();
    } catch (err: any) {
      showToast(`Network error: ${err.message || err}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Contribution (DELETE)
  const handleDeleteContribution = async (id: string) => {
    try {
      setActionLoading(true);
      setActionMessage("Deleting contribution record...");
      setContributions(contributions.filter((c) => c.id !== id));

      const res = await fetch(`/api/contributions/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      
      if (data.error) {
        showToast(`Deletion failed: ${data.error}`, "error");
      } else {
        showToast("Contribution record deleted successfully!", "success");
      }

      await fetchContributions();
    } catch (err: any) {
      showToast(`Network error: ${err.message || err}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Fetch shakhas list
  const fetchShakhas = async () => {
    try {
      const res = await fetch("/api/shakhas");
      const result = await res.json();
      if (result.data) {
        setShakhas(result.data);
      }
    } catch (error) {
      console.error("Failed to load shakhas:", error);
    }
  };

  // Handle Add Shakha (POST)
  const handleAddShakha = async (payload: Omit<Shakha, "id">) => {
    const newId = `SH-${Math.floor(100 + Math.random() * 900)}`;
    const newShakha: Shakha = {
      id: newId,
      ...payload
    };

    try {
      setActionLoading(true);
      setActionMessage("Creating Shakha Session...");
      setShakhas([...shakhas, newShakha]);

      const res = await fetch("/api/shakhas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShakha)
      });
      const data = await res.json();
      
      if (data.error) {
        showToast(`Creation failed: ${data.error}`, "error");
      } else {
        showToast("Shakha session created successfully!", "success");
      }
      
      await fetchShakhas();
    } catch (err: any) {
      showToast(`Network error: ${err.message || err}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Edit Shakha (PUT)
  const handleEditShakha = async (payload: Shakha) => {
    try {
      setActionLoading(true);
      setActionMessage("Updating Shakha Session...");
      setShakhas(shakhas.map((s) => (s.id === payload.id ? payload : s)));

      const res = await fetch(`/api/shakhas/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.error) {
        showToast(`Update failed: ${data.error}`, "error");
      } else {
        showToast("Shakha session updated successfully!", "success");
      }

      await fetchShakhas();
    } catch (err: any) {
      showToast(`Network error: ${err.message || err}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Delete Shakha (DELETE)
  const handleDeleteShakha = async (id: string) => {
    try {
      setActionLoading(true);
      setActionMessage("Deleting Shakha Session...");
      setShakhas(shakhas.filter((s) => s.id !== id));

      const res = await fetch(`/api/shakhas/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      
      if (data.error) {
        showToast(`Deletion failed: ${data.error}`, "error");
      } else {
        showToast("Shakha session deleted successfully!", "success");
      }

      await fetchShakhas();
    } catch (err: any) {
      showToast(`Network error: ${err.message || err}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authEmail === "rssthiruvangoor@gmail.com" && authPassword === "Thiruvangoor@123") {
      setIsAuthenticated(true);
      setAuthError("");
      localStorage.setItem("rss_admin_auth", "true");
      showToast("Welcome back to RSS Thiruvangoor Admin Portal!", "success");
    } else {
      setAuthError("Invalid credentials. Please use rssthiruvangoor@gmail.com / Thiruvangoor@123");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("rss_admin_auth");
    showToast("Logged out successfully.", "info");
  };

  // Handle Add Member (POST)
  const handleAddSwayamsevak = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `SW-${Math.floor(10000 + Math.random() * 90000)}`;
    const todayStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const newMember: Swayamsevak = {
      id: newId,
      ...addForm,
      joiningDate: todayStr,
      dakshina: 0
    };

    try {
      setActionLoading(true);
      setActionMessage("Registering Swayamsevak...");
      // Optimistic client-side update
      setSwayamsevaks([newMember, ...swayamsevaks]);
      setIsAddModalOpen(false);
      showToast("Registering Swayamsevak...", "info");

      const res = await fetch("/api/swayamsevaks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember)
      });
      const data = await res.json();
      
      if (data.error) {
        showToast(`Registration failed: ${data.error}`, "error");
      } else {
        showToast("Swayamsevak registered successfully!", "success");
      }
      
      // Re-fetch to ensure sync with database
      await fetchSwayamsevaks();
    } catch (err: any) {
      showToast(`Network error: ${err.message || err}`, "error");
    } finally {
      setActionLoading(false);
    }

    // Reset Form
    setAddForm({
      name: "",
      phone: "",
      email: "",
      shakha: "Bal Shakha",
      joiningDate: "",
      status: "active",
      role: "Swayamsevak"
    });
  };

  // Open Edit Modal
  const openEditModal = (member: Swayamsevak) => {
    setEditingSwayamsevak(member);
    setIsEditModalOpen(true);
  };

  // Handle Edit Member (PUT)
  const handleEditSwayamsevak = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSwayamsevak) return;

    try {
      setActionLoading(true);
      setActionMessage("Saving profile updates...");
      // Optimistic client-side update
      setSwayamsevaks(
        swayamsevaks.map((m) => (m.id === editingSwayamsevak.id ? editingSwayamsevak : m))
      );
      setIsEditModalOpen(false);
      showToast("Saving updates...", "info");

      const res = await fetch(`/api/swayamsevaks/${editingSwayamsevak.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSwayamsevak)
      });
      const data = await res.json();
      
      if (data.error) {
        showToast(`Update failed: ${data.error}`, "error");
      } else {
        showToast("Swayamsevak profile updated successfully!", "success");
      }

      await fetchSwayamsevaks();
    } catch (err: any) {
      showToast(`Network error: ${err.message || err}`, "error");
    } finally {
      setActionLoading(false);
      setEditingSwayamsevak(null);
    }
  };

  // Handle Delete Member (DELETE)
  const handleDeleteSwayamsevak = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteSwayamsevak = async () => {
    if (!deleteConfirmId) return;
    const targetId = deleteConfirmId;
    setDeleteConfirmId(null);

    try {
      setActionLoading(true);
      setActionMessage("Deleting registration record...");
      // Optimistic client-side update
      setSwayamsevaks(swayamsevaks.filter((m) => m.id !== targetId));
      showToast("Deleting Swayamsevak registration...", "info");

      const res = await fetch(`/api/swayamsevaks/${targetId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      
      if (data.error) {
        showToast(`Deletion failed: ${data.error}`, "error");
      } else {
        showToast("Swayamsevak registration deleted successfully!", "success");
      }

      await fetchSwayamsevaks();
    } catch (err: any) {
      showToast(`Network error: ${err.message || err}`, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Helper formatting for currency
  const formatINR = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);
  };

  // Render Login Gate
  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo-wrapper">
            <div className="auth-logo saffron">
              <Flag fill="currentColor" />
            </div>
          </div>
          <h2>Rashtriya Swayamsevak Sangh</h2>
          <p className="subtitle">Management Portal Login</p>

          {authError && (
            <div style={{
              backgroundColor: "var(--color-danger-light)",
              color: "var(--color-danger)",
              padding: "10px 14px",
              borderRadius: "var(--radius-sm)",
              fontSize: "12.5px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 500
            }}>
              <ShieldAlert size={16} />
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label>Email Address</label>
              <div className="auth-input-wrapper">
                <Mail className="auth-input-icon" />
                <input
                  type="email"
                  className="auth-input"
                  placeholder="rssthiruvangoor@gmail.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Access Password</label>
              <div className="auth-input-wrapper">
                <Lock className="auth-input-icon" />
                <input
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-auth saffron">
              Enter Dashboard <ChevronRight size={16} />
            </button>
          </form>

          <div className="auth-footer">
            Secure Administrative Gateway • v1.2.0
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setCurrentView={handleNavigate}
        handleLogout={handleLogout}
      />

      {/* Main Panel Content Router */}
      <main className="main-wrapper">
        {loading && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px",
            color: "var(--text-secondary)"
          }}>
            Loading Portal Details...
          </div>
        )}

        {!loading && currentView === "dashboard" && (
          <DashboardView
            swayamsevaks={swayamsevaks}
            contributions={contributions}
            shakhas={shakhas}
            onRegisterClick={() => {
              handleNavigate("swayamsevaks");
              setIsAddModalOpen(true);
            }}
            formatINR={formatINR}
            isMock={isDbMock}
            setView={handleNavigate}
          />
        )}

        {!loading && currentView === "swayamsevaks" && (
          <SwayamsevaksView
            swayamsevaks={swayamsevaks}
            onAddClick={() => setIsAddModalOpen(true)}
            onEditClick={openEditModal}
            onDeleteClick={handleDeleteSwayamsevak}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            shakhaFilter={shakhaFilter}
            setShakhaFilter={setShakhaFilter}
            showToast={showToast}
            triggerLoader={(show, msg) => {
              setActionLoading(show);
              setActionMessage(msg);
            }}
          />
        )}

        {!loading && currentView === "dakshina" && (
          <DakshinaView
            swayamsevaks={swayamsevaks}
            contributions={contributions}
            onAddContribution={handleAddContribution}
            onEditContribution={handleEditContribution}
            onDeleteContribution={handleDeleteContribution}
            formatINR={formatINR}
            setView={handleNavigate}
            triggerLoader={(show, msg) => {
              setActionLoading(show);
              setActionMessage(msg);
            }}
          />
        )}

        {!loading && currentView === "shakhas" && (
          <ShakhasView
            shakhas={shakhas}
            onAddShakha={handleAddShakha}
            onEditShakha={handleEditShakha}
            onDeleteShakha={handleDeleteShakha}
            setView={handleNavigate}
          />
        )}

        {!loading && !["dashboard", "swayamsevaks", "dakshina", "shakhas"].includes(currentView) && (
          <GenericPlaceholderView
            viewName={currentView}
            setView={handleNavigate}
          />
        )}
      </main>

      {/* Form Dialog Modals */}
      <MemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSwayamsevak}
        title="Register New Swayamsevak"
        formData={addForm}
        setFormData={setAddForm}
        submitLabel="Register Swayamsevak"
      />

      {isEditModalOpen && editingSwayamsevak && (
        <MemberModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingSwayamsevak(null);
          }}
          onSubmit={handleEditSwayamsevak}
          title={`Edit Swayamsevak - ${editingSwayamsevak.id}`}
          formData={editingSwayamsevak}
          setFormData={setEditingSwayamsevak}
          submitLabel="Save Changes"
        />
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal-overlay">
          <div className="modal-content warning">
            <div className="modal-body warning-body" style={{ padding: "32px 24px" }}>
              <div className="warning-icon-container">
                <ShieldAlert size={28} />
              </div>
              <h3 className="warning-title">Delete Swayamsevak</h3>
              <p className="warning-text">
                Are you sure you want to permanently delete this Swayamsevak registration? This action cannot be undone.
              </p>
              <div className="warning-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary saffron"
                  style={{ boxShadow: "none" }}
                  onClick={confirmDeleteSwayamsevak}
                >
                  Delete Registration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications Panel */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-item ${t.type}`}>
            <div className="toast-icon">
              {t.type === "success" && <Flag size={16} fill="currentColor" />}
              {t.type === "error" && <ShieldAlert size={16} />}
              {t.type === "info" && <Users size={16} />}
            </div>
            <div className="toast-message">{t.message}</div>
            <button
              className="toast-close"
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Global Om Loader Overlay */}
      {actionLoading && (
        <div className="om-loader-overlay">
          <div className="om-loader-container">
            <div className="om-loader-spinner-wrapper">
              <div className="om-loader-spinner-ring"></div>
              <div className="om-symbol-pulsing">ॐ</div>
            </div>
            <div className="om-loader-text">Rashtriya Swayamsevak Sangh</div>
          </div>
        </div>
      )}
    </div>
  );
}
