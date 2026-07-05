import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  MapPin,
  Phone,
  User,
  Navigation,
  CalendarDays,
  X,
  History,
  Eye,
  Route,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const C = {
  bg: "#F6F8F3",
  surface: "#FFFFFF",
  border: "#E5EDE0",
  green: "#4CAF50",
  greenDark: "#2E7D32",
  greenDim: "#EAF7E3",
  amber: "#F59E0B",
  amberDim: "#FFF8EC",
  red: "#EF4444",
  redDim: "#FEE2E2",
  blue: "#3B82F6",
  blueDim: "#EFF6FF",
  text: "#102114",
  textMid: "#6E8A72",
  textLight: "#9AA89B",
  sans: "'Plus Jakarta Sans', sans-serif",
  body: "'Inter', sans-serif",
};

const FARM_ADDRESS = "AyamTech Farm, Kedah, Malaysia";

// Hours to show in the timetable grid
const TIME_SLOTS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 – 20:00

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ── helpers ── */
const normalizeStatus = (s) => {
  const v = String(s || "").toLowerCase().trim();
  if (v === "assigned") return "assigned";
  if (["out of delivery","out for delivery","out_for_delivery","out-of-delivery"].includes(v)) return "out of delivery";
  if (["completed","complete","delivered"].includes(v)) return "completed";
  return "assigned";
};

const statusMeta = (status) => {
  const s = normalizeStatus(status);
  if (s === "completed") return { label: "Completed", icon: CheckCircle2, color: C.greenDark, bg: C.greenDim, border: "#4CAF5033", dot: C.green, stripe: "#4CAF5022" };
  if (s === "out of delivery") return { label: "Out for Delivery", icon: Truck, color: C.blue, bg: C.blueDim, border: "#3B82F633", dot: C.blue, stripe: "#3B82F618" };
  return { label: "Assigned", icon: Clock, color: C.amber, bg: C.amberDim, border: "#F59E0B33", dot: C.amber, stripe: "#F59E0B18" };
};

function n(value, digits = 0) {
  return Number(value || 0).toLocaleString("en-MY", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function safeDate(value) {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(value);
}

function formatDate(value, long = false) {
  const d = safeDate(value);
  if (!d || isNaN(d)) return "Not set";
  return d.toLocaleDateString("en-MY", { day: "2-digit", month: long ? "long" : "short", year: "numeric", weekday: long ? "long" : undefined });
}

function formatTime(value, fallback = "09:00") {
  const d = safeDate(value);
  if (!d || isNaN(d)) return fallback;
  return d.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function dateKey(value) {
  const d = safeDate(value);
  if (!d || isNaN(d)) return "unknown";
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function isoDateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function relativeDateLabel(value) {
  const d = safeDate(value);
  if (!d || isNaN(d)) return "Scheduled";
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(d); target.setHours(0,0,0,0);
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

function fullAddress(delivery) {
  if (!delivery) return "";
  if (delivery.customer_full_address) return delivery.customer_full_address;
  return [delivery.delivery_address || delivery.customer_address || delivery.address, delivery.customer_area || delivery.area, "Kedah", "Malaysia"].filter(Boolean).join(", ");
}

function getDeliveryHour(delivery) {
  const status = normalizeStatus(delivery.delivery_status || delivery.display_status);
  const raw = status === "completed"
    ? delivery.completed_at || delivery.delivery_date
    : delivery.assigned_at || delivery.generated_at || delivery.delivery_date;
  const d = safeDate(raw);
  if (!d || isNaN(d)) return 9;
  return d.getHours();
}

function getDeliveryTime(delivery) {
  const status = normalizeStatus(delivery.delivery_status || delivery.display_status);
  if (status === "completed") return delivery.completed_at || delivery.delivery_date;
  if (status === "out of delivery") return delivery.out_for_delivery_at || delivery.assigned_at || delivery.delivery_date;
  return delivery.assigned_at || delivery.generated_at || delivery.delivery_date;
}

/* ════════════════════════════════════════════
   ROOT COMPONENT
════════════════════════════════════════════ */
export default function DriverDeliveries() {
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("schedule"); // "schedule" | "completed"
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  // For schedule: which date is focused (date string yyyy-mm-dd)
  const [focusedDate, setFocusedDate] = useState(isoDateKey(new Date()));

  const driver = pageData?.driver || {};
  const stats = pageData?.stats || {};
  const today = pageData?.today || [];
  const upcoming = pageData?.upcoming || [];
  const completed = pageData?.completed || [];

  useEffect(() => { fetchPageData(); }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/driver/deliveries/page-data");
      setPageData(res.data);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to load deliveries." });
    } finally { setLoading(false); }
  };

  const updateStatus = async (deliveryId, status) => {
    try {
      setUpdatingId(deliveryId);
      const res = await API.patch(`/driver/deliveries/${deliveryId}/status`, { delivery_status: status });
      setToast({ type: "success", message: res.data?.message || "Delivery updated." });
      await fetchPageData();
      if (selectedDelivery?.delivery_id === deliveryId) await openDetails(deliveryId, false);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to update." });
    } finally { setUpdatingId(null); }
  };

  const openDetails = async (deliveryId, showLoading = true) => {
    try {
      if (showLoading) setDetailsLoading(true);
      const res = await API.get(`/driver/deliveries/${deliveryId}`);
      setSelectedDelivery(res.data);
    } catch (err) {
      setToast({ type: "error", message: err.response?.data?.error || "Failed to load details." });
    } finally { setDetailsLoading(false); }
  };

  const openMap = (delivery) => window.open(`https://www.openstreetmap.org/search?query=${encodeURIComponent(fullAddress(delivery))}`, "_blank");
  const callCustomer = (delivery) => { if (delivery?.customer_phone) window.location.href = `tel:${delivery.customer_phone}`; };

  // Combine today + upcoming for the schedule view
  const allScheduled = useMemo(() => [...today, ...upcoming], [today, upcoming]);

  // ── UPDATED: Always show today + next 13 days (2 full weeks),
  //    then append any delivery dates that fall outside that window.
  const scheduleDates = useMemo(() => {
    // Generate today + 13 more days = 14 days total
    const twoWeeks = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + i);
      return isoDateKey(d);
    });

    // Also include any delivery dates that fall outside the 2-week window
    // (e.g. a delivery scheduled 3 weeks from now)
    const extraDeliveryDates = allScheduled
      .map(d => dateKey(d.delivery_date || d.assigned_at))
      .filter(k => k !== "unknown" && !twoWeeks.includes(k));

    return [...new Set([...twoWeeks, ...extraDeliveryDates])].sort();
  }, [allScheduled]);

  // focusedDate is always valid since today is always in scheduleDates
  const focusedIdx = scheduleDates.indexOf(focusedDate);

  // Deliveries for the currently focused date
  const deliveriesForDay = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allScheduled.filter(item => {
      const dk = dateKey(item.delivery_date || item.assigned_at);
      if (dk !== focusedDate) return false;
      const s = normalizeStatus(item.delivery_status || item.display_status);
      if (statusFilter !== "all" && s !== statusFilter) return false;
      if (q) {
        return (
          String(item.delivery_id || "").toLowerCase().includes(q) ||
          String(item.customer_name || "").toLowerCase().includes(q) ||
          String(fullAddress(item)).toLowerCase().includes(q) ||
          String(item.batch_id || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allScheduled, focusedDate, search, statusFilter]);

  // Group by hour for the timetable
  const byHour = useMemo(() => {
    const map = {};
    deliveriesForDay.forEach(d => {
      const h = getDeliveryHour(d);
      if (!map[h]) map[h] = [];
      map[h].push(d);
    });
    return map;
  }, [deliveriesForDay]);

  const completedList = useMemo(() => {
    const q = search.toLowerCase().trim();
    return completed.filter(item => {
      const s = normalizeStatus(item.delivery_status || item.display_status);
      if (statusFilter !== "all" && s !== statusFilter) return false;
      if (q) return (
        String(item.delivery_id || "").toLowerCase().includes(q) ||
        String(item.customer_name || "").toLowerCase().includes(q) ||
        String(fullAddress(item)).toLowerCase().includes(q)
      );
      return true;
    });
  }, [completed, search, statusFilter]);

  const completedTodayCount = today.filter(d => normalizeStatus(d.delivery_status || d.display_status) === "completed").length;
  const todayProgress = today.length ? Math.round((completedTodayCount / today.length) * 100) : 0;
  const todayKey = isoDateKey(new Date());

  if (loading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, fontFamily: C.body }}>
      <style>{fontStyle}</style>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }} style={{ width: 44, height: 44, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.blue }} />
      <p style={{ color: C.textMid, fontWeight: 800 }}>Loading deliveries…</p>
    </div>
  );

  const focusedDateObj = safeDate(focusedDate);
  const isToday = focusedDate === todayKey;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: C.body, color: C.text }}>
      <style>{fontStyle}</style>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "28px 32px" }}>

        {/* ── Header ── */}
        <motion.div {...fadeUp(0)} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 22, padding: "18px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, boxShadow: "0 6px 22px rgba(16,33,20,.06)" }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: C.sans, fontWeight: 900, fontSize: 24 }}>🚚 My Deliveries</h1>
            <p style={{ margin: "4px 0 0", color: C.textMid, fontWeight: 700, fontSize: 13 }}>
              {new Date().toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 999, padding: "8px 14px", display: "flex", alignItems: "center", gap: 7, fontWeight: 900, fontFamily: C.sans, fontSize: 13 }}>
              <User size={14} color={C.blue} />
              {driver.full_name || driver.username || "Driver"}
            </div>
            <button onClick={fetchPageData} style={btnStyle}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </motion.div>

        {/* ── Stats ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
          {[
            { icon: Clock, label: "Pending", value: n(stats.pending_count), color: C.amber, bg: C.amberDim, d: 0.03 },
            { icon: Truck, label: "In Transit", value: n(stats.in_transit_count), color: C.blue, bg: C.blueDim, d: 0.05 },
            { icon: CheckCircle2, label: "Completed", value: n(stats.completed_count), color: C.greenDark, bg: C.greenDim, d: 0.07 },
            { icon: CalendarDays, label: "Upcoming", value: n(stats.upcoming_count), color: C.red, bg: C.redDim, d: 0.09 },
          ].map(({ icon: Icon, label, value, color, bg, d }) => (
            <motion.div key={label} {...fadeUp(d)} whileHover={{ y: -3 }} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18, padding: "15px 18px", display: "flex", alignItems: "center", gap: 13, boxShadow: "0 4px 14px rgba(16,33,20,.05)" }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={21} color={color} />
              </div>
              <div>
                <div style={{ fontFamily: C.sans, fontSize: 24, fontWeight: 900, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 800, marginTop: 4, color: C.textMid }}>{label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <motion.div {...fadeUp(0.08)} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 18, maxWidth: 420 }}>
          {[
            { key: "schedule", icon: <CalendarDays size={15} />, label: "Schedule", count: today.length + upcoming.length },
            { key: "completed", icon: <History size={15} />, label: "History", count: completed.length },
          ].map(({ key, icon, label, count }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ height: 42, border: `1.5px solid ${activeTab === key ? C.green : "transparent"}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer", fontFamily: C.sans, fontWeight: 900, fontSize: 13, background: activeTab === key ? C.green : "transparent", color: activeTab === key ? "#fff" : C.textMid, transition: "all .2s" }}>
              {icon}{label}
              <span style={{ minWidth: 20, height: 20, borderRadius: 999, background: activeTab === key ? "rgba(255,255,255,.25)" : C.bg, color: activeTab === key ? "#fff" : C.textMid, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>{count}</span>
            </button>
          ))}
        </motion.div>

        {/* ── Filter bar ── */}
        <motion.div {...fadeUp(0.1)} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 15, padding: 10, display: "flex", gap: 10, marginBottom: 18, alignItems: "center" }}>
          <div style={{ flex: 1, background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 11, padding: "0 12px", height: 40, display: "flex", alignItems: "center", gap: 8 }}>
            <Search size={15} color={C.textLight} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, delivery ID, address…" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontFamily: C.body, fontWeight: 700, color: C.text, fontSize: 13 }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ height: 40, border: `1.5px solid ${C.border}`, borderRadius: 11, padding: "0 12px", background: C.bg, color: C.text, fontFamily: C.sans, fontWeight: 800, fontSize: 13 }}>
            <option value="all">All Status</option>
            <option value="assigned">Assigned</option>
            <option value="out of delivery">Out for Delivery</option>
            <option value="completed">Completed</option>
          </select>
        </motion.div>

        {/* ── Main content ── */}
        {activeTab === "schedule" ? (
          <motion.div {...fadeUp(0.12)}>

            {/* ── Date nav bar (now always shows 14 days) ── */}
            <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 20, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, boxShadow: "0 4px 14px rgba(16,33,20,.05)" }}>

              {/* Prev */}
              <button
                onClick={() => { if (focusedIdx > 0) setFocusedDate(scheduleDates[focusedIdx - 1]); }}
                disabled={focusedIdx <= 0}
                style={{ ...iconBtnStyle, opacity: focusedIdx <= 0 ? 0.35 : 1 }}
              >
                <ChevronLeft size={18} />
              </button>

              {/* Date pills — scrollable strip of 14 days */}
              <div style={{ display: "flex", gap: 8, flex: 1, overflowX: "auto", scrollbarWidth: "none" }}>
                {scheduleDates.map(dk => {
                  const d = safeDate(dk);
                  const isActive = dk === focusedDate;
                  const isT = dk === todayKey;
                  const rel = relativeDateLabel(dk);
                  // Green dot = has actual deliveries on this day
                  const hasDel = allScheduled.some(item => dateKey(item.delivery_date || item.assigned_at) === dk);
                  // Dim future days that have no deliveries (faint styling)
                  const isEmpty = !hasDel;

                  return (
                    <button
                      key={dk}
                      onClick={() => setFocusedDate(dk)}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "10px 16px",
                        borderRadius: 14,
                        border: `1.5px solid ${isActive ? C.green : isT ? `${C.green}60` : C.border}`,
                        background: isActive ? C.green : isT && !isActive ? C.greenDim : C.surface,
                        cursor: "pointer",
                        flexShrink: 0,
                        minWidth: 72,
                        transition: "all .2s",
                        position: "relative",
                        opacity: isEmpty && !isActive && !isT ? 0.55 : 1,
                      }}
                    >
                      {/* Green dot for days with deliveries (not active) */}
                      {hasDel && !isActive && (
                        <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: C.green, boxShadow: `0 0 0 2px ${C.greenDim}` }} />
                      )}
                      <span style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 18, color: isActive ? "#fff" : isT ? C.greenDark : C.text, lineHeight: 1 }}>
                        {d?.getDate()}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 800, color: isActive ? "rgba(255,255,255,.8)" : C.textLight, marginTop: 2 }}>
                        {d?.toLocaleDateString("en-MY", { month: "short" }).toUpperCase()}
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 900, color: isActive ? "rgba(255,255,255,.9)" : isT ? C.greenDark : C.textMid, marginTop: 3 }}>
                        {rel}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Next */}
              <button
                onClick={() => { if (focusedIdx < scheduleDates.length - 1) setFocusedDate(scheduleDates[focusedIdx + 1]); }}
                disabled={focusedIdx >= scheduleDates.length - 1}
                style={{ ...iconBtnStyle, opacity: focusedIdx >= scheduleDates.length - 1 ? 0.35 : 1 }}
              >
                <ChevronRight size={18} />
              </button>

              {/* Jump to today button — only shows when not on today */}
              {!isToday && (
                <button onClick={() => setFocusedDate(todayKey)} style={{ ...btnStyle, background: C.greenDim, border: `1.5px solid ${C.green}40`, color: C.greenDark, whiteSpace: "nowrap" }}>
                  Today
                </button>
              )}
            </div>

            {/* ── Date heading ── */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingLeft: 4 }}>
              <div>
                <span style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 20 }}>
                  {isToday ? "📅 Today — " : "📆 "}{focusedDateObj?.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </span>
                <span style={{ marginLeft: 10, fontSize: 13, color: C.textMid, fontWeight: 700 }}>
                  {deliveriesForDay.length > 0
                    ? `${deliveriesForDay.length} ${deliveriesForDay.length === 1 ? "delivery" : "deliveries"} scheduled`
                    : "No deliveries scheduled"}
                </span>
              </div>
              {isToday && today.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 160, height: 8, borderRadius: 999, background: C.bg, border: `1px solid ${C.border}`, overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${todayProgress}%` }}
                      transition={{ duration: 0.7 }}
                      style={{ height: "100%", background: `linear-gradient(90deg, ${C.green}, ${C.greenDark})`, borderRadius: 999 }}
                    />
                  </div>
                  <span style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 13, color: C.greenDark }}>{todayProgress}% done</span>
                </div>
              )}
            </div>

            {/* ── Timetable Grid ── */}
            <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 22, overflow: "hidden", boxShadow: "0 6px 22px rgba(16,33,20,.06)" }}>

              {/* Grid header */}
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", borderBottom: `2px solid ${C.border}`, background: C.greenDim }}>
                <div style={{ padding: "14px 16px", fontFamily: C.sans, fontWeight: 900, fontSize: 11, color: C.greenDark, letterSpacing: ".06em", textTransform: "uppercase" }}>TIME</div>
                <div style={{ padding: "14px 16px", fontFamily: C.sans, fontWeight: 900, fontSize: 11, color: C.greenDark, letterSpacing: ".06em", textTransform: "uppercase", borderLeft: `1px solid ${C.border}` }}>
                  DELIVERIES
                </div>
              </div>

              {/* Time slot rows */}
              {TIME_SLOTS.map(hour => {
                const slotDeliveries = byHour[hour] || [];
                const isCurrentHour = isToday && new Date().getHours() === hour;
                return (
                  <div
                    key={hour}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 1fr",
                      borderBottom: `1px solid ${C.border}`,
                      background: isCurrentHour ? "#F0FAF0" : slotDeliveries.length > 0 ? C.surface : C.bg,
                      minHeight: slotDeliveries.length > 0 ? "auto" : 52,
                      transition: "background .2s",
                    }}
                  >
                    {/* Time label */}
                    <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 6, borderRight: `1px solid ${C.border}`, flexShrink: 0 }}>
                      {isCurrentHour && (
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.green, flexShrink: 0, marginTop: 5, boxShadow: `0 0 0 3px ${C.greenDim}` }} />
                      )}
                      <span style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 13, color: isCurrentHour ? C.greenDark : slotDeliveries.length > 0 ? C.text : C.textLight }}>
                        {String(hour).padStart(2, "0")}:00
                      </span>
                    </div>

                    {/* Deliveries in this slot */}
                    <div style={{ padding: slotDeliveries.length > 0 ? "10px 14px" : "0 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      {slotDeliveries.length === 0 ? (
                        <div style={{ height: 52, display: "flex", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: C.textLight, fontWeight: 700, opacity: 0.5 }}>—</span>
                        </div>
                      ) : (
                        slotDeliveries.map(delivery => (
                          <TimetableDeliveryCard
                            key={delivery.delivery_id}
                            delivery={delivery}
                            onOpenDetails={openDetails}
                            onOpenMap={openMap}
                            onCall={callCustomer}
                            onStart={id => updateStatus(id, "out of delivery")}
                            onComplete={id => updateStatus(id, "completed")}
                            updatingId={updatingId}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Empty state for days with no deliveries ── */}
            {deliveriesForDay.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: "center", padding: "36px 0 28px", color: C.textMid }}
              >
                <CalendarDays size={38} color={C.textLight} style={{ margin: "0 auto 12px" }} />
                <div style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 16, color: C.text }}>
                  {isToday ? "No deliveries scheduled for today" : "No deliveries on this day"}
                </div>
                <div style={{ fontSize: 13, marginTop: 6, color: C.textMid }}>
                  {isToday
                    ? "You're all clear! Check the upcoming days for your next deliveries."
                    : "Enjoy the free day — check other dates for upcoming deliveries."}
                </div>
              </motion.div>
            )}

          </motion.div>
        ) : (
          /* ── Completed / History ── */
          <motion.div {...fadeUp(0.12)}>
            <CompletedList deliveries={completedList} onOpenDetails={openDetails} onOpenMap={openMap} onCall={callCustomer} />
          </motion.div>
        )}

      </main>

      <DeliveryDetailsModal
        delivery={selectedDelivery}
        loading={detailsLoading}
        onClose={() => setSelectedDelivery(null)}
        onOpenMap={openMap}
        onCall={callCustomer}
        onStart={id => updateStatus(id, "out of delivery")}
        onComplete={id => updateStatus(id, "completed")}
        updatingId={updatingId}
      />
    </div>
  );
}

/* ════════════════════════════════════════════
   TIMETABLE DELIVERY CARD
════════════════════════════════════════════ */
function TimetableDeliveryCard({ delivery, onOpenDetails, onOpenMap, onCall, onStart, onComplete, updatingId }) {
  const [expanded, setExpanded] = useState(false);
  const status = normalizeStatus(delivery.delivery_status || delivery.display_status);
  const meta = statusMeta(status);
  const StatusIcon = meta.icon;
  const updating = updatingId === delivery.delivery_id;
  const time = formatTime(getDeliveryTime(delivery));

  return (
    <motion.div
      layout
      style={{ borderRadius: 14, border: `1.5px solid ${meta.border}`, background: meta.stripe, overflow: "hidden" }}
    >
      {/* Row */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", cursor: "pointer" }}
      >
        {/* Status dot + time */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 44 }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: meta.dot, marginBottom: 3 }} />
          <span style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 12, color: meta.color }}>{time}</span>
        </div>

        <div style={{ width: 1, height: 36, background: `${meta.color}30`, flexShrink: 0 }} />

        {/* Customer + ID */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            👤 {delivery.customer_name || "Customer"}
          </div>
          <div style={{ fontSize: 12, color: C.textMid, fontWeight: 700, marginTop: 2, display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: C.textLight }}>#{delivery.delivery_id}</span>
            {delivery.batch_id && <><span style={{ color: C.textLight }}>·</span><span>{delivery.batch_id}</span></>}
          </div>
        </div>

        {/* Address (truncated) */}
        <div style={{ fontSize: 12, color: C.textMid, fontWeight: 700, display: "flex", alignItems: "center", gap: 5, maxWidth: 220, overflow: "hidden" }}>
          <MapPin size={11} color={C.textLight} style={{ flexShrink: 0 }} />
          <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fullAddress(delivery)}</span>
        </div>

        {/* Status pill */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, border: `1px solid ${meta.border}`, borderRadius: 999, padding: "5px 9px", fontSize: 11, fontWeight: 900, fontFamily: C.sans, background: meta.bg, color: meta.color, flexShrink: 0 }}>
          <StatusIcon size={11} />{meta.label}
        </div>

        {/* Expand chevron */}
        <motion.div animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.2 }} style={{ flexShrink: 0 }}>
          <ChevronRight size={15} color={C.textLight} />
        </motion.div>
      </div>

      {/* Expanded actions */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: "hidden" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ borderTop: `1px solid ${meta.border}`, padding: "12px 14px", background: C.surface, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <SmallAction onClick={() => onOpenDetails(delivery.delivery_id)} icon={<Eye size={13} />} label="View Details" color={C.blue} />
              <SmallAction onClick={() => onOpenMap(delivery)} icon={<MapPin size={13} />} label="Navigate" color={C.textMid} />
              {delivery.customer_phone && <SmallAction onClick={() => onCall(delivery)} icon={<Phone size={13} />} label="Call" color={C.textMid} />}
              {status === "assigned" && (
                <SmallAction onClick={() => onStart(delivery.delivery_id)} icon={<Truck size={13} />} label={updating ? "Starting…" : "Start Delivery"} filled color={C.amber} />
              )}
              {status === "out of delivery" && (
                <SmallAction onClick={() => onComplete(delivery.delivery_id)} icon={<CheckCircle2 size={13} />} label={updating ? "Completing…" : "Mark Complete"} filled color={C.greenDark} />
              )}
              <span style={{ marginLeft: "auto", display: "flex", gap: 12, fontSize: 12, color: C.textMid, fontWeight: 700, alignItems: "center" }}>
                {delivery.total_weight_kg && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Package size={12} color={C.textLight} />{n(delivery.total_weight_kg, 2)} kg</span>}
                {delivery.total_amount && <span>RM {n(delivery.total_amount, 2)}</span>}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ════════════════════════════════════════════
   COMPLETED LIST
════════════════════════════════════════════ */
function CompletedList({ deliveries, onOpenDetails, onOpenMap, onCall }) {
  const grouped = useMemo(() => {
    return deliveries.reduce((acc, d) => {
      const k = dateKey(d.completed_at || d.delivery_date);
      if (!acc[k]) acc[k] = [];
      acc[k].push(d);
      return acc;
    }, {});
  }, [deliveries]);

  const keys = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  if (keys.length === 0) return (
    <div style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 22, padding: 60, textAlign: "center", color: C.textMid }}>
      <History size={40} color={C.textLight} style={{ margin: "0 auto 12px", display: "block" }} />
      <div style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 16, color: C.text }}>No completed deliveries yet</div>
      <div style={{ fontSize: 13, marginTop: 5 }}>Completed records will appear here.</div>
    </div>
  );

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {keys.map(key => (
        <div key={key} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 22, overflow: "hidden", boxShadow: "0 4px 14px rgba(16,33,20,.05)" }}>
          <div style={{ background: C.greenDim, padding: "12px 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1.5px solid ${C.border}` }}>
            <CheckCircle2 size={15} color={C.greenDark} />
            <span style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 14, color: C.greenDark }}>{relativeDateLabel(key)}</span>
            <span style={{ fontSize: 12, color: C.textMid, fontWeight: 700 }}>· {formatDate(key, true)}</span>
            <span style={{ marginLeft: "auto", background: C.greenDark, color: "#fff", borderRadius: 999, minWidth: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: C.sans, fontWeight: 900, fontSize: 11, padding: "0 7px" }}>{grouped[key].length}</span>
          </div>
          <div style={{ padding: "14px 18px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
            {grouped[key].map(delivery => (
              <motion.div key={delivery.delivery_id} whileHover={{ y: -2 }} style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: "13px 15px", cursor: "pointer" }} onClick={() => onOpenDetails(delivery.delivery_id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 14 }}>👤 {delivery.customer_name || "Customer"}</div>
                    <div style={{ fontSize: 12, color: C.textMid, fontWeight: 700, marginTop: 2 }}>#{delivery.delivery_id}</div>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, border: `1px solid #4CAF5033`, borderRadius: 999, padding: "4px 8px", fontSize: 10, fontWeight: 900, fontFamily: C.sans, background: C.greenDim, color: C.greenDark }}>
                    <CheckCircle2 size={10} /> Done
                  </div>
                </div>
                <div style={{ fontSize: 12, color: C.textMid, display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
                  <MapPin size={10} color={C.textLight} />{fullAddress(delivery)}
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", gap: 7 }} onClick={e => e.stopPropagation()}>
                  <SmallAction onClick={() => onOpenDetails(delivery.delivery_id)} icon={<Eye size={12} />} label="View" color={C.blue} />
                  <SmallAction onClick={() => onOpenMap(delivery)} icon={<Route size={12} />} label="Route" color={C.textMid} />
                  {delivery.customer_phone && <SmallAction onClick={() => onCall(delivery)} icon={<Phone size={12} />} label="Call" color={C.textMid} />}
                  {delivery.completed_at && (
                    <span style={{ marginLeft: "auto", fontSize: 11, color: C.textLight, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                      <Clock size={11} />{formatTime(delivery.completed_at)}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════
   DELIVERY DETAILS MODAL
════════════════════════════════════════════ */
function DeliveryDetailsModal({ delivery, loading, onClose, onOpenMap, onCall, onStart, onComplete, updatingId }) {
  if (!delivery && !loading) return null;
  const status = normalizeStatus(delivery?.delivery_status || delivery?.display_status);
  const meta = statusMeta(status);
  const StatusIcon = meta.icon;

  return (
    <AnimatePresence>
      {(delivery || loading) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: "fixed", inset: 0, background: "rgba(15,35,24,.48)", backdropFilter: "blur(8px)", zIndex: 1000, padding: 26, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} style={{ width: "min(1040px, 96vw)", maxHeight: "92vh", overflowY: "auto", background: C.surface, borderRadius: 24, padding: 24, border: `1.5px solid ${C.border}`, boxShadow: "0 24px 70px rgba(0,0,0,.22)" }}>
            {loading ? (
              <div style={{ padding: 50, textAlign: "center", color: C.textMid, fontWeight: 900 }}>Loading delivery details…</div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: "0 0 8px", fontFamily: C.sans, fontWeight: 900, fontSize: 22 }}>📦 Delivery #{delivery.delivery_id}</h2>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, border: `1px solid ${meta.border}`, borderRadius: 999, padding: "6px 10px", fontSize: 12, fontWeight: 900, fontFamily: C.sans, background: meta.bg, color: meta.color }}>
                      <StatusIcon size={13} />{meta.label}
                    </div>
                  </div>
                  <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: C.textLight, display: "flex" }}><X size={20} /></button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <InfoCard title="👤 Customer">
                    <InfoItem label="Name" value={delivery.customer_name || "Customer"} />
                    <InfoItem label="Phone" value={delivery.customer_phone || "—"} />
                    <InfoItem label="Email" value={delivery.customer_email || "—"} />
                    <InfoItem label="Address" value={fullAddress(delivery) || "—"} />
                  </InfoCard>
                  <InfoCard title="📦 Order">
                    <InfoItem label="Order ID" value={delivery.order_id || "—"} />
                    <InfoItem label="Batch" value={delivery.batch_id || "—"} />
                    <InfoItem label="Quantity" value={delivery.total_weight_kg ? `${n(delivery.total_weight_kg, 2)} kg` : delivery.requested_quantity ? `${n(delivery.requested_quantity)} chickens` : "—"} />
                    <InfoItem label="Amount" value={delivery.total_amount ? `RM ${n(delivery.total_amount, 2)}` : "—"} />
                  </InfoCard>
                </div>

                <InfoCard title="⏱️ Timeline">
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", padding: "10px 0" }}>
                    {[
                      { label: "Assigned", time: formatTime(delivery.assigned_at || delivery.generated_at), active: true },
                      { label: "Out for Delivery", time: delivery.out_for_delivery_at ? formatTime(delivery.out_for_delivery_at) : "Not started", active: status === "out of delivery" || status === "completed" },
                      { label: "Completed", time: delivery.completed_at ? formatTime(delivery.completed_at) : "Pending", active: status === "completed" },
                    ].map((step, i, arr) => (
                      <div key={step.label} style={{ position: "relative", textAlign: "center" }}>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", margin: "0 auto 8px", background: step.active ? C.green : C.border, position: "relative", zIndex: 2 }} />
                        {i < arr.length - 1 && <div style={{ position: "absolute", top: 6, left: "50%", width: "100%", height: 2, background: arr[i+1].active ? C.green : C.border, zIndex: 1 }} />}
                        <div style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 12 }}>{step.time}</div>
                        <div style={{ color: C.textMid, fontSize: 11, marginTop: 3 }}>{step.label}</div>
                      </div>
                    ))}
                  </div>
                </InfoCard>

                <InfoCard title="📍 Route">
                  <InfoItem label="From" value={FARM_ADDRESS} />
                  <InfoItem label="To" value={fullAddress(delivery) || "—"} />
                  <InfoItem label="Date" value={formatDate(delivery.delivery_date, true)} />
                  <InfoItem label="Remarks" value={delivery.remarks || "No remarks"} />
                </InfoCard>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  <SmallAction onClick={() => onOpenMap(delivery)} icon={<Navigation size={14} />} label="Navigate" filled color={C.blue} />
                  {delivery.customer_phone && <SmallAction onClick={() => onCall(delivery)} icon={<Phone size={14} />} label="Call Customer" color={C.greenDark} />}
                  {status === "assigned" && <SmallAction onClick={() => onStart(delivery.delivery_id)} icon={<Truck size={14} />} label={updatingId === delivery.delivery_id ? "Starting…" : "Start Delivery"} filled color={C.amber} />}
                  {status === "out of delivery" && <SmallAction onClick={() => onComplete(delivery.delivery_id)} icon={<CheckCircle2 size={14} />} label={updatingId === delivery.delivery_id ? "Completing…" : "Complete Delivery"} filled color={C.greenDark} />}
                  {status === "completed" && <SmallAction onClick={() => onOpenMap(delivery)} icon={<Route size={14} />} label="View Route" color={C.blue} />}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Shared small components ── */
function SmallAction({ icon, label, onClick, filled, color = C.blue }) {
  return (
    <button onClick={onClick} style={{ border: `1.5px solid ${color}35`, borderRadius: 10, padding: "7px 10px", display: "inline-flex", alignItems: "center", gap: 5, fontFamily: C.sans, fontWeight: 900, fontSize: 11, cursor: "pointer", background: filled ? color : `${color}12`, color: filled ? "#fff" : color, transition: "all .15s" }}>
      {icon}{label}
    </button>
  );
}

function InfoCard({ title, children }) {
  return (
    <div style={{ background: C.bg, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 15, marginBottom: 14 }}>
      <h3 style={{ margin: "0 0 11px", fontFamily: C.sans, fontWeight: 900, fontSize: 14 }}>{title}</h3>
      <div style={{ display: "grid", gap: 7 }}>{children}</div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "110px 1fr", gap: 8, color: C.textMid, fontSize: 13 }}>
      <span>{label}:</span><strong style={{ color: C.text }}>{value}</strong>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} style={{ position: "fixed", top: 80, right: 24, zIndex: 900, background: C.surface, border: `1.5px solid ${toast.type === "success" ? C.green : C.red}40`, borderLeft: `5px solid ${toast.type === "success" ? C.green : C.red}`, borderRadius: 14, padding: "13px 16px", boxShadow: "0 16px 44px rgba(16,33,20,.16)", minWidth: 290, display: "flex", alignItems: "center", gap: 10 }}>
        {toast.type === "success" ? <CheckCircle2 size={18} color={C.green} /> : <AlertTriangle size={18} color={C.red} />}
        <div style={{ flex: 1, fontWeight: 900, fontFamily: C.sans, fontSize: 13 }}>{toast.message}</div>
        <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: C.textLight, display: "flex" }}><X size={15} /></button>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Base button styles ── */
const btnStyle = {
  border: `1.5px solid ${C.border}`,
  background: C.surface,
  borderRadius: 12,
  padding: "9px 13px",
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontFamily: C.sans,
  fontWeight: 900,
  fontSize: 12,
  color: C.text,
  cursor: "pointer",
};

const iconBtnStyle = {
  border: `1.5px solid ${C.border}`,
  background: C.surface,
  borderRadius: 10,
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  color: C.textMid,
  flexShrink: 0,
};

const fontStyle = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; }
button { transition: all .18s ease; }
button:hover:not(:disabled) { transform: translateY(-1px); }
button:disabled { opacity: .5; cursor: not-allowed !important; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: #C8D7C1; border-radius: 10px; }
@media (max-width: 1100px) {
  main { padding: 16px !important; }
  div[style*="repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }
  div[style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
}
`;
