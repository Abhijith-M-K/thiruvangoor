"use client";

import React, { useState } from "react";
import { Calendar, MapPin, Plus, Edit2, Trash2, ShieldAlert, X, Search, FileDown } from "lucide-react";
import * as XLSX from "xlsx";

interface EventItem {
  id: string;
  name: string;
  eventDate: string;
  place: string;
  informedCount: number;
  participantCount: number;
  absentCount: number;
  absentReasonCount: number;
}

interface ScheduleViewProps {
  events: EventItem[];
  onAddEvent: (payload: Omit<EventItem, "id">) => Promise<void>;
  onEditEvent: (payload: EventItem) => Promise<void>;
  onDeleteEvent: (id: string) => Promise<void>;
  setView: (view: string) => void;
}

export default function ScheduleView({
  events,
  onAddEvent,
  onEditEvent,
  onDeleteEvent,
  setView
}: ScheduleViewProps) {
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventItem | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formPlace, setFormPlace] = useState("");
  const [formInformed, setFormInformed] = useState<string>("");
  const [formParticipant, setFormParticipant] = useState<string>("");
  const [formAbsent, setFormAbsent] = useState<string>("");
  const [formAbsentReason, setFormAbsentReason] = useState<string>("");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Deletion Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  // Helper: format ISO date to readable string (e.g. 2026-10-20 -> 20 Oct 2026)
  const formatReadableDate = (dateStr: string): string => {
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

  // Filter events list
  const filteredEvents = events.filter((ev) => {
    const matchesSearch =
      ev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ev.place.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStart = !startDate || ev.eventDate >= startDate;
    const matchesEnd = !endDate || ev.eventDate <= endDate;

    return matchesSearch && matchesStart && matchesEnd;
  });

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormDate(todayStr);
    setFormPlace("");
    setFormInformed("");
    setFormParticipant("");
    setFormAbsent("");
    setFormAbsentReason("");
    setIsOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (item: EventItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDate(item.eventDate);
    setFormPlace(item.place);
    setFormInformed(item.informedCount.toString());
    setFormParticipant(item.participantCount.toString());
    setFormAbsent(item.absentCount.toString());
    setFormAbsentReason(item.absentReasonCount.toString());
    setIsOpen(true);
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formDate || !formPlace.trim()) {
      return;
    }

    if (editingItem && (formInformed === "" || formParticipant === "" || formAbsent === "" || formAbsentReason === "")) {
      return;
    }

    const payload = {
      name: formName.trim(),
      eventDate: formDate,
      place: formPlace.trim(),
      informedCount: editingItem ? Number(formInformed) : 0,
      participantCount: editingItem ? Number(formParticipant) : 0,
      absentCount: editingItem ? Number(formAbsent) : 0,
      absentReasonCount: editingItem ? Number(formAbsentReason) : 0
    };

    if (editingItem) {
      // Edit
      await onEditEvent({
        id: editingItem.id,
        ...payload
      });
    } else {
      // Add
      await onAddEvent(payload);
    }

    setIsOpen(false);
  };

  // Download excel report
  const handleDownloadExcel = () => {
    const dataToExport = filteredEvents.map((ev) => {
      const attendanceRate = ev.informedCount > 0
        ? `${((ev.participantCount / ev.informedCount) * 100).toFixed(1)}%`
        : "0%";

      return {
        "Event ID": ev.id,
        "Event Name": ev.name,
        "Date": ev.eventDate,
        "Place": ev.place,
        "Informed People": ev.informedCount,
        "Participants (Present)": ev.participantCount,
        "Absent (Unexcused)": ev.absentCount,
        "Absent (Excused)": ev.absentReasonCount,
        "Attendance Rate": attendanceRate
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Style and adjust widths
    const columnWidths = [
      { wch: 12 },
      { wch: 30 },
      { wch: 15 },
      { wch: 40 },
      { wch: 16 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 }
    ];
    worksheet["!cols"] = columnWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RSS Events Report");
    XLSX.writeFile(workbook, "RSS_Thiruvangoor_Events_Report.xlsx");
  };

  return (
    <>
      <div className="sticky-header-container">
        <div className="dashboard-header" style={{ marginBottom: "16px" }}>
          <div className="header-title">
            <h1>RSS Events & Schedule Board</h1>
            <p>Coordinate future programs and log participant turnout audits for past assemblies.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn-secondary" style={{ height: "42px" }} onClick={() => setView("dashboard")}>
              Back to Dashboard
            </button>
            <button className="btn-primary saffron" style={{ display: "flex", gap: "8px", alignItems: "center", height: "42px" }} onClick={handleOpenAdd}>
              <Plus size={16} /> Add Program / Event
            </button>
          </div>
        </div>

        {/* Filter and Control Bar */}
        <div className="control-bar" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", marginTop: "16px", marginBottom: 0 }}>
          <div className="search-input-wrapper">
            <Search />
            <input
              type="text"
              className="search-input"
              placeholder="Search by event name or place..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filters-wrapper">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>From:</span>
              <input
                type="date"
                className="select-filter"
                style={{ padding: "8px", minWidth: "130px" }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>To:</span>
              <input
                type="date"
                className="select-filter"
                style={{ padding: "8px", minWidth: "130px" }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button
              className="btn-secondary"
              style={{ display: "flex", gap: "6px", alignItems: "center", padding: "10px 14px", height: "40px" }}
              onClick={handleDownloadExcel}
              disabled={filteredEvents.length === 0}
              title="Download Excel Report"
            >
              <FileDown size={15} /> Download Report
            </button>

            <button
              className="btn-primary saffron"
              style={{ padding: "10px 14px" }}
              onClick={() => {
                setSearchQuery("");
                setStartDate("");
                setEndDate("");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 0" }}>
        <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "var(--text-primary)" }}>
          Scheduled Programs List
        </h4>

        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
            No scheduled events match your search/date filters.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}>
            {filteredEvents.map((ev) => {
              const isUpcoming = ev.eventDate >= todayStr;
              const attendancePercent = ev.informedCount > 0
                ? Math.round((ev.participantCount / ev.informedCount) * 100)
                : 0;

              return (
                <div
                  key={ev.id}
                  className="shakha-item"
                  style={{
                    cursor: "default",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    borderLeft: isUpcoming ? "4px solid var(--color-saffron)" : "4px solid var(--text-light)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span
                        className={`shakha-type-badge ${isUpcoming ? "prabhat" : "ratri"}`}
                        style={{
                          textTransform: "uppercase",
                          fontWeight: 700,
                          fontSize: "11px",
                          letterSpacing: "0.5px"
                        }}
                      >
                        {isUpcoming ? "Upcoming" : "Past Event"}
                      </span>
                      <h3 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-primary)" }}>{ev.name}</h3>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                      <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar size={14} /> {formatReadableDate(ev.eventDate)}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--text-light)", marginTop: "4px" }}>{ev.id}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "14px" }}>
                      <MapPin size={16} /> <strong>{ev.place}</strong>
                    </div>

                    <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Informed</div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>{ev.informedCount}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Attended</div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "#16a34a", marginTop: "2px" }}>
                          {ev.participantCount} <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>({attendancePercent}%)</span>
                        </div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Absent</div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-danger)", marginTop: "2px" }}>{ev.absentCount}</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: 600 }}>Excused</div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "#ca8a04", marginTop: "2px" }}>{ev.absentReasonCount}</div>
                      </div>
                    </div>

                    <div className="actions-cell" style={{ gap: "8px", margin: 0 }}>
                      <button
                        onClick={() => handleOpenEdit(ev)}
                        className="action-btn edit"
                        title="Edit Event Details"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(ev.id)}
                        className="action-btn delete"
                        title="Delete Event"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Register/Edit Event Modal Dialog */}
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>{editingItem ? "Edit Event Details" : "Register Program / Event"}</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Event Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Vijayadashami Utsav"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Event Date *</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Place / Location *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Thiruvangoor Temple Ground"
                      value={formPlace}
                      onChange={(e) => setFormPlace(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {editingItem && (
                  <>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Informed People Count *</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 150"
                          min="0"
                          value={formInformed}
                          onChange={(e) => setFormInformed(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Participant (Present) *</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 120"
                          min="0"
                          value={formParticipant}
                          onChange={(e) => setFormParticipant(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Absent (Unexcused) *</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 20"
                          min="0"
                          value={formAbsent}
                          onChange={(e) => setFormAbsent(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Absent (Excused with Reason) *</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="e.g. 10"
                          min="0"
                          value={formAbsentReason}
                          onChange={(e) => setFormAbsentReason(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </>
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
                  {editingItem ? "Save Changes" : "Register Event"}
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
              <h3 className="warning-title">Delete Scheduled Event?</h3>
              <p className="warning-text">
                Are you sure you want to permanently delete this event record? This action cannot be undone and will remove it from the dashboard.
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
                      await onDeleteEvent(deleteConfirmId);
                      setDeleteConfirmId(null);
                    }
                  }}
                >
                  Delete Event
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
