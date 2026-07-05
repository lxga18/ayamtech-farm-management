import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Search, Filter, Plus, Eye, Pencil, Trash2, X,
  Syringe, Pill, Leaf, Activity, DollarSign, Bird, CheckCircle2, Calendar
} from "lucide-react";

/* ─── Tokens ─────────────────────────────────────────────────────── */
const C = {
  forest: "#102114", pine: "#244128", fern: "#3A7D1C", sage: "#6E8A72",
  mist: "#DDE8D7", foam: "#F6F8F3", white: "#ffffff",
  amber: "#B7791F", amberBg: "#FFF3D9",
  blue: "#1D4E89", blueBg: "#E8F4FF",
  red: "#B91C1C", redBg: "#FEE2E2",
  green: "#EAF7E3", accent: "#4CAF50",
};

const typeColors = {
  Vaccine:    { bg: "#E8F4FF", color: "#1D4E89", bar: "#3B82F6", icon: "💉", LIcon: Syringe },
  Antibiotic: { bg: "#FEE2E2", color: "#B91C1C", bar: "#EF4444", icon: "💊", LIcon: Pill    },
  Supplement: { bg: "#EAF7E3", color: "#3A7D1C", bar: "#4CAF50", icon: "🌿", LIcon: Leaf    },
};
const statusStyle = (s) =>
  s === "Completed" ? { bg: C.green, color: C.fern } : { bg: C.amberBg, color: C.amber };
const impactLevel = (cost) =>
  cost >= 400 ? { label:"High",   bg:C.redBg,   color:C.red,   bar:"#EF4444" }
: cost >= 200 ? { label:"Medium", bg:C.amberBg, color:C.amber, bar:"#F59E0B" }
:               { label:"Low",    bg:C.green,   color:C.fern,  bar:"#4CAF50" };

const money = (v) => `RM ${Number(v||0).toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const fmt   = (d) => d ? new Date(d).toLocaleDateString("en-CA") : "—";
const MAX_DAY = 35;

const lbl = { fontSize:11, color:C.sage, fontWeight:700, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" };
const tdc = { padding:"13px 10px", color:"#4B5E4F", fontSize:13, whiteSpace:"nowrap" };

/* ─── KPI Card ──────────────────────────────────────────────────── */
function KpiCard({ title, value, sub, accent, lightBg, icon, delay }) {
  return (
    <motion.div
      initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
      transition={{ delay, type:"spring", stiffness:280, damping:24 }}
      whileHover={{ y:-4, boxShadow:"0 20px 48px rgba(16,33,20,0.12)" }}
      style={{ background:C.white, borderRadius:24, padding:"20px 18px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)", position:"relative", overflow:"hidden" }}
    >
      <div style={{ position:"absolute", top:-20, right:-20, width:72, height:72, borderRadius:"50%", background:lightBg, opacity:.6 }}/>
      <div style={{ width:40, height:40, borderRadius:13, background:lightBg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, fontSize:20 }}>
        {icon}
      </div>
      <div style={{ fontSize:11, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>{title}</div>
      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:26, fontWeight:900, color:C.forest, lineHeight:1.1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:11, color:accent, fontWeight:700 }}>{sub}</div>
    </motion.div>
  );
}

/* ─── Timeline Event Detail Popup ───────────────────────────────── */
function TimelinePopup({ event, onClose }) {
  const tc = typeColors[event.medication_type] || typeColors.Supplement;
  const ss = statusStyle(event.medication_status);

  return (
    <AnimatePresence>
     <motion.div
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      exit={{ opacity:0 }}
      onClick={onClose}
      style={{
        position:"fixed",
        inset:0,
        background:"rgba(10,28,16,0.45)",
        zIndex:500,
        backdropFilter:"blur(6px)",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
      }}
    >
        <motion.div
          initial={{ scale:.88, opacity:0, y:24 }} animate={{ scale:1, opacity:1, y:0 }}
          exit={{ scale:.9, opacity:0, y:12 }}
          transition={{ type:"spring", stiffness:300, damping:28 }}
          onClick={e => e.stopPropagation()}
          style={{ width:"100%", maxWidth:400, background:C.white, borderRadius:28, overflow:"hidden", boxShadow:"0 40px 100px rgba(0,0,0,0.28)", margin:"auto" }}
        >
          {/* ── Hero ── */}
          <div style={{ background:`linear-gradient(135deg,${C.forest},${C.pine})`, padding:"20px 22px", position:"relative", overflow:"hidden" }}>
           <div style={{ position:"absolute", top:-24, right:-24, width:88, height:88, borderRadius:"50%", background:"rgba(255,255,255,0.06)", pointerEvents:"none" }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:26, marginBottom:6 }}>{tc.icon}</div>
                <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, color:C.white, fontSize:18, marginBottom:6 }}>
                  {event.medication_name}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                  <span style={{ padding:"3px 10px", borderRadius:99, background:"rgba(255,255,255,0.15)", fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.9)" }}>
                    {event.medication_type}
                  </span>
                  {event.day && (
                    <span style={{ padding:"3px 10px", borderRadius:99, background:tc.bar, fontSize:12, fontWeight:700, color:"#fff" }}>
                      Day {event.day}
                    </span>
                  )}
                </div>
              </div>
              <motion.button whileHover={{ rotate:90, scale:1.1 }} whileTap={{ scale:.9 }}
                onClick={onClose}
                style={{ border:"none", background:"rgba(255,255,255,0.12)", borderRadius:10, width:34, height:34, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <X size={16} color="rgba(255,255,255,0.8)"/>
              </motion.button>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ padding:"16px 18px 20px" }}>

            {/* Photo — small thumbnail, right-aligned beside batch/date */}
            {event.medication_photo && (
              <div style={{ display:"flex", gap:12, marginBottom:14, alignItems:"flex-start" }}>
                <img
                  src={`http://localhost:5000${event.medication_photo}`}
                  alt="Medication"
                  style={{
                    width: 90,
                    height: 90,
                    objectFit: "cover",
                    borderRadius: 14,
                    border: `1.5px solid ${C.mist}`,
                    flexShrink: 0,
                  }}
                  onError={(e) => { e.target.parentElement.style.display="none"; }}
                />
                {/* Batch + date + status stacked beside the photo */}
                <div style={{ flex:1, display:"flex", flexDirection:"column", gap:8 }}>
                  <div style={{ background:C.foam, borderRadius:12, padding:"9px 12px", border:`1px solid ${C.mist}` }}>
                    <div style={{ fontSize:10, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>Batch</div>
                    <div style={{ fontSize:14, fontWeight:800, color:C.forest }}>{event.batch_id}</div>
                  </div>
                  <div style={{ background:C.foam, borderRadius:12, padding:"9px 12px", border:`1px solid ${C.mist}` }}>
                    <div style={{ fontSize:10, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:2 }}>Date</div>
                    <div style={{ fontSize:14, fontWeight:800, color:C.forest }}>{fmt(event.medication_date)}</div>
                  </div>
                </div>
              </div>
            )}

            {/* If no photo, show batch + date as normal rows */}
            {!event.medication_photo && (
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:10 }}>
                {[
                  { label:"Batch", value: event.batch_id           },
                  { label:"Date",  value: fmt(event.medication_date) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 13px", background:C.foam, borderRadius:12, border:`1px solid ${C.mist}` }}>
                    <span style={{ fontSize:12, color:C.sage, fontWeight:600 }}>{label}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:C.forest }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* 2-col stat cards */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:10 }}>
              {[
                { label:"Cost",     value: money(event.cost),         color: C.red  },
                { label:"Quantity", value: `${event.quantity} units`, color: C.pine },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background:C.foam, borderRadius:14, padding:"10px 13px", border:`1.5px solid ${C.mist}` }}>
                  <div style={{ fontSize:10, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{label}</div>
                  <div style={{ fontSize:15, fontWeight:900, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Remaining detail rows */}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { label:"Dosage", value: event.dosage || "—" },
                { label:"Status", value: event.medication_status, badge:true, badgeBg:ss.bg, badgeCol:ss.color },
                { label:"Reason", value: event.remark || "—" },
              ].map(({ label, value, badge, badgeBg, badgeCol }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"9px 13px", background:C.foam, borderRadius:12, border:`1px solid ${C.mist}` }}>
                  <span style={{ fontSize:12, color:C.sage, fontWeight:600, flexShrink:0 }}>{label}</span>
                  {badge ? (
                    <span style={{ padding:"3px 11px", borderRadius:99, background:badgeBg, color:badgeCol, fontSize:12, fontWeight:800 }}>{value}</span>
                  ) : (
                    <span style={{ fontSize:13, fontWeight:700, color:C.forest, textAlign:"right", marginLeft:12 }}>{value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function OwnerMedication() {
  const [medicationRecords, setMedicationRecords] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [typeFilter, setTypeFilter]   = useState("All");
  const [showModal, setShowModal]     = useState(false);
  const [timelineEvent, setTimelineEvent] = useState(null);
  const [form, setForm] = useState({
    batch:"", date:"", name:"", type:"", dosage:"", quantity:"", reason:"", cost:"", status:"Completed", image:null,
  });
  const [batchList, setBatchList] = useState([]);

  useEffect(() => { fetchMedication(); }, []);

  const fetchMedication = async () => {
    try {
      const [medRes, batchRes] = await Promise.all([
        axios.get("http://localhost:5000/api/owner/medication"),
        axios.get("http://localhost:5000/api/owner/medication/available-batches"),
      ]);
      setMedicationRecords(medRes.data);
      setBatchList(batchRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formValid) return;
    try {
      if (form.medication_id) {
        await axios.put(
          `http://localhost:5000/api/owner/medication/${form.medication_id}`,
          {
            medication_name: form.name,
            medication_date: form.date,
            dosage: form.dosage,
            quantity: Number(form.quantity),
            cost: Number(form.cost),
            remark: form.reason,
            batch_id: form.batch,
          }
        );
      } else {
        const fd = new FormData();
        fd.append("medication_name", form.name);
        fd.append("medication_date", form.date);
        fd.append("dosage", form.dosage);
        fd.append("quantity", Number(form.quantity));
        fd.append("cost", Number(form.cost));
        fd.append("remark", form.reason);
        fd.append("batch_id", form.batch);
        fd.append("user_id", sessionStorage.getItem("user_id") || "");
        if (form.image) fd.append("medication_photo", form.image);

        await axios.post("http://localhost:5000/api/owner/medication", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setShowModal(false);
      setForm({ batch:"", date:"", name:"", type:"", dosage:"", quantity:"", reason:"", cost:"", status:"Completed", image:null });
      fetchMedication();
    } catch (err) {
      console.error(err);
      alert("Failed to save medication record.");
    }
  };

  const isTodayRecord = (date) =>
    fmt(date) === new Date().toLocaleDateString("en-CA");

  const handleEdit = (record) => {
    if (!isTodayRecord(record.medication_date)) {
      alert("Only medication records added today can be edited.");
      return;
    }
    setForm({
      batch:         record.batch_id,
      date:          fmt(record.medication_date),
      name:          record.medication_name,
      type:          record.medication_type,
      dosage:        record.dosage || "",
      quantity:      record.quantity,
      reason:        record.remark || "",
      cost:          record.cost,
      status:        record.medication_status,
      medication_id: record.medication_id,
    });
    setShowModal(true);
  };

  const handleDelete = async (record) => {
    if (!isTodayRecord(record.medication_date)) {
      alert("Only medication records added today can be deleted.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete ${record.medication_id}?`)) return;
    try {
      await axios.delete(`http://localhost:5000/api/owner/medication/${record.medication_id}`);
      fetchMedication();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete medication record.");
    }
  };

  const batchOptions = useMemo(() =>
    ["All", ...new Set(medicationRecords.map(r => r.batch_id).filter(Boolean))],
  [medicationRecords]);

  const filtered = useMemo(() =>
    medicationRecords.filter(r => {
      const s = search.toLowerCase();
      return (
        (r.medication_id?.toLowerCase().includes(s) ||
         r.medication_name?.toLowerCase().includes(s) ||
         r.batch_id?.toLowerCase().includes(s)) &&
        (batchFilter === "All" || r.batch_id        === batchFilter) &&
        (typeFilter  === "All" || r.medication_type === typeFilter)
      );
    }),
  [medicationRecords, search, batchFilter, typeFilter]);

  const kpi = useMemo(() => {
    const totalCost = medicationRecords.reduce((s,r) => s + Number(r.cost||0), 0);
    const totalQty  = medicationRecords.reduce((s,r) => s + Number(r.quantity||0), 0);
    const batches   = new Set(medicationRecords.map(r => r.batch_id)).size || 1;
    const totalChickens = 500 * batches;
    const vaccinated = medicationRecords
      .filter(r => r.medication_type === "Vaccine")
      .reduce((s,r) => s + Number(r.quantity||0), 0);
    return { totalCost, totalQty, costPerChicken:(totalCost/totalChickens).toFixed(2), vaccinated };
  }, [medicationRecords]);

  const typeSummary = useMemo(() => {
    const map = {};
    medicationRecords.forEach(r => {
      if (!map[r.medication_type]) map[r.medication_type] = { count:0, cost:0 };
      map[r.medication_type].count++;
      map[r.medication_type].cost += Number(r.cost||0);
    });
    const total = medicationRecords.length || 1;
    return Object.entries(map).map(([type,d]) => ({ type, ...d, pct:Math.round((d.count/total)*100) }));
  }, [medicationRecords]);

  const batchCostImpact = useMemo(() => {
    const map = {};
    medicationRecords.forEach(r => {
      if (!map[r.batch_id]) map[r.batch_id] = { batch:r.batch_id, medCost:0, totalCost:10000, chickens:500 };
      map[r.batch_id].medCost += Number(r.cost||0);
    });
    return Object.values(map);
  }, [medicationRecords]);

  const maxImpact = Math.max(...batchCostImpact.map(b => b.medCost), 1);

  const timeline = useMemo(() => {
    const map = {};
    medicationRecords.forEach((r) => {
      if (!r.batch_id || !r.medication_date) return;
      const batchInfo = batchList.find((b) => b.id === r.batch_id);
      if (!batchInfo?.start_date) return;
      const start   = new Date(batchInfo.start_date);
      const medDate = new Date(r.medication_date);
      const diffDays = Math.floor((medDate - start) / (1000 * 60 * 60 * 24)) + 1;
      if (!map[r.batch_id]) map[r.batch_id] = [];
      map[r.batch_id].push({ ...r, day: diffDays < 1 ? 1 : diffDays });
    });
    return map;
  }, [medicationRecords, batchList]);

  const formValid = form.batch && form.date && form.name && form.quantity && form.cost;

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", gap:14, alignItems:"center", justifyContent:"center", background:C.foam, fontFamily:"'Inter',sans-serif", color:C.sage }}>
      <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1.2, ease:"linear" }}>
        <Activity size={36} color={C.fern}/>
      </motion.div>
      <span style={{ fontWeight:700, fontSize:16 }}>Loading medication data…</span>
    </div>
  );

  return (
    <div style={{ padding:"24px", background:C.foam, minHeight:"100vh", fontFamily:"'Inter',sans-serif", width:"calc(100vw - 280px)", maxWidth:"calc(100vw - 280px)", boxSizing:"border-box", overflowX:"hidden" }}>

      {/* ── Header ── */}
      <motion.div initial={{ opacity:0, y:-18 }} animate={{ opacity:1, y:0 }} style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:30 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
            <div style={{ width:8, height:36, borderRadius:99, background:`linear-gradient(180deg,${C.accent},${C.pine})` }}/>
            <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:32, fontWeight:900, color:C.forest, margin:0, letterSpacing:"-0.03em" }}>
              Medication
            </h1>
          </div>
          <p style={{ color:C.sage, fontSize:14, margin:"0 0 0 18px", fontWeight:500 }}>
            Track treatments, vaccines, antibiotics and their cost impact per batch.
          </p>
        </div>
        <motion.button whileHover={{ scale:1.04, boxShadow:"0 8px 24px rgba(76,175,80,0.4)" }} whileTap={{ scale:.97 }}
          onClick={() => setShowModal(true)}
          style={{ height:48, padding:"0 22px", borderRadius:14, border:"none", background:`linear-gradient(135deg,${C.accent},${C.fern})`, color:C.white, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:15, boxShadow:"0 6px 20px rgba(76,175,80,0.3)" }}>
          <Plus size={19} strokeWidth={2.5}/> Add Medication
        </motion.button>
      </motion.div>

      {/* ── KPI Row ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:16, marginBottom:26, width:"100%" }}>
        {[
          { title:"Total Dosages",    value:kpi.totalQty,               sub:"Doses across all batches", accent:"#3B82F6", lightBg:"#EFF6FF", icon:"💊" },
          { title:"Medication Cost",  value:money(kpi.totalCost),       sub:"Total treatment spending",  accent:C.red,    lightBg:C.redBg,  icon:"💸" },
          { title:"Cost per Bird",    value:`RM ${kpi.costPerChicken}`, sub:"Efficiency indicator",      accent:"#8B5CF6",lightBg:"#F5F3FF",icon:"🐔" },
          { title:"Birds Vaccinated", value:kpi.vaccinated,             sub:"Via vaccine records",       accent:C.fern,   lightBg:C.green,  icon:"✅" },
        ].map((c,i) => <KpiCard key={c.title} {...c} delay={i*0.07}/>)}
      </div>

      {/* ── Middle Row: Type Breakdown + Cost Impact ── */}
      <div style={{ display:"grid", gridTemplateColumns:"minmax(0, 1fr) minmax(0, 1.5fr)", gap:20, marginBottom:22, width:"100%", maxWidth:"100%", overflow:"hidden" }}>

        {/* Type Breakdown */}
        <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:.15 }}
          style={{ background:C.white, borderRadius:24, padding:"22px 24px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)" }}>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:800, color:C.forest, marginBottom:4 }}>Medication by Type</div>
          <div style={{ fontSize:12, color:C.sage, marginBottom:20 }}>Usage breakdown across all batches</div>

          <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
            <div style={{ position:"relative", width:130, height:130 }}>
              <svg viewBox="0 0 140 140">
                {(() => {
                  let offset = 0;
                  const r = 54, circ = 2*Math.PI*r;
                  return typeSummary.map(ts => {
                    const tc = typeColors[ts.type] || typeColors.Supplement;
                    const dash = (ts.pct/100)*circ;
                    const el = (
                      <circle key={ts.type} cx={70} cy={70} r={r}
                        fill="none" stroke={tc.bar} strokeWidth={20}
                        strokeDasharray={`${dash} ${circ-dash}`}
                        strokeDashoffset={-offset}
                        transform="rotate(-90 70 70)"
                        strokeLinecap="butt"
                      />
                    );
                    offset += dash;
                    return el;
                  });
                })()}
                <circle cx={70} cy={70} r={44} fill={C.white}/>
                <text x={70} y={66} textAnchor="middle" style={{ fontSize:18, fontWeight:900, fill:C.forest, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{medicationRecords.length}</text>
                <text x={70} y={80} textAnchor="middle" style={{ fontSize:9, fill:"#9AA89B" }}>records</text>
              </svg>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {typeSummary.map(ts => {
              const tc = typeColors[ts.type] || typeColors.Supplement;
              return (
                <div key={ts.type}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:15 }}>{tc.icon}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:C.forest }}>{ts.type}</span>
                    </div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={{ fontSize:12, color:"#9AA89B" }}>RM {ts.cost}</span>
                      <span style={{ padding:"3px 9px", borderRadius:99, background:tc.bg, color:tc.color, fontSize:11, fontWeight:800 }}>{ts.pct}%</span>
                    </div>
                  </div>
                  <div style={{ height:6, background:C.mist, borderRadius:99 }}>
                    <motion.div initial={{ width:0 }} animate={{ width:`${ts.pct}%` }} transition={{ duration:.8, delay:.2 }}
                      style={{ height:"100%", background:tc.bar, borderRadius:99 }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Cost Impact */}
        <motion.div initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} transition={{ delay:.18 }}
          style={{ background:C.white, borderRadius:24, padding:"22px 24px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)", display:"flex", flexDirection:"column" }}>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:800, color:C.forest, marginBottom:4 }}>Cost Impact by Batch</div>
          <div style={{ fontSize:12, color:C.sage, marginBottom:16 }}>How medication cost affects each batch's profitability</div>

          <div style={{ flex:1, overflowY:"auto", maxHeight:300, display:"flex", flexDirection:"column", gap:12, paddingRight:4 }}>
            {batchCostImpact.map((b, i) => {
              const imp = impactLevel(b.medCost);
              const pct  = Math.round((b.medCost / b.totalCost) * 100);
              const barW = Math.round((b.medCost / maxImpact) * 100);
              return (
                <motion.div key={b.batch}
                  initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay: i * 0.07 }}
                  style={{ background:C.foam, borderRadius:16, padding:"14px 16px", border:`1.5px solid ${C.mist}`, flexShrink:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <div style={{ fontWeight:800, fontSize:14, color:C.forest }}>{b.batch}</div>
                      <span style={{ padding:"3px 9px", borderRadius:99, background:imp.bg, color:imp.color, fontSize:11, fontWeight:800 }}>{imp.label}</span>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontWeight:900, fontSize:15, color:imp.color }}>{money(b.medCost)}</div>
                      <div style={{ fontSize:11, color:"#9AA89B" }}>{pct}% of total cost</div>
                    </div>
                  </div>
                  <div style={{ height:7, background:C.mist, borderRadius:99, overflow:"hidden" }}>
                    <motion.div initial={{ width:0 }} animate={{ width:`${barW}%` }} transition={{ duration:.7, delay:i*0.08 }}
                      style={{ height:"100%", background:imp.bar, borderRadius:99 }}/>
                  </div>
                  <div style={{ fontSize:11, color:"#9AA89B", marginTop:5 }}>
                    {b.chickens} birds · RM {(b.medCost/b.chickens).toFixed(2)}/bird
                  </div>
                </motion.div>
              );
            })}
            {batchCostImpact.length === 0 && (
              <div style={{ textAlign:"center", color:C.sage, padding:"24px 0", fontWeight:600 }}>No batch data.</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Timeline ── */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.22 }}
        style={{ background:C.white, borderRadius:24, padding:"22px 24px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)", marginBottom:22, maxHeight:360, overflowY:"auto", overflowX:"hidden" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:6 }}>
          <div>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:800, color:C.forest, display:"flex", alignItems:"center", gap:8 }}>
              <Calendar size={20} color={C.fern}/> Medication Timeline
            </div>
            <div style={{ fontSize:12, color:C.sage, marginTop:3 }}>
              Treatment schedule across the grow-out cycle — <strong style={{ color:C.fern }}>click any event</strong> to see details
            </div>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", justifyContent:"flex-end" }}>
            {Object.entries(typeColors).map(([type,tc]) => (
              <div key={type} style={{ display:"flex", alignItems:"center", gap:5, background:tc.bg, borderRadius:99, padding:"5px 11px", border:`1px solid ${tc.bar}33` }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:tc.bar }}/>
                <span style={{ fontSize:11, fontWeight:700, color:tc.color }}>{tc.icon} {type}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:24, marginTop:22 }}>
          {Object.entries(timeline).map(([batch, events], bi) => (
            <motion.div key={batch} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: bi*0.1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ width:62, flexShrink:0, fontWeight:800, fontSize:13, color:C.forest, background:C.foam, borderRadius:10, padding:"6px 10px", textAlign:"center", border:`1px solid ${C.mist}` }}>
                  {batch}
                </div>
                <div style={{ flex:1, position:"relative", height:52 }}>
                  <div style={{ position:"absolute", top:"50%", left:0, right:0, height:6, transform:"translateY(-50%)", background:C.foam, borderRadius:99, border:`1px solid ${C.mist}` }}/>
                  {[0,7,14,21,28,35].map(d => (
                    <div key={d} style={{ position:"absolute", top:"50%", left:`${(d/MAX_DAY)*100}%`, transform:"translate(-50%,-50%)", width:1, height:14, background:C.mist }}/>
                  ))}
                  {events.map((ev, ei) => {
                    const tc   = typeColors[ev.medication_type] || typeColors.Supplement;
                    const left = `${Math.min(95, Math.max(2, (ev.day/MAX_DAY)*100))}%`;
                    return (
                      <motion.div key={ev.medication_id}
                        initial={{ scale:0 }} animate={{ scale:1 }}
                        transition={{ delay: bi*0.1 + ei*0.1, type:"spring", stiffness:320 }}
                        onClick={() => setTimelineEvent(ev)}
                        whileHover={{ scale:1.2 }}
                        whileTap={{ scale:.9 }}
                        title={`Day ${ev.day}: ${ev.medication_name} — click for details`}
                        style={{ position:"absolute", top:"50%", left, transform:"translate(-50%,-50%)", cursor:"pointer", zIndex:2 }}
                      >
                        <div style={{ width:32, height:32, borderRadius:"50%", background:tc.bar, border:"3px solid #fff", boxShadow:`0 3px 12px ${tc.bar}66`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13 }}>
                          {tc.icon}
                        </div>
                        <div style={{ position:"absolute", [ei%2===0 ? "bottom":"top"]:"36px", left:"50%", transform:"translateX(-50%)", textAlign:"center", whiteSpace:"nowrap" }}>
                          <div style={{ background:tc.bg, color:tc.color, padding:"2px 7px", borderRadius:7, fontSize:10, fontWeight:800, border:`1px solid ${tc.bar}44` }}>
                            Day {ev.day}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <div style={{ width:44, flexShrink:0, fontSize:10, color:"#9AA89B", textAlign:"right" }}>Day 35</div>
              </div>
            </motion.div>
          ))}
          {Object.keys(timeline).length === 0 && (
            <div style={{ textAlign:"center", color:C.sage, padding:"20px 0", fontWeight:600 }}>No timeline data.</div>
          )}
        </div>

        {Object.keys(timeline).length > 0 && (
          <div style={{ display:"flex", paddingLeft:78, paddingRight:60, marginTop:10 }}>
            {[0,7,14,21,28,35].map((d,i) => (
              <div key={d} style={{ flex:i===0?0:1, fontSize:10, color:"#9AA89B", textAlign:i===0?"left":"center", fontWeight:600 }}>
                {i===0 ? "Day 0" : d}
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Filters + Table ── */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:.26 }}
        style={{ background:C.white, borderRadius:24, padding:"22px 24px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)", minWidth:0, maxWidth:"100%", overflow:"hidden" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:800, color:C.forest }}>Medication Records</div>
            <div style={{ fontSize:13, color:C.sage, marginTop:3 }}>
              <span style={{ fontWeight:700, color:C.fern }}>{filtered.length}</span> record{filtered.length!==1?"s":""} shown
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background:C.foam, borderRadius:16, padding:"14px 16px", border:`1.5px solid ${C.mist}`, marginBottom:18 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr 1fr auto", gap:14, alignItems:"end" }}>
            <div>
              <label style={lbl}>Search</label>
              <div style={{ display:"flex", alignItems:"center", gap:8, height:44, border:`1.5px solid ${C.mist}`, borderRadius:12, padding:"0 13px", background:C.white }}>
                <Search size={15} color={C.sage}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ID, name, or batch…"
                  style={{ border:"none", outline:"none", background:"transparent", width:"100%", fontSize:14, color:C.forest }}/>
              </div>
            </div>
            {[
              { l:"Batch", v:batchFilter, s:setBatchFilter, opts:batchOptions },
              { l:"Type",  v:typeFilter,  s:setTypeFilter,  opts:["All","Vaccine","Antibiotic","Supplement"] },
            ].map(f => (
              <div key={f.l}>
                <label style={lbl}>{f.l}</label>
                <select value={f.v} onChange={e=>f.s(e.target.value)}
                  style={{ width:"100%", height:44, border:`1.5px solid ${C.mist}`, borderRadius:12, padding:"0 12px", fontSize:14, outline:"none", background:C.white, color:C.forest, fontWeight:600 }}>
                  {f.opts.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:.96 }}
              onClick={() => { setSearch(""); setBatchFilter("All"); setTypeFilter("All"); }}
              style={{ height:44, padding:"0 16px", borderRadius:12, border:`1.5px solid ${C.mist}`, background:C.white, color:C.pine, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
              <Filter size={14}/> Reset
            </motion.button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX:"auto", width:"100%", maxWidth:"100%" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
            <thead>
              <tr style={{ background:C.foam }}>
                {["Med ID","Batch","Date","Name","Type","Dosage","Qty","Reason","Cost","Status","Actions"].map(h => (
                  <th key={h} style={{ padding:"10px 10px", textAlign:"left", fontSize:11, fontWeight:800, color:C.sage, textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((r,i) => {
                  const tc = typeColors[r.medication_type] || typeColors.Supplement;
                  const ss = statusStyle(r.medication_status);
                  return (
                    <motion.tr key={r.medication_id}
                      initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderTop:`1px solid ${C.mist}` }}>
                      <td style={{ ...tdc, fontWeight:800, color:C.forest }}>{r.medication_id}</td>
                      <td style={tdc}>{r.batch_id}</td>
                      <td style={tdc}>{fmt(r.medication_date)}</td>
                      <td style={{ ...tdc, fontWeight:700, color:C.forest }}>{r.medication_name}</td>
                      <td style={tdc}>
                        <span style={{ padding:"4px 10px", borderRadius:99, background:tc.bg, color:tc.color, fontSize:12, fontWeight:800 }}>
                          {tc.icon} {r.medication_type}
                        </span>
                      </td>
                      <td style={tdc}>{r.dosage || "—"}</td>
                      <td style={tdc}>{r.quantity}</td>
                      <td style={tdc}>{r.remark || "—"}</td>
                      <td style={{ ...tdc, fontWeight:800, color:C.forest }}>RM {r.cost}</td>
                      <td style={tdc}>
                        <span style={{ padding:"4px 10px", borderRadius:99, background:ss.bg, color:ss.color, fontSize:12, fontWeight:800 }}>
                          {r.medication_status}
                        </span>
                      </td>
                      <td style={{ padding:"13px 10px" }}>
                        <div style={{ display:"flex", gap:7 }}>
                          {/* VIEW */}
                          <motion.button whileHover={{ scale:1.12 }} whileTap={{ scale:.9 }}
                            onClick={() => setTimelineEvent(r)}
                            style={{ width:33, height:33, borderRadius:10, border:`1.5px solid ${C.mist}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Eye size={14} color={C.pine}/>
                          </motion.button>
                          {/* EDIT */}
                          <motion.button whileHover={{ scale:1.12 }} whileTap={{ scale:.9 }}
                            onClick={() => handleEdit(r)}
                            style={{ width:33, height:33, borderRadius:10, border:`1.5px solid ${C.mist}`, background:C.white, cursor:isTodayRecord(r.medication_date)?"pointer":"not-allowed", opacity:isTodayRecord(r.medication_date)?1:0.45, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Pencil size={14} color={isTodayRecord(r.medication_date)?C.pine:"#9AA89B"}/>
                          </motion.button>
                          {/* DELETE */}
                          <motion.button whileHover={{ scale:1.12 }} whileTap={{ scale:.9 }}
                            onClick={() => handleDelete(r)}
                            style={{ width:33, height:33, borderRadius:10, border:"1.5px solid #F2D3D3", background:C.white, cursor:isTodayRecord(r.medication_date)?"pointer":"not-allowed", opacity:isTodayRecord(r.medication_date)?1:0.45, display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Trash2 size={14} color={isTodayRecord(r.medication_date)?C.red:"#9AA89B"}/>
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
            <div style={{ textAlign:"center", padding:"52px 0", color:C.sage }}>
              <Activity size={40} color={C.mist} style={{ marginBottom:12 }}/>
              <div style={{ fontWeight:700 }}>No records match your filters.</div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Timeline Event Detail Popup ── */}
      <AnimatePresence>
        {timelineEvent && (
          <TimelinePopup event={timelineEvent} onClose={() => setTimelineEvent(null)}/>
        )}
      </AnimatePresence>

      {/* ── Add / Edit Medication Modal ── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setShowModal(false)}
              style={{ position:"fixed", inset:0, background:"rgba(10,20,12,0.45)", zIndex:200, backdropFilter:"blur(5px)" }}/>

            <motion.div style={{ position:"fixed", inset:0, zIndex:201, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
              <motion.div
                initial={{ opacity:0, y:40, scale:.97 }} animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:20, scale:.97 }} transition={{ type:"spring", stiffness:300, damping:28 }}
                style={{ width:560, maxWidth:"100%", maxHeight:"85vh", overflowY:"auto", background:C.white, borderRadius:28, boxShadow:"0 32px 80px rgba(10,20,12,0.22)" }}
              >
                <div style={{ padding:28 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
                    <div>
                      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:900, color:C.forest }}>
                        {form.medication_id ? "Edit Medication Record" : "Add Medication Record"}
                      </div>
                      <div style={{ fontSize:13, color:C.sage, marginTop:4 }}>Fill in the treatment details below</div>
                    </div>
                    <motion.button whileHover={{ rotate:90, scale:1.1 }} whileTap={{ scale:.9 }}
                      onClick={() => setShowModal(false)}
                      style={{ width:36, height:36, borderRadius:10, border:`1.5px solid ${C.mist}`, background:C.foam, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <X size={16} color={C.sage}/>
                    </motion.button>
                  </div>

                  {/* Type selector */}
                  <div style={{ marginBottom:18 }}>
                    <label style={lbl}>Medication Type</label>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:8 }}>
                      {["Vaccine","Antibiotic","Supplement"].map(t => {
                        const tc  = typeColors[t];
                        const sel = form.type === t;
                        return (
                          <motion.button key={t} whileHover={{ scale:1.03 }} whileTap={{ scale:.97 }}
                            onClick={() => setForm({ ...form, type:t })}
                            style={{ padding:"14px 10px", borderRadius:14, border:sel?`2px solid ${tc.bar}`:`1.5px solid ${C.mist}`, background:sel?tc.bg:C.white, cursor:"pointer", textAlign:"center", transition:"all .15s" }}>
                            <div style={{ fontSize:22, marginBottom:4 }}>{tc.icon}</div>
                            <div style={{ fontWeight:800, fontSize:13, color:sel?tc.color:C.sage }}>{t}</div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                    <div>
                      <label style={lbl}>Batch *</label>
                      <select value={form.batch} onChange={e=>setForm({...form,batch:e.target.value})} style={mSel}>
                        <option value="">Select batch</option>
                        {batchList.map((b) => (<option key={b.id} value={b.id}>{b.id}</option>))}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Date *</label>
                      <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={mInp}/>
                    </div>
                  </div>

                  <div style={{ marginBottom:14 }}>
                    <label style={lbl}>Medication Name *</label>
                    <input placeholder="e.g. Newcastle Vaccine, Amoxicillin" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} style={mInp}/>
                  </div>

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                    <div>
                      <label style={lbl}>Dosage</label>
                      <input placeholder="e.g. 0.5ml / 1g per L" value={form.dosage} onChange={e=>setForm({...form,dosage:e.target.value})} style={mInp}/>
                    </div>
                    <div>
                      <label style={lbl}>Quantity *</label>
                      <input type="number" min="0" placeholder="e.g. 500" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} style={mInp}/>
                    </div>
                  </div>

                  {/* Medication Image — only show on new records, not edit */}
                  {!form.medication_id && (
                    <div style={{ marginBottom:18 }}>
                      <label style={lbl}>Medication Image</label>
                      <input type="file" accept="image/*"
                        onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                        style={{ fontSize:13, color:C.forest }}
                      />
                    </div>
                  )}

                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                    <div>
                      <label style={lbl}>Total Cost (RM) *</label>
                      <input type="number" min="0" placeholder="e.g. 150" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} style={mInp}/>
                    </div>
                    <div>
                      <label style={lbl}>Status</label>
                      <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={mSel}>
                        <option>Completed</option><option>Ongoing</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom:18 }}>
                    <label style={lbl}>Reason / Notes</label>
                    <textarea placeholder="e.g. Prevention, respiratory infection…" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}
                      style={{ ...mInp, height:72, resize:"none", paddingTop:12, lineHeight:1.5 }}/>
                  </div>

                  {/* Live calc */}
                  {(form.cost || form.quantity) && (
                    <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                      style={{ background:C.foam, borderRadius:14, padding:"12px 16px", marginBottom:18, display:"flex", gap:14, border:`1px solid ${C.mist}` }}>
                      {form.cost && form.quantity && (
                        <div style={{ flex:1, textAlign:"center" }}>
                          <div style={{ fontSize:11, color:"#9AA89B", marginBottom:3 }}>Cost per unit</div>
                          <div style={{ fontWeight:900, fontSize:16, color:C.red }}>RM {(parseFloat(form.cost)/parseFloat(form.quantity)).toFixed(2)}</div>
                        </div>
                      )}
                      <div style={{ width:1, background:C.mist }}/>
                      <div style={{ flex:1, textAlign:"center" }}>
                        <div style={{ fontSize:11, color:"#9AA89B", marginBottom:3 }}>Total spend</div>
                        <div style={{ fontWeight:900, fontSize:16, color:C.fern }}>RM {parseFloat(form.cost||0).toFixed(2)}</div>
                      </div>
                      {form.type && (<>
                        <div style={{ width:1, background:C.mist }}/>
                        <div style={{ flex:1, textAlign:"center" }}>
                          <div style={{ fontSize:11, color:"#9AA89B", marginBottom:3 }}>Type</div>
                          <div style={{ fontWeight:800, fontSize:14, color:typeColors[form.type]?.color }}>{typeColors[form.type]?.icon} {form.type}</div>
                        </div>
                      </>)}
                    </motion.div>
                  )}

                  <motion.button
                    whileHover={formValid?{ scale:1.03, boxShadow:"0 8px 24px rgba(76,175,80,0.4)" }:{}}
                    whileTap={formValid?{ scale:.97 }:{}}
                    onClick={handleSave}
                    style={{ width:"100%", height:50, borderRadius:14, border:"none", background:formValid?`linear-gradient(135deg,${C.accent},${C.fern})`:"#C8E6C9", color:C.white, fontWeight:900, fontSize:15, cursor:formValid?"pointer":"not-allowed", transition:"background .2s", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                    <CheckCircle2 size={19}/> Save Medication Record
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const mInp = { width:"100%", height:46, border:`1.5px solid #DDE8D7`, borderRadius:12, padding:"0 14px", fontSize:14, outline:"none", background:"#fff", boxSizing:"border-box", fontFamily:"'Inter',sans-serif" };
const mSel = { ...mInp, cursor:"pointer" };

