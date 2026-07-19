"use client";

import React, { useState } from "react";
import { Flag, Clock, MapPin, Plus, Edit2, Trash2, ShieldAlert, X, Search, ChevronRight } from "lucide-react";

interface Shakha {
  id: string;
  name: string;
  type: string;
  time: string;
  location: string;
  mukhyaShikshak: string;
  attendance: number;
}

interface ShakhasViewProps {
  shakhas: Shakha[];
  onAddShakha: (payload: Omit<Shakha, "id">) => Promise<void>;
  onEditShakha: (payload: Shakha) => Promise<void>;
  onDeleteShakha: (id: string) => Promise<void>;
  setView: (view: string) => void;
}

export default function ShakhasView({
  shakhas,
  onAddShakha,
  onEditShakha,
  onDeleteShakha,
  setView
}: ShakhasViewProps) {
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Shakha | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("prabhat");
  const [formTime, setFormTime] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formMukhyaShikshak, setFormMukhyaShikshak] = useState("");
  const [formAttendance, setFormAttendance] = useState<string>("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Deletion Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter shakhas list
  const filteredShakhas = shakhas.filter((shakha) => {
    const matchesSearch =
      shakha.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shakha.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shakha.mukhyaShikshak.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || shakha.type === filterType;

    return matchesSearch && matchesType;
  });

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormType("prabhat");
    setFormTime("");
    setFormLocation("");
    setFormMukhyaShikshak("");
    setFormAttendance("");
    setIsOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (item: Shakha) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormType(item.type);
    setFormTime(item.time);
    setFormLocation(item.location);
    setFormMukhyaShikshak(item.mukhyaShikshak);
    setFormAttendance(item.attendance.toString());
    setIsOpen(true);
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formName.trim() ||
      !formTime.trim() ||
      !formLocation.trim() ||
      !formMukhyaShikshak.trim() ||
      !formAttendance
    )
      return;

    const attendanceNum = Number(formAttendance);

    if (editingItem) {
      // Edit
      await onEditShakha({
        id: editingItem.id,
        name: formName.trim(),
        type: formType,
        time: formTime.trim(),
        location: formLocation.trim(),
        mukhyaShikshak: formMukhyaShikshak.trim(),
        attendance: attendanceNum
      });
    } else {
      // Add
      await onAddShakha({
        name: formName.trim(),
        type: formType,
        time: formTime.trim(),
        location: formLocation.trim(),
        mukhyaShikshak: formMukhyaShikshak.trim(),
        attendance: attendanceNum
      });
    }

    setIsOpen(false);
  };

  return (
    <>
      <div className="sticky-header-container">
        <div className="dashboard-header" style={{ marginBottom: "16px" }}>
          <div className="header-title">
            <h1>Shakha Assembly Sessions</h1>
            <p>Manage all running Shakha assemblies, locations, instructors, and active attendance.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn-secondary" style={{ height: "42px" }} onClick={() => setView("dashboard")}>
              Back to Dashboard
            </button>
            <button className="btn-primary saffron" style={{ display: "flex", gap: "8px", alignItems: "center", height: "42px" }} onClick={handleOpenAdd}>
              <Plus size={16} /> Create Shakha Session
            </button>
          </div>
        </div>

        {/* Filter bar - matching other views */}
        <div className="control-bar" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", marginTop: "16px", marginBottom: 0 }}>
          <div className="search-input-wrapper">
            <Search />
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, location, or Mukhya Shikshak..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filters-wrapper">
            <select
              className="select-filter"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Assembly Types</option>
              <option value="prabhat">Prabhat (Morning)</option>
              <option value="sayam">Sayam (Evening)</option>
              <option value="ratri">Ratri (Night)</option>
            </select>

            <button
              className="btn-primary saffron"
              style={{ padding: "10px 14px" }}
              onClick={() => {
                setSearchQuery("");
                setFilterType("all");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 0" }}>
        <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)" }}>
          Active Shakha Units List
        </h4>

        {filteredShakhas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
            No Shakha sessions match your search filters.
          </div>
        ) : (
          <div className="shakha-list">
            {filteredShakhas.map((shakha) => (
              <div key={shakha.id} className="shakha-item" style={{ cursor: "default" }}>
                <div className="shakha-item-left">
                  <span className={`shakha-type-badge ${shakha.type}`}>
                    {shakha.type}
                  </span>
                  <div className="shakha-item-info">
                    <h4 style={{ fontSize: "16px", fontWeight: "700" }}>{shakha.name}</h4>
                    <p style={{ marginTop: "4px" }}>
                      <MapPin /> {shakha.location}
                    </p>
                    <p style={{ marginTop: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
                      Mukhya Shikshak: <strong>{shakha.mukhyaShikshak}</strong> • Active Attendance: <strong>{shakha.attendance} Swayamsevaks</strong>
                    </p>
                  </div>
                </div>
                <div className="shakha-item-right" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span className="shakha-time" style={{ fontSize: "14px" }}>{shakha.time}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-light)", marginTop: "4px" }}>{shakha.id}</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="actions-cell" style={{ marginTop: "12px", gap: "8px" }}>
                    <button
                      onClick={() => handleOpenEdit(shakha)}
                      className="action-btn edit"
                      title="Edit Shakha Session"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(shakha.id)}
                      className="action-btn delete"
                      title="Delete Shakha Session"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record/Edit Shakha Modal Dialog */}
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? "Edit Shakha Session" : "Create Shakha Session"}</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Shakha Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Bal Shakha"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assembly Type *</label>
                  <select
                    className="form-control"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    required
                  >
                    <option value="prabhat">Prabhat (Morning)</option>
                    <option value="sayam">Sayam (Evening)</option>
                    <option value="ratri">Ratri (Night)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Session Timings *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 06:00 AM - 07:00 AM"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Location/Ground *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Thiruvangoor Temple Ground"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mukhya Shikshak (Instructor) *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. MIDHUN TP"
                    value={formMukhyaShikshak}
                    onChange={(e) => setFormMukhyaShikshak(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Active Attendance Count *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 24"
                    min="0"
                    value={formAttendance}
                    onChange={(e) => setFormAttendance(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary saffron">
                  {editingItem ? "Save Changes" : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal Popup */}
      {deleteConfirmId && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div className="modal-body warning-body" style={{ padding: "32px 24px" }}>
              <div className="warning-icon-container">
                <ShieldAlert size={36} />
              </div>
              <h3 className="warning-title">Delete Shakha Session?</h3>
              <p className="warning-text">
                Are you sure you want to permanently delete this Shakha assembly session? This action cannot be undone.
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
                  onClick={async () => {
                    if (deleteConfirmId) {
                      await onDeleteShakha(deleteConfirmId);
                      setDeleteConfirmId(null);
                    }
                  }}
                >
                  Delete Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
