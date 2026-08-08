"use client";

import React from "react";
import { Search, Download, Plus, Edit2, Trash2, Upload } from "lucide-react";
import * as XLSX from "xlsx";

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

interface SwayamsevaksViewProps {
  swayamsevaks: Swayamsevak[];
  onAddClick: () => void;
  onImportClick: () => void;
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
  onImportClick,
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

  const exportToExcel = () => {
    if (triggerLoader) {
      triggerLoader(true, "Generating Excel Spreadsheet...");
    }

    setTimeout(() => {
      try {
        const dataToExport = filtered.map((m) => ({
          "ID": m.id,
          "Full Name": m.name,
          "Age": m.age || "N/A",
          "Phone": m.phone,
          "Email": m.email || "N/A",
          "Shakha Unit": m.shakha,
          "Role": m.role,
          "Status": m.status.toUpperCase(),
          "Joining Date": m.joiningDate
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        const columnWidths = [
          { wch: 12 },
          { wch: 25 },
          { wch: 8 },
          { wch: 15 },
          { wch: 25 },
          { wch: 20 },
          { wch: 18 },
          { wch: 12 },
          { wch: 15 }
        ];
        worksheet["!cols"] = columnWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Swayamsevaks");
        XLSX.writeFile(workbook, `RSS_Thiruvangoor_Swayamsevaks_${new Date().toISOString().slice(0, 10)}.xlsx`);

        showToast("Excel spreadsheet exported successfully!", "success");
      } catch (error: any) {
        console.error("Excel Export error:", error);
        showToast(`Failed to export Excel: ${error.message || error}`, "error");
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
              onClick={exportToExcel}
            >
              <Download size={16} /> Export Excel
            </button>
            <button
              className="btn-secondary"
              onClick={onImportClick}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Upload size={16} /> Import Excel
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
                            ID: {member.id}{member.phone ? ` • ${member.phone}` : ""}{member.age !== undefined && member.age !== null ? ` • Age: ${member.age}` : ""}
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
