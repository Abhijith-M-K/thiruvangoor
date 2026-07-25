"use client";

import React from "react";
import { X } from "lucide-react";

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  title: string;
  formData: {
    name: string;
    phone: string;
    email: string;
    shakha: string;
    joiningDate: string;
    status: "active" | "inactive" | "touring";
    role: string;
    age?: number | string;
  };
  setFormData: (data: any) => void;
  submitLabel: string;
}

export default function MemberModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  formData,
  setFormData,
  submitLabel
}: MemberModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="close-btn">
            <X />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. MOHAN DAS"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  className="form-control"
                  placeholder="10 digit mobile"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@domain.com"
                  value={formData.email || ""}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Age</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 25"
                  value={formData.age === undefined ? "" : formData.age}
                  onChange={(e) => {
                    const ageVal = e.target.value;
                    const parsedAge = ageVal ? parseInt(ageVal, 10) : 0;
                    let calculatedShakha = "Pravaudh Shakha";
                    if (parsedAge >= 6 && parsedAge <= 12) {
                      calculatedShakha = "Bal Shakha";
                    } else if (parsedAge >= 13 && parsedAge <= 18) {
                      calculatedShakha = "Tarun Shakha";
                    } else {
                      calculatedShakha = "Pravaudh Shakha";
                    }
                    setFormData({
                      ...formData,
                      age: ageVal === "" ? "" : parsedAge,
                      shakha: calculatedShakha
                    });
                  }}
                  min="1"
                  max="120"
                  required
                />
              </div>
              <div className="form-group">
                <label>Responsibility/Role</label>
                <select
                  className="form-control"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="Swayamsevak">Swayamsevak</option>
                  <option value="Gathanayak">Gathanayak</option>
                  <option value="Shikshak">Shikshak</option>
                  <option value="Mukhya Shikshak">Mukhya Shikshak</option>
                  <option value="Karyavah">Karyavah</option>
                  <option value="Bhag Karyavah">Bhag Karyavah</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "active" | "inactive" | "touring"
                    })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="touring">Pravas / Touring</option>
                </select>
              </div>
              <div className="form-group">
                <label>Assigned Shakha Unit</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.shakha || "Pravaudh Shakha"}
                  readOnly
                  disabled
                  style={{ opacity: 0.8, cursor: "not-allowed", fontWeight: 500 }}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary saffron">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
