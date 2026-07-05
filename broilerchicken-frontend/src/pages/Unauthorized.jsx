import { useNavigate } from "react-router-dom";

function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F6F8F3", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ background: "#fff", padding: "32px", borderRadius: "18px", boxShadow: "0 10px 30px rgba(17, 24, 39, 0.05)", textAlign: "center", maxWidth: "420px" }}>
        <div style={{ fontSize: "28px", fontWeight: 800, color: "#102114", marginBottom: "10px" }}>Unauthorized</div>
        <div style={{ color: "#6E8A72", marginBottom: "20px" }}>You do not have permission to access this page.</div>
        <button onClick={() => navigate("/dashboard")} style={{ height: "46px", padding: "0 18px", borderRadius: "12px", border: "none", background: "#4CAF50", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
          Go Back
        </button>
      </div>
    </div>
  );
}

export default Unauthorized;