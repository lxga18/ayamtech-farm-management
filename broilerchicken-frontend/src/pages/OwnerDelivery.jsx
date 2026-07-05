import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, X, ChevronLeft, ChevronRight,
  Eye, Truck, CheckCircle2, Clock, Calendar,
  MapPin, User, Activity, Package,
  Bell, AlertTriangle, RefreshCw
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
  purple: "#5B21B6", purpleBg: "#F5F3FF",
};

const timeSlots = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00"];
const dayLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const todayStr  = () => new Date().toLocaleDateString("en-CA");
const getDateOnly = (d) => d ? new Date(d).toLocaleDateString("en-CA") : "";
const normalizeDeliveryStatus = (status) => {
  const value = String(status || "").toLowerCase().trim();

  if (!value || value === "pending" || value === "not assigned") return "Pending";
  if (value === "assigned") return "Assigned";
  if (value === "out for delivery" || value === "out of delivery") return "Out for Delivery";
  if (value === "completed") return "Completed";

  return status || "Pending";
};

const hoursSince = (dateValue) => {
  if (!dateValue) return 0;
  const assignedDate = new Date(dateValue);
  if (Number.isNaN(assignedDate.getTime())) return 0;

  return (Date.now() - assignedDate.getTime()) / 36e5;
};

const needsReassign = (delivery) => {
  return (
    normalizeDeliveryStatus(delivery.status) === "Assigned" &&
    delivery.assigned_at &&
    !delivery.out_for_delivery_at &&
    hoursSince(delivery.assigned_at) >= 2
  );
};


/* Two weeks from today (inclusive) */
const getTwoWeeksEnd = () => {
  const d = new Date();
  d.setDate(d.getDate() + 13);
  return d.toLocaleDateString("en-CA");
};

const isDateAllowed = (dateStr) => {
  const today = todayStr();
  const end   = getTwoWeeksEnd();
  return dateStr >= today && dateStr <= end;
};

const statusMeta = {
  Pending:           { bg:"#F3F4F6", color:"#4B5563",  dot:"#9CA3AF",  icon:"🕐", label:"Pending"           },
  Assigned:          { bg:C.blueBg,  color:C.blue,     dot:"#3B82F6",  icon:"📋", label:"Assigned"          },
  "Out for Delivery":{ bg:C.amberBg, color:C.amber,    dot:"#F59E0B",  icon:"🚚", label:"Out for Delivery"  },
  Completed:         { bg:C.green,   color:C.fern,     dot:"#4CAF50",  icon:"✅", label:"Completed"         },
};
const getSS = (s) => statusMeta[s] || statusMeta.Pending;

const lbl = {
  fontSize:11, color:C.sage, fontWeight:700, display:"block",
  marginBottom:6, textTransform:"uppercase", letterSpacing:"0.06em",
};
const tdc = { padding:"13px 10px", color:"#4B5E4F", fontSize:13, whiteSpace:"nowrap" };

/* ─── Custom Alert Modal ───────────────────────────────────────── */
function CustomAlert({ show, title, message, onClose, icon }) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10,20,12,0.5)",
          zIndex: 9999,
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "440px",
            width: "100%",
            background: C.white,
            borderRadius: "28px",
            padding: "36px 32px 32px",
            boxShadow: "0 32px 80px rgba(10,20,12,0.25)",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative gradient circle */}
          <div
            style={{
              position: "absolute",
              top: "-80px",
              right: "-80px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: `radial-gradient(circle, ${C.redBg}80, transparent 70%)`,
              opacity: 0.6,
            }}
          />

          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200, delay: 0.1 }}
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${C.redBg}, #FECACA)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "36px",
              position: "relative",
              zIndex: 1,
              boxShadow: "0 8px 24px rgba(185, 28, 28, 0.15)",
            }}
          >
            {icon || <AlertTriangle size={40} color={C.red} />}
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: "22px",
              fontWeight: 900,
              color: C.forest,
              margin: "0 0 10px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {title || "Time Slot Unavailable"}
          </motion.h2>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              fontSize: "15px",
              color: C.sage,
              lineHeight: 1.6,
              margin: "0 0 28px",
              position: "relative",
              zIndex: 1,
            }}
          >
            {message || "This time slot has already passed. Please select a future time slot."}
          </motion.p>

          {/* Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.03, boxShadow: "0 8px 24px rgba(76,175,80,0.3)" }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: "14px",
              border: "none",
              background: `linear-gradient(135deg, ${C.accent}, ${C.fern})`,
              color: C.white,
              fontWeight: 800,
              fontSize: "15px",
              cursor: "pointer",
              position: "relative",
              zIndex: 1,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              transition: "all 0.2s",
            }}
          >
            Got it
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

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
      <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:26, fontWeight:900, color:C.forest, lineHeight:1.1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:11, color:accent, fontWeight:700 }}>{sub}</div>
    </motion.div>
  );
}

/* ─── Status Flow ───────────────────────────────────────────────── */
function StatusFlow({ deliveries }) {
  const flow = ["Pending","Assigned","Out for Delivery","Completed"];
  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
      style={{ background:C.white, borderRadius:24, padding:"20px 28px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)", marginBottom:22 }}>
      <div style={{ fontSize:13, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.07em", marginBottom:18 }}>Delivery Pipeline</div>
      <div style={{ display:"flex", alignItems:"center" }}>
        {flow.map((s, i) => {
          const ss    = getSS(s);
          const count = deliveries.filter(d => d.status === s).length;
          const total = deliveries.length || 1;
          const pct   = Math.round((count / total) * 100);
          return (
            <div key={s} style={{ display:"flex", alignItems:"center", flex:1 }}>
              <div style={{ flex:1, textAlign:"center" }}>
                <motion.div
                  whileHover={{ scale:1.08 }}
                  style={{ width:50, height:50, borderRadius:"50%", background:ss.bg, border:`2.5px solid ${ss.dot}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 8px", fontSize:20, cursor:"default" }}>
                  {ss.icon}
                </motion.div>
                <div style={{ fontWeight:700, fontSize:12, color:ss.color, marginBottom:2 }}>{s}</div>
                <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:22, color:C.forest }}>{count}</div>
                <div style={{ fontSize:10, color:"#9AA89B", marginTop:2 }}>{pct}%</div>
              </div>
              {i < flow.length - 1 && (
                <div style={{ flex:0.4, display:"flex", flexDirection:"column", gap:3, alignItems:"center", marginBottom:28 }}>
                  <div style={{ height:2, width:"100%", background:`linear-gradient(90deg,${flow[i] === s ? ss.dot : C.mist},${C.mist})`, borderRadius:99 }}/>
                  <div style={{ fontSize:9, color:"#C4D0BC", fontWeight:700 }}>→</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ─── Tabs ──────────────────────────────────────────────────────── */
function Tabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id:"schedule", icon:"📅", label:"Schedule" },
    { id:"table",    icon:"📋", label:"All Deliveries" },
    { id:"drivers",  icon:"🚗", label:"Driver Board" },
  ];
  return (
    <div style={{ display:"flex", gap:8, marginBottom:20 }}>
      {tabs.map(t => {
        const active = activeTab === t.id;
        return (
          <motion.button key={t.id} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding:"11px 22px", borderRadius:14,
              border: active ? "none" : `1.5px solid ${C.mist}`,
              background: active ? `linear-gradient(135deg,${C.accent},${C.fern})` : C.white,
              color: active ? C.white : C.pine,
              fontWeight:800, fontSize:13, cursor:"pointer",
              fontFamily:"'Plus Jakarta Sans',sans-serif",
              boxShadow: active ? "0 8px 20px rgba(76,175,80,.25)" : "none",
              display:"flex", alignItems:"center", gap:7,
            }}>
            <span>{t.icon}</span> {t.label}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ─── Schedule View ─────────────────────────────────────────────── */
function ScheduleView({
  scheduleDate, setScheduleDate, today, weekDates, navigateWeek, navigateDay,
  deliveriesPerDate, scheduleDeliveries, scheduleGrid, drivers, openModal, setSelectedSlot,
  isPastTimeSlot, setShowAlert
}) {
  const twoWeeksEnd = getTwoWeeksEnd();

  return (
    <motion.div key="schedule" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
      <div style={{ background:C.white, borderRadius:24, padding:"22px 24px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)", marginBottom:22 }}>

        {/* Week Nav */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            onClick={() => navigateWeek(-1)}
            style={{ height:38, padding:"0 14px", borderRadius:12, border:`1.5px solid ${C.mist}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", color:C.pine }}>
            <ChevronLeft size={16}/> Prev Week
          </motion.button>

          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <motion.button whileHover={{ scale:1.08 }} whileTap={{ scale:0.92 }}
              onClick={() => navigateDay(-1)}
              style={{ width:38, height:38, borderRadius:12, border:`1.5px solid ${C.mist}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ChevronLeft size={16} color={C.pine}/>
            </motion.button>
            <input type="date" value={scheduleDate} min={today} max={twoWeeksEnd}
              onChange={e => { if (isDateAllowed(e.target.value)) setScheduleDate(e.target.value); }}
              style={{ height:38, border:`1.5px solid ${C.mist}`, borderRadius:12, padding:"0 12px", fontSize:14, outline:"none", background:C.white, fontFamily:"'Plus Jakarta Sans',sans-serif", color:C.forest }}/>
            <motion.button whileHover={{ scale:1.08 }} whileTap={{ scale:0.92 }}
              onClick={() => navigateDay(1)}
              style={{ width:38, height:38, borderRadius:12, border:`1.5px solid ${C.mist}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <ChevronRight size={16} color={C.pine}/>
            </motion.button>
          </div>

          <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
            onClick={() => navigateWeek(1)}
            style={{ height:38, padding:"0 14px", borderRadius:12, border:`1.5px solid ${C.mist}`, background:C.white, cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif", color:C.pine }}>
            Next Week <ChevronRight size={16}/>
          </motion.button>
        </div>

        {/* Day Picker */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:6, marginBottom:20 }}>
          {weekDates.map((date, i) => {
            const selected  = date === scheduleDate;
            const isToday   = date === today;
            const allowed   = isDateAllowed(date);
            const count     = deliveriesPerDate[date] || 0;

            return (
              <motion.button key={date}
                whileHover={allowed ? { scale:1.04 } : {}}
                whileTap={allowed ? { scale:0.97 } : {}}
                onClick={() => allowed && setScheduleDate(date)}
                style={{
                  padding:"12px 6px", borderRadius:16, textAlign:"center",
                  border: selected ? `2px solid ${C.accent}` : isToday ? `2px solid ${C.fern}33` : `1.5px solid ${C.mist}`,
                  background: selected ? `linear-gradient(135deg,${C.accent},${C.fern})` : allowed ? C.white : "#F3F4F6",
                  color: selected ? C.white : allowed ? C.forest : "#C0C8BC",
                  cursor: allowed ? "pointer" : "not-allowed",
                  opacity: allowed ? 1 : 0.5,
                  fontFamily:"'Plus Jakarta Sans',sans-serif",
                  position:"relative", overflow:"hidden",
                }}>
                {isToday && !selected && (
                  <div style={{ position:"absolute", top:4, right:4, width:6, height:6, borderRadius:"50%", background:C.accent }}/>
                )}
                <div style={{ fontSize:9, fontWeight:800, opacity:0.7, marginBottom:2 }}>{dayLabels[i]}</div>
                <div style={{ fontSize:18, fontWeight:900 }}>{new Date(date + "T12:00:00").getDate()}</div>
                {count > 0 ? (
                  <div style={{ marginTop:4, fontSize:10, fontWeight:800, color: selected ? "rgba(255,255,255,0.9)" : C.fern }}>
                    {count} 🚚
                  </div>
                ) : (
                  <div style={{ marginTop:4, fontSize:10, color: selected ? "rgba(255,255,255,0.5)" : "#C0C8BC" }}>—</div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Date label + count */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:800, color:C.forest }}>
              {new Date(scheduleDate + "T12:00:00").toLocaleDateString("en-MY",{ weekday:"long", year:"numeric", month:"long", day:"numeric" })}
            </div>
            <div style={{ fontSize:12, color:C.sage, marginTop:2 }}>
              <span style={{ fontWeight:700, color:C.accent }}>{scheduleDeliveries.length}</span> delivery{scheduleDeliveries.length !== 1 ? "ies" : ""} scheduled
            </div>
          </div>
          {scheduleDate === today && (
            <span style={{ padding:"4px 12px", borderRadius:99, background:C.green, color:C.fern, fontSize:11, fontWeight:800 }}>Today</span>
          )}
        </div>

        {/* No drivers */}
        {drivers.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 0", color:C.sage }}>
            <Truck size={40} color={C.mist} style={{ marginBottom:12 }}/>
            <div style={{ fontWeight:700 }}>No drivers available.</div>
          </div>
        ) : (
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", minWidth: 180 + drivers.length * 160, borderCollapse:"collapse" }}>
              <thead>
                <tr style={{ background:C.foam }}>
                  <th style={{ padding:"10px 14px", textAlign:"left", fontSize:11, fontWeight:800, color:C.sage, textTransform:"uppercase", letterSpacing:"0.07em", width:100 }}>Time</th>
                  {drivers.map(d => (
                    <th key={d.user_id} style={{ padding:"10px 10px", textAlign:"center", fontSize:12, fontWeight:800, color:C.forest, whiteSpace:"nowrap" }}>
                      <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:C.foam, borderRadius:10, padding:"6px 12px", border:`1px solid ${C.mist}` }}>
                        <div style={{ width:28, height:28, borderRadius:"50%", background:C.green, color:C.fern, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:11 }}>
                          {d.name?.split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <div style={{ textAlign:"left" }}>
                          <div style={{ fontSize:12, fontWeight:800, color:C.forest }}>{d.name}</div>
                          <div style={{ fontSize:10, color:C.sage }}>🚗 {d.vehicle || "—"}</div>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map(slot => (
                  <tr key={slot} style={{ borderTop:`1px solid ${C.mist}` }}>
                    <td style={{ padding:"8px 14px", fontSize:13, fontWeight:700, color:C.forest, background:C.foam, whiteSpace:"nowrap" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:C.mist }}/>
                        {slot}
                      </div>
                    </td>
                    {drivers.map(d => {
                      const del = scheduleGrid[slot]?.[d.user_id];
                      return (
                        <td key={d.user_id} style={{ padding:"6px 8px", textAlign:"center" }}>
                          {del ? (
                            <ScheduleCell delivery={del}/>
                          ) : (
                            <motion.button
                              whileHover={{ scale:1.04, borderColor:C.accent }}
                              whileTap={{ scale:0.97 }}
                              onClick={() => {
                              const pastSlot = isPastTimeSlot(scheduleDate, slot);
                              if (pastSlot) {
                                // Show beautiful custom alert
                                setShowAlert({
                                  show: true,
                                  title: "⏰ Time Slot Unavailable",
                                  message: `The time slot ${slot} has already passed. Please select a future time slot.`,
                                  icon: <Clock size={40} color={C.red} />
                                });
                                return;
                              }
                              setSelectedSlot({driver: d.name, time: slot, pastSlot: false});
                              openModal({time: slot, driver: d.user_id, vehicle: d.vehicle, date: scheduleDate});}}
                              style={{ width:"100%", minWidth:130, height:56, borderRadius:12, border:`1.5px dashed ${C.mist}`, background:C.foam, cursor:"pointer", color:C.accent, fontSize:18, transition:"all .15s" }}>
                              +
                            </motion.button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop:14, padding:"10px 14px", borderRadius:12, background:"#FFF9E8", borderLeft:"3px solid #F59E0B", fontSize:12, color:"#7A5A00" }}>
          📅 Schedule is limited to <strong>today + 14 days</strong>. Click any <strong>+</strong> slot to assign a delivery.
        </div>
      </div>
    </motion.div>
  );
}

function ScheduleCell({ delivery }) {
  const ss = getSS(delivery.status);
  return (
    <motion.div whileHover={{ scale:1.03 }}
      style={{ background:ss.bg, border:`1.5px solid ${ss.dot}44`, borderRadius:12, padding:"8px 10px", textAlign:"left", minWidth:130, cursor:"default" }}>
      <div style={{ fontSize:10, fontWeight:900, color:ss.color, marginBottom:3 }}>{ss.icon} {delivery.status}</div>
      <div style={{ fontSize:11, fontWeight:800, color:C.forest, marginBottom:2 }}>{delivery.order_id}</div>
      <div style={{ fontSize:10, color:C.sage, display:"flex", alignItems:"center", gap:4 }}>
        <User size={9}/> {delivery.customer}
      </div>
    </motion.div>
  );
}

/* ─── Table View ────────────────────────────────────────────────── */
function TableView({ filtered, search, setSearch, statusFilter, setStatusFilter }) {
  return (
    <motion.div key="table" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
      <div style={{ background:C.white, borderRadius:24, padding:"22px 24px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)" }}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:18, fontWeight:800, color:C.forest }}>All Delivery Records</div>
            <div style={{ fontSize:13, color:C.sage, marginTop:3 }}>
              <span style={{ fontWeight:700, color:C.accent }}>{filtered.length}</span> record{filtered.length !== 1 ? "s" : ""} shown
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background:C.foam, borderRadius:16, padding:"14px 16px", border:`1.5px solid ${C.mist}`, marginBottom:18 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr auto", gap:14, alignItems:"end" }}>
            <div>
              <label style={lbl}>Search</label>
              <div style={{ display:"flex", alignItems:"center", gap:8, height:44, border:`1.5px solid ${C.mist}`, borderRadius:12, padding:"0 13px", background:C.white }}>
                <Search size={15} color={C.sage}/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ID, customer or order…"
                  style={{ border:"none", outline:"none", background:"transparent", width:"100%", fontSize:14, color:C.forest, fontFamily:"'Plus Jakarta Sans',sans-serif" }}/>
              </div>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ width:"100%", height:44, border:`1.5px solid ${C.mist}`, borderRadius:12, padding:"0 12px", fontSize:14, outline:"none", background:C.white, color:C.forest, fontWeight:600, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                <option>All</option>
                {Object.keys(statusMeta).map(s => <option key={s}>{s}</option>)}
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
          <table style={{ width:"100%", minWidth:1000, borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:C.foam }}>
                {["Del ID","Order","Customer","Date","Time","Driver","Address","Status","Remarks"].map(h => (
                  <th key={h} style={{ padding:"10px 10px", textAlign:"left", fontSize:11, fontWeight:800, color:C.sage, textTransform:"uppercase", letterSpacing:"0.07em", whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((d, i) => {
                  const ss = getSS(d.status);
                  return (
                    <motion.tr key={d.id}
                      initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                      transition={{ delay:i * 0.02 }}
                      style={{ borderTop:`1px solid ${C.mist}` }}>
                      <td style={{ ...tdc, fontWeight:800, color:C.forest }}>{d.id}</td>
                      <td style={tdc}>{d.order_id}</td>
                      <td style={{ ...tdc, fontWeight:700, color:C.forest }}>{d.customer}</td>
                      <td style={tdc}>{getDateOnly(d.date)}</td>
                      <td style={tdc}>{d.time || "—"}</td>
                      <td style={tdc}>{d.driver || <span style={{ color:"#9AA89B", fontStyle:"italic" }}>Unassigned</span>}</td>
                      <td style={{ ...tdc, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis" }}>{d.address || "—"}</td>
                      <td style={{ padding:"13px 10px" }}>
                        <span style={{ padding:"4px 10px", borderRadius:99, background:ss.bg, color:ss.color, fontSize:12, fontWeight:800 }}>
                          {ss.icon} {d.status}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign:"center", padding:"52px 0", color:C.sage }}>
              <Package size={40} color={C.mist} style={{ marginBottom:12 }}/>
              <div style={{ fontWeight:700 }}>No records match your filters.</div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Driver Board ──────────────────────────────────────────────── */
function DriverBoard({ drivers, deliveries }) {
  if (drivers.length === 0) return (
    <motion.div key="drivers" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
      <div style={{ background:C.white, borderRadius:24, padding:"40px", border:`1.5px solid ${C.mist}`, textAlign:"center", color:C.sage }}>
        <Truck size={48} color={C.mist} style={{ marginBottom:16 }}/>
        <div style={{ fontWeight:700, fontSize:16 }}>No active drivers found.</div>
        <div style={{ fontSize:13, marginTop:6 }}>Make sure drivers have Active status in the system.</div>
      </div>
    </motion.div>
  );

  return (
    <motion.div key="drivers" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:18 }}>
        {drivers.map((d, idx) => {
          const driverDeliveries = deliveries.filter(x => x.driver_id === d.user_id || x.driver === d.name);
          const today            = todayStr();
          const todayList        = driverDeliveries.filter(x => getDateOnly(x.date) === today);
          const weekList         = driverDeliveries.filter(x => isDateAllowed(getDateOnly(x.date)));
          const completed        = driverDeliveries.filter(x => x.status === "Completed").length;
          const active           = driverDeliveries.filter(x => x.status === "Out for Delivery").length;
          const assigned         = driverDeliveries.filter(x => x.status === "Assigned").length;
          const pending          = driverDeliveries.filter(x => x.status === "Pending").length;
          const workloadPct      = Math.min(100, Math.round((weekList.length / Math.max(timeSlots.length, 1)) * 100));
          const initials         = d.name?.split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase() || "DR";

          /* workload color */
          const wColor = workloadPct >= 70 ? C.red : workloadPct >= 40 ? C.amber : C.fern;
          const wBg    = workloadPct >= 70 ? C.redBg : workloadPct >= 40 ? C.amberBg : C.green;

          return (
            <motion.div key={d.user_id}
              initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
              transition={{ delay:idx * 0.07, type:"spring", stiffness:280, damping:24 }}
              whileHover={{ y:-4, boxShadow:"0 20px 48px rgba(16,33,20,0.12)" }}
              style={{ background:C.white, borderRadius:24, padding:"22px 20px", border:`1.5px solid ${C.mist}`, boxShadow:"0 4px 20px rgba(16,33,20,0.07)", overflow:"hidden", position:"relative" }}>

              {/* BG circle decoration */}
              <div style={{ position:"absolute", top:-28, right:-28, width:90, height:90, borderRadius:"50%", background:C.green, opacity:0.4 }}/>

              {/* Driver Header */}
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
                <div style={{ width:52, height:52, borderRadius:"50%", background:`linear-gradient(135deg,${C.accent},${C.fern})`, color:C.white, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:16, flexShrink:0, boxShadow:`0 4px 14px ${C.accent}44` }}>
                  {initials}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800, fontSize:15, color:C.forest }}>{d.name}</div>
                  <div style={{ fontSize:12, color:C.sage, display:"flex", alignItems:"center", gap:5, marginTop:2 }}>
                    <span>🚗</span> {d.vehicle || "No vehicle assigned"}
                  </div>
                </div>
                <div style={{ padding:"4px 10px", borderRadius:99, background:wBg, color:wColor, fontSize:11, fontWeight:800 }}>
                  {workloadPct}% loaded
                </div>
              </div>

              {/* Workload bar */}
              <div style={{ marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                  <span style={{ fontSize:11, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>This Week's Workload</span>
                  <span style={{ fontSize:11, fontWeight:800, color:wColor }}>{weekList.length} deliveries</span>
                </div>
                <div style={{ height:8, background:C.mist, borderRadius:99, overflow:"hidden" }}>
                  <motion.div
                    initial={{ width:0 }} animate={{ width:`${workloadPct}%` }}
                    transition={{ duration:0.8, delay:idx * 0.07 }}
                    style={{ height:"100%", background:`linear-gradient(90deg,${C.accent},${wColor})`, borderRadius:99 }}/>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
                {[
                  { label:"Today",     value:todayList.length, color:C.blue,   bg:C.blueBg   },
                  { label:"Assigned",  value:assigned,         color:C.blue,   bg:C.blueBg   },
                  { label:"Active",    value:active,           color:C.amber,  bg:C.amberBg  },
                  { label:"Done",      value:completed,        color:C.fern,   bg:C.green    },
                ].map(({ label, value, color, bg }) => (
                  <div key={label} style={{ background:bg, borderRadius:12, padding:"10px 6px", textAlign:"center" }}>
                    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:900, fontSize:18, color }}>{value}</div>
                    <div style={{ fontSize:9, color, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.04em", marginTop:2 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Today's deliveries */}
              {todayList.length > 0 ? (
                <div>
                  <div style={{ fontSize:11, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Today's Schedule</div>
                  <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                    {todayList.slice(0,3).map(del => {
                      const ss = getSS(del.status);
                      return (
                        <div key={del.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", background:C.foam, borderRadius:12, border:`1px solid ${C.mist}` }}>
                          <div style={{ fontSize:14 }}>{ss.icon}</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:12, fontWeight:800, color:C.forest }}>{del.order_id}</div>
                            <div style={{ fontSize:11, color:C.sage, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{del.customer}</div>
                          </div>
                          <div style={{ fontSize:11, fontWeight:700, color:ss.color }}>
                            {del.time || "—"}
                          </div>
                        </div>
                      );
                    })}
                    {todayList.length > 3 && (
                      <div style={{ fontSize:11, color:C.sage, textAlign:"center", padding:"4px 0", fontWeight:700 }}>
                        +{todayList.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign:"center", padding:"12px 0", color:C.sage }}>
                  <CheckCircle2 size={22} color={C.mist} style={{ marginBottom:6 }}/>
                  <div style={{ fontSize:12, fontWeight:600 }}>No deliveries today</div>
                </div>
              )}

              {/* Available time slots */}
              <div style={{ marginTop:14 }}>
                <div style={{ fontSize:11, color:C.sage, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:8 }}>Available Slots Today</div>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
                  {timeSlots.map(slot => {
                    const occupied = todayList.some(x => x.time === slot);
                    return (
                      <span key={slot} style={{
                        padding:"3px 9px", borderRadius:99, fontSize:10, fontWeight:800,
                        background: occupied ? C.redBg : C.green,
                        color: occupied ? C.red : C.fern,
                        border: `1px solid ${occupied ? "#FCA5A5" : "#BFE7B8"}`,
                      }}>
                        {slot}
                      </span>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function DeliveryNotificationDropdown({
  unassigned,
  reassignNeeded,
  onAssign,
  onReassign,
  onRefresh,
  onClose,
}) {
  const total = unassigned.length + reassignNeeded.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      style={{
        position: "absolute",
        top: "calc(100% + 10px)",
        right: 0,
        width: 430,
        maxHeight: 520,
        overflowY: "auto",
        background: C.white,
        borderRadius: 20,
        border: `1.5px solid ${C.mist}`,
        boxShadow: "0 16px 48px rgba(16,33,20,0.16)",
        zIndex: 500,
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: `1px solid ${C.mist}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={16} color={C.amber} />
          <strong style={{ color: C.forest }}>Delivery Notifications</strong>
          {total > 0 && (
            <span
              style={{
                background: C.redBg,
                color: C.red,
                borderRadius: 999,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              {total}
            </span>
          )}
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" onClick={onRefresh} style={miniBtn}>
            <RefreshCw size={12} />
          </button>
          <button type="button" onClick={onClose} style={miniBtn}>
            <X size={12} />
          </button>
        </div>
      </div>

      <div style={{ padding: 12 }}>
        {total === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "26px 10px",
              color: C.sage,
              fontWeight: 700,
            }}
          >
            No delivery action needed.
          </div>
        )}

        {unassigned.length > 0 && (
          <>
            <div style={noticeTitle}>Orders Need Driver Assignment</div>

            {unassigned.slice(0, 6).map((d) => (
              <div key={d.id} style={noticeCard}>
                <div>
                  <div style={{ fontWeight: 900, color: C.forest }}>
                    {d.order_id} · {d.customer}
                  </div>
                  <div style={{ fontSize: 12, color: C.sage, marginTop: 3 }}>
                    {getDateOnly(d.date) || "No date"} · {d.address || "No address"}
                  </div>
                </div>

                <button type="button" onClick={() => onAssign(d)} style={assignBtn}>
                  Assign
                </button>
              </div>
            ))}
          </>
        )}

        {reassignNeeded.length > 0 && (
          <>
            <div style={{ ...noticeTitle, marginTop: unassigned.length ? 14 : 0 }}>
              Driver Did Not Start Delivery
            </div>

            {reassignNeeded.slice(0, 6).map((d) => (
              <div key={d.id} style={{ ...noticeCard, background: "#FFF7ED" }}>
                <div>
                  <div style={{ fontWeight: 900, color: C.forest }}>
                    {d.order_id} · {d.customer}
                  </div>
                  <div style={{ fontSize: 12, color: C.amber, marginTop: 3, fontWeight: 800 }}>
                    Assigned {Math.floor(hoursSince(d.assigned_at))} hour(s) ago · Not started
                  </div>
                  <div style={{ fontSize: 12, color: C.sage, marginTop: 3 }}>
                    Current driver: {d.driver || "—"}
                  </div>
                </div>

                <button type="button" onClick={() => onReassign(d)} style={reassignBtn}>
                  Reassign
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
}

function ReassignModal({
  show,
  delivery,
  drivers,
  form,
  setForm,
  closeModal,
  confirmReassign,
  loading,
  setShowAlert,
}) {
  if (!show || !delivery) return null;

  const formValid = !!(form.driver && form.time);

  const handleConfirm = () => {
    // Check if the selected time is in the past for today's date
    const today = todayStr();
    if (form.date === today) {
      const now = new Date();
      const slotDateTime = new Date(`${form.date}T${form.time}:00`);
      if (slotDateTime < now) {
        setShowAlert({
          show: true,
          title: "⏰ Time Slot Unavailable",
          message: `The time slot ${form.time} has already passed. Please select a future time slot.`,
          icon: <Clock size={40} color={C.red} />
        });
        return;
      }
    }
    confirmReassign();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeModal}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10,20,12,0.45)",
          zIndex: 250,
          backdropFilter: "blur(6px)",
        }}
      />

      <motion.div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 251,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          style={{
            width: 620,
            maxWidth: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            background: C.white,
            borderRadius: 28,
            boxShadow: "0 32px 80px rgba(10,20,12,0.22)",
          }}
        >
          <div style={{ padding: 28 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: C.forest,
                  }}
                >
                  🔄 Reassign Delivery · {delivery.id}
                </div>
                <div style={{ fontSize: 13, color: C.sage, marginTop: 4 }}>
                  Driver has not started this delivery after assignment.
                </div>
              </div>

              <button type="button" onClick={closeModal} style={closeBtn}>
                <X size={16} color={C.sage} />
              </button>
            </div>

            <div
              style={{
                background: C.amberBg,
                color: C.amber,
                border: `1px solid #F59E0B40`,
                borderRadius: 14,
                padding: "12px 14px",
                marginBottom: 16,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              ⚠️ Current driver: {delivery.driver || "—"} · Assigned{" "}
              {Math.floor(hoursSince(delivery.assigned_at))} hour(s) ago
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
                marginBottom: 14,
              }}
            >
              <div>
                <label style={lbl}>Order</label>
                <input value={delivery.order_id || ""} readOnly style={{ ...mInp, background: C.foam }} />
              </div>

              <div>
                <label style={lbl}>Customer</label>
                <input value={delivery.customer || ""} readOnly style={{ ...mInp, background: C.foam }} />
              </div>

            <div>
              <label style={lbl}>New Date *</label>
              <input
                type="date"
                value={form.date}
                min={todayStr()}
                max={getTwoWeeksEnd()}
                onChange={(e) => {
                  if (isDateAllowed(e.target.value)) {
                    setForm({ ...form, date: e.target.value });
                  }
                }}
                style={mInp}
              />
            </div>

            <div>
              <label style={lbl}>New Time *</label>
              <select
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                style={mSel}
              >
                <option value="">Select time</option>
                {timeSlots.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={lbl}>New Driver *</label>
              <select
                value={form.driver}
                onChange={(e) => {
                  const dr = drivers.find((x) => x.user_id === e.target.value);
                  setForm({
                    ...form,
                    driver: e.target.value,
                    vehicle: dr?.vehicle || "",
                  });
                }}
                style={mSel}
              >
                <option value="">Select new driver</option>
                {drivers
                  .filter((d) => d.user_id !== delivery.driver_id)
                  .map((d) => (
                    <option key={d.user_id} value={d.user_id}>
                      {d.name} {d.vehicle ? `· ${d.vehicle}` : ""}
                    </option>
                  ))}
              </select>
            </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={lbl}>Reason</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={3}
                style={{
                  ...mInp,
                  height: "auto",
                  padding: "12px 14px",
                  resize: "none",
                }}
              />
            </div>

            <button
              type="button"
              disabled={!formValid || loading}
              onClick={handleConfirm}
              style={{
                width: "100%",
                height: 50,
                borderRadius: 14,
                border: "none",
                background: formValid
                  ? `linear-gradient(135deg,${C.accent},${C.fern})`
                  : "#C8E6C9",
                color: C.white,
                fontWeight: 900,
                cursor: formValid && !loading ? "pointer" : "not-allowed",
              }}
            >
              {loading ? "Reassigning..." : "Reassign Delivery"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Assign Modal ──────────────────────────────────────────────── */
function AssignModal({ show, form, setForm, drivers, selectedSlot, scheduleDate, closeModal, assignDelivery, formValid, unassignedDeliveries, setShowAlert }) {
  const today = todayStr();

  const handleAssign = () => {
    // Check if the selected time is in the past for today's date
    if (form.date === today && form.time) {
      const now = new Date();
      const slotDateTime = new Date(`${form.date}T${form.time}:00`);
      if (slotDateTime < now) {
        setShowAlert({
          show: true,
          title: "⏰ Time Slot Unavailable",
          message: `The time slot ${form.time} has already passed. Please select a future time slot.`,
          icon: <Clock size={40} color={C.red} />
        });
        return;
      }
    }
    assignDelivery();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            onClick={closeModal}
            style={{ position:"fixed", inset:0, background:"rgba(10,20,12,0.45)", zIndex:200, backdropFilter:"blur(6px)" }}/>

          <motion.div style={{ position:"fixed", inset:0, zIndex:201, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
            <motion.div
              initial={{ opacity:0, y:40, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }}
              exit={{ opacity:0, y:20, scale:0.97 }}
              transition={{ type:"spring", stiffness:300, damping:28 }}
              style={{ width:560, maxWidth:"100%", maxHeight:"88vh", overflowY:"auto", background:C.white, borderRadius:28, boxShadow:"0 32px 80px rgba(10,20,12,0.22)" }}
            >
              <div style={{ padding:28 }}>
                {/* Header */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:22 }}>
                  <div>
                    <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:22, fontWeight:900, color:C.forest }}>Assign Delivery</div>
                    <div style={{ fontSize:13, color:C.sage, marginTop:4 }}>
                      {selectedSlot ? `Pre-filled: ${selectedSlot.driver} @ ${selectedSlot.time}` : "Fill in delivery details below"}
                    </div>
                  </div>
                  <motion.button whileHover={{ rotate:90, scale:1.1 }} whileTap={{ scale:0.9 }}
                    onClick={closeModal}
                    style={{ width:36, height:36, borderRadius:10, border:`1.5px solid ${C.mist}`, background:C.foam, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <X size={16} color={C.sage}/>
                  </motion.button>
                </div>

                {/* Delivery selector */}
                <div style={{ marginBottom:14 }}>
                  <label style={lbl}>Select Unassigned Delivery *</label>
                  <select
                    value={form.orderId}
                    onChange={e => {
                      const selected = unassignedDeliveries.find(d => d.order_id === e.target.value);
                      setForm({
                        ...form,
                        deliveryId: selected?.id || "",
                        orderId:    selected?.order_id || "",
                        customer:   selected?.customer || "",
                        address:    selected?.address || "",
                        date:       scheduleDate,
                      });
                    }}
                    style={mSel}
                  >
                    <option value="">Select unassigned delivery</option>
                    {unassignedDeliveries.map(d => (
                      <option key={d.id} value={d.order_id}>{d.order_id} — {d.customer}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                  <div>
                    <label style={lbl}>Customer</label>
                    <input value={form.customer} readOnly placeholder="Auto-filled from order"
                      style={{ ...mInp, background:C.foam, color:C.sage }}/>
                  </div>
                  <div>
                    <label style={lbl}>Date</label>
                    <input type="date" value={form.date} min={todayStr()} max={getTwoWeeksEnd()}
                      onChange={e => { if (isDateAllowed(e.target.value)) setForm({ ...form, date:e.target.value }); }}
                      style={mInp}/>
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                  <div>
                    <label style={lbl}>Time Slot *</label>
                    <select value={form.time} onChange={e => setForm({ ...form, time:e.target.value })} style={mSel}>
                      <option value="">Select time</option>
                      {timeSlots.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Driver *</label>
                    <select value={form.driver} onChange={e => {
                      const dr = drivers.find(x => x.user_id === e.target.value);
                      setForm({ ...form, driver:e.target.value, vehicle:dr?.vehicle || "" });
                    }} style={mSel}>
                      <option value="">Select driver</option>
                      {drivers.map(d => <option key={d.user_id} value={d.user_id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom:18 }}>
                  <label style={lbl}>Vehicle</label>
                  <input value={form.vehicle} readOnly placeholder="Auto-filled from driver"
                    style={{ ...mInp, background:C.foam, color:C.sage }}/>
                </div>

                {form.address && (
                  <div style={{ marginBottom:18 }}>
                    <label style={lbl}>Delivery Address</label>
                    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 14px", background:C.foam, borderRadius:12, border:`1px solid ${C.mist}` }}>
                      <MapPin size={14} color={C.sage}/>
                      <span style={{ fontSize:13, color:C.forest }}>{form.address}</span>
                    </div>
                  </div>
                )}

                {/* Summary */}
                {formValid && (
                  <motion.div initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                    style={{ background:C.green, borderRadius:14, padding:"12px 16px", marginBottom:18, border:`1px solid #BFE7B8`, display:"flex", gap:14, alignItems:"center" }}>
                    <div style={{ fontSize:24 }}>📋</div>
                    <div>
                      <div style={{ fontSize:11, color:C.sage, marginBottom:2 }}>Assignment summary</div>
                      <div style={{ fontSize:13, fontWeight:800, color:C.forest }}>
                        {form.orderId} → {drivers.find(d => d.user_id === form.driver)?.name || "—"} @ {form.time} on {form.date}
                      </div>
                    </div>
                  </motion.div>
                )}

                {selectedSlot?.pastSlot && (
                  <div style={{ background:"#FFF7ED", border:"1px solid #F59E0B", color:"#B45309", padding:"10px", borderRadius:"10px", marginBottom:"12px", fontWeight:"700"
                    }}
                  >
                    ⚠ This delivery is being assigned to a past time slot.
                  </div>
                )}

                <motion.button
                  whileHover={formValid ? { scale:1.03, boxShadow:"0 8px 24px rgba(76,175,80,0.35)" } : {}}
                  whileTap={formValid ? { scale:0.97 } : {}}
                  onClick={handleAssign}
                  style={{ width:"100%", height:50, borderRadius:14, border:"none", background:formValid ? `linear-gradient(135deg,${C.accent},${C.fern})` : "#C8E6C9", color:C.white, fontWeight:900, fontSize:15, cursor:formValid ? "pointer" : "not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:8, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                  <CheckCircle2 size={19}/> Confirm Delivery Assignment
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Main ──────────────────────────────────────────────────────── */
export default function OwnerDelivery() {
  const today = todayStr();

  const [deliveries, setDeliveries]   = useState([]);
  const [drivers, setDrivers]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeTab, setActiveTab]     = useState("schedule");
  const [scheduleDate, setScheduleDate] = useState(today);
  const [showModal, setShowModal]     = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({
    deliveryId:"", orderId:"", customer:"", date:today, time:"",
    driver:"", vehicle:"", address:"",
  });
  const [toast, setToast] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [reassignTarget, setReassignTarget] = useState(null);
const [reassignForm, setReassignForm] = useState({
  driver: "",
  vehicle: "",
  date: today,
  time: "",
  reason: "Driver did not start delivery after 2 hours of assignment.",
});

// Alert state
const [alert, setAlert] = useState({
  show: false,
  title: "",
  message: "",
  icon: null,
});

// FIXED: isPastTimeSlot function - now correctly checks if a time slot is in the past
const isPastTimeSlot = (date, slot) => {
  const now = new Date();
  const slotDateTime = new Date(`${date}T${slot}:00`);
  return slotDateTime < now;
};

const [actionLoading, setActionLoading] = useState(false);
  useEffect(() => { fetchDeliveryData(); }, []);

  const fetchDeliveryData = async () => {
    try {
      const dRes  = await axios.get(`${API}/delivery`);
      setDeliveries(
      dRes.data.map((d) => ({
        ...d,
        status: normalizeDeliveryStatus(d.status || d.delivery_status),
        remarks: d.remarks || d.notes || "",
      }))
    );
    } catch (err) { console.error("Fetch delivery error:", err); }

    try {
      const drRes = await axios.get(`${API}/delivery/drivers`);
      setDrivers(drRes.data.map(d => ({
        ...d,
        avatar: d.name?.split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase() || "DR",
      })));
    } catch (err) {
      console.error("Fetch drivers error:", err);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ deliveryId:"", orderId:"", customer:"", date:scheduleDate, time:"", driver:"", vehicle:"", address:"" });
    setSelectedSlot(null);
  };

  const openModal = (extra = {}) => {
    setForm(f => ({ ...f, date:scheduleDate, ...extra }));
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); resetForm(); };

  /* Only future 2 weeks for schedule */
  const weekDates = useMemo(() => {
    const base = new Date(scheduleDate);
    const day  = base.getDay();
    const monday = new Date(base);
    monday.setDate(base.getDate() - (day === 0 ? 6 : day - 1));
    return Array.from({ length:7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toLocaleDateString("en-CA");
    });
  }, [scheduleDate]);

  const navigateWeek = (dir) => {
    const d = new Date(scheduleDate);
    d.setDate(d.getDate() + dir * 7);
    const candidate = d.toLocaleDateString("en-CA");
    if (dir > 0 && candidate > getTwoWeeksEnd()) return;
    if (dir < 0 && candidate < today) { setScheduleDate(today); return; }
    if (isDateAllowed(candidate)) setScheduleDate(candidate);
    else if (dir > 0) setScheduleDate(getTwoWeeksEnd());
    else setScheduleDate(today);
  };

  const navigateDay = (dir) => {
    const d = new Date(scheduleDate);
    d.setDate(d.getDate() + dir);
    const candidate = d.toLocaleDateString("en-CA");
    if (isDateAllowed(candidate)) setScheduleDate(candidate);
  };

  const todayDeliveries    = deliveries.filter(d => getDateOnly(d.date) === today);
  const scheduleDeliveries = deliveries.filter(d => getDateOnly(d.date) === scheduleDate);

  const filtered = useMemo(() => deliveries.filter(d => {
    const s = search.toLowerCase();
    return (
      (d.id?.toLowerCase().includes(s) ||
       d.customer?.toLowerCase().includes(s) ||
       d.order_id?.toLowerCase().includes(s)) &&
      (statusFilter === "All" || d.status === statusFilter)
    );
  }), [deliveries, search, statusFilter]);

  const kpi = useMemo(() => ({
    total:     todayDeliveries.length,
    pending:   todayDeliveries.filter(d => d.status === "Pending").length,
    progress:  todayDeliveries.filter(d => d.status === "Assigned" || d.status === "Out for Delivery").length,
    completed: todayDeliveries.filter(d => d.status === "Completed").length,
  }), [todayDeliveries]);

  const scheduleGrid = useMemo(() => {
    const grid = {};
    timeSlots.forEach(t => {
      grid[t] = {};
      drivers.forEach(d => { grid[t][d.user_id] = null; });
    });
    scheduleDeliveries.forEach(del => {
      if (!del.driver_id || !del.assigned_at) return;
      const time = new Date(del.assigned_at).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit", hour12:false });
      if (grid[time]) grid[time][del.driver_id] = del;
    });
    return grid;
  }, [scheduleDeliveries, drivers]);

  const deliveriesPerDate = useMemo(() => {
    const map = {};
    weekDates.forEach(d => { map[d] = deliveries.filter(x => getDateOnly(x.date) === d).length; });
    return map;
  }, [weekDates, deliveries]);

  const unassignedDeliveries = deliveries.filter(
    d => !d.driver_id || d.status === "Pending" || d.status === "Not Assigned"
  );

  const reassignNeededDeliveries = deliveries.filter(needsReassign);

const notificationCount =
  unassignedDeliveries.length + reassignNeededDeliveries.length;

const showToast = (message, type = "success") => {
  setToast({ message, type });
  setTimeout(() => setToast(null), 3000);
};

const openAssignFromNotification = (delivery) => {
  setShowNotifications(false);

  openModal({
    deliveryId: delivery.id,
    orderId: delivery.order_id,
    customer: delivery.customer,
    address: delivery.address,
    date: getDateOnly(delivery.date) || today,
  });
};

const openReassignModal = (delivery) => {
  setShowNotifications(false);
  setReassignTarget(delivery);

  setReassignForm({
    driver: "",
    vehicle: "",
    date: getDateOnly(delivery.date) || today,
    time: delivery.time && delivery.time !== "-" ? delivery.time : "",
    reason: "Driver did not start delivery after 2 hours of assignment.",
  });
};

  const formValid = !!(form.deliveryId && form.driver && form.time);

const assignDelivery = async () => {
  if (!formValid) return;

  try {
    setActionLoading(true);

    const res = await axios.patch(`${API}/delivery/${form.deliveryId}/assign`, {
      driver_id: form.driver,
      assigned_time: form.time,
      requested_date: form.date,
    });

    closeModal();
    showToast(res.data?.message || "Delivery assigned successfully.");
    fetchDeliveryData();
  } catch (err) {
    console.error("Assign delivery error:", err);
    showToast(
      err.response?.data?.message || "Failed to assign delivery.",
      "error"
    );
  } finally {
    setActionLoading(false);
  }
};

const confirmReassign = async () => {
  if (!reassignTarget || !reassignForm.driver || !reassignForm.date || !reassignForm.time) return;

  try {
    setActionLoading(true);

    const res = await axios.patch(`${API}/delivery/${reassignTarget.id}/reassign`, {
      driver_id: reassignForm.driver,
      assigned_time: reassignForm.time,
      requested_date: reassignForm.date,
      reason: reassignForm.reason,
    });

    setReassignTarget(null);
    showToast(res.data?.message || "Delivery reassigned successfully.");
    fetchDeliveryData();
  } catch (err) {
    console.error("Reassign delivery error:", err);
    showToast(
      err.response?.data?.message || "Failed to reassign delivery.",
      "error"
    );
  } finally {
    setActionLoading(false);
  }
};

  const kpiCards = [
    { title:"Total Today",   value:kpi.total,     sub:`${deliveries.length} total across all dates`,         accent:"#3B82F6", lightBg:C.blueBg,   icon:"📦" },
    { title:"Pending",       value:kpi.pending,   sub:"Awaiting assignment",                                 accent:"#9CA3AF", lightBg:"#F9FAFB",  icon:"🕐" },
    { title:"In Progress",   value:kpi.progress,  sub:"Assigned + out for delivery",                        accent:"#F59E0B", lightBg:C.amberBg,  icon:"🚚" },
    { title:"Completed",     value:kpi.completed, sub:"Today's finished deliveries",                        accent:"#4CAF50", lightBg:C.green,    icon:"✅" },
  ];

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", gap:14, alignItems:"center", justifyContent:"center", background:C.foam, fontFamily:"'Plus Jakarta Sans',sans-serif", color:C.sage }}>
      <motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1.2, ease:"linear" }}>
        <Activity size={36} color={C.fern}/>
      </motion.div>
      <span style={{ fontWeight:700, fontSize:16 }}>Loading deliveries…</span>
    </div>
  );

  return (
    <div style={{ padding:"24px", background:C.foam, minHeight:"100vh", fontFamily:"'Plus Jakarta Sans',sans-serif", width:"calc(100vw - 280px)", maxWidth:"calc(100vw - 280px)", boxSizing:"border-box", overflowX:"hidden" }}>
      {/* Custom Alert */}
      <CustomAlert
        show={alert.show}
        title={alert.title}
        message={alert.message}
        icon={alert.icon}
        onClose={() => setAlert({ show: false, title: "", message: "", icon: null })}
      />

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -30, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -30, x: "-50%" }}
            style={{
              position: "fixed",
              top: 24,
              left: "50%",
              zIndex: 3000,
              background: toast.type === "error" ? C.red : C.fern,
              color: C.white,
              padding: "12px 20px",
              borderRadius: 14,
              fontWeight: 800,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div initial={{ opacity:0, y:-18 }} animate={{ opacity:1, y:0 }}>

{/* ── Header ── */}
<div
  style={{
    marginBottom: 30,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
  }}
>
  <div>
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
      <div style={{ width:8, height:36, borderRadius:99, background:`linear-gradient(180deg,${C.accent},${C.fern})` }}/>
      <h1 style={{ fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:32, fontWeight:900, color:C.forest, margin:0, letterSpacing:"-0.03em" }}>
        Delivery Management
      </h1>
    </div>
    <p style={{ color:C.sage, fontSize:14, margin:"0 0 0 18px", fontWeight:500 }}>
      Schedule, assign and track all chicken deliveries in real time.
    </p>
  </div>

  <div style={{ position: "relative" }}>
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={() => setShowNotifications((prev) => !prev)}
      style={{
        width: 46,
        height: 46,
        borderRadius: 14,
        border: `1.5px solid ${C.mist}`,
        background: showNotifications ? C.foam : C.white,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 18px rgba(16,33,20,0.08)",
        position: "relative",
      }}
    >
      <Bell size={19} color={C.pine} />

      {notificationCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: -7,
            right: -7,
            minWidth: 22,
            height: 22,
            borderRadius: 999,
            background: C.red,
            color: C.white,
            fontSize: 11,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2px solid ${C.white}`,
          }}
        >
          {notificationCount}
        </span>
      )}
    </motion.button>

    <AnimatePresence>
      {showNotifications && (
        <DeliveryNotificationDropdown
          unassigned={unassignedDeliveries}
          reassignNeeded={reassignNeededDeliveries}
          onAssign={openAssignFromNotification}
          onReassign={openReassignModal}
          onRefresh={fetchDeliveryData}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </AnimatePresence>
  </div>
</div>

        {/* ── KPI Row ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))", gap:16, marginBottom:26 }}>
          {kpiCards.map((c, i) => <KpiCard key={c.title} {...c} delay={i * 0.07}/>)}
        </div>

        {/* ── Status Flow ── */}
        <StatusFlow deliveries={deliveries}/>

        {/* ── Tabs ── */}
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab}/>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === "schedule" && (
            <ScheduleView
              scheduleDate={scheduleDate}
              setScheduleDate={setScheduleDate}
              today={today}
              weekDates={weekDates}
              navigateWeek={navigateWeek}
              navigateDay={navigateDay}
              deliveriesPerDate={deliveriesPerDate}
              scheduleDeliveries={scheduleDeliveries}
              scheduleGrid={scheduleGrid}
              drivers={drivers}
              openModal={openModal}
              setSelectedSlot={setSelectedSlot}
              isPastTimeSlot={isPastTimeSlot}
              setShowAlert={setAlert}
            />
          )}
          {activeTab === "table" && (
            <TableView
              filtered={filtered}
              search={search}
              setSearch={setSearch}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          )}
          {activeTab === "drivers" && (
            <DriverBoard drivers={drivers} deliveries={deliveries}/>
          )}
        </AnimatePresence>

      </motion.div>

      {/* ── Assign Modal ── */}
      <AssignModal
        show={showModal}
        form={form}
        setForm={setForm}
        drivers={drivers}
        selectedSlot={selectedSlot}
        scheduleDate={scheduleDate}
        closeModal={closeModal}
        assignDelivery={assignDelivery}
        formValid={formValid}
        unassignedDeliveries={unassignedDeliveries}
        setShowAlert={setAlert}
      />

      <ReassignModal
        show={!!reassignTarget}
        delivery={reassignTarget}
        drivers={drivers}
        form={reassignForm}
        setForm={setReassignForm}
        closeModal={() => setReassignTarget(null)}
        confirmReassign={confirmReassign}
        loading={actionLoading}
        setShowAlert={setAlert}
      />
    </div>
  );
}

const mInp = {
  width:"100%", height:46, border:`1.5px solid #DDE8D7`, borderRadius:12,
  padding:"0 14px", fontSize:14, outline:"none", background:"#fff",
  boxSizing:"border-box", fontFamily:"'Plus Jakarta Sans',sans-serif",
};
const mSel = { ...mInp, cursor:"pointer" };

const miniBtn = {
  height: 30,
  padding: "0 10px",
  borderRadius: 9,
  border: `1px solid ${C.mist}`,
  background: C.white,
  color: C.pine,
  fontWeight: 800,
  fontSize: 11,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 5,
};

const noticeTitle = {
  fontSize: 11,
  color: C.sage,
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 8,
};

const noticeCard = {
  border: `1px solid ${C.mist}`,
  background: C.foam,
  borderRadius: 14,
  padding: "12px 13px",
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: 10,
  alignItems: "center",
  marginBottom: 8,
};

const assignBtn = {
  ...miniBtn,
  background: C.fern,
  color: C.white,
  border: "none",
};

const reassignBtn = {
  ...miniBtn,
  background: C.amberBg,
  color: C.amber,
  border: `1px solid #F59E0B40`,
};

const closeBtn = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: `1.5px solid ${C.mist}`,
  background: C.foam,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};