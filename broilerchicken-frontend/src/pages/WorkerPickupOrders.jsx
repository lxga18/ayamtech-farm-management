import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  ShoppingBag,
  CheckCircle2,
  Phone,
  Package,
  User,
  Calendar,
  RefreshCw,
  X,
  Clock,
  Truck,
  Scale,
  DollarSign,
  ClipboardCheck,
  Hash,
} from "lucide-react";

/* ─── Design Tokens ─────────────────────────────────────────────── */
const C = {
  bg:        "#F6F8F3",
  surface:   "#FFFFFF",
  border:    "#E5EDE0",
  green:     "#4CAF50",
  greenDark: "#2E7D32",
  greenDim:  "#EAF7E3",
  amber:     "#F59E0B",
  amberDim:  "#FFF8EC",
  red:       "#EF4444",
  redDim:    "#FEE2E2",
  blue:      "#3B82F6",
  blueDim:   "#EFF6FF",
  text:      "#102114",
  textMid:   "#6E8A72",
  textLight: "#9AA89B",
  sans:      "'Plus Jakarta Sans', sans-serif",
  body:      "'Inter', sans-serif",
};

const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

const statusCfg = {
  "Approved":           { bg: C.amberDim, color: C.amber,     dot: C.amber,     label: "Approved"           },
  "Ready for Pickup":   { bg: C.blueDim,  color: C.blue,      dot: C.blue,      label: "Ready for Pickup"   },
  "Customer Arrived":   { bg: C.greenDim, color: C.greenDark, dot: C.green,     label: "Customer Arrived"   },
  "Completed":          { bg: C.greenDim, color: C.greenDark, dot: C.green,     label: "Completed"          },
};

const rm = (v) =>
  v != null
    ? `RM ${Number(v).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "—";

const fmtDate = (v) =>
  v ? new Date(v).toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "—";

const fmtDateTime = (v) =>
  v
    ? new Date(v).toLocaleString("en-MY", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";

/* ─── Status Badge ──────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const cfg = statusCfg[status] || { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF", label: status };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      background: cfg.bg, color: cfg.color,
      padding: "5px 13px", borderRadius: 99,
      fontFamily: C.sans, fontWeight: 900, fontSize: 12,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

/* ─── Info Tile (one of the 4 columns inside a card) ────────────── */
function InfoTile({ icon: Icon, iconColor, iconBg, title, lines }) {
  return (
    <div style={{
      background: C.bg,
      border: `1.5px solid ${C.border}`,
      borderRadius: 14,
      padding: "14px 16px",
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={14} color={iconColor} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 900, color: C.textMid, textTransform: "uppercase", letterSpacing: "0.07em" }}>
          {title}
        </span>
      </div>
      {lines.map((line, i) => (
        <div key={i} style={{
          fontFamily: i === 0 ? C.sans : C.body,
          fontWeight: i === 0 ? 900 : 700,
          fontSize: i === 0 ? 14 : 12,
          color: i === 0 ? C.text : C.textMid,
          marginTop: i === 0 ? 0 : 3,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}>
          {line}
        </div>
      ))}
    </div>
  );
}

/* ─── Modal: Mark as Ready for Pickup ──────────────────────────── */
function MarkReadyModal({ order, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(10,22,12,0.48)", backdropFilter: "blur(6px)", zIndex: 1000 }}
          />
          <motion.div key="md"
            initial={{ opacity: 0, scale: 0.9, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 32 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            style={{
              position: "fixed", inset: 0, margin: "auto",
              width: "min(480px, 92vw)", height: "fit-content",
              zIndex: 1001, borderRadius: 28, overflow: "hidden",
              background: C.surface, boxShadow: "0 32px 80px rgba(10,22,12,0.30)",
              fontFamily: C.body,
            }}
          >
            {/* Header */}
            <div style={{
              background: "linear-gradient(145deg, #102114 0%, #244128 60%, #1C5C26 100%)",
              padding: "30px 28px 26px", position: "relative", textAlign: "center",
            }}>
              <motion.button whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                style={{ position: "absolute", top: 16, right: 16, border: "none", background: "rgba(255,255,255,0.13)", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="rgba(255,255,255,0.8)" />
              </motion.button>
              <div style={{ width: 58, height: 58, borderRadius: "50%", background: "rgba(76,175,80,0.2)", border: "2px solid rgba(76,175,80,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <ShoppingBag size={26} color={C.green} />
              </div>
              <div style={{ fontFamily: C.sans, fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Action Required</div>
              <div style={{ fontFamily: C.sans, fontSize: 19, fontWeight: 900, color: "#fff" }}>Mark Order Ready for Pickup</div>
            </div>

            {/* Body */}
            <div style={{ padding: "22px 26px 26px" }}>
              <div style={{ background: C.bg, borderRadius: 14, border: `1.5px solid ${C.border}`, padding: "14px 16px", marginBottom: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: Hash,          label: "Order",    value: order.order_id },
                  { icon: User,          label: "Customer", value: order.customer_name },
                  { icon: Package,       label: "Quantity", value: `${order.requested_quantity} chickens` },
                  { icon: Scale,         label: "Est. Weight", value: order.estimated_weight_kg ? `${Number(order.estimated_weight_kg).toLocaleString()} kg` : "—" },
                  { icon: DollarSign,    label: "Est. Amount", value: rm(order.estimated_amount) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.textMid, fontWeight: 700 }}>
                      <Icon size={13} color={C.textLight} /> {label}
                    </span>
                    <span style={{ fontFamily: C.sans, fontSize: 13, fontWeight: 900, color: C.text }}>{value}</span>
                  </div>
                ))}
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => onConfirm(order.order_id)}
                style={{ width: "100%", padding: "13px 20px", marginBottom: 10, background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})`, color: "#fff", border: "none", borderRadius: 13, cursor: "pointer", fontFamily: C.sans, fontWeight: 900, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 8px 22px ${C.green}40` }}>
                <CheckCircle2 size={16} /> Confirm Order is Ready for Pickup
              </motion.button>

              {order.customer_phone && (
                <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  href={`tel:${order.customer_phone}`}
                  style={{ width: "100%", padding: "12px 20px", background: C.surface, color: C.text, border: `1.5px solid ${C.border}`, borderRadius: 13, cursor: "pointer", fontFamily: C.sans, fontWeight: 900, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none" }}>
                  <Phone size={15} color={C.textMid} /> Call Customer
                </motion.a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Modal: Confirm Collection ─────────────────────────────────── */
function ConfirmCollectionModal({ order, onClose, onConfirm }) {
  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(10,22,12,0.48)", backdropFilter: "blur(6px)", zIndex: 1000 }}
          />
          <motion.div key="md"
            initial={{ opacity: 0, scale: 0.9, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 32 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            style={{
              position: "fixed", inset: 0, margin: "auto",
              width: "min(480px, 92vw)", height: "fit-content",
              zIndex: 1001, borderRadius: 28, overflow: "hidden",
              background: C.surface, boxShadow: "0 32px 80px rgba(10,22,12,0.30)",
              fontFamily: C.body,
            }}
          >
            {/* Header */}
            <div style={{
              background: "linear-gradient(145deg, #1a3a20 0%, #2E7D32 100%)",
              padding: "30px 28px 26px", position: "relative", textAlign: "center",
            }}>
              <motion.button whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose}
                style={{ position: "absolute", top: 16, right: 16, border: "none", background: "rgba(255,255,255,0.13)", borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color="rgba(255,255,255,0.8)" />
              </motion.button>
              <div style={{ width: 58, height: 58, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                <CheckCircle2 size={26} color="#fff" />
              </div>
              <div style={{ fontFamily: C.sans, fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Customer Arrived</div>
              <div style={{ fontFamily: C.sans, fontSize: 19, fontWeight: 900, color: "#fff" }}>Confirm Pickup Collection</div>
            </div>

            {/* Body */}
            <div style={{ padding: "22px 26px 26px" }}>
              <div style={{ background: C.greenDim, borderRadius: 14, border: `1.5px solid ${C.green}30`, padding: "14px 16px", marginBottom: 18, display: "flex", flexDirection: "column", gap: 11 }}>
                {[
                  { icon: User,       label: "Customer",    value: order.customer_name },
                  { icon: Hash,       label: "Order",       value: order.order_id },
                  { icon: Package,    label: "Quantity",    value: `${order.requested_quantity} chickens` },
                  { icon: Scale,      label: "Est. Weight", value: order.estimated_weight_kg ? `${Number(order.estimated_weight_kg).toLocaleString()} kg` : "—" },
                  { icon: DollarSign, label: "Est. Amount", value: rm(order.estimated_amount) },
                  { icon: Clock,      label: "Ready Since", value: order.ready_at ? fmtDateTime(order.ready_at) : "—" },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: C.textMid, fontWeight: 700 }}>
                      <Icon size={13} color={C.greenDark} /> {label}
                    </span>
                    <span style={{ fontFamily: C.sans, fontSize: 13, fontWeight: 900, color: C.text, maxWidth: "55%", textAlign: "right" }}>{value}</span>
                  </div>
                ))}
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => onConfirm(order.order_id)}
                style={{ width: "100%", padding: "13px 20px", background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})`, color: "#fff", border: "none", borderRadius: 13, cursor: "pointer", fontFamily: C.sans, fontWeight: 900, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 8px 22px ${C.green}40` }}>
                <CheckCircle2 size={16} /> Confirm Collection
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Order Card (full-width, 4-column info grid) ───────────────── */
function OrderCard({ order, index, onMarkReady, onConfirmCollection }) {
  const isApproved        = order.order_status === "Approved";
  const isReady           = order.order_status === "Ready for Pickup";
  const isCustomerArrived = order.order_status === "Customer Arrived";

  const accentColor = isReady || isCustomerArrived ? C.blue : C.amber;
  const accentBg    = isReady || isCustomerArrived ? C.blueDim : C.amberDim;

  return (
    <motion.div
      {...fadeUp(index * 0.06 + 0.08)}
      whileHover={{ y: -2, boxShadow: "0 14px 44px rgba(16,33,20,0.10)" }}
      style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "0 4px 18px rgba(16,33,20,0.06)",
        marginBottom: 16,
      }}
    >
      {/* Colour stripe */}
      <div style={{ height: 4, background: isReady || isCustomerArrived ? `linear-gradient(90deg,${C.blue},#60A5FA)` : `linear-gradient(90deg,${C.amber},#FCD34D)` }} />

      <div style={{ padding: "20px 24px" }}>

        {/* ── Row 1: Order ID + Status ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: accentBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingBag size={18} color={accentColor} />
            </div>
            <div>
              <div style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 16, color: C.text }}>{order.order_id}</div>
              <div style={{ fontSize: 11, color: C.textLight, fontWeight: 700, marginTop: 1 }}>Pickup Order</div>
            </div>
          </div>
          <StatusBadge status={order.order_status} />
        </div>

        {/* ── Divider ── */}
        <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

        {/* ── 4-Column Info Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          <InfoTile
            icon={User} iconColor={C.green} iconBg={C.greenDim}
            title="Customer"
            lines={[order.customer_name || "—", order.customer_phone || "—"]}
          />
          <InfoTile
            icon={ClipboardCheck} iconColor={C.blue} iconBg={C.blueDim}
            title="Order Details"
            lines={[
              `Batch: ${order.batch_id || "—"}`,
              `Qty: ${order.requested_quantity} chickens`,
            ]}
          />
          <InfoTile
            icon={Scale} iconColor={C.amber} iconBg={C.amberDim}
            title="Weight Info"
            lines={[
              order.estimated_weight_kg ? `Est. ${Number(order.estimated_weight_kg).toLocaleString()} kg` : "Est. —",
              order.avg_weight_kg ? `Avg: ${Number(order.avg_weight_kg).toFixed(1)} kg/bird` : "Avg: —",
            ]}
          />
          <InfoTile
            icon={DollarSign} iconColor="#059669" iconBg="#D1FAE5"
            title="Amount"
            lines={[
              "Est. Amount:",
              rm(order.estimated_amount),
            ]}
          />
        </div>

        {/* ── Requested Date ── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          fontSize: 12, color: C.textMid, fontWeight: 700, marginBottom: 10,
        }}>
          <Calendar size={13} color={C.textLight} />
          Requested Date: <span style={{ color: C.text, fontWeight: 800 }}>{fmtDate(order.requested_delivery_date)}</span>
        </div>

        {/* ── Ready since (only for Ready for Pickup / Customer Arrived) ── */}
        {(isReady || isCustomerArrived) && order.ready_at && (
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            fontSize: 12, color: C.blue, fontWeight: 700, marginBottom: 10,
          }}>
            <Clock size={13} color={C.blue} />
            Ready since: <span style={{ fontWeight: 800 }}>{fmtDateTime(order.ready_at)}</span>
          </div>
        )}

        {/* ── Status description bar ── */}
        <div style={{
          background: accentBg, borderRadius: 10,
          padding: "9px 13px", fontSize: 12, fontWeight: 700,
          color: isReady || isCustomerArrived ? C.blue : "#92400E",
          display: "flex", alignItems: "center", gap: 7, marginBottom: 16,
        }}>
          {isReady || isCustomerArrived
            ? <><Truck size={13} /> Order is ready — awaiting customer pickup</>
            : <><Clock size={13} /> Approved — awaiting preparation</>}
        </div>

        {/* ── Action buttons ── */}
        <div style={{ display: "flex", gap: 10 }}>
          {isApproved && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
              onClick={() => onMarkReady(order)}
              style={{ flex: 1, padding: "12px 18px", background: `linear-gradient(135deg,${C.green},${C.greenDark})`, color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: C.sans, fontWeight: 900, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: `0 6px 18px ${C.green}35` }}>
              <CheckCircle2 size={15} /> Mark as Ready for Pickup
            </motion.button>
          )}

          {(isReady || isCustomerArrived) && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.96 }}
              onClick={() => onConfirmCollection(order)}
              style={{ flex: 1, padding: "12px 18px", background: "linear-gradient(135deg,#102114,#244128)", color: "#fff", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: C.sans, fontWeight: 900, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, boxShadow: "0 6px 18px rgba(16,33,20,0.25)" }}>
              <CheckCircle2 size={15} /> Confirm Collection
            </motion.button>
          )}

          {order.customer_phone && (
            <motion.a whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
              href={`tel:${order.customer_phone}`}
              title="Call Customer"
              style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: C.bg, border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
              <Phone size={16} color={C.textMid} />
            </motion.a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function WorkerPickupOrders() {
  const [orders, setOrders]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [readyModal, setReadyModal]     = useState(null);
  const [collectModal, setCollectModal] = useState(null);

  const loadOrders = async () => {
    try {
      const res = await API.get("/worker/pickup-orders");
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, []);

  const handleMarkReady = async (orderId) => {
    try {
      await API.patch(`/worker/pickup-orders/${orderId}/ready`);
      setReadyModal(null);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update order");
    }
  };

  const handleConfirmCollection = async (orderId) => {
    try {
      await API.patch(`/worker/pickup-orders/${orderId}/collected`);
      setCollectModal(null);
      loadOrders();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to confirm collection");
    }
  };

  const pendingOrders = orders.filter(o => o.order_status === "Approved");
  const readyOrders   = orders.filter(o => o.order_status === "Ready for Pickup" || o.order_status === "Customer Arrived");
  const doneOrders    = orders.filter(o => o.order_status === "Completed");

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, fontFamily: C.body }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: 46, height: 46, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.green }} />
        <p style={{ color: C.textMid, fontWeight: 600 }}>Loading pickup orders…</p>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: C.body, color: C.text, paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
      `}</style>

      {/* ── Modals ── */}
      <MarkReadyModal       order={readyModal}   onClose={() => setReadyModal(null)}   onConfirm={handleMarkReady} />
      <ConfirmCollectionModal order={collectModal} onClose={() => setCollectModal(null)} onConfirm={handleConfirmCollection} />

      {/* ── Sticky Header ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 200, background: "rgba(246,248,243,.93)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ height: 78, padding: "0 28px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(135deg,${C.green},${C.greenDark})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 24px ${C.green}35` }}>
            <ShoppingBag size={24} color="#fff" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: C.sans, fontSize: 23, fontWeight: 900, color: C.text }}>Pickup Orders</h1>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: C.textMid, fontWeight: 700 }}>Manage customer pickup preparations and collections</p>
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={loadOrders}
            style={{ marginLeft: "auto", border: `1.5px solid ${C.border}`, background: C.surface, borderRadius: 13, padding: "11px 16px", display: "flex", alignItems: "center", gap: 8, fontFamily: C.sans, fontWeight: 900, fontSize: 12, color: C.text, cursor: "pointer" }}>
            <RefreshCw size={14} /> Refresh
          </motion.button>
        </div>
      </div>

      <main style={{ padding: "26px 28px 0" }}>

        {/* ── Summary chips ── */}
        <motion.div {...fadeUp(0)} style={{ display: "flex", gap: 12, marginBottom: 26, flexWrap: "wrap" }}>
          {[
            { label: "To Prepare", count: pendingOrders.length, color: C.amber,     bg: C.amberDim },
            { label: "Ready",      count: readyOrders.length,   color: C.blue,      bg: C.blueDim  },
            { label: "Collected",  count: doneOrders.length,    color: C.greenDark, bg: C.greenDim },
          ].map(({ label, count, color, bg }) => (
            <div key={label} style={{ background: bg, border: `1.5px solid ${color}25`, borderRadius: 14, padding: "10px 20px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: C.sans, fontSize: 24, fontWeight: 900, color }}>{count}</span>
              <span style={{ fontFamily: C.sans, fontSize: 12, fontWeight: 900, color, opacity: 0.8 }}>{label}</span>
            </div>
          ))}
        </motion.div>

        {/* ── Section: Ready to Prepare ── */}
        {pendingOrders.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <motion.div {...fadeUp(0.05)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: C.amberDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Package size={18} color={C.amber} />
              </div>
              <h2 style={{ margin: 0, fontFamily: C.sans, fontSize: 17, fontWeight: 900, color: C.text }}>Ready to Prepare</h2>
              <span style={{ background: C.amberDim, color: C.amber, borderRadius: 99, padding: "3px 11px", fontFamily: C.sans, fontWeight: 900, fontSize: 12 }}>
                {pendingOrders.length}
              </span>
            </motion.div>
            {pendingOrders.map((order, i) => (
              <OrderCard key={order.order_id} order={order} index={i} onMarkReady={setReadyModal} onConfirmCollection={setCollectModal} />
            ))}
          </div>
        )}

        {/* ── Section: Ready for Pickup ── */}
        {readyOrders.length > 0 && (
          <div style={{ marginBottom: 32 }}>
            <motion.div {...fadeUp(0.05)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 12, background: C.blueDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Truck size={18} color={C.blue} />
              </div>
              <h2 style={{ margin: 0, fontFamily: C.sans, fontSize: 17, fontWeight: 900, color: C.text }}>Ready for Pickup</h2>
              <span style={{ background: C.blueDim, color: C.blue, borderRadius: 99, padding: "3px 11px", fontFamily: C.sans, fontWeight: 900, fontSize: 12 }}>
                {readyOrders.length}
              </span>
            </motion.div>
            {readyOrders.map((order, i) => (
              <OrderCard key={order.order_id} order={order} index={i} onMarkReady={setReadyModal} onConfirmCollection={setCollectModal} />
            ))}
          </div>
        )}

        {/* ── Empty state ── */}
        {orders.length === 0 && (
          <motion.div {...fadeUp(0.1)} style={{ background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 22, padding: "60px 32px", textAlign: "center", boxShadow: "0 8px 28px rgba(16,33,20,0.06)" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.greenDim, margin: "0 auto 18px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingBag size={32} color={C.greenDark} />
            </div>
            <div style={{ fontFamily: C.sans, fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 8 }}>No Pickup Orders</div>
            <div style={{ fontSize: 13, color: C.textMid, fontWeight: 700 }}>There are no pickup orders to action right now.</div>
          </motion.div>
        )}

        <div style={{ marginTop: 28, color: C.textLight, fontSize: 11, fontWeight: 700 }}>
          AyamTech Worker Hub · Keep orders moving — stay on top of pickups!
        </div>
      </main>
    </div>
  );
}
