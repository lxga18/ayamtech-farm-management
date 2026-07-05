import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Search, Filter, Plus, Eye, Pencil, Trash2, X,
  AlertTriangle, Calendar, Activity, CheckCircle2
} from "lucide-react";

/* ─── Design Tokens (mirrors OwnerMedication) ───────────────────── */
const C = {
  forest: "#102114", pine: "#244128", fern: "#3A7D1C", sage: "#6E8A72",
  mist: "#DDE8D7", foam: "#F6F8F3", white: "#ffffff",
  amber: "#B7791F", amberBg: "#FFF3D9",
  blue: "#1D4E89", blueBg: "#E8F4FF",
  red: "#B91C1C", redBg: "#FEE2E2",
  green: "#EAF7E3", accent: "#4CAF50",
};

const causeColors = {
  Disease:       { bg: "#FEE2E2", color: "#B91C1C", bar: "#EF4444", icon: "🦠" },
  "Heat Stress": { bg: "#FFF3D9", color: "#B7791F", bar: "#F59E0B", icon: "🌡️" },
  "Weak Chicks": { bg: "#F5F3FF", color: "#5B21B6", bar: "#8B5CF6", icon: "🐣" },
  Unknown:       { bg: "#F3F4F6", color: "#4B5563", bar: "#9CA3AF", icon: "❓" },
};

const statusStyle = (s) =>
  s === "Good"   ? { bg: C.green,   color: C.fern,  dot: "#4CAF50" } :
  s === "Medium" ? { bg: C.amberBg, color: C.amber, dot: "#F59E0B" } :
                   { bg: C.redBg,   color: C.red,   dot: "#EF4444" };

const fmt   = (d) => d ? new Date(d).toLocaleDateString("en-CA") : "—";
const money = (v) => `RM ${Number(v || 0).toLocaleString("en-MY")}`;
const MAX_DAY = 35;

const lbl = {
  fontSize: 11, color: C.sage, fontWeight: 700, display: "block",
  marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
};
const tdc = { padding: "13px 10px", color: "#4B5E4F", fontSize: 13, whiteSpace: "nowrap" };

/* ─── KPI Card ──────────────────────────────────────────────────── */
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

/* ─── Confirm Delete Modal ──────────────────────────────────────── */
function ConfirmDeleteModal({ record, onCancel, onConfirm }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(10,20,12,.45)", zIndex: 300, backdropFilter: "blur(6px)" }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{
          position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          width: 400, background: C.white, borderRadius: 28, padding: 28, zIndex: 301,
          boxShadow: "0 40px 100px rgba(0,0,0,0.28)", textAlign: "center",
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 12 }}>🗑️</div>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 900, color: C.forest, marginBottom: 8 }}>
          Delete Mortality Record?
        </div>
        <div style={{ fontSize: 13, color: C.sage, marginBottom: 24, lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: C.forest }}>{record.id}</strong>?<br />This action cannot be undone.
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={onCancel}
            style={{ flex: 1, height: 46, borderRadius: 12, border: `1.5px solid ${C.mist}`, background: C.foam, fontWeight: 800, cursor: "pointer", color: C.forest, fontSize: 14, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Cancel
          </motion.button>
          <motion.button whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(239,68,68,0.35)" }} whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            style={{ flex: 1, height: 46, borderRadius: 12, border: "none", background: "#EF4444", color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 14, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            Delete
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

/* ─── Success Toast ─────────────────────────────────────────────── */
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

/* ─── View Modal ────────────────────────────────────────────────── */
function ViewModal({ record, onClose }) {
  const cc = causeColors[record.cause] || causeColors.Unknown;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,20,12,.45)",
        zIndex: 9999,
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "100%",
          background: C.white,
          borderRadius: 28,
          overflow: "hidden",
          boxShadow: "0 40px 100px rgba(10,20,12,0.28)",
        }}
      >
        {/* Hero */}
        <div style={{ background: `linear-gradient(135deg,${C.forest},${C.pine})`, padding: "20px 22px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -24, right: -24, width: 88, height: 88, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{cc.icon}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, color: C.white, fontSize: 18, marginBottom: 8 }}>
                Mortality Details
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ padding: "3px 10px", borderRadius: 99, background: "rgba(255,255,255,0.15)", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                  {record.cause}
                </span>
                <span style={{ padding: "3px 10px", borderRadius: 99, background: cc.bar, fontSize: 12, fontWeight: 700, color: "#fff" }}>
                  Day {record.day}
                </span>
              </div>
            </div>
            <motion.button whileHover={{ rotate: 90, scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{ border: "none", background: "rgba(255,255,255,0.12)", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <X size={16} color="rgba(255,255,255,0.8)" />
            </motion.button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 20px 22px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            {[
              { label: "Deaths", value: record.deaths, color: C.red },
              { label: "Loss", value: money(Number(record.deaths) * 20), color: C.red },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: C.foam, borderRadius: 14, padding: "10px 13px", border: `1.5px solid ${C.mist}` }}>
                <div style={{ fontSize: 10, color: C.sage, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 900, color }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              ["Record ID", record.id],
              ["Batch", record.batch],
              ["Date", fmt(record.date)],
            ].map(([l, v]) => (
              <div key={l} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 13px", background: C.foam, borderRadius: 12, border: `1px solid ${C.mist}` }}>
                <span style={{ fontSize: 12, color: C.sage, fontWeight: 600 }}>{l}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.forest, textAlign: "right", maxWidth: 220 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Add / Edit Modal ──────────────────────────────────────────── */
function MortalityModal({ form, setForm, batches, onClose, onSave, editId }) {
  const valid = form.batch && form.date && form.deaths && form.cause;
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(10,20,12,0.45)", zIndex: 200, backdropFilter: "blur(5px)" }}
      />
      <motion.div style={{ position: "fixed", inset: 0, zIndex: 201, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          style={{ width: 540, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", background: C.white, borderRadius: 28, boxShadow: "0 32px 80px rgba(10,20,12,0.22)" }}
        >
          <div style={{ padding: 28 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 22, fontWeight: 900, color: C.forest }}>
                  {editId ? "Edit Mortality Record" : "Record Death"}
                </div>
                <div style={{ fontSize: 13, color: C.sage, marginTop: 4 }}>Log chicken deaths with cause and date</div>
              </div>
              <motion.button whileHover={{ rotate: 90, scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{ width: 36, height: 36, borderRadius: 10, border: `1.5px solid ${C.mist}`, background: C.foam, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color={C.sage} />
              </motion.button>
            </div>

            {/* Cause Selector */}
            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Cause of Death *</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginTop: 8 }}>
                {Object.entries(causeColors).map(([cause, cc]) => {
                  const sel = form.cause === cause;
                  return (
                    <motion.button key={cause} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => setForm({ ...form, cause })}
                      style={{ padding: "14px 12px", borderRadius: 14, border: sel ? `2px solid ${cc.bar}` : `1.5px solid ${C.mist}`, background: sel ? cc.bg : C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all .15s", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                      <span style={{ fontSize: 22 }}>{cc.icon}</span>
                      <span style={{ fontWeight: 800, fontSize: 13, color: sel ? cc.color : C.sage }}>{cause}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Batch + Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
              <div>
                <label style={lbl}>Batch *</label>
                <select value={form.batch} onChange={e => setForm({ ...form, batch: e.target.value })} style={mSel}>
                  <option value="">Select batch</option>
                  {batches .filter( b => b.status === "Growing" || b.status === "Ready for Sale").map(b => (<option key={b.id} value={b.id}> {b.id} </option> ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Date *</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={mInp} />
              </div>
            </div>

            {/* Deaths */}
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Number of Deaths *</label>
              <input type="number" min="1" value={form.deaths} onChange={e => setForm({ ...form, deaths: e.target.value })} placeholder="e.g. 10" style={mInp} />
            </div>

            {/* Live Loss Preview */}
            <AnimatePresence>
              {form.deaths && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ background: C.redBg, borderRadius: 14, padding: "14px 16px", marginBottom: 18, display: "flex", gap: 14, alignItems: "center", border: "1px solid #FCA5A5" }}>
                  <div style={{ fontSize: 26 }}>⚠️</div>
                  <div>
                    <div style={{ fontSize: 11, color: "#9AA89B", marginBottom: 3 }}>Estimated revenue loss</div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 900, fontSize: 20, color: C.red }}>{money(Number(form.deaths) * 20)}</div>
                    <div style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>{form.deaths} birds × RM 20 selling price</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Save Button */}
            <motion.button
              whileHover={valid ? { scale: 1.03, boxShadow: "0 8px 24px rgba(239,68,68,0.35)" } : {}}
              whileTap={valid ? { scale: 0.97 } : {}}
              onClick={onSave}
              style={{ width: "100%", height: 50, borderRadius: 14, border: "none", background: valid ? "linear-gradient(135deg,#EF4444,#B91C1C)" : "#FCA5A5", color: "#fff", fontWeight: 900, fontSize: 15, cursor: valid ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
              <CheckCircle2 size={19} /> {editId ? "Update Mortality Record" : "Save Mortality Record"}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */
function OwnerMortality() {
  const [records, setRecords]           = useState([]);
  const [batches, setBatches]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [batchFilter, setBatchFilter]   = useState("All");
  const [causeFilter, setCauseFilter]   = useState("All");
  const [showModal, setShowModal]       = useState(false);
  const [viewRecord, setViewRecord]     = useState(null);
  const [editId, setEditId]             = useState(null);
  const [form, setForm]                 = useState({ batch: "", date: "", deaths: "", cause: ""});
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [successMsg, setSuccessMsg]     = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [mRes, bRes] = await Promise.all([
        axios.get("http://localhost:5000/api/owner/mortality"),
        axios.get("http://localhost:5000/api/owner/batches"),
      ]);

      console.log("Mortality data:", mRes.data);
      
      setRecords(mRes.data);
      setBatches(bRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setForm({ batch: "", date: "", deaths: "", cause: "" }); setEditId(null); };
  const openAdd   = () => { resetForm(); setShowModal(true); };
  const openEdit  = (r) => {
    setEditId(r.id);
    setForm({ batch: r.batch, date: fmt(r.date), deaths: r.deaths, cause: r.cause });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.batch || !form.date || !form.deaths || !form.cause) return;
    const payload = {
      batch_id: form.batch, mortality_date: form.date,
      quantity_dead: Number(form.deaths), cause: form.cause,
      user_id: sessionStorage.getItem("user_id"),
    };
    try {
      if (editId) await axios.put(`http://localhost:5000/api/owner/mortality/${editId}`, payload);
      else        await axios.post("http://localhost:5000/api/owner/mortality", payload);
      setShowModal(false); resetForm(); loadData();
    } catch (err) { console.error(err); alert("Failed to save mortality record."); }
  };

  const handleDelete = async () => {
    if (!deleteRecord) return;
    try {
      await axios.delete(`http://localhost:5000/api/owner/mortality/${deleteRecord.id}`);
      setDeleteRecord(null);
      setSuccessMsg("Mortality record deleted successfully.");
      loadData();
      setTimeout(() => setSuccessMsg(""), 2500);
    } catch (err) { console.error(err); alert("Failed to delete mortality record."); }
  };

  const filtered = useMemo(() => records.filter(r => {
    const s = search.toLowerCase();
    return (
      (r.id?.toLowerCase().includes(s) || r.batch?.toLowerCase().includes(s) || r.cause?.toLowerCase().includes(s)) &&
      (batchFilter === "All" || r.batch === batchFilter) &&
      (causeFilter === "All" || r.cause === causeFilter)
    );
  }), [records, search, batchFilter, causeFilter]);

  const batchStats = useMemo(() => batches.map(b => {
    const deaths = records.filter(r => r.batch === b.id).reduce((s, r) => s + Number(r.deaths || 0), 0);
    const total  = Number(b.chicks || 0);
    const rate   = total ? ((deaths / total) * 100).toFixed(1) : "0.0";
    const status = parseFloat(rate) >= 6 ? "High" : parseFloat(rate) >= 3 ? "Medium" : "Good";
    return { batch: b.id, totalChicks: total, deaths, rate: parseFloat(rate), loss: deaths * 20, status };
  }), [batches, records]);

  const kpi = useMemo(() => {
    const totalDeaths   = records.reduce((s, r) => s + Number(r.deaths || 0), 0);
    const totalChicks   = batches.reduce((s, b) => s + Number(b.chicks || 0), 0);
    const mortalityRate = totalChicks ? ((totalDeaths / totalChicks) * 100).toFixed(1) : "0.0";
    const survivalRate  = (100 - parseFloat(mortalityRate)).toFixed(1);
    return { totalDeaths, totalChicks, mortalityRate, survivalRate, lossValue: totalDeaths * 20 };
  }, [records, batches]);

  const causeSummary = useMemo(() => {
    const map   = {};
    records.forEach(r => { map[r.cause] = (map[r.cause] || 0) + Number(r.deaths || 0); });
    const total = records.reduce((s, r) => s + Number(r.deaths || 0), 0);
    return Object.entries(map)
      .map(([cause, deaths]) => ({ cause, deaths, pct: total ? Math.round((deaths / total) * 100) : 0 }))
      .sort((a, b) => b.deaths - a.deaths);
  }, [records]);

  const timelineByBatch = useMemo(() => {
    const map = {};
    records.forEach(r => { if (!map[r.batch]) map[r.batch] = []; map[r.batch].push(r); });
    return map;
  }, [records]);

  const maxDeaths = Math.max(...batchStats.map(b => b.deaths), 1);

  const kpiCards = [
    { title: "Total Deaths",      value: kpi.totalDeaths,         sub: `Across ${batches.length} batches`,                                         accent: "#EF4444", lightBg: C.redBg,   icon: "⚠️" },
    { title: "Mortality Rate",    value: `${kpi.mortalityRate}%`, sub: parseFloat(kpi.mortalityRate) <= 3 ? "✓ Within target" : "⚠ Above target", accent: "#F59E0B", lightBg: C.amberBg, icon: "📉" },
    { title: "Loss Due to Death", value: money(kpi.lossValue),    sub: "Revenue lost from mortality",                                               accent: "#8B5CF6", lightBg: "#F5F3FF", icon: "💸" },
    { title: "Survival Rate",     value: `${kpi.survivalRate}%`,  sub: `${kpi.totalChicks - kpi.totalDeaths} birds surviving`,                      accent: C.fern,    lightBg: C.green,   icon: "🐔" },
  ];

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", gap: 14, alignItems: "center", justifyContent: "center", background: C.foam, fontFamily: "'Plus Jakarta Sans',sans-serif", color: C.sage }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
        <Activity size={36} color={C.fern} />
      </motion.div>
      <span style={{ fontWeight: 700, fontSize: 16 }}>Loading mortality data…</span>
    </div>
  );

  return (
    <div style={{ padding: "24px", background: C.foam, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans',sans-serif", width: "100%", boxSizing: "border-box", overflowX: "hidden"}}>
      <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 8, height: 36, borderRadius: 99, background: "linear-gradient(180deg,#EF4444,#B91C1C)" }} />
              <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 32, fontWeight: 900, color: C.forest, margin: 0, letterSpacing: "-0.03em" }}>
                Mortality Tracker
              </h1>
            </div>
            <p style={{ color: C.sage, fontSize: 14, margin: "0 0 0 18px", fontWeight: 500 }}>
              Monitor chicken deaths, causes, financial loss and batch health performance.
            </p>
          </div>
          <motion.button whileHover={{ scale: 1.04, boxShadow: "0 8px 24px rgba(239,68,68,0.35)" }} whileTap={{ scale: 0.97 }}
            onClick={openAdd}
            style={{ height: 48, padding: "0 22px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#EF4444,#B91C1C)", color: C.white, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: 15, boxShadow: "0 6px 20px rgba(239,68,68,0.28)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
            <Plus size={19} strokeWidth={2.5} /> Record Death
          </motion.button>
        </div>

        {/* ── KPI Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 26 }}>
          {kpiCards.map((c, i) => <KpiCard key={c.title} {...c} delay={i * 0.07} />)}
        </div>

        {/* ── Middle Row ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 20, marginBottom: 22 }}>

          {/* Mortality by Batch */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
            style={{ background: C.white, borderRadius: 24, padding: "22px 24px", border: `1.5px solid ${C.mist}`, boxShadow: "0 4px 20px rgba(16,33,20,0.07)" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800, color: C.forest, marginBottom: 4 }}>Mortality by Batch</div>
            <div style={{ fontSize: 12, color: C.sage, marginBottom: 20 }}>Deaths and rate per batch — target ≤ 3%</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: 280, overflowY: "auto", paddingRight: 6 }}>
              {batchStats.map((b, i) => {
                const ss   = statusStyle(b.status);
                const barW = Math.round((b.deaths / maxDeaths) * 100);
                return (
                  <motion.div key={b.batch} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 9, height: 9, borderRadius: "50%", background: ss.dot }} />
                        <span style={{ fontWeight: 800, fontSize: 14, color: C.forest }}>{b.batch}</span>
                        <span style={{ padding: "2px 9px", borderRadius: 999, background: ss.bg, color: ss.color, fontSize: 11, fontWeight: 800 }}>{b.status}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#9AA89B" }}>{b.deaths} deaths</span>
                        <span style={{ fontWeight: 900, fontSize: 14, color: ss.color }}>{b.rate}%</span>
                      </div>
                    </div>
                    <div style={{ height: 10, background: C.foam, borderRadius: 99, border: `1px solid ${C.mist}`, overflow: "hidden" }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${barW}%` }} transition={{ duration: 0.8, delay: i * 0.1 }}
                        style={{ height: "100%", background: ss.dot, borderRadius: 99 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5, fontSize: 11, color: "#9AA89B" }}>
                      <span>{b.totalChicks} birds total</span>
                      <span>Loss: {money(b.loss)}</span>
                    </div>
                  </motion.div>
                );
              })}
              {batchStats.length === 0 && <div style={{ textAlign: "center", color: C.sage, padding: "20px 0", fontWeight: 600 }}>No batch data.</div>}
            </div>
          </motion.div>

          {/* Cause of Death */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}
            style={{ background: C.white, borderRadius: 24, padding: "22px 24px", border: `1.5px solid ${C.mist}`, boxShadow: "0 4px 20px rgba(16,33,20,0.07)" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800, color: C.forest, marginBottom: 4 }}>Cause of Death</div>
            <div style={{ fontSize: 12, color: C.sage, marginBottom: 20 }}>Root cause breakdown across all batches</div>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{ position: "relative", width: 140, height: 140 }}>
                <svg viewBox="0 0 140 140">
                  {(() => {
                    let offset = 0;
                    const r = 54, circ = 2 * Math.PI * r;
                    return causeSummary.map(cs => {
                      const cc   = causeColors[cs.cause] || causeColors.Unknown;
                      const dash = (cs.pct / 100) * circ;
                      const el   = (
                        <circle key={cs.cause} cx={70} cy={70} r={r}
                          fill="none" stroke={cc.bar} strokeWidth={20}
                          strokeDasharray={`${dash} ${circ - dash}`}
                          strokeDashoffset={-offset}
                          transform="rotate(-90 70 70)"
                          strokeLinecap="butt"
                        />
                      );
                      offset += dash;
                      return el;
                    });
                  })()}
                  <circle cx={70} cy={70} r={44} fill={C.white} />
                  <text x={70} y={66} textAnchor="middle" style={{ fontSize: 18, fontWeight: 900, fill: C.forest, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{kpi.totalDeaths}</text>
                  <text x={70} y={80} textAnchor="middle" style={{ fontSize: 9, fill: "#9AA89B" }}>deaths</text>
                </svg>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {causeSummary.map(cs => {
                const cc = causeColors[cs.cause] || causeColors.Unknown;
                return (
                  <div key={cs.cause}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15 }}>{cc.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: C.forest }}>{cs.cause}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 12, color: "#9AA89B" }}>{cs.deaths} birds</span>
                        <span style={{ padding: "3px 9px", borderRadius: 99, background: cc.bg, color: cc.color, fontSize: 11, fontWeight: 800 }}>{cs.pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 6, background: C.mist, borderRadius: 99 }}>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${cs.pct}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                        style={{ height: "100%", background: cc.bar, borderRadius: 99 }} />
                    </div>
                  </div>
                );
              })}
              {causeSummary.length === 0 && <div style={{ textAlign: "center", color: C.sage, padding: "10px 0", fontWeight: 600 }}>No data yet.</div>}
            </div>
          </motion.div>
        </div>

        {/* ── Timeline ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          style={{ background: C.white, borderRadius: 24, padding: "22px 24px", border: `1.5px solid ${C.mist}`, boxShadow: "0 4px 20px rgba(16,33,20,0.07)", marginBottom: 22, maxHeight: 420, overflowY: "auto", overflowX: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800, color: C.forest, display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={20} color={C.red} /> Mortality Timeline
              </div>
              <div style={{ fontSize: 12, color: C.sage, marginTop: 3 }}>
                When deaths occurred across the grow-out cycle — <strong style={{ color: C.fern }}>click any event</strong> to see details
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {Object.entries(causeColors).map(([cause, cc]) => (
                <div key={cause} style={{ display: "flex", alignItems: "center", gap: 5, background: cc.bg, borderRadius: 99, padding: "5px 11px", border: `1px solid ${cc.bar}33` }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cc.bar }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: cc.color }}>{cc.icon} {cause}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 28, marginTop: 22 }}>
            {Object.entries(timelineByBatch).map(([batch, events], bi) => (
              <motion.div key={batch} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: bi * 0.1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 62, flexShrink: 0, fontWeight: 800, fontSize: 13, color: C.forest, background: C.foam, borderRadius: 10, padding: "6px 10px", textAlign: "center", border: `1px solid ${C.mist}` }}>
                    {batch}
                  </div>
                  <div style={{ flex: 1, position: "relative", height: 52 }}>
                    <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 6, transform: "translateY(-50%)", background: C.foam, borderRadius: 99, border: `1px solid ${C.mist}` }} />
                    {[0, 7, 14, 21, 28, 35].map(d => (
                      <div key={d} style={{ position: "absolute", top: "50%", left: `${(d / MAX_DAY) * 100}%`, transform: "translate(-50%,-50%)", width: 1, height: 14, background: C.mist }} />
                    ))}
                    {events.map((ev, ei) => {
                      const cc   = causeColors[ev.cause] || causeColors.Unknown;
                      const left = `${Math.min(95, Math.max(2, (Number(ev.day || 1) / MAX_DAY) * 100))}%`;
                      const size = Math.max(26, Math.min(44, 20 + Number(ev.deaths) * 1.2));
                      return (
                        <motion.div key={ev.id}
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ delay: bi * 0.1 + ei * 0.1, type: "spring", stiffness: 300 }}
                          whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setViewRecord(ev)}
                          title={`Day ${ev.day}: ${ev.cause} — ${ev.deaths} deaths`}
                          style={{ position: "absolute", top: "50%", left, transform: "translate(-50%,-50%)", cursor: "pointer", zIndex: 2 }}
                        >
                          <div style={{ width: size, height: size, borderRadius: "50%", background: cc.bar, border: "3px solid #fff", boxShadow: `0 3px 12px ${cc.bar}66`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size > 30 ? 12 : 10, color: "#fff", fontWeight: 800 }}>
                            {ev.deaths}
                          </div>
                          <div style={{ position: "absolute", [ei % 2 === 0 ? "bottom" : "top"]: `${size + 4}px`, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
                            <div style={{ background: cc.bg, color: cc.color, padding: "2px 7px", borderRadius: 7, fontSize: 10, fontWeight: 800, border: `1px solid ${cc.bar}44` }}>Day {ev.day}</div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                  <div style={{ width: 44, flexShrink: 0, fontSize: 10, color: "#9AA89B", textAlign: "right" }}>Day 35</div>
                </div>
              </motion.div>
            ))}
            {Object.keys(timelineByBatch).length === 0 && (
              <div style={{ textAlign: "center", color: C.sage, padding: "20px 0", fontWeight: 600 }}>No timeline data.</div>
            )}
          </div>

          {Object.keys(timelineByBatch).length > 0 && (
            <div style={{ display: "flex", paddingLeft: 78, paddingRight: 60, marginTop: 12 }}>
              {[0, 7, 14, 21, 28, 35].map((d, i) => (
                <div key={d} style={{ flex: i === 0 ? 0 : 1, fontSize: 10, color: "#9AA89B", textAlign: i === 0 ? "left" : "center", fontWeight: 600 }}>
                  {i === 0 ? "Day 0" : d}
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 12, background: "#FFF9E8", borderLeft: "3px solid #F59E0B", fontSize: 12, color: "#7A5A00" }}>
            💡 Bubble size = number of deaths. Larger bubble = more deaths on that day.
          </div>
        </motion.div>

        {/* ── Filters + Table ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
          style={{ background: C.white, borderRadius: 24, padding: "22px 24px", border: `1.5px solid ${C.mist}`, boxShadow: "0 4px 20px rgba(16,33,20,0.07)", minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 18, fontWeight: 800, color: C.forest }}>Mortality Records</div>
              <div style={{ fontSize: 13, color: C.sage, marginTop: 3 }}>
                <span style={{ fontWeight: 700, color: C.red }}>{filtered.length}</span> record{filtered.length !== 1 ? "s" : ""} shown
              </div>
            </div>
          </div>

          {/* Filters */}
          <div style={{ background: C.foam, borderRadius: 16, padding: "14px 16px", border: `1.5px solid ${C.mist}`, marginBottom: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr auto", gap: 14, alignItems: "end" }}>
              <div>
                <label style={lbl}>Search</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, height: 44, border: `1.5px solid ${C.mist}`, borderRadius: 12, padding: "0 13px", background: C.white }}>
                  <Search size={15} color={C.sage} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ID, batch or cause…"
                    style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 14, color: C.forest, fontFamily: "'Plus Jakarta Sans',sans-serif" }} />
                </div>
              </div>
              <div>
                <label style={lbl}>Batch</label>
                <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
                  style={{ width: "100%", height: 44, border: `1.5px solid ${C.mist}`, borderRadius: 12, padding: "0 12px", fontSize: 14, outline: "none", background: C.white, color: C.forest, fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  <option>All</option>
                  {batches.map(b => <option key={b.id}>{b.id}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Cause</label>
                <select value={causeFilter} onChange={e => setCauseFilter(e.target.value)}
                  style={{ width: "100%", height: 44, border: `1.5px solid ${C.mist}`, borderRadius: 12, padding: "0 12px", fontSize: 14, outline: "none", background: C.white, color: C.forest, fontWeight: 600, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                  <option>All</option>
                  {Object.keys(causeColors).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={() => { setSearch(""); setBatchFilter("All"); setCauseFilter("All"); }}
                style={{ height: 44, padding: "0 16px", borderRadius: 12, border: `1.5px solid ${C.mist}`, background: C.white, color: C.pine, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
                <Filter size={14} /> Reset
              </motion.button>
            </div>
          </div>

          {/* Table */}
          <div style={{ overflowX: "auto", width: "100%" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
              <thead>
                <tr style={{ background: C.foam }}>
                  {["Record ID", "Batch", "Date", "Day", "Deaths", "Cause", "Updated By", "Loss (RM)", "Actions"].map(h => (
                    <th key={h} style={{ padding: "10px 10px", textAlign: "left", fontSize: 11, fontWeight: 800, color: C.sage, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((r, i) => {
                    const cc   = causeColors[r.cause] || causeColors.Unknown;
                    const loss = Number(r.deaths) * 20;
                    return (
                      <motion.tr key={r.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.02 }}
                        style={{ borderTop: `1px solid ${C.mist}` }}>
                        <td style={{ ...tdc, fontWeight: 800, color: C.forest }}>{r.id}</td>
                        <td style={tdc}>{r.batch}</td>
                        <td style={tdc}>{fmt(r.date)}</td>
                        <td style={tdc}>Day {r.day}</td>
                        <td style={{ ...tdc, fontWeight: 900, color: C.red }}>{r.deaths}</td>
                        <td style={tdc}>
                          <span style={{ padding: "4px 10px", borderRadius: 99, background: cc.bg, color: cc.color, fontSize: 12, fontWeight: 800 }}>
                            {cc.icon} {r.cause}
                          </span>
                        </td>
                        <td style={tdc}> {r.updated_by}</td>
                        <td style={{ ...tdc, fontWeight: 800, color: C.red }}>{money(loss)}</td>
                        <td style={{ padding: "13px 10px" }}>
                          <div style={{ display: "flex", gap: 7 }}>
                            <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                              onClick={() => setViewRecord(r)}
                              style={{ width: 33, height: 33, borderRadius: 10, border: `1.5px solid ${C.mist}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Eye size={14} color={C.pine} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                              onClick={() => openEdit(r)}
                              style={{ width: 33, height: 33, borderRadius: 10, border: `1.5px solid ${C.mist}`, background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Pencil size={14} color={C.pine} />
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.9 }}
                              onClick={() => setDeleteRecord(r)}
                              style={{ width: 33, height: 33, borderRadius: 10, border: "1.5px solid #F2D3D3", background: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Trash2 size={14} color={C.red} />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "52px 0", color: C.sage }}>
                <AlertTriangle size={40} color={C.mist} style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 700 }}>No records match your filters.</div>
              </div>
            )}
          </div>
        </motion.div>

      </motion.div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {showModal && (
          <MortalityModal
            form={form} setForm={setForm} batches={batches}
            onClose={() => { setShowModal(false); resetForm(); }}
            onSave={handleSave} editId={editId}
          />
        )}
        {viewRecord && <ViewModal record={viewRecord} onClose={() => setViewRecord(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {deleteRecord && (
          <ConfirmDeleteModal
            record={deleteRecord}
            onCancel={() => setDeleteRecord(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successMsg && <SuccessToast message={successMsg} />}
      </AnimatePresence>
    </div>
  );
}

const mInp = {
  width: "100%", height: 46, border: `1.5px solid #DDE8D7`, borderRadius: 12,
  padding: "0 14px", fontSize: 14, outline: "none", background: "#fff",
  boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans',sans-serif",
};
const mSel = { ...mInp, cursor: "pointer" };

export default OwnerMortality;