import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import OwnerDashboard from "./pages/OwnerDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import CustomerPlaceOrder from "./pages/CustomerPlaceOrder";
import CustomerMyOrders from "./pages/CustomerMyOrders";
import CustomerPayment from "./pages/CustomerPayment";
import CustomerPurchaseHistory from "./pages/CustomerPurchaseHistory";
import CustomerProfile from "./pages/CustomerProfile";
import CustomerSupport from "./pages/CustomerSupport";
import BatchManagement from "./pages/BatchManagement";
import OwnerOrderManagement from "./pages/OwnerOrderManagement";
import RoleBasedDashboard from "./pages/RoleBasedDashboard";
import OwnerSales from "./pages/OwnerSales";
import OwnerFeed from "./pages/OwnerFeed";
import OwnerMedication from "./pages/OwnerMedication";
import OwnerMortality from "./pages/OwnerMortality";
import OwnerDelivery from "./pages/OwnerDelivery";
import OwnerCustomer from "./pages/OwnerCustomer";
import OwnerEmployee from "./pages/OwnerEmployee";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import OwnerLayout from "./components/OwnerLayout";
import CustomerLayout from "./components/CustomerLayout";
import WorkerLayout from "./components/WorkerLayout";
import WorkerDashboard from "./pages/WorkerDashboard";
import WorkerBatch from "./pages/WorkerBatch";
import WorkerFeed from "./pages/WorkerFeed";
import WorkerMedication from "./pages/WorkerMedication";
import WorkerMortality from "./pages/WorkerMortality";
import WorkerPickupOrders from "./pages/WorkerPickupOrders";
import WorkerPerformance from "./pages/WorkerPerformance";
import WorkerProfile from "./pages/WorkerProfile";
import DriverLayout from "./components/DriverLayout";
import DriverDashboard from "./pages/DriverDashboard";
import DriverDeliveries from "./pages/DriverDeliveries";
import DriverProfile from "./pages/DriverProfile";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />


        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleBasedDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRoles={["Owner", "OWNER"]}>
              <OwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="batches" element={<BatchManagement />} />
          <Route path="orders" element={<OwnerOrderManagement />} />
          <Route path="sales" element={<OwnerSales />} />
          <Route path="feed" element={<OwnerFeed />} />
          <Route path="medication" element={<OwnerMedication />} />
          <Route path="mortality" element={<OwnerMortality />} />
          <Route path="delivery" element={<OwnerDelivery />} />
          <Route path="customers" element={<OwnerCustomer />} />
          <Route path="employees" element={<OwnerEmployee />} />
        </Route>

        <Route
        path="/customer"
        element={
        <ProtectedRoute allowedRoles={["Customer", "CUSTOMER"]}>
        <CustomerLayout />
        </ProtectedRoute>
        }
        >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="place-order" element={<CustomerPlaceOrder />} />
        <Route path="orders" element={<CustomerMyOrders />} /> 
        <Route path="payments" element={<CustomerPayment />} /> 
        <Route path="history" element={<CustomerPurchaseHistory />} /> 
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="support" element={<CustomerSupport />} />
        </Route>

        <Route
        path="/driver"
        element={
        <ProtectedRoute allowedRoles={["Driver", "DRIVER"]}>
        <DriverLayout />
        </ProtectedRoute>
        }
        >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DriverDashboard />} />
        <Route path="deliveries" element={<DriverDeliveries />} />
        <Route path="profile" element={<DriverProfile />} />
        
      </Route>

        <Route
        path="/worker"
        element={
        <ProtectedRoute allowedRoles={["Farm Worker", "FARM WORKER"]}>
        <WorkerLayout />
        </ProtectedRoute>
        }
        >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<WorkerDashboard />} />
        <Route path="batches" element={<WorkerBatch />} />
        <Route path="feed" element={<WorkerFeed />} />
        <Route path="medications" element={<WorkerMedication/>} />
        <Route path="mortality" element={<WorkerMortality/>} />
        <Route path="pickup-orders" element={<WorkerPickupOrders />}/>
        <Route path="performance" element={<WorkerPerformance/>} />
        <Route path="profile" element={<WorkerProfile/>} />
        </Route>
        
       <Route path="/unauthorized" element={<Unauthorized />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;