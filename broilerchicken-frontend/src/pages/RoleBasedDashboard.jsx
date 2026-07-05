import { Navigate } from "react-router-dom";

function RoleBasedDashboard() {
  const role = sessionStorage.getItem("role");

  if (role === "Owner" || role === "OWNER") {
    return <Navigate to="/owner/dashboard" replace />;
  }

  if (role === "Customer" || role === "CUSTOMER") {
    return <Navigate to="/customer/dashboard" replace />;
  }

  if (role === "Driver" || role === "DRIVER") {
    return <Navigate to="/driver/deliveries" replace />;
  }

  if (role === "Farm Worker" || role === "FARM WORKER") {
    return <Navigate to="/worker/dashboard" replace />;
  }

  return <Navigate to="/unauthorized" replace />;
}

export default RoleBasedDashboard;