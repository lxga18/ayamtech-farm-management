import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  Package,
  Search,
  Filter,
  ChevronDown,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  X,
  Droplet,
  Pill,
  Heart,
  Eye,
  Download,
  TrendingUp,
  Wheat,
  Syringe,
  ArrowUpDown,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  bg: "#F0F4EC",
  surface: "#FFFFFF",
  surfaceGlass: "rgba(255,255,255,0.72)",
  border: "#DCE8D2",
  borderStrong: "#C5D9B8",

  green: "#3A9E48",
  greenDark: "#1B5E2A",
  greenMid: "#2D7A3A",
  greenDim: "#E6F4E9",
  greenGlow: "rgba(58,158,72,0.15)",

  amber: "#D97706",
  amberDim: "#FEF3C7",

  red: "#DC2626",
  redMid: "#B91C1C",
  redDim: "#FEE2E2",
  redGlow: "rgba(220,38,38,0.12)",

  blue: "#2563EB",
  blueDim: "#DBEAFE",
  blueGlow: "rgba(37,99,235,0.12)",

  purple: "#7C3AED",
  purpleDim: "#EDE9FE",

  teal: "#0F766E",
  tealDim: "#CCFBF1",

  text: "#0D1F10",
  textMid: "#4A6651",
  textLight: "#8BA890",

  sans: "'Plus Jakarta Sans', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'Inter', monospace",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const ease = [0.22, 1, 0.36, 1];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease },
});

const PAGE_SIZE = 6;

function n(value, digits = 0) {
  return Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
function money(value) {
  return `RM ${n(value, 2)}`;
}
function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function formatLastFeed(value) {
  if (!value) return "No feed recorded yet";
  const d = new Date(value);
  const today = new Date();
  const diff = Math.floor(
    (today.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) / 86400000
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}
function parseArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}
function statusStyle(status, highMortality = false) {
  if (highMortality) return { bg: C.redDim, color: C.red, label: "Mortality Alert", dot: "#DC2626" };
  if (status === "Ready for Sale") return { bg: C.tealDim, color: C.teal, label: "Ready", dot: "#0F766E" };
  if (status === "Sold") return { bg: C.blueDim, color: C.blue, label: "Sold", dot: "#2563EB" };
  return { bg: C.greenDim, color: C.greenDark, label: "Growing", dot: "#3A9E48" };
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const th = {
  padding: "11px 14px",
  textAlign: "left",
  color: C.greenDark,
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: ".06em",
  textTransform: "uppercase",
  borderBottom: `1.5px solid ${C.border}`,
  background: C.greenDim,
};
const td = {
  padding: "11px 14px",
  borderBottom: `1px solid ${C.border}`,
  color: C.textMid,
  fontSize: 12,
};

const selectStyle = {
  width: "100%",
  height: 46,
  border: `1.5px solid ${C.border}`,
  borderRadius: 14,
  padding: "0 14px 0 40px",
  fontFamily: C.sans,
  fontWeight: 600,
  fontSize: 13,
  color: C.text,
  background: C.surface,
  boxSizing: "border-box",
  cursor: "pointer",
  appearance: "none",
  WebkitAppearance: "none",
};

function pageBtn(disabled) {
  return {
    width: 36,
    height: 36,
    borderRadius: 10,
    border: `1.5px solid ${C.border}`,
    background: disabled ? C.bg : C.surface,
    color: disabled ? C.textLight : C.text,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  };
}

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatBox({ icon: Icon, label, value, color, bg, accent }) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: `0 20px 50px ${accent || "rgba(15,31,18,.10)"}` }}
      transition={{ duration: 0.25, ease }}
      style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 20,
        padding: "20px 22px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 4px 18px rgba(15,31,18,.05)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: bg,
          opacity: 0.4,
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ fontSize: 11, color: C.textMid, fontWeight: 700, letterSpacing: ".07em", textTransform: "uppercase", marginBottom: 8 }}>
          {label}
        </div>
        <div style={{ fontFamily: C.sans, fontSize: 30, fontWeight: 800, color: C.text, lineHeight: 1 }}>{value}</div>
      </div>
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: 16,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
          zIndex: 1,
          boxShadow: `0 4px 14px ${accent || "transparent"}`,
        }}
      >
        <Icon size={22} color={color} strokeWidth={2} />
      </div>
    </motion.div>
  );
}

function SmallMetric({ icon, value, label, bg = C.bg, color = C.text }) {
  return (
    <div
      style={{
        background: bg,
        borderRadius: 14,
        padding: "13px 14px",
        minHeight: 72,
        border: `1px solid ${C.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <div style={{ fontFamily: C.sans, fontSize: 14, fontWeight: 800, color, lineHeight: 1.2 }}>{value}</div>
      </div>
      <div style={{ fontSize: 10, color: C.textLight, textTransform: "uppercase", letterSpacing: ".07em", fontWeight: 700 }}>{label}</div>
    </div>
  );
}

function ActionButton({ label, icon, color, bg, onClick, fullWidth = false }) {
  return (
    <motion.button
      whileHover={{ scale: 1.04, boxShadow: `0 6px 18px ${color}30` }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        border: `1.5px solid ${color}35`,
        background: bg,
        color,
        borderRadius: 12,
        padding: "9px 14px",
        display: "flex",
        alignItems: "center",
        gap: 7,
        fontFamily: C.sans,
        fontWeight: 700,
        fontSize: 12,
        cursor: "pointer",
        transition: "all 0.2s",
        flexGrow: fullWidth ? 1 : 0,
        justifyContent: fullWidth ? "center" : "flex-start",
      }}
    >
      {icon} {label}
    </motion.button>
  );
}

function DetailLine({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 14,
        padding: "8px 0",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <span style={{ color: C.textMid, fontSize: 12, fontWeight: 500 }}>{label}</span>
      <strong style={{ color: C.text, fontSize: 12, textAlign: "right", fontWeight: 700 }}>{value}</strong>
    </div>
  );
}

function DetailPanel({ title, icon, children }) {
  return (
    <div
      style={{
        border: `1.5px solid ${C.border}`,
        borderRadius: 18,
        padding: 18,
        background: C.surface,
        boxShadow: "0 2px 12px rgba(15,31,18,.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div
          style={{
            fontFamily: C.sans,
            fontWeight: 800,
            fontSize: 12,
            color: C.text,
            textTransform: "uppercase",
            letterSpacing: ".06em",
          }}
        >
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Batch Card ───────────────────────────────────────────────────────────────
function BatchCard({ batch, onView, onGo }) {
  const s = statusStyle(batch.batch_status, batch.high_mortality);
  const mortalityRate = Number(batch.mortality_rate || 0);
  const daysLeft = Number(batch.days_left || 0);

  return (
    <motion.div
      {...fadeUp(0.02)}
      whileHover={{ y: -5, boxShadow: "0 24px 56px rgba(15,31,18,.12)" }}
      transition={{ duration: 0.3, ease }}
      style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 6px 24px rgba(15,31,18,.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* subtle top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: batch.high_mortality
            ? `linear-gradient(90deg, ${C.red}, ${C.redMid})`
            : batch.batch_status === "Ready for Sale"
            ? `linear-gradient(90deg, ${C.teal}, #14B8A6)`
            : `linear-gradient(90deg, ${C.green}, ${C.greenMid})`,
          borderRadius: "24px 24px 0 0",
        }}
      />

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, paddingTop: 4 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{ fontFamily: C.sans, fontSize: 20, fontWeight: 800, color: C.blue, letterSpacing: "-0.3px" }}>
              {batch.batch_id}
            </div>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 11px",
                borderRadius: 999,
                background: s.bg,
                color: s.color,
                fontSize: 11,
                fontWeight: 700,
                border: `1px solid ${s.color}28`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: s.dot,
                  display: "inline-block",
                  boxShadow: `0 0 0 2px ${s.dot}40`,
                }}
              />
              {s.label}
            </span>
          </div>
          <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.6, maxWidth: 320 }}>
            {batch.notes || "No notes added for this batch."}
          </div>
        </div>
        <div
          style={{
            textAlign: "right",
            background: C.bg,
            borderRadius: 16,
            padding: "10px 16px",
            border: `1px solid ${C.border}`,
          }}
        >
          <div style={{ fontFamily: C.sans, fontSize: 28, fontWeight: 800, color: C.text, lineHeight: 1 }}>{batch.age_days || 0}</div>
          <div style={{ fontSize: 11, color: C.textLight, fontWeight: 600, marginTop: 2 }}>days old</div>
        </div>
      </div>

      {/* ── Batch Statistics ── */}
      <div style={{ background: C.bg, borderRadius: 18, padding: 16, marginBottom: 16, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <TrendingUp size={14} color={C.green} strokeWidth={2.5} />
          <span style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 12, color: C.text, textTransform: "uppercase", letterSpacing: ".06em" }}>
            Batch Statistics
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          <SmallMetric icon="🐤" value={n(batch.total_chicks)} label="Total Chicks" />
          <SmallMetric
            icon="💀"
            value={`${n(batch.total_deaths)} (${mortalityRate}%)`}
            label="Deaths"
            bg={batch.high_mortality ? C.redDim : C.surface}
            color={batch.high_mortality ? C.red : C.text}
          />
          <SmallMetric icon="🌾" value={`${n(batch.total_feed_kg)}kg`} label="Feed Used" />
          <SmallMetric icon="💊" value={money(batch.total_medication_cost)} label="Med Cost" />
        </div>
      </div>

      {/* ── Timeline + Notes ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginBottom: 16 }}>
        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: C.sans,
              fontWeight: 800,
              fontSize: 12,
              color: C.text,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              marginBottom: 10,
            }}
          >
            <CalendarDays size={14} color={C.blue} strokeWidth={2.5} /> Timeline
          </div>
          <div style={{ fontSize: 12, color: C.textMid, lineHeight: 1.9 }}>
            <div>
              Start:{" "}
              <strong style={{ color: C.text, fontWeight: 700 }}>{formatDate(batch.start_date)}</strong>
            </div>
            <div>
              Expected Harvest:{" "}
              <strong style={{ color: C.text, fontWeight: 700 }}>{formatDate(batch.end_date)}</strong>{" "}
              {batch.batch_status !== "Sold" && (
                <span style={{ color: daysLeft < 0 ? C.red : C.textLight }}>
                  {daysLeft >= 0 ? `(${daysLeft} days left)` : `(${Math.abs(daysLeft)} days overdue)`}
                </span>
              )}
            </div>
            <div>
              Last Feed:{" "}
              <strong style={{ color: C.text, fontWeight: 700 }}>{formatLastFeed(batch.last_feed_date)}</strong>
            </div>
          </div>
        </section>

        <section>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: C.sans,
              fontWeight: 800,
              fontSize: 12,
              color: C.text,
              textTransform: "uppercase",
              letterSpacing: ".06em",
              marginBottom: 10,
            }}
          >
            <Info size={14} color={C.purple} strokeWidth={2.5} /> Recent Notes
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.textMid,
              lineHeight: 1.7,
              background: C.bg,
              borderRadius: 12,
              padding: "11px 13px",
              borderLeft: `3px solid ${C.purple}40`,
              fontStyle: "italic",
            }}
          >
            "{batch.notes || "No recent notes available."}"
          </div>
        </section>
      </div>

      {/* ── Alert Banner ── */}
      {batch.high_mortality ? (
        <div
          style={{
            background: C.redDim,
            color: C.red,
            borderRadius: 14,
            padding: "11px 14px",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 16,
            border: `1px solid ${C.red}28`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          🔴 High mortality detected — investigate this batch immediately.
        </div>
      ) : batch.batch_status === "Ready for Sale" ? (
        <div
          style={{
            background: C.tealDim,
            color: C.teal,
            borderRadius: 14,
            padding: "11px 14px",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 16,
            border: `1px solid ${C.teal}28`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          🟢 Ready for harvest — notify the owner for sale process.
        </div>
      ) : (
        <div
          style={{
            background: C.greenDim,
            color: C.greenDark,
            borderRadius: 14,
            padding: "11px 14px",
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 16,
            border: `1px solid ${C.green}28`,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          ✅ Batch is active and currently growing.
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
        <ActionButton
          label="Add Feed"
          icon={<Droplet size={14} strokeWidth={2.5} />}
          color={C.green}
          bg={C.greenDim}
          onClick={() => onGo("/worker/feed", batch.batch_id)}
        />
        <ActionButton
          label="Add Med"
          icon={<Pill size={14} strokeWidth={2.5} />}
          color={C.purple}
          bg={C.purpleDim}
          onClick={() => onGo("/worker/medication", batch.batch_id)}
        />
        <ActionButton
          label="Record Death"
          icon={<Heart size={14} strokeWidth={2.5} />}
          color={C.red}
          bg={C.redDim}
          onClick={() => onGo("/worker/mortality", batch.batch_id)}
        />
        <ActionButton
          label="View Details"
          icon={<Eye size={14} strokeWidth={2.5} />}
          color={C.blue}
          bg={C.blueDim}
          onClick={() => onView(batch)}
        />
      </div>
    </motion.div>
  );
}

// ─── Details Modal ────────────────────────────────────────────────────────────
function BatchDetailsModal({ batch, loading, onClose, onGo, onExport }) {
  const meds = parseArray(batch?.medication_history);
  const daily = parseArray(batch?.daily_activity_log);
  if (!batch) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 700,
          background: "rgba(8,20,10,.65)",
          backdropFilter: "blur(10px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 30, scale: 0.93 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.93 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "min(980px, 100%)",
            maxHeight: "88vh",
            background: C.bg,
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 50px 120px rgba(0,0,0,.38)",
            display: "flex",
            flexDirection: "column",
            border: `1.5px solid ${C.border}`,
          }}
        >
          {/* Modal Header */}
          <div
            style={{
              background: `linear-gradient(135deg, ${C.greenDark} 0%, #0F3D1A 100%)`,
              padding: "22px 26px",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexShrink: 0,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", right: -60, top: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,.05)" }} />
            <div style={{ position: "absolute", right: 40, bottom: -80, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.04)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 20, letterSpacing: "-0.3px" }}>
                Batch {batch.batch_id} — Full Details
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.62)", marginTop: 4, fontWeight: 500 }}>
                Complete operational summary for this farm batch
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, background: "rgba(255,255,255,.25)" }}
              whileTap={{ scale: 0.94 }}
              onClick={onClose}
              style={{
                width: 40,
                height: 40,
                borderRadius: 13,
                border: "none",
                background: "rgba(255,255,255,.15)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                zIndex: 1,
                transition: "background 0.2s",
              }}
            >
              <X size={18} color="#fff" strokeWidth={2.5} />
            </motion.button>
          </div>

          {/* Modal Body */}
          <div style={{ padding: 22, overflowY: "auto", flex: 1 }}>
            {loading ? (
              <div style={{ padding: 70, textAlign: "center", color: C.textMid, fontWeight: 700 }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    border: `3px solid ${C.border}`,
                    borderTopColor: C.green,
                    margin: "0 auto 16px",
                  }}
                />
                Loading batch details…
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <DetailPanel title="Basic Information" icon="📦">
                  <DetailLine label="Batch ID" value={batch.batch_id} />
                  <DetailLine label="Status" value={batch.batch_status} />
                  <DetailLine label="Start Date" value={formatDate(batch.start_date)} />
                  <DetailLine label="Expected Harvest" value={formatDate(batch.end_date)} />
                  <DetailLine label="Age" value={`${batch.age_days || 0} days`} />
                  <DetailLine label="Created By" value={batch.created_by || "—"} />
                </DetailPanel>

                <DetailPanel title="Population Tracking" icon="🐤">
                  <DetailLine label="Initial Chicks" value={n(batch.total_chicks)} />
                  <DetailLine label="Current Alive" value={n(batch.current_alive)} />
                  <DetailLine label="Total Deaths" value={n(batch.total_deaths)} />
                  <DetailLine label="Mortality Rate" value={`${batch.mortality_rate || 0}%`} />
                  <DetailLine label="Mortality Alert" value={batch.high_mortality ? "⚠️ Yes — investigate" : "✅ No"} />
                </DetailPanel>

                <DetailPanel title="Feed Consumption" icon="🌾">
                  <DetailLine label="Total Feed Used" value={`${n(batch.total_feed_kg)} kg`} />
                  <DetailLine label="Average per Day" value={`${n(batch.avg_feed_per_day, 2)} kg`} />
                  <DetailLine label="Total Feed Cost" value={money(batch.total_feed_cost)} />
                  <DetailLine label="Last Feed" value={formatLastFeed(batch.last_feed_date)} />
                </DetailPanel>

                <DetailPanel title="Medication History" icon="💊">
                  {meds.length === 0 ? (
                    <div style={{ fontSize: 12, color: C.textMid, fontStyle: "italic" }}>No medication records found.</div>
                  ) : (
                    meds.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "10px 0",
                          borderBottom: idx < meds.length - 1 ? `1px solid ${C.border}` : "none",
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                          {formatDate(m.date)}: {m.medication_name || "Medication"}
                        </div>
                        <div style={{ fontSize: 11, color: C.textMid, marginTop: 3 }}>
                          {m.dosage || "—"} · {money(m.cost)} {m.remark ? `· ${m.remark}` : ""}
                        </div>
                      </div>
                    ))
                  )}
                </DetailPanel>

                <div style={{ gridColumn: "1 / -1" }}>
                  <DetailPanel title="Daily Activity Log" icon="📋">
                    <div style={{ overflowX: "auto", borderRadius: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr>
                            <th style={th}>Date</th>
                            <th style={th}>Feed (kg)</th>
                            <th style={th}>Mortality</th>
                            <th style={th}>Medication</th>
                          </tr>
                        </thead>
                        <tbody>
                          {daily.length === 0 ? (
                            <tr>
                              <td colSpan="4" style={{ padding: 22, textAlign: "center", color: C.textMid, fontStyle: "italic" }}>
                                No activity found.
                              </td>
                            </tr>
                          ) : (
                            daily.map((row, idx) => (
                              <tr
                                key={idx}
                                style={{ background: idx % 2 === 0 ? C.surface : C.bg }}
                              >
                                <td style={td}>{formatDate(row.date)}</td>
                                <td style={td}>{n(row.feed_kg)}</td>
                                <td style={td}>{n(row.mortality)}</td>
                                <td style={td}>{row.medication || "—"}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </DetailPanel>
                </div>

                <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <ActionButton
                    label="Add Feed"
                    icon={<Droplet size={14} strokeWidth={2.5} />}
                    color={C.green}
                    bg={C.greenDim}
                    onClick={() => onGo("/worker/feed", batch.batch_id)}
                  />
                  <ActionButton
                    label="Add Med"
                    icon={<Pill size={14} strokeWidth={2.5} />}
                    color={C.purple}
                    bg={C.purpleDim}
                    onClick={() => onGo("/worker/medication", batch.batch_id)}
                  />
                  <ActionButton
                    label="Record Death"
                    icon={<Heart size={14} strokeWidth={2.5} />}
                    color={C.red}
                    bg={C.redDim}
                    onClick={() => onGo("/worker/mortality", batch.batch_id)}
                  />
                  <ActionButton
                    label="Export Report"
                    icon={<Download size={14} strokeWidth={2.5} />}
                    color={C.blue}
                    bg={C.blueDim}
                    onClick={() => onExport(batch)}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WorkerBatchManagement() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [sortBy, setSortBy] = useState("Latest");
  const [page, setPage] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, status, sortBy]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      const res = await API.get("/worker/all-batches");
      setBatches(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const stats = useMemo(() => ({
    total: batches.length,
    growing: batches.filter((b) => b.batch_status === "Growing").length,
    ready: batches.filter((b) => b.batch_status === "Ready for Sale").length,
    sold: batches.filter((b) => b.batch_status === "Sold").length,
  }), [batches]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = batches.filter((b) => {
      const matchesSearch =
        !q ||
        String(b.batch_id || "").toLowerCase().includes(q) ||
        String(b.notes || "").toLowerCase().includes(q);
      const matchesStatus = status === "All" || b.batch_status === status;
      return matchesSearch && matchesStatus;
    });
    result.sort((a, b) => {
      if (sortBy === "Oldest") return new Date(a.start_date || 0) - new Date(b.start_date || 0);
      if (sortBy === "Age") return Number(b.age_days || 0) - Number(a.age_days || 0);
      if (sortBy === "Mortality") return Number(b.mortality_rate || 0) - Number(a.mortality_rate || 0);
      return new Date(b.start_date || 0) - new Date(a.start_date || 0);
    });
    return result;
  }, [batches, search, status, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goTo = (path, batchId) => {
    if (!path || !batchId) return;

    // Pass batch_id using both query string and route state.
    // Query string is used by the form page to auto-select the batch.
    navigate(`${path}?batch_id=${encodeURIComponent(batchId)}`, {
      state: { batch_id: batchId, batchId },
    });
  };

  const openDetails = async (batch) => {
    setSelectedBatch(batch);
    setDetailsLoading(true);
    try {
      const res = await API.get(`/worker/batches/${encodeURIComponent(batch.batch_id)}/details`);
      setSelectedBatch(res.data);
    } catch (err) {
      console.error("Failed to fetch batch details:", err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const exportReport = (batch) => {
    const rows = [
      ["Batch ID", batch.batch_id],
      ["Status", batch.batch_status],
      ["Total Chicks", batch.total_chicks],
      ["Current Alive", batch.current_alive],
      ["Total Deaths", batch.total_deaths],
      ["Mortality Rate", `${batch.mortality_rate || 0}%`],
      ["Total Feed Used", `${batch.total_feed_kg || 0} kg`],
      ["Total Feed Cost", batch.total_feed_cost || 0],
      ["Total Medication Cost", batch.total_medication_cost || 0],
      ["Start Date", formatDate(batch.start_date)],
      ["Expected Harvest", formatDate(batch.end_date)],
      ["Notes", batch.notes || ""],
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${batch.batch_id}_report.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        fontFamily: C.sans,
        color: C.text,
        paddingBottom: 60,
      }}
    >
      {/* ── Google Fonts ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800;900&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .input-focus:focus {
          outline: none;
          border-color: ${C.green} !important;
          box-shadow: 0 0 0 4px ${C.green}18;
        }
        .select-focus:focus {
          outline: none;
          border-color: ${C.green} !important;
          box-shadow: 0 0 0 4px ${C.green}18;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${C.borderStrong}; border-radius: 6px; }

        /* Zebra row hover */
        .activity-row:hover td { background: ${C.greenDim} !important; }

        @media (max-width: 1100px) {
          .batch-grid { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 700px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .filters { grid-template-columns: 1fr !important; }
          .modal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ── Sticky Navbar ── */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
          background: "rgba(240,244,236,.92)",
          backdropFilter: "blur(16px)",
          borderBottom: `1px solid ${C.border}`,
          boxShadow: "0 1px 0 rgba(15,31,18,.06)",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            height: 68,
            padding: "0 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 15,
                background: `linear-gradient(140deg, ${C.green} 0%, ${C.greenDark} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 6px 18px ${C.green}45`,
              }}
            >
              <Package size={22} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 16, letterSpacing: "-0.2px", color: C.text }}>
                AyamTech
              </div>
              <div style={{ fontSize: 10, color: C.textMid, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>
                Batch Management
              </div>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={fetchBatches}
            disabled={refreshing}
            style={{
              border: `1.5px solid ${C.border}`,
              background: C.surface,
              borderRadius: 13,
              padding: "9px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: C.sans,
              fontWeight: 700,
              fontSize: 12,
              color: C.text,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(15,31,18,.05)",
            }}
          >
            <motion.span
              animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
              transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : {}}
              style={{ display: "flex" }}
            >
              <RefreshCw size={14} strokeWidth={2.5} />
            </motion.span>
            {refreshing ? "Refreshing…" : "Refresh"}
          </motion.button>
        </div>
      </div>

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "30px 32px 0" }}>

        {/* ── Hero Banner ── */}
        <motion.section
          {...fadeUp(0.04)}
          style={{
            background: `linear-gradient(135deg, ${C.greenDark} 0%, #0D3516 60%, #0B2E12 100%)`,
            borderRadius: 28,
            padding: "30px 36px",
            color: "#fff",
            marginBottom: 22,
            position: "relative",
            overflow: "hidden",
            boxShadow: `0 16px 48px ${C.greenDark}55`,
          }}
        >
          {/* decorative circles */}
          <div style={{ position: "absolute", right: -50, top: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,.05)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 100, bottom: -100, width: 180, height: 180, borderRadius: "50%", background: "rgba(255,255,255,.04)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", left: -30, bottom: -40, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,255,255,.03)", pointerEvents: "none" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              alignItems: "flex-start",
              position: "relative",
              zIndex: 2,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <Package size={26} color="rgba(255,255,255,.9)" strokeWidth={2} />
                <h1
                  style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 800,
                    letterSpacing: "-0.6px",
                    fontFamily: C.sans,
                  }}
                >
                  Batch Management
                </h1>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,.65)", fontWeight: 500, maxWidth: 420, lineHeight: 1.6 }}>
                View and manage all active poultry batches. Track feed, mortality, medications and more.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                background: "rgba(255,255,255,.1)",
                border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 18,
                padding: "14px 20px",
                backdropFilter: "blur(8px)",
                flexShrink: 0,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{stats.total}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".07em" }}>Batches</div>
              </div>
              <div style={{ width: 1, height: 36, background: "rgba(255,255,255,.2)" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{stats.sold}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.6)", marginTop: 4, textTransform: "uppercase", letterSpacing: ".07em" }}>Sold</div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── Stat Cards ── */}
        <section className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 22 }}>
          <motion.div {...fadeUp(0.08)}>
            <StatBox icon={Package} label="Total Batches" value={stats.total} color={C.blue} bg={C.blueDim} accent={C.blueGlow} />
          </motion.div>
          <motion.div {...fadeUp(0.12)}>
            <StatBox icon={Wheat} label="Growing Batches" value={stats.growing} color={C.green} bg={C.greenDim} accent={C.greenGlow} />
          </motion.div>
          <motion.div {...fadeUp(0.16)}>
            <StatBox icon={CheckCircle2} label="Ready for Sale" value={stats.ready} color={C.teal} bg={C.tealDim} accent="rgba(15,118,110,0.15)" />
          </motion.div>
          <motion.div {...fadeUp(0.20)}>
            <StatBox icon={CheckCircle2}   label="Sold Batches"  value={stats.sold}  color={C.blue}  bg={C.blueDim} accent={C.blueGlow} />
          </motion.div>
        </section>

        {/* ── Filter Bar ── */}
        <motion.section
          {...fadeUp(0.1)}
          style={{
            background: C.surface,
            border: `1.5px solid ${C.border}`,
            borderRadius: 22,
            padding: 18,
            marginBottom: 22,
            boxShadow: "0 4px 18px rgba(15,31,18,.04)",
          }}
        >
          <div
            className="filters"
            style={{ display: "grid", gridTemplateColumns: "1fr 210px 210px", gap: 12, alignItems: "center" }}
          >
            {/* Search */}
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                color={C.textLight}
                strokeWidth={2.5}
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <input
                className="input-focus"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search batch ID or notes…"
                style={{
                  width: "100%",
                  height: 46,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 14,
                  padding: "0 14px 0 44px",
                  fontFamily: C.sans,
                  fontWeight: 600,
                  fontSize: 13,
                  color: C.text,
                  background: C.bg,
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.textLight,
                    display: "flex",
                    padding: 2,
                  }}
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Status filter */}
            <div style={{ position: "relative" }}>
              <Filter
                size={15}
                color={C.textLight}
                strokeWidth={2.5}
                style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <select
                className="select-focus"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{ ...selectStyle, background: C.bg }}
              >
                <option>All</option>
                <option>Growing</option>
                <option>Ready for Sale</option>
                <option>Sold</option>
              </select>
              <ChevronDown
                size={14}
                color={C.textLight}
                style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
            </div>

            {/* Sort */}
            <div style={{ position: "relative" }}>
              <ArrowUpDown
                size={15}
                color={C.textLight}
                strokeWidth={2.5}
                style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <select
                className="select-focus"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ ...selectStyle, background: C.bg }}
              >
                <option>Latest</option>
                <option>Oldest</option>
                <option>Age</option>
                <option>Mortality</option>
              </select>
              <ChevronDown
                size={14}
                color={C.textLight}
                style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
            </div>
          </div>

          {/* Active filter chips */}
          {(status !== "All" || search) && (
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {status !== "All" && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: C.greenDim,
                    color: C.greenDark,
                    borderRadius: 999,
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    border: `1px solid ${C.green}28`,
                    cursor: "pointer",
                  }}
                  onClick={() => setStatus("All")}
                >
                  {status} <X size={10} strokeWidth={3} />
                </span>
              )}
              {search && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: C.blueDim,
                    color: C.blue,
                    borderRadius: 999,
                    padding: "4px 10px",
                    fontSize: 11,
                    fontWeight: 700,
                    border: `1px solid ${C.blue}28`,
                    cursor: "pointer",
                  }}
                  onClick={() => setSearch("")}
                >
                  "{search}" <X size={10} strokeWidth={3} />
                </span>
              )}
            </div>
          )}
        </motion.section>

        {/* ── Batch Grid ── */}
        {loading ? (
          <div style={{ padding: 80, textAlign: "center", color: C.textMid, fontWeight: 700 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: `3px solid ${C.border}`,
                borderTopColor: C.green,
                margin: "0 auto 16px",
              }}
            />
            Loading batches…
          </div>
        ) : pageItems.length === 0 ? (
          <motion.div
            {...fadeUp(0.05)}
            style={{
              background: C.surface,
              border: `1.5px solid ${C.border}`,
              borderRadius: 22,
              padding: 60,
              textAlign: "center",
              color: C.textMid,
              boxShadow: "0 4px 18px rgba(15,31,18,.04)",
            }}
          >
            <Package size={42} color={C.textLight} strokeWidth={1.5} />
            <div style={{ fontWeight: 800, marginTop: 14, fontSize: 16, color: C.text }}>No batches found</div>
            <div style={{ fontSize: 13, marginTop: 6, color: C.textMid }}>Try changing the search or filter criteria.</div>
            {(search || status !== "All") && (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => { setSearch(""); setStatus("All"); }}
                style={{
                  marginTop: 18,
                  border: `1.5px solid ${C.green}40`,
                  background: C.greenDim,
                  color: C.greenDark,
                  borderRadius: 12,
                  padding: "9px 18px",
                  fontFamily: C.sans,
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Clear Filters
              </motion.button>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <section className="batch-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 18 }}>
              {pageItems.map((batch) => (
                <BatchCard key={batch.batch_id} batch={batch} onView={openDetails} onGo={goTo} />
              ))}
            </section>
          </AnimatePresence>
        )}

        {/* ── Pagination ── */}
        <motion.section
          {...fadeUp(0.1)}
          style={{
            marginTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: C.surface,
            border: `1.5px solid ${C.border}`,
            borderRadius: 18,
            padding: "14px 20px",
            boxShadow: "0 4px 18px rgba(15,31,18,.04)",
          }}
        >
          <div style={{ fontSize: 12, color: C.textMid, fontWeight: 600 }}>
            Showing{" "}
            <strong style={{ color: C.text }}>
              {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
            </strong>{" "}
            of <strong style={{ color: C.text }}>{filtered.length}</strong> batches
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.button
              whileHover={page !== 1 ? { scale: 1.08 } : {}}
              whileTap={page !== 1 ? { scale: 0.92 } : {}}
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={pageBtn(page === 1)}
            >
              <ChevronLeft size={15} strokeWidth={2.5} />
            </motion.button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: C.bg,
                borderRadius: 10,
                padding: "5px 12px",
                border: `1px solid ${C.border}`,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 800, color: C.text }}>
                {page}
              </span>
              <span style={{ fontSize: 12, color: C.textLight, fontWeight: 500 }}>/ {totalPages}</span>
            </div>

            <motion.button
              whileHover={page !== totalPages ? { scale: 1.08 } : {}}
              whileTap={page !== totalPages ? { scale: 0.92 } : {}}
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={pageBtn(page === totalPages)}
            >
              <ChevronRight size={15} strokeWidth={2.5} />
            </motion.button>
          </div>
        </motion.section>
      </main>

      {/* ── Details Modal ── */}
      <BatchDetailsModal
        batch={selectedBatch}
        loading={detailsLoading}
        onClose={() => setSelectedBatch(null)}
        onGo={goTo}
        onExport={exportReport}
      />
    </div>
  );
}