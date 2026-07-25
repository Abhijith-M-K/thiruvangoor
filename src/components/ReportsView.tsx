"use client";

import React from "react";
import { Users, CreditCard, Flag, Activity, Calendar, Download, FileSpreadsheet } from "lucide-react";
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

interface ReportsViewProps {
  swayamsevaks: Swayamsevak[];
  contributions: Contribution[];
  shakhas: Shakha[];
  attendanceLogs: ShakhaAttendanceLog[];
  events: EventItem[];
  formatINR: (value: number) => string;
  setView: (view: string) => void;
  triggerLoader?: (show: boolean, msg: string) => void;
}

export default function ReportsView({
  swayamsevaks,
  contributions,
  shakhas,
  attendanceLogs,
  events,
  formatINR,
  setView,
  triggerLoader
}: ReportsViewProps) {
  // 1. Map data models to Excel structure
  const getSwayamsevaksData = () =>
    swayamsevaks.map((m) => ({
      "Swayamsevak ID": m.id,
      "Full Name": m.name,
      "Age": m.age || "N/A",
      "Phone": m.phone,
      "Email": m.email || "N/A",
      "Shakha Unit": m.shakha,
      "Role": m.role,
      "Status": m.status.toUpperCase(),
      "Joining Date": m.joiningDate
    }));

  const getContributionsData = () =>
    contributions.map((c) => ({
      "Contribution ID": c.id,
      "Swayamsevak ID": c.swayamsevakId || "Manual Registry",
      "Swayamsevak Name": c.name,
      "Shakha Unit": c.shakha,
      "Contribution Date": c.contributionDate,
      "Amount (INR)": c.amount
    }));

  const getShakhasData = () =>
    shakhas.map((s) => ({
      "Shakha ID": s.id,
      "Shakha Name": s.name,
      "Assembly Type": s.type.toUpperCase(),
      "Session Timings": s.time,
      "Location": s.location,
      "Mukhya Shikshak (Instructor)": s.mukhyaShikshak,
      "Registered Members": s.attendance
    }));

  const getAttendanceLogsData = () =>
    attendanceLogs.map((log) => ({
      "Log ID": log.id,
      "Date": log.logDate,
      "Shakha Name": log.shakhaName,
      "Shakha ID": log.shakhaId,
      "Present Count": log.presentCount,
      "Absent Count": log.absentCount,
      "Absent with Reason": log.absentReasonCount,
      "Remarks": log.remarks || "-"
    }));

  const getEventsData = () =>
    events.map((ev) => {
      const attendancePercent = ev.informedCount > 0
        ? `${((ev.participantCount / ev.informedCount) * 100).toFixed(1)}%`
        : "0%";

      return {
        "Event ID": ev.id,
        "Event Name": ev.name,
        "Event Date": ev.eventDate,
        "Place": ev.place,
        "Informed Count": ev.informedCount,
        "Participants Count": ev.participantCount,
        "Absent Count": ev.absentCount,
        "Absent with Reason": ev.absentReasonCount,
        "Attendance Rate": attendancePercent
      };
    });

  // Helper column sizing
  const setWorksheetColumns = (worksheet: XLSX.WorkSheet, widths: number[]) => {
    worksheet["!cols"] = widths.map((w) => ({ wch: w }));
  };

  // Download Individual Sheet
  const downloadIndividualExcel = (reportType: string) => {
    if (triggerLoader) triggerLoader(true, `Generating ${reportType} report...`);

    setTimeout(() => {
      try {
        let worksheet: XLSX.WorkSheet;
        let filename: string;
        let sheetName: string;

        switch (reportType) {
          case "Swayamsevaks":
            worksheet = XLSX.utils.json_to_sheet(getSwayamsevaksData());
            setWorksheetColumns(worksheet, [12, 25, 8, 15, 25, 20, 18, 12, 15]);
            sheetName = "Swayamsevaks";
            filename = "RSS_Swayamsevaks_Report";
            break;
          case "Guru Dakshina":
            worksheet = XLSX.utils.json_to_sheet(getContributionsData());
            setWorksheetColumns(worksheet, [15, 18, 25, 20, 20, 15]);
            sheetName = "Guru Dakshina Ledger";
            filename = "RSS_Guru_Dakshina_Ledger";
            break;
          case "Shakha Assemblies":
            worksheet = XLSX.utils.json_to_sheet(getShakhasData());
            setWorksheetColumns(worksheet, [12, 22, 16, 25, 35, 25, 18]);
            sheetName = "Shakha Units";
            filename = "RSS_Active_Shakhas_Report";
            break;
          case "Attendance Logs":
            worksheet = XLSX.utils.json_to_sheet(getAttendanceLogsData());
            setWorksheetColumns(worksheet, [12, 15, 22, 12, 15, 15, 20, 30]);
            sheetName = "Daily Attendance Logs";
            filename = "RSS_Daily_Attendance_Logs";
            break;
          case "Events":
            worksheet = XLSX.utils.json_to_sheet(getEventsData());
            setWorksheetColumns(worksheet, [12, 30, 15, 40, 16, 20, 15, 20, 16]);
            sheetName = "Scheduled Events";
            filename = "RSS_Program_Events_Report";
            break;
          default:
            return;
        }

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
      } catch (err) {
        console.error("Spreadsheet export failed:", err);
      } finally {
        if (triggerLoader) triggerLoader(false, "");
      }
    }, 100);
  };

  // Download Consolidated Workbook (All Sheets)
  const downloadConsolidatedExcel = () => {
    if (triggerLoader) triggerLoader(true, "Compiling consolidated workbook sheets...");

    setTimeout(() => {
      try {
        const workbook = XLSX.utils.book_new();

        // 1. Swayamsevaks Sheet
        const wsSwayam = XLSX.utils.json_to_sheet(getSwayamsevaksData());
        setWorksheetColumns(wsSwayam, [12, 25, 8, 15, 25, 20, 18, 12, 15]);
        XLSX.utils.book_append_sheet(workbook, wsSwayam, "Swayamsevaks");

        // 2. Guru Dakshina Sheet
        const wsDakshina = XLSX.utils.json_to_sheet(getContributionsData());
        setWorksheetColumns(wsDakshina, [15, 18, 25, 20, 20, 15]);
        XLSX.utils.book_append_sheet(workbook, wsDakshina, "Guru Dakshina Ledger");

        // 3. Shakhas Sheet
        const wsShakha = XLSX.utils.json_to_sheet(getShakhasData());
        setWorksheetColumns(wsShakha, [12, 22, 16, 25, 35, 25, 18]);
        XLSX.utils.book_append_sheet(workbook, wsShakha, "Shakha Units");

        // 4. Attendance Logs Sheet
        const wsAttendance = XLSX.utils.json_to_sheet(getAttendanceLogsData());
        setWorksheetColumns(wsAttendance, [12, 15, 22, 12, 15, 15, 20, 30]);
        XLSX.utils.book_append_sheet(workbook, wsAttendance, "Daily Attendance Logs");

        // 5. Scheduled Events Sheet
        const wsEvents = XLSX.utils.json_to_sheet(getEventsData());
        setWorksheetColumns(wsEvents, [12, 30, 15, 40, 16, 20, 15, 20, 16]);
        XLSX.utils.book_append_sheet(workbook, wsEvents, "Scheduled Events");

        // Write complete workbook file
        XLSX.writeFile(workbook, `RSS_Thiruvangoor_Consolidated_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
      } catch (err) {
        console.error("Consolidated workbook write failed:", err);
      } finally {
        if (triggerLoader) triggerLoader(false, "");
      }
    }, 100);
  };

  const totalDakshinaSum = contributions.reduce((sum, c) => sum + c.amount, 0);

  return (
    <>
      <div className="sticky-header-container">
        <div className="dashboard-header" style={{ marginBottom: "16px" }}>
          <div className="header-title">
            <h1>Consolidated Reports Dashboard</h1>
            <p>Export all databases, financial logs, attendance registries, and event audits in Excel format.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button className="btn-secondary" style={{ height: "42px" }} onClick={() => setView("dashboard")}>
              Back to Dashboard
            </button>
            <button
              className="btn-primary saffron"
              style={{ display: "flex", gap: "8px", alignItems: "center", height: "42px" }}
              onClick={downloadConsolidatedExcel}
            >
              <FileSpreadsheet size={16} /> Download Consolidated Report
            </button>
          </div>
        </div>
      </div>

      <div style={{ padding: "24px 0" }}>
        <h4 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "20px", color: "var(--text-primary)" }}>
          Download Individual Registers
        </h4>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px"
        }}>
          {/* Card 1: Swayamsevaks */}
          <div className="content-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "200px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="shakha-type-badge prabhat" style={{ textTransform: "uppercase" }}>Registry</span>
                <span style={{ color: "var(--color-saffron)" }}><Users size={20} /></span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginTop: "14px", color: "var(--text-primary)" }}>Swayamsevaks Registry</h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "6px" }}>
                Total Members: <strong>{swayamsevaks.length} Swayamsevaks</strong>
              </p>
            </div>
            <button
              className="btn-secondary"
              style={{ width: "100%", display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}
              onClick={() => downloadIndividualExcel("Swayamsevaks")}
            >
              <Download size={14} /> Download Excel
            </button>
          </div>

          {/* Card 2: Guru Dakshina */}
          <div className="content-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "200px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="shakha-type-badge ratri" style={{ textTransform: "uppercase" }}>Ledger</span>
                <span style={{ color: "#ca8a04" }}><CreditCard size={20} /></span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginTop: "14px", color: "var(--text-primary)" }}>Guru Dakshina Ledger</h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "6px" }}>
                Total Collection: <strong>{formatINR(totalDakshinaSum)}</strong>
              </p>
            </div>
            <button
              className="btn-secondary"
              style={{ width: "100%", display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}
              onClick={() => downloadIndividualExcel("Guru Dakshina")}
            >
              <Download size={14} /> Download Excel
            </button>
          </div>

          {/* Card 3: Shakhas */}
          <div className="content-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "200px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="shakha-type-badge sayam" style={{ textTransform: "uppercase" }}>Assemblies</span>
                <span style={{ color: "var(--color-saffron)" }}><Flag size={20} /></span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginTop: "14px", color: "var(--text-primary)" }}>Shakha Sessions</h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "6px" }}>
                Active Assemblies: <strong>{shakhas.length} Units</strong>
              </p>
            </div>
            <button
              className="btn-secondary"
              style={{ width: "100%", display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}
              onClick={() => downloadIndividualExcel("Shakha Assemblies")}
            >
              <Download size={14} /> Download Excel
            </button>
          </div>

          {/* Card 4: Attendance Logs */}
          <div className="content-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "200px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="shakha-type-badge prabhat" style={{ textTransform: "uppercase" }}>Attendance</span>
                <span style={{ color: "#16a34a" }}><Activity size={20} /></span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginTop: "14px", color: "var(--text-primary)" }}>Daily Attendance Logs</h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "6px" }}>
                Recorded Log Days: <strong>{attendanceLogs.length} Days</strong>
              </p>
            </div>
            <button
              className="btn-secondary"
              style={{ width: "100%", display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}
              onClick={() => downloadIndividualExcel("Attendance Logs")}
            >
              <Download size={14} /> Download Excel
            </button>
          </div>

          {/* Card 5: Events */}
          <div className="content-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "200px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <span className="shakha-type-badge sayam" style={{ textTransform: "uppercase" }}>Programs</span>
                <span style={{ color: "var(--color-saffron)" }}><Calendar size={20} /></span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginTop: "14px", color: "var(--text-primary)" }}>Scheduled Programs</h3>
              <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "6px" }}>
                Total Scheduled: <strong>{events.length} Events</strong>
              </p>
            </div>
            <button
              className="btn-secondary"
              style={{ width: "100%", display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}
              onClick={() => downloadIndividualExcel("Events")}
            >
              <Download size={14} /> Download Excel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
