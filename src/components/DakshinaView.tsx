"use client";

import React, { useState, useRef, useEffect } from "react";
import { CreditCard, Users, Plus, Edit2, Trash2, ShieldAlert, X, Search, Download, Upload } from "lucide-react";
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

interface Contribution {
  id: string;
  swayamsevakId: string | null;
  name: string;
  shakha: string;
  contributionDate: string;
  amount: number;
}

interface DakshinaViewProps {
  swayamsevaks: Swayamsevak[];
  contributions: Contribution[];
  onAddContribution: (payload: Omit<Contribution, "id" | "contributionDate">) => Promise<void>;
  onEditContribution: (payload: Contribution) => Promise<void>;
  onDeleteContribution: (id: string) => Promise<void>;
  onImportClick: () => void;
  formatINR: (value: number) => string;
  setView: (view: string) => void;
  triggerLoader?: (show: boolean, msg: string) => void;
}

export default function DakshinaView({
  swayamsevaks,
  contributions,
  onAddContribution,
  onEditContribution,
  onDeleteContribution,
  onImportClick,
  formatINR,
  setView,
  triggerLoader
}: DakshinaViewProps) {
  // Modal states
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Contribution | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formShakha, setFormShakha] = useState("Bal Shakha");
  const [formAmount, setFormAmount] = useState<string>("");
  const [selectedSwayamsevakId, setSelectedSwayamsevakId] = useState<string | null>(null);

  // Filters State
  const [searchName, setSearchName] = useState("");
  const [filterYear, setFilterYear] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  // Auto-suggest dropdown states
  const [suggestions, setSuggestions] = useState<Swayamsevak[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Deletion Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Format YYYY-MM-DD input value to DD MMM YYYY match pattern
  const formatFilterDate = (dateStr: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }); // returns e.g. "07 May 2026"
  };

  // Filter contributions
  const filteredContributions = contributions.filter((c) => {
    // 1. Search by name
    const matchesName = c.name.toLowerCase().includes(searchName.toLowerCase());

    // 2. Filter by year
    const year = c.contributionDate.split(" ").pop();
    const matchesYear = filterYear === "all" || year === filterYear;

    // 3. Filter by exact date selection
    const formattedFilter = formatFilterDate(filterDate);
    const matchesDate = !filterDate || c.contributionDate === formattedFilter;

    return matchesName && matchesYear && matchesDate;
  });

  // Calculate metrics based on FILTERED entries
  const totalGuruDakshinaCollected = filteredContributions.reduce((sum, c) => sum + c.amount, 0);
  const activeContributorsCount = new Set(filteredContributions.map(c => c.name)).size;

  // Open modal for add
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormShakha("Bal Shakha");
    setFormAmount("");
    setSelectedSwayamsevakId(null);
    setSuggestions([]);
    setIsOpen(true);
  };

  // Open modal for edit
  const handleOpenEdit = (item: Contribution) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormShakha(item.shakha);
    setFormAmount(item.amount.toString());
    setSelectedSwayamsevakId(item.swayamsevakId);
    setSuggestions([]);
    setIsOpen(true);
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formAmount || Number(formAmount) <= 0) return;

    const amountNum = Number(formAmount);

    if (editingItem) {
      await onEditContribution({
        id: editingItem.id,
        swayamsevakId: selectedSwayamsevakId,
        name: formName.trim().toUpperCase(),
        shakha: formShakha,
        contributionDate: editingItem.contributionDate,
        amount: amountNum
      });
    } else {
      await onAddContribution({
        swayamsevakId: selectedSwayamsevakId,
        name: formName.trim().toUpperCase(),
        shakha: formShakha,
        amount: amountNum
      });
    }

    setIsOpen(false);
  };

  // Export Excel Ledger Function
  const exportLedgerToExcel = () => {
    if (triggerLoader) {
      triggerLoader(true, "Generating Excel Spreadsheet...");
    }

    setTimeout(() => {
      try {
        const dataToExport = filteredContributions.map((c) => ({
          "Swayamsevak Name": c.name,
          "Shakha Unit": c.shakha,
          "Contribution Date": c.contributionDate,
          "Amount (INR)": c.amount
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        const columnWidths = [
          { wch: 30 },
          { wch: 20 },
          { wch: 20 },
          { wch: 18 }
        ];
        worksheet["!cols"] = columnWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Guru Dakshina");
        XLSX.writeFile(workbook, `RSS_Thiruvangoor_Guru_Dakshina_${new Date().toISOString().slice(0, 10)}.xlsx`);
      } catch (error: any) {
        console.error("Excel Export error:", error);
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
            <h1>Guru Dakshina Ledger</h1>
            <p>Track and manage voluntary contributions from members of the Thiruvangoor unit.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn-secondary" style={{ display: "flex", gap: "8px", alignItems: "center", height: "42px" }} onClick={exportLedgerToExcel}>
              <Download size={16} /> Export Excel
            </button>
            <button className="btn-secondary" style={{ display: "flex", gap: "8px", alignItems: "center", height: "42px" }} onClick={onImportClick}>
              <Upload size={16} /> Import Excel
            </button>
            <button className="btn-primary saffron" style={{ display: "flex", gap: "8px", alignItems: "center", height: "42px" }} onClick={handleOpenAdd}>
              <Plus size={16} /> Record Contribution
            </button>
          </div>
        </div>

        {/* metrics grid - Target Completion removed */}
        <div className="metrics-grid" style={{ marginBottom: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <div className="metric-card active-saffron">
            <div className="metric-content">
              <span className="metric-label">Total Collection</span>
              <span className="metric-value">{formatINR(totalGuruDakshinaCollected)}</span>
              <span className="metric-subtext">Filtered contribution total</span>
            </div>
            <div className="metric-icon yellow">
              <CreditCard />
            </div>
          </div>

          <div className="metric-card active-saffron">
            <div className="metric-content">
              <span className="metric-label">Unique Contributors</span>
              <span className="metric-value">{activeContributorsCount}</span>
              <span className="metric-subtext">Registered and manual entries</span>
            </div>
            <div className="metric-icon saffron">
              <Users />
            </div>
          </div>
        </div>

        {/* Filter Toolbar Section - aligned and using standard classes */}
        <div className="control-bar" style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", marginTop: "16px", marginBottom: 0 }}>
          <div className="search-input-wrapper">
            <Search />
            <input
              type="text"
              className="search-input"
              placeholder="Search by Swayamsevak name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>

          <div className="filters-wrapper">
            <select
              className="select-filter"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="all">All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)" }}>Date:</span>
              <input
                type="date"
                className="select-filter"
                style={{ padding: "8px 12px", width: "150px" }}
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>

            <button
              className="btn-primary saffron"
              style={{ padding: "10px 14px" }}
              onClick={() => {
                setSearchName("");
                setFilterYear("all");
                setFilterDate("");
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <h4 style={{ fontSize: "16px", fontWeight: "700", marginTop: "24px", marginBottom: "12px", color: "var(--text-primary)" }}>
        Recent Contributions List
      </h4>
      <div className="table-panel">
        
        {filteredContributions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
            No contributions match the selected filters.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Swayamsevak</th>
                  <th>Shakha Unit</th>
                  <th>Contribution Date</th>
                  <th>Amount</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContributions.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 600, color: "var(--color-saffron)" }}>
                          {c.name}
                        </span>
                        {c.swayamsevakId ? (
                          <span style={{ fontSize: "10px", color: "var(--color-success)", fontWeight: 500 }}>
                            Registered Swayamsevak
                          </span>
                        ) : (
                          <span style={{ fontSize: "10px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                            Manual Entry
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{c.shakha}</td>
                    <td>{c.contributionDate}</td>
                    <td>
                      <span style={{ fontWeight: "700" }}>{formatINR(c.amount)}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="actions-cell" style={{ justifyContent: "flex-end" }}>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="action-btn edit"
                          title="Edit Contribution"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(c.id)}
                          className="action-btn delete"
                          title="Delete Contribution"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record/Edit Contribution Modal Dialog */}
      {isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? "Edit Dakshina Entry" : "Record Guru Dakshina"}</h3>
              <button className="modal-close" onClick={() => setIsOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {/* Search Suggest Input */}
                <div className="form-group" ref={dropdownRef} style={{ position: "relative" }}>
                  <label className="form-label">Swayamsevak Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search name or type manual..."
                    value={formName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormName(val);
                      setSelectedSwayamsevakId(null); // Reset since typing custom

                      if (val.trim()) {
                        const filtered = swayamsevaks.filter((s) =>
                          s.name.toLowerCase().includes(val.toLowerCase())
                        );
                        setSuggestions(filtered);
                        setShowDropdown(true);
                      } else {
                        setSuggestions([]);
                        setShowDropdown(false);
                      }
                    }}
                    onFocus={() => {
                      if (formName.trim()) {
                        const filtered = swayamsevaks.filter((s) =>
                          s.name.toLowerCase().includes(formName.toLowerCase())
                        );
                        setSuggestions(filtered);
                        setShowDropdown(true);
                      } else {
                        // show all registered members by default on empty input focus
                        setSuggestions(swayamsevaks);
                        setShowDropdown(true);
                      }
                    }}
                    required
                  />

                  {showDropdown && suggestions.length > 0 && (
                    <div className="search-dropdown-menu">
                      {suggestions.map((s) => (
                        <div
                          key={s.id}
                          className="search-dropdown-item"
                          onClick={() => {
                            setFormName(s.name);
                            setFormShakha(s.shakha);
                            setSelectedSwayamsevakId(s.id);
                            setShowDropdown(false);
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{s.name}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                            {s.shakha} • {s.role}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Shakha Unit *</label>
                  <select
                    className="form-control"
                    value={formShakha}
                    onChange={(e) => setFormShakha(e.target.value)}
                    required
                  >
                    <option value="Bal Shakha">Bal Shakha</option>
                    <option value="Tarun Shakha">Tarun Shakha</option>
                    <option value="Pravaudh Shakha">Pravaudh Shakha</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Contribution Amount (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Enter amount..."
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
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
                  {editingItem ? "Save Changes" : "Record Entry"}
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
              <h3 className="warning-title">Delete Dakshina Entry?</h3>
              <p className="warning-text">
                Are you sure you want to permanently delete this contribution record? This action cannot be undone.
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
                      await onDeleteContribution(deleteConfirmId);
                      setDeleteConfirmId(null);
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
