import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";

function ForgotPassword() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await API.patch("/auth/forgot-password", {
        username,
        email,
        newPassword,
        confirmPassword,
      });

      setMessage(res.data.message);

      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F6F8F3",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "500px",
          background: "#fff",
          borderRadius: "20px",
          padding: "35px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.08)",
        }}
      >
        <h1
          style={{
            marginBottom: "8px",
            color: "#1A3A2A",
            fontSize: "30px",
            fontWeight: "700",
          }}
        >
          Forgot Password
        </h1>

        <p
          style={{
            color: "#6B7280",
            marginBottom: "25px",
            fontSize: "14px",
          }}
        >
          Enter your username or email and create a new password.
        </p>

        {message && (
          <div
            style={{
              background: "#DCFCE7",
              color: "#166534",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "15px",
            }}
          >
            {message}
          </div>
        )}

        {error && (
          <div
            style={{
              background: "#FEE2E2",
              color: "#991B1B",
              padding: "12px",
              borderRadius: "10px",
              marginBottom: "15px",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleResetPassword}>
          <input
            type="text"
            placeholder="Username (optional)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle}
          />

          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "48px",
              background: "#4CAF50",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "10px",
            }}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <button
          onClick={() => navigate("/")}
          style={{
            width: "100%",
            height: "48px",
            marginTop: "12px",
            border: "1px solid #D1D5DB",
            background: "#fff",
            borderRadius: "12px",
            cursor: "pointer",
            color: "#1A3A2A",
            fontWeight: "600",
          }}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  height: "48px",
  padding: "0 14px",
  marginBottom: "14px",
  border: "1px solid #D4E8C2",
  borderRadius: "12px",
  fontSize: "14px",
  outline: "none",
};

export default ForgotPassword;