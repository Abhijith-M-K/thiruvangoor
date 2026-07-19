"use client";

import React from "react";
import { Sliders } from "lucide-react";

interface GenericPlaceholderViewProps {
  viewName: string;
  setView: (view: string) => void;
}

export default function GenericPlaceholderView({ viewName, setView }: GenericPlaceholderViewProps) {
  return (
    <div className="content-panel" style={{ textAlign: "center", padding: "64px 32px" }}>
      <Sliders size={48} style={{ color: "var(--color-saffron)", marginBottom: "20px" }} />
      <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>
        {viewName.toUpperCase()} Portal Section
      </h2>
      <p
        style={{
          color: "var(--text-secondary)",
          fontSize: "14px",
          maxWidth: "480px",
          margin: "0 auto 24px auto",
        }}
      >
        This module manages advanced configuration details of the Thiruvangoor RSS Unit
        ({viewName}). Data models are connected to the central state management.
      </p>
      <button className="btn-primary saffron" onClick={() => setView("dashboard")}>
        Back to Dashboard Overview
      </button>
    </div>
  );
}
