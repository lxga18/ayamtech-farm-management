import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Boxes, ShoppingCart, DollarSign, Wheat,
  Pill, AlertTriangle, Truck, Users, BarChart3, UserRoundCog
} from "lucide-react";
import { motion } from "framer-motion";

function OwnerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const name = sessionStorage.getItem("name") || "Farm Owner";
  const role = sessionStorage.getItem("role") || "Owner";

  const sidebarItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/owner/dashboard" },
    { name: "Batch Management", icon: Boxes, path: "/owner/batches" },
    { name: "Orders", icon: ShoppingCart, path: "/owner/orders" },
    { name: "Sales", icon: DollarSign, path: "/owner/sales" },
    { name: "Feed Usage", icon: Wheat, path: "/owner/feed" },
    { name: "Medication", icon: Pill, path: "/owner/medication" },
    { name: "Mortality", icon: AlertTriangle, path: "/owner/mortality" },
    { name: "Delivery", icon: Truck, path: "/owner/delivery" },
    { name: "Customers", icon: Users, path: "/owner/customers" },
    { name: "Employees", icon: UserRoundCog, path: "/owner/employees" },
  ];

  const handleLogout = () => {
   sessionStorage.clear();
    navigate("/");
  };

  return (
    <div style={{ minHeight: "100vh", width: "100%", display: "flex", background: "#F6F8F3", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: "260px", background: "#0F2318", color: "#fff", padding: "28px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", flexShrink: 0 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
            <div style={{ width: "36px", height: "36px", background: "#639922", borderRadius: "50% 10% 50% 10%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2-8 8" /></svg>
            </div>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: "18px" }}>AyamTech</div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>Owner Portal</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <motion.div
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  whileHover={{ x: 6, backgroundColor: isActive ? "#4CAF50" : "#1F3D2B" }}
                  transition={{ type: "spring", stiffness: 300 }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: "12px",
                    backgroundColor: isActive ? "#4CAF50" : "transparent",
                    color: isActive ? "#fff" : "rgba(255,255,255,0.78)",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "all 0.2s ease"
                  }}
                >
                  <Icon size={18} />
                  {item.name}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div>
          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "14px", marginBottom: "14px" }}>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>Logged in as</div>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>{name}</div>
            <div style={{ fontSize: "12px", color: "#A8D58A", marginTop: "4px" }}>{role}</div>
          </div>

          <button onClick={handleLogout} style={{ width: "100%", height: "46px", border: "none", borderRadius: "12px", background: "#4CAF50", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default OwnerLayout;