import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import LeafletDeliveryMap from "../components/LeafletDeliveryMap";
import {
  Truck,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  MapPin,
  Phone,
  User,
  Navigation,
  CalendarDays,
  Bell,
  Star,
  X,
  Timer,
  ClipboardList,
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

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

const normalizeDeliveryStatus = (status) => {
  const value = String(status || "").toLowerCase().trim();

  if (value === "assigned") return "assigned";

  if (
    value === "out of delivery" ||
    value === "out for delivery" ||
    value === "out_for_delivery" ||
    value === "out-of-delivery"
  ) {
    return "out of delivery";
  }

  if (value === "completed" || value === "complete" || value === "delivered") {
    return "completed";
  }

  return "assigned";
};

const statusMeta = (status) => {
  const s = normalizeDeliveryStatus(status);

  if (s === "completed") {
    return {
      label: "Completed",
      icon: CheckCircle2,
      color: C.greenDark,
      bg: C.greenDim,
      border: "#4CAF5033",
      emoji: "✅",
    };
  }

  if (s === "out of delivery") {
    return {
      label: "Out for Delivery",
      icon: Truck,
      color: C.blue,
      bg: C.blueDim,
      border: "#3B82F633",
      emoji: "🚚",
    };
  }

  return {
    label: "Assigned",
    icon: Clock,
    color: C.amber,
    bg: C.amberDim,
    border: "#F59E0B33",
    emoji: "⏳",
  };
};

function todayLabel() {
  return new Date().toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function n(value, digits = 0) {
  return Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function fullAddress(delivery) {
  if (!delivery) return "";

  if (delivery.customer_full_address) {
    return delivery.customer_full_address;
  }

  return [
    delivery.delivery_address || delivery.customer_address || delivery.address,
    delivery.customer_area || delivery.area,
    "Kedah",
    "Malaysia",
  ]
    .filter(Boolean)
    .join(", ");
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.96 }}
        style={{
          position: "fixed",
          top: 86,
          right: 28,
          zIndex: 900,
          background: C.surface,
          border: `1.5px solid ${toast.type === "success" ? C.green : C.red}40`,
          borderLeft: `5px solid ${toast.type === "success" ? C.green : C.red}`,
          borderRadius: 16,
          padding: "14px 18px",
          boxShadow: "0 18px 48px rgba(16,33,20,.18)",
          minWidth: 330,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: C.body,
        }}
      >
        {toast.type === "success" ? (
          <CheckCircle2 size={20} color={C.green} />
        ) : (
          <AlertTriangle size={20} color={C.red} />
        )}

        <div
          style={{
            flex: 1,
            fontFamily: C.sans,
            fontWeight: 800,
            fontSize: 13,
            color: C.text,
          }}
        >
          {toast.message}
        </div>

        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            color: C.textLight,
            display: "flex",
          }}
        >
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

function StatCard({ icon: Icon, label, value, color, bg, delay }) {
  return (
    <motion.div
      {...fadeUp(delay)}
      whileHover={{ y: -4 }}
      style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 22,
        padding: 20,
        boxShadow: "0 8px 28px rgba(16,33,20,.06)",
        display: "flex",
        gap: 14,
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          background: bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={23} color={color} />
      </div>

      <div>
        <div
          style={{
            fontFamily: C.sans,
            fontSize: 26,
            fontWeight: 900,
            color: C.text,
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            marginTop: 5,
            fontSize: 12,
            color: C.textMid,
            fontWeight: 800,
          }}
        >
          {label}
        </div>
      </div>
    </motion.div>
  );
}

function Section({ title, icon: Icon, children, right, delay = 0.05 }) {
  return (
    <motion.section
      {...fadeUp(delay)}
      style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 24,
        padding: 22,
        boxShadow: "0 8px 28px rgba(16,33,20,.06)",
        marginBottom: 22,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 18,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 13,
              background: C.blueDim,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={18} color={C.blue} />
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: C.sans,
              fontSize: 17,
              fontWeight: 900,
              color: C.text,
            }}
          >
            {title}
          </h2>
        </div>
        {right}
      </div>

      {children}
    </motion.section>
  );
}

export default function DriverDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
  const [sortBy, setSortBy] = useState("status");
  const [toast, setToast] = useState(null);

  const deliveries = dashboard?.deliveries || [];
  const driver = dashboard?.driver || {};
  const stats = dashboard?.stats || {};

  const summary = dashboard?.summary || {
    assigned: stats.assigned_count || 0,
    out_for_delivery: stats.out_for_delivery_count || 0,
    completed: stats.completed_count || 0,
    late: stats.late_count || 0,
  };

  const selectedDelivery = useMemo(() => {
    if (!deliveries.length) return null;
    return deliveries.find((d) => d.delivery_id === selectedDeliveryId) || deliveries[0];
  }, [deliveries, selectedDeliveryId]);

  const sortedDeliveries = useMemo(() => {
    const list = [...deliveries];

    if (sortBy === "status") {
      const order = {
        "out of delivery": 1,
        assigned: 2,
        completed: 3,
      };

      list.sort((a, b) => {
        const sA = normalizeDeliveryStatus(a.delivery_status || a.display_status);
        const sB = normalizeDeliveryStatus(b.delivery_status || b.display_status);
        return (order[sA] || 9) - (order[sB] || 9);
      });
    }

    if (sortBy === "customer") {
      list.sort((a, b) =>
        String(a.customer_name || "").localeCompare(String(b.customer_name || ""))
      );
    }

    if (sortBy === "order") {
      list.sort((a, b) =>
        String(a.order_id || "").localeCompare(String(b.order_id || ""))
      );
    }

    return list;
  }, [deliveries, sortBy]);

  const routeStops = useMemo(() => {
    return deliveries
      .filter((d) => normalizeDeliveryStatus(d.delivery_status || d.display_status) !== "completed")
      .map((d) => fullAddress(d))
      .filter(Boolean);
  }, [deliveries]);

 useEffect(() => {
  document.title = "Driver Portal";

  const favicon = document.querySelector("#favicon");
  if (favicon) {
    favicon.href = "/driver.png";
  }

  fetchDashboard();
}, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await API.get("/driver/dashboard");
      setDashboard(res.data);

      if (!selectedDeliveryId && res.data?.deliveries?.length) {
        setSelectedDeliveryId(res.data.deliveries[0].delivery_id);
      }
    } catch (err) {
      console.error("Failed to load driver dashboard:", err);
      setToast({
        type: "error",
        message: err.response?.data?.error || "Failed to load driver dashboard.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (deliveryId, status) => {
    try {
      setUpdatingId(deliveryId);

      const res = await API.patch(`/driver/deliveries/${deliveryId}/status`, {
        delivery_status: status,
      });

      setToast({
        type: "success",
        message: res.data?.message || "Delivery updated successfully.",
      });

      await fetchDashboard();
    } catch (err) {
      console.error("Failed to update delivery status:", err);
      setToast({
        type: "error",
        message: err.response?.data?.error || "Failed to update delivery.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const openMap = (delivery) => {
    const destination = fullAddress(delivery);
    window.open(
      `https://www.openstreetmap.org/search?query=${encodeURIComponent(destination)}`,
      "_blank"
    );
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 14,
          fontFamily: C.body,
        }}
      >
        <style>{fontStyle}</style>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: `3px solid ${C.border}`,
            borderTopColor: C.blue,
          }}
        />
        <p style={{ color: C.textMid, fontWeight: 700 }}>
          Loading delivery hub…
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        fontFamily: C.body,
        color: C.text,
        paddingBottom: 60,
      }}
    >
      <style>{fontStyle}</style>
      <Toast toast={toast} onClose={() => setToast(null)} />

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
          background: "rgba(246,248,243,.92)",
          backdropFilter: "blur(14px)",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1420,
            margin: "0 auto",
            height: 76,
            padding: "0 32px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: `linear-gradient(135deg,${C.blue},#1D4ED8)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 10px 28px ${C.blue}35`,
            }}
          >
            <Truck size={26} color="#fff" />
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                fontFamily: C.sans,
                fontSize: 24,
                fontWeight: 900,
              }}
            >
              AyamTech Delivery Hub
            </h1>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: 12,
                color: C.textMid,
                fontWeight: 700,
              }}
            >
              Drive safe · Deliver today&apos;s Kedah orders on time
            </p>
          </div>

          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: C.amberDim,
                color: "#92400E",
                padding: "9px 12px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              <Bell size={14} /> {summary.assigned || 0}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: C.surface,
                border: `1.5px solid ${C.border}`,
                padding: "9px 14px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              <User size={15} color={C.blue} /> {driver.full_name || "Driver"}
            </div>

            <button onClick={fetchDashboard} style={refreshBtn}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>
      </div>

      <main style={{ maxWidth: 1420, margin: "0 auto", padding: "28px 32px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontFamily: C.sans,
                fontSize: 25,
                fontWeight: 900,
              }}
            >
              🚚 Today&apos;s Deliveries
            </h2>
            <p
              style={{
                margin: "5px 0 0",
                fontSize: 13,
                color: C.textMid,
                fontWeight: 700,
              }}
            >
              Deliveries assigned for today only
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: C.textMid,
              fontWeight: 900,
              fontSize: 13,
            }}
          >
            <CalendarDays size={17} /> {todayLabel()}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
            marginBottom: 22,
          }}
        >
          <StatCard
            icon={Package}
            label="Assigned Deliveries"
            value={n(summary.assigned)}
            color={C.amber}
            bg={C.amberDim}
            delay={0.02}
          />
          <StatCard
            icon={Truck}
            label="Out for Delivery"
            value={n(summary.out_for_delivery)}
            color={C.blue}
            bg={C.blueDim}
            delay={0.04}
          />
          <StatCard
            icon={CheckCircle2}
            label="Completed Today"
            value={n(summary.completed)}
            color={C.greenDark}
            bg={C.greenDim}
            delay={0.06}
          />
          <StatCard
            icon={Star}
            label="Late Deliveries"
            value={n(summary.late)}
            color={C.red}
            bg={C.redDim}
            delay={0.08}
          />
        </div>

        <Section
          title="Delivery Map Tracker"
          icon={MapPin}
          right={
            <button
              onClick={() => selectedDelivery && openMap(selectedDelivery)}
              disabled={!selectedDelivery}
              style={mapActionBtn}
            >
              <Navigation size={14} /> Open in Map
            </button>
          }
          delay={0.08}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr .7fr", gap: 18 }}>
            <div>
              {/* ── Delivery selector tabs — only shown when deliveries exist ── */}
              {deliveries.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 12,
                    overflowX: "auto",
                    paddingBottom: 4,
                  }}
                >
                  {deliveries.map((d) => {
                    const meta = statusMeta(d.delivery_status || d.display_status);
                    const isSelected = selectedDelivery?.delivery_id === d.delivery_id;

                    return (
                      <button
                        key={d.delivery_id}
                        onClick={() => setSelectedDeliveryId(d.delivery_id)}
                        style={{
                          border: `1.5px solid ${isSelected ? meta.color : C.border}`,
                          background: isSelected ? meta.bg : C.surface,
                          color: isSelected ? meta.color : C.textMid,
                          borderRadius: 10,
                          padding: "6px 12px",
                          fontFamily: C.sans,
                          fontWeight: 900,
                          fontSize: 11,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {meta.emoji} {d.delivery_id}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Map always rendered ── */}
              <LeafletDeliveryMap delivery={selectedDelivery} />
            </div>

            <div
              style={{
                background: C.bg,
                border: `1.5px solid ${C.border}`,
                borderRadius: 20,
                padding: 18,
              }}
            >
              <div
                style={{
                  fontFamily: C.sans,
                  fontWeight: 900,
                  marginBottom: 14,
                  fontSize: 14,
                }}
              >
                📋 Route Plan
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                <RouteStop label="Farm" detail={FARM_ADDRESS} icon="🏠" active />

                {routeStops.length === 0 ? (
                  <div
                    style={{
                      color: C.textMid,
                      fontSize: 13,
                      fontWeight: 700,
                      padding: "8px 0",
                    }}
                  >
                    All deliveries are completed!
                  </div>
                ) : (
                  routeStops.map((stop, idx) => (
                    <RouteStop
                      key={`${stop}-${idx}`}
                      label={`Customer ${idx + 1}`}
                      detail={stop}
                      icon="📍"
                    />
                  ))
                )}
              </div>

              <div
                style={{
                  marginTop: 15,
                  background: C.greenDim,
                  color: C.greenDark,
                  borderRadius: 14,
                  padding: 12,
                  fontWeight: 900,
                  fontSize: 12,
                }}
              >
                🟢 Same-day delivery route · {routeStops.length} active stop(s)
              </div>

              <div
                style={{
                  marginTop: 14,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: 14,
                  padding: 13,
                  fontSize: 12,
                  color: C.textMid,
                  lineHeight: 1.7,
                  fontWeight: 700,
                }}
              >
                <strong style={{ color: C.text }}>Map meaning:</strong>
                <br />
                🏠 Assigned = motorcycle at farm
                <br />
                🚚 Out for Delivery = vehicle moving on the route
                <br />
                ✅ Completed = vehicle at customer location
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="Today's Delivery List"
          icon={ClipboardList}
          delay={0.1}
          right={
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={selectStyle}
            >
              <option value="status">Sort by status</option>
              <option value="customer">Sort by customer</option>
              <option value="order">Sort by order</option>
            </select>
          }
        >
          {sortedDeliveries.length === 0 ? (
            <div style={{ padding: 50, textAlign: "center", color: C.textMid }}>
              <Truck size={42} color={C.textLight} />
              <div
                style={{
                  fontFamily: C.sans,
                  fontWeight: 900,
                  marginTop: 12,
                  color: C.text,
                }}
              >
                No deliveries assigned today
              </div>
              <div style={{ fontSize: 13, marginTop: 5 }}>
                Once the owner assigns a delivery to you, it will appear here.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 16 }}>
              {sortedDeliveries.map((delivery) => (
                <DeliveryCard
                  key={delivery.delivery_id}
                  delivery={delivery}
                  selected={selectedDelivery?.delivery_id === delivery.delivery_id}
                  onSelect={() => setSelectedDeliveryId(delivery.delivery_id)}
                  onNavigate={() => openMap(delivery)}
                  onStart={() => updateStatus(delivery.delivery_id, "out of delivery")}
                  onComplete={() => updateStatus(delivery.delivery_id, "completed")}
                  loading={updatingId === delivery.delivery_id}
                />
              ))}
            </div>
          )}
        </Section>

        <div
          style={{
            marginTop: 28,
            color: C.textLight,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          AyamTech Delivery Hub · Drive safe!
        </div>
      </main>
    </div>
  );
}

function RouteStop({ icon, label, detail, active }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: active ? C.greenDim : C.surface,
          border: `1px solid ${C.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      <div>
        <div style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 13 }}>
          {label}
        </div>
        <div
          style={{
            color: C.textMid,
            fontSize: 11,
            fontWeight: 700,
            lineHeight: 1.5,
          }}
        >
          {detail}
        </div>
      </div>
    </div>
  );
}

function DeliveryCard({
  delivery,
  selected,
  onSelect,
  onNavigate,
  onStart,
  onComplete,
  loading,
}) {
  const status = normalizeDeliveryStatus(delivery.delivery_status || delivery.display_status);
  const meta = statusMeta(delivery.delivery_status || delivery.display_status);
  const StatusIcon = meta.icon;

  const isAssigned = status === "assigned";
  const isOut = status === "out of delivery";
  const isCompleted = status === "completed";

  return (
    <motion.div
      whileHover={{ y: -3 }}
      onClick={onSelect}
      style={{
        border: `1.8px solid ${selected ? C.blue : C.border}`,
        background: selected ? C.blueDim : C.surface,
        borderRadius: 22,
        padding: 18,
        cursor: "pointer",
        boxShadow: selected
          ? `0 12px 26px ${C.blue}18`
          : "0 4px 14px rgba(16,33,20,.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 13,
              background: C.surface,
              border: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            🆔
          </div>

          <div>
            <div style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 15 }}>
              {delivery.delivery_id}
            </div>
            <div style={{ color: C.textMid, fontSize: 12, fontWeight: 700 }}>
              Order {delivery.order_id || "—"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: meta.bg,
            color: meta.color,
            border: `1px solid ${meta.border}`,
            padding: "8px 11px",
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 900,
          }}
        >
          <StatusIcon size={14} /> {meta.label}
        </div>
      </div>

      <div
        style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 18,
          padding: 15,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <InfoLine
            icon={<User size={15} />}
            label="Customer"
            value={delivery.customer_name || delivery.customer_id || "Customer"}
          />
          <InfoLine
            icon={<Phone size={15} />}
            label="Phone"
            value={delivery.customer_phone || "—"}
          />
          <InfoLine
            icon={<MapPin size={15} />}
            label="Address"
            value={fullAddress(delivery) || "—"}
            full
          />
          <InfoLine
            icon={<Package size={15} />}
            label="Order"
            value={`${delivery.batch_id || "Batch"} - ${
              delivery.total_weight_kg
                ? `${n(delivery.total_weight_kg, 2)} kg`
                : delivery.requested_quantity
                ? `${n(delivery.requested_quantity)} chickens`
                : "Quantity not set"
            }`}
          />
          <InfoLine
            icon={<Truck size={15} />}
            label="Vehicle"
            value={delivery.vehicle_no || "Not assigned"}
          />
          <InfoLine
            icon={<Timer size={15} />}
            label="Delivery Date"
            value={
              delivery.delivery_date
                ? new Date(delivery.delivery_date).toLocaleDateString("en-MY")
                : "Today"
            }
          />
        </div>

        <div
          style={{ display: "flex", gap: 9, flexWrap: "wrap", marginTop: 16 }}
          onClick={(e) => e.stopPropagation()}
        >
          <ActionButton
            onClick={onNavigate}
            icon={<Navigation size={14} />}
            label="Open Map"
            color={C.blue}
          />

          {delivery.customer_phone && (
            <a href={`tel:${delivery.customer_phone}`} style={{ textDecoration: "none" }}>
              <ActionButton
                icon={<Phone size={14} />}
                label="Call Customer"
                color={C.greenDark}
              />
            </a>
          )}

          {isAssigned && (
            <ActionButton
              onClick={onStart}
              icon={<Truck size={14} />}
              label={loading ? "Starting..." : "Start Delivery"}
              color={C.amber}
              filled
            />
          )}

          {isOut && (
            <ActionButton
              onClick={onComplete}
              icon={<CheckCircle2 size={14} />}
              label={loading ? "Completing..." : "Complete Delivery"}
              color={C.greenDark}
              filled
            />
          )}

          {isCompleted && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: C.greenDark,
                background: C.greenDim,
                padding: "9px 12px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              ✅ Completed
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function InfoLine({ icon, label, value, full }) {
  return (
    <div
      style={{
        gridColumn: full ? "1 / -1" : "auto",
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
      }}
    >
      <span style={{ color: C.textLight, marginTop: 2 }}>{icon}</span>
      <div>
        <div
          style={{
            fontSize: 10,
            color: C.textLight,
            fontWeight: 900,
            letterSpacing: ".06em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 13,
            color: C.text,
            fontWeight: 800,
            lineHeight: 1.5,
          }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, color, filled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1.5px solid ${color}35`,
        background: filled ? color : `${color}12`,
        color: filled ? "#fff" : color,
        borderRadius: 12,
        padding: "9px 12px",
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontFamily: C.sans,
        fontWeight: 900,
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {icon} {label}
    </button>
  );
}

const refreshBtn = {
  border: `1.5px solid ${C.border}`,
  background: C.surface,
  borderRadius: 14,
  padding: "11px 15px",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontFamily: C.sans,
  fontWeight: 900,
  fontSize: 12,
  color: C.text,
  cursor: "pointer",
};

const mapActionBtn = {
  border: `1.5px solid ${C.green}35`,
  background: C.greenDim,
  color: C.greenDark,
  borderRadius: 12,
  padding: "9px 12px",
  display: "flex",
  alignItems: "center",
  gap: 7,
  fontFamily: C.sans,
  fontWeight: 900,
  fontSize: 12,
  cursor: "pointer",
};

const selectStyle = {
  height: 40,
  border: `1.5px solid ${C.border}`,
  borderRadius: 12,
  padding: "0 12px",
  background: C.bg,
  color: C.text,
  fontFamily: C.sans,
  fontWeight: 800,
  fontSize: 12,
};

const fontStyle = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; }
button:disabled { opacity: .6; cursor: not-allowed !important; }
::-webkit-scrollbar { width: 7px; height: 7px; }
::-webkit-scrollbar-thumb { background: #C8D7C1; border-radius: 10px; }
@media (max-width: 1100px) {
  main > div, main section div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
}
`;
