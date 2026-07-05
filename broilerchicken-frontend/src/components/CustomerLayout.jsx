import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PackageSearch,
  ShoppingCart,
  ClipboardList,
  Truck,
  CreditCard,
  History,
  User,
  MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";

function CustomerLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const name = sessionStorage.getItem("name") || "Customer";
  const role = sessionStorage.getItem("role") || "Customer";

  const sidebarItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/customer/dashboard" },
    { name: "Place Order", icon: ShoppingCart, path: "/customer/place-order" },
    { name: "My Orders", icon: ClipboardList, path: "/customer/orders" },
    { name: "Payments", icon: CreditCard, path: "/customer/payments" },
    { name: "Purchase History", icon: History, path: "/customer/history" },
    { name: "Profile", icon: User, path: "/customer/profile" },
    { name: "Support", icon: MessageCircle, path: "/customer/support" },
  ];

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        background: "#F6F8F3",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* ===== SIDEBAR ===== */}
      <div
        style={{
          width: "260px",
          background: "#102114",
          color: "#fff",
          padding: "28px 20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          {/* ===== LOGO ===== */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "32px",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                background: "#4CAF50",
                borderRadius: "50% 10% 50% 10%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              🐔
            </div>

            <div>
              <div
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: "18px",
                }}
              >
                AyamTech
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)" }}>
                Customer Portal
              </div>
            </div>
          </div>

          {/* ===== SIDEBAR MENU ===== */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <motion.div
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  whileHover={{
                    x: 6,
                    backgroundColor: isActive ? "#4CAF50" : "#1F3D2B",
                  }}
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
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon size={18} />
                  {item.name}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* ===== USER CARD + LOGOUT ===== */}
        <div>
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "14px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "rgba(255,255,255,0.6)",
                marginBottom: "4px",
              }}
            >
              Logged in as
            </div>
            <div style={{ fontWeight: 700, fontSize: "14px" }}>{name}</div>
            <div style={{ fontSize: "12px", color: "#A8D58A", marginTop: "4px" }}>
              {role}
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              height: "46px",
              border: "none",
              borderRadius: "12px",
              background: "#4CAF50",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div style={{ flex: 1 }}>
        <Outlet />
      </div>
    </div>
  );
}

export default CustomerLayout;