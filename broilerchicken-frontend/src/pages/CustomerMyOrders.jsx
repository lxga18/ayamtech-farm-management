import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  Search, X, Package, Truck, CheckCircle,
  Clock, CreditCard, MapPin, ChevronRight, ShoppingBag, Phone
} from "lucide-react";

// ─── Status Maps ────────────────────────────────────────────────────────────

const DELIVERY_STATUS = {
  Pending:             { bg: "#FFF8EC", border: "#F59E0B", color: "#92600A", label: "Pending",        icon: "⏳", step: 0 },
  Approved:            { bg: "#EFF6FF", border: "#3B82F6", color: "#1D4E89", label: "Approved",       icon: "✅", step: 1 },
  "Out for Delivery":  { bg: "#F0FDF4", border: "#4CAF50", color: "#3A7D1C", label: "On the way",    icon: "🚚", step: 2 },
  Completed:           { bg: "#EAF7E3", border: "#4CAF50", color: "#3A7D1C", label: "Delivered",      icon: "🎉", step: 3 },
  Cancelled:           { bg: "#FEE2E2", border: "#EF4444", color: "#B91C1C", label: "Cancelled",      icon: "❌", step: 0 },
};

const PICKUP_STATUS = {
  Pending:             { bg: "#FFF8EC", border: "#F59E0B", color: "#92600A", label: "Pending",           icon: "⏳", step: 0 },
  Approved:            { bg: "#EFF6FF", border: "#3B82F6", color: "#1D4E89", label: "Approved",          icon: "✅", step: 1 },
  "Ready for Pickup":  { bg: "#FEF3C7", border: "#F59E0B", color: "#92400E", label: "Ready for Pickup",  icon: "🏪", step: 2 },
  "Customer Arrived":  { bg: "#ECFDF5", border: "#10B981", color: "#047857", label: "Staff Informed",    icon: "✅", step: 2 },
  Collected:           { bg: "#EAF7E3", border: "#4CAF50", color: "#3A7D1C", label: "Collected",         icon: "🎉", step: 3 },
  Cancelled:           { bg: "#FEE2E2", border: "#EF4444", color: "#B91C1C", label: "Cancelled",         icon: "❌", step: 0 },
};

const DELIVERY_STEPS = ["Pending", "Approved", "Out for Delivery", "Completed"];
const PICKUP_STEPS   = ["Pending", "Approved", "Ready for Pickup", "Collected"];

const FARM_ADDRESS       = "AyamTech Farm, Kedah, Malaysia";
const FARM_PHONE         = "0123456789";
const FARM_DIRECTIONS_URL = "https://www.google.com/maps/search/?api=1&query=AyamTech%20Farm%20Kedah%20Malaysia";
const FONT               = "'Inter', sans-serif";

const STATUS_GRADIENT = {
  "Pending":           "linear-gradient(180deg, #FBBF24 0%, #F59E0B 100%)",
  "Approved":          "linear-gradient(180deg, #60A5FA 0%, #3B82F6 100%)",
  "Out for Delivery":  "linear-gradient(180deg, #4ADE80 0%, #22C55E 100%)",
  "Completed":         "linear-gradient(180deg, #4CAF50 0%, #3A7D1C 100%)",
  "Cancelled":         "linear-gradient(180deg, #F87171 0%, #EF4444 100%)",
  "Ready for Pickup":  "linear-gradient(180deg, #FCD34D 0%, #F59E0B 100%)",
  "Collected":         "linear-gradient(180deg, #4CAF50 0%, #3A7D1C 100%)",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const normalizeDeliveryStatus = (status) => {
  const value = String(status || "").toLowerCase().trim();
  if (value === "out of delivery" || value === "out for delivery") return "Out for Delivery";
  if (value === "completed") return "Completed";
  return status || "Not Assigned";
};

const getCustomerDisplayStatus = (order) => {
  const deliveryType    = order.delivery_type || "Delivery";
  const orderStatus     = order.order_status || "Pending";
  const deliveryStatus  = normalizeDeliveryStatus(order.delivery_status);

  if (deliveryType === "Pickup") {
    if (orderStatus === "Completed")        return "Collected";
    if (orderStatus === "Ready for Pickup") return "Ready for Pickup";
    if (orderStatus === "Customer Arrived") return "Customer Arrived";
    return orderStatus;
  }

  if (deliveryStatus === "Out for Delivery") return "Out for Delivery";
  if (deliveryStatus === "Completed")        return "Completed";
  return orderStatus;
};

const getStatusConfig = (order) =>
  order.delivery === "Pickup"
    ? PICKUP_STATUS[order.status]    || PICKUP_STATUS.Pending
    : DELIVERY_STATUS[order.status]  || DELIVERY_STATUS.Pending;

const getSteps = (order) =>
  order.delivery === "Pickup" ? PICKUP_STEPS : DELIVERY_STEPS;

const isHalfPaidLine = (order, idx, steps) => {
  // For pickup orders: show half line between Approved and Ready for Pickup only if paid
  if (order.delivery === "Pickup") {
    // Check if this is the line between Approved (index 0) and Ready for Pickup (index 1)
    if (steps[idx] === "Approved" && steps[idx + 1] === "Ready for Pickup") {
      // Only show half line if payment is made
      return order.payment === "Paid";
    }
    return false;
  }
  
  // For delivery orders: original logic
  return (
    order.delivery === "Delivery" &&
    order.orderStatus === "Approved" &&
    order.payment === "Paid" &&
    idx === 1
  );
};

// ─── Ready-for-Pickup Full Screen ─────────────────────────────────────────────

function PickupReadyScreen({ order, onClose, onInformStaff }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(10,20,12,0.55)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px",
        fontFamily: FONT,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 44, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 28, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "420px", maxWidth: "100%",
          background: "#fff",
          borderRadius: "32px",
          overflow: "hidden",
          boxShadow: "0 48px 120px rgba(10,20,12,0.30)",
        }}
      >
        {/* ── Amber top band ── */}
        <div style={{
          background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 60%, #FDE68A 100%)",
          padding: "36px 32px 28px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* decorative circles */}
          {[
            { size: 160, top: -50, right: -50, opacity: 0.15 },
            { size: 90,  top: 10,  right: 70,  opacity: 0.12 },
            { size: 60,  top: -20, left: 30,   opacity: 0.10 },
          ].map((c, i) => (
            <div key={i} style={{
              position: "absolute",
              width: c.size, height: c.size,
              borderRadius: "50%",
              background: "#fff",
              top: c.top, right: c.right, left: c.left,
              opacity: c.opacity,
              pointerEvents: "none",
            }} />
          ))}

          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              width: 34, height: 34, borderRadius: "50%",
              border: "none", background: "rgba(255,255,255,0.35)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={15} color="#92400E" />
          </button>

          {/* Store icon */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 280 }}
            style={{
              width: 80, height: 80, borderRadius: "26px",
              background: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "38px",
              boxShadow: "0 12px 36px rgba(245,158,11,0.35)",
              marginBottom: "16px",
            }}
          >
            🏪
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "24px", fontWeight: 900, color: "#fff", lineHeight: 1.15, marginBottom: "6px" }}
          >
            Ready for Pickup!
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            style={{ fontSize: "13px", color: "rgba(255,255,255,0.82)" }}
          >
            You're picking up order <span style={{ fontWeight: 800, color: "#fff" }}>{order.id}</span>
          </motion.div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "26px 28px 30px" }}>

          {/* Order summary chip */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
            style={{
              background: "#F9FCF6", borderRadius: "18px",
              border: "1.5px solid #DDE8D7",
              padding: "16px 20px",
              display: "flex", alignItems: "center", gap: "18px",
              marginBottom: "22px",
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                <span style={{ fontSize: "18px" }}>📦</span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "16px", color: "#102114" }}>
                  {order.weight.toFixed(0)} kg &nbsp;·&nbsp; RM {order.total.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span style={{ fontSize: "14px" }}>🐔</span>
                <span style={{ fontSize: "12px", color: "#6E8A72", fontWeight: 600 }}>Batch {order.batch}</span>
              </div>
            </div>
            <div style={{
              padding: "6px 14px", borderRadius: "999px",
              background: "#FEF3C7", color: "#92400E",
              fontSize: "11px", fontWeight: 800,
              border: "1px solid #FDE68A",
            }}>
              🏪 Pickup
            </div>
          </motion.div>

          {/* Instruction */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}
            style={{
              textAlign: "center",
              fontSize: "13px", color: "#6E8A72", lineHeight: 1.65,
              marginBottom: "22px",
              padding: "0 8px",
            }}
          >
            Please notify farm staff that<br />you have arrived.
          </motion.div>

          {/* Action buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.36 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onInformStaff(order)}
            disabled={order.orderStatus === "Customer Arrived"}
            style={{ width: "100%", height: "52px", borderRadius: "16px", border: "none", background: order.orderStatus === "Customer Arrived" ? "#9AA89B" : "linear-gradient(135deg, #102114 0%, #1E3A22 100%)", color: "#fff", fontWeight: 800, fontSize: "15px", cursor: order.orderStatus === "Customer Arrived" ? "not-allowed" : "pointer", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", boxShadow: "0 8px 24px rgba(16,33,20,0.28)" }}
          >
            ✅ {order.orderStatus === "Customer Arrived" ? "Staff Informed" : "Inform Staff"}
          </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.40 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => window.open(FARM_DIRECTIONS_URL, "_blank")}
              style={{
                width: "100%", height: "52px", borderRadius: "16px",
                border: "1.5px solid #DDE8D7",
                background: "#F9FCF6",
                color: "#244128", fontWeight: 700, fontSize: "14px",
                cursor: "pointer", fontFamily: FONT,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              }}
            >
              <MapPin size={16} color="#4CAF50" />
              Get Directions
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              onClick={onClose}
              style={{
                width: "100%", height: "46px", borderRadius: "14px",
                border: "1.5px solid #E5EDE0",
                background: "transparent",
                color: "#9AA89B", fontWeight: 600, fontSize: "13px",
                cursor: "pointer", fontFamily: FONT,
              }}
            >
              Staff Will Confirm — Close
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CustomerMyOrders() {
  const customerId = sessionStorage.getItem("customer_id");
  const [orders,           setOrders]           = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [search,           setSearch]           = useState("");
  const [statusFilter,     setStatusFilter]     = useState("All");
  const [selectedOrder,    setSelectedOrder]    = useState(null);
  const [cancelPopup,      setCancelPopup]      = useState(false);
  const [selectedCancelId, setSelectedCancelId] = useState(null);
  const [pickupOrder,      setPickupOrder]      = useState(null);

  useEffect(() => {
    API.get(`/customer/orders/${customerId}`)
      .then((res) => {
        const mapped = res.data.map((o) => {
          const deliveryType    = o.delivery_type || "Delivery";
          const displayStatus   = getCustomerDisplayStatus(o);
          return {
            id:             o.order_id,
            date:           String(o.order_date).slice(0, 10),
            batch:          o.batch_id,
            quantity:       Number(o.requested_quantity),
            weight:         Number(o.requested_quantity) * Number(o.avg_weight_kg || 0),
            priceKg:        Number(o.price_per_kg || 0),
            deliveryFee:    deliveryType === "Delivery" ? 25 : 0,
            total:          Number(o.total_amount || 0) + (deliveryType === "Delivery" ? 25 : 0),
            payment:        o.payment_status || "Pending",
            status:         displayStatus,
            orderStatus:    o.order_status || "Pending",
            deliveryStatus: normalizeDeliveryStatus(o.delivery_status),
            delivery:       deliveryType,
            driver:         deliveryType === "Pickup" ? "Farm Staff" : o.driver_name || "Not assigned",
            vehicle:        deliveryType === "Pickup" ? "Not required" : o.vehicle_no || "—",
            time:           deliveryType === "Pickup"
              ? (o.requested_delivery_date ? String(o.requested_delivery_date).slice(0, 10) : "After farm confirmation")
              : (o.requested_delivery_date ? String(o.requested_delivery_date).slice(0, 10) : "Pending"),
            address:        deliveryType === "Pickup" ? FARM_ADDRESS : o.delivery_address || "Customer delivery address",
            eta:            null,
          };
        });
        setOrders(mapped);
        setLoading(false);
      })
      .catch((err) => { console.error("Orders error:", err); setLoading(false); });
  }, [customerId]);

  const handleCancelClick = (orderId) => { setSelectedCancelId(orderId); setCancelPopup(true); };

  const handleInformStaff = async (order) => {
  try {
    const res = await API.patch(`/customer/orders/${order.id}/inform-staff`, { customer_id: customerId });

    setOrders((prev) => prev.map((o) =>
      o.id === order.id ? { ...o, status: "Customer Arrived", orderStatus: "Customer Arrived" } : o
    ));

    setPickupOrder((prev) =>
      prev ? { ...prev, status: "Customer Arrived", orderStatus: "Customer Arrived" } : prev
    );

    alert(res.data?.message || "Farm staff has been informed.");
  } catch (err) {
    alert(err.response?.data?.message || "Failed to inform farm staff.");
  }
};

  const confirmCancelOrder = async () => {
    try {
      await API.patch(`/customer/orders/${selectedCancelId}/cancel`, { customer_id: customerId });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedCancelId ? { ...o, status: "Cancelled", orderStatus: "Cancelled" } : o
        )
      );
      setSelectedOrder(null);
      setCancelPopup(false);
      setSelectedCancelId(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel order.");
    }
  };

  const kpi = useMemo(() => ({
    total:     orders.length,
    pending:   orders.filter(o => ["Pending", "Approved", "Out for Delivery", "Ready for Pickup"].includes(o.status)).length,
    completed: orders.filter(o => ["Completed", "Collected"].includes(o.status)).length,
    spent:     orders.filter(o => o.payment === "Paid").reduce((s, o) => s + o.total, 0),
  }), [orders]);

  const filtered = useMemo(() => orders.filter(o => {
    const s = search.toLowerCase();
    return (o.id.toLowerCase().includes(s) || o.batch.toLowerCase().includes(s))
      && (statusFilter === "All" || o.status === statusFilter);
  }), [orders, search, statusFilter]);

  const activeOrder = orders.find(o => o.status === "Out for Delivery");

  if (loading) {
    return (
      <div style={{ padding: "32px", background: "#F4F7F2", minHeight: "100vh", fontFamily: FONT, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>🐔</div>
          <div style={{ color: "#6E8A72", fontWeight: 600 }}>Loading your orders…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", background: "#F4F7F2", minHeight: "100vh", fontFamily: FONT }}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "15px", background: "#102114", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingBag size={24} color="#4CAF50" />
            </div>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "28px", fontWeight: 800, color: "#102114" }}>My Orders</div>
              <div style={{ color: "#6E8A72", fontSize: "13px", marginTop: "2px" }}>Track your chicken orders, payments & deliveries in real time.</div>
            </div>
          </div>
          <div style={{ padding: "10px 18px", borderRadius: "12px", background: "#EAF7E3", border: "1px solid #C8E6C9", fontSize: "13px", fontWeight: 700, color: "#3A7D1C", display: "flex", alignItems: "center", gap: "6px" }}>
            <Package size={15} color="#3A7D1C" />
            {orders.length} total orders
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
          {[
            { label: "Total Orders", value: kpi.total,     accent: "#3B82F6", bg: "#EFF6FF", icon: <Package     size={17} color="#3B82F6" /> },
            { label: "In Progress",  value: kpi.pending,   accent: "#F59E0B", bg: "#FFF8EC", icon: <Clock       size={17} color="#F59E0B" /> },
            { label: "Completed",    value: kpi.completed, accent: "#4CAF50", bg: "#EAF7E3", icon: <CheckCircle size={17} color="#4CAF50" /> },
            { label: "Total Spent",  value: `RM ${kpi.spent.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`, accent: "#8B5CF6", bg: "#F0EDFF", icon: <CreditCard size={17} color="#8B5CF6" /> },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              style={{ background: "#fff", borderRadius: "20px", padding: "18px", boxShadow: "0 8px 24px rgba(17,24,39,0.05)", borderTop: `3px solid ${c.accent}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{ fontSize: "11px", color: "#70836B", fontWeight: 600 }}>{c.label}</span>
                <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: c.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.icon}</div>
              </div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "22px", fontWeight: 800, color: "#102114" }}>{c.value}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Live delivery banner ── */}
        {activeOrder && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            style={{ background: "#102114", borderRadius: "22px", padding: "20px 26px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "18px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: "-40px", top: "-40px", width: "200px", height: "200px", borderRadius: "50%", border: "30px solid rgba(76,175,80,0.10)", pointerEvents: "none" }} />
            <div style={{ width: "50px", height: "50px", borderRadius: "15px", background: "#4CAF50", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Truck size={24} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "16px", fontWeight: 800, color: "#fff" }}>{activeOrder.id} is on the way!</span>
                <span style={{ padding: "3px 10px", borderRadius: "999px", background: "#4CAF5033", color: "#86EFAC", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em" }}>LIVE</span>
              </div>
              <div style={{ fontSize: "12px", color: "#86A882" }}>Driver: {activeOrder.driver} · ETA {activeOrder.eta || "Updating"}</div>
            </div>
            <button onClick={() => setSelectedOrder(activeOrder)}
              style={{ height: "40px", padding: "0 18px", borderRadius: "12px", background: "#4CAF50", border: "none", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, fontFamily: FONT }}>
              Track <ChevronRight size={15} />
            </button>
          </motion.div>
        )}

        {/* ── Filters ── */}
        <div style={{ background: "#fff", borderRadius: "18px", padding: "16px 20px", boxShadow: "0 6px 20px rgba(17,24,39,0.05)", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto auto auto auto auto", gap: "10px", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "44px", border: "1.5px solid #DDE8D7", borderRadius: "12px", padding: "0 14px", background: "#FAFCF8" }}>
              <Search size={15} color="#6E8A72" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order ID or batch…"
                style={{ border: "none", outline: "none", background: "transparent", fontSize: "13px", width: "100%", color: "#102114", fontFamily: FONT }} />
            </div>
            {["All", "Pending", "Approved", "Ready for Pickup", "Out for Delivery", "Completed", "Cancelled"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                style={{ height: "44px", padding: "0 16px", borderRadius: "12px", border: statusFilter === s ? "none" : "1.5px solid #E5EDE0", background: statusFilter === s ? "#102114" : "#fff", color: statusFilter === s ? "#fff" : "#4B5E4F", fontWeight: 700, fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap", fontFamily: FONT }}>
                {s === "All" ? "All Orders" : s}
              </button>
            ))}
          </div>
        </div>

        {/* ── Order cards ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filtered.map((o, i) => {
            const ss        = getStatusConfig(o);
            const steps     = getSteps(o);
            const stepIdx   = ss.step;
            const isPaid    = o.payment === "Paid";
            const gradient  = STATUS_GRADIENT[o.status] || STATUS_GRADIENT["Pending"];
            const showPayNow = o.orderStatus === "Approved" && !isPaid;
            const isReadyPickup = o.delivery === "Pickup" && o.status === "Ready for Pickup";

            return (
              <motion.div key={o.id}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                whileHover={{ y: -3, boxShadow: "0 24px 56px rgba(17,24,39,0.13)" }}
                onClick={() => setSelectedOrder(o)}
                style={{ background: "#fff", borderRadius: "22px", boxShadow: "0 4px 20px rgba(17,24,39,0.07)", overflow: "hidden", cursor: "pointer", display: "flex" }}>

                <div style={{ width: "6px", flexShrink: 0, background: gradient }} />

                <div style={{ flex: 1, padding: "20px 24px" }}>
                  {/* ── Top row ── */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <div style={{ width: "54px", height: "54px", borderRadius: "16px", background: ss.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px", flexShrink: 0, border: `1.5px solid ${ss.border}33` }}>
                        {ss.icon}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "18px", fontWeight: 800, color: "#102114" }}>{o.id}</span>
                          <span style={{ padding: "3px 10px", borderRadius: "999px", background: ss.bg, color: ss.color, fontSize: "10px", fontWeight: 800, border: `1px solid ${ss.border}44`, letterSpacing: "0.04em" }}>
                            {ss.label}
                          </span>
                          <span style={{ padding: "3px 10px", borderRadius: "999px", background: o.delivery === "Delivery" ? "#EFF6FF" : "#FEF3C7", color: o.delivery === "Delivery" ? "#1D4E89" : "#92400E", fontSize: "10px", fontWeight: 700 }}>
                            {o.delivery === "Delivery" ? "🚚 Delivery" : "🏪 Pickup"}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#9AA89B" }}>
                          {o.date} &nbsp;·&nbsp; {o.batch} &nbsp;·&nbsp; Driver: <span style={{ color: "#4B5E4F", fontWeight: 600 }}>{o.driver === "Not assigned" ? "—" : o.driver}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "22px", fontWeight: 800, color: "#102114" }}>
                        RM {o.total.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                      </div>
                      <span style={{ display: "inline-block", marginTop: "4px", padding: "3px 10px", borderRadius: "999px", background: isPaid ? "#EAF7E3" : "#FFF8EC", color: isPaid ? "#3A7D1C" : "#92600A", fontSize: "11px", fontWeight: 700 }}>
                        {isPaid ? "✅ Paid" : "⏳ Unpaid"}
                      </span>
                    </div>
                  </div>

                  {/* ── Stat chips ── */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                    {[
                      { emoji: "🐔", label: "Chickens", val: `${o.quantity}` },
                      { emoji: "⚖️", label: "Weight",   val: `${o.weight.toFixed(1)} kg` },
                      { emoji: "💰", label: "Price/kg",  val: `RM ${o.priceKg.toFixed(2)}` },
                      { emoji: "🚚", label: "Delivery",  val: `RM ${o.deliveryFee.toFixed(2)}` },
                    ].map(({ emoji, label, val }) => (
                      <div key={label} style={{ display: "flex", alignItems: "center", gap: "7px", background: "#F4F7F2", borderRadius: "10px", padding: "7px 12px", border: "1px solid #E5EDE0" }}>
                        <span style={{ fontSize: "13px" }}>{emoji}</span>
                        <div>
                          <div style={{ fontSize: "9px", color: "#9AA89B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#102114" }}>{val}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Bottom row: stepper + actions ── */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>

                    {/* Stepper */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0", flex: 1, minWidth: "260px" }}>
                      {steps.map((step, idx) => {
                        const done    = stepIdx > idx;
                        const current = stepIdx === idx && o.status !== "Cancelled";
                        const showHalfLine = isHalfPaidLine(o, idx, steps);
                        
                        return (
                          <div key={step} style={{ display: "flex", alignItems: "center", flex: idx < steps.length - 1 ? 1 : "none" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                              <div style={{
                                width: "26px", height: "26px", borderRadius: "50%",
                                background: done ? "#4CAF50" : current ? ss.border : "#EDF2EB",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "10px", fontWeight: 800,
                                color: (done || current) ? "#fff" : "#BEC9BB",
                                boxShadow: current ? `0 0 0 3px ${ss.border}33` : "none",
                                transition: "all 0.3s",
                              }}>
                                {done ? "✓" : idx + 1}
                              </div>
                              <span style={{ fontSize: "9px", whiteSpace: "nowrap", color: (done || current) ? "#4B5E4F" : "#BEC9BB", fontWeight: current ? 700 : 500 }}>
                                {step}
                              </span>
                            </div>
                            {idx < steps.length - 1 && (
                              <div style={{ 
                                flex: 1, 
                                height: "2.5px", 
                                borderRadius: "99px", 
                                margin: "0 4px", 
                                marginBottom: "14px", 
                                transition: "background 0.3s", 
                                background: done ? "#4CAF50" : 
                                           showHalfLine ? "linear-gradient(90deg, #4CAF50 50%, #E5EDE0 50%)" : 
                                           "#E5EDE0",
                              }} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexShrink: 0 }}>
                      {showPayNow && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/customer/payments?orderId=${o.id}`); }}
                          style={{ height: "36px", padding: "0 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#4CAF50,#2E7D32)", color: "#fff", fontSize: "12px", fontWeight: 800, cursor: "pointer", fontFamily: FONT, display: "flex", alignItems: "center", gap: "5px", boxShadow: "0 4px 12px rgba(76,175,80,0.35)" }}>
                          <CreditCard size={12} /> Pay Now
                        </button>
                      )}

                      {o.orderStatus === "Pending" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCancelClick(o.id); }}
                          style={{ height: "36px", padding: "0 14px", borderRadius: "10px", border: "1.5px solid #FECACA", background: "#FFF5F5", color: "#B91C1C", fontSize: "12px", fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
                          Cancel
                        </button>
                      )}

                      {/* ── Ready for Pickup CTA ── */}
                      {isReadyPickup && (
                        <motion.button
                          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                          onClick={(e) => { e.stopPropagation(); setPickupOrder(o); }}
                          style={{
                            height: "36px", padding: "0 16px", borderRadius: "10px",
                            border: "none",
                            background: "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
                            color: "#fff", fontSize: "12px", fontWeight: 800,
                            cursor: "pointer", fontFamily: FONT,
                            display: "flex", alignItems: "center", gap: "6px",
                            boxShadow: "0 4px 14px rgba(245,158,11,0.38)",
                          }}
                        >
                          🏪 Pickup Details
                        </motion.button>
                      )}

                      <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "#F4F7F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <ChevronRight size={15} color="#6E8A72" />
                      </div>
                    </div>
                  </div>

                  {/* ── Ready for Pickup inline banner (within card) ── */}
                  {isReadyPickup && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                      transition={{ delay: 0.1 }}
                      style={{
                        marginTop: "14px",
                        background: "linear-gradient(135deg, #FEF3C7 0%, #FFF8E1 100%)",
                        border: "1.5px solid #FDE68A",
                        borderRadius: "14px",
                        padding: "12px 16px",
                        display: "flex", alignItems: "center", gap: "12px",
                      }}
                    >
                      <span style={{ fontSize: "22px" }}>🏪</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: "13px", color: "#92400E", marginBottom: "2px" }}>Your order is ready at the farm!</div>
                        <div style={{ fontSize: "11px", color: "#B45309" }}>Tap "Pickup Details" to call staff or get directions.</div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ textAlign: "center", padding: "60px 20px", background: "#fff", borderRadius: "22px" }}>
              <div style={{ fontSize: "42px", marginBottom: "12px" }}>📭</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: "16px", color: "#102114" }}>No orders found</div>
              <div style={{ fontSize: "13px", color: "#9AA89B", marginTop: "6px" }}>Try adjusting your search or filter.</div>
            </motion.div>
          )}
        </div>

      </motion.div>

      {/* ── Order detail modal ── */}
      <AnimatePresence>
        {selectedOrder && (() => {
          const o          = selectedOrder;
          const ss         = getStatusConfig(o);
          const steps      = getSteps(o);
          const stepIdx    = ss.step;
          const isPaid     = o.payment === "Paid";
          const showPayNow = o.orderStatus === "Approved" && !isPaid;
          const isReadyPickup = o.delivery === "Pickup" && o.status === "Ready for Pickup";

          return (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedOrder(null)}
                style={{ position: "fixed", inset: 0, background: "rgba(10,20,12,0.5)", zIndex: 100, backdropFilter: "blur(6px)" }} />

              <motion.div style={{ position: "fixed", inset: 0, zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", pointerEvents: "none" }}>
                <motion.div initial={{ opacity: 0, y: 40, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
                  style={{ width: "580px", maxWidth: "100%", maxHeight: "85vh", overflowY: "auto", background: "#fff", borderRadius: "28px", boxShadow: "0 40px 100px rgba(10,20,12,0.25)", pointerEvents: "auto", fontFamily: FONT }}>

                  <div style={{ height: "6px", background: STATUS_GRADIENT[o.status] || "#4CAF50", borderRadius: "28px 28px 0 0" }} />

                  <div style={{ padding: "26px 28px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "22px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "52px", height: "52px", borderRadius: "16px", background: ss.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                          {ss.icon}
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "22px", fontWeight: 800, color: "#102114" }}>{o.id}</div>
                          <div style={{ fontSize: "12px", color: "#9AA89B", marginTop: "3px" }}>{o.date} · {o.batch}</div>
                        </div>
                      </div>
                      <button onClick={() => setSelectedOrder(null)}
                        style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1.5px solid #E5EDE0", background: "#F9FCF6", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <X size={16} color="#4B5E4F" />
                      </button>
                    </div>

                    {/* Ready for Pickup highlight inside modal */}
                    {isReadyPickup && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                          background: "linear-gradient(135deg, #FEF3C7, #FFFBEB)",
                          border: "1.5px solid #FDE68A",
                          borderRadius: "16px",
                          padding: "16px 20px",
                          marginBottom: "20px",
                          display: "flex", alignItems: "center", gap: "14px",
                        }}
                      >
                        <span style={{ fontSize: "30px" }}>🏪</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: "14px", color: "#92400E", marginBottom: "3px" }}>Ready for Pickup!</div>
                          <div style={{ fontSize: "12px", color: "#B45309" }}>Please notify farm staff upon arrival.</div>
                        </div>
                        <button
                          onClick={() => { setSelectedOrder(null); setPickupOrder(o); }}
                          style={{
                            height: "36px", padding: "0 14px", borderRadius: "10px",
                            border: "none",
                            background: "linear-gradient(135deg, #F59E0B, #FBBF24)",
                            color: "#fff", fontSize: "12px", fontWeight: 800,
                            cursor: "pointer", fontFamily: FONT,
                            display: "flex", alignItems: "center", gap: "6px",
                            boxShadow: "0 4px 12px rgba(245,158,11,0.35)",
                          }}
                        >
                          <Phone size={13} /> Call Staff
                        </button>
                      </motion.div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "22px" }}>
                      {[
                        ["🐔 Quantity", `${o.quantity} chickens`],
                        ["⚖️ Weight",   `${o.weight.toFixed(1)} kg`],
                        ["💰 Price/kg", `RM ${o.priceKg.toFixed(2)}`],
                      ].map(([label, value]) => (
                        <div key={label} style={{ background: "#F9FCF6", borderRadius: "14px", padding: "14px", textAlign: "center" }}>
                          <div style={{ fontSize: "11px", color: "#9AA89B", marginBottom: "4px" }}>{label}</div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "16px", color: "#102114" }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: "#102114", borderRadius: "16px", padding: "18px 20px", marginBottom: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ color: "#6E8A72", fontSize: "13px" }}>Chicken Amount</span>
                        <b style={{ color: "#fff" }}>RM {(o.total - o.deliveryFee).toFixed(2)}</b>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                        <span style={{ color: "#6E8A72", fontSize: "13px" }}>Delivery Fee</span>
                        <b style={{ color: "#fff" }}>RM {o.deliveryFee.toFixed(2)}</b>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: "#86A882" }}>Order Total</div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "26px", color: "#fff" }}>
                            RM {o.total.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                        <span style={{ padding: "6px 14px", borderRadius: "999px", background: isPaid ? "#4CAF5033" : "#F59E0B33", color: isPaid ? "#86EFAC" : "#FCD34D", fontSize: "12px", fontWeight: 700 }}>
                          {isPaid ? "✅ Payment Confirmed" : "⏳ Payment Pending"}
                        </span>
                      </div>
                    </div>

                    {showPayNow && (
                      <button onClick={() => alert(`Redirect to payment for ${o.id}`)}
                        style={{ width: "100%", height: "46px", borderRadius: "13px", border: "none", background: "linear-gradient(135deg,#4CAF50,#2E7D32)", color: "#fff", fontWeight: 800, fontSize: "14px", cursor: "pointer", marginBottom: "20px", fontFamily: FONT, boxShadow: "0 6px 16px rgba(76,175,80,0.35)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <CreditCard size={16} /> Pay Now
                      </button>
                    )}

                    <div style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 800, color: "#102114", marginBottom: "12px" }}>🚚 Delivery Information</div>
                    <div style={{ background: "#F9FCF6", borderRadius: "16px", padding: "16px 18px", marginBottom: "22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {[
                        ["Type",            o.delivery],
                        ["Driver",          o.driver],
                        ["Vehicle",         o.vehicle],
                        ["Delivery Date",   o.time],
                        ["Address",         o.address],
                        ["Delivery Status", o.deliveryStatus],
                      ].map(([label, value]) => (
                        <div key={label} style={{ fontSize: "12px" }}>
                          <div style={{ color: "#9AA89B", marginBottom: "2px" }}>{label}</div>
                          <div style={{ fontWeight: 700, color: "#102114" }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ fontFamily: FONT, fontSize: "14px", fontWeight: 800, color: "#102114", marginBottom: "14px" }}>📍 Order Progress</div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                      {steps.map((step, idx) => {
                        const done    = stepIdx > idx;
                        const current = stepIdx === idx;
                        const showHalfLine = isHalfPaidLine(o, idx, steps);
                        
                        return (
                          <div key={step} style={{ display: "flex", alignItems: "center", flex: idx < steps.length - 1 ? 1 : "none" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                              <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: done ? "#4CAF50" : current ? ss.bg : "#F0F4EC", border: `2.5px solid ${done ? "#4CAF50" : current ? ss.border : "#E5EDE0"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: done ? "#fff" : current ? ss.color : "#C4CDC0" }}>
                                {done ? "✓" : idx + 1}
                              </div>
                              <span style={{ fontSize: "10px", color: done || current ? "#4B5E4F" : "#C4CDC0", fontWeight: current ? 700 : 400, whiteSpace: "nowrap" }}>{step}</span>
                            </div>
                            {idx < steps.length - 1 && (
                              <div style={{ 
                                flex: 1, 
                                height: "3px", 
                                background: done ? "#4CAF50" : 
                                           showHalfLine ? "linear-gradient(90deg, #4CAF50 50%, #E5EDE0 50%)" : 
                                           "#E5EDE0", 
                                margin: "0 4px", 
                                marginBottom: "18px", 
                                borderRadius: "99px" 
                              }} />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {o.orderStatus === "Pending" && (
                      <button onClick={() => handleCancelClick(o.id)}
                        style={{ width: "100%", height: "44px", borderRadius: "12px", border: "none", background: "#EF4444", color: "#fff", fontWeight: 800, cursor: "pointer", marginTop: "18px", fontFamily: FONT }}>
                        Cancel Order
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* ── Ready for Pickup Full Screen Modal ── */}
      <AnimatePresence>
        {pickupOrder && (
          <PickupReadyScreen  order={pickupOrder} onClose={() => setPickupOrder(null)} onInformStaff={handleInformStaff} />
        )}
      </AnimatePresence>

      {/* ── Cancel confirmation popup ── */}
      {cancelPopup && (
        <div style={popupBackdrop}>
          <div style={popupBox}>
            <div style={popupIcon}>⚠️</div>
            <div style={popupTitle}>Cancel Order?</div>
            <div style={popupText}>This action cannot be undone. The reserved chicken stock will be returned back to inventory.</div>
            <div style={popupActions}>
              <button style={popupKeepBtn} onClick={() => { setCancelPopup(false); setSelectedCancelId(null); }}>Keep Order</button>
              <button style={popupConfirmBtn} onClick={confirmCancelOrder}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Popup styles ─────────────────────────────────────────────────────────────

const popupBackdrop   = { position: "fixed", inset: 0, background: "rgba(16,33,20,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 };
const popupBox        = { width: "420px", background: "#fff", borderRadius: "24px", padding: "28px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.18)", fontFamily: FONT };
const popupIcon       = { width: "58px", height: "58px", borderRadius: "50%", background: "#FEF3C7", fontSize: "28px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" };
const popupTitle      = { fontSize: "22px", fontWeight: 800, color: "#102114", marginBottom: "8px" };
const popupText       = { fontSize: "13px", color: "#6E8A72", lineHeight: 1.6, marginBottom: "22px" };
const popupActions    = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" };
const popupKeepBtn    = { height: "44px", borderRadius: "12px", border: "1px solid #DDE8D7", background: "#F9FCF6", color: "#244128", fontWeight: 800, cursor: "pointer", fontFamily: FONT };
const popupConfirmBtn = { height: "44px", borderRadius: "12px", border: "none", background: "#EF4444", color: "#fff", fontWeight: 800, cursor: "pointer", fontFamily: FONT };