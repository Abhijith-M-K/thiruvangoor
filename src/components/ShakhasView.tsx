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

interface ShakhaAttendanceLog {
  id: string;
  shakhaId: string;
  logDate: string;
  presentCount: number;
  absentCount: number;
  absentReasonCount: number;
  remarks: string;
  shakhaName: string;
}

interface ShakhasViewProps {
  shakhas: Shakha[];
  onAddShakha: (payload: Omit<Shakha, "id">) => Promise<void>;
  onEditShakha: (payload: Shakha) => Promise<void>;
  onDeleteShakha: (id: string) => Promise<void>;
  setView: (view: string) => void;
  attendanceLogs: ShakhaAttendanceLog[];
  onAddAttendanceLog: (payload: Omit<ShakhaAttendanceLog, "id" | "shakhaName">) => Promise<void>;
  onDeleteAttendanceLog: (id: string) => Promise<void>;
}

export default function ShakhasView({
  shakhas,
  onAddShakha,
  onEditShakha,
  onDeleteShakha,
  setView,
  attendanceLogs,
  onAddAttendanceLog,
  onDeleteAttendanceLog
}: ShakhasViewProps) {
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState<"sessions" | "attendance">("sessions");

  // Shakha Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Shakha | null>(null);

  // Shakha Form states
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("prabhat");
  const [formTime, setFormTime] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formMukhyaShikshak, setFormMukhyaShikshak] = useState("");
  const [formAttendance, setFormAttendance] = useState<string>("");

  // Attendance Modal States
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [logShakhaId, setLogShakhaId] = useState("");
  const [logDate, setLogDate] = useState("");
  const [logPresent, setLogPresent] = useState<string>("");
  const [logAbsent, setLogAbsent] = useState<string>("");
  const [logAbsentReason, setLogAbsentReason] = useState<string>("");
  const [logRemarks, setLogRemarks] = useState("");

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterLogShakha, setFilterLogShakha] = useState("all");
  const [logStartDate, setLogStartDate] = useState("");
  const [logEndDate, setLogEndDate] = useState("");

  // Deletion Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLogConfirmId, setDeleteLogConfirmId] = useState<string | null>(null);

  // Helper date formatter: YYYY-MM-DD -> DD MMM YYYY
  const formatDateString = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parts[2];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthName = months[monthIndex];
    if (!monthName) return dateStr;
    return `${day} ${monthName} ${year}`;
  };

  // Filter shakhas list
  const filteredShakhas = shakhas.filter((shakha) => {
    const matchesSearch =
      shakha.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shakha.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shakha.mukhyaShikshak.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === "all" || shakha.type === filterType;

    return matchesSearch && matchesType;
  });

  // Helper: parse DD MMM YYYY to ISO YYYY-MM-DD for date inputs comparison
  const parseLogDateToISO = (dateStr: string): string => {
    if (!dateStr) return "";
    const parts = dateStr.trim().split(/\s+/);
    if (parts.length !== 3) return dateStr;
    const day = parts[0].padStart(2, "0");
    const monthStr = parts[1];
    const year = parts[2];

    const months: { [key: string]: string } = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
      Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
    };
    const month = months[monthStr];
    if (!month) return dateStr;

    return `${year}-${month}-${day}`;
  };

  // Filter attendance logs list
  const filteredLogs = attendanceLogs.filter((log) => {
    const matchesShakha = filterLogShakha === "all" || log.shakhaId === filterLogShakha;
    
    const logIso = parseLogDateToISO(log.logDate);
    const matchesStart = !logStartDate || logIso >= logStartDate;
    const matchesEnd = !logEndDate || logIso <= logEndDate;

    return matchesShakha && matchesStart && matchesEnd;
  });

  // Open modal for add shakha
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

  // Open modal for edit shakha
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

  // Open modal for attendance log
  const handleOpenAttendanceAdd = () => {
    if (shakhas.length > 0) {
      setLogShakhaId(shakhas[0].id);
    } else {
      setLogShakhaId("");
    }
    const today = new Date().toISOString().split("T")[0];
    setLogDate(today);
    setLogPresent("");
    setLogAbsent("");
    setLogAbsentReason("");
    setLogRemarks("");
    setIsAttendanceOpen(true);
  };

  // Form submit handler for Shakha Session
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formName.trim() ||
      !formTime.trim() ||
      !formLocation.trim() ||
      !formMukhyaShikshak.trim()
    )
      return;

    const attendanceNum = editingItem ? (Number(formAttendance) || 0) : 0;

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
        attendance: 0
      });
    }

    setIsOpen(false);
  };

  // Form submit handler for Attendance Log
  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logShakhaId || !logDate || logPresent === "" || logAbsent === "" || logAbsentReason === "") {
      return;
    }

    const formattedDate = formatDateString(logDate);

    await onAddAttendanceLog({
      shakhaId: logShakhaId,
      logDate: formattedDate,
      presentCount: Number(logPresent),
      absentCount: Number(logAbsent),
      absentReasonCount: Number(logAbsentReason),
      remarks: logRemarks.trim()
    });

    setIsAttendanceOpen(false);
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
            {activeTab === "sessions" ? (
              <button className="btn-primary saffron" style={{ display: "flex", gap: "8px", alignItems: "center", height: "42px" }} onClick={handleOpenAdd}>
                <Plus size={16} /> Create Shakha Session
              </button>
            ) : (
              <button className="btn-primary saffron" style={{ display: "flex", gap: "8px", alignItems: "center", height: "42px" }} onClick={handleOpenAttendanceAdd}>
                <Plus size={16} /> Record Daily Attendance
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector */}
        <div style={{
          display: "flex",
          borderBottom: "1px solid var(--border-color)",
          marginBottom: "16px",
          gap: "24px"
        }}>
          <button
            onClick={() => setActiveTab("sessions")}
            style={{
              padding: "12px 4px",
              fontSize: "14px",
              fontWeight: 600,
              color: activeTab === "sessions" ? "var(--color-saffron)" : "var(--text-secondary)",
              borderBottom: activeTab === "sessions" ? "2px solid var(--color-saffron)" : "2px solid transparent",
              background: "none",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Active Assemblies
          </button>
          <button
            onClick={() => setActiveTab("attendance")}
            style={{
              padding: "12px 4px",
              fontSize: "14px",
              fontWeight: 600,
              color: activeTab === "attendance" ? "var(--color-saffron)" : "var(--text-secondary)",
              borderBottom: activeTab === "attendance" ? "2px solid var(--color-saffron)" : "2px solid transparent",
              background: "none",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Daily Attendance Log
          </button>
        </div>
      </div>

      {activeTab === "sessions" ? (
        <>
          {/* Filter bar for Assemblies */}
          <div className="control-bar" style={{ marginBottom: 0 }}>
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
        </>
      ) : (
        <>
          {/* Filter Bar for Attendance Logs */}
          <div className="control-bar" style={{ marginBottom: 0 }}>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>Filter by Shakha:</span>
                <select
                  className="select-filter"
                  value={filterLogShakha}
                  onChange={(e) => setFilterLogShakha(e.target.value)}
                  style={{ minWidth: "160px" }}
                >
                  <option value="all">All Shakha Units</option>
                  {shakhas.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>From:</span>
                <input
                  type="date"
                  className="select-filter"
                  style={{ padding: "8px", minWidth: "130px" }}
                  value={logStartDate}
                  onChange={(e) => setLogStartDate(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>To:</span>
                <input
                  type="date"
                  className="select-filter"
                  style={{ padding: "8px", minWidth: "130px" }}
                  value={logEndDate}
                  onChange={(e) => setLogEndDate(e.target.value)}
                />
              </div>

              <button
                className="btn-primary saffron"
                style={{ padding: "10px 14px" }}
                onClick={() => {
                  setFilterLogShakha("all");
                  setLogStartDate("");
                  setLogEndDate("");
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <div className="table-panel" style={{ marginTop: "24px" }}>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Shakha Unit</th>
                    <th style={{ textAlign: "center" }}>Present</th>
                    <th style={{ textAlign: "center" }}>Absent</th>
                    <th style={{ textAlign: "center" }}>Absent with Reason</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 600 }}>{log.logDate}</td>
                        <td>
                          <span className="shakha-count-badge" style={{ margin: 0 }}>
                            {log.shakhaName}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{
                            display: "inline-flex",
                            padding: "2px 10px",
                            backgroundColor: "rgba(22, 163, 74, 0.1)",
                            color: "#16a34a",
                            borderRadius: "12px",
                            fontWeight: 600,
                            fontSize: "12.5px"
                          }}>
                            {log.presentCount}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{
                            display: "inline-flex",
                            padding: "2px 10px",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "var(--color-danger)",
                            borderRadius: "12px",
                            fontWeight: 600,
                            fontSize: "12.5px"
                          }}>
                            {log.absentCount}
                          </span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span style={{
                            display: "inline-flex",
                            padding: "2px 10px",
                            backgroundColor: "rgba(234, 179, 8, 0.1)",
                            color: "#ca8a04",
                            borderRadius: "12px",
                            fontWeight: 600,
                            fontSize: "12.5px"
                          }}>
                            {log.absentReasonCount}
                          </span>
                        </td>
                        <td style={{ maxWidth: "250px", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          {log.remarks || "-"}
                        </td>
                        <td>
                          <button
                            onClick={() => setDeleteLogConfirmId(log.id)}
                            className="action-btn delete"
                            title="Delete Attendance Log"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
                        No daily attendance records logged. Click "Record Daily Attendance" to add.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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

                {editingItem && (
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
                )}
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

      {/* Record Daily Attendance Modal Dialog */}
      {isAttendanceOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>Record Daily Shakha Attendance</h3>
              <button className="modal-close" onClick={() => setIsAttendanceOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAttendanceSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Shakha Unit *</label>
                  <select
                    className="form-control"
                    value={logShakhaId}
                    onChange={(e) => setLogShakhaId(e.target.value)}
                    required
                  >
                    {shakhas.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.location})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Present (Counts) *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 22"
                      value={logPresent}
                      onChange={(e) => setLogPresent(e.target.value)}
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Absent (Counts) *</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 2"
                      value={logAbsent}
                      onChange={(e) => setLogAbsent(e.target.value)}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Excuse / Absent with Reason (Counts) *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 1"
                    value={logAbsentReason}
                    onChange={(e) => setLogAbsentReason(e.target.value)}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Remarks / Activity Description</label>
                  <textarea
                    className="form-control"
                    placeholder="e.g. Activity description or reason for low turnout..."
                    value={logRemarks}
                    onChange={(e) => setLogRemarks(e.target.value)}
                    rows={3}
                    style={{ resize: "none" }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsAttendanceOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary saffron">
                  Save Attendance Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Shakha Session Confirmation Modal */}
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

      {/* Delete Daily Attendance Log Confirmation Modal */}
      {deleteLogConfirmId && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div className="modal-body warning-body" style={{ padding: "32px 24px" }}>
              <div className="warning-icon-container">
                <ShieldAlert size={36} />
              </div>
              <h3 className="warning-title">Delete Attendance Record?</h3>
              <p className="warning-text">
                Are you sure you want to permanently delete this daily attendance log record? This action cannot be undone.
              </p>
              <div className="warning-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setDeleteLogConfirmId(null)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary saffron"
                  style={{ boxShadow: "none" }}
                  onClick={async () => {
                    if (deleteLogConfirmId) {
                      await onDeleteAttendanceLog(deleteLogConfirmId);
                      setDeleteLogConfirmId(null);
                    }
                  }}
                >
                  Delete Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
