import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Search, Filter, Layers, Wheat, DollarSign, BarChart2, Hash, TrendingUp } from "lucide-react";


/* ─── Design Tokens ─────────────────────────────────────────────── */
const C = {
  forest:  "#102114",
  pine:    "#244128",
  fern:    "#3A7D1C",
  sage:    "#6E8A72",
  mist:    "#DDE8D7",
  foam:    "#F6F8F3",
  white:   "#ffffff",
  amber:   "#B7791F",
  amberBg: "#FFF3D9",
  blue:    "#2563EB",
  blueBg:  "#E8F1FF",
  accent:  "#4CAF50",
};

const BATCH_COLORS = [
  "#4CAF50",
  "#2563EB",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#14B8A6",
  "#EC4899",
  "#64748B",
];


const money = (v) =>
  `RM ${Number(v || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-CA") : "—";

/* ─── Stage config ───────────────────────────────────────────────── */
const stageCfg = {
  Starter:  { bg: "#E8F4FF", color: "#1D4E89", emoji: "🐣" },
  Grower:   { bg: C.amberBg, color: C.amber,   emoji: "🐔" },
  Finisher: { bg: "#EAF7E3", color: C.fern,    emoji: "✅" },
};
const getStage = (s) => stageCfg[s] || { bg: "#F3F4F6", color: "#6B7280", emoji: "🌾" };

/* ─── KPI Card ───────────────────────────────────────────────────── */
const kpiMeta = [
  { icon: Wheat,      iconBg:"#EAF7E3", iconColor:C.fern  },
  { icon: DollarSign, iconBg:C.amberBg, iconColor:C.amber },
  { icon: TrendingUp, iconBg:"#EEF2FF", iconColor:C.blue  },
  { icon: Hash,       iconBg:"#F3F4F6", iconColor:C.sage  },
];

function KpiCard({ title, value, sub, index }) {
  const { icon: Icon, iconBg, iconColor } = kpiMeta[index];
  return (
    <motion.div
      initial={{ opacity:0, y:22 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.07, type:"spring", stiffness:280, damping:24 }}
      whileHover={{ y:-4, boxShadow:"0 20px 48px rgba(16,33,20,0.13)" }}
      style={{ background:C.white, borderRadius:24, padding:"22px 20px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)", position:"relative", overflow:"hidden" }}
    >
      <div style={{ position:"absolute", top:-22, right:-22, width:76, height:76, borderRadius:"50%", background:iconBg, opacity:.5 }}/>
      <div style={{ width:40, height:40, borderRadius:13, background:iconBg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
        <Icon size={20} color={iconColor} strokeWidth={2}/>
      </div>
      <div style={{ fontSize:11, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:4 }}>{title}</div>
      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:26, fontWeight:900, color:C.forest, lineHeight:1.1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:11, color:"#9AA89B" }}>{sub}</div>
    </motion.div>
  );
}


/* ─── Main ───────────────────────────────────────────────────────── */
export default function OwnerFeed() {
  const [feedRecords, setFeedRecords]   = useState([]);
  const [batchSummary, setBatchSummary] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [batchFilter, setBatchFilter]   = useState("All");
  const [dateFilter, setDateFilter]     = useState("");
  const [monthFilter, setMonthFilter]   = useState("");
  const [groupByBatch, setGroupByBatch] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [fRes, sRes] = await Promise.all([
        axios.get("http://localhost:5000/api/owner/feed-usage"),
        axios.get("http://localhost:5000/api/owner/feed-usage/group-by-batch"),
      ]);
      setFeedRecords(fRes.data);
      setBatchSummary(sRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const batchOptions = useMemo(() =>
    ["All", ...new Set(feedRecords.map(f => f.batch_id).filter(Boolean))],
  [feedRecords]);

  const monthOptions = useMemo(() =>
    ["All", ...new Set(feedRecords.map(f => f.usage_month).filter(Boolean))],
  [feedRecords]);

  const allBatches = useMemo(
  () => [...new Set(feedRecords.map((f) => f.batch_id).filter(Boolean))],
  [feedRecords]
);


  const filteredFeeds = useMemo(() => feedRecords.filter(feed => {
    const kw = search.toLowerCase();
    return (
      (feed.feed_usage_id?.toLowerCase().includes(kw) ||
       feed.batch_id?.toLowerCase().includes(kw) ||
       feed.feed_type?.toLowerCase().includes(kw)) &&
      (batchFilter === "All" || feed.batch_id === batchFilter) &&
      (!dateFilter  || fmt(feed.usage_date)  === dateFilter) &&
      (!monthFilter || monthFilter === "All" || feed.usage_month === monthFilter)
    );
  }), [feedRecords, search, batchFilter, dateFilter, monthFilter]);

  const filteredBatchSummary = useMemo(() =>
    batchFilter === "All" ? batchSummary : batchSummary.filter(b => b.batch_id === batchFilter),
  [batchSummary, batchFilter]);

  const overview = useMemo(() => {
    const totalFeed = filteredFeeds.reduce((s,f) => s + Number(f.quantity_kg||0), 0);
    const totalCost = filteredFeeds.reduce((s,f) => s + Number(f.cost||0), 0);
    return { totalFeed, totalCost, avgPrice: totalFeed ? totalCost/totalFeed : 0, totalRecords: filteredFeeds.length };
  }, [filteredFeeds]);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", gap:14, alignItems:"center", justifyContent:"center", background:C.foam, fontFamily:"'Inter',sans-serif", color:C.sage }}>
      <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1.2, ease:"linear" }}>
        <Wheat size={36} color={C.fern}/>
      </motion.div>
      <span style={{ fontWeight:700, fontSize:16 }}>Loading feed data…</span>
    </div>
  );

  return (
    <div style={{ padding:"32px 36px", background:C.foam, minHeight:"100vh", fontFamily:"'Inter',sans-serif" }}>

      {/* ── Header ── */}
      <motion.div initial={{ opacity:0, y:-18 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:30 }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:20 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <div style={{ width:8, height:36, borderRadius:99, background:`linear-gradient(180deg,${C.accent},${C.pine})` }}/>
              <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:32, fontWeight:900, color:C.forest, margin:0, letterSpacing:"-0.03em" }}>
                Feed Usage
              </h1>
            </div>
            <p style={{ color:C.sage, fontSize:14, margin:"0 0 0 18px", fontWeight:500 }}>
              Monitor real feed consumption, feed cost, and batch usage records.
            </p>
          </div>

          {/* Total cost chip */}
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:300, delay:.3 }}
            style={{ background:`linear-gradient(135deg,${C.forest},${C.pine})`, borderRadius:16, padding:"12px 20px", display:"flex", flexDirection:"column", alignItems:"flex-end" }}>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em" }}>Total Feed Cost</div>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:900, color:C.white }}>{money(overview.totalCost)}</div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── KPI Row ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
        <KpiCard index={0} title="Total Feed Used"   value={`${overview.totalFeed.toLocaleString()} kg`} sub="Based on filtered records" />
        <KpiCard index={1} title="Total Feed Cost"   value={money(overview.totalCost)}                   sub="Total spending shown" />
        <KpiCard index={2} title="Avg Price / kg"    value={money(overview.avgPrice)}                    sub="Average feed cost per kg" />
        <KpiCard index={3} title="Total Records"     value={overview.totalRecords}                       sub="Feed usage entries" />
      </div>


      {/* ── Records Table Card ── */}
      <motion.div
        initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.28 }}
        style={{ background:C.white, borderRadius:26, padding:"24px 28px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)" }}
      >
        {/* Table header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:20, fontWeight:800, color:C.forest }}>
              Feed Usage Records
            </div>
            <div style={{ fontSize:13, color:C.sage, marginTop:3 }}>
              {groupByBatch
                ? `${filteredBatchSummary.length} batch${filteredBatchSummary.length !== 1 ? "es" : ""} grouped`
                : <><span style={{ fontWeight:700, color:C.fern }}>{filteredFeeds.length}</span> record{filteredFeeds.length !== 1 ? "s" : ""} shown</>
              }
            </div>
          </div>

          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:.97 }}
            onClick={() => setGroupByBatch(v => !v)}
            style={{ height:42, padding:"0 18px", borderRadius:13, border:"none", background: groupByBatch ? `linear-gradient(135deg,${C.accent},${C.fern})` : C.foam, color: groupByBatch ? C.white : C.pine, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:8, fontSize:14, boxShadow: groupByBatch ? "0 4px 16px rgba(76,175,80,0.35)" : "none", border: groupByBatch ? "none" : `1.5px solid ${C.mist}` }}>
            <Layers size={16}/>
            {groupByBatch ? "Show Records" : "Group by Batch"}
          </motion.button>
        </div>

        {/* Filters */}
        <div style={{ background:C.foam, borderRadius:16, padding:"16px 18px", border:`1.5px solid ${C.mist}`, marginBottom:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr 1fr 1fr auto", gap:14, alignItems:"end" }}>
            <div>
              <label style={lbl}>Search</label>
              <div style={{ display:"flex", alignItems:"center", gap:8, height:44, border:`1.5px solid ${C.mist}`, borderRadius:12, padding:"0 13px", background:C.white }}>
                <Search size={15} color={C.sage}/>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Feed ID, batch, or type…"
                  style={{ border:"none", outline:"none", background:"transparent", width:"100%", fontSize:14, color:C.forest }}/>
              </div>
            </div>

            {[
              { l:"Batch", v:batchFilter,  s:setBatchFilter,  opts:batchOptions },
              { l:"Month", v:monthFilter||"All", s:setMonthFilter, opts:monthOptions },
            ].map(f => (
              <div key={f.l}>
                <label style={lbl}>{f.l}</label>
                <select value={f.v} onChange={e => f.s(e.target.value)}
                  style={{ width:"100%", height:44, border:`1.5px solid ${C.mist}`, borderRadius:12, padding:"0 12px", fontSize:14, outline:"none", background:C.white, color:C.forest, fontWeight:600 }}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}

            <div>
              <label style={lbl}>Date</label>
              <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                style={{ width:"100%", height:44, border:`1.5px solid ${C.mist}`, borderRadius:12, padding:"0 12px", fontSize:14, outline:"none", background:C.white, color:C.forest, boxSizing:"border-box" }}/>
            </div>

            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:.96 }}
              onClick={() => { setSearch(""); setBatchFilter("All"); setDateFilter(""); setMonthFilter(""); }}
              style={{ height:44, padding:"0 16px", borderRadius:12, border:`1.5px solid ${C.mist}`, background:C.white, color:C.pine, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13 }}>
              <Filter size={14}/> Reset
            </motion.button>
          </div>
        </div>

        {/* Table */}
        <AnimatePresence mode="wait">
          {groupByBatch ? (
            <motion.div key="grouped" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <BatchSummaryTable data={filteredBatchSummary} money={money} batchColors={BATCH_COLORS} allBatches={allBatches}/>
            </motion.div>
          ) : (
            <motion.div key="records" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
              <FeedRecordsTable records={filteredFeeds} money={money} getStage={getStage}/>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ─── Feed Records Table ─────────────────────────────────────────── */
function FeedRecordsTable({ records, money, getStage }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", minWidth:950 }}>
        <thead>
          <tr style={{ background:"#F6F8F3" }}>
            {["Feed ID","Batch","Date","Stage","Feed Type","Quantity","Price/kg","Total Cost"].map(h => (
              <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:800, color:"#6E8A72", textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((feed, i) => {
            const s = getStage(feed.feed_stage);
            return (
              <motion.tr key={feed.feed_usage_id}
                initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: i * 0.02 }}
                style={{ borderTop:"1px solid #EFF3EA" }}>
                <td style={{ ...tdc, fontWeight:800, color:"#102114" }}>{feed.feed_usage_id}</td>
                <td style={tdc}>{feed.batch_id}</td>
                <td style={tdc}>{fmt(feed.usage_date)}</td>
                <td style={tdc}>
                  <span style={{ padding:"5px 11px", borderRadius:999, fontSize:12, fontWeight:800, background:s.bg, color:s.color, whiteSpace:"nowrap" }}>
                    {s.emoji} {feed.feed_stage}
                  </span>
                </td>
                <td style={tdc}>{feed.feed_type}</td>
                <td style={tdc}>{Number(feed.quantity_kg||0).toLocaleString()} kg</td>
                <td style={tdc}>{money(feed.price_per_kg)}</td>
                <td style={{ ...tdc, fontWeight:800, color:"#102114" }}>{money(feed.cost)}</td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      {records.length === 0 && (
        <div style={{ textAlign:"center", padding:"52px 0", color:"#6E8A72" }}>
          <Wheat size={42} color="#DDE8D7" style={{ marginBottom:12 }}/>
          <div style={{ fontWeight:700 }}>No feed records match your filters.</div>
        </div>
      )}
    </div>
  );
}

/* ─── Batch Summary Table ────────────────────────────────────────── */
function BatchSummaryTable({ data, money, batchColors, allBatches }) {
  return (
    <div style={{ overflowX:"auto" }}>
      <table style={{ width:"100%", borderCollapse:"collapse", minWidth:700 }}>
        <thead>
          <tr style={{ background:"#F6F8F3" }}>
            {["Batch","Total Records","Total Feed Used","Avg Price/kg","Total Feed Cost"].map(h => (
              <th key={h} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:800, color:"#6E8A72", textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((batch, i) => {
            const colorIdx = allBatches.indexOf(batch.batch_id);
            const dotColor = batchColors[(colorIdx >= 0 ? colorIdx : i) % batchColors.length];
            return (
              <motion.tr key={batch.batch_id}
                initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                transition={{ delay: i * 0.04 }}
                style={{ borderTop:"1px solid #EFF3EA" }}>
                <td style={{ padding:"14px 12px", fontWeight:800, color:"#102114" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:"50%", background:dotColor, flexShrink:0 }}/>
                    {batch.batch_id}
                  </div>
                </td>
                <td style={tdc}>{batch.total_records}</td>
                <td style={tdc}>{Number(batch.total_feed_kg||0).toLocaleString()} kg</td>
                <td style={tdc}>{money(batch.avg_price_per_kg)}</td>
                <td style={{ ...tdc, fontWeight:800, color:"#102114" }}>{money(batch.total_cost)}</td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
      {data.length === 0 && (
        <div style={{ textAlign:"center", padding:"52px 0", color:"#6E8A72" }}>
          <BarChart2 size={42} color="#DDE8D7" style={{ marginBottom:12 }}/>
          <div style={{ fontWeight:700 }}>No batch summary found.</div>
        </div>
      )}
    </div>
  );
}

const lbl = { fontSize:11, color:"#6E8A72", fontWeight:700, display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em" };
const tdc = { padding:"13px 12px", color:"#4B5E4F", fontSize:13, whiteSpace:"nowrap" };