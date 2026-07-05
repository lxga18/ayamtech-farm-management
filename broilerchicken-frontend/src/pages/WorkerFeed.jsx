import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  Wheat,
  Package,
  ChevronDown,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ClipboardList,
  RefreshCw,
  X,
  Info,
  Save,
  Search,
} from "lucide-react";

/* ─── Design Tokens ─────────────────────────────────────────────── */
const C = {
  bg:        "#F4F7F1",
  surface:   "#FFFFFF",
  border:    "#E2EAD8",
  green:     "#4CAF50",
  greenDark: "#2E7D32",
  greenMid:  "#388E3C",
  greenDim:  "#EAF7E3",
  amber:     "#F59E0B",
  amberDim:  "#FFF8EC",
  red:       "#EF4444",
  redDim:    "#FEE2E2",
  blue:      "#3B82F6",
  blueDim:   "#EFF6FF",
  purple:    "#8B5CF6",
  purpleDim: "#F0EDFF",
  teal:      "#0D9488",
  tealDim:   "#F0FDFA",
  text:      "#0F1F12",
  textMid:   "#5A7A60",
  textLight: "#9CB4A0",
  sans:      "'Plus Jakarta Sans', sans-serif",
  body:      "'Inter', sans-serif",
};

const ease   = [0.22, 1, 0.36, 1];
const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 22 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.45, delay, ease },
});

const PRICE_PER_KG = 2.2;

function localDateInput(date = new Date()) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}
function n(v, digits = 0) {
  return Number(v || 0).toLocaleString("en-MY", { minimumFractionDigits:digits, maximumFractionDigits:digits });
}
function money(v) { return `RM ${n(v, 2)}`; }
function formatDate(v) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-MY", { day:"numeric", month:"short", year:"numeric" });
}
function formatLastFeed(v) {
  if (!v) return "No feed recorded yet";
  const d = new Date(v), today = new Date();
  const diff = Math.floor((today.setHours(0,0,0,0) - d.setHours(0,0,0,0)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}
function recommendedFeedType(ageDays = 0) {
  const a = Number(ageDays || 0);
  if (a <= 14) return "Starter";
  if (a <= 35) return "Grower";
  return "Finisher";
}

const feedTypes = [
  { name:"Starter",  range:"0–14 days",  emoji:"🌱" },
  { name:"Grower",   range:"15–35 days", emoji:"🌾" },
  { name:"Finisher", range:"35+ days",   emoji:"🐔" },
];

/* ─── Toast ─────────────────────────────────────────────────────── */
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const ok = toast.type === "success";
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity:0, y:-20, scale:0.95 }} animate={{ opacity:1, y:0, scale:1 }}
        exit={{ opacity:0, y:-16, scale:0.96 }}
        style={{
          position:"fixed", top:86, right:28, zIndex:900,
          background:C.surface,
          border:`1.5px solid ${ok ? C.green : C.red}40`,
          borderLeft:`5px solid ${ok ? C.green : C.red}`,
          borderRadius:18, padding:"14px 18px",
          boxShadow:"0 20px 50px rgba(16,33,20,.18)",
          minWidth:320, display:"flex", alignItems:"center", gap:12,
          fontFamily:C.body,
        }}
      >
        {ok ? <CheckCircle2 size={20} color={C.green}/> : <AlertTriangle size={20} color={C.red}/>}
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:C.sans, fontWeight:800, fontSize:13, color:C.text }}>{toast.message}</div>
        </div>
        <motion.button whileHover={{ rotate:90 }} whileTap={{ scale:0.9 }}
          onClick={onClose}
          style={{ border:"none", background:"transparent", cursor:"pointer", color:C.textLight, display:"flex" }}>
          <X size={16}/>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Section Card ──────────────────────────────────────────────── */
function Section({ title, icon: Icon, children, right, accent = C.greenDim, iconColor = C.greenDark }) {
  return (
    <motion.section {...fadeUp(0.06)} style={{
      background:C.surface, border:`1.5px solid ${C.border}`,
      borderRadius:24, padding:22,
      boxShadow:"0 6px 24px rgba(15,31,18,.07)",
      position:"relative", overflow:"hidden",
    }}>
      {/* Subtle top accent */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${C.green},${C.greenDark})`, borderRadius:"24px 24px 0 0" }}/>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:11, background:accent, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Icon size={17} color={iconColor}/>
          </div>
          <div style={{ fontFamily:C.sans, fontWeight:900, fontSize:15, color:C.text }}>{title}</div>
        </div>
        {right}
      </div>
      {children}
    </motion.section>
  );
}

/* ─── Metric Card ───────────────────────────────────────────────── */
function Metric({ label, value, icon, color = C.text, bg = C.bg }) {
  return (
    <div style={{ background:bg, border:`1.5px solid ${C.border}`, borderRadius:16, padding:"14px 16px" }}>
      <div style={{ fontFamily:C.sans, fontWeight:900, fontSize:17, color, marginBottom:4, display:"flex", alignItems:"center", gap:6 }}>
        <span>{icon}</span> {value}
      </div>
      <div style={{ fontSize:10, color:C.textLight, textTransform:"uppercase", letterSpacing:".06em", fontWeight:800 }}>{label}</div>
    </div>
  );
}

/* ─── Quick Button ──────────────────────────────────────────────── */
function QuickButton({ children, active, onClick, color = C.green }) {
  return (
    <motion.button whileHover={{ y:-2, scale:1.04 }} whileTap={{ scale:0.96 }}
      onClick={onClick} type="button"
      style={{
        border:`1.5px solid ${active ? color : C.border}`,
        background: active ? `${color}18` : C.surface,
        color: active ? color : C.textMid,
        borderRadius:12, padding:"9px 14px",
        fontFamily:C.sans, fontWeight:800, fontSize:12, cursor:"pointer",
      }}>
      {children}
    </motion.button>
  );
}

/* ─── Input style ───────────────────────────────────────────────── */
const inputStyle = {
  width:"100%", height:54,
  border:`1.5px solid ${C.border}`, borderRadius:16,
  padding:"0 16px",
  fontFamily:"'Plus Jakarta Sans', sans-serif",
  fontSize:16, fontWeight:800, color:"#0F1F12",
  background:"#F4F7F1",
  outline:"none",
};

/* ─── Cell style ─────────────────────────────────────────────────  */
const cellStyle = {
  padding:"13px 16px",
  borderBottom:`1px solid ${C.border}`,
  color:C.textMid, fontWeight:600, fontSize:13,
};

/* ─── Main Page ─────────────────────────────────────────────────── */
export default function WorkerFeed() {
  const navigate = useNavigate();
  const location = useLocation();

  const [batches,       setBatches      ] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading,       setLoading      ] = useState(true);
  const [saving,        setSaving       ] = useState(false);

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [feedType,        setFeedType        ] = useState("Grower");
  const [quantity,        setQuantity        ] = useState("");
  const [cost,            setCost            ] = useState("");
  const [costManual,      setCostManual      ] = useState(false);
  const [usageDate,       setUsageDate       ] = useState(localDateInput());
  const [toast,           setToast           ] = useState(null);

  const queryBatchId  = new URLSearchParams(location.search).get("batch_id");
  const selectedBatch = useMemo(() => batches.find(b => b.batch_id === selectedBatchId), [batches, selectedBatchId]);
  const recommended   = useMemo(() => selectedBatch?.recommended_feed_type || recommendedFeedType(selectedBatch?.age_days), [selectedBatch]);
  const recentBatches = useMemo(() => batches.slice(0,3), [batches]);

  const formComplete =
    selectedBatchId && feedType &&
    Number(quantity) > 0 && Number(cost) >= 0 &&
    usageDate && usageDate <= localDateInput();

  useEffect(() => { fetchPageData(); }, []);

  useEffect(() => {
    if (!batches.length) return;
    const target = queryBatchId && batches.some(b => b.batch_id === queryBatchId) ? queryBatchId : batches[0].batch_id;
    setSelectedBatchId(prev => prev || target);
  }, [batches, queryBatchId]);

  useEffect(() => {
    if (!selectedBatch) return;
    setFeedType(selectedBatch.recommended_feed_type || recommendedFeedType(selectedBatch.age_days));
    if (!quantity) {
      const last = Number(selectedBatch.last_feed_quantity_kg || 0);
      const min  = Number(selectedBatch.typical_min_kg || 0);
      const max  = Number(selectedBatch.typical_max_kg || 0);
      const suggested = last || Math.round((min + max) / 2);
      if (suggested > 0) setQuantity(String(suggested));
    }
  }, [selectedBatch]);

  useEffect(() => {
    if (costManual) return;
    const q = Number(quantity || 0);
    setCost(q > 0 ? (q * PRICE_PER_KG).toFixed(2) : "");
  }, [quantity, costManual]);

  useEffect(() => {
    const id = setTimeout(() => { if (toast) setToast(null); }, 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/worker/feed/page-data");
      setBatches(Array.isArray(res.data?.batches) ? res.data.batches : []);
      setRecentRecords(Array.isArray(res.data?.recentRecords) ? res.data.recentRecords : []);
    } catch (err) {
      console.error(err);
      setToast({ type:"error", message:"Failed to load feed page data." });
    } finally { setLoading(false); }
  };

  const refreshRecent = async () => {
    try {
      const res = await API.get("/worker/feed/recent");
      setRecentRecords(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const handleSubmit = async () => {
    if (!formComplete || saving) return;
    try {
      setSaving(true);
      await API.post("/worker/feed", {
        batch_id:    selectedBatchId,
        feed_type:   feedType,
        quantity_kg: Number(quantity),
        cost:        Number(cost || 0),
        usage_date:  usageDate,
      });
      setToast({ type:"success", message:"Feed record saved successfully." });
      setCostManual(false);
      await fetchPageData();
      await refreshRecent();
    } catch (err) {
      setToast({ type:"error", message:err.response?.data?.error || "Failed to save. Please try again." });
    } finally { setSaving(false); }
  };

  const handleKeyDown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSubmit(); };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:C.body }}>
      <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1, ease:"linear" }}
        style={{ width:46, height:46, borderRadius:"50%", border:`3px solid ${C.border}`, borderTopColor:C.green }}/>
      <p style={{ color:C.textMid, fontWeight:600, fontFamily:C.sans }}>Loading feed records…</p>
    </div>
  );

  return (
    <div onKeyDown={handleKeyDown} style={{ background:C.bg, minHeight:"100vh", fontFamily:C.body, color:C.text, paddingBottom:60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; }
        .input-focus:focus { outline:none; border-color:${C.green} !important; box-shadow:0 0 0 4px ${C.green}18; }
        .select-focus:focus { outline:none; border-color:${C.green} !important; box-shadow:0 0 0 4px ${C.green}18; }
        .row-hover:hover { background:${C.greenDim} !important; transition:background .15s; }
        ::-webkit-scrollbar { width:6px; height:6px; }
        ::-webkit-scrollbar-thumb { background:#C5D9C1; border-radius:10px; }
        .spin { animation:spin 0.8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>

      <Toast toast={toast} onClose={() => setToast(null)}/>

      {/* ═══ TOPBAR ═════════════════════════════════════════════ */}
      <div style={{ position:"sticky", top:0, zIndex:200, background:"rgba(244,247,241,.94)", backdropFilter:"blur(16px)", borderBottom:`1px solid ${C.border}` }}>
        <div style={{ maxWidth:1360, margin:"0 auto", height:70, padding:"0 32px", display:"flex", alignItems:"center", gap:16 }}>

          {/* Brand */}
          <div style={{ width:44, height:44, borderRadius:14, background:`linear-gradient(135deg,${C.green},${C.greenDark})`, display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 8px 22px ${C.green}40`, animation:"float 4s ease-in-out infinite" }}>
            <Wheat size={22} color="#fff"/>
          </div>

          <div>
            <h1 style={{ margin:0, fontFamily:C.sans, fontSize:22, fontWeight:900, color:C.text, letterSpacing:-0.5 }}>Record Feed</h1>
            <p style={{ margin:"2px 0 0", fontSize:12, color:C.textMid, fontWeight:600 }}>Log daily feed consumption for any active farm batch</p>
          </div>

          {/* Spacer */}
          <div style={{ flex:1 }}/>

          {/* Today badge */}
          <div style={{ background:C.greenDim, border:`1.5px solid ${C.green}33`, borderRadius:12, padding:"8px 14px", fontSize:12, fontWeight:800, color:C.greenDark, fontFamily:C.sans }}>
            📅 {new Date().toLocaleDateString("en-MY", { weekday:"short", day:"numeric", month:"short" })}
          </div>

          {/* Refresh */}
          <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
            onClick={fetchPageData}
            style={{ border:`1.5px solid ${C.border}`, background:C.surface, borderRadius:13, padding:"10px 16px", display:"flex", alignItems:"center", gap:8, fontFamily:C.sans, fontWeight:800, fontSize:12, color:C.text, cursor:"pointer", boxShadow:"0 2px 8px rgba(15,31,18,0.05)" }}>
            <RefreshCw size={14}/> Refresh
          </motion.button>
        </div>
      </div>

      {/* ═══ MAIN ═══════════════════════════════════════════════ */}
      <main style={{ maxWidth:1360, margin:"0 auto", padding:"28px 32px 0" }}>

        {/* ── ROW 1: Batch Selector + Batch Info ───────────────── */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:20 }}>

          {/* Batch Selector */}
          <Section title="Select Batch" icon={Package}>
            {/* Dropdown */}
            <div style={{ position:"relative", marginBottom:16 }}>
              <Search size={15} color={C.textLight} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
              <select className="select-focus" value={selectedBatchId}
                onChange={e => { setSelectedBatchId(e.target.value); setQuantity(""); setCostManual(false); }}
                style={{ width:"100%", height:52, border:`1.5px solid ${C.border}`, borderRadius:16, padding:"0 44px", fontFamily:C.sans, fontWeight:800, fontSize:13, color:C.text, background:C.bg, appearance:"none", cursor:"pointer" }}>
                <option value="">Select a batch</option>
                {batches.map(b => (
                  <option key={b.batch_id} value={b.batch_id}>
                    {b.batch_id} — {b.batch_status} — Day {b.age_days} ({n(b.total_chicks)} chicks)
                  </option>
                ))}
              </select>
              <ChevronDown size={16} color={C.textLight} style={{ position:"absolute", right:15, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
            </div>

            {/* Recent batch quick-select */}
            <div style={{ fontSize:11, color:C.textMid, fontWeight:800, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:10 }}>Recent batches</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {recentBatches.length === 0 ? (
                <div style={{ color:C.textLight, fontSize:12, padding:"12px 0" }}>No active batches found.</div>
              ) : recentBatches.map(b => {
                const active = selectedBatchId === b.batch_id;
                return (
                  <motion.button key={b.batch_id} whileHover={{ x:3 }} whileTap={{ scale:0.98 }}
                    type="button"
                    onClick={() => { setSelectedBatchId(b.batch_id); setQuantity(""); setCostManual(false); }}
                    style={{
                      border:`1.5px solid ${active ? C.green : C.border}`,
                      background: active ? C.greenDim : C.surface,
                      color:C.text, borderRadius:14, padding:"11px 14px",
                      cursor:"pointer", textAlign:"left", fontFamily:C.body, fontSize:12,
                      display:"flex", justifyContent:"space-between", gap:12,
                      boxShadow: active ? `0 4px 14px ${C.green}22` : "none",
                      transition:"all .15s",
                    }}>
                    <div>
                      <strong style={{ color:C.greenDark, fontFamily:C.sans }}>{b.batch_id}</strong>
                      <span style={{ color:C.textMid, marginLeft:8 }}>Last feed: {formatLastFeed(b.last_feed_date)}</span>
                    </div>
                    <span style={{ color:C.textMid, fontWeight:700, flexShrink:0 }}>{n(b.last_feed_quantity_kg)} kg</span>
                  </motion.button>
                );
              })}
            </div>
          </Section>

          {/* Batch Info */}
          <Section title="Batch Information" icon={Info} accent={C.blueDim} iconColor={C.blue}>
            {!selectedBatch ? (
              <div style={{ padding:"28px 0", textAlign:"center", color:C.textMid }}>
                <Package size={36} color={C.textLight} style={{ marginBottom:12 }}/>
                <div style={{ fontFamily:C.sans, fontWeight:700, fontSize:14 }}>Select a batch to view details</div>
              </div>
            ) : (
              <>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:14 }}>
                  <Metric label="Age"       value={`Day ${selectedBatch.age_days||0}`}         icon="📅" color={C.blue}     bg={C.blueDim}   />
                  <Metric label="Chicks"    value={n(selectedBatch.total_chicks)}                icon="🐤" color={C.greenDark} bg={C.greenDim}  />
                  <Metric label="Feed Used" value={`${n(selectedBatch.total_feed_kg)} kg`}      icon="🌾" color={C.amber}    bg={C.amberDim}  />
                </div>

                <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:16, padding:"14px 16px", fontSize:12, color:C.textMid, lineHeight:1.9 }}>
                  <div>Last feed: <strong style={{ color:C.text }}>
                    {formatLastFeed(selectedBatch.last_feed_date)}
                    {Number(selectedBatch.last_feed_quantity_kg||0) > 0 ? ` (${n(selectedBatch.last_feed_quantity_kg)} kg)` : ""}
                  </strong></div>
                  <div>Expected today: <strong style={{ color:C.text }}>{n(selectedBatch.typical_min_kg)}–{n(selectedBatch.typical_max_kg)} kg</strong></div>
                  <div>⚠️ FCR: <strong style={{ color:C.greenDark }}>{selectedBatch.feed_efficiency||"—"} ({selectedBatch.feed_efficiency_label||"Not enough data"})</strong></div>
                </div>
              </>
            )}
          </Section>
        </div>

        {/* ── Feed Type ─────────────────────────────────────────── */}
        <Section title="Feed Type" icon={Wheat}
          right={selectedBatch && (
            <span style={{ fontSize:12, color:C.textMid, fontWeight:700, background:C.amberDim, padding:"4px 12px", borderRadius:99, border:`1px solid ${C.amber}33` }}>
              💡 Recommended: <strong style={{ color:"#92400E" }}>{recommended}</strong>
            </span>
          )}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>
            {feedTypes.map(type => {
              const active        = feedType === type.name;
              const isRecommended = recommended === type.name;
              return (
                <motion.button key={type.name} whileHover={{ y:-4, boxShadow:`0 12px 28px ${C.green}22` }} whileTap={{ scale:0.97 }}
                  onClick={() => setFeedType(type.name)} type="button"
                  style={{
                    border:`2px solid ${active ? C.green : isRecommended ? C.amber : C.border}`,
                    background: active ? C.greenDim : C.surface,
                    borderRadius:20, padding:"20px 16px",
                    cursor:"pointer", fontFamily:C.sans,
                    position:"relative", overflow:"hidden",
                    boxShadow: active ? `0 8px 24px ${C.green}28` : "none",
                    transition:"all .18s",
                    textAlign:"left",
                  }}>
                  {/* Active bar */}
                  {active && <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${C.green},${C.greenDark})` }}/>}
                  {isRecommended && (
                    <span style={{ position:"absolute", top:10, right:10, background:C.amberDim, color:"#92400E", borderRadius:99, padding:"3px 8px", fontSize:9, fontWeight:900 }}>
                      ✦ Recommended
                    </span>
                  )}
                  <div style={{ fontSize:28, marginBottom:10 }}>{type.emoji}</div>
                  <div style={{ fontSize:15, fontWeight:900, color: active ? C.greenDark : C.text, marginBottom:3 }}>
                    {type.name} {active && "✓"}
                  </div>
                  <div style={{ fontSize:11, color:C.textMid }}>{type.range}</div>
                </motion.button>
              );
            })}
          </div>
        </Section>

        {/* ── Quantity + Cost ───────────────────────────────────── */}
        <motion.div {...fadeUp(0.1)} style={{ marginTop:20, background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:24, padding:22, boxShadow:"0 6px 24px rgba(15,31,18,.07)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${C.green},${C.greenDark})`, borderRadius:"24px 24px 0 0" }}/>

          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div style={{ width:34, height:34, borderRadius:11, background:C.greenDim, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Wheat size={17} color={C.greenDark}/>
            </div>
            <div style={{ fontFamily:C.sans, fontWeight:900, fontSize:15, color:C.text }}>Quantity &amp; Cost</div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>
            {/* Quantity */}
            <div>
              <label style={{ display:"block", fontFamily:C.sans, fontWeight:900, fontSize:13, color:C.text, marginBottom:10 }}>Quantity (kg) *</label>
              <div style={{ position:"relative" }}>
                <input className="input-focus" type="number" min="0" step="0.01"
                  value={quantity} onChange={e => setQuantity(e.target.value)}
                  placeholder="850"
                  style={{ ...inputStyle, paddingRight:48 }}/>
                <span style={{ position:"absolute", right:16, top:"50%", transform:"translateY(-50%)", color:C.textMid, fontWeight:800, fontFamily:C.sans, fontSize:13 }}>kg</span>
              </div>

              <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:12 }}>
                {[500,750,850,1000,1200].map(q => (
                  <QuickButton key={q} active={quantity === String(q)} onClick={() => setQuantity(String(q))}>{q}</QuickButton>
                ))}
              </div>

              {selectedBatch && (
                <div style={{ marginTop:12, background:C.bg, border:`1px solid ${C.border}`, borderRadius:12, padding:"10px 14px", fontSize:12, color:C.textMid, lineHeight:1.8 }}>
                  <div>Last: <strong style={{ color:C.text }}>{n(selectedBatch.last_feed_quantity_kg)} kg</strong></div>
                  <div>Typical: <strong style={{ color:C.text }}>{n(selectedBatch.typical_min_kg)}–{n(selectedBatch.typical_max_kg)} kg</strong></div>
                </div>
              )}
            </div>

            {/* Cost */}
            <div>
              <label style={{ display:"block", fontFamily:C.sans, fontWeight:900, fontSize:13, color:C.text, marginBottom:10 }}>Cost (RM)</label>
              <input className="input-focus" type="number" min="0" step="0.01"
                value={cost}
                onChange={e => { setCostManual(true); setCost(e.target.value); }}
                placeholder="1870.00"
                style={inputStyle}/>

              <div style={{ marginTop:12, background:C.greenDim, border:`1.5px solid ${C.green}28`, borderRadius:14, padding:"12px 14px", fontSize:12, color:C.greenDark, lineHeight:1.8 }}>
                <div>Auto: {n(quantity)} kg × RM {PRICE_PER_KG.toFixed(2)}/kg = <strong>{money(Number(quantity||0)*PRICE_PER_KG)}</strong></div>
                <div style={{ color:C.textMid }}>💡 Rate: RM {PRICE_PER_KG.toFixed(2)}/kg (current feed rate)</div>
              </div>

              {costManual && (
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  type="button"
                  onClick={() => { setCostManual(false); setCost((Number(quantity||0)*PRICE_PER_KG).toFixed(2)); }}
                  style={{ marginTop:10, border:"none", background:"transparent", color:C.blue, fontFamily:C.sans, fontWeight:800, cursor:"pointer", fontSize:12 }}>
                  ↩ Reset to auto-calculated cost
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Date ─────────────────────────────────────────────── */}
        <motion.div {...fadeUp(0.12)} style={{ marginTop:20, background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:24, padding:22, boxShadow:"0 6px 24px rgba(15,31,18,.07)", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${C.green},${C.greenDark})`, borderRadius:"24px 24px 0 0" }}/>

          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
            <div style={{ width:34, height:34, borderRadius:11, background:C.blueDim, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <CalendarDays size={17} color={C.blue}/>
            </div>
            <div style={{ fontFamily:C.sans, fontWeight:900, fontSize:15, color:C.text }}>Date</div>
          </div>

          <div style={{ maxWidth:500 }}>
            <div style={{ position:"relative", marginBottom:14 }}>
              <CalendarDays size={16} color={C.textLight} style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
              <input className="input-focus" type="date" value={usageDate} max={localDateInput()}
                onChange={e => setUsageDate(e.target.value)}
                style={{ ...inputStyle, paddingLeft:44 }}/>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <QuickButton active={usageDate === localDateInput()} onClick={() => setUsageDate(localDateInput())}>Today</QuickButton>
              <QuickButton active={usageDate === localDateInput(new Date(Date.now()-86400000))}
                onClick={() => { const d = new Date(); d.setDate(d.getDate()-1); setUsageDate(localDateInput(d)); }}>
                Yesterday
              </QuickButton>
            </div>
          </div>
        </motion.div>

        {/* ── Submit ────────────────────────────────────────────── */}
        <motion.section {...fadeUp(0.14)} style={{ marginTop:20 }}>
          <motion.button
            whileHover={formComplete && !saving ? { y:-3, boxShadow:`0 16px 36px ${C.green}40` } : {}}
            whileTap={formComplete && !saving ? { scale:0.98 } : {}}
            disabled={!formComplete || saving}
            onClick={handleSubmit} type="button"
            style={{
              width:"100%", height:60, border:"none", borderRadius:20,
              background: formComplete ? `linear-gradient(135deg,${C.green},${C.greenDark})` : "#D1DDD0",
              color:"#fff", fontFamily:C.sans, fontSize:16, fontWeight:900,
              cursor: formComplete && !saving ? "pointer" : "not-allowed",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              boxShadow: formComplete ? `0 8px 28px ${C.green}35` : "none",
              transition:"all .2s",
            }}>
            {saving
              ? <><Loader2 size={20} className="spin"/> Saving…</>
              : <><Save size={20}/> 🌾 Save Feed Record</>
            }
          </motion.button>
          <div style={{ textAlign:"center", marginTop:10, fontSize:11, color:C.textMid }}>
            Or press <kbd style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:"2px 6px", fontSize:11, fontFamily:C.body }}>Ctrl+Enter</kbd> to submit
          </div>
        </motion.section>

        {/* ── Recent Feed Records ───────────────────────────────── */}
        <motion.section {...fadeUp(0.16)} style={{ marginTop:24, background:C.surface, border:`1.5px solid ${C.border}`, borderRadius:24, overflow:"hidden", boxShadow:"0 6px 24px rgba(15,31,18,.07)" }}>

          {/* Header */}
          <div style={{ padding:"18px 22px", borderBottom:`1.5px solid ${C.border}`, display:"flex", alignItems:"center", gap:10, background:`linear-gradient(135deg,${C.greenDim},${C.surface})` }}>
            <div style={{ width:34, height:34, borderRadius:11, background:C.surface, border:`1.5px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ClipboardList size={17} color={C.greenDark}/>
            </div>
            <div>
              <div style={{ fontFamily:C.sans, fontWeight:900, fontSize:15, color:C.text }}>Recent Feed Records</div>
              <div style={{ fontSize:11, color:C.textMid, fontWeight:600 }}>Last 10 records across all batches</div>
            </div>
          </div>

          {recentRecords.length === 0 ? (
            <div style={{ padding:"40px 0", textAlign:"center", color:C.textMid }}>
              <Wheat size={36} color={C.textLight} style={{ marginBottom:12 }}/>
              <div style={{ fontFamily:C.sans, fontWeight:800, fontSize:14 }}>No recent feed records</div>
              <div style={{ fontSize:12, marginTop:4 }}>Save a feed record to see it here.</div>
            </div>
          ) : (
            <div style={{ overflowX:"auto" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:C.greenDim }}>
                    {["Batch","Date","Type","Quantity","Cost","Recorded By"].map(h => (
                      <th key={h} style={{ padding:"13px 16px", textAlign:"left", color:C.greenDark, fontFamily:C.sans, fontWeight:900, fontSize:11, letterSpacing:".07em", textTransform:"uppercase", borderBottom:`1.5px solid ${C.border}` }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((r, idx) => (
                    <tr key={r.feed_usage_id || `${r.batch_id}-${r.usage_date}-${idx}`}
                      className="row-hover"
                      style={{ background: r.is_mine ? `${C.greenDim}` : idx % 2 === 0 ? C.surface : C.bg }}>
                      <td style={cellStyle}><strong style={{ color:C.blue, fontFamily:C.sans }}>{r.batch_id}</strong></td>
                      <td style={cellStyle}>{formatDate(r.usage_date)}</td>
                      <td style={cellStyle}>
                        <span style={{ background:C.greenDim, color:C.greenDark, borderRadius:99, padding:"3px 10px", fontSize:11, fontWeight:800, fontFamily:C.sans }}>
                          {r.feed_type || "—"}
                        </span>
                      </td>
                      <td style={{ ...cellStyle, fontFamily:C.sans, fontWeight:800, color:C.text }}>{n(r.quantity_kg)} kg</td>
                      <td style={{ ...cellStyle, fontFamily:C.sans, fontWeight:800, color:C.greenDark }}>{money(r.cost)}</td>
                      <td style={cellStyle}>
                        <span style={{ background:r.is_mine ? C.green : C.bg, color:r.is_mine ? "#fff" : C.textMid, borderRadius:99, padding:"4px 10px", fontSize:11, fontWeight:800, fontFamily:C.sans }}>
                          {r.recorded_by || r.user_id}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>

      </main>
    </div>
  );
}