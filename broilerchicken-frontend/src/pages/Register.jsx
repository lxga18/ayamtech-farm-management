import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import API from "../api/axios";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState([]);

  const kedahCities = ["Alor Setar", "Sungai Petani", "Kulim", "Jitra", "Baling", "Pendang", "Sik", "Yan", "Kubang Pasu", "Kuala Kedah", "Padang Terap", "Pokok Sena", "Bandar Baharu"];

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

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    setPasswordStrength(calculateStrength(pwd));
    setPasswordErrors(validatePassword(pwd));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // Validate password before submission
    const errors = validatePassword(password);
    if (errors.length > 0) {
      setError("Password must meet all requirements");
      setPasswordErrors(errors);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await API.post("/auth/register", {
        name,
        username,
        email,
        password,
        address,
        area,
        phone_no: phoneNo,
        role: "Customer"
      });

      setSuccess("Registration successful. You can now log in.");
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      console.log("REGISTER ERROR:", err.response?.data || err.message);
      setError(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
            <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.82)" }}>Customer registration portal</span>
          </div>

          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "56px", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.03em", marginBottom: "18px", textShadow: "0 8px 30px rgba(0,0,0,0.35)" }}>
            Join smarter
            <br />farm ordering.
          </div>

          <div style={{ maxWidth: "460px", fontSize: "15px", lineHeight: 1.8, color: "rgba(255,255,255,0.76)" }}>
            Create your customer account to place broiler orders, manage delivery details, and track transactions with ease.
          </div>
        </div>

        <div style={{ flexShrink: 0, width: "100%", maxWidth: "470px", display: "flex", justifyContent: "center", perspective: "1400px" }}>
          <motion.div variants={panelVariants} initial="hidden" animate="visible" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ width: "100%", position: "relative", borderRadius: "22px", background: "rgba(255,255,255,0.94)", boxShadow: "0 30px 80px rgba(0,0,0,0.26), 0 8px 30px rgba(0,0,0,0.16)", padding: "34px 30px 22px", backdropFilter: "blur(12px)", transformStyle: "preserve-3d", rotateX, rotateY, zIndex: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.42)" }}>
            <motion.div initial={{ x: "-130%", opacity: 0 }} animate={{ x: "140%", opacity: [0, 0.32, 0] }} transition={{ duration: 2.8, ease: "easeInOut", repeat: Infinity, repeatDelay: 2.2 }} style={{ position: "absolute", top: "-20%", left: 0, width: "45%", height: "140%", transform: "rotate(18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.38) 50%, rgba(255,255,255,0) 100%)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: "-80px", right: "-40px", width: "180px", height: "180px", borderRadius: "50%", background: "rgba(126,217,87,0.11)", filter: "blur(50px)", pointerEvents: "none" }} />

            <div style={{ position: "relative", zIndex: 2 }}>
              <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.12} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "28px", fontWeight: 800, color: "#0F1F0A", marginBottom: "6px" }}>AyamTech</motion.div>
              <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.2} style={{ fontSize: "13px", color: "#7A9A6A", marginBottom: "24px" }}>Create your customer account</motion.div>

              {error && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#FEE2E2", border: "0.5px solid #FCA5A5", color: "#B91C1C", fontSize: "12px", padding: "9px 12px", borderRadius: "8px", marginBottom: "14px" }}>{error}</motion.div>}
              {success && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} style={{ background: "#ECFDF3", border: "0.5px solid #86EFAC", color: "#166534", fontSize: "12px", padding: "9px 12px", borderRadius: "8px", marginBottom: "14px" }}>{success}</motion.div>}

              <form onSubmit={handleRegister}>
                <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.26}>
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "7px" }}>Name</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "46px", background: "#fff", border: "1.5px solid #D4E8C2", borderRadius: "12px", padding: "0 14px", marginBottom: "14px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                    <input type="text" placeholder="Enter your full name" value={name} onChange={(e) => setName(e.target.value)} required style={{ flex: 1, border: "none", background: "transparent", fontSize: "14px", color: "#1A3A2A", outline: "none" }} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.29}>
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "7px" }}>Username</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "46px", background: "#fff", border: "1.5px solid #D4E8C2", borderRadius: "12px", padding: "0 14px", marginBottom: "14px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                    <input type="text" placeholder="Create your username" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ flex: 1, border: "none", background: "transparent", fontSize: "14px", color: "#1A3A2A", outline: "none" }} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.32}>
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "7px" }}>Email</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "46px", background: "#fff", border: "1.5px solid #D4E8C2", borderRadius: "12px", padding: "0 14px", marginBottom: "14px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}><path d="M4 4h16v16H4z" /><path d="M22 6l-10 7L2 6" /></svg>
                    <input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ flex: 1, border: "none", background: "transparent", fontSize: "14px", color: "#1A3A2A", outline: "none" }} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.38}>
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "7px" }}>Password</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "46px", background: "#fff", border: "1.5px solid #D4E8C2", borderRadius: "12px", padding: "0 14px", marginBottom: "8px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
                    <input type={showPassword ? "text" : "password"} placeholder="Min. 8 chars with uppercase, number & special" value={password} onChange={handlePasswordChange} required style={{ flex: 1, border: "none", background: "transparent", fontSize: "14px", color: "#1A3A2A", outline: "none" }} />
                    <svg onClick={() => setShowPassword(!showPassword)} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0, cursor: "pointer" }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  </div>
                  
                  {/* Password strength indicator */}
                  {password && (
                    <div style={{ marginBottom: "14px" }}>
                      <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div key={i} style={{
                            flex: 1,
                            height: "3px",
                            borderRadius: "99px",
                            background: i < passwordStrength ? strengthColors[passwordStrength - 1] : "#E5EDE0",
                            transition: "all 0.3s ease",
                          }} />
                        ))}
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, color: strengthColors[passwordStrength - 1] || "#BEC9BB" }}>
                          {passwordStrength > 0 ? strengthLabels[passwordStrength - 1] : "Enter password"}
                        </span>
                        <span style={{ fontSize: "10px", color: "#BEC9BB" }}>
                          {passwordStrength}/5
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Password requirements list */}
                  {password && passwordErrors.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} style={{ marginBottom: "14px", overflow: "hidden" }}>
                      <div style={{ fontSize: "10px", color: "#BEC9BB", marginBottom: "4px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Requirements</div>
                      {["At least 8 characters", "One uppercase letter", "One lowercase letter", "One number", "One special character"].map((req, i) => {
                        const isMet = !passwordErrors.includes(req);
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "2px 0", fontSize: "11px", color: isMet ? "#4CAF50" : "#BEC9BB" }}>
                            <span style={{ fontSize: isMet ? "12px" : "10px" }}>{isMet ? "✅" : "⬜"}</span>
                            <span style={{ textDecoration: isMet ? "none" : "line-through", opacity: isMet ? 1 : 0.6 }}>{req}</span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </motion.div>

                <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.44}>
                  <label style={{ fontSize: "11px", fontWeight: 500, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "7px" }}>Address</label>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", minHeight: "86px", background: "#fff", border: "1.5px solid #D4E8C2", borderRadius: "12px", padding: "12px 14px", marginBottom: "14px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0, marginTop: "2px" }}><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <textarea placeholder="Enter your address" value={address} onChange={(e) => setAddress(e.target.value)} required rows={3} style={{ flex: 1, border: "none", background: "transparent", fontSize: "14px", color: "#1A3A2A", outline: "none", resize: "none", fontFamily: "'Inter', sans-serif" }} />
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.5} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 500, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "7px" }}>Area</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "46px", background: "#fff", border: "1.5px solid #D4E8C2", borderRadius: "12px", padding: "0 14px", marginBottom: "14px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /></svg>
                      <select value={area} onChange={(e) => setArea(e.target.value)} required style={{ flex: 1, border: "none", background: "transparent", fontSize: "14px", color: area ? "#1A3A2A" : "#9CA3AF", outline: "none" }}>
                        <option value="">Select city</option>
                        {kedahCities.map((city) => <option key={city} value={city}>{city}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: 500, color: "#5A5A5A", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: "7px" }}>Phone Number</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "46px", background: "#fff", border: "1.5px solid #D4E8C2", borderRadius: "12px", padding: "0 14px", marginBottom: "14px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A3A2A" strokeWidth="2" style={{ opacity: 0.35, flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.8 19.8 0 012.08 4.18 2 2 0 014.06 2h3a2 2 0 012 1.72c.12.9.33 1.77.62 2.6a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.48-1.16a2 2 0 012.11-.45c.83.29 1.7.5 2.6.62A2 2 0 0122 16.92z" /></svg>
                      <input type="text" placeholder="e.g. 0123456789" value={phoneNo} onChange={(e) => setPhoneNo(e.target.value)} required style={{ flex: 1, border: "none", background: "transparent", fontSize: "14px", color: "#1A3A2A", outline: "none" }} />
                    </div>
                  </div>
                </motion.div>

                <motion.button variants={itemVariants} initial="hidden" animate="visible" custom={0.58} whileHover={{ scale: 1.02, boxShadow: "0 14px 30px rgba(76,175,80,0.28)" }} whileTap={{ scale: 0.985 }} type="submit" disabled={loading} style={{ width: "100%", height: "50px", background: loading ? "#388E3C" : "#4CAF50", border: "none", borderRadius: "12px", color: "#fff", fontSize: "15px", fontWeight: 700, fontFamily: "'Plus Jakarta Sans', sans-serif", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px", marginBottom: "18px" }}>
                  {loading ? "Creating account..." : "Register"}
                  {!loading && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
                </motion.button>
              </form>

              <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.66} style={{ textAlign: "center", fontSize: "13px", color: "#9CA3AF" }}>
                Already have an account? <span onClick={() => navigate("/")} style={{ color: "#639922", fontWeight: 600, cursor: "pointer" }}>Back to login</span>
              </motion.div>

              <motion.div variants={itemVariants} initial="hidden" animate="visible" custom={0.74} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "18px", borderTop: "1px solid #F0F0F0", marginTop: "22px", gap: "10px", flexWrap: "wrap" }}>
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
    </div>
  );
}

export default Register;