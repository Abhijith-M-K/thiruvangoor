"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Download, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
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

interface DakshinaImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMembers: Swayamsevak[];
  existingContributions: Contribution[];
  onImportSuccess: (message: string) => void;
  onRefreshData: () => Promise<void>;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  triggerLoader?: (show: boolean, msg: string) => void;
}

interface ParsedContribution {
  name: string;
  phone: string;
  shakha: string;
  amount: number;
  date: string;
  isDuplicate: boolean;
  duplicateReason?: string;
  isValid: boolean;
  validationError?: string;
  isLinked: boolean;
  linkedSwayamsevakName?: string;
}

export default function DakshinaImportModal({
  isOpen,
  onClose,
  existingMembers,
  existingContributions,
  onImportSuccess,
  onRefreshData,
  showToast,
  triggerLoader
}: DakshinaImportModalProps) {
  const [fileName, setFileName] = useState<string>("");
  const [parsing, setParsing] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [rows, setRows] = useState<ParsedContribution[]>([]);
  const [error, setError] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const headers = [["Name", "Phone", "Shakha", "Amount", "Date"]];
    const sampleRows = [
      ["HARIDAS K", "9876543210", "Pravaudh Shakha", 5000, "07 May 2026"],
      ["VISHNU PRASAD", "9946381671", "Tarun Shakha", 3000, "20 Jun 2026"],
      ["SURESH KUMAR", "", "General / Other", 1500, ""]
    ];

    const data = [...headers, ...sampleRows];

    // Create workbook and worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ContributionsTemplate");

    // Write file and trigger browser download
    XLSX.writeFile(workbook, "rss_guru_dakshina_import_template.xlsx");
    showToast("Guru Dakshina import template downloaded!", "success");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setError("");
    setParsing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (rawJson.length === 0) {
          setError("The uploaded spreadsheet is empty.");
          setParsing(false);
          return;
        }

        // Standardize column names
        const parsedRows: ParsedContribution[] = rawJson.map((row) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach((k) => {
            normalizedRow[k.trim().toLowerCase()] = String(row[k]).trim();
          });

          let name = normalizedRow.name || normalizedRow["contributor name"] || normalizedRow["member name"] || "";
          let phone = normalizedRow.phone || normalizedRow["phone number"] || normalizedRow["mobile"] || "";
          let shakha = normalizedRow.shakha || normalizedRow["shakha unit"] || "";
          const amountVal = normalizedRow.amount || "";
          const date = normalizedRow.date || normalizedRow["contribution date"] || "";

          // Validation
          let isValid = true;
          let validationError = "";
          const amount = parseInt(amountVal, 10);

          if (!name && !phone) {
            isValid = false;
            validationError = "Name or Phone is required";
          } else if (isNaN(amount) || amount <= 0) {
            isValid = false;
            validationError = "Invalid amount (must be > 0)";
          }

          // Linking logic by phone number
          let isLinked = false;
          let linkedSwayamsevakName = "";
          const cleanPhone = phone.replace(/[^0-9]/g, "");

          if (cleanPhone) {
            const matched = existingMembers.find(
              (m) => m.phone.replace(/[^0-9]/g, "") === cleanPhone
            );
            if (matched) {
              isLinked = true;
              name = matched.name; // Use DB name
              shakha = matched.shakha; // Use DB shakha
              linkedSwayamsevakName = matched.name;
            }
          }

          if (!shakha) {
            shakha = "Pravaudh Shakha"; // fallback default
          }

          // Duplicate checking in existing ledger
          let isDuplicate = false;
          let duplicateReason = "";

          if (isValid) {
            const todayStr = new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            });
            const checkDate = date || todayStr;
            
            // Check if contribution of same name, amount, and date already exists
            const hasMatch = existingContributions.some((c) => {
              const nameMatch = c.name.toUpperCase().trim() === name.toUpperCase().trim();
              const amountMatch = c.amount === amount;
              const dateMatch = c.contributionDate.trim() === checkDate.trim();
              return nameMatch && amountMatch && dateMatch;
            });

            if (hasMatch) {
              isDuplicate = true;
              duplicateReason = "Matching contribution already exists";
            }
          }

          return {
            name: name.toUpperCase(),
            phone: cleanPhone,
            shakha,
            amount,
            date,
            isDuplicate,
            duplicateReason,
            isValid,
            validationError,
            isLinked,
            linkedSwayamsevakName
          };
        });

        setRows(parsedRows);
      } catch (err: any) {
        console.error("Error parsing Excel:", err);
        setError("Failed to parse file. Make sure it is a valid Excel or CSV sheet.");
      } finally {
        setParsing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmImport = async () => {
    const validRows = rows.filter((r) => r.isValid && !r.isDuplicate);

    if (validRows.length === 0) {
      showToast("No new records to import.", "error");
      return;
    }

    setImporting(true);
    if (triggerLoader) {
      triggerLoader(true, "Batch importing contributions and updating Guru Dakshina ledger...");
    }

    try {
      const res = await fetch("/api/contributions/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contributions: validRows })
      });
      const data = await res.json();

      if (data.error) {
        showToast(`Import failed: ${data.error}`, "error");
      } else {
        const msg = `Successfully imported ${data.insertedCount} Guru Dakshina records. ${data.skippedCount} duplicates skipped.`;
        onImportSuccess(msg);
        await onRefreshData();
        onClose();
      }
    } catch (err: any) {
      showToast(`Network error: ${err.message || err}`, "error");
    } finally {
      setImporting(false);
      if (triggerLoader) {
        triggerLoader(false, "");
      }
    }
  };

  const handleReset = () => {
    setFileName("");
    setRows([]);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validNewCount = rows.filter((r) => r.isValid && !r.isDuplicate).length;
  const duplicateCount = rows.filter((r) => r.isDuplicate).length;
  const invalidCount = rows.filter((r) => !r.isValid).length;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "800px", width: "95%" }}>
        <div className="modal-header">
          <h3>Import Guru Dakshina Ledger</h3>
          <button onClick={onClose} className="close-btn" disabled={importing}>
            <X />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div style={{
              backgroundColor: "var(--color-danger-light)",
              color: "var(--color-danger)",
              padding: "12px",
              borderRadius: "var(--radius-sm)",
              marginBottom: "16px",
              fontSize: "13px",
              fontWeight: 500
            }}>
              {error}
            </div>
          )}

          {rows.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: 1.5 }}>
                Upload an Excel (.xlsx, .xls) or CSV file containing lists of contributions. 
                If a <strong>Phone number</strong> matches a registered Swayamsevak, the contribution will be linked to their account automatically. 
                Duplicate records with the same name, amount, and date will be skipped to prevent double entry.
              </p>

              {/* Template Download Section */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px",
                backgroundColor: "var(--background-secondary)",
                borderRadius: "var(--radius-md)",
                border: "1px dashed var(--border-color)"
              }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 600 }}>Need a template?</h4>
                  <p style={{ margin: "4px 0 0 0", fontSize: "12.5px", color: "var(--text-secondary)" }}>
                    Download our Guru Dakshina spreadsheet template with headers: Name, Phone, Shakha, Amount, Date.
                  </p>
                </div>
                <button type="button" className="btn-secondary" onClick={handleDownloadTemplate} style={{ gap: "6px" }}>
                  <Download size={15} /> Download Excel Template
                </button>
              </div>

              {/* Upload Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "180px",
                  border: "2px dashed var(--color-saffron)",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  backgroundColor: "rgba(242, 109, 33, 0.03)",
                  transition: "background-color 0.2s"
                }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "rgba(242, 109, 33, 0.06)")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "rgba(242, 109, 33, 0.03)")}
              >
                {parsing ? (
                  <>
                    <Loader2 className="animate-spin" size={36} style={{ color: "var(--color-saffron)" }} />
                    <p style={{ marginTop: "12px", fontSize: "14px", fontWeight: 500 }}>Parsing spreadsheet data...</p>
                  </>
                ) : (
                  <>
                    <Upload size={36} style={{ color: "var(--color-saffron)" }} />
                    <p style={{ marginTop: "12px", fontSize: "14px", fontWeight: 500 }}>
                      Click to choose file or drag and drop
                    </p>
                    <p style={{ marginTop: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                      Supports .xlsx, .xls, and .csv files
                    </p>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".xlsx,.xls,.csv"
                  style={{ display: "none" }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Stats Summary */}
              <div style={{
                display: "flex",
                gap: "12px",
                padding: "12px 16px",
                backgroundColor: "var(--background-secondary)",
                borderRadius: "var(--radius-md)",
                fontSize: "13.5px",
                fontWeight: 500
              }}>
                <div style={{ color: "var(--text-secondary)" }}>
                  File: <strong style={{ color: "var(--text-primary)" }}>{fileName}</strong>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", gap: "16px" }}>
                  <span style={{ color: "#16a34a" }}>● {validNewCount} Ready</span>
                  {duplicateCount > 0 && <span style={{ color: "#ca8a04" }}>● {duplicateCount} Duplicate (Skipped)</span>}
                  {invalidCount > 0 && <span style={{ color: "var(--color-danger)" }}>● {invalidCount} Invalid</span>}
                </div>
              </div>

              {/* Data Verification Table */}
              <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)" }}>
                <table className="data-table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "10px" }}>Name</th>
                      <th style={{ padding: "10px" }}>Phone</th>
                      <th style={{ padding: "10px" }}>Shakha</th>
                      <th style={{ padding: "10px" }}>Amount</th>
                      <th style={{ padding: "10px" }}>Date</th>
                      <th style={{ padding: "10px" }}>Linking</th>
                      <th style={{ padding: "10px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx} style={{ opacity: (!row.isValid || row.isDuplicate) ? 0.7 : 1 }}>
                        <td style={{ padding: "8px 10px", fontWeight: 600 }}>{row.name}</td>
                        <td style={{ padding: "8px 10px" }}>{row.phone || "-"}</td>
                        <td style={{ padding: "8px 10px" }}>{row.shakha}</td>
                        <td style={{ padding: "8px 10px", color: "var(--color-success)", fontWeight: 500 }}>
                          ₹{row.amount}
                        </td>
                        <td style={{ padding: "8px 10px" }}>{row.date || "Today (Auto)"}</td>
                        <td style={{ padding: "8px 10px" }}>
                          {row.isLinked ? (
                            <span style={{
                              display: "inline-flex",
                              padding: "2px 8px",
                              backgroundColor: "rgba(37, 99, 235, 0.08)",
                              color: "#2563eb",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 600
                            }}>
                              Linked
                            </span>
                          ) : (
                            <span style={{
                              display: "inline-flex",
                              padding: "2px 8px",
                              backgroundColor: "rgba(100, 116, 139, 0.08)",
                              color: "var(--text-secondary)",
                              borderRadius: "4px",
                              fontSize: "11px"
                            }}>
                              Custom Doner
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          {!row.isValid ? (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 8px",
                              backgroundColor: "rgba(239, 68, 68, 0.1)",
                              color: "var(--color-danger)",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: 600
                            }}>
                              <AlertTriangle size={12} /> {row.validationError}
                            </span>
                          ) : row.isDuplicate ? (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 8px",
                              backgroundColor: "rgba(202, 138, 4, 0.1)",
                              color: "#ca8a04",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: 600
                            }} title={row.duplicateReason}>
                              <AlertTriangle size={12} /> Duplicate
                            </span>
                          ) : (
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "2px 8px",
                              backgroundColor: "rgba(22, 163, 74, 0.1)",
                              color: "#16a34a",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: 600
                            }}>
                              <CheckCircle size={12} /> Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: "1px solid var(--border-color)", padding: "16px 20px" }}>
          {rows.length > 0 ? (
            <>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleReset}
                disabled={importing}
              >
                Clear & Upload Another
              </button>
              <button
                type="button"
                className="btn-primary saffron"
                onClick={handleConfirmImport}
                disabled={importing || validNewCount === 0}
                style={{ marginLeft: "auto", gap: "6px" }}
              >
                {importing ? (
                  <>
                    <Loader2 className="animate-spin" size={16} /> Importing...
                  </>
                ) : (
                  `Confirm & Import (${validNewCount} Records)`
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{ marginLeft: "auto" }}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
