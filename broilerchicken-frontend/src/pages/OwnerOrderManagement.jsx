import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Search, Filter, X, Eye, CheckCircle, Clock, PackageCheck,
  XCircle, Truck, ShoppingBag, DollarSign, ClipboardList,
  CreditCard, MapPin, Phone, User, Hash, Calendar, Box,
  ChevronRight, ChevronLeft, AlertCircle, Bell, RefreshCw
} from "lucide-react";

/* ─── Tokens ─────────────────────────────────────────────────────── */
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
  red:     "#B91C1C",
  redBg:   "#FEE2E2",
  green:   "#EAF7E3",
  gray:    "#6B7280",
  grayBg:  "#F3F4F6",
};

const statusConfig = {
  Pending:   { bg: C.amberBg, color: C.amber,  icon: Clock,        dot: "#F59E0B" },
  Approved:  { bg: C.blueBg,  color: C.blue,   icon: CheckCircle,  dot: "#3B82F6" },
  Completed: { bg: C.green,   color: C.fern,   icon: PackageCheck, dot: "#22C55E" },
  Cancelled: { bg: C.redBg,   color: C.red,    icon: XCircle,      dot: "#EF4444" },
};
const paymentConfig = {
  Paid:    { bg: C.green,   color: C.fern  },
  Pending: { bg: C.amberBg, color: C.amber },
  Failed:  { bg: C.redBg,   color: C.red   },
};

const money = (v) =>
  `RM ${Number(v || 0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-CA") : "—");
const isRecurringOrder = (order) => {
  return (
    order?.is_recurring === true ||
    order?.is_recurring === "true" ||
    order?.is_recurring === "t" ||
    order?.is_recurring === 1 ||
    order?.is_recurring === "1"
  );
};

const canChangeOrderBatch = (order) => {
  return (
    isRecurringOrder(order) &&
    ["Pending", "Scheduled"].includes(order?.order_status)
  );
};

const canApproveOrder = (order) => {
  return ["Pending", "Scheduled"].includes(order?.order_status);
};

/* ─── Stat Card ─────────────────────────────────────────────────── */
const statMeta = [
  { icon: Clock,         iconBg: C.amberBg, iconColor: C.amber, accent: "#F59E0B" },
  { icon: ClipboardList, iconBg: "#EEF2FF", iconColor: C.blue,  accent: C.blue   },
  { icon: Truck,         iconBg: "#EEF2FF", iconColor: C.blue,  accent: C.blue   },
  { icon: ShoppingBag,   iconBg: C.green,   iconColor: C.fern,  accent: C.fern   },
  { icon: CreditCard,    iconBg: C.green,   iconColor: C.fern,  accent: C.fern   },
];

function StatCard({ title, value, sub, index }) {
  const { icon: Icon, iconBg, iconColor, accent } = statMeta[index % statMeta.length];
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 280, damping: 24 }}
      whileHover={{ y: -2, boxShadow: "0 12px 32px rgba(16,33,20,0.10)" }}
      style={{
        background: C.white,
        borderRadius: 16,
        padding: "16px 18px",
        boxShadow: "0 1px 8px rgba(16,33,20,0.05)",
        border: `1.5px solid ${C.mist}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle left accent bar */}
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0,
        width: 3, background: accent, borderRadius: "3px 0 0 3px",
      }} />
      <div style={{
        width: 42, height: 42, borderRadius: 12, background: iconBg,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Icon size={19} color={iconColor} strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontSize: 10, color: C.sage, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{title}</div>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 24, fontWeight: 900, color: C.forest, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 11, color: "#9AA89B", marginTop: 1 }}>{sub}</div>
      </div>
    </motion.div>
  );
}

/* ─── Change Batch Modal ─────────────────────────────────────────── */
function ChangeBatchModal({ order, batches, selectedBatchId, setSelectedBatchId, onConfirm, onCancel, loading }) {
  if (!order) return null;
  const availableBatches = batches.filter((b) => b.batch_id !== order.batch_id);
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(10,28,16,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2100, backdropFilter: "blur(6px)", padding: 24 }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        style={{ width: "100%", maxWidth: 520, background: C.white, borderRadius: 24, padding: 28, border: `1.5px solid ${C.mist}`, boxShadow: "0 32px 90px rgba(0,0,0,0.28)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: C.blueBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Box size={20} color={C.blue} />
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 900, color: C.forest }}>
              Change Batch
            </div>
            <div style={{ fontSize: 12, color: C.sage, fontWeight: 600 }}>{order.order_id}</div>
          </div>
        </div>

        <div style={{ background: C.foam, borderRadius: 12, padding: "10px 14px", marginBottom: 18, border: `1px solid ${C.mist}`, fontSize: 13, color: C.sage }}>
          Current batch: <strong style={{ color: C.forest }}>{order.batch_id}</strong> &nbsp;·&nbsp; Required: <strong style={{ color: C.forest }}>{order.requested_quantity} chickens</strong>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={lbl}>Select New Batch</label>
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
            style={{ width: "100%", height: 46, border: `1.5px solid ${C.mist}`, borderRadius: 12, padding: "0 14px", background: C.foam, color: C.forest, fontWeight: 700, outline: "none", fontSize: 13 }}
          >
            <option value="">Choose available batch</option>
            {availableBatches.map((b) => (
              <option key={b.batch_id} value={b.batch_id}>
                {b.batch_id} · {b.available_stock} chickens · RM {Number(b.price_per_kg || 0).toFixed(2)}/kg
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" onClick={onCancel} style={{ ...smallBtn, height: 42, padding: "0 18px" }}>Cancel</button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || !selectedBatchId}
            style={{ ...smallBtn, height: 42, padding: "0 18px", background: C.fern, color: C.white, border: "none", opacity: loading || !selectedBatchId ? 0.6 : 1, cursor: loading || !selectedBatchId ? "not-allowed" : "pointer" }}
          >
            <Box size={15} />
            {loading ? "Changing..." : "Confirm Change"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Approve Confirmation Modal ─────────────────────────────────── */
function ApproveModal({ order, onConfirm, onCancel, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(10,28,16,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ scale: .88, opacity: 0, y: 28 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: .88, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        style={{ width: "100%", maxWidth: 420, background: C.white, borderRadius: 24, padding: "28px 24px", boxShadow: "0 32px 80px rgba(0,0,0,0.22)", border: `1.5px solid ${C.mist}`, textAlign: "center" }}
      >
        <div style={{ width: 60, height: 60, borderRadius: 18, background: C.green, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircle size={28} color={C.fern} strokeWidth={2} />
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 20, fontWeight: 900, color: C.forest, marginBottom: 6 }}>Approve this Order?</div>
        <div style={{ color: C.sage, fontSize: 13, marginBottom: 4 }}>You're about to approve order</div>
        <div style={{ fontWeight: 800, color: C.pine, fontSize: 15, marginBottom: 16 }}>{order?.order_id}</div>
        <div style={{ background: C.foam, borderRadius: 12, padding: "12px 14px", marginBottom: 20, textAlign: "left", border: `1px solid ${C.mist}` }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: C.sage, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Customer</div>
              <div style={{ fontWeight: 700, color: C.forest, fontSize: 13, marginTop: 2 }}>{order?.customer_name}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: C.sage, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</div>
              <div style={{ fontWeight: 700, color: C.forest, fontSize: 13, marginTop: 2 }}>{money(order?.order_total)}</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: .97 }}
            onClick={onCancel}
            style={{ flex: 1, height: 44, borderRadius: 12, border: `1.5px solid ${C.mist}`, background: C.white, color: C.pine, fontWeight: 800, cursor: "pointer", fontSize: 13 }}>
            Cancel
          </motion.button>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: .97 }}
            onClick={onConfirm} disabled={loading}
            style={{ flex: 1, height: 44, borderRadius: 12, border: "none", background: `linear-gradient(135deg,#4CAF50,${C.fern})`, color: C.white, fontWeight: 800, cursor: "pointer", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, opacity: loading ? .7 : 1 }}>
            {loading ? "Approving…" : <><CheckCircle size={16} /> Confirm</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Order Timeline ─────────────────────────────────────────────── */
function OrderTimeline({ order }) {
  const steps = [
    { title: "Created",   date: order.order_date,                            active: true,                                          icon: ClipboardList, color: C.fern },
    { title: "Approved",  date: order.approved_at,                           active: ["Approved","Completed"].includes(order.order_status), icon: CheckCircle,   color: C.blue },
    { title: "Paid",      date: order.payment_date,                          active: order.payment_status === "Paid",                icon: CreditCard,    color: C.fern },
    { title: "Completed", date: order.completed_at || order.delivery_completed_at, active: order.order_status === "Completed",       icon: PackageCheck,  color: C.fern },
  ];

  return (
    <div style={{ background: C.foam, border: `1px solid ${C.mist}`, borderRadius: 14, padding: "14px 16px", marginBottom: 14 }}>
      <div style={{ fontSize: 10, color: C.sage, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 }}>Order Timeline</div>
      <div style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.title} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
              {index < steps.length - 1 && (
                <div style={{
                  position: "absolute", top: 13, left: "50%", right: "-50%",
                  height: 2, background: step.active ? step.color : "#CBD5E1", zIndex: 0,
                }} />
              )}
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: step.active ? `${step.color}22` : C.grayBg,
                border: `2px solid ${step.active ? step.color : "#CBD5E1"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 1, marginBottom: 6,
              }}>
                <Icon size={12} color={step.active ? step.color : C.gray} />
              </div>
              <div style={{ fontWeight: 800, color: step.active ? C.forest : C.gray, fontSize: 11, textAlign: "center" }}>{step.title}</div>
              <div style={{ fontSize: 10, color: C.sage, marginTop: 2, textAlign: "center" }}>
                {step.date ? formatDate(step.date) : step.active ? "Done" : "Pending"}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Notification Dropdown ─────────────────────────────────────── */
function NotificationDropdown({ orders, onApprove, onView, onCancel, onDismissAll, onRefresh, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: .97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: .97 }}
      transition={{ type: "spring", stiffness: 340, damping: 28 }}
      style={{
        position: "absolute", top: "calc(100% + 10px)", right: 0, zIndex: 500,
        width: 400, background: C.white, borderRadius: 18,
        border: `1.5px solid ${C.mist}`, boxShadow: "0 16px 48px rgba(16,33,20,0.14)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: `1px solid ${C.mist}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={15} color={C.amber} />
          <span style={{ fontWeight: 900, color: C.forest, fontSize: 14 }}>Pending Approvals</span>
          {orders.length > 0 && (
            <span style={{ background: C.redBg, color: C.red, fontSize: 11, fontWeight: 900, padding: "2px 7px", borderRadius: 999 }}>{orders.length}</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button type="button" onClick={onRefresh} style={{ ...smallBtn, height: 28, padding: "0 9px", fontSize: 11 }}>
            <RefreshCw size={11} /> Refresh
          </button>
          {orders.length > 0 && (
            <button type="button" onClick={onDismissAll} style={{ ...smallBtn, height: 28, padding: "0 9px", fontSize: 11 }}>Dismiss all</button>
          )}
          <button type="button" onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, border: `1px solid ${C.mist}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={13} color={C.sage} />
          </button>
        </div>
      </div>

      <div style={{ maxHeight: 340, overflowY: "auto", padding: "10px" }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px 0", color: C.sage, fontWeight: 700, fontSize: 13 }}>
            No pending approvals
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {orders.slice(0, 6).map((order, index) => (
              <motion.div key={order.order_id}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.04 }}
                style={{ background: C.foam, border: `1px solid ${C.mist}`, borderRadius: 12, padding: "10px 12px" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                  <div>
                    <div style={{ fontWeight: 800, color: C.forest, fontSize: 13 }}>{order.order_id}</div>
                    <div style={{ fontSize: 12, color: C.sage, marginTop: 1 }}>{order.customer_name} · {money(order.order_total)}</div>
                    <div style={{ fontSize: 11, color: "#9AA89B", marginTop: 1 }}>{formatDate(order.order_date)} · {order.delivery_type}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => onApprove(order)} style={{ ...smallBtn, height: 28, padding: "0 9px", fontSize: 11, background: C.fern, color: C.white, border: "none" }}>
                    <CheckCircle size={11} /> Approve
                  </button>
                  <button type="button" onClick={() => { onView(order); onClose(); }} style={{ ...smallBtn, height: 28, padding: "0 9px", fontSize: 11 }}>
                    <Eye size={11} /> View
                  </button>
                  <button type="button" onClick={() => onCancel(order)} style={{ ...smallBtn, height: 28, padding: "0 9px", fontSize: 11, color: C.red, background: C.redBg, border: `1px solid ${C.red}30` }}>
                    <XCircle size={11} /> Cancel
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div style={{ background: C.foam, border: `1px solid ${C.mist}`, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: C.forest, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {title}
      </div>
      <div style={{ display: "grid", gap: 8 }}>{children}</div>
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, fontSize: 13, alignItems: "start" }}>
      <span style={{ color: C.sage, fontWeight: 700 }}>{label}</span>
      <span style={{ color: C.forest, fontWeight: 800, wordBreak: "break-word" }}>{value || "—"}</span>
    </div>
  );
}

function OrderDetailsModal({ order, onClose, onApprove, onChangeBatch }) {
  if (!order) return null;
  const canApprove = canApproveOrder(order);
  const showChangeBatch = canChangeOrderBatch(order);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, background: "rgba(10, 28, 16, 0.55)", backdropFilter: "blur(6px)", zIndex: 1900, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 24 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        style={{ width: "100%", maxWidth: 980, maxHeight: "90vh", overflowY: "auto", background: C.white, borderRadius: 22, border: `1.5px solid ${C.mist}`, boxShadow: "0 32px 90px rgba(0,0,0,0.28)" }}
      >
        {/* Modal Header */}
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.mist}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, position: "sticky", top: 0, background: C.white, zIndex: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PackageCheck size={18} color={C.fern} />
            </div>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 900, color: C.forest }}>
                Order Details
              </div>
              <div style={{ fontSize: 12, color: C.sage, fontWeight: 600 }}>{order.order_id}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${C.mist}`, background: C.foam, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color={C.sage} />
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {/* Top Summary Banner */}
          <div style={{ background: `linear-gradient(135deg, ${C.forest}, ${C.pine})`, color: C.white, borderRadius: 16, padding: "16px 20px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{order.order_id}</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>{order.customer_name || "Customer"}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 22, fontWeight: 900 }}>{money(order.order_total)}</div>
              <div style={{ display: "flex", gap: 7, justifyContent: "flex-end", marginTop: 8, flexWrap: "wrap" }}>
                <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.15)", fontSize: 11, fontWeight: 800 }}>{order.order_status}</span>
                <span style={{ padding: "3px 10px", borderRadius: 999, background: "rgba(255,255,255,0.12)", fontSize: 11, fontWeight: 800 }}>{order.payment_status}</span>
              </div>
            </div>
          </div>

          {/* Info Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginBottom: 14 }}>
            <InfoCard title="👤 Customer">
              <InfoLine label="Name" value={order.customer_name} />
              <InfoLine label="Phone" value={order.phone_no} />
              <InfoLine label="Email" value={order.email || order.customer_email} />
            </InfoCard>
            <InfoCard title="💰 Payment">
              <InfoLine label="Amount" value={money(order.order_total)} />
              <InfoLine label="Method" value={order.payment_method} />
              <InfoLine label="Status" value={order.payment_status} />
            </InfoCard>
            <InfoCard title="📦 Order">
              <InfoLine label="Order ID" value={order.order_id} />
              <InfoLine label="Batch" value={order.batch_id} />
              <InfoLine label="Quantity" value={order.requested_quantity} />
              {isRecurringOrder(order) && <InfoLine label="For Month" value={order.recurring_month} />}
              <InfoLine label="Req. Date" value={formatDate(order.requested_delivery_date)} />
              <InfoLine label="Order Date" value={formatDate(order.order_date)} />
            </InfoCard>
            <InfoCard title="🚚 Delivery">
              <InfoLine label="Type" value={order.delivery_type} />
              <InfoLine label="Address" value={order.delivery_address || order.address} />
              <InfoLine label="Date" value={formatDate(order.delivery_date)} />
              <InfoLine label="Status" value={order.delivery_status} />
            </InfoCard>
          </div>

          {/* Timeline */}
          <OrderTimeline order={order} />

          {/* Actions */}
          <div style={{ padding: "12px 14px", borderRadius: 14, border: `1px solid ${C.mist}`, background: C.foam, display: "flex", gap: 9, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {showChangeBatch && (
              <button type="button" onClick={() => onChangeBatch(order)} style={{ ...smallBtn, height: 40, background: C.blueBg, color: C.blue, border: `1px solid ${C.blue}30`, padding: "0 14px" }}>
                <Box size={15} /> Change Batch
              </button>
            )}
            {canApprove && (
              <button type="button" onClick={onApprove} style={{ ...smallBtn, height: 40, background: C.fern, color: C.white, border: "none", padding: "0 14px" }}>
                <CheckCircle size={15} /> Approve Order
              </button>
            )}
            <button type="button" onClick={onClose} style={{ ...smallBtn, height: 40, padding: "0 14px", background: C.redBg, color: C.red, border: `1px solid ${C.red}30` }}>
              <X size={15} /> Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function OwnerOrderManagement() {
  const [orders, setOrders]             = useState([]);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deliveryFilter, setDeliveryFilter] = useState("All");
  const [paymentFilter, setPaymentFilter]   = useState("All");
  const [selectedOrder, setSelectedOrder]   = useState(null);
  const [approveTarget, setApproveTarget]   = useState(null);
  const [approving, setApproving]           = useState(false);
  const [loading, setLoading]               = useState(true);
  const [toast, setToast]                   = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [ignoredNotifications, setIgnoredNotifications] = useState([]);
  const [currentPage, setCurrentPage]       = useState(1);
  const itemsPerPage = 20;
  const [changeBatchTarget, setChangeBatchTarget] = useState(null);
  const [availableBatches, setAvailableBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [changingBatch, setChangingBatch] = useState(false);

 useEffect(() => {
    document.title = "Owner Portal";

    const favicon = document.querySelector("link[rel='icon']");
    if (favicon) {
      favicon.href = "/owner.png";
    }

    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/owner/orders");
      setOrders(res.data);
    } catch (err) {
      console.error("Failed to fetch owner orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    setApproving(true);
    try {
      await axios.patch(`http://localhost:5000/api/owner/orders/${approveTarget.order_id}/approve`);
      setOrders(prev => prev.map(o =>
        o.order_id === approveTarget.order_id ? { ...o, order_status: "Approved" } : o
      ));
      if (selectedOrder?.order_id === approveTarget.order_id)
        setSelectedOrder(prev => ({ ...prev, order_status: "Approved" }));
      showToast(`Order ${approveTarget.order_id} approved successfully!`);
    } catch (err) {
      showToast("Failed to approve order. Please try again.", "error");
    } finally {
      setApproving(false);
      setApproveTarget(null);
    }
  };

  const handleCancelOrder = async (order) => {
    if (!order) return;
    const confirmCancel = window.confirm(`Are you sure you want to cancel order ${order.order_id}?`);
    if (!confirmCancel) return;
    try {
      await axios.patch(`http://localhost:5000/api/owner/orders/${order.order_id}/cancel`);
      setOrders((prev) => prev.map((o) => o.order_id === order.order_id ? { ...o, order_status: "Cancelled" } : o));
      if (selectedOrder?.order_id === order.order_id) {
        setSelectedOrder((prev) => ({ ...prev, order_status: "Cancelled" }));
      }
      showToast(`Order ${order.order_id} cancelled successfully.`);
    } catch (err) {
      console.error("Cancel order error:", err);
      showToast(err.response?.data?.message || "Failed to cancel order.", "error");
    }
  };

  const openChangeBatchModal = async (order) => {
    try {
      setChangeBatchTarget(order);
      setSelectedBatchId("");
      const res = await axios.get(`http://localhost:5000/api/owner/orders/change-batch/available-batches?quantity=${order.requested_quantity}`);
      setAvailableBatches(res.data || []);
    } catch (err) {
      console.error("Fetch available batches error:", err);
      showToast(err.response?.data?.message || "Failed to load available batches.", "error");
    }
  };

  const handleChangeBatch = async () => {
    if (!changeBatchTarget || !selectedBatchId) {
      showToast("Please select a new batch.", "error");
      return;
    }
    setChangingBatch(true);
    try {
      const res = await axios.patch(
        `http://localhost:5000/api/owner/orders/${changeBatchTarget.order_id}/change-batch`,
        { new_batch_id: selectedBatchId }
      );
      setOrders((prev) => prev.map((o) => o.order_id === changeBatchTarget.order_id ? { ...o, batch_id: selectedBatchId } : o));
      if (selectedOrder?.order_id === changeBatchTarget.order_id) {
        setSelectedOrder((prev) => ({ ...prev, batch_id: selectedBatchId }));
      }
      showToast(res.data?.message || "Batch changed successfully.");
      setChangeBatchTarget(null);
      setSelectedBatchId("");
      setAvailableBatches([]);
      await fetchOrders();
    } catch (err) {
      console.error("Change batch error:", err);
      showToast(err.response?.data?.message || "Failed to change batch.", "error");
    } finally {
      setChangingBatch(false);
    }
  };

  const filteredOrders = useMemo(() => orders.filter(o => {
    const kw = search.toLowerCase();
    return (
      (o.order_id?.toLowerCase().includes(kw) ||
       o.customer_name?.toLowerCase().includes(kw) ||
       o.batch_id?.toLowerCase().includes(kw)) &&
      (statusFilter   === "All" || o.order_status   === statusFilter) &&
      (deliveryFilter === "All" || o.delivery_type  === deliveryFilter) &&
      (paymentFilter  === "All" || o.payment_status === paymentFilter)
    );
  }), [orders, search, statusFilter, deliveryFilter, paymentFilter]);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, deliveryFilter, paymentFilter]);

  const totalPages      = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const pendingApprovalOrders = useMemo(() =>
    orders.filter(o => o.order_status === "Pending" && !ignoredNotifications.includes(o.order_id)),
    [orders, ignoredNotifications]
  );
  const unreadCount = pendingApprovalOrders.length;

  const overview = useMemo(() => ({
    pendingOrders:  orders.filter(o => o.order_status  === "Pending").length,
    totalOrders:    orders.length,
    totalRevenue:   orders.reduce((s, o) => s + Number(o.order_total || 0), 0),
    deliveryOrders: orders.filter(o => o.delivery_type === "Delivery").length,
    pickupOrders:   orders.filter(o => o.delivery_type === "Pickup").length,
    paidOrders:     orders.filter(o => o.payment_status === "Paid").length,
  }), [orders]);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", gap: 12, alignItems: "center", justifyContent: "center", background: C.foam, fontFamily: "'Inter',sans-serif", color: C.sage }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
        <ClipboardList size={32} color={C.fern} />
      </motion.div>
      <span style={{ fontWeight: 700, fontSize: 15 }}>Loading orders…</span>
    </div>
  );

  return (
    <div style={{ padding: "24px 28px", background: C.foam, minHeight: "100vh", fontFamily: "'Inter',sans-serif" }}>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -40, x: "-50%" }}
            style={{ position: "fixed", top: 20, left: "50%", zIndex: 3000, background: toast.type === "error" ? C.red : C.fern, color: C.white, padding: "11px 20px", borderRadius: 12, fontWeight: 700, fontSize: 13, boxShadow: "0 8px 28px rgba(0,0,0,0.18)", display: "flex", alignItems: "center", gap: 8, whiteSpace: "nowrap" }}>
            {toast.type === "error" ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════
          HEADER
      ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `linear-gradient(135deg, ${C.fern}, ${C.pine})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ClipboardList size={22} color={C.white} strokeWidth={2} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 24, fontWeight: 900, color: C.forest, margin: 0, letterSpacing: "-0.02em" }}>
              Order Management
            </h1>
            <p style={{ color: C.sage, fontSize: 12, margin: 0, fontWeight: 500, marginTop: 1 }}>
              Monitor, approve, and manage all customer orders
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {overview.pendingOrders > 0 && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: .2 }}
              style={{ display: "flex", alignItems: "center", gap: 7, background: C.amberBg, border: `1.5px solid #F59E0B30`, borderRadius: 10, padding: "7px 13px" }}
            >
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                <Clock size={14} color={C.amber} />
              </motion.div>
              <span style={{ fontWeight: 800, color: C.amber, fontSize: 13 }}>{overview.pendingOrders} pending</span>
            </motion.div>
          )}

          <div style={{ position: "relative" }}>
            <motion.button
              whileHover={{ scale: 1.06 }} whileTap={{ scale: .95 }}
              type="button"
              onClick={() => setShowNotifications(p => !p)}
              style={{ width: 42, height: 42, borderRadius: 12, border: `1.5px solid ${C.mist}`, background: showNotifications ? C.foam : C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 8px rgba(16,33,20,0.06)", position: "relative" }}
            >
              <Bell size={17} color={C.pine} />
              {unreadCount > 0 && (
                <span style={{ position: "absolute", top: -5, right: -5, minWidth: 18, height: 18, borderRadius: 999, background: C.red, color: C.white, fontSize: 10, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${C.white}` }}>
                  {unreadCount}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {showNotifications && (
                <NotificationDropdown
                  orders={pendingApprovalOrders}
                  onApprove={(order) => { setApproveTarget(order); setShowNotifications(false); }}
                  onView={(order) => setSelectedOrder(order)}
                  onCancel={(order) => { setShowNotifications(false); handleCancelOrder(order); }}
                  onDismissAll={() => setIgnoredNotifications(pendingApprovalOrders.map((o) => o.order_id))}
                  onRefresh={() => { fetchOrders(); }}
                  onClose={() => setShowNotifications(false)}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════
          STAT CARDS
      ══════════════════════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 22 }}>
        {[
          { title: "Pending",  value: overview.pendingOrders,  sub: "Awaiting approval" },
          { title: "Total",    value: overview.totalOrders,    sub: "All orders"        },
          { title: "Delivery", value: overview.deliveryOrders, sub: "Need delivery"     },
          { title: "Pickup",   value: overview.pickupOrders,   sub: "Self pickup"       },
          { title: "Paid",     value: overview.paidOrders,     sub: "Confirmed payment" },
        ].map((s, i) => <StatCard key={s.title} {...s} index={i} />)}
      </div>

      {/* ══════════════════════════════════════
          FILTERS BAR
      ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .15 }}
        style={{ background: C.white, borderRadius: 16, padding: "14px 18px", boxShadow: "0 1px 8px rgba(16,33,20,0.05)", marginBottom: 18, border: `1.5px solid ${C.mist}` }}
      >
        {/* Section label */}
        <div style={{ fontSize: 10, color: C.sage, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
          <Filter size={11} color={C.sage} /> Filter & Search
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
          {/* Search */}
          <div>
            <label style={lbl}>Search</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: 42, border: `1.5px solid ${C.mist}`, borderRadius: 11, padding: "0 12px", background: C.foam, transition: "border-color .15s" }}>
              <Search size={14} color={C.sage} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Order ID, customer, or batch…"
                style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontSize: 13, color: C.forest }} />
              {search && (
                <button type="button" onClick={() => setSearch("")} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0, display: "flex" }}>
                  <X size={13} color={C.sage} />
                </button>
              )}
            </div>
          </div>

          {/* Dropdowns */}
          {[
            { lbl: "Status",   val: statusFilter,   set: setStatusFilter,   opts: ["All","Pending","Approved","Completed","Cancelled"] },
            { lbl: "Delivery", val: deliveryFilter, set: setDeliveryFilter, opts: ["All","Delivery","Pickup"] },
            { lbl: "Payment",  val: paymentFilter,  set: setPaymentFilter,  opts: ["All","Paid","Pending","Failed"] },
          ].map(f => (
            <div key={f.lbl}>
              <label style={lbl}>{f.lbl}</label>
              <select value={f.val} onChange={e => f.set(e.target.value)}
                style={{ width: "100%", height: 42, border: `1.5px solid ${C.mist}`, borderRadius: 11, padding: "0 10px", fontSize: 13, outline: "none", background: C.foam, color: C.forest, fontWeight: 600, cursor: "pointer" }}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}

          {/* Reset */}
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: .96 }}
            onClick={() => { setSearch(""); setStatusFilter("All"); setDeliveryFilter("All"); setPaymentFilter("All"); }}
            style={{ height: 42, padding: "0 14px", borderRadius: 11, border: `1.5px solid ${C.mist}`, background: C.foam, color: C.pine, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12, whiteSpace: "nowrap", alignSelf: "end" }}>
            <X size={13} /> Reset
          </motion.button>
        </div>
      </motion.div>

      {/* ══════════════════════════════════════
          TABLE CARD
      ══════════════════════════════════════ */}
      <motion.div layout style={{ background: C.white, borderRadius: 18, boxShadow: "0 2px 12px rgba(16,33,20,0.06)", border: `1.5px solid ${C.mist}`, overflow: "hidden" }}>

        {/* Table Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${C.mist}`, background: C.white }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans',sans-serif", fontSize: 15, fontWeight: 800, color: C.forest }}>Order Records</div>
            <span style={{ fontSize: 11, color: C.sage, fontWeight: 700, background: C.foam, padding: "3px 10px", borderRadius: 99, border: `1px solid ${C.mist}` }}>
              {filteredOrders.length} result{filteredOrders.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button type="button" onClick={fetchOrders} style={{ ...smallBtn, height: 34, gap: 6 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
            <thead>
              <tr style={{ background: C.foam }}>
                {["Order ID","Customer","Batch","For Month","Order Date","Req. Date","Qty","Total","Type","Status","Payment","Action"].map(h => (
                  <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontSize: 10, fontWeight: 800, color: C.sage, textTransform: "uppercase", letterSpacing: "0.07em", whiteSpace: "nowrap", borderBottom: `1px solid ${C.mist}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {paginatedOrders.map((order, i) => {
                  const sc = statusConfig[order.order_status]   || { bg: C.grayBg, color: C.gray, dot: "#9CA3AF" };
                  const pc = paymentConfig[order.payment_status] || { bg: C.grayBg, color: C.gray };
                  const isSelected = selectedOrder?.order_id === order.order_id;
                  const isPending  = order.order_status === "Pending";

                  return (
                    <motion.tr key={order.order_id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.018 }}
                      style={{ borderTop: `1px solid ${C.mist}`, background: isSelected ? "#F0FAF0" : "transparent", transition: "background .12s" }}>
                      <td style={{ padding: "11px 12px", fontWeight: 800, color: C.forest, fontSize: 13, whiteSpace: "nowrap" }}>{order.order_id}</td>
                      <td style={tdc}>{order.customer_name}</td>
                      <td style={tdc}>{order.batch_id}</td>
                      <td style={tdc}>{isRecurringOrder(order) ? order.recurring_month || "—" : "—"}</td>
                      <td style={{ ...tdc, whiteSpace: "nowrap" }}>{formatDate(order.order_date)}</td>
                      <td style={{ ...tdc, whiteSpace: "nowrap" }}>{formatDate(order.requested_delivery_date || order.delivery_date)}</td>
                      <td style={tdc}>{order.requested_quantity}</td>
                      <td style={{ ...tdc, fontWeight: 800, color: C.forest, whiteSpace: "nowrap" }}>{money(order.order_total)}</td>
                      <td style={tdc}>{order.delivery_type}</td>
                      <td style={tdc}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 999, fontSize: 11, fontWeight: 800, background: sc.bg, color: sc.color, whiteSpace: "nowrap" }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
                          {order.order_status}
                        </span>
                      </td>
                      <td style={tdc}>
                        <span style={{ padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 800, background: pc.bg, color: pc.color }}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: .92 }}
                            onClick={() => setSelectedOrder(order)}
                            style={{ width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${C.mist}`, background: isSelected ? C.green : C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Eye size={13} color={C.pine} />
                          </motion.button>
                          {isPending && (
                            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: .96 }}
                              onClick={() => setApproveTarget(order)}
                              style={{ height: 30, padding: "0 9px", borderRadius: 8, border: "none", background: `linear-gradient(135deg,#4CAF50,${C.fern})`, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 800, whiteSpace: "nowrap" }}>
                              <CheckCircle size={12} strokeWidth={2.5} /> Approve
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: C.sage }}>
              <ClipboardList size={36} color={C.mist} style={{ marginBottom: 10 }} />
              <div style={{ fontWeight: 700, fontSize: 13 }}>No orders match your filters.</div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredOrders.length > itemsPerPage && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderTop: `1px solid ${C.mist}`, background: C.foam }}>
            <span style={{ fontSize: 12, color: C.sage, fontWeight: 600 }}>
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length}
            </span>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button type="button" disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                style={{ ...smallBtn, height: 34, opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <span style={{ fontSize: 12, color: C.sage, fontWeight: 800, background: C.white, border: `1px solid ${C.mist}`, borderRadius: 8, padding: "5px 12px" }}>
                {currentPage} / {totalPages}
              </span>
              <button type="button" disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                style={{ ...smallBtn, height: 34, opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal
            order={selectedOrder}
            onClose={() => setSelectedOrder(null)}
            onChangeBatch={(order) => openChangeBatchModal(order)}
            onApprove={() => { setApproveTarget(selectedOrder); setSelectedOrder(null); }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {changeBatchTarget && (
          <ChangeBatchModal
            order={changeBatchTarget}
            batches={availableBatches}
            selectedBatchId={selectedBatchId}
            setSelectedBatchId={setSelectedBatchId}
            onConfirm={handleChangeBatch}
            onCancel={() => { setChangeBatchTarget(null); setSelectedBatchId(""); setAvailableBatches([]); }}
            loading={changingBatch}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {approveTarget && (
          <ApproveModal
            order={approveTarget}
            onConfirm={handleApprove}
            onCancel={() => setApproveTarget(null)}
            loading={approving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Shared Styles ─────────────────────────────────────────────── */
const lbl = {
  fontSize: 10, color: C.sage, fontWeight: 700, display: "block",
  marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em",
};
const tdc = { padding: "11px 10px", color: "#4B5E4F", fontSize: 13, whiteSpace: "nowrap" };
const smallBtn = {
  height: 34, padding: "0 11px", borderRadius: 9,
  border: `1.5px solid #DDE8D7`, background: "#ffffff",
  color: "#244128", fontWeight: 800, fontSize: 12, cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  gap: 5, whiteSpace: "nowrap",
};