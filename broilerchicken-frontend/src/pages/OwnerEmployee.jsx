import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, Plus, Eye, Pencil, X,
  Key, CheckCircle2, Clock, Lock, RefreshCw, UserX, Shield,
  Activity, Users, UserCheck, UserMinus, Layers
} from "lucide-react";

const API = "http://localhost:5000/api/owner";

/* ─── Design tokens (mirrors OwnerMortality) ──────────────────── */
const C = {
  forest: "#102114", pine: "#244128", fern: "#3A7D1C", sage: "#6E8A72",
  mist: "#DDE8D7", foam: "#F6F8F3", white: "#ffffff",
  amber: "#B7791F", amberBg: "#FFF3D9",
  blue: "#1D4E89", blueBg: "#E8F4FF",
  red: "#B91C1C", redBg: "#FEE2E2",
  green: "#EAF7E3", accent: "#4CAF50",
  purple: "#5B21B6", purpleBg: "#F5F3FF",
};

const roleColors = {
  "Farm Worker": { bg: "#EAF7E3", color: "#3A7D1C", bar: "#4CAF50", icon: "🌾" },
  "Driver":      { bg: "#E8F4FF", color: "#1D4E89", bar: "#3B82F6", icon: "🚚" },
};

const getStatusStyle = (s) => {
  const u = String(s).toUpperCase();
  if (u === "ACTIVE")   return { bg: C.green,   color: C.fern,  dot: "#4CAF50", label: "Active",   icon: <CheckCircle2 size={11}/> };
  if (u === "DISABLED") return { bg: C.redBg,   color: C.red,   dot: "#EF4444", label: "Disabled", icon: <UserMinus size={11}/> };
  return                       { bg: C.amberBg, color: C.amber, dot: "#F59E0B", label: "Pending",  icon: <Clock size={11}/> };
};

const normalizeRole = (r) => {
  if (!r) return "—";
  if (String(r).toUpperCase() === "FARM WORKER") return "Farm Worker";
  if (String(r).toUpperCase() === "DRIVER") return "Driver";
  return r;
};

/* ─── KPI Card (identical to OwnerMortality) ─────────────────── */
function KpiCard({ title, value, sub, accent, lightBg, icon, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 280, damping: 24 }}
      whileHover={{ y: -4, boxShadow: "0 20px 48px rgba(16,33,20,0.12)" }}
      style={{
        background: C.white, borderRadius: 24, padding: "20px 18px",
        border: `1.5px solid ${C.mist}`,
        boxShadow: "0 4px 20px rgba(16,33,20,0.07)",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -20, right: -20, width: 72, height: 72, borderRadius: "50%", background: lightBg, opacity: 0.6 }} />
      <div style={{ width: 40, height: 40, borderRadius: 13, background: lightBg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, fontSize: 20 }}>
        {icon}
      </div>
      <div style={{ fontSize: 11, color: C.sage, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{title}</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 26, fontWeight: 900, color: C.forest, lineHeight: 1.1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: accent, fontWeight: 700 }}>{sub}</div>
    </motion.div>
  );
}

/* ─── Success Toast ───────────────────────────────────────────── */
function SuccessToast({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      style={{
        position: "fixed", bottom: 28, right: 28,
        background: C.green, color: C.fern,
        border: `1px solid #BFE7B8`, borderRadius: 14,
        padding: "14px 20px", fontWeight: 800, zIndex: 400,
        boxShadow: "0 12px 30px rgba(0,0,0,.12)",
        display: "flex", alignItems: "center", gap: 10, fontSize: 14,
        fontFamily: "'Plus Jakarta Sans',sans-serif",
      }}
    >
      <CheckCircle2 size={18} /> {message}
    </motion.div>
  );
}

/* ─── Employee Card ───────────────────────────────────────────── */
function EmployeeCard({ emp, index, onView, onEdit, onToggle, onResetPassword }) {
  const ss   = getStatusStyle(emp.status);
  const role = normalizeRole(emp.role);
  const rc   = roleColors[role] || roleColors["Driver"];
  const initials = emp.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const isActive = String(emp.status).toUpperCase() === "ACTIVE";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 280, damping: 26 }}
      whileHover={{ y: -3, boxShadow: "0 16px 44px rgba(16,33,20,0.11)" }}
      style={{
        background: C.white, borderRadius: 24, overflow: "hidden",
        border: `1.5px solid ${C.mist}`,
        boxShadow: "0 4px 20px rgba(16,33,20,0.07)",
      }}
    >
      {/* colour accent bar at top */}
      <div style={{ height: 4, background: rc.bar }} />

      <div style={{ padding: "18px 20px 20px" }}>
        {/* Avatar + name row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 16,
            background: rc.bg, border: `2px solid ${rc.bar}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 900, fontSize: 16, color: rc.color, flexShrink: 0,
            fontFamily: "'Plus Jakarta Sans',sans-serif",
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 800, fontSize: 15, color: C.forest, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {emp.fullName}
            </div>
            <div style={{ fontSize: 12, color: C.sage, marginTop: 1 }}>@{emp.username}</div>
          </div>
          <span style={{
            padding: "4px 9px", borderRadius: 999,
            background: ss.bg, color: ss.color,
            fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: ss.dot }} />
            {ss.label}
          </span>
        </div>

        {/* Role pill */}
        <div style={{ marginBottom: 14 }}>
          <span style={{ padding: "5px 12px", borderRadius: 999, background: rc.bg, color: rc.color, fontSize: 12, fontWeight: 700 }}>
            {rc.icon} {role}
          </span>
        </div>

        {/* Info rows */}
        <div style={{ background: C.foam, borderRadius: 14, padding: "10px 13px", border: `1px solid ${C.mist}`, marginBottom: 14, display: "flex", flexDirection: "column", gap: 7 }}>
          <InfoRow label="Email"   value={emp.email} />
          <InfoRow label="Phone"   value={emp.phone} />
          {role === "Driver" && <InfoRow label="Vehicle" value={emp.vehicle_no || "—"} />}
          <InfoRow label="Tasks"   value={emp.tasksHandled} />
        </div>

        {/* Action buttons — 2x2 grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
          <ActionBtn icon={<Eye size={13}/>} label="View"  onClick={onView}  />
          <ActionBtn icon={<Pencil size={13}/>} label="Edit" onClick={onEdit} />
          <ActionBtn
            icon={<Key size={13}/>} label="Reset PW"
            onClick={onResetPassword}
            style={{ borderColor: "#FDE8A8", background: "#FFFBEB", color: C.amber }}
          />
          <ActionBtn
            icon={isActive ? <Lock size={13}/> : <Shield size={13}/>}
            label={isActive ? "Disable" : "Enable"}
            onClick={onToggle}
            style={{
              borderColor: isActive ? "#FCA5A5" : "#BFE7B8",
              background:  isActive ? C.redBg  : C.green,
              color:       isActive ? C.red    : C.fern,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function ActionBtn({ icon, label, onClick, style = {} }) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        height: 34, borderRadius: 10, border: `1.5px solid ${C.mist}`,
        background: C.white, color: C.pine,
        fontWeight: 700, fontSize: 11, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        ...style,
      }}
    >
      {icon} {label}
    </motion.button>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span style={{ color: C.sage, fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: 700, color: C.forest, fontSize: 11, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>{value}</span>
    </div>
  );
}

/* ─── Create Modal ────────────────────────────────────────────── */
function CreateModal({ show, close, form, setForm, roles, formValid, showPassword, setShowPassword, generatePassword, createEmployee }) {
  if (!show) return null;
  return (
    <ModalOverlay onClose={close}>
      <div style={{ padding: 28 }}>
        <ModalHeader title="Create Employee Account" sub="Owner creates login credentials on behalf of the employee" onClose={close} />

        <div style={{ marginBottom: 18 }}>
          <FieldLabel>Role *</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 8 }}>
            {roles.map(r => {
              const rc  = roleColors[r];
              const sel = form.role === r;
              return (
                <motion.button key={r} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setForm(f => ({ ...f, role: r }))}
                  style={{ padding: "16px 12px", borderRadius: 16, border: sel ? `2px solid ${rc.bar}` : `1.5px solid ${C.mist}`, background: sel ? rc.bg : C.white, cursor: "pointer", textAlign: "center", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{rc.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: sel ? rc.color : C.sage }}>{r}</div>
                  <div style={{ fontSize: 11, color: "#9AA89B", marginTop: 2 }}>
                    {r === "Farm Worker" ? "Feed, mortality, medication" : "Deliveries, routes"}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Field label="Full Name *"  value={form.fullName}  onChange={v => setForm(f => ({ ...f, fullName: v }))}  placeholder="e.g. Ahmad Razif" />
          <Field label="Username *"   value={form.username}  onChange={v => setForm(f => ({ ...f, username: v }))}  placeholder="e.g. ahmad.r" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Field label="Email *"        value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} placeholder="e.g. ahmad@farm.com" type="email" />
          <Field label="Phone Number"   value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="e.g. 012-3456789" />
        </div>

        {form.role === "Driver" && (
          <div style={{ marginBottom: 14 }}>
            <Field label="Vehicle Number" value={form.vehicle_no} onChange={v => setForm(f => ({ ...f, vehicle_no: v }))} placeholder="e.g. VAN001" />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <FieldLabel>Temporary Password *</FieldLabel>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={form.tempPassword}
                onChange={e => setForm(f => ({ ...f, tempPassword: e.target.value }))}
                style={{ ...mInp, paddingRight: 42 }}
              />
              <button onClick={() => setShowPassword(p => !p)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={generatePassword}
              style={{ height: 46, padding: "0 14px", borderRadius: 12, border: `1.5px solid ${C.accent}`, background: C.green, color: C.fern, fontWeight: 800, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              <RefreshCw size={13} /> Generate
            </motion.button>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <FieldLabel>Initial Account Status</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginTop: 8 }}>
            {[["Active","✅","#4CAF50"],["Pending","🕐","#F59E0B"],["Disabled","🔒","#EF4444"]].map(([s, icon, color]) => {
              const sel = form.status === s;
              return (
                <motion.button key={s} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setForm(f => ({ ...f, status: s }))}
                  style={{ padding: "12px 8px", borderRadius: 12, border: sel ? `2px solid ${color}` : `1.5px solid ${C.mist}`, background: sel ? `${color}18` : C.white, cursor: "pointer", textAlign: "center", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 12, color: sel ? color : C.sage }}>{s}</div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={close} style={{ flex: 1, height: 48, borderRadius: 14, border: `1.5px solid ${C.mist}`, background: C.white, color: C.pine, fontWeight: 800, fontSize: 14, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Cancel
          </button>
          <motion.button whileHover={formValid ? { scale: 1.02, boxShadow: "0 8px 24px rgba(76,175,80,0.35)" } : {}} whileTap={formValid ? { scale: 0.98 } : {}}
            onClick={createEmployee} disabled={!formValid}
            style={{ flex: 2, height: 48, borderRadius: 14, border: "none", background: formValid ? `linear-gradient(135deg,${C.accent},${C.fern})` : "#C8E6C9", color: "#fff", fontWeight: 800, fontSize: 15, cursor: formValid ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            <CheckCircle2 size={18} /> Create Employee Account
          </motion.button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ─── Detail Modal ────────────────────────────────────────────── */
function DetailModal({ show, close, emp, onEdit }) {
  if (!show || !emp) return null;
  const role = normalizeRole(emp.role);
  const rc   = roleColors[role] || roleColors["Driver"];
  const ss   = getStatusStyle(emp.status);
  const initials = emp.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <ModalOverlay onClose={close} maxWidth={480}>
      <div style={{ padding: 28 }}>
        <ModalHeader title="Employee Profile" onClose={close} />

        <div style={{ background: `linear-gradient(135deg,${C.forest},${C.pine})`, borderRadius: 18, padding: "18px 20px", marginBottom: 18, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 54, height: 54, borderRadius: 16, background: rc.bg, border: `2px solid ${rc.bar}55`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, color: rc.color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {initials}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 17, color: "#fff", marginBottom: 4 }}>{emp.fullName}</div>
              <div style={{ fontSize: 13, color: rc.bar, fontWeight: 700 }}>{rc.icon} {role}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>@{emp.username} · {emp.id}</div>
            </div>
            <span style={{ padding: "4px 10px", borderRadius: 999, background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 11, fontWeight: 700 }}>{ss.label}</span>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {[
            ["📧 Email",   emp.email],
            ["📱 Phone",   emp.phone],
            ["🚗 Vehicle", emp.vehicle_no || "—"],
            ["✅ Tasks",   emp.tasksHandled],
          ].map(([label, val]) => (
            <div key={label} style={{ padding: "10px 12px", background: C.foam, borderRadius: 12, border: `1px solid ${C.mist}` }}>
              <div style={{ fontSize: 10, color: "#9AA89B", marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.forest }}>{val}</div>
            </div>
          ))}
        </div>

        <motion.button whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(76,175,80,0.3)" }} whileTap={{ scale: 0.98 }}
          onClick={() => { close(); onEdit(); }}
          style={{ width: "100%", height: 44, borderRadius: 12, border: "none", background: `linear-gradient(135deg,${C.accent},${C.fern})`, color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 14 }}>
          Edit Employee
        </motion.button>
      </div>
    </ModalOverlay>
  );
}

/* ─── Edit Modal ──────────────────────────────────────────────── */
function EditModal({ show, close, emp, setEmp, roles, updateEmployee }) {
  if (!show || !emp) return null;
  return (
    <ModalOverlay onClose={close}>
      <div style={{ padding: 28 }}>
        <ModalHeader title="Edit Employee" sub="Update employee details" onClose={close} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Field label="Full Name" value={emp.fullName} onChange={v => setEmp({ ...emp, fullName: v })} />
          <Field label="Username"  value={emp.username} onChange={v => setEmp({ ...emp, username: v })} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Field label="Email" value={emp.email} onChange={v => setEmp({ ...emp, email: v })} />
          <Field label="Phone" value={emp.phone} onChange={v => setEmp({ ...emp, phone: v })} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <FieldLabel>Role</FieldLabel>
            <select value={emp.role} onChange={e => setEmp({ ...emp, role: e.target.value })} style={mInp}>
              {roles.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <FieldLabel>Status</FieldLabel>
            <select value={emp.status} onChange={e => setEmp({ ...emp, status: e.target.value })} style={mInp}>
              <option>Active</option><option>Pending</option><option>Disabled</option>
            </select>
          </div>
        </div>

        {emp.role === "Driver" && (
          <div style={{ marginBottom: 14 }}>
            <Field label="Vehicle Number" value={emp.vehicle_no || ""} onChange={v => setEmp({ ...emp, vehicle_no: v })} />
          </div>
        )}

        <motion.button whileHover={{ scale: 1.02, boxShadow: "0 8px 24px rgba(76,175,80,0.3)" }} whileTap={{ scale: 0.98 }}
          onClick={updateEmployee}
          style={{ width: "100%", height: 50, borderRadius: 14, border: "none", background: `linear-gradient(135deg,${C.accent},${C.fern})`, color: "#fff", fontWeight: 900, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          <CheckCircle2 size={18} /> Save Changes
        </motion.button>
      </div>
    </ModalOverlay>
  );
}

/* ─── Shared Modal Primitives ─────────────────────────────────── */
function ModalOverlay({ children, onClose, maxWidth = 580 }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        style={{ position: "fixed", inset: 0, background: "rgba(10,20,12,0.5)", zIndex: 100, backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          style={{ width: "100%", maxWidth, maxHeight: "90vh", overflowY: "auto", background: C.white, borderRadius: 28, boxShadow: "0 32px 80px rgba(10,20,12,0.25)" }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ModalHeader({ title, sub, onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
      <div>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 900, color: C.forest }}>{title}</div>
        {sub && <div style={{ fontSize: 13, color: C.sage, marginTop: 4 }}>{sub}</div>}
      </div>
      <motion.button whileHover={{ rotate: 90, scale: 1.1 }} whileTap={{ scale: 0.9 }}
        onClick={onClose}
        style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${C.mist}`, background: C.foam, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <X size={16} color={C.sage} />
      </motion.button>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label style={{ fontSize: 11, color: C.sage, fontWeight: 700, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>{children}</label>;
}

function Field({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input type={type} placeholder={placeholder} value={value || ""} onChange={e => onChange(e.target.value)} style={mInp} />
    </div>
  );
}

function ResetPasswordModal({ emp, onClose, onConfirm, loading }) {
  if (!emp) return null;

  return (
    <ModalOverlay onClose={onClose} maxWidth={430}>
      <div style={{ padding: 28, textAlign: "center" }}>
        <div style={{ width: 62, height: 62, borderRadius: "50%", background: C.amberBg, color: C.amber, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>
          🔑
        </div>

        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 900, color: C.forest, marginBottom: 8 }}>
          Reset Password?
        </div>

        <p style={{ margin: "0 0 18px", color: C.sage, fontSize: 14, lineHeight: 1.6, fontWeight: 600 }}>
          Do you want to reset the password for{" "}
          <strong style={{ color: C.forest }}>{emp.fullName}</strong>?
          <br />
          The new password will become:
        </p>

        <div style={{ background: C.foam, border: `1.5px solid ${C.mist}`, borderRadius: 14, padding: "12px 16px", marginBottom: 22, fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 900, color: C.forest, letterSpacing: "0.08em" }}>
          12345
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{ flex: 1, height: 44, borderRadius: 12, border: `1.5px solid ${C.mist}`, background: C.white, color: C.pine, fontWeight: 800, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{ flex: 1.4, height: 44, borderRadius: 12, border: "none", background: C.amber, color: C.white, fontWeight: 900, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, fontFamily: "'Plus Jakarta Sans',sans-serif" }}
          >
            {loading ? "Resetting..." : "Yes, Reset"}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function OwnerEmployees() {
  const [employees,       setEmployees]       = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState("");
  const [roleFilter,      setRoleFilter]      = useState("All");
  const [statusFilter,    setStatusFilter]    = useState("All");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal,   setShowEditModal]   = useState(false);
  const [selectedEmployee,setSelectedEmployee]= useState(null);
  const [showPassword,    setShowPassword]    = useState(false);
  const [activeTab,       setActiveTab]       = useState("accounts");
  const [successMsg,      setSuccessMsg]      = useState("");
  const [resetTarget, setResetTarget] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: "", email: "", username: "", phone: "",
    role: "", tempPassword: "", status: "Pending", vehicle_no: ""
  });

  const roles = ["Farm Worker", "Driver"];

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API}/employees`);
      const data = res.data.map(e => ({
        id:           e.id,
        fullName:     e.full_name  || "—",
        email:        e.email      || "—",
        username:     e.username   || "—",
        phone:        e.phone      || "—",
        role:         e.role       || "—",
        status:       e.status     || "Active",
        vehicle_no:   e.vehicle_no || "",
        tasksHandled: Number(e.tasks_handled || 0),
      }));
      setEmployees(data);
    } catch (err) {
      console.error("Fetch employees error:", err);
      alert("Failed to fetch employees.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ fullName: "", email: "", username: "", phone: "", role: "", tempPassword: "", status: "Pending", vehicle_no: "" });
    setShowPassword(false);
  };

  const toast = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(""), 2800); };

  const formValid = form.fullName && form.email && form.username && form.role && form.tempPassword;

  const generatePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
    setForm(f => ({ ...f, tempPassword: Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("") }));
  };

  const createEmployee = async () => {
    if (!formValid) return;
    try {
      await axios.post(`${API}/employees`, {
        fullName: form.fullName, email: form.email, username: form.username,
        phone: form.phone, role: form.role, tempPassword: form.tempPassword,
        status: form.status, vehicle_no: form.role === "Driver" ? form.vehicle_no : null,
      });
      setShowCreateModal(false); resetForm(); fetchEmployees();
      toast("Employee account created successfully.");
    } catch (err) { console.error(err); alert("Failed to create employee."); }
  };

  const updateEmployee = async () => {
    if (!selectedEmployee) return;
    try {
      await axios.put(`${API}/employees/${selectedEmployee.id}`, {
        fullName:   selectedEmployee.fullName, email:    selectedEmployee.email,
        username:   selectedEmployee.username, phone:    selectedEmployee.phone,
        role:       selectedEmployee.role,     status:   selectedEmployee.status,
        vehicle_no: selectedEmployee.role === "Driver" ? selectedEmployee.vehicle_no : null,
      });
      setShowEditModal(false); setSelectedEmployee(null); fetchEmployees();
      toast("Employee updated successfully.");
    } catch (err) { console.error(err); alert("Failed to update employee."); }
  };

  const toggleStatus = async (emp) => {
    const isActive = String(emp.status).toUpperCase() === "ACTIVE";
    const nextStatus = isActive ? "Disabled" : "Active";
    try {
      await axios.patch(`${API}/employees/${emp.id}/status`, { status: nextStatus });
      fetchEmployees();
      toast(`Employee ${isActive ? "disabled" : "enabled"} successfully.`);
    } catch (err) { console.error(err); alert("Failed to update status."); }
  };

  const resetEmployeePassword = async () => {
  if (!resetTarget) return;

  try {
    setResetLoading(true);
    const res = await axios.patch(`${API}/employees/${resetTarget.id}/reset-password`);
    setResetTarget(null);
    toast(res.data?.message || "Password has been reset to 12345.");
  } catch (err) {
    console.error("Reset password error:", err);
    alert(err.response?.data?.message || err.response?.data?.error || "Failed to reset password.");
  } finally {
    setResetLoading(false);
  }
};

  const filtered = useMemo(() => employees.filter(e => {
    const s    = search.toLowerCase();
    const role = normalizeRole(e.role);
    const status = String(e.status).toUpperCase();
    return (
      (e.fullName.toLowerCase().includes(s) || e.email.toLowerCase().includes(s) || e.id.toLowerCase().includes(s) || e.username.toLowerCase().includes(s)) &&
      (roleFilter === "All" || role === roleFilter) &&
      (statusFilter === "All" || status === statusFilter.toUpperCase())
    );
  }), [employees, search, roleFilter, statusFilter]);

  const kpi = useMemo(() => ({
    total:    employees.length,
    active:   employees.filter(e => String(e.status).toUpperCase() === "ACTIVE").length,
    pending:  employees.filter(e => String(e.status).toUpperCase() === "PENDING").length,
    disabled: employees.filter(e => ["DISABLED","INACTIVE"].includes(String(e.status).toUpperCase())).length,
    roles:    [...new Set(employees.map(e => normalizeRole(e.role)))].length,
  }), [employees]);

  const roleSummary = useMemo(() => {
    const map = {};
    employees.forEach(e => { const r = normalizeRole(e.role); map[r] = (map[r] || 0) + 1; });
    return Object.entries(map).map(([role, count]) => ({ role, count })).sort((a,b) => b.count - a.count);
  }, [employees]);

  const kpiCards = [
    { title: "Total Employees",   value: kpi.total,    sub: `All registered accounts`,          accent: "#3B82F6", lightBg: C.blueBg,   icon: "👥" },
    { title: "Active",            value: kpi.active,   sub: "Can login right now",               accent: C.fern,    lightBg: C.green,    icon: "✅" },
    { title: "Pending Accounts",  value: kpi.pending,  sub: "Created but not active",            accent: C.amber,   lightBg: C.amberBg,  icon: "🕐" },
    { title: "Disabled",          value: kpi.disabled, sub: "Login access revoked",              accent: C.red,     lightBg: C.redBg,    icon: "🔒" },
    { title: "Roles Assigned",    value: kpi.roles,    sub: "Unique roles in system",            accent: C.purple,  lightBg: C.purpleBg, icon: "🎭" },
  ];

  const resetFilters = () => { setSearch(""); setRoleFilter("All"); setStatusFilter("All"); };
  const hasFilters   = search || roleFilter !== "All" || statusFilter !== "All";

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", gap: 14, alignItems: "center", justifyContent: "center", background: C.foam, fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.sage }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
        <Activity size={36} color={C.fern} />
      </motion.div>
      <span style={{ fontWeight: 700, fontSize: 16 }}>Loading employees…</span>
    </div>
  );

  return (
    <div style={{ padding: 24, background: C.foam, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 8, height: 36, borderRadius: 99, background: `linear-gradient(180deg,${C.accent},${C.fern})` }} />
              <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 32, fontWeight: 900, color: C.forest, margin: 0, letterSpacing: "-0.03em" }}>
                Employee Management
              </h1>
            </div>
            <p style={{ color: C.sage, fontSize: 14, margin: "0 0 0 18px", fontWeight: 500 }}>
              Manage Farm Worker and Driver accounts, login access and activity.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 8px 24px rgba(76,175,80,0.35)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowCreateModal(true)}
            style={{ height: 48, padding: "0 22px", borderRadius: 14, border: "none", background: `linear-gradient(135deg,${C.accent},${C.fern})`, color: C.white, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 15, boxShadow: "0 6px 20px rgba(76,175,80,0.28)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            <Plus size={19} strokeWidth={2.5} /> Create Account
          </motion.button>
        </div>

        {/* ── KPI Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 26 }}>
          {kpiCards.map((c, i) => <KpiCard key={c.title} {...c} delay={i * 0.07} />)}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["accounts", "👤 Accounts"], ["activity", "📋 Activity"]].map(([tab, label]) => (
            <motion.button key={tab} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab)}
              style={{ padding: "10px 20px", borderRadius: 12, border: activeTab === tab ? "none" : `1.5px solid ${C.mist}`, background: activeTab === tab ? `linear-gradient(135deg,${C.accent},${C.fern})` : C.white, color: activeTab === tab ? "#fff" : C.pine, fontWeight: 800, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              {label}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ─── Accounts Tab ── */}
          {activeTab === "accounts" && (
            <motion.div key="accounts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

              {/* Filter Bar */}
              <motion.div style={{ background: C.white, borderRadius: 22, padding: "16px 20px", border: `1.5px solid ${C.mist}`, boxShadow: "0 4px 20px rgba(16,33,20,0.07)", marginBottom: 16 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr auto", gap: 14, alignItems: "end" }}>
                  <div>
                    <label style={lbl}>Search</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, height: 44, border: `1.5px solid ${C.mist}`, borderRadius: 12, padding: "0 13px", background: C.foam }}>
                      <Search size={15} color={C.sage} />
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, email or username…"
                        style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 14, color: C.forest, fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
                    </div>
                  </div>
                  <div>
                    <label style={lbl}>Role</label>
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                      style={{ width: "100%", height: 44, border: `1.5px solid ${C.mist}`, borderRadius: 12, padding: "0 12px", fontSize: 14, outline: "none", background: C.white, color: C.forest, fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      <option>All</option>
                      {roles.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Status</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                      style={{ width: "100%", height: 44, border: `1.5px solid ${C.mist}`, borderRadius: 12, padding: "0 12px", fontSize: 14, outline: "none", background: C.white, color: C.forest, fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      <option>All</option><option>Active</option><option>Pending</option><option>Disabled</option>
                    </select>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={resetFilters}
                    style={{ height: 44, padding: "0 16px", borderRadius: 12, border: `1.5px solid ${hasFilters ? C.accent : C.mist}`, background: hasFilters ? C.green : C.white, color: hasFilters ? C.fern : C.pine, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif", transition: "all .15s" }}>
                    <Filter size={14} /> Reset
                  </motion.button>
                </div>
              </motion.div>

              {/* Role summary pills */}
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
                {roleSummary.map(rs => {
                  const rc = roleColors[rs.role] || roleColors["Driver"];
                  return (
                    <div key={rs.role} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, background: rc.bg, border: `1px solid ${rc.bar}33` }}>
                      <span style={{ fontSize: 14 }}>{rc.icon}</span>
                      <span style={{ fontWeight: 800, fontSize: 13, color: rc.color }}>{rs.role}</span>
                      <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 900, fontSize: 14, color: rc.color }}>{rs.count}</span>
                    </div>
                  );
                })}
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 999, background: C.foam, border: `1px solid ${C.mist}` }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: C.sage }}>Showing:</span>
                  <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 900, fontSize: 14, color: C.forest }}>{filtered.length} / {employees.length}</span>
                </div>
              </div>

              {/* Employee cards grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 18, marginBottom: 20 }}>
                {filtered.map((emp, i) => (
                  <EmployeeCard
                    key={emp.id}
                    emp={emp}
                    index={i}
                    onView={() => { setSelectedEmployee(emp); setShowDetailModal(true); }}
                    onEdit={() => { setSelectedEmployee({ ...emp, role: normalizeRole(emp.role) }); setShowEditModal(true); }}
                    onToggle={() => toggleStatus(emp)}
                    onResetPassword={() => setResetTarget(emp)}
                  />
                ))}

                {/* Add card */}
                <motion.div
                  whileHover={{ scale: 1.02, boxShadow: "0 12px 32px rgba(76,175,80,0.15)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCreateModal(true)}
                  style={{ background: C.foam, borderRadius: 24, padding: 24, border: `2px dashed #C8E6C9`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, minHeight: 280 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: C.green, border: `2px solid ${C.accent}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>➕</div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: C.fern, textAlign: "center" }}>Create New Account</div>
                  <div style={{ fontSize: 12, color: "#9AA89B", textAlign: "center", lineHeight: 1.6 }}>Add a Farm Worker or Driver with login credentials</div>
                </motion.div>
              </div>

              {filtered.length === 0 && employees.length > 0 && (
                <div style={{ textAlign: "center", padding: "52px 0", color: C.sage }}>
                  <Users size={40} color={C.mist} style={{ marginBottom: 12 }} />
                  <div style={{ fontWeight: 700 }}>No employees match your filters.</div>
                  <button onClick={resetFilters} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 10, border: `1.5px solid ${C.accent}`, background: C.green, color: C.fern, fontWeight: 800, cursor: "pointer", fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                    Clear Filters
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── Activity Tab ── */}
          {activeTab === "activity" && (
            <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <motion.div
                style={{ background: C.white, borderRadius: 24, padding: "22px 24px", border: `1.5px solid ${C.mist}`, boxShadow: "0 4px 20px rgba(16,33,20,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <div style={{ width: 6, height: 28, borderRadius: 99, background: `linear-gradient(180deg,${C.accent},${C.fern})` }} />
                  <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800, color: C.forest }}>Login Access Status</div>
                </div>
                <div style={{ fontSize: 12, color: C.sage, marginBottom: 20, marginLeft: 16 }}>Real employee account status from database</div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                    <thead>
                      <tr style={{ background: C.foam }}>
                        {["Employee", "Role", "Status", "Tasks", "Access"].map(h => (
                          <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontSize: 11, fontWeight: 800, color: C.sage, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {employees.map((emp, i) => {
                        const role = normalizeRole(emp.role);
                        const rc   = roleColors[role] || roleColors["Driver"];
                        const ss   = getStatusStyle(emp.status);
                        const isActive = String(emp.status).toUpperCase() === "ACTIVE";
                        return (
                          <motion.tr key={emp.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                            style={{ borderTop: `1px solid ${C.mist}` }}>
                            <td style={{ padding: "12px 10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 34, height: 34, borderRadius: 10, background: rc.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: rc.color, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                                  {emp.fullName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 800, fontSize: 13, color: C.forest }}>{emp.fullName}</div>
                                  <div style={{ fontSize: 11, color: "#9AA89B" }}>@{emp.username}</div>
                                </div>
                              </div>
                            </td>
                            <td style={tdc}><span style={{ padding: "3px 8px", borderRadius: 999, background: rc.bg, color: rc.color, fontSize: 11, fontWeight: 700 }}>{rc.icon} {role}</span></td>
                            <td style={tdc}><span style={{ padding: "3px 8px", borderRadius: 999, background: ss.bg, color: ss.color, fontSize: 11, fontWeight: 700 }}>{ss.label}</span></td>
                            <td style={{ ...tdc, fontWeight: 900, color: C.fern }}>{emp.tasksHandled}</td>
                            <td style={tdc}>
                              <span style={{ padding: "4px 10px", borderRadius: 8, background: isActive ? C.green : C.redBg, color: isActive ? C.fern : C.red, fontSize: 11, fontWeight: 700 }}>
                                {isActive ? "✅ Can Login" : "🔒 Blocked"}
                              </span>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </motion.div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateModal
            show={showCreateModal}
            close={() => { setShowCreateModal(false); resetForm(); }}
            form={form} setForm={setForm} roles={roles}
            formValid={formValid}
            showPassword={showPassword} setShowPassword={setShowPassword}
            generatePassword={generatePassword}
            createEmployee={createEmployee}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetailModal && (
          <DetailModal
            show={showDetailModal}
            close={() => setShowDetailModal(false)}
            emp={selectedEmployee}
            onEdit={() => { setShowEditModal(true); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && (
          <EditModal
            show={showEditModal}
            close={() => { setShowEditModal(false); setSelectedEmployee(null); }}
            emp={selectedEmployee} setEmp={setSelectedEmployee}
            roles={roles}
            updateEmployee={updateEmployee}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
      {resetTarget && (
        <ResetPasswordModal
          emp={resetTarget}
          loading={resetLoading}
          onClose={() => setResetTarget(null)}
          onConfirm={resetEmployeePassword}
        />
      )}
    </AnimatePresence>

      <AnimatePresence>
        {successMsg && <SuccessToast message={successMsg} />}
      </AnimatePresence>
    </div>
  );
}

/* ─── Style constants ─────────────────────────────────────────── */
const lbl = {
  fontSize: 11, color: C.sage, fontWeight: 700, display: "block",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};
const tdc  = { padding: "12px 10px", color: "#4B5E4F", fontSize: 13, whiteSpace: "nowrap" };
const mInp = {
  width: "100%", height: 46, border: `1.5px solid ${C.mist}`, borderRadius: 12,
  padding: "0 14px", fontSize: 14, outline: "none", background: C.white,
  boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.forest,
};