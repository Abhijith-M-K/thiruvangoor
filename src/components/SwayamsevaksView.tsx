"use client";

import React from "react";
import { Search, Download, Plus, Edit2, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface SwayamsevaksViewProps {
  swayamsevaks: Swayamsevak[];
  onAddClick: () => void;
  onEditClick: (member: Swayamsevak) => void;
  onDeleteClick: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  shakhaFilter: string;
  setShakhaFilter: (shakha: string) => void;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  triggerLoader?: (show: boolean, message: string) => void;
}

export default function SwayamsevaksView({
  swayamsevaks,
  onAddClick,
  onEditClick,
  onDeleteClick,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  shakhaFilter,
  setShakhaFilter,
  showToast,
  triggerLoader
}: SwayamsevaksViewProps) {
  // Apply filtering
  const filtered = swayamsevaks.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery);

    const matchesStatus = statusFilter === "all" || member.status === statusFilter;
    const matchesShakha = shakhaFilter === "all" || member.shakha === shakhaFilter;

    return matchesSearch && matchesStatus && matchesShakha;
  });

  const exportToPDF = () => {
    if (triggerLoader) {
      triggerLoader(true, "Generating PDF Document...");
    }

    setTimeout(() => {
      try {
        const doc = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: "a4"
        });

        // 1. Title / Header
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(242, 109, 33); // Saffron brand color
        doc.text("Rashtriya Swayamsevak Sangh, Thiruvangoor", 14, 18);

        // Subtitle
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139); // Gray slate
        doc.text("Swayamsevaks List", 14, 25);

        // Metainfo
        const dateStr = new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated: ${dateStr}  |  Total Members: ${filtered.length}`, 14, 32);

        // Divider line
        doc.setDrawColor(242, 109, 33);
        doc.setLineWidth(0.5);
        doc.line(14, 35, 283, 35); // Landscape width A4 is 297mm (margins 14mm)

        // 2. Data rows prep
        const headers = [["ID", "Full Name", "Phone", "Email", "Shakha Unit", "Joining Date", "Role", "Status"]];
        const body = filtered.map((m) => [
          m.id,
          m.name,
          m.phone,
          m.email || "N/A",
          m.shakha,
          m.joiningDate,
          m.role,
          m.status.toUpperCase()
        ]);

        // 3. AutoTable rendering
        autoTable(doc, {
          startY: 40,
          head: headers,
          body: body,
          theme: "striped",
          headStyles: {
            fillColor: [242, 109, 33], // Saffron header
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: "bold"
          },
          bodyStyles: {
            fontSize: 9,
            textColor: [33, 43, 54]
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252] // Light slate
          },
          columnStyles: {
            0: { cellWidth: 24 }, // ID
            1: { cellWidth: 45 }, // Name
            2: { cellWidth: 28 }, // Phone
            3: { cellWidth: 50 }, // Email
            4: { cellWidth: 38 }, // Shakha
            5: { cellWidth: 28 }, // Date
            6: { cellWidth: 30 }, // Role
            7: { cellWidth: 26 }  // Status
          },
          margin: { left: 14, right: 14 }
        });

        // 4. Save file
        doc.save(`RSS_Thiruvangoor_Swayamsevaks_${new Date().toISOString().slice(0, 10)}.pdf`);
        showToast("PDF report exported successfully!", "success");
      } catch (error: any) {
        console.error("PDF Export error:", error);
        showToast(`Failed to export PDF: ${error.message || error}`, "error");
      } finally {
        if (triggerLoader) {
          triggerLoader(false, "");
        }
      }
    }, 100);
  };

  return (
    <>
      <div className="sticky-header-container">
        <div className="dashboard-header" style={{ marginBottom: "16px" }}>
          <div className="header-title">
            <h1>Swayamsevaks List</h1>
            <p>Manage all registered members, their training status, and details.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              className="btn-secondary"
              onClick={exportToPDF}
            >
              <Download size={16} /> Export PDF
            </button>
            <button className="btn-primary saffron" onClick={onAddClick}>
              <Plus size={16} /> Add Swayamsevak
            </button>
          </div>
        </div>

        {/* Filter control bar */}
        <div className="control-bar" style={{ marginBottom: 0 }}>
          <div className="search-input-wrapper">
            <Search />
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, ID, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filters-wrapper">
            <select
              className="select-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="touring">Pravas / Touring</option>
            </select>

            <select
              className="select-filter"
              value={shakhaFilter}
              onChange={(e) => setShakhaFilter(e.target.value)}
            >
              <option value="all">All Shakhas</option>
              <option value="Bal Shakha">Bal Shakha</option>
              <option value="Tarun Shakha">Tarun Shakha</option>
              <option value="Pravaudh Shakha">Pravaudh Shakha</option>
            </select>

            <button
              className="btn-primary saffron"
              style={{ padding: "10px 14px" }}
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setShakhaFilter("all");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="table-panel" style={{ marginTop: "24px" }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Swayamsevak</th>
                <th>Shakha</th>
                <th>Joining Date</th>
                <th>Status</th>
                <th>Responsibility</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((member) => (
                  <tr key={member.id}>
                    <td>
                      <div className="member-cell">
                        <div className="member-avatar rss-accent">
                          {member.name.charAt(0)}
                        </div>
                        <div className="member-meta">
                          <h4 className="rss-link" onClick={() => onEditClick(member)}>
                            {member.name}
                          </h4>
                          <p>
                            ID: {member.id} • {member.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{member.shakha}</span>
                    </td>
                    <td>{member.joiningDate}</td>
                    <td>
                      <span className={`status-badge ${member.status}`}>
                        {member.status === "touring" ? "Pravas" : member.status}
                      </span>
                    </td>
                    <td>
                      <span className="shakha-count-badge">0</span>
                      {member.role}
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="action-btn edit"
                          title="Edit Swayamsevak"
                          onClick={() => onEditClick(member)}
                        >
                          <Edit2 />
                        </button>
                        <button
                          className="action-btn delete"
                          title="Delete Swayamsevak"
                          onClick={() => onDeleteClick(member.id)}
                        >
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>
                    <div style={{ color: "var(--text-secondary)" }}>
                      No Swayamsevaks found matching the filters.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
