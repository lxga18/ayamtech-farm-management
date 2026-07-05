import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Search, Filter, Eye, TrendingUp, TrendingDown, Zap,
  BarChart2, DollarSign, Scale, Wheat, X, ChevronUp, ChevronDown,
  ShoppingCart, Award, AlertTriangle, Package, ArrowUpRight
} from "lucide-react";

/* ─── Design Tokens ─────────────────────────────────────────────── */
const C = {
  forest:   "#102114",
  pine:     "#244128",
  fern:     "#3A7D1C",
  sage:     "#6E8A72",
  mist:     "#DDE8D7",
  foam:     "#F6F8F3",
  white:    "#ffffff",
  amber:    "#B7791F",
  amberBg:  "#FFF3D9",
  blue:     "#2563EB",
  blueBg:   "#E8F1FF",
  red:      "#B91C1C",
  redBg:    "#FEE2E2",
  green:    "#EAF7E3",
  gray:     "#6B7280",
  grayBg:   "#F3F4F6",
  accent:   "#4CAF50",
};

const money = (v) =>
  `RM ${Number(v || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-CA") : "—";

/* ─── Badge helpers ─────────────────────────────────────────────── */
const paymentCfg = {
  Paid:    { bg: C.green,   color: C.fern  },
  Pending: { bg: C.amberBg, color: C.amber },
  Failed:  { bg: C.redBg,   color: C.red   },
};
const statusCfg = {
  "Sold":              { bg: C.green,   color: C.fern  },
  "Completed":         { bg: C.green,   color: C.fern  },
  "Partially Sold":    { bg: C.blueBg,  color: C.blue  },
  "Ready to be Sold":  { bg: C.blueBg,  color: C.blue  },
  "Growing":           { bg: C.amberBg, color: C.amber },
};
const fcrCfg = {
  Excellent: { color: C.fern,  barColor: C.accent, bg: C.green,   emoji: "🏆" },
  Good:      { color: C.amber, barColor: "#F59E0B", bg: C.amberBg, emoji: "👍" },
  Poor:      { color: C.red,   barColor: "#EF4444", bg: C.redBg,   emoji: "⚠️" },
};
const getBadge = (cfg, key) => cfg[key] || { bg: C.grayBg, color: C.gray };
const fcrBarWidth = (fcr) => Math.max(4, Math.min(100, Math.round(((3.0 - Number(fcr||0)) / 1.4) * 100)));

/* ─── Micro components ──────────────────────────────────────────── */
function Pill({ children, bg, color }) {
  return (
    <span style={{ padding:"5px 11px", borderRadius:999, fontSize:12, fontWeight:800, background:bg, color, whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

/* ─── Summary Bubble — fully contained, no overflow ─────────────── */
function SummaryBubble({ label, value, color, sub, icon: Icon, delay = 0 }) {
  // Shrink font when value string is long
  const valStr = String(value);
  const fontSize = valStr.length > 10 ? 13 : valStr.length > 7 ? 15 : 18;

  return (
    <motion.div
      initial={{ opacity:0, scale:.88 }} animate={{ opacity:1, scale:1 }}
      transition={{ delay, type:"spring", stiffness:260, damping:22 }}
      whileHover={{ y:-4 }}
      style={{
        background: C.white,
        borderRadius: 20,
        padding: "14px 14px",
        border: `1.5px solid ${C.mist}`,
        boxShadow: "0 4px 20px rgba(16,33,20,0.07)",
        position: "relative",
        overflow: "hidden",
        minWidth: 0,        // critical — prevents grid blowout
        flex: "1 1 0",
      }}
    >
      {/* Decorative circle */}
      <div style={{ position:"absolute", top:-20, right:-20, width:72, height:72, borderRadius:"50%", background:color, opacity:.1, pointerEvents:"none" }} />

      {/* Icon row */}
      <div style={{ width:32, height:32, borderRadius:10, background:color+"22", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10, flexShrink:0 }}>
        <Icon size={16} color={color} strokeWidth={2} />
      </div>

      {/* Value — single line, clipped if still too long */}
      <div style={{
        fontFamily: "'Plus Jakarta Sans',sans-serif",
        fontSize,
        fontWeight: 900,
        color: color || C.forest,
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        marginBottom: 4,
      }}>
        {value}
      </div>

      {/* Label */}
      <div style={{
        fontSize: 10,
        color: C.sage,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}>
        {label}
      </div>

      {/* Sub */}
      {sub && (
        <div style={{
          fontSize: 10,
          color: "#9AA89B",
          marginTop: 3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {sub}
        </div>
      )}
    </motion.div>
  );
}

/* ─── FCR Card — horizontal strip style ─────────────────────────── */
function FCRStrip({ batch, index }) {
  const cfg = fcrCfg[batch.rating] || { color:C.gray, barColor:"#9CA3AF", bg:C.grayBg, emoji:"—" };
  const bar = fcrBarWidth(batch.fcr);
  const isLoss = Number(batch.profit_impact) > 0;

  return (
    <motion.div
      initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
      transition={{ delay: index * 0.06, type:"spring", stiffness:260, damping:24 }}
      whileHover={{ scale:1.015, boxShadow:"0 12px 40px rgba(16,33,20,0.12)" }}
      style={{ background:C.white, borderRadius:20, padding:"18px 22px", border:`1.5px solid ${C.mist}`, boxShadow:"0 3px 14px rgba(16,33,20,0.06)", display:"grid", gridTemplateColumns:"auto 1fr auto", gap:18, alignItems:"center", cursor:"default" }}
    >
      {/* Left: rating emoji + batch id */}
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:28, marginBottom:4 }}>{cfg.emoji}</div>
        <div style={{ fontWeight:800, fontSize:13, color:C.forest, whiteSpace:"nowrap" }}>{batch.batch_id}</div>
        <Pill bg={cfg.bg} color={cfg.color}>{batch.rating}</Pill>
      </div>

      {/* Middle: bar + stats */}
      <div>
        <div style={{ display:"flex", alignItems:"baseline", gap:6, marginBottom:6 }}>
          <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:34, fontWeight:900, color:cfg.color, lineHeight:1 }}>{batch.fcr}</span>
          <span style={{ fontSize:12, color:C.sage, fontWeight:600 }}>kg feed / kg sold</span>
        </div>
        <div style={{ height:8, background:C.mist, borderRadius:99, overflow:"hidden", marginBottom:12 }}>
          <motion.div initial={{ width:0 }} animate={{ width:`${bar}%` }} transition={{ delay: index*0.06+0.2, duration:.7, ease:"easeOut" }}
            style={{ height:"100%", background:`linear-gradient(90deg,${cfg.barColor}88,${cfg.barColor})`, borderRadius:99 }} />
        </div>
        <div style={{ display:"flex", gap:20, flexWrap:"wrap" }}>
          {[
            { label:"Feed Used",    val:`${Number(batch.feed_used||0).toLocaleString()} kg` },
            { label:"Weight Sold",  val:`${Number(batch.weight_sold||0).toLocaleString()} kg` },
            { label:"Revenue",      val:money(batch.revenue) },
          ].map(i => (
            <div key={i.label}>
              <div style={{ fontSize:11, color:C.sage, marginBottom:2 }}>{i.label}</div>
              <div style={{ fontWeight:700, fontSize:13, color:C.forest }}>{i.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: profit impact */}
      <div style={{ background: isLoss ? C.redBg : C.green, borderRadius:14, padding:"12px 16px", textAlign:"center", minWidth:130 }}>
        <div style={{ fontSize:11, color: isLoss ? C.red : C.fern, fontWeight:700, marginBottom:4, whiteSpace:"nowrap" }}>
          vs ideal FCR 1.6
        </div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
          {isLoss ? <TrendingDown size={16} color={C.red}/> : <TrendingUp size={16} color={C.fern}/>}
          <span style={{ fontWeight:900, fontSize:14, color: isLoss ? C.red : C.fern }}>
            {isLoss ? `−${money(batch.profit_impact)}` : "On target ✓"}
          </span>
        </div>
        {isLoss && <div style={{ fontSize:10, color:C.red, marginTop:3, opacity:.75 }}>extra feed cost</div>}
      </div>
    </motion.div>
  );
}

/* ─── Sale Detail Modal ──────────────────────────────────────────── */
function SaleModal({ sale, onClose }) {
  if (!sale) return null;

  const pc = getBadge(paymentCfg, sale.payment_status);
  const sc = getBadge(statusCfg,  sale.batch_status);

  const rows = [
    { label:"Order ID",       value: sale.order_id },
    { label:"Batch",          value: sale.batch_id },
    { label:"Sale Date",      value: fmt(sale.sales_date) },
    { label:"Quantity Sold",  value: sale.quantity_sold },
    { label:"Total Weight",   value: `${Number(sale.total_weight_kg||0).toLocaleString()} kg` },
    { label:"Price / kg",     value: money(sale.price_per_kg) },
  ];

  return (
    <AnimatePresence>
      {sale && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={onClose}
            style={{ position:"fixed", inset:0, background:"rgba(10,22,12,0.55)", backdropFilter:"blur(6px)", zIndex:1000 }}
          />

          {/* Modal card */}
          <motion.div
            key="modal"
            initial={{ opacity:0, scale:.88, y:40 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:.88, y:40 }}
            transition={{ type:"spring", stiffness:320, damping:28 }}
            style={{
              position: "fixed",
              inset: 0,
              margin: "auto",
              width: "min(520px, 92vw)",
              height: "fit-content",
              zIndex: 1001,
              borderRadius: 28,
              overflow: "hidden",
              boxShadow: "0 32px 80px rgba(10,22,12,0.38), 0 0 0 1.5px rgba(255,255,255,0.07)",
              background: C.white,
              fontFamily: "'Inter',sans-serif",
            }}
          >
            {/* ── Hero header ── */}
            <div style={{
              background: `linear-gradient(145deg, ${C.forest} 0%, ${C.pine} 60%, #1C5C26 100%)`,
              padding: "28px 28px 24px",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{ position:"absolute", top:-40, right:-40, width:140, height:140, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}/>
              <div style={{ position:"absolute", bottom:-20, left:60, width:80, height:80, borderRadius:"50%", background:"rgba(76,175,80,0.12)" }}/>

              <motion.button
                whileHover={{ rotate:90, scale:1.12 }} whileTap={{ scale:.88 }}
                onClick={onClose}
                style={{ position:"absolute", top:18, right:18, border:"none", background:"rgba(255,255,255,0.13)", borderRadius:10, width:36, height:36, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
              >
                <X size={17} color="rgba(255,255,255,0.85)" />
              </motion.button>

              <div style={{ fontSize:11, color:"rgba(255,255,255,0.45)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:6 }}>
                Sale Detail
              </div>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:900, color:C.white, marginBottom:4, letterSpacing:"-0.02em" }}>
                {sale.sales_id}
              </div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,0.6)", marginBottom:18 }}>
                {sale.customer_name}
              </div>

              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: "10px 18px",
                border: "1px solid rgba(255,255,255,0.12)",
              }}>
                <DollarSign size={18} color={C.accent} />
                <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:26, fontWeight:900, color:"#fff", letterSpacing:"-0.03em" }}>
                  {money(sale.total_amount)}
                </span>
              </div>
            </div>

            {/* ── Status row ── */}
            <div style={{ display:"flex", gap:10, padding:"16px 28px", borderBottom:`1.5px solid ${C.mist}`, background:C.foam }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:5 }}>Payment</div>
                <Pill bg={pc.bg} color={pc.color}>{sale.payment_status}</Pill>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:10, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:5 }}>Batch Status</div>
                <Pill bg={sc.bg} color={sc.color}>{sale.batch_status}</Pill>
              </div>
            </div>

            {/* ── Detail rows ── */}
            <div style={{ padding:"18px 28px 26px", display:"flex", flexDirection:"column", gap:8 }}>
              {rows.map(({ label, value }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 14px", background:C.foam, borderRadius:12, border:`1px solid ${C.mist}` }}>
                  <span style={{ fontSize:12, color:C.sage, fontWeight:600 }}>{label}</span>
                  <span style={{ fontSize:13, fontWeight:800, color:C.forest }}>{value || "—"}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function OwnerSales() {
  const [salesRecords, setSalesRecords] = useState([]);
  const [fcrData, setFcrData]           = useState([]);
  const [search, setSearch]             = useState("");
  const [batchFilter, setBatchFilter]   = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading]           = useState(true);
  const [fcrOpen, setFcrOpen]           = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [sortCol, setSortCol]           = useState(null);
  const [sortDir, setSortDir]           = useState("asc");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [sRes, fRes] = await Promise.all([
        axios.get("http://localhost:5000/api/owner/sales"),
        axios.get("http://localhost:5000/api/owner/sales/fcr-impact"),
      ]);
      setSalesRecords(sRes.data);
      setFcrData(fRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const batchOptions = useMemo(() =>
    ["All", ...new Set(salesRecords.map(s => s.batch_id).filter(Boolean))],
  [salesRecords]);

  const filtered = useMemo(() => {
    let list = salesRecords.filter(s => {
      const kw = search.toLowerCase();
      return (
        (s.sales_id?.toLowerCase().includes(kw) ||
         s.customer_name?.toLowerCase().includes(kw) ||
         s.batch_id?.toLowerCase().includes(kw) ||
         s.order_id?.toLowerCase().includes(kw)) &&
        (batchFilter   === "All" || s.batch_id       === batchFilter) &&
        (paymentFilter === "All" || s.payment_status === paymentFilter) &&
        (statusFilter  === "All" || s.batch_status   === statusFilter)
      );
    });
    if (sortCol) {
      list = [...list].sort((a,b) => {
        let av = a[sortCol], bv = b[sortCol];
        if (!isNaN(Number(av))) { av = Number(av); bv = Number(bv); }
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [salesRecords, search, batchFilter, paymentFilter, statusFilter, sortCol, sortDir]);

  const summary = useMemo(() => {
    const totalRevenue   = salesRecords.reduce((s,r) => s + Number(r.total_amount||0), 0);
    const totalWeight    = salesRecords.reduce((s,r) => s + Number(r.total_weight_kg||0), 0);
    const totalChickens  = salesRecords.reduce((s,r) => s + Number(r.quantity_sold||0), 0);
    const paidCount      = salesRecords.filter(r => r.payment_status === "Paid").length;
    const totalFeed      = fcrData.reduce((s,b) => s + Number(b.feed_used||0), 0);
    const totalWSold     = fcrData.reduce((s,b) => s + Number(b.weight_sold||0), 0);
    const overallFCR     = totalWSold ? +(totalFeed / totalWSold).toFixed(2) : 0;
    const profitLost     = fcrData.reduce((s,b) => s + Number(b.profit_impact||0), 0);
    return { totalRevenue, totalWeight, totalChickens, paidCount, overallFCR, profitLost };
  }, [salesRecords, fcrData]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const SortIcon = ({ col }) => sortCol !== col ? null :
    sortDir === "asc" ? <ChevronUp size={12}/> : <ChevronDown size={12}/>;

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", gap:14, alignItems:"center", justifyContent:"center", background:C.foam, fontFamily:"'Inter',sans-serif", color:C.sage }}>
      <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1.2, ease:"linear" }}>
        <BarChart2 size={38} color={C.fern} />
      </motion.div>
      <span style={{ fontWeight:700, fontSize:16 }}>Loading sales data…</span>
    </div>
  );

  // Format FCR Profit Gap value for display (shorten to avoid overflow)
  const profitGapValue = summary.profitLost > 0
    ? `−RM ${Number(summary.profitLost).toLocaleString("en-MY", { maximumFractionDigits: 0 })}`
    : "On Target ✓";

  return (
    <div style={{ padding:"32px 36px", background:C.foam, minHeight:"100vh", fontFamily:"'Inter',sans-serif" }}>

      {/* ── Sale Detail Modal ── */}
      <SaleModal sale={selectedSale} onClose={() => setSelectedSale(null)} />

      {/* ── Header ── */}
      <motion.div initial={{ opacity:0, y:-18 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:30 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:20 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <div style={{ width:8, height:36, borderRadius:99, background:`linear-gradient(180deg,${C.accent},${C.pine})` }} />
              <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:32, fontWeight:900, color:C.forest, margin:0, letterSpacing:"-0.03em" }}>
                Sales Management
              </h1>
            </div>
            <p style={{ color:C.sage, fontSize:14, margin:"0 0 0 18px", fontWeight:500 }}>
              Monitor real sales records and feed conversion impact on sales performance.
            </p>
          </div>

          {/* Live revenue chip */}
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:300, delay:.35 }}
            style={{ background:`linear-gradient(135deg,${C.forest},${C.pine})`, borderRadius:16, padding:"12px 20px", display:"flex", flexDirection:"column", alignItems:"flex-end", flexShrink:0 }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.55)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>Total Revenue</div>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:900, color:C.white, letterSpacing:"-0.02em" }}>{money(summary.totalRevenue)}</div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Summary Row — 6 equal cards, all contained ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, minmax(0, 1fr))",  // minmax(0,1fr) prevents blowout
        gap: 12,
        marginBottom: 26,
      }}>
        <SummaryBubble delay={.05} icon={ShoppingCart}
          label="Total Sales"
          value={salesRecords.length}
          color={C.blue}
          sub="All records" />

        <SummaryBubble delay={.10} icon={Scale}
          label="Weight Sold"
          value={`${summary.totalWeight.toLocaleString()} kg`}
          color={C.fern}
          sub="Total live weight" />

        <SummaryBubble delay={.15} icon={Package}
          label="Chickens Sold"
          value={summary.totalChickens.toLocaleString()}
          color={C.pine}
          sub="Units" />

        <SummaryBubble delay={.20} icon={Award}
          label="Paid Orders"
          value={summary.paidCount}
          color={C.fern}
          sub="Payment confirmed" />

        <SummaryBubble delay={.25} icon={Wheat}
          label="Overall FCR"
          value={summary.overallFCR || "—"}
          color={summary.overallFCR <= 1.6 ? C.fern : summary.overallFCR <= 2.0 ? C.amber : C.red}
          sub="kg feed / kg sold" />

        <SummaryBubble delay={.30}
          icon={summary.profitLost > 0 ? AlertTriangle : Zap}
          label="FCR Profit Gap"
          value={profitGapValue}
          color={summary.profitLost > 0 ? C.red : C.fern}
          sub="vs ideal FCR 1.6" />
      </div>

      {/* ── FCR Section ── */}
      <motion.div layout style={{ background:C.white, borderRadius:24, padding:"22px 24px", boxShadow:"0 4px 20px rgba(16,33,20,0.07)", border:`1.5px solid ${C.mist}`, marginBottom:22, overflow:"hidden" }}>
        <button onClick={() => setFcrOpen(v => !v)}
          style={{ width:"100%", background:"none", border:"none", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center", padding:0, marginBottom: fcrOpen ? 18 : 0 }}>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:20, fontWeight:800, color:C.forest, display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:10, background:C.green, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <BarChart2 size={17} color={C.fern} />
              </div>
              FCR & Sales Impact
            </div>
            <div style={{ fontSize:13, color:C.sage, marginTop:4, marginLeft:42 }}>
              Feed Conversion Ratio — how efficiently feed converts into sellable weight.
            </div>
          </div>
          <motion.div animate={{ rotate: fcrOpen ? 0 : -90 }} transition={{ duration:.25 }}>
            <ChevronDown size={22} color={C.sage} />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {fcrOpen && (
            <motion.div
              key="fcr-body"
              initial={{ opacity:0, height:0 }}
              animate={{ opacity:1, height:"auto" }}
              exit={{ opacity:0, height:0 }}
              transition={{ duration:.3 }}
              style={{ overflow:"hidden" }}
            >
              {fcrData.length === 0 ? (
                <div style={{ color:C.sage, fontSize:14, padding:"12px 0" }}>No FCR data available yet.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {fcrData.map((batch, i) => <FCRStrip key={batch.batch_id} batch={batch} index={i} />)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Sales Table Card ── */}
      <motion.div layout style={{ background:C.white, borderRadius:24, padding:"22px 24px", boxShadow:"0 4px 20px rgba(16,33,20,0.07)", border:`1.5px solid ${C.mist}` }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:20, fontWeight:800, color:C.forest }}>Sales Records</div>
            <div style={{ fontSize:13, color:C.sage, marginTop:3 }}>
              <span style={{ fontWeight:700, color:C.fern }}>{filtered.length}</span> record{filtered.length !== 1 ? "s" : ""} shown
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background:C.foam, borderRadius:16, padding:"16px 18px", border:`1.5px solid ${C.mist}`, marginBottom:18 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr 1fr 1fr auto", gap:14, alignItems:"end" }}>
            <div>
              <label style={lbl}>Search</label>
              <div style={{ display:"flex", alignItems:"center", gap:8, height:44, border:`1.5px solid ${C.mist}`, borderRadius:12, padding:"0 13px", background:C.white }}>
                <Search size={15} color={C.sage}/>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Sales ID, customer, batch, order…"
                  style={{ border:"none", outline:"none", background:"transparent", width:"100%", fontSize:14, color:C.forest }} />
              </div>
            </div>
            {[
              { l:"Batch",   v:batchFilter,   s:setBatchFilter,   opts:batchOptions },
              { l:"Payment", v:paymentFilter, s:setPaymentFilter, opts:["All","Paid","Pending","Failed"] },
              { l:"Status",  v:statusFilter,  s:setStatusFilter,  opts:["All","Sold","Partially Sold","Ready to be Sold","Growing"] },
            ].map(f => (
              <div key={f.l}>
                <label style={lbl}>{f.l}</label>
                <select value={f.v} onChange={e => f.s(e.target.value)}
                  style={{ width:"100%", height:44, border:`1.5px solid ${C.mist}`, borderRadius:12, padding:"0 12px", fontSize:14, outline:"none", background:C.white, color:C.forest, fontWeight:600 }}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:.96 }}
              onClick={() => { setSearch(""); setBatchFilter("All"); setPaymentFilter("All"); setStatusFilter("All"); setSortCol(null); }}
              style={{ height:44, padding:"0 16px", borderRadius:12, border:`1.5px solid ${C.mist}`, background:C.white, color:C.pine, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
              <Filter size={14}/> Reset
            </motion.button>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:900 }}>
            <thead>
              <tr style={{ background:C.foam }}>
                {[
                  { label:"Sales ID",    col:"sales_id"       },
                  { label:"Order ID",    col:"order_id"       },
                  { label:"Batch",       col:"batch_id"       },
                  { label:"Customer",    col:"customer_name"  },
                  { label:"Date",        col:"sales_date"     },
                  { label:"Qty",         col:"quantity_sold"  },
                  { label:"Weight",      col:"total_weight_kg"},
                  { label:"Price/kg",    col:"price_per_kg"   },
                  { label:"Total",       col:"total_amount"   },
                  { label:"Payment",     col:null             },
                  { label:"Status",      col:null             },
                  { label:"",            col:null             },
                ].map(({ label, col }) => (
                  <th key={label}
                    onClick={() => col && toggleSort(col)}
                    style={{ padding:"10px 10px", textAlign:"left", fontSize:11, fontWeight:800, color:C.sage, textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap", cursor: col ? "pointer" : "default", userSelect:"none" }}>
                    <span style={{ display:"inline-flex", alignItems:"center", gap:3 }}>
                      {label}<SortIcon col={col}/>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((sale, i) => {
                  const pc = getBadge(paymentCfg, sale.payment_status);
                  const sc = getBadge(statusCfg, sale.batch_status);
                  return (
                    <motion.tr key={sale.sales_id}
                      initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderTop:`1px solid ${C.mist}`, transition:"background .18s" }}>
                      <td style={{ ...tdc, fontWeight:800, color:C.forest }}>{sale.sales_id}</td>
                      <td style={tdc}>{sale.order_id}</td>
                      <td style={tdc}>{sale.batch_id}</td>
                      <td style={tdc}>{sale.customer_name}</td>
                      <td style={tdc}>{fmt(sale.sales_date)}</td>
                      <td style={tdc}>{sale.quantity_sold}</td>
                      <td style={tdc}>{Number(sale.total_weight_kg||0).toLocaleString()} kg</td>
                      <td style={tdc}>{money(sale.price_per_kg)}</td>
                      <td style={{ ...tdc, fontWeight:800, color:C.forest }}>{money(sale.total_amount)}</td>
                      <td style={tdc}><Pill bg={pc.bg} color={pc.color}>{sale.payment_status}</Pill></td>
                      <td style={tdc}><Pill bg={sc.bg} color={sc.color}>{sale.batch_status}</Pill></td>
                      <td style={{ padding:"13px 10px" }}>
                        <motion.button whileHover={{ scale:1.14 }} whileTap={{ scale:.9 }}
                          onClick={() => setSelectedSale(sale)}
                          style={{ width:34, height:34, borderRadius:10, border:`1.5px solid ${C.mist}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Eye size={15} color={C.pine}/>
                        </motion.button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"52px 0", color:C.sage }}>
              <BarChart2 size={42} color={C.mist} style={{ marginBottom:12 }} />
              <div style={{ fontWeight:700 }}>No sales records match your filters.</div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const lbl = { fontSize:11, color:C.sage, fontWeight:700, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" };
const tdc = { padding:"13px 10px", color:"#4B5E4F", fontSize:13, whiteSpace:"nowrap" };