import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, X, ChevronRight, Eye, Pencil,
  Trash2, Save, Activity, Users, TrendingUp,
  MapPin, Mail, Phone, Calendar, Package, CheckCircle2,
  Award, BarChart2, ShoppingBag
} from "lucide-react";

const API = "http://localhost:5000/api/owner";

/* ─── Design Tokens ─────────────────────────────────────────────── */
const C = {
  forest: "#102114", pine: "#244128", fern: "#3A7D1C", sage: "#6E8A72",
  mist: "#DDE8D7", foam: "#F6F8F3", white: "#ffffff",
  amber: "#B7791F", amberBg: "#FFF3D9",
  blue: "#1D4E89", blueBg: "#E8F4FF",
  red: "#B91C1C", redBg: "#FEE2E2",
  green: "#EAF7E3", accent: "#4CAF50",
};

const avatarPalette = [
  { bg:"#EAF7E3", color:"#3A7D1C", ring:"#4CAF50" },
  { bg:"#E8F4FF", color:"#1D4E89", ring:"#3B82F6" },
  { bg:"#FFF3D9", color:"#B7791F", ring:"#F59E0B" },
  { bg:"#F5F3FF", color:"#5B21B6", ring:"#8B5CF6" },
  { bg:"#FEE2E2", color:"#B91C1C", ring:"#EF4444" },
  { bg:"#ECFEFF", color:"#155E75", ring:"#06B6D4" },
  { bg:"#F0FDF4", color:"#166534", ring:"#22C55E" },
  { bg:"#FFF7ED", color:"#9A3412", ring:"#F97316" },
];

const statusMeta = {
  Active:   { bg: C.green,   color: C.fern,  dot: "#4CAF50", label:"Active"   },
  ACTIVE:   { bg: C.green,   color: C.fern,  dot: "#4CAF50", label:"Active"   },
  Inactive: { bg: "#F3F4F6", color: "#6B7280",dot: "#9CA3AF", label:"Inactive" },
  INACTIVE: { bg: "#F3F4F6", color: "#6B7280",dot: "#9CA3AF", label:"Inactive" },
};
const getSt = (s) => statusMeta[s] || statusMeta[String(s).toUpperCase()] || statusMeta.Inactive;

const payStyle = (s) =>
  ["Paid","Approved","Completed"].includes(s)
    ? { bg: C.green,   color: C.fern  }
    : { bg: C.amberBg, color: C.amber };

const initials = (name) => name ? name.split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase() : "CU";
const money    = (n) => `RM ${Number(n || 0).toLocaleString()}`;
const fmt      = (d) => d ? new Date(d).toLocaleDateString("en-CA") : "—";

const lbl = {
  fontSize:11, color:C.sage, fontWeight:700, display:"block",
  marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em",
};
const tdc = { padding:"13px 10px", color:"#4B5E4F", fontSize:13, whiteSpace:"nowrap" };

/* ─── KPI Card ──────────────────────────────────────────────────── */
function KpiCard({ title, value, sub, accent, lightBg, icon, delay }) {
  return (
    <motion.div
      initial={{ opacity:0, y:22 }} animate={{ opacity:1, y:0 }}
      transition={{ delay, type:"spring", stiffness:280, damping:24 }}
      whileHover={{ y:-4, boxShadow:"0 20px 48px rgba(16,33,20,0.12)" }}
      style={{
        background:C.white, borderRadius:24, padding:"20px 18px",
        border:`1.5px solid ${C.mist}`,
        boxShadow:"0 4px 20px rgba(16,33,20,0.07)",
        position:"relative", overflow:"hidden",
      }}
    >
      <div style={{ position:"absolute", top:-20, right:-20, width:72, height:72, borderRadius:"50%", background:lightBg, opacity:0.6 }}/>
      <div style={{ width:40, height:40, borderRadius:13, background:lightBg, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, fontSize:20 }}>
        {icon}
      </div>
      <div style={{ fontSize:11, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>{title}</div>
      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:typeof value === "string" && value.length > 8 ? 20 : 26, fontWeight:900, color:C.forest, lineHeight:1.1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:11, color:accent, fontWeight:700 }}>{sub}</div>
    </motion.div>
  );
}

/* ─── Tabs ──────────────────────────────────────────────────────── */
function Tabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id:"table", icon:<Users size={15}/>, label:"All Customers" },
    { id:"top",   icon:<Award size={15}/>, label:"Top Customers" },
    { id:"chart", icon:<BarChart2 size={15}/>, label:"Revenue Chart" },
  ];
  return (
    <div style={{ display:"flex", gap:8, marginBottom:22 }}>
      {tabs.map(t => {
        const active = activeTab === t.id;
        return (
          <motion.button key={t.id} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding:"11px 20px", borderRadius:14,
              border: active ? "none" : `1.5px solid ${C.mist}`,
              background: active ? `linear-gradient(135deg,${C.accent},${C.fern})` : C.white,
              color: active ? C.white : C.pine,
              fontWeight:800, fontSize:13, cursor:"pointer",
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              boxShadow: active ? "0 8px 20px rgba(76,175,80,.25)" : "none",
              display:"flex", alignItems:"center", gap:7,
            }}>
            {t.icon} {t.label}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── Customer Avatar ───────────────────────────────────────────── */
function Avatar({ name, idx, size = 36 }) {
  const palette = avatarPalette[idx % avatarPalette.length];
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%",
      background:palette.bg, border:`2px solid ${palette.ring}44`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:900, fontSize:size * 0.33,
      color:palette.color, flexShrink:0,
    }}>
      {initials(name)}
    </div>
  );
}

/* ─── Table View ────────────────────────────────────────────────── */
function TableView({ filtered, customers, search, setSearch, statusFilter, setStatusFilter, openView, setEditCustomer, setDeleteCustomer }) {
  return (
    <motion.div key="table" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
      <div style={{ background:C.white, borderRadius:24, padding:"22px 24px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)" }}>

        {/* Header row */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <div>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:800, color:C.forest }}>All Customer Accounts</div>
            <div style={{ fontSize:13, color:C.sage, marginTop:3 }}>
              <span style={{ fontWeight:700, color:C.accent }}>{filtered.length}</span> of {customers.length} customer{customers.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background:C.foam, borderRadius:16, padding:"14px 16px", border:`1.5px solid ${C.mist}`, marginBottom:20 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr auto", gap:14, alignItems:"end" }}>
            <div>
              <label style={lbl}>Search</label>
              <div style={{ display:"flex", alignItems:"center", gap:8, height:44, border:`1.5px solid ${C.mist}`, borderRadius:12, padding:"0 13px", background:C.white }}>
                <Search size={15} color={C.sage}/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Name, ID or email…"
                  style={{ border:"none", outline:"none", background:"transparent", width:"100%", fontSize:14, color:C.forest, fontFamily:"'Plus Jakarta Sans',sans-serif" }}/>
              </div>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ width:"100%", height:44, border:`1.5px solid ${C.mist}`, borderRadius:12, padding:"0 12px", fontSize:14, outline:"none", background:C.white, color:C.forest, fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                <option>All</option><option>Active</option><option>Inactive</option>
              </select>
            </div>
            <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
              onClick={() => { setSearch(""); setStatusFilter("All"); }}
              style={{ height:44, padding:"0 16px", borderRadius:12, border:`1.5px solid ${C.mist}`, background:C.white, color:C.pine, fontWeight:800, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              <Filter size={14}/> Reset
            </motion.button>
          </div>
        </div>

        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", minWidth:1000 }}>
            <thead>
              <tr style={{ background:C.foam }}>
                {["Customer","Contact","Area","Spent","Weight","Orders","Status","Last Order","Actions"].map(h => (
                  <th key={h} style={{ padding:"10px 10px", textAlign:"left", fontSize:11, fontWeight:800, color:C.sage, textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((c, i) => {
                  const st = getSt(c.status);
                  return (
                    <motion.tr key={c.id}
                      initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay: i * 0.02 }}
                      style={{ borderTop:`1px solid ${C.mist}` }}>
                      <td style={{ padding:"12px 10px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <Avatar name={c.name} idx={i}/>
                          <div>
                            <div style={{ fontWeight:800, fontSize:13, color:C.forest }}>{c.name}</div>
                            <div style={{ fontSize:11, color:"#9AA89B" }}>{c.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={tdc}>
                        <div style={{ fontSize:12 }}>
                          <div style={{ color:C.forest, fontWeight:600 }}>{c.email}</div>
                          <div style={{ color:"#9AA89B" }}>{c.phone}</div>
                        </div>
                      </td>
                      <td style={tdc}>{c.area}</td>
                      <td style={{ ...tdc, fontWeight:800, color:C.forest }}>{money(c.totalSpent)}</td>
                      <td style={tdc}>{c.totalKg.toLocaleString()} kg</td>
                      <td style={{ ...tdc, fontWeight:700, color:C.forest, textAlign:"center" }}>{c.orders}</td>
                      <td style={{ padding:"13px 10px" }}>
                        <span style={{ padding:"4px 10px", borderRadius:99, background:st.bg, color:st.color, fontSize:12, fontWeight:800 }}>
                          {st.label === "Active" ? "● " : "○ "}{st.label}
                        </span>
                      </td>
                      <td style={tdc}>{fmt(c.lastOrder)}</td>
                      <td style={{ padding:"13px 10px" }}>
                        <div style={{ display:"flex", gap:6 }}>
                          <motion.button whileHover={{ scale:1.12 }} whileTap={{ scale:0.9 }}
                            onClick={() => openView(c)}
                            style={{ width:33, height:33, borderRadius:10, border:`1.5px solid ${C.mist}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Eye size={14} color={C.pine}/>
                          </motion.button>
                          <motion.button whileHover={{ scale:1.12 }} whileTap={{ scale:0.9 }}
                            onClick={() => setEditCustomer({ ...c })}
                            style={{ width:33, height:33, borderRadius:10, border:`1.5px solid ${C.mist}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Pencil size={14} color={C.pine}/>
                          </motion.button>
                          <motion.button whileHover={{ scale:1.12 }} whileTap={{ scale:0.9 }}
                            onClick={() => setDeleteCustomer(c)}
                            style={{ width:33, height:33, borderRadius:10, border:"1.5px solid #F2D3D3", background:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Trash2 size={14} color={C.red}/>
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
              <Users size={40} color={C.mist} style={{ marginBottom:12 }}/>
              <div style={{ fontWeight:700 }}>No customers match your filters.</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Top Customers ─────────────────────────────────────────────── */
function TopCustomers({ customers, sortBy, setSortBy, openView }) {
  const topList = useMemo(() =>
    [...customers].sort((a,b) => b[sortBy] - a[sortBy]).slice(0,5),
  [customers, sortBy]);

  const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
  const medalColors = ["#F59E0B","#9CA3AF","#CD7F32",C.sage,C.sage];

  return (
    <motion.div key="top" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

        {/* Leaderboard */}
        <div style={{ background:C.white, borderRadius:24, padding:"22px 24px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div>
              <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:800, color:C.forest }}>Leaderboard</div>
              <div style={{ fontSize:12, color:C.sage, marginTop:3 }}>Top 5 by selected metric</div>
            </div>
            <div style={{ display:"flex", gap:6 }}>
              {[["totalSpent","💰"],["totalKg","⚖️"],["orders","📦"]].map(([key, icon]) => (
                <motion.button key={key} whileHover={{ scale:1.08 }} whileTap={{ scale:0.94 }}
                  onClick={() => setSortBy(key)}
                  style={{
                    width:36, height:36, borderRadius:10, fontSize:16,
                    border: sortBy === key ? "none" : `1.5px solid ${C.mist}`,
                    background: sortBy === key ? `linear-gradient(135deg,${C.accent},${C.fern})` : C.white,
                    cursor:"pointer",
                  }}>
                  {icon}
                </motion.button>
              ))}
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {topList.map((c, i) => {
              const maxVal = topList[0]?.[sortBy] || 1;
              const pct    = Math.round((c[sortBy] / maxVal) * 100);
              const isFirst = i === 0;
              return (
                <motion.div key={c.id}
                  initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay:i * 0.07, type:"spring", stiffness:280 }}
                  whileHover={{ x:4, boxShadow:`0 4px 20px rgba(16,33,20,0.08)` }}
                  onClick={() => openView(c)}
                  style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"14px 16px", borderRadius:16, cursor:"pointer",
                    background: isFirst ? "linear-gradient(135deg,#FFFBEB,#FFF3D9)" : C.foam,
                    border: isFirst ? "1.5px solid #F59E0B44" : `1.5px solid ${C.mist}`,
                    transition:"all .15s",
                  }}>
                  <div style={{ width:32, height:32, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0, background:isFirst ? "#FFF3D9" : C.white, border:`1px solid ${medalColors[i]}33` }}>
                    {medals[i]}
                  </div>
                  <Avatar name={c.name} idx={customers.indexOf(c)} size={34}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:800, fontSize:13, color:C.forest, marginBottom:5 }}>{c.name}</div>
                    <div style={{ height:5, background:C.mist, borderRadius:99, overflow:"hidden" }}>
                      <motion.div
                        initial={{ width:0 }} animate={{ width:`${pct}%` }}
                        transition={{ duration:0.8, delay:i * 0.07 }}
                        style={{ height:"100%", background:`linear-gradient(90deg,${C.accent},${C.fern})`, borderRadius:99 }}/>
                    </div>
                    <div style={{ fontSize:11, color:C.sage, marginTop:4 }}>{c.orders} orders · {c.area}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:14, color:C.forest }}>
                      {sortBy === "totalSpent" ? money(c.totalSpent) : sortBy === "totalKg" ? `${c.totalKg.toLocaleString()} kg` : `${c.orders} orders`}
                    </div>
                  </div>
                  <ChevronRight size={14} color="#9AA89B"/>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Spotlight — #1 customer deep-dive */}
        {topList[0] && (
          <div style={{ background:C.white, borderRadius:24, padding:"22px 24px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)", display:"flex", flexDirection:"column", gap:0 }}>
            {/* Hero banner */}
            <div style={{ background:`linear-gradient(135deg,${C.forest},${C.pine})`, borderRadius:16, padding:"20px 22px", marginBottom:20, position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:-24, right:-24, width:88, height:88, borderRadius:"50%", background:"rgba(255,255,255,0.06)" }}/>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:14 }}>
                <div style={{ width:54, height:54, borderRadius:"50%", background:"rgba(255,255,255,0.15)", border:"2px solid rgba(255,255,255,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:18, color:C.white }}>
                  {initials(topList[0].name)}
                </div>
                <div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:3 }}>Top Customer</div>
                  <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:18, color:C.white }}>{topList[0].name}</div>
                  <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>{topList[0].area}</div>
                </div>
                <div style={{ marginLeft:"auto", fontSize:28 }}>🥇</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                {[
                  { label:"Revenue",  value: money(topList[0].totalSpent), color:"#86EFAC" },
                  { label:"Weight",   value: `${topList[0].totalKg.toLocaleString()} kg`, color:"#93C5FD" },
                  { label:"Orders",   value: topList[0].orders, color:"#FCD34D" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"10px 12px" }}>
                    <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{label}</div>
                    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:14, color }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ fontSize:12, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Quick Stats</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {[
                { icon:<Mail size={13}/>,     label:"Email",      value:topList[0].email   },
                { icon:<Phone size={13}/>,    label:"Phone",      value:topList[0].phone   },
                { icon:<MapPin size={13}/>,   label:"Address",    value:topList[0].address },
                { icon:<Calendar size={13}/>, label:"Joined",     value:fmt(topList[0].joined)    },
                { icon:<Package size={13}/>,  label:"Last Order", value:fmt(topList[0].lastOrder)  },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:C.foam, borderRadius:12, border:`1px solid ${C.mist}` }}>
                  <div style={{ color:C.sage, flexShrink:0 }}>{icon}</div>
                  <div style={{ fontSize:11, color:C.sage, fontWeight:700, width:64, flexShrink:0 }}>{label}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:C.forest, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{value}</div>
                </div>
              ))}
            </div>

            <motion.button whileHover={{ scale:1.03, boxShadow:"0 8px 24px rgba(76,175,80,0.3)" }} whileTap={{ scale:0.97 }}
              onClick={() => openView(topList[0])}
              style={{ marginTop:"auto", paddingTop:16, width:"100%", height:46, borderRadius:14, border:"none", background:`linear-gradient(135deg,${C.accent},${C.fern})`, color:C.white, fontWeight:800, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              <Eye size={16}/> View Full Profile
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Revenue Chart ─────────────────────────────────────────────── */
function RevenueChart({ customers }) {
  const top6     = useMemo(() => [...customers].sort((a,b) => b.totalSpent - a.totalSpent).slice(0,6), [customers]);
  const total    = customers.reduce((s,c) => s + c.totalSpent, 0);
  const maxSpent = top6[0]?.totalSpent || 1;

  /* Simple donut-style arcs */
  const donutData = useMemo(() => {
    const topDonut = [...customers].sort((a,b) => b.totalSpent - a.totalSpent).slice(0,5);
    let offset = 0;
    const r = 54, circ = 2 * Math.PI * r;
    return topDonut.map((c, i) => {
      const pct  = total ? c.totalSpent / total : 0;
      const dash = pct * circ;
      const el   = { c, pct, dash, offset, color: avatarPalette[i % avatarPalette.length].ring };
      offset += dash;
      return el;
    });
  }, [customers, total]);

  return (
    <motion.div key="chart" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1.5fr", gap:20 }}>

        {/* Donut + legend */}
        <div style={{ background:C.white, borderRadius:24, padding:"22px 24px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)" }}>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:800, color:C.forest, marginBottom:4 }}>Revenue Share</div>
          <div style={{ fontSize:12, color:C.sage, marginBottom:20 }}>Top 5 customers by contribution</div>

          <div style={{ display:"flex", justifyContent:"center", marginBottom:22 }}>
            <div style={{ position:"relative", width:140, height:140 }}>
              <svg viewBox="0 0 140 140">
                {donutData.map(({ c, dash, offset, color }) => (
                  <circle key={c.id} cx={70} cy={70} r={54}
                    fill="none" stroke={color} strokeWidth={20}
                    strokeDasharray={`${dash} ${2*Math.PI*54 - dash}`}
                    strokeDashoffset={-offset}
                    transform="rotate(-90 70 70)"
                    strokeLinecap="butt"
                  />
                ))}
                <circle cx={70} cy={70} r={44} fill={C.white}/>
                <text x={70} y={66} textAnchor="middle" style={{ fontSize:14, fontWeight:900, fill:C.forest, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{customers.length}</text>
                <text x={70} y={80} textAnchor="middle" style={{ fontSize:9, fill:"#9AA89B" }}>customers</text>
              </svg>
            </div>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {donutData.map(({ c, pct, color }, i) => (
              <div key={c.id} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:color, flexShrink:0 }}/>
                <div style={{ flex:1, fontSize:12, fontWeight:700, color:C.forest, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.name}</div>
                <div style={{ fontSize:11, color:C.sage }}>{money(c.totalSpent)}</div>
                <span style={{ padding:"2px 7px", borderRadius:99, background:C.green, color:C.fern, fontSize:10, fontWeight:800 }}>{Math.round(pct*100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal bar chart */}
        <div style={{ background:C.white, borderRadius:24, padding:"22px 24px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)" }}>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:800, color:C.forest, marginBottom:4 }}>Revenue by Customer</div>
          <div style={{ fontSize:12, color:C.sage, marginBottom:22 }}>Top 6 contributors · Total: {money(total)}</div>

          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {top6.map((c, i) => {
              const pal     = avatarPalette[i % avatarPalette.length];
              const barPct  = Math.round((c.totalSpent / maxSpent) * 100);
              const revPct  = Math.round((c.totalSpent / Math.max(total, 1)) * 100);
              return (
                <motion.div key={c.id}
                  initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay:i * 0.06 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Avatar name={c.name} idx={i} size={28}/>
                      <div>
                        <div style={{ fontSize:13, fontWeight:800, color:C.forest }}>{c.name}</div>
                        <div style={{ fontSize:11, color:C.sage }}>{c.area} · {c.orders} orders</div>
                      </div>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:14, color:C.forest }}>{money(c.totalSpent)}</div>
                      <div style={{ fontSize:11, color:C.sage }}>{revPct}% of total</div>
                    </div>
                  </div>
                  <div style={{ height:8, background:C.mist, borderRadius:99, overflow:"hidden" }}>
                    <motion.div
                      initial={{ width:0 }} animate={{ width:`${barPct}%` }}
                      transition={{ duration:0.8, delay:i * 0.06 }}
                      style={{ height:"100%", background:pal.ring, borderRadius:99 }}/>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Customer Detail Modal ─────────────────────────────────────── */
function CustomerModal({ selectedCustomer, setSelectedCustomer, history, customers }) {
  if (!selectedCustomer) return null;
  const idx = customers.indexOf(selectedCustomer);
  const pal = avatarPalette[idx % avatarPalette.length] || avatarPalette[0];
  const st  = getSt(selectedCustomer.status);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={() => setSelectedCustomer(null)}
        style={{ position:"fixed", inset:0, background:"rgba(10,20,12,0.45)", zIndex:200, backdropFilter:"blur(6px)" }}/>
      <motion.div style={{ position:"fixed", inset:0, zIndex:201, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <motion.div
          initial={{ opacity:0, y:40, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:20, scale:0.97 }}
          onClick={(e) => e.stopPropagation()}
          transition={{ type:"spring", stiffness:300, damping:28 }}
          style={{ width:620, maxWidth:"100%", maxHeight:"88vh", overflowY:"auto", background:C.white, borderRadius:28, boxShadow:"0 40px 100px rgba(10,20,12,0.28)" }}
        >
          {/* Hero */}
          <div style={{ background:`linear-gradient(135deg,${C.forest},${C.pine})`, padding:"22px 24px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", top:-28, right:-28, width:100, height:100, borderRadius:"50%", background:"rgba(255,255,255,0.05)" }}/>
            <div style={{ position:"absolute", bottom:-20, left:-20, width:72, height:72, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }}/>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ width:58, height:58, borderRadius:"50%", background:pal.bg, border:`3px solid ${pal.ring}88`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:20, color:pal.color }}>
                  {initials(selectedCustomer.name)}
                </div>
                <div>
                  <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, color:C.white, fontSize:20, marginBottom:4 }}>{selectedCustomer.name}</div>
                  <div style={{ display:"flex", gap:8 }}>
                    <span style={{ padding:"3px 10px", borderRadius:99, background:"rgba(255,255,255,0.15)", fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.9)" }}>{selectedCustomer.id}</span>
                    <span style={{ padding:"3px 10px", borderRadius:99, background: st.label === "Active" ? "#4CAF50" : "#6B7280", fontSize:12, fontWeight:700, color:C.white }}>{st.label}</span>
                  </div>
                </div>
              </div>
              <motion.button
                type="button"
                whileHover={{ rotate:90, scale:1.1 }}
                whileTap={{ scale:0.9 }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedCustomer(null);
                }}
                style={{
                  border:"none",
                  background:"rgba(255,255,255,0.12)",
                  borderRadius:10,
                  width:34,
                  height:34,
                  cursor:"pointer",
                  display:"flex",
                  alignItems:"center",
                  justifyContent:"center",
                  flexShrink:0,
                  position:"relative",
                  zIndex:999
                }}
              >
                <X size={16} color="rgba(255,255,255,0.8)" />
              </motion.button>
              </div>
            {/* Stats row */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginTop:18 }}>
              {[
                { label:"Total Spent",  value:money(selectedCustomer.totalSpent), color:"#86EFAC" },
                { label:"Total Weight", value:`${selectedCustomer.totalKg.toLocaleString()} kg`, color:"#93C5FD" },
                { label:"Orders",       value:selectedCustomer.orders, color:"#FCD34D" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background:"rgba(255,255,255,0.08)", borderRadius:12, padding:"10px 14px" }}>
                  <div style={{ fontSize:9, color:"rgba(255,255,255,0.5)", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:3 }}>{label}</div>
                  <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:15, color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          <div style={{ padding:"20px 24px" }}>
            {/* Contact info */}
            <div style={{ fontSize:12, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Contact Information</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:20 }}>
              {[
                { icon:<Mail size={13}/>,     label:"Email",      value:selectedCustomer.email    },
                { icon:<Phone size={13}/>,    label:"Phone",      value:selectedCustomer.phone    },
                { icon:<MapPin size={13}/>,   label:"Address",    value:selectedCustomer.address  },
                { icon:<ShoppingBag size={13}/>, label:"Area",   value:selectedCustomer.area     },
                { icon:<Calendar size={13}/>, label:"Joined",     value:fmt(selectedCustomer.joined)   },
                { icon:<Package size={13}/>,  label:"Last Order", value:fmt(selectedCustomer.lastOrder) },
              ].map(({ icon, label, value }) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:C.foam, borderRadius:12, border:`1px solid ${C.mist}` }}>
                  <div style={{ color:C.sage, flexShrink:0 }}>{icon}</div>
                  <div>
                    <div style={{ fontSize:10, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.04em", marginBottom:1 }}>{label}</div>
                    <div style={{ fontSize:12, fontWeight:700, color:C.forest }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Purchase history */}
            <div style={{ fontSize:12, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:12 }}>Purchase History</div>
            {history.length > 0 ? (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {history.map(o => {
                  const ps = payStyle(o.status);
                  return (
                    <div key={o.order_id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:14, background:C.foam, border:`1px solid ${C.mist}` }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:C.green, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <Package size={16} color={C.fern}/>
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:800, fontSize:13, color:C.forest }}>{o.order_id}</div>
                        <div style={{ fontSize:11, color:C.sage }}>{fmt(o.date)} · {o.weight || 0} kg</div>
                      </div>
                      <span style={{ padding:"3px 8px", borderRadius:99, background:C.green, color:C.fern, fontSize:11, fontWeight:800 }}>{o.delivery}</span>
                      <span style={{ padding:"3px 8px", borderRadius:99, background:ps.bg, color:ps.color, fontSize:11, fontWeight:800 }}>💳 {o.status}</span>
                      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:14, color:C.forest }}>{money(o.amount)}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign:"center", padding:"28px 0", background:C.foam, borderRadius:14, color:C.sage }}>
                <Package size={32} color={C.mist} style={{ marginBottom:10 }}/>
                <div style={{ fontWeight:700, fontSize:13 }}>No purchase history available</div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Edit Modal ────────────────────────────────────────────────── */
function EditModal({ editCustomer, setEditCustomer, updateCustomer }) {
  if (!editCustomer) return null;
  const fields = [
    { key:"name",    label:"Full Name",    placeholder:"Customer name"    },
    { key:"email",   label:"Email",        placeholder:"email@example.com" },
    { key:"phone",   label:"Phone",        placeholder:"+60 12-345 6789"  },
    { key:"address", label:"Address",      placeholder:"Street address"   },
    { key:"area",    label:"Area",         placeholder:"e.g. Penang"      },
  ];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
        onClick={() => setEditCustomer(null)}
        style={{ position:"fixed", inset:0, background:"rgba(10,20,12,0.45)", zIndex:200, backdropFilter:"blur(6px)" }}/>
      <motion.div style={{ position:"fixed", inset:0, zIndex:201, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
        <motion.div
          initial={{ opacity:0, y:30, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
          exit={{ opacity:0, y:20, scale:0.97 }}
          transition={{ type:"spring", stiffness:300, damping:28 }}
          onClick={(e) => e.stopPropagation()}
          style={{ width:480, maxWidth:"100%", background:C.white, borderRadius:28, boxShadow:"0 40px 100px rgba(10,20,12,0.28)" }}
        >
          <div style={{ padding:28 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
              <div>
                <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:900, color:C.forest }}>Edit Customer</div>
                <div style={{ fontSize:13, color:C.sage, marginTop:4 }}>Update customer account details</div>
              </div>
              <motion.button whileHover={{ rotate:90, scale:1.1 }} whileTap={{ scale:0.9 }}
                onClick={() => setEditCustomer(null)}
                style={{ width:36, height:36, borderRadius:10, border:`1.5px solid ${C.mist}`, background:C.foam, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <X size={16} color={C.sage}/>
              </motion.button>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:14 }}>
              {fields.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label style={lbl}>{label}</label>
                  <input
                    value={editCustomer[key] || ""}
                    onChange={e => setEditCustomer({ ...editCustomer, [key]:e.target.value })}
                    placeholder={placeholder}
                    style={mInp}
                  />
                </div>
              ))}
              <div>
                <label style={lbl}>Status</label>
                <select value={editCustomer.status} onChange={e => setEditCustomer({ ...editCustomer, status:e.target.value })} style={mSel}>
                  <option>Active</option><option>Inactive</option>
                </select>
              </div>
            </div>

            <motion.button
              whileHover={{ scale:1.03, boxShadow:"0 8px 24px rgba(76,175,80,0.35)" }}
              whileTap={{ scale:0.97 }}
              onClick={updateCustomer}
              style={{ width:"100%", height:50, borderRadius:14, border:"none", background:`linear-gradient(135deg,${C.accent},${C.fern})`, color:C.white, fontWeight:900, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              <Save size={18}/> Save Changes
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Delete / Deactivate Modal ─────────────────────────────────── */
function DeleteModal({ deleteCustomer, setDeleteCustomer, confirmDelete }) {
  if (!deleteCustomer) return null;

  return (
    <AnimatePresence>
      <>
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          exit={{ opacity:0 }}
          onClick={() => setDeleteCustomer(null)}
          style={{
            position:"fixed",
            inset:0,
            background:"rgba(10,20,12,0.45)",
            zIndex:200,
            backdropFilter:"blur(6px)"
          }}
        />

        <motion.div
          style={{
            position:"fixed",
            inset:0,
            zIndex:201,
            display:"flex",
            alignItems:"center",
            justifyContent:"center",
            padding:20
          }}
        >
          <motion.div
            initial={{ opacity:0, scale:0.9, y:20 }}
            animate={{ opacity:1, scale:1, y:0 }}
            exit={{ opacity:0, scale:0.9, y:20 }}
            transition={{ type:"spring", stiffness:300, damping:25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width:400,
              maxWidth:"100%",
              background:C.white,
              borderRadius:28,
              padding:28,
              boxShadow:"0 40px 100px rgba(0,0,0,0.28)",
              textAlign:"center"
            }}
          >
            <div style={{ fontSize:44, marginBottom:12 }}>⚠️</div>

            <div style={{
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              fontSize:20,
              fontWeight:900,
              color:C.forest,
              marginBottom:8
            }}>
              Set Customer Inactive?
            </div>

            <div style={{ fontSize:13, color:C.sage, marginBottom:24, lineHeight:1.6 }}>
              <strong style={{ color:C.forest }}>{deleteCustomer.name}</strong> will be marked as inactive.<br />
              They can be reactivated at any time.
            </div>

            <div style={{ display:"flex", gap:12 }}>
              <button
                onClick={() => setDeleteCustomer(null)}
                style={{
                  flex:1,
                  height:46,
                  borderRadius:12,
                  border:`1.5px solid ${C.mist}`,
                  background:C.foam,
                  fontWeight:800,
                  cursor:"pointer",
                  color:C.forest
                }}
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                style={{
                  flex:1,
                  height:46,
                  borderRadius:12,
                  border:"none",
                  background:"#EF4444",
                  color:"#fff",
                  fontWeight:800,
                  cursor:"pointer"
                }}
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      </>
    </AnimatePresence>
  );
}

/* ─── Main ──────────────────────────────────────────────────────── */
export default function OwnerCustomer() {
  const [customers,      setCustomers     ] = useState([]);
  const [history,        setHistory       ] = useState([]);
  const [loading,        setLoading       ] = useState(true);
  const [search,         setSearch        ] = useState("");
  const [statusFilter,   setStatusFilter  ] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editCustomer,   setEditCustomer  ] = useState(null);
  const [deleteCustomer, setDeleteCustomer] = useState(null);
  const [activeTab,      setActiveTab     ] = useState("table");
  const [sortBy,         setSortBy        ] = useState("totalSpent");

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const res  = await axios.get(`${API}/customers`);
      const data = res.data.map((c, i) => ({
        id:         c.id,
        name:       c.name       || "—",
        email:      c.email      || "—",
        phone:      c.phone      || "—",
        address:    c.address    || "—",
        area:       c.area       || "—",
        status:     c.status     || "Active",
        totalSpent: Number(c.total_spent || 0),
        totalKg:    Number(c.total_kg    || 0),
        orders:     Number(c.orders      || 0),
        joined:     c.joined,
        lastOrder:  c.last_order,
      }));
      setCustomers(data);
    } catch (err) {
      console.error("Fetch customers error:", err);
    } finally {
      setLoading(false);
    }
  };

  const openView = async (c) => {
    setSelectedCustomer(c);
    try {
      const res = await axios.get(`${API}/customers/${c.id}/history`);
      setHistory(res.data);
    } catch (err) {
      console.error("Fetch history error:", err);
      setHistory([]);
    }
  };

  const updateCustomer = async () => {
    try {
      await axios.put(`${API}/customers/${editCustomer.id}`, editCustomer);
      setEditCustomer(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Failed to update customer.");
    }
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${API}/customers/${deleteCustomer.id}`);
      setDeleteCustomer(null);
      fetchCustomers();
    } catch (err) {
      console.error(err);
      alert("Failed to update customer status.");
    }
  };

  const totalRevenue = customers.reduce((s,c) => s + c.totalSpent, 0);
  const activeCount  = customers.filter(c => String(c.status).toUpperCase() === "ACTIVE").length;
  const repeatCount  = customers.filter(c => c.orders >= 5).length;
  const topCustomer  = [...customers].sort((a,b) => b.totalSpent - a.totalSpent)[0] || {};

  const kpiCards = [
    { title:"Total Customers",  value:customers.length,  sub:"Registered accounts",             accent:"#3B82F6", lightBg:C.blueBg,   icon:"👥" },
    { title:"Active Customers", value:activeCount,       sub:`${customers.length - activeCount} inactive`, accent:C.fern, lightBg:C.green, icon:"✅" },
    { title:"Repeat Customers", value:repeatCount,       sub:"5 or more orders",                accent:"#8B5CF6", lightBg:"#EDE9FE",  icon:"🔄" },
    { title:"Total Revenue",    value:money(totalRevenue), sub:`Top: ${topCustomer.name || "—"}`, accent:"#F59E0B", lightBg:C.amberBg, icon:"💰" },
  ];

  const filtered = useMemo(() => customers.filter(c => {
    const s  = search.toLowerCase();
    const st = String(c.status).toUpperCase();
    return (
      (c.name.toLowerCase().includes(s) || c.id.toLowerCase().includes(s) || c.email.toLowerCase().includes(s)) &&
      (statusFilter === "All" || st === statusFilter.toUpperCase())
    );
  }), [customers, search, statusFilter]);

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", gap:14, alignItems:"center", justifyContent:"center", background:C.foam, fontFamily:"'Plus Jakarta Sans',sans-serif", color:C.sage }}>
      <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1.2, ease:"linear" }}>
        <Activity size={36} color={C.fern}/>
      </motion.div>
      <span style={{ fontWeight:700, fontSize:16 }}>Loading customers…</span>
    </div>
  );

  return (
    <div style={{ padding:"24px", background:C.foam, minHeight:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif", width:"calc(100vw - 280px)", maxWidth:"calc(100vw - 280px)", boxSizing:"border-box", overflowX:"hidden" }}>
      <motion.div initial={{ opacity:0, y:-18 }} animate={{ opacity:1, y:0 }}>

        {/* ── Header ── */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:30 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <div style={{ width:8, height:36, borderRadius:99, background:`linear-gradient(180deg,#3B82F6,${C.fern})` }}/>
              <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:32, fontWeight:900, color:C.forest, margin:0, letterSpacing:"-0.03em" }}>
                Customer Management
              </h1>
            </div>
            <p style={{ color:C.sage, fontSize:14, margin:"0 0 0 18px", fontWeight:500 }}>
              Track, analyse and manage all customer accounts and purchase history.
            </p>
          </div>
          <div style={{ padding:"10px 18px", borderRadius:14, background:C.white, border:`1.5px solid ${C.mist}`, fontSize:13, color:C.forest, fontWeight:700, display:"flex", alignItems:"center", gap:8 }}>
            <TrendingUp size={15} color={C.fern}/>
            {customers.length} customers · {money(totalRevenue)} total
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:16, marginBottom:26 }}>
          {kpiCards.map((c, i) => <KpiCard key={c.title} {...c} delay={i * 0.07}/>)}
        </div>

        {/* ── Tabs ── */}
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab}/>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === "table" && (
            <TableView
              filtered={filtered} customers={customers}
              search={search} setSearch={setSearch}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              openView={openView}
              setEditCustomer={setEditCustomer}
              setDeleteCustomer={setDeleteCustomer}
            />
          )}
          {activeTab === "top" && (
            <TopCustomers customers={customers} sortBy={sortBy} setSortBy={setSortBy} openView={openView}/>
          )}
          {activeTab === "chart" && (
            <RevenueChart customers={customers}/>
          )}
        </AnimatePresence>

      </motion.div>

      {/* ── Modals ── */}
      <CustomerModal
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        history={history}
        customers={customers}
      />
      <EditModal editCustomer={editCustomer} setEditCustomer={setEditCustomer} updateCustomer={updateCustomer}/>
      <DeleteModal deleteCustomer={deleteCustomer} setDeleteCustomer={setDeleteCustomer} confirmDelete={confirmDelete}/>
    </div>
  );
}

const mInp = {
  width:"100%", height:46, border:`1.5px solid #DDE8D7`, borderRadius:12,
  padding:"0 14px", fontSize:14, outline:"none", background:"#fff",
  boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif",
};
const mSel = { ...mInp, cursor:"pointer" };