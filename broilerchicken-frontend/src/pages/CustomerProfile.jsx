import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  User, Mail, Phone, MapPin, ShieldCheck, Lock,
  Eye, EyeOff, Save, Edit3, Calendar, BadgeCheck,
  Fingerprint, Shield, UserCircle2
} from "lucide-react";
 
const kedahCities = [
  "Alor Setar", "Sungai Petani", "Kulim", "Jitra", "Baling",
  "Pendang", "Yan", "Sik", "Kuala Nerang", "Pokok Sena",
  "Gurun", "Langkawi", "Kubang Pasu", "Padang Serai", "Bandar Baharu",
];
 
const TABS = [
  { id: "personal",  label: "Personal Info",  icon: <User size={15} /> },
  { id: "address",   label: "Address",         icon: <MapPin size={15} /> },
  { id: "account",   label: "Account",         icon: <Shield size={15} /> },
  { id: "security",  label: "Security",        icon: <Lock size={15} /> },
];
 
export default function CustomerProfile() {
  const customerId = sessionStorage.getItem("customer_id");
 
  const [profile,          setProfile]  = useState(null);
  const [edit,             setEdit]     = useState(false);
  const [showPassword,     setShowPw]   = useState(false);
  const [newPassword,      setNewPw]    = useState("");
  const [confirmPassword,  setConfPw]   = useState("");
  const [msg,              setMsg]      = useState({ text: "", ok: true });
  const [activeTab,        setTab]      = useState("personal");
 
  useEffect(() => {
    API.get(`/customer/profile/${customerId}`)
      .then((res) => setProfile(res.data))
      .catch((err) => console.error("Profile error:", err));
  }, [customerId]);
 
  if (!profile) {
    return (
      <div style={loadingPage}>
        <div style={spinRing} />
        <div style={{ color: "#6E8A72", fontSize: "14px", fontWeight: 600 }}>
          Loading your profile…
        </div>
      </div>
    );
  }
 
  /* ── password strength ─────────────────────────────────── */
  const strength =
    newPassword.length >= 8 ? "Strong" :
    newPassword.length >= 5 ? "Medium" :
    newPassword.length >  0 ? "Weak"   : "";
 
  const strengthMeta = {
    Strong: { color: "#3A7D1C", width: "100%" },
    Medium: { color: "#D97706", width: "60%"  },
    Weak:   { color: "#B91C1C", width: "25%"  },
  }[strength] ?? { color: "#9AA89B", width: "0%" };
 
  /* ── handlers ─────────────────────────────────────────── */
  const updateProfile = async () => {
    await API.patch(`/customer/profile/${customerId}`, {
      email:    profile.email,
      phone_no: profile.phone_no,
      address:  profile.address,
      area:     profile.area,
    });
    setMsg({ text: "Profile updated successfully.", ok: true });
    setEdit(false);
  };
 
  const changePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setMsg({ text: "Passwords do not match. Please try again.", ok: false });
      return;
    }
    await API.patch(`/customer/profile/${customerId}/change-password`, { newPassword });
    setMsg({ text: "Password changed successfully.", ok: true });
    setNewPw(""); setConfPw("");
  };
 
  /* ── KPI strip ────────────────────────────────────────── */
  const kpis = [
    { label: "Customer ID",   value: profile.customer_id, accent: "#3B82F6", bg: "#EFF6FF", icon: <Fingerprint size={17} color="#3B82F6" /> },
    { label: "Role",          value: profile.role,         accent: "#8B5CF6", bg: "#F0EDFF", icon: <ShieldCheck  size={17} color="#8B5CF6" /> },
    { label: "Status",        value: profile.status,       accent: "#4CAF50", bg: "#EAF7E3", icon: <BadgeCheck   size={17} color="#4CAF50" /> },
    { label: "Username",      value: profile.username,     accent: "#F59E0B", bg: "#FFF8EC", icon: <User         size={17} color="#F59E0B" /> },
    { label: "Member Since",  value: "Active",             accent: "#EC4899", bg: "#FDF2F8", icon: <Calendar     size={17} color="#EC4899" /> },
  ];
 
  return (
    <div style={page}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
 
        {/* ── Page header ─────────────────────────────── */}
        <div style={header}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={headerIcon}>
              <UserCircle2 size={24} color="#4CAF50" />
            </div>
            <div>
              <div style={title}>My Profile</div>
              <div style={subtitle}>Manage your personal information, address and security.</div>
            </div>
          </div>
 
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={verifiedBadge}>
              <BadgeCheck size={15} color="#4CAF50" />
              {profile.status}
            </div>
            <button
              style={edit ? cancelBtn : editBtn}
              onClick={() => { setEdit(!edit); setMsg({ text: "", ok: true }); }}
            >
              <Edit3 size={14} />
              {edit ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>
 
        {/* ── Toast ────────────────────────────────────── */}
        <AnimatePresence>
          {msg.text && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={msg.ok ? successToast : errorToast}
            >
              <div style={toastBar(msg.ok ? "#3A7D1C" : "#B91C1C")} />
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>
 
        {/* ── KPI row ──────────────────────────────────── */}
        <div style={kpiGrid}>
          {kpis.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{ ...kpiCard, borderTop: `3px solid ${k.accent}` }}
            >
              <div style={kpiTop}>
                <span style={kpiLabel}>{k.label}</span>
                <div style={{ ...kpiIcon, background: k.bg }}>{k.icon}</div>
              </div>
              <div style={kpiValue}>{k.value}</div>
            </motion.div>
          ))}
        </div>
 
        {/* ── Layout: avatar sidebar + tab content ─────── */}
        <div style={layout}>
 
          {/* Sidebar */}
          <aside style={sidebar}>
            <div style={avatarRing}>
              <div style={avatarCircle}>
                <span style={avatarLetter}>{profile.full_name?.charAt(0)}</span>
              </div>
              <div style={onlineDot} />
            </div>
 
            <h2 style={profileName}>{profile.full_name}</h2>
            <p style={profileId}>{profile.customer_id}</p>
 
            <div style={divider} />
 
            <nav style={nav}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  style={activeTab === t.id ? navItemActive : navItem}
                  onClick={() => setTab(t.id)}
                >
                  <span style={navIconWrap(activeTab === t.id)}>{t.icon}</span>
                  {t.label}
                  {activeTab === t.id && <span style={navArrow}>›</span>}
                </button>
              ))}
            </nav>
          </aside>
 
          {/* Main panel */}
          <main>
            <AnimatePresence mode="wait">
 
              {/* Personal */}
              {activeTab === "personal" && (
                <motion.div key="personal" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Section title="Personal Information" icon={<User size={18} />} subtitle="Your name, contact details and login identity.">
                    <div style={fieldGrid}>
                      <Field label="Customer ID"   value={profile.customer_id} disabled icon={<Fingerprint size={15} />} accent />
                      <Field label="Full Name"      value={profile.full_name}   disabled icon={<User         size={15} />} accent />
                      <Field label="Username"       value={profile.username}    disabled icon={<ShieldCheck  size={15} />} accent />
                      <div />
                      <Field label="Email Address"  value={profile.email}    disabled={!edit} icon={<Mail  size={15} />} onChange={(v) => setProfile({ ...profile, email: v })} />
                      <Field label="Phone Number"   value={profile.phone_no} disabled={!edit} icon={<Phone size={15} />} onChange={(v) => setProfile({ ...profile, phone_no: v })} />
                    </div>
                    {edit && <SaveButton onClick={updateProfile} />}
                  </Section>
                </motion.div>
              )}
 
              {/* Address */}
              {activeTab === "address" && (
                <motion.div key="address" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Section title="Address Information" icon={<MapPin size={18} />} subtitle="Your delivery address and service area in Kedah.">
                    <div style={fieldGrid}>
                      <div style={{ gridColumn: "1 / -1" }}>
                        <Field label="Home Address" value={profile.address} disabled={!edit} icon={<MapPin size={15} />} onChange={(v) => setProfile({ ...profile, address: v })} />
                      </div>
                      <CityField label="City / Area" value={profile.area} disabled={!edit} onChange={(v) => setProfile({ ...profile, area: v })} />
                      <Field label="State"    value="Kedah" disabled icon={<MapPin size={15} />} accent />
                      <Field label="Postcode" value="—"     disabled icon={<MapPin size={15} />} accent />
                    </div>
                    {edit && <SaveButton onClick={updateProfile} />}
                  </Section>
                </motion.div>
              )}
 
              {/* Account */}
              {activeTab === "account" && (
                <motion.div key="account" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Section title="Account Details" icon={<Calendar size={18} />} subtitle="Your account status and access level.">
                    <div style={accountGrid}>
                      <AccountCard label="Status"     value={profile.status}     icon={<BadgeCheck size={20} />} color="#3A7D1C" bg="#EAF7E3" />
                      <AccountCard label="Role"       value={profile.role}       icon={<User       size={20} />} color="#1D4ED8" bg="#EFF6FF" />
                      <AccountCard label="Last Login" value="Not tracked"        icon={<Shield     size={20} />} color="#B45309" bg="#FFFBEB" />
                    </div>
                  </Section>
                </motion.div>
              )}
 
              {/* Security */}
              {activeTab === "security" && (
                <motion.div key="security" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Section title="Security Settings" icon={<Lock size={18} />} subtitle="Update your password and manage account access.">
                    <div style={fieldGrid}>
                      <PasswordField label="New Password"     value={newPassword}     show={showPassword} onChange={setNewPw}   />
                      <PasswordField label="Confirm Password" value={confirmPassword} show={showPassword} onChange={setConfPw} />
                    </div>
 
                    {newPassword.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={strengthWrap}>
                        <div style={strengthHeader}>
                          <span style={{ fontSize: "12px", color: "#9AA89B", fontWeight: 600 }}>Password strength</span>
                          <span style={{ fontSize: "12px", fontWeight: 800, color: strengthMeta.color }}>{strength}</span>
                        </div>
                        <div style={strengthTrack}>
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: strengthMeta.width }}
                            transition={{ duration: 0.4 }}
                            style={{ height: "100%", borderRadius: "99px", background: strengthMeta.color }}
                          />
                        </div>
                      </motion.div>
                    )}
 
                    <div style={secActions}>
                      <button style={ghostBtn} onClick={() => setShowPw(!showPassword)}>
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showPassword ? "Hide" : "Show"} passwords
                      </button>
                      <button style={primaryBtn} onClick={changePassword}>
                        <Lock size={14} /> Change Password
                      </button>
                    </div>
                  </Section>
                </motion.div>
              )}
 
            </AnimatePresence>
          </main>
        </div>
 
      </motion.div>
    </div>
  );
}
 
/* ── Sub-components ─────────────────────────────────────────────── */
 
function Section({ title, icon, subtitle, children }) {
  return (
    <div style={sectionWrap}>
      <div style={sectionHead}>
        <div style={sectionIconWrap}>{icon}</div>
        <div>
          <h3 style={sectionTitle}>{title}</h3>
          <p style={sectionSub}>{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
 
function Field({ label, value, disabled, onChange, icon, accent }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ ...inputWrap, background: accent ? "#F0F7EC" : "#FAFCF8", borderColor: accent ? "#C8DFC0" : "#DDE8D7" }}>
        <span style={inputIcon}>{icon}</span>
        <input
          value={value || ""}
          disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.value)}
          style={{ ...inputBase, color: disabled ? "#7A9980" : "#102114", cursor: disabled ? "default" : "text" }}
        />
        {!disabled && <span style={editDot} />}
      </div>
    </div>
  );
}
 
function CityField({ label, value, disabled, onChange }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ ...inputWrap, background: disabled ? "#F0F7EC" : "#FAFCF8", borderColor: disabled ? "#C8DFC0" : "#DDE8D7" }}>
        <span style={inputIcon}><MapPin size={15} /></span>
        {disabled ? (
          <input value={value || ""} disabled style={{ ...inputBase, color: "#7A9980" }} />
        ) : (
          <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ ...inputBase, color: "#102114" }}>
            <option value="">Select city in Kedah</option>
            {kedahCities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        {!disabled && <span style={editDot} />}
      </div>
    </div>
  );
}
 
function PasswordField({ label, value, show, onChange }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ ...inputWrap, background: "#FAFCF8", borderColor: "#DDE8D7" }}>
        <span style={inputIcon}><Lock size={15} /></span>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          style={{ ...inputBase, letterSpacing: show ? "normal" : "0.1em" }}
        />
      </div>
    </div>
  );
}
 
function AccountCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ ...acctCard, background: bg, borderColor: color + "33" }}>
      <div style={{ ...acctIcon, color, background: color + "1A" }}>{icon}</div>
      <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: color + "CC" }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 800, color }}>{value}</div>
    </div>
  );
}
 
function SaveButton({ onClick }) {
  return (
    <div style={{ marginTop: "18px" }}>
      <button style={primaryBtn} onClick={onClick}>
        <Save size={14} /> Save Changes
      </button>
    </div>
  );
}
 
/* ── Styles ─────────────────────────────────────────────────────── */
 
const page        = { padding: "32px", background: "#F4F7F2", minHeight: "100vh", fontFamily: "'Inter', sans-serif" };
const loadingPage = { minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#F4F7F2", gap: "14px" };
const spinRing    = { width: "32px", height: "32px", borderRadius: "50%", border: "3px solid #C8E6C9", borderTopColor: "#4CAF50", animation: "spin 0.8s linear infinite" };
 
const header     = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" };
const headerIcon = { width: "48px", height: "48px", borderRadius: "15px", background: "#102114", display: "flex", alignItems: "center", justifyContent: "center" };
const title      = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "28px", fontWeight: 800, color: "#102114" };
const subtitle   = { color: "#6E8A72", fontSize: "13px", marginTop: "2px" };
 
const verifiedBadge = { padding: "10px 18px", borderRadius: "12px", background: "#EAF7E3", border: "1px solid #C8E6C9", fontSize: "13px", fontWeight: 700, color: "#3A7D1C", display: "flex", alignItems: "center", gap: "6px" };
const editBtn       = { display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "12px", background: "#102114", color: "#fff", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" };
const cancelBtn     = { ...editBtn, background: "transparent", color: "#5C7A5E", border: "1.5px solid #B0C4B4" };
 
const successToast = { display: "flex", alignItems: "center", gap: "12px", padding: "13px 16px", borderRadius: "14px", background: "#fff", border: "1.5px solid #C8DFC0", color: "#2E5C2E", fontWeight: 600, fontSize: "13px", marginBottom: "20px", boxShadow: "0 4px 14px #0F21100A", overflow: "hidden", position: "relative" };
const errorToast   = { ...successToast, border: "1.5px solid #FECACA", color: "#991B1B" };
const toastBar     = (c) => ({ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: c });
 
const kpiGrid = { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px", marginBottom: "24px" };
const kpiCard = { background: "#fff", borderRadius: "20px", padding: "18px", boxShadow: "0 8px 24px rgba(17,24,39,0.05)" };
const kpiTop  = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" };
const kpiLabel = { fontSize: "11px", color: "#70836B", fontWeight: 600 };
const kpiIcon  = { width: "30px", height: "30px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" };
const kpiValue = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "15px", fontWeight: 800, color: "#102114" };
 
const layout  = { display: "grid", gridTemplateColumns: "230px 1fr", gap: "16px", alignItems: "start" };
 
const sidebar     = { background: "#fff", borderRadius: "22px", padding: "22px 18px", boxShadow: "0 8px 24px rgba(17,24,39,0.06)" };
const avatarRing  = { position: "relative", width: "80px", margin: "0 auto 14px" };
const avatarCircle = { width: "80px", height: "80px", borderRadius: "22px", background: "linear-gradient(135deg, #1B3B20 0%, #2E6634 100%)", display: "flex", alignItems: "center", justifyContent: "center" };
const avatarLetter = { fontSize: "34px", fontWeight: 800, color: "#7ED17F" };
const onlineDot   = { position: "absolute", bottom: "4px", right: "4px", width: "12px", height: "12px", borderRadius: "50%", background: "#4CAF50", border: "2px solid #fff" };
const profileName = { textAlign: "center", fontSize: "17px", fontWeight: 800, color: "#102114", margin: "0 0 3px" };
const profileId   = { textAlign: "center", fontSize: "12px", color: "#9AA89B", marginBottom: "12px" };
const divider     = { height: "1px", background: "#EDF2EB", margin: "16px 0" };
 
const nav         = { display: "flex", flexDirection: "column", gap: "4px" };
const navItem     = { display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "12px", border: "none", background: "transparent", fontSize: "13px", fontWeight: 500, color: "#6E8A72", cursor: "pointer", textAlign: "left", width: "100%" };
const navItemActive = { ...navItem, background: "#EAF7E3", color: "#1B4A1E", fontWeight: 700 };
const navIconWrap = (active) => ({ display: "flex", alignItems: "center", justifyContent: "center", width: "28px", height: "28px", borderRadius: "8px", background: active ? "#C8E6C9" : "#F0F4EC", color: active ? "#2E6634" : "#7A9980", flexShrink: 0 });
const navArrow    = { marginLeft: "auto", fontSize: "16px", color: "#4CAF50" };
 
const sectionWrap  = { background: "#fff", borderRadius: "22px", padding: "24px", boxShadow: "0 8px 24px rgba(17,24,39,0.06)" };
const sectionHead  = { display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "22px" };
const sectionIconWrap = { width: "40px", height: "40px", borderRadius: "12px", background: "#EAF7E3", color: "#2E6634", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const sectionTitle = { margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "17px", fontWeight: 800, color: "#102114" };
const sectionSub   = { margin: "3px 0 0", fontSize: "12px", color: "#9AA89B" };
 
const fieldGrid  = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" };
const labelStyle = { display: "block", fontSize: "11px", color: "#7A9980", fontWeight: 700, marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.06em" };
const inputWrap  = { display: "flex", alignItems: "center", gap: "10px", height: "46px", borderRadius: "13px", border: "1.5px solid", padding: "0 14px" };
const inputIcon  = { display: "flex", color: "#9AA89B", flexShrink: 0 };
const inputBase  = { flex: 1, border: "none", outline: "none", background: "transparent", fontSize: "13.5px", fontFamily: "inherit", fontWeight: 500 };
const editDot    = { width: "6px", height: "6px", borderRadius: "50%", background: "#4CAF50", flexShrink: 0 };
 
const accountGrid = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" };
const acctCard    = { padding: "20px", borderRadius: "16px", border: "1.5px solid", display: "flex", flexDirection: "column", gap: "8px" };
const acctIcon    = { width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" };
 
const strengthWrap   = { marginTop: "16px", padding: "14px 16px", borderRadius: "13px", background: "#F9FCF6", border: "1.5px solid #E6EDE4" };
const strengthHeader = { display: "flex", justifyContent: "space-between", marginBottom: "10px" };
const strengthTrack  = { height: "5px", borderRadius: "99px", background: "#E6EDE4", overflow: "hidden" };
 
const secActions = { display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" };
const primaryBtn = { display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 20px", borderRadius: "12px", background: "#1B3B20", color: "#9FD3A0", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" };
const ghostBtn   = { display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 16px", borderRadius: "12px", background: "transparent", color: "#5C7A5E", border: "1.5px solid #C8DFC0", fontSize: "13px", fontWeight: 600, cursor: "pointer" };
 