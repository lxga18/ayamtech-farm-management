import { useState, useEffect } from "react";
import API from "../api/axios";
import { motion } from "framer-motion";
import { ShoppingCart, Truck, Wallet, PackageCheck, Clock, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const normalizeDeliveryStatus = (status) => {
  const value = String(status || "").toLowerCase().trim();

  if (value === "assigned") return "Assigned";
  if (value === "out of delivery" || value === "out for delivery") return "Out for Delivery";
  if (value === "completed") return "Completed";

  return "Not Assigned";
};

const formatDateOnly = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().split("T")[0];
};

const formatDateTime = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;

  return d.toLocaleString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const mapDashboardOrder = (order) => ({
  id: order.order_id,
  date: formatDateOnly(order.order_date),
  requestedDate: formatDateOnly(order.requested_delivery_date),
  deliveryDate: formatDateOnly(order.delivery_date || order.requested_delivery_date),
  orderDateRaw: order.order_date,
  requestedDeliveryDateRaw: order.requested_delivery_date,
  deliveryDateRaw: order.delivery_date,
  assignedAt: order.assigned_at,
  outForDeliveryAt: order.out_for_delivery_at,
  completedAt: order.completed_at,
  qty: `${order.requested_quantity} chickens`,
  amount: `RM ${(
    Number(order.total_amount || 0) +
    (order.delivery_type === "Delivery" ? 25 : 0)
  ).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`,
  orderStatus: order.order_status || "Pending",
  deliveryStatus: normalizeDeliveryStatus(order.delivery_status),
  driver: order.driver_name || "Not assigned",
  vehicle: order.vehicle_no || "—",
  deliveryType: order.delivery_type || "Delivery",
});

const buildDeliveryTimeline = (order) => {
  if (!order) {
    return [
      { label: "Order Placed", time: "No active delivery", done: false, active: false },
      { label: "Delivery Assigned", time: "Waiting assignment", done: false, active: false },
      { label: "Out for Delivery", time: "Waiting driver update", done: false, active: false },
      { label: "Completed", time: "Waiting completion", done: false, active: false },
    ];
  }

  const status = normalizeDeliveryStatus(order.deliveryStatus);

  const isAssigned = status === "Assigned";
  const isOut = status === "Out for Delivery";
  const isCompleted = status === "Completed";

  const hasAssigned = isAssigned || isOut || isCompleted || !!order.assignedAt;
  const hasOut = isOut || isCompleted || !!order.outForDeliveryAt;

  return [
    {
      label: "Order Placed",
      time: formatDateTime(order.orderDateRaw) || order.date,
      done: true,
      active: false,
    },
    {
      label: "Delivery Assigned",
      time: hasAssigned
        ? formatDateTime(order.assignedAt) || `Driver: ${order.driver}`
        : "Waiting assignment",
      done: hasOut || isCompleted,
      active: !hasOut,
    },
    {
      label: "Out for Delivery",
      time: hasOut
        ? formatDateTime(order.outForDeliveryAt) || "Driver started delivery"
        : "Waiting driver update",
      done: isCompleted,
      active: isOut,
    },
    {
      label: "Completed",
      time: isCompleted
        ? formatDateTime(order.completedAt) || "Delivery completed"
        : "Waiting completion",
      done: isCompleted,
      active: false,
    },
  ];
};

function CustomerDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const navigate = useNavigate();
const customerId = sessionStorage.getItem("customer_id");

useEffect(() => {
  document.title = "Customer Portal";

  const favicon = document.querySelector("#favicon");
  if (favicon) {
    favicon.href = "/customer.png";
  }

  API.get(`/customer/dashboard/${customerId}`)
    .then((res) => setDashboardData(res.data))
    .catch((err) => console.error("Dashboard error:", err));
}, [customerId]);
  if (!dashboardData) return <div style={page}>Loading dashboard...</div>;

  const stats = [
    { title: "Total Orders", value: dashboardData.stats.total_orders, sub: "All orders placed", icon: ShoppingCart, color: "#3B82F6", bg: "#EFF6FF" },
    { title: "Pending Orders", value: dashboardData.stats.pending_orders, sub: "Waiting approval", icon: Clock, color: "#F59E0B", bg: "#FFF7ED" },
    { title: "Completed", value: dashboardData.stats.completed_orders, sub: "Successfully received", icon: PackageCheck, color: "#4CAF50", bg: "#EAF7E3" },
    { title: "Total Spent", value: `RM ${Number(dashboardData.stats.total_spent).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: "Purchase amount", icon: Wallet, color: "#8B5CF6", bg: "#F5F3FF" },
  ];

  const batches = dashboardData.batches.map(batch => ({
    id: batch.batch_id,
    type: batch.notes,
    weight: `${Number(batch.avg_weight_kg).toFixed(1)} kg avg`,
    price: `RM ${Number(batch.price_per_kg).toFixed(2)}/kg`,
    available: `${batch.total_chicks} chickens`,
    status: batch.batch_status === "Ready for Sale" ? "Available" : "Limited",
  }));

const orders = dashboardData.orders.map(mapDashboardOrder);

const latestOrder = dashboardData.active_delivery
  ? mapDashboardOrder(dashboardData.active_delivery)
  : orders.find((o) => o.deliveryType === "Delivery" && o.orderStatus !== "Completed" && o.orderStatus !== "Cancelled")
    || orders[0]
    || null;

const status = latestOrder?.deliveryStatus || "Not Assigned";

const trackingSteps = buildDeliveryTimeline(latestOrder);

  return (
    <div style={page}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div style={{ marginBottom: "28px" }}><div style={title}>Customer Dashboard</div><div style={subtitle}>Browse live chickens, track your orders and manage deliveries.</div></div>

        <div style={kpiGrid}>{stats.map((item, index) => { const Icon = item.icon; return <motion.div key={item.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }} style={card}><div style={statTop}><div><div style={statLabel}>{item.title}</div><div style={statValue}>{item.value}</div><div style={{ ...statSub, color: item.color }}>{item.sub}</div></div><div style={{ ...iconBox, background: item.bg }}><Icon size={20} color={item.color} /></div></div></motion.div>; })}</div>

        <div style={mainGrid}>
          <div style={card}>
            <div style={sectionHeader}><div><div style={sectionTitle}>Available Chickens</div><div style={sectionSub}>Choose available batches for ordering</div></div><button onClick={() => navigate("/customer/place-order")} style={greenButton}>Place Order</button></div>
            <div style={batchGrid}>{batches.map(batch => <div key={batch.id} style={batchCard}><div style={{ ...batchBadge, background: batch.status === "Limited" ? "#FFF3D9" : "#EAF7E3", color: batch.status === "Limited" ? "#B7791F" : "#3A7D1C" }}>{batch.status}</div><div style={{ fontWeight: 800, fontSize: "16px", color: "#102114" }}>{batch.id}</div><div style={{ fontSize: "13px", color: "#6E8A72", marginBottom: "14px" }}>{batch.type}</div><div style={infoRow}><span>Avg Weight</span><b>{batch.weight}</b></div><div style={infoRow}><span>Price</span><b>{batch.price}</b></div><div style={infoRow}><span>Stock</span><b>{batch.available}</b></div></div>)}</div>
          </div>

          <div style={card}>
            <div style={sectionTitle}>Upcoming Delivery</div><div style={sectionSub}>Your next scheduled delivery</div>
            <div style={deliveryBox}>
            <div style={deliveryIcon}>
              <Truck size={26} color="#4CAF50" />
            </div>

            <div style={{ fontWeight: 800, fontSize: "18px", color: "#102114" }}>
              {latestOrder?.id || "No Active Delivery"}
            </div>

            <div style={{ color: "#6E8A72", fontSize: "13px", marginTop: "4px" }}>
              {latestOrder ? "Current Customer Delivery" : "No delivery scheduled"}
            </div>

            <div style={deliveryDetails}>
              <div style={detailRow}>
                <span>Date</span>
                <b>{latestOrder?.deliveryDate || latestOrder?.requestedDate || "—"}</b>
              </div>

              <div style={detailRow}>
                <span>Order Status</span>
                <b>{latestOrder?.orderStatus || "—"}</b>
              </div>

              <div style={detailRow}>
                <span>Delivery Status</span>
                <b style={{ color: status === "Completed" ? "#3A7D1C" : "#F59E0B" }}>
                  {status}
                </b>
              </div>

              <div style={detailRow}>
                <span>Driver</span>
                <b>{latestOrder?.driver === "Not assigned" ? "—" : latestOrder?.driver || "—"}</b>
              </div>

              <div style={detailRow}>
                <span>Vehicle</span>
                <b>{latestOrder?.vehicle || "—"}</b>
              </div>
            </div>
          </div>
          </div>
        </div>

        <div style={{ ...card, marginBottom: "24px" }}>
          <div style={sectionHeader}><div><div style={sectionTitle}>Order Tracking</div><div style={sectionSub}>Tracking based on real delivery status</div></div><div style={{ display: "flex", alignItems: "center", gap: "8px" }}><div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B", animation: "pulse 1.5s infinite" }} /><span style={{ fontSize: "13px", color: "#B7791F", fontWeight: 600 }}>{status}</span><span style={{ fontSize: "13px", color: "#9AA89B" }}>· {latestOrder?.id || "—"}</span></div></div>
          <div style={{ background: "#F9FCF6", borderRadius: "16px", padding: "18px" }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#70836B", marginBottom: "16px" }}>Delivery Progress</div>
            {trackingSteps.map((step, i) => <div key={step.label} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}><div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "28px", flexShrink: 0 }}><div style={{ width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, flexShrink: 0, background: step.done ? "#EAF7E3" : step.active ? "#FFF3D9" : "#F0F4EC", color: step.done ? "#3A7D1C" : step.active ? "#B7791F" : "#9AA89B", border: step.active ? "2px solid #F59E0B" : "2px solid transparent", boxSizing: "border-box" }}>{step.done ? "✓" : step.active ? "→" : i + 1}</div>{i < trackingSteps.length - 1 && <div style={{ width: "2px", height: "28px", background: step.done ? "#4CAF50" : "#E5EDE0", margin: "3px 0" }} />}</div><div style={{ paddingTop: "4px" }}><div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "2px", color: step.done ? "#102114" : step.active ? "#B7791F" : "#9AA89B" }}>{step.label}</div><div style={{ fontSize: "11px", marginBottom: "18px", color: step.active ? "#F59E0B" : "#9AA89B" }}>{step.time}</div></div></div>)}
          </div>
        </div>

        <div style={card}>
          <div style={sectionHeader}><div><div style={sectionTitle}>Recent Orders</div><div style={sectionSub}>Latest chicken purchase records</div></div><button style={lightButton} onClick={() => navigate("/customer/orders")}>View All <ChevronRight size={15} /></button></div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr style={{ textAlign: "left", color: "#7F8C81", fontSize: "12px" }}><th style={th}>Order ID</th><th style={th}>Date</th><th style={th}>Quantity</th><th style={th}>Amount</th><th style={th}>Order Status</th><th style={th}>Delivery Status</th></tr></thead><tbody>{orders.map(order => <tr key={order.id} style={{ borderTop: "1px solid #EFF3EA" }}><td style={tdBold}>{order.id}</td><td style={td}>{order.date}</td><td style={td}>{order.qty}</td><td style={tdBold}>{order.amount}</td><td style={td}><span style={{ ...statusBadge, background: order.orderStatus === "Completed" ? "#EAF7E3" : "#FFF3D9", color: order.orderStatus === "Completed" ? "#3A7D1C" : "#B7791F" }}>{order.orderStatus}</span></td><td style={td}><span style={{ ...statusBadge, background: order.deliveryStatus === "Completed" ? "#EAF7E3" : "#FFF3D9", color: order.deliveryStatus === "Completed" ? "#3A7D1C" : "#B7791F" }}>{order.deliveryStatus}</span></td></tr>)}</tbody></table>
        </div>
      </motion.div>
    </div>
  );
}

const page={padding:"32px",background:"#F6F8F3",minHeight:"100vh",fontFamily:"'Inter', sans-serif"}; const title={fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:"30px",fontWeight:800,color:"#102114"}; const subtitle={color:"#6E8A72",fontSize:"14px",marginTop:"4px"}; const kpiGrid={display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:"16px",marginBottom:"24px"}; const card={background:"#fff",borderRadius:"22px",padding:"22px",boxShadow:"0 10px 30px rgba(17,24,39,0.05)"}; const statTop={display:"flex",justifyContent:"space-between",alignItems:"flex-start"}; const statLabel={fontSize:"13px",color:"#70836B",marginBottom:"10px"}; const statValue={fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:"28px",fontWeight:800,color:"#102114",marginBottom:"6px",whiteSpace:"nowrap"}; const statSub={fontSize:"12px",fontWeight:600}; const iconBox={width:"38px",height:"38px",borderRadius:"12px",display:"flex",alignItems:"center",justifyContent:"center"}; const mainGrid={display:"grid",gridTemplateColumns:"1.4fr 1fr",gap:"20px",marginBottom:"24px"}; const sectionHeader={display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"}; const sectionTitle={fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:"20px",fontWeight:800,color:"#102114"}; const sectionSub={fontSize:"12px",color:"#6E8A72",marginTop:"3px"}; const greenButton={height:"40px",padding:"0 16px",borderRadius:"12px",border:"none",background:"#4CAF50",color:"#fff",fontWeight:700,cursor:"pointer"}; const lightButton={height:"38px",padding:"0 14px",borderRadius:"12px",border:"1px solid #DDE8D7",background:"#F9FCF6",color:"#244128",fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:"6px"}; const batchGrid={display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"14px"}; const batchCard={background:"#F9FCF6",borderRadius:"18px",padding:"16px",border:"1px solid #E5EDE0"}; const batchBadge={display:"inline-block",padding:"4px 10px",borderRadius:"999px",fontSize:"11px",fontWeight:700,marginBottom:"12px"}; const infoRow={display:"flex",justifyContent:"space-between",fontSize:"12px",color:"#6E8A72",marginBottom:"8px"}; const deliveryBox={marginTop:"18px",background:"#F9FCF6",borderRadius:"18px",padding:"20px",textAlign:"center"}; const deliveryIcon={width:"54px",height:"54px",borderRadius:"16px",background:"#EAF7E3",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"}; const deliveryDetails={marginTop:"18px",display:"flex",flexDirection:"column",gap:"8px",fontSize:"12px",color:"#6E8A72"}; const detailRow={display:"flex",justifyContent:"space-between"}; const th={padding:"10px 0",fontWeight:700}; const td={padding:"14px 0",color:"#4B5E4F",fontSize:"14px"}; const tdBold={padding:"14px 0",color:"#102114",fontSize:"14px",fontWeight:700}; const statusBadge={padding:"5px 10px",borderRadius:"999px",fontSize:"12px",fontWeight:700};

export default CustomerDashboard;