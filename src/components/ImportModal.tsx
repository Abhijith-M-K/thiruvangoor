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

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMembers: Swayamsevak[];
  onImportSuccess: (message: string) => void;
  onRefreshData: () => Promise<void>;
  showToast: (message: string, type: "success" | "error" | "info") => void;
  triggerLoader?: (show: boolean, msg: string) => void;
}

interface ParsedRow {
  name: string;
  phone: string;
  email: string;
  age?: number;
  shakha: string;
  status: "active" | "inactive" | "touring";
  role: string;
  isDuplicate: boolean;
  duplicateReason?: string;
  isValid: boolean;
  validationError?: string;
}

export default function ImportModal({
  isOpen,
  onClose,
  existingMembers,
  onImportSuccess,
  onRefreshData,
  showToast,
  triggerLoader
}: ImportModalProps) {
  const [fileName, setFileName] = useState<string>("");
  const [parsing, setParsing] = useState<boolean>(false);
  const [importing, setImporting] = useState<boolean>(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [error, setError] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const getShakhaFromAge = (age?: number): string => {
    if (age === undefined || age === null || isNaN(age)) {
      return "Pravaudh Shakha";
    }
    if (age >= 6 && age <= 12) return "Bal Shakha";
    if (age >= 13 && age <= 18) return "Tarun Shakha";
    return "Pravaudh Shakha";
  };

  const handleDownloadTemplate = () => {
    const headers = [["Name", "Phone", "Email", "Age"]];
    const sampleRows = [
      ["HARIDAS K", "9876543210", "haridas@mailinator.com", 54],
      ["VISHNU PRASAD", "9946380000", "vishnu@mailinator.com", 15],
      ["ADWAITH SHARMA", "7012730000", "", 11]
    ];

    const data = [...headers, ...sampleRows];

    // Create workbook and worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Swayamsevaks");

    // Write file and trigger browser download
    XLSX.writeFile(workbook, "rss_swayamsevak_import_template.xlsx");
    showToast("Sample template downloaded!", "success");
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

        // Standardize columns and check duplicates by Name
        const seenNamesInFile = new Set<string>();

        const parsedRows: ParsedRow[] = rawJson.map((row) => {
          const normalizedRow: any = {};
          Object.keys(row).forEach((k) => {
            normalizedRow[k.trim().toLowerCase()] = String(row[k]).trim();
          });

          const name = String(normalizedRow.name || normalizedRow["full name"] || normalizedRow["member name"] || "").trim();
          const phone = String(normalizedRow.phone || normalizedRow["phone number"] || normalizedRow["mobile"] || "").trim();
          const email = String(normalizedRow.email || normalizedRow["email address"] || "").trim();
          const ageVal = normalizedRow.age || "";
          const parsedAge = ageVal ? parseInt(ageVal, 10) : undefined;
          const shakha = getShakhaFromAge(parsedAge);

          // Validation (Phone is optional)
          let isValid = true;
          let validationError = "";
          const cleanPhone = phone ? phone.replace(/[^0-9]/g, "") : "";

          if (!name) {
            isValid = false;
            validationError = "Name is required";
          } else if (cleanPhone && cleanPhone.length !== 10) {
            isValid = false;
            validationError = "Phone must be 10 digits if provided";
          }

          // Duplicate checks by Name only
          let isDuplicate = false;
          let duplicateReason = "";

          if (isValid) {
            const upperName = name.toUpperCase();
            const nameExistsInDb = existingMembers.some(
              (m) => m.name && m.name.trim().toUpperCase() === upperName
            );
            const nameExistsInFile = seenNamesInFile.has(upperName);

            if (nameExistsInDb) {
              isDuplicate = true;
              duplicateReason = "Member name already exists in DB";
            } else if (nameExistsInFile) {
              isDuplicate = true;
              duplicateReason = "Duplicate name in uploaded file";
            } else {
              seenNamesInFile.add(upperName);
            }
          }

          return {
            name: name.toUpperCase(),
            phone: cleanPhone,
            email,
            age: parsedAge,
            shakha,
            status: "active",
            role: "Swayamsevak",
            isDuplicate,
            duplicateReason,
            isValid,
            validationError
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
    // Filter only valid and non-duplicate rows to insert
    const validRows = rows.filter((r) => r.isValid && !r.isDuplicate);

    if (validRows.length === 0) {
      showToast("No new records to import.", "error");
      return;
    }

    setImporting(true);
    if (triggerLoader) {
      triggerLoader(true, "Batch registering members and synchronizing database...");
    }

    try {
      const res = await fetch("/api/swayamsevaks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ members: validRows })
      });
      const data = await res.json();

      if (data.error) {
        showToast(`Import failed: ${data.error}`, "error");
      } else {
        const msg = `Successfully imported ${data.insertedCount} members. ${data.skippedCount} duplicates skipped.`;
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
          <h3>Import Swayamsevaks from Excel/CSV</h3>
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
                Upload an Excel (.xlsx, .xls) or CSV file containing lists of Swayamsevaks. 
                The system will automatically assign roles as <strong>Swayamsevak</strong> and compute 
                the Shakha Unit using the age column. Phone number is optional. Duplicate member names will be automatically detected and skipped.
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
                    Download our pre-formatted spreadsheet template with the correct columns.
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
              {/* Roster stats summary */}
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
                  <span style={{ color: "#16a34a" }}>● {validNewCount} New Ready</span>
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
                      <th style={{ padding: "10px" }}>Email</th>
                      <th style={{ padding: "10px" }}>Age</th>
                      <th style={{ padding: "10px" }}>Calculated Shakha</th>
                      <th style={{ padding: "10px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx} style={{ opacity: (!row.isValid || row.isDuplicate) ? 0.7 : 1 }}>
                        <td style={{ padding: "8px 10px", fontWeight: 600 }}>{row.name}</td>
                        <td style={{ padding: "8px 10px" }}>{row.phone}</td>
                        <td style={{ padding: "8px 10px" }}>{row.email || "-"}</td>
                        <td style={{ padding: "8px 10px" }}>{row.age !== undefined ? row.age : "-"}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <span className="shakha-count-badge" style={{ margin: 0 }}>{row.shakha}</span>
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
