import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import API from "../api/axios";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [fpUsername, setFpUsername] = useState("");
  const [fpEmail, setFpEmail] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpMessage, setFpMessage] = useState("");
  const [fpError, setFpError] = useState("");
  const [fpShowNew, setFpShowNew] = useState(false);
  const [fpShowConfirm, setFpShowConfirm] = useState(false);
  const [fpPasswordStrength, setFpPasswordStrength] = useState(0);
  const [fpPasswordErrors, setFpPasswordErrors] = useState([]);

  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const rotateX = useTransform(rotateXRaw, [-10, 10], [10, -10]);
  const rotateY = useTransform(rotateYRaw, [-10, 10], [-10, 10]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    rotateYRaw.set(((x / width) - 0.5) * 8);
    rotateXRaw.set(((y / height) - 0.5) * 8);
  };

  const handleMouseLeave = () => {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
  };

  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 8) errors.push("At least 8 characters");
    if (!/[A-Z]/.test(pwd)) errors.push("One uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("One lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("One number");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errors.push("One special character");
    return errors;
  };

  const calculateStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++;
    return strength;
  };

  const handleFpPasswordChange = (e) => {
    const pwd = e.target.value;
    setFpNewPassword(pwd);
    setFpPasswordStrength(calculateStrength(pwd));
    setFpPasswordErrors(validatePassword(pwd));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", { username, password });
      sessionStorage.setItem("token", res.data.token);
      sessionStorage.setItem("name", res.data.name);
      sessionStorage.setItem("role", res.data.role);
      sessionStorage.setItem("username", res.data.username);
      sessionStorage.setItem("user_id", res.data.user_id);
      sessionStorage.setItem("customer_id", res.data.customer_id || "");
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Unable to login. Please check server connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    // Validate password before submission
    const errors = validatePassword(fpNewPassword);
    if (errors.length > 0) {
      setFpError("Password must meet all requirements");
      setFpPasswordErrors(errors);
      return;
    }

    setFpLoading(true);
    setFpError("");
    setFpMessage("");

    try {
      const res = await API.patch("/auth/forgot-password", {
        username: fpUsername,
        email: fpEmail,
        newPassword: fpNewPassword,
        confirmPassword: fpConfirmPassword,
      });
      setFpMessage(res.data.message);
      setTimeout(() => {
        setShowForgotModal(false);
        resetForgotForm();
      }, 2000);
    } catch (err) {
      setFpError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to reset password."
      );
    } finally {
      setFpLoading(false);
    }
  };

  const resetForgotForm = () => {
    setFpUsername("");
    setFpEmail("");
    setFpNewPassword("");
    setFpConfirmPassword("");
    setFpMessage("");
    setFpError("");
    setFpShowNew(false);
    setFpShowConfirm(false);
    setFpPasswordStrength(0);
    setFpPasswordErrors([]);
  };

  const openForgot = () => {
    resetForgotForm();
    setShowForgotModal(true);
  };
  const closeForgot = () => {
    setShowForgotModal(false);
    resetForgotForm();
  };

  const panelVariants = {
    hidden: { opacity: 0, x: 70, scale: 0.96 },
    visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] } })
  };

  // Password strength colors
  const strengthColors = ["#EF4444", "#F59E0B", "#FBBF24", "#34D399", "#4CAF50"];
  const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Excellent"];

  const fpInputStyle = {
    width: "100%",
    height: "46px",
    border: "none",
    background: "transparent",
    fontSize: "14px",
    color: "#1A3A2A",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    flex: 1,
  };

  const fpFieldStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    height: "46px",
    background: "#fff",
    border: "1.5px solid #D4E8C2",
    borderRadius: "12px",
    padding: "0 14px",
    marginBottom: "14px",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
  };

  return (
    <div style={{ position: "relative", minHeight: "100vh", fontFamily: "'Inter', sans-serif", overflow: "hidden", background: "#09140d" }}>
      <motion.video autoPlay loop muted playsInline initial={{ scale: 1.08 }} animate={{ scale: 1.03 }} transition={{ duration: 5, ease: "easeOut" }} style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", objectFit: "cover", zIndex: 0 }}>
        <source src="/farm-video.mp4" type="video/mp4" />
      </motion.video>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} style={{ position: "fixed", inset: 0, background: "linear-gradient(90deg, rgba(7,16,10,0.48) 0%, rgba(7,16,10,0.28) 35%, rgba(7,16,10,0.22) 100%)", zIndex: 1 }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(circle at center, rgba(255,255,255,0.02) 0%, rgba(0,0,0,0.24) 100%)", zIndex: 1, pointerEvents: "none" }} />

      <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} style={{ position: "relative", zIndex: 2, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "40px 64px", gap: "40px" }}>
        <div style={{ flex: 1, maxWidth: "540px", color: "#fff", alignSelf: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "999px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", marginBottom: "24px", backdropFilter: "blur(6px)" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#7ED957", boxShadow: "0 0 16px rgba(126,217,87,0.8)" }} />
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.82)" }}>Broiler chicken farm management</span>
          </div>

          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "56px", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.03em", marginBottom: "18px", textShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>
            Precision in<br />every flock.
          </div>

          <div style={{ maxWidth: "460px", fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.76)" }}>
            Monitor operations, track productivity, and manage broiler farm performance through one clean, system.
          </div>
        </div>

        <div style={{ flexShrink: 0, width: "100%", maxWidth: "440px", display: "flex", justifyContent: "center", perspective: "1400px" }}>
          <motion.div variants={panelVariants} initial="hidden" animate="visible" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ width: "100%", position: "relative", borderRadius: "22px", background: "rgba(255,255,255,0.94)", boxShadow: "0 30px 80px rgba(0,0,0,0.26), 0 8px 30px rgba(0,0,0,0.16)", padding: "36px 32px 24px", backdropFilter: "blur(12px)", transformStyle: "preserve-3d", rotateX, rotateY, zIndex: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.42)" }}>
            <motion.div initial={{ x: "-130%", opacity: 0 }} animate={{ x: "140%", opacity: [0, 0.32, 0] }} transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.2 }} style={{ position: "absolute", top: "-20%", left: 0, width: "45%", height: "140%", transform: "rotate(18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0) 100%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: "-80px", right: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(126,217,87,0.11)", filter: "blur(50px)", pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 2 }}>
              <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.12} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "28px", fontWeight: 800, color: "#0F1F0A", marginBottom: "6px" }}>AyamTech</motion.div>
              <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.2} style={{ fontSize: "13px", color: "#7A9A6A", marginBottom: "28px" }}>Access your farm management dashboard</motion.div>

              {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#FEE2E2", border: "0.5px solid #FCA5A5", color: "#B91C1C", fontSize: "12px", padding: "9px 12px", borderRadius: "8px", marginBottom: "16px" }}>{error}</motion.div>}

              <form onSubmit={handleLogin}>
                <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.28}>
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "7px" }}>Username</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "48px", background: "#fff", border: "1.5px solid #D4E8C2", borderRadius: "12px", padding: "0 14px", marginBottom: "18px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                    <input type="text" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ flex: 1, border: "none", background: "transparent", fontSize: "14px", color: "#1A3A2A", fontFamily: "'Inter', sans-serif", outline: "none" }} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.36}>
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "7px" }}>Password</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "48px", background: "#fff", border: "1.5px solid #D4E8C2", borderRadius: "12px", padding: "0 14px", marginBottom: "18px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ flex: 1, border: "none", background: "transparent", fontSize: "14px", color: "#1A3A2A", fontFamily: "'Inter', sans-serif", outline: "none" }} />
                    <svg onClick={() => setShowPassword(!showPassword)} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0, cursor: "pointer" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.44} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: "#5A7A4A", cursor: "pointer" }}>
                    <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} style={{ width: "16px", height: "16px", accentColor: "#1A3A2A" }} />
                    Remember me
                  </label>
                  <span onClick={openForgot} style={{ fontSize: "13px", color: "#639922", cursor: "pointer", fontWeight: 500 }}>Forgot password?</span>
                </motion.div>

                <motion.button variants={itemVariants} initial="hidden" animate="visible" custom={0.52} whileHover={{ scale: 1.02, boxShadow: "0 14px 30px rgba(76,175,80,0.28)" }} whileTap={{ scale: 0.985 }} type="submit" disabled={loading} style={{ width: "100%", height: "50px", background: loading ? "#388E3C" : "#4CAF50", border: "none", borderRadius: "12px", color: "#fff", fontSize: "15px", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "18px" }}>
                  {loading ? "Logging in..." : "Log In"}
                  {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
                </motion.button>
              </form>

              <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.6} style={{ textAlign: "center", fontSize: "13px", color: "#9CA3AF" }}>
                New to AyamTech? <span onClick={() => navigate("/register")} style={{ color: "#639922", fontWeight: 600, cursor: "pointer" }}>Register as new customer</span>
              </motion.div>

              <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.68} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "18px", borderTop: "1px solid #F0F0F0", marginTop: "22px", gap: "10px", flexWrap: "wrap" }}>
                <div style={{ fontSize: "11px", color: "#B4C4A4", lineHeight: 1.5 }}>© 2026 AyamTech.<br />Precision in every flock.</div>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "11px", color: "#B4C4A4", cursor: "pointer" }}>Privacy Policy</span>
                  <span style={{ fontSize: "11px", color: "#B4C4A4", cursor: "pointer" }}>Terms of Service</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#7A9A6A", cursor: "pointer" }}>
                  <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "#EEF4E8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#639922" }}>?</div>
                  Support
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Forgot Password Modal ── */}
      <AnimatePresence>
        {showForgotModal && (
          <>
            {/* Backdrop */}
            <motion.div
              key="fp-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeForgot}
              style={{
                position: "fixed", inset: 0, zIndex: 50,
                background: "rgba(7, 16, 10, 0.65)",
                backdropFilter: "blur(6px)",
              }}
            />

            {/* Modal panel */}
            <motion.div
              key="fp-modal"
              initial={{ opacity: 0, scale: 0.88, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 24 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "fixed", inset: 0, zIndex: 51,
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "20px",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: "100%", maxWidth: "440px",
                  background: "rgba(255,255,255,0.97)",
                  borderRadius: "22px",
                  padding: "32px 30px 28px",
                  boxShadow: "0 40px 100px rgba(0,0,0,0.30), 0 8px 30px rgba(0,0,0,0.12)",
                  border: "1px solid rgba(212, 232, 194, 0.6)",
                  pointerEvents: "auto",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Decorative blob */}
                <div style={{ position: "absolute", top: "-60px", right: "-30px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(126,217,87,0.09)", filter: "blur(40px)", pointerEvents: "none" }} />

                {/* Close button */}
                <button
                  onClick={closeForgot}
                  style={{
                    position: "absolute", top: "18px", right: "18px",
                    width: "32px", height: "32px",
                    borderRadius: "50%",
                    background: "#F3F4F6",
                    border: "none", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#6B7280",
                    fontSize: "16px", lineHeight: 1,
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#E5E7EB"}
                  onMouseLeave={e => e.currentTarget.style.background = "#F3F4F6"}
                >
                  ✕
                </button>

                {/* Icon badge */}
                <div style={{
                  width: "46px", height: "46px", borderRadius: "14px",
                  background: "linear-gradient(135deg, #EEF9E6 0%, #D4E8C2 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "16px",
                  boxShadow: "0 2px 8px rgba(99,153,34,0.15)",
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>

                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "22px", fontWeight: 800, color: "#0F1F0A", marginBottom: "5px" }}>Reset Password</div>
                <div style={{ fontSize: "13px", color: "#7A9A6A", marginBottom: "22px", lineHeight: 1.5 }}>Provide your username or email, then set a new password.</div>

                {/* Success */}
                <AnimatePresence>
                  {fpMessage && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ background: "#DCFCE7", color: "#166534", padding: "11px 14px", borderRadius: "10px", marginBottom: "14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                      {fpMessage}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {fpError && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      style={{ background: "#FEE2E2", color: "#991B1B", padding: "11px 14px", borderRadius: "10px", marginBottom: "14px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#991B1B" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                      {fpError}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleForgotPassword}>
                  {/* Username */}
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "6px" }}>Username <span style={{ color: "#B4C4A4", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                  <div style={fpFieldStyle}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                    <input type="text" placeholder="Your username" value={fpUsername} onChange={e => setFpUsername(e.target.value)} style={fpInputStyle} />
                  </div>

                  {/* Email */}
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "6px" }}>Email <span style={{ color: "#B4C4A4", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span></label>
                  <div style={fpFieldStyle}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 7 10-7" /></svg>
                    <input type="email" placeholder="your@email.com" value={fpEmail} onChange={e => setFpEmail(e.target.value)} style={fpInputStyle} />
                  </div>

                  {/* Divider */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0 16px" }}>
                    <div style={{ flex: 1, height: "1px", background: "#EEF4E8" }} />
                    <span style={{ fontSize: "11px", color: "#B4C4A4", whiteSpace: "nowrap" }}>new credentials</span>
                    <div style={{ flex: 1, height: "1px", background: "#EEF4E8" }} />
                  </div>

                  {/* New Password */}
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "6px" }}>New Password</label>
                  <div style={fpFieldStyle}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    <input type={fpShowNew ? "text" : "password"} placeholder="Min. 8 chars with uppercase, number & special" value={fpNewPassword} onChange={handleFpPasswordChange} required style={fpInputStyle} />
                    <svg onClick={() => setFpShowNew(!fpShowNew)} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0, cursor: "pointer" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  </div>

                  {/* Password strength indicator for forgot password */}
                  {fpNewPassword && (
                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div key={i} style={{
                            flex: 1,
                            height: "3px",
                            borderRadius: "99px",
                            background: i < fpPasswordStrength ? strengthColors[fpPasswordStrength - 1] : "#E5EDE0",
                            transition: "all 0.3s ease",
                          }} />
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: strengthColors[fpPasswordStrength - 1] || "#BEC9BB" }}>
                          {fpPasswordStrength > 0 ? strengthLabels[fpPasswordStrength - 1] : "Enter password"}
                        </span>
                        <span style={{ fontSize: "10px", color: "#BEC9BB" }}>
                          {fpPasswordStrength}/5
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Password requirements list for forgot password */}
                  {fpNewPassword && fpPasswordErrors.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginBottom: "14px", overflow: "hidden" }}>
                      <div style={{ fontSize: "10px", color: "#BEC9BB", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Requirements</div>
                      {["At least 8 characters", "One uppercase letter", "One lowercase letter", "One number", "One special character"].map((req, i) => {
                        const isMet = !fpPasswordErrors.includes(req);
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 0", fontSize: "11px", color: isMet ? "#4CAF50" : "#BEC9BB" }}>
                            <span style={{ fontSize: isMet ? "12px" : "10px" }}>{isMet ? "✅" : "⬜"}</span>
                            <span style={{ textDecoration: isMet ? "none" : "line-through", opacity: isMet ? 1 : 0.6 }}>{req}</span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* Confirm Password */}
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "6px" }}>Confirm Password</label>
                  <div style={{ ...fpFieldStyle, marginBottom: "22px" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    <input type={fpShowConfirm ? "text" : "password"} placeholder="••••••••" value={fpConfirmPassword} onChange={e => setFpConfirmPassword(e.target.value)} required style={fpInputStyle} />
                    <svg onClick={() => setFpShowConfirm(!fpShowConfirm)} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0, cursor: "pointer" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={closeForgot}
                      style={{
                        flex: 1, height: "46px",
                        border: "1.5px solid #D4E8C2", background: "#fff",
                        borderRadius: "12px", cursor: "pointer",
                        color: "#1A3A2A", fontSize: "14px", fontWeight: 600,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F6F8F3"}
                      onMouseLeave={e => e.currentTarget.style.background = "#fff"}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={fpLoading}
                      style={{
                        flex: 2, height: "46px",
                        background: fpLoading ? "#388E3C" : "#4CAF50",
                        border: "none", borderRadius: "12px",
                        color: "#fff", fontSize: "14px", fontWeight: 700,
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        cursor: fpLoading ? "not-allowed" : "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
                        boxShadow: "0 4px 16px rgba(76,175,80,0.25)",
                        transition: "box-shadow 0.15s",
                      }}
                      onMouseEnter={e => { if (!fpLoading) e.currentTarget.style.boxShadow = "0 8px 24px rgba(76,175,80,0.35)"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(76,175,80,0.25)"; }}
                    >
                      {fpLoading ? "Resetting..." : (
                        <>
                          Reset Password
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Login;