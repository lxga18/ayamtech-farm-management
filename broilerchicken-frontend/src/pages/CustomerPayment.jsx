import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  CreditCard, ChevronRight, ShieldCheck, Lock,
  Package, Weight, Layers, Clock, CheckCircle2,
  ListOrdered, Receipt, RefreshCw, Truck,
} from "lucide-react";

const METHODS = [
  {
    id: "card",
    label: "Debit / Credit Card",
    sub: "Stripe test card payment",
    icon: <CreditCard size={22} />,
    accent: "#8B5CF6",
    lightBg: "#F0EDFF",
  },
  {
    id: "grabpay",
    label: "GrabPay",
    sub: "Stripe wallet test payment",
    icon: <CreditCard size={22} />,
    accent: "#16A34A",
    lightBg: "#EAF7E3",
  },
];

export default function CustomerPayment() {
  const customerId = sessionStorage.getItem("customer_id");

  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState("card");
  const [processing, setProcessing] = useState(false);
  const [successPopup, setSuccessPopup] = useState(false);

  const selected = METHODS.find((m) => m.id === method);

  useEffect(() => {
    API.get(`/customer/unpaid-orders/${customerId}`)
      .then((res) => {
      const mapped = res.data.map((o) => {
        const isDelivery = String(o.delivery_type || "").trim().toLowerCase() === "delivery";

        return {
          id: o.order_id,
          batch: o.batch_id,
          date: new Date(o.order_date).toISOString().split("T")[0],
          quantity: Number(o.requested_quantity),
          weight: Number(o.requested_quantity) * Number(o.avg_weight_kg || 0),
          priceKg: Number(o.price_per_kg || 0),
          deliveryFee: isDelivery ? 25 : 0,
          total: Number(o.total_amount || 0) + (isDelivery ? 25 : 0),
          status: o.order_status,
        };
      });
        setOrders(mapped);
        setSelectedOrder(mapped[0] || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Unpaid orders error:", err);
        setLoading(false);
      });
  }, [customerId]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const success = params.get("success");
    const orderId = params.get("order_id");

    if (success === "true" && orderId) {
      const paymentMethod = params.get("method");
      const paidAmount = params.get("amount");

      API.post("/customer/confirm-payment", {
        order_id: orderId,
        amount: paidAmount,
        payment_method: paymentMethod === "grabpay" ? "GrabPay" : "Card",
      })
        .then(() => setSuccessPopup(true))
        .catch((err) => {
          console.error("Confirm payment error:", err);
          alert("Payment succeeded, but database update failed.");
        });
    }
  }, []);

  const handlePay = async () => {
    if (!selectedOrder) return;
    setProcessing(true);
    try {
      const res = await API.post("/customer/create-checkout-session", {
        order_id: selectedOrder.id,
        amount: selectedOrder.total,
        payment_method: method,
      });
      window.location.href = res.data.url;
    } catch (err) {
      console.error("Stripe payment error:", err);
      alert("Failed to open Stripe payment page.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "32px", background: "#F4F7F2", minHeight: "100vh" }}>
        Loading unpaid orders...
      </div>
    );
  }

  /* ── DESKTOP EMPTY STATE ── */
  if (!selectedOrder) {
    return (
      <div style={{ padding: "32px", background: "#F4F7F2", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Page header — identical to payment page */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px" }}>
              <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "#4CAF50", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Lock size={22} color="#fff" />
              </div>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "28px", fontWeight: 800, color: "#102114" }}>
                  Secure Payment
                </div>
                <div style={{ fontSize: "13px", color: "#6E8A72", display: "flex", alignItems: "center", gap: "5px" }}>
                  <ShieldCheck size={13} color="#4CAF50" />
                  Stripe Test Mode · No real money charged
                </div>
              </div>
            </div>

            {/* Two-column grid — mirrors the payment page layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>

              {/* Left — empty state content */}
              <div style={{
                background: "#fff",
                borderRadius: "24px",
                border: "1.5px solid #E5EDE0",
                padding: "56px 48px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 20px rgba(17,24,39,0.05)",
                minHeight: "420px",
              }}>
                {/* Animated ripple icon */}
                <div style={{ position: "relative", width: "114px", height: "114px", margin: "0 auto 28px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <motion.div
                    animate={{ scale: [1, 1.14, 1], opacity: [0.15, 0.05, 0.15] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "#4CAF50" }}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.1, 0.25] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.25 }}
                    style={{ position: "absolute", inset: "16px", borderRadius: "50%", background: "#4CAF50" }}
                  />
                  <div style={{
                    position: "absolute", inset: "30px", borderRadius: "50%",
                    background: "#EAF7E3", border: "1.5px solid #C8E6C9",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <CheckCircle2 size={28} color="#4CAF50" strokeWidth={1.8} />
                  </div>
                </div>

                {/* Status badge */}
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "6px",
                  background: "#EAF7E3", border: "1px solid #C8E6C9",
                  borderRadius: "999px", padding: "4px 14px",
                  fontSize: "11px", fontWeight: 700, color: "#3A7D1C",
                  letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "14px",
                }}>
                  <ShieldCheck size={11} color="#4CAF50" />
                  All clear
                </div>

                <h2 style={{ margin: "0 0 10px", fontSize: "26px", fontWeight: 800, color: "#102114", fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: "center" }}>
                  You're all paid up
                </h2>
                <p style={{ margin: "0 0 36px", fontSize: "14px", color: "#6E8A72", lineHeight: 1.75, maxWidth: "400px", textAlign: "center" }}>
                  No approved orders are waiting for payment right now. New orders will appear here once they've been approved.
                </p>

                {/* 3-column info cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", width: "100%", marginBottom: "28px" }}>
                  {[
                    { icon: <Clock size={18} color="#6E8A72" />, title: "Pending orders", sub: "Awaiting approval" },
                    { icon: <Receipt size={18} color="#6E8A72" />, title: "Payment history", sub: "View past receipts" },
                    { icon: <Truck size={18} color="#6E8A72" />, title: "Deliveries", sub: "Track your batches" },
                  ].map((card) => (
                    <div key={card.title} style={{
                      background: "#F4F7F2", border: "1px solid #E5EDE0",
                      borderRadius: "16px", padding: "16px 14px",
                    }}>
                      <div style={{ marginBottom: "10px" }}>{card.icon}</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#102114", marginBottom: "3px" }}>{card.title}</div>
                      <div style={{ fontSize: "12px", color: "#9AA89B" }}>{card.sub}</div>
                    </div>
                  ))}
                </div>

                {/* CTA button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => window.location.href = "/customer/orders"}
                  style={{
                    height: "50px", padding: "0 32px", borderRadius: "16px", border: "none",
                    background: "#4CAF50", color: "#fff",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "15px",
                    cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "10px",
                    boxShadow: "0 6px 20px rgba(76,175,80,0.26)", marginBottom: "14px",
                  }}
                >
                  <ListOrdered size={18} />
                  View My Orders
                  <ChevronRight size={18} />
                </motion.button>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#9AA89B" }}>
                  <RefreshCw size={12} color="#9AA89B" />
                  This page refreshes when new orders arrive
                </div>
              </div>

              {/* Right — greyed-out summary panel */}
              <div style={{ position: "sticky", top: "24px" }}>
                <div style={{ background: "#fff", borderRadius: "24px", overflow: "hidden", boxShadow: "0 12px 40px rgba(17,24,39,0.08)", border: "1px solid #E5EDE0" }}>
                  <div style={{ background: "#102114", padding: "22px 24px", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", right: "-30px", top: "-30px", width: "140px", height: "140px", borderRadius: "50%", border: "28px solid rgba(76,175,80,0.12)" }} />
                    <div style={{ fontSize: "11px", color: "#86A882", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "8px" }}>ORDER SUMMARY</div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: "22px", fontWeight: 800, color: "#fff" }}>No order selected</div>
                    <div style={{ fontSize: "12px", color: "#86A882", marginTop: "3px" }}>Select an order to pay</div>
                  </div>
                  <div style={{ padding: "22px 24px" }}>
                    {[
                      { icon: <Package size={14} />, label: "Quantity" },
                      { icon: <Weight size={14} />, label: "Weight" },
                      { icon: <Layers size={14} />, label: "Batch" },
                      { icon: <CreditCard size={14} />, label: "Price/kg" },
                    ].map(({ icon, label }, idx) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: idx < 3 ? "1px solid #F0F4EC" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6E8A72", fontSize: "13px" }}>
                          {icon} {label}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "13px", color: "#C4CDC0" }}>—</span>
                      </div>
                    ))}

                    <div style={{ height: "1px", background: "#F0F4EC", margin: "16px 0" }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "13px", color: "#6E8A72" }}>Subtotal</span>
                      <span style={{ fontWeight: 700, color: "#C4CDC0" }}>RM —</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                      <span style={{ fontSize: "13px", color: "#6E8A72" }}>Payment Gateway</span>
                      <span style={{ fontWeight: 700, color: "#4CAF50" }}>Stripe Test Mode</span>
                    </div>

                    <div style={{ background: "#F4F7F2", borderRadius: "16px", padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", border: "1.5px solid #E5EDE0" }}>
                      <div>
                        <div style={{ fontSize: "11px", color: "#9AA89B", marginBottom: "2px" }}>TOTAL PAYABLE</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: "26px", fontWeight: 800, color: "#C4CDC0" }}>RM —</div>
                      </div>
                    </div>

                    <div style={{
                      width: "100%", height: "52px", borderRadius: "16px",
                      background: "#C8E6C9", display: "flex", alignItems: "center",
                      justifyContent: "center", gap: "10px",
                    }}>
                      <Lock size={18} color="#fff" />
                      <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: "16px", color: "#fff" }}>
                        Pay Now
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "16px" }}>
                      {["🔒 Secure", "🧪 Test Mode", "✅ Stripe"].map((t) => (
                        <span key={t} style={{ fontSize: "11px", color: "#9AA89B", fontWeight: 600 }}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  /* ── MAIN PAYMENT UI ── */
  return (
    <div style={{ padding: "32px", background: "#F4F7F2", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key="payment-page"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "30px" }}>
            <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "#4CAF50", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lock size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "28px", fontWeight: 800, color: "#102114" }}>Secure Payment</div>
              <div style={{ fontSize: "13px", color: "#6E8A72", display: "flex", alignItems: "center", gap: "5px" }}>
                <ShieldCheck size={13} color="#4CAF50" /> Stripe Test Mode · No real money charged
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px", alignItems: "start" }}>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: "16px", fontWeight: 800, color: "#102114", marginBottom: "14px" }}>
                Choose Unpaid Order
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {orders.map((o) => {
                  const active = selectedOrder?.id === o.id;
                  return (
                    <motion.div
                      key={o.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedOrder(o)}
                      style={{
                        background: active ? "#EAF7E3" : "#fff",
                        borderRadius: "18px",
                        border: active ? "2px solid #4CAF50" : "1.5px solid #E5EDE0",
                        padding: "18px",
                        cursor: "pointer",
                        boxShadow: active ? "0 8px 28px rgba(76,175,80,0.15)" : "0 4px 16px rgba(17,24,39,0.05)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                        <div>
                          <div style={{ fontSize: "18px", fontWeight: 800, color: "#102114" }}>{o.id}</div>
                          <div style={{ fontSize: "12px", color: "#6E8A72" }}>{o.date} · {o.batch}</div>
                        </div>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#92600A", background: "#FFF8EC", padding: "5px 10px", borderRadius: "999px" }}>
                          Unpaid
                        </div>
                      </div>
                      <div style={orderInfoRow}><span>Quantity</span><b>{o.quantity} chickens</b></div>
                      <div style={orderInfoRow}><span>Weight</span><b>{o.weight.toFixed(1)} kg</b></div>
                      <div style={orderInfoRow}><span>Price/kg</span><b>RM {o.priceKg.toFixed(2)}</b></div>
                      <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid #E5EDE0", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "13px", color: "#6E8A72" }}>Amount</span>
                        <b style={{ fontSize: "18px", color: "#102114" }}>RM {o.total.toFixed(2)}</b>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: "16px", fontWeight: 800, color: "#102114", marginBottom: "14px" }}>
                Choose Payment Method
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                {METHODS.map((m) => {
                  const isSelected = method === m.id;
                  return (
                    <motion.div
                      key={m.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setMethod(m.id)}
                      style={{
                        background: "#fff",
                        borderRadius: "18px",
                        border: isSelected ? `2px solid ${m.accent}` : "1.5px solid #E5EDE0",
                        cursor: "pointer",
                        overflow: "hidden",
                        boxShadow: isSelected ? `0 8px 28px ${m.accent}22` : "0 4px 16px rgba(17,24,39,0.05)",
                      }}
                    >
                      <div style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "46px", height: "46px", borderRadius: "13px", background: isSelected ? m.accent : m.lightBg, display: "flex", alignItems: "center", justifyContent: "center", color: isSelected ? "#fff" : m.accent, flexShrink: 0 }}>
                          {m.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: "15px", color: "#102114" }}>{m.label}</div>
                          <div style={{ fontSize: "12px", color: "#9AA89B", marginTop: "2px" }}>{m.sub}</div>
                        </div>
                        <div style={{ width: "22px", height: "22px", borderRadius: "50%", border: `2px solid ${isSelected ? m.accent : "#E5EDE0"}`, background: isSelected ? m.accent : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {isSelected && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#fff" }} />}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderRadius: "12px", background: "#EAF7E3", border: "1px solid #C8E6C9" }}>
                <ShieldCheck size={16} color="#4CAF50" />
                <span style={{ fontSize: "12px", color: "#3A7D1C", fontWeight: 600 }}>Use Stripe test card: 4242 4242 4242 4242</span>
              </div>
            </div>

            <div style={{ position: "sticky", top: "24px" }}>
              <div style={{ background: "#fff", borderRadius: "24px", overflow: "hidden", boxShadow: "0 12px 40px rgba(17,24,39,0.08)", border: "1px solid #E5EDE0" }}>
                <div style={{ background: "#102114", padding: "22px 24px", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", right: "-30px", top: "-30px", width: "140px", height: "140px", borderRadius: "50%", border: "28px solid rgba(76,175,80,0.12)" }} />
                  <div style={{ fontSize: "11px", color: "#86A882", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "8px" }}>ORDER SUMMARY</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: "24px", fontWeight: 800, color: "#fff" }}>{selectedOrder.id}</div>
                  <div style={{ fontSize: "12px", color: "#86A882", marginTop: "3px" }}>{selectedOrder.date} · {selectedOrder.batch}</div>
                </div>

                <div style={{ padding: "22px 24px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                    {[
                      { icon: <Package size={14} />, label: "Quantity", value: `${selectedOrder.quantity} chickens` },
                      { icon: <Weight size={14} />, label: "Weight", value: `${selectedOrder.weight.toFixed(1)} kg` },
                      { icon: <Layers size={14} />, label: "Batch", value: selectedOrder.batch },
                      { icon: <CreditCard size={14} />, label: "Price/kg", value: `RM ${selectedOrder.priceKg.toFixed(2)}` },
                    ].map(({ icon, label, value }, idx) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: idx < 3 ? "1px solid #F0F4EC" : "none" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#6E8A72", fontSize: "13px" }}>
                          {icon} {label}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "13px", color: "#102114" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ height: "1px", background: "#F0F4EC", margin: "16px 0" }} />

                  {/* Chicken subtotal */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#6E8A72" }}>Chicken Subtotal</span>
                    <span style={{ fontWeight: 700, color: "#102114" }}>
                      RM {(selectedOrder.total - selectedOrder.deliveryFee).toFixed(2)}
                    </span>
                  </div>

                  {/* Delivery fee */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ fontSize: "13px", color: "#6E8A72" }}>Delivery Fee</span>
                    <span style={{ fontWeight: 700, color: "#102114" }}>
                      RM {selectedOrder.deliveryFee.toFixed(2)}
                    </span>
                  </div>

                  {/* Payment gateway */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                    <span style={{ fontSize: "13px", color: "#6E8A72" }}>Payment Gateway</span>
                    <span style={{ fontWeight: 700, color: "#4CAF50" }}>Stripe Test Mode</span>
                  </div>

                  <div
                    style={{
                      background: "#F4F7F2",
                      borderRadius: "16px",
                      padding: "16px 18px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "20px",
                      border: "1.5px solid #E5EDE0",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "11px", color: "#9AA89B", marginBottom: "2px" }}>
                        TOTAL PAYABLE
                      </div>

                      <div
                        style={{
                          fontFamily: "'Plus Jakarta Sans'",
                          fontSize: "26px",
                          fontWeight: 800,
                          color: "#102114",
                        }}
                      >
                        RM {selectedOrder.total.toFixed(2)}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "11px", color: "#9AA89B", marginBottom: "4px" }}>
                        Method
                      </div>

                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: "13px",
                          color: selected ? selected.accent : "#C4CDC0",
                        }}
                      >
                        {selected ? selected.label : "Not selected"}
                      </div>
                    </div>
                  </div>

                  <motion.button
                    onClick={handlePay}
                    disabled={!method || processing}
                    whileHover={!processing ? { scale: 1.02 } : {}}
                    whileTap={!processing ? { scale: 0.98 } : {}}
                    style={{
                      width: "100%", height: "52px", borderRadius: "16px", border: "none",
                      background: method ? "#4CAF50" : "#C8E6C9", color: "#fff",
                      fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: "16px",
                      cursor: method ? "pointer" : "not-allowed",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                    }}
                  >
                    {processing ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                          style={{ width: "20px", height: "20px", borderRadius: "50%", border: "3px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }}
                        />
                        Redirecting to Stripe…
                      </>
                    ) : (
                      <>
                        <Lock size={18} />
                        Pay Now — RM {selectedOrder.total.toFixed(2)}
                        <ChevronRight size={18} />
                      </>
                    )}
                  </motion.button>

                  <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "16px" }}>
                    {["🔒 Secure", "🧪 Test Mode", "✅ Stripe"].map((t) => (
                      <span key={t} style={{ fontSize: "11px", color: "#9AA89B", fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── SUCCESS POPUP ── */}
      {successPopup && (
        <div style={popupBackdrop}>
          <div style={popupBox}>
            <div style={popupIcon}>✓</div>
            <div style={popupTitle}>Payment Successful</div>
            <div style={popupText}>Your payment has been recorded successfully.</div>
            <button
              style={popupButton}
              onClick={() => {
                setSuccessPopup(false);
                window.location.href = "/customer/orders";
              }}
            >
              View My Orders
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const orderInfoRow = { display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#6E8A72", marginBottom: "6px" };
const popupBackdrop = { position: "fixed", inset: 0, background: "rgba(16,33,20,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 };
const popupBox = { width: "420px", background: "#fff", borderRadius: "24px", padding: "30px", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.18)" };
const popupIcon = { width: "62px", height: "62px", borderRadius: "50%", background: "#EAF7E3", color: "#3A7D1C", fontSize: "34px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" };
const popupTitle = { fontSize: "22px", fontWeight: 800, color: "#102114", marginBottom: "8px" };
const popupText = { fontSize: "13px", color: "#6E8A72", lineHeight: 1.6, marginBottom: "22px" };
const popupButton = { width: "100%", height: "46px", borderRadius: "14px", border: "none", background: "#4CAF50", color: "#fff", fontWeight: 800, cursor: "pointer" };