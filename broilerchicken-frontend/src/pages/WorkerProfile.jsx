import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Save,
  Edit3,
  Calendar,
  BadgeCheck,
  Fingerprint,
  Shield,
  UserCircle2,
  BriefcaseBusiness,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const C = {
  bg: "#F6F8F3",
  surface: "#FFFFFF",
  border: "#E5EDE0",
  green: "#4CAF50",
  greenDark: "#2E7D32",
  greenDim: "#EAF7E3",
  amber: "#F59E0B",
  amberDim: "#FFF8EC",
  red: "#EF4444",
  redDim: "#FEE2E2",
  blue: "#3B82F6",
  blueDim: "#EFF6FF",
  purple: "#8B5CF6",
  purpleDim: "#F0EDFF",
  text: "#102114",
  textMid: "#6E8A72",
  textLight: "#9AA89B",
  sans: "'Plus Jakarta Sans', sans-serif",
  body: "'Inter', sans-serif",
};

const TABS = [
  { id: "personal", label: "Personal Info", icon: <User size={15} /> },
  { id: "account", label: "Account", icon: <Shield size={15} /> },
  { id: "security", label: "Security", icon: <Lock size={15} /> },
];

export default function WorkerProfile() {
  const [profile, setProfile] = useState(null);
  const [edit, setEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [activeTab, setActiveTab] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!msg.text) return;
    const timer = setTimeout(() => setMsg({ text: "", ok: true }), 3500);
    return () => clearTimeout(timer);
  }, [msg]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get("/worker/profile");
      setProfile(res.data);
    } catch (err) {
      console.error("Worker profile error:", err);
      setMsg({
        text: err.response?.data?.error || "Failed to load worker profile.",
        ok: false,
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setSaving(true);

      const res = await API.patch("/worker/profile", {
        email: profile.email,
        phone_no: profile.phone_no,
      });

      setProfile(res.data.profile);
      setMsg({ text: "Profile updated successfully.", ok: true });
      setEdit(false);
    } catch (err) {
      console.error("Update worker profile error:", err);
      setMsg({
        text: err.response?.data?.error || "Failed to update profile.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setMsg({ text: "Passwords do not match. Please try again.", ok: false });
      return;
    }

    if (newPassword.length < 5) {
      setMsg({ text: "Password must be at least 5 characters.", ok: false });
      return;
    }

    try {
      setSaving(true);

      await API.patch("/worker/profile/change-password", {
        newPassword,
      });

      setMsg({ text: "Password changed successfully.", ok: true });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Change worker password error:", err);
      setMsg({
        text: err.response?.data?.error || "Failed to change password.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  const strength =
    newPassword.length >= 8
      ? "Strong"
      : newPassword.length >= 5
      ? "Medium"
      : newPassword.length > 0
      ? "Weak"
      : "";

  const strengthMeta =
    {
      Strong: { color: C.greenDark, width: "100%" },
      Medium: { color: "#D97706", width: "60%" },
      Weak: { color: "#B91C1C", width: "25%" },
    }[strength] || { color: C.textLight, width: "0%" };

  if (loading) {
    return (
      <div style={loadingPage}>
        <style>{fontStyle}</style>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          style={spinRing}
        />
        <div style={{ color: C.textMid, fontSize: 14, fontWeight: 700 }}>
          Loading your profile…
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={loadingPage}>
        <style>{fontStyle}</style>
        <XCircle size={40} color={C.red} />
        <div style={{ color: C.red, fontWeight: 800 }}>
          Worker profile not found.
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: "Worker ID",
      value: profile.worker_id || profile.user_id,
      accent: C.blue,
      bg: C.blueDim,
      icon: <Fingerprint size={17} color={C.blue} />,
    },
    {
      label: "Role",
      value: profile.role,
      accent: C.purple,
      bg: C.purpleDim,
      icon: <BriefcaseBusiness size={17} color={C.purple} />,
    },
    {
      label: "Status",
      value: profile.status,
      accent: C.green,
      bg: C.greenDim,
      icon: <BadgeCheck size={17} color={C.green} />,
    },
    {
      label: "Username",
      value: profile.username,
      accent: C.amber,
      bg: C.amberDim,
      icon: <User size={17} color={C.amber} />,
    },
    {
      label: "Account",
      value: profile.member_since || "Active",
      accent: "#EC4899",
      bg: "#FDF2F8",
      icon: <Calendar size={17} color="#EC4899" />,
    },
  ];

  return (
    <div style={page}>
      <style>{fontStyle}</style>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <div style={header}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={headerIcon}>
              <UserCircle2 size={25} color="#fff" />
            </div>
            <div>
              <div style={title}>Worker Profile</div>
              <div style={subtitle}>
                Manage your worker account information and security settings.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={verifiedBadge}>
              <BadgeCheck size={15} color={C.green} />
              {profile.status}
            </div>

            <button
              style={edit ? cancelBtn : editBtn}
              onClick={() => {
                setEdit(!edit);
                setMsg({ text: "", ok: true });
              }}
            >
              <Edit3 size={14} />
              {edit ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Toast */}
        <AnimatePresence>
          {msg.text && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={msg.ok ? successToast : errorToast}
            >
              <div style={toastBar(msg.ok ? C.greenDark : "#B91C1C")} />
              {msg.ok ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
              {msg.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* KPI cards */}
        <div style={kpiGrid}>
          {kpis.map((k, i) => (
            <motion.div
              key={k.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{ ...kpiCard, borderTop: `3px solid ${k.accent}` }}
            >
              <div style={kpiTop}>
                <span style={kpiLabel}>{k.label}</span>
                <div style={{ ...kpiIcon, background: k.bg }}>{k.icon}</div>
              </div>
              <div style={kpiValue}>{k.value || "—"}</div>
            </motion.div>
          ))}
        </div>

        {/* Main layout */}
        <div style={layout}>
          {/* Sidebar */}
          <aside style={sidebar}>
            <div style={avatarRing}>
              <div style={avatarCircle}>
                <span style={avatarLetter}>
                  {profile.full_name?.charAt(0)?.toUpperCase() || "W"}
                </span>
              </div>
              <div style={onlineDot} />
            </div>

            <h2 style={profileName}>{profile.full_name || "Farm Worker"}</h2>
            <p style={profileId}>{profile.worker_id || profile.user_id}</p>

            <div style={divider} />

            <nav style={nav}>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  style={activeTab === tab.id ? navItemActive : navItem}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span style={navIconWrap(activeTab === tab.id)}>
                    {tab.icon}
                  </span>
                  {tab.label}
                  {activeTab === tab.id && <span style={navArrow}>›</span>}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main>
            <AnimatePresence mode="wait">
              {activeTab === "personal" && (
                <motion.div
                  key="personal"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Section
                    title="Personal Information"
                    icon={<User size={18} />}
                    subtitle="Your contact details and login identity."
                  >
                    <div style={fieldGrid}>
                      <Field
                        label="Worker ID"
                        value={profile.worker_id || profile.user_id}
                        disabled
                        icon={<Fingerprint size={15} />}
                        accent
                      />
                      <Field
                        label="Full Name"
                        value={profile.full_name}
                        disabled
                        icon={<User size={15} />}
                        accent
                      />
                      <Field
                        label="Username"
                        value={profile.username}
                        disabled
                        icon={<ShieldCheck size={15} />}
                        accent
                      />
                      <Field
                        label="Role"
                        value={profile.role}
                        disabled
                        icon={<BriefcaseBusiness size={15} />}
                        accent
                      />
                      <Field
                        label="Email Address"
                        value={profile.email}
                        disabled={!edit}
                        icon={<Mail size={15} />}
                        onChange={(value) =>
                          setProfile({ ...profile, email: value })
                        }
                      />
                      <Field
                        label="Phone Number"
                        value={profile.phone_no}
                        disabled={!edit}
                        icon={<Phone size={15} />}
                        onChange={(value) =>
                          setProfile({ ...profile, phone_no: value })
                        }
                      />
                    </div>

                    {edit && (
                      <SaveButton
                        onClick={updateProfile}
                        loading={saving}
                        text="Save Changes"
                      />
                    )}
                  </Section>
                </motion.div>
              )}

              {activeTab === "account" && (
                <motion.div
                  key="account"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Section
                    title="Account Details"
                    icon={<Calendar size={18} />}
                    subtitle="Your worker account status and access level."
                  >
                    <div style={accountGrid}>
                      <AccountCard
                        label="Status"
                        value={profile.status}
                        icon={<BadgeCheck size={20} />}
                        color={C.greenDark}
                        bg={C.greenDim}
                      />
                      <AccountCard
                        label="Role"
                        value={profile.role}
                        icon={<BriefcaseBusiness size={20} />}
                        color={C.blue}
                        bg={C.blueDim}
                      />
                      <AccountCard
                        label="Access"
                        value="Worker Module"
                        icon={<Shield size={20} />}
                        color="#B45309"
                        bg="#FFFBEB"
                      />
                    </div>
                  </Section>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Section
                    title="Security Settings"
                    icon={<Lock size={18} />}
                    subtitle="Update your password and protect your worker account."
                  >
                    <div style={fieldGrid}>
                      <PasswordField
                        label="New Password"
                        value={newPassword}
                        show={showPassword}
                        onChange={setNewPassword}
                      />
                      <PasswordField
                        label="Confirm Password"
                        value={confirmPassword}
                        show={showPassword}
                        onChange={setConfirmPassword}
                      />
                    </div>

                    {newPassword.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={strengthWrap}
                      >
                        <div style={strengthHeader}>
                          <span
                            style={{
                              fontSize: 12,
                              color: C.textLight,
                              fontWeight: 700,
                            }}
                          >
                            Password strength
                          </span>
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 900,
                              color: strengthMeta.color,
                            }}
                          >
                            {strength}
                          </span>
                        </div>
                        <div style={strengthTrack}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: strengthMeta.width }}
                            transition={{ duration: 0.4 }}
                            style={{
                              height: "100%",
                              borderRadius: 99,
                              background: strengthMeta.color,
                            }}
                          />
                        </div>
                      </motion.div>
                    )}

                    <div style={secActions}>
                      <button
                        style={ghostBtn}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        {showPassword ? "Hide" : "Show"} passwords
                      </button>

                      <button style={primaryBtn} onClick={changePassword}>
                        <Lock size={14} />
                        {saving ? "Changing..." : "Change Password"}
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

/* Components */

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
      <div
        style={{
          ...inputWrap,
          background: accent ? "#F0F7EC" : "#FAFCF8",
          borderColor: accent ? "#C8DFC0" : "#DDE8D7",
        }}
      >
        <span style={inputIcon}>{icon}</span>
        <input
          value={value || ""}
          disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.value)}
          style={{
            ...inputBase,
            color: disabled ? "#7A9980" : C.text,
            cursor: disabled ? "default" : "text",
          }}
        />
        {!disabled && <span style={editDot} />}
      </div>
    </div>
  );
}

function PasswordField({ label, value, show, onChange }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div
        style={{
          ...inputWrap,
          background: "#FAFCF8",
          borderColor: "#DDE8D7",
        }}
      >
        <span style={inputIcon}>
          <Lock size={15} />
        </span>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          style={{
            ...inputBase,
            letterSpacing: show ? "normal" : "0.1em",
          }}
        />
      </div>
    </div>
  );
}

function AccountCard({ label, value, icon, color, bg }) {
  return (
    <div style={{ ...accountCard, background: bg, borderColor: color + "33" }}>
      <div style={{ ...accountIcon, color, background: color + "1A" }}>
        {icon}
      </div>
      <div style={accountLabel}>{label}</div>
      <div style={{ ...accountValue, color }}>{value || "—"}</div>
    </div>
  );
}

function SaveButton({ onClick, loading, text }) {
  return (
    <div style={{ marginTop: 18 }}>
      <button style={primaryBtn} onClick={onClick} disabled={loading}>
        <Save size={14} />
        {loading ? "Saving..." : text}
      </button>
    </div>
  );
}

/* Styles */

const fontStyle = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');
*, *::before, *::after { box-sizing: border-box; }
input:focus { outline: none; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1050px) {
  .worker-profile-layout { grid-template-columns: 1fr !important; }
}
`;

const page = {
  padding: 32,
  background: C.bg,
  minHeight: "100vh",
  fontFamily: C.body,
};

const loadingPage = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  background: C.bg,
  gap: 14,
  fontFamily: C.body,
};

const spinRing = {
  width: 34,
  height: 34,
  borderRadius: "50%",
  border: `3px solid ${C.border}`,
  borderTopColor: C.green,
};

const header = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 28,
};

const headerIcon = {
  width: 52,
  height: 52,
  borderRadius: 16,
  background: `linear-gradient(135deg, ${C.green}, ${C.greenDark})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: `0 10px 26px ${C.green}35`,
};

const title = {
  fontFamily: C.sans,
  fontSize: 28,
  fontWeight: 900,
  color: C.text,
};

const subtitle = {
  color: C.textMid,
  fontSize: 13,
  marginTop: 3,
  fontWeight: 600,
};

const verifiedBadge = {
  padding: "10px 18px",
  borderRadius: 12,
  background: C.greenDim,
  border: "1px solid #C8E6C9",
  fontSize: 13,
  fontWeight: 800,
  color: C.greenDark,
  display: "flex",
  alignItems: "center",
  gap: 6,
};

const editBtn = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  padding: "10px 18px",
  borderRadius: 12,
  background: C.text,
  color: "#fff",
  border: "none",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const cancelBtn = {
  ...editBtn,
  background: "transparent",
  color: "#5C7A5E",
  border: "1.5px solid #B0C4B4",
};

const successToast = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "13px 16px",
  borderRadius: 14,
  background: "#fff",
  border: "1.5px solid #C8DFC0",
  color: C.greenDark,
  fontWeight: 700,
  fontSize: 13,
  marginBottom: 20,
  boxShadow: "0 4px 14px rgba(15,33,16,.05)",
  overflow: "hidden",
  position: "relative",
};

const errorToast = {
  ...successToast,
  border: "1.5px solid #FECACA",
  color: "#991B1B",
};

const toastBar = (color) => ({
  position: "absolute",
  left: 0,
  top: 0,
  bottom: 0,
  width: 4,
  background: color,
});

const kpiGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(5, 1fr)",
  gap: 14,
  marginBottom: 24,
};

const kpiCard = {
  background: "#fff",
  borderRadius: 20,
  padding: 18,
  boxShadow: "0 8px 24px rgba(17,24,39,.05)",
};

const kpiTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
};

const kpiLabel = {
  fontSize: 11,
  color: C.textMid,
  fontWeight: 700,
};

const kpiIcon = {
  width: 30,
  height: 30,
  borderRadius: 9,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const kpiValue = {
  fontFamily: C.sans,
  fontSize: 15,
  fontWeight: 900,
  color: C.text,
};

const layout = {
  display: "grid",
  gridTemplateColumns: "240px 1fr",
  gap: 18,
  alignItems: "start",
};

const sidebar = {
  background: "#fff",
  borderRadius: 22,
  padding: "22px 18px",
  boxShadow: "0 8px 24px rgba(17,24,39,.06)",
};

const avatarRing = {
  position: "relative",
  width: 84,
  margin: "0 auto 14px",
};

const avatarCircle = {
  width: 84,
  height: 84,
  borderRadius: 24,
  background: `linear-gradient(135deg, ${C.greenDark}, #1B3B20)`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const avatarLetter = {
  fontSize: 36,
  fontWeight: 900,
  color: "#9FE3A1",
};

const onlineDot = {
  position: "absolute",
  bottom: 5,
  right: 5,
  width: 13,
  height: 13,
  borderRadius: "50%",
  background: C.green,
  border: "2px solid #fff",
};

const profileName = {
  textAlign: "center",
  fontSize: 17,
  fontWeight: 900,
  color: C.text,
  margin: "0 0 4px",
};

const profileId = {
  textAlign: "center",
  fontSize: 12,
  color: C.textLight,
  marginBottom: 12,
  fontWeight: 700,
};

const divider = {
  height: 1,
  background: "#EDF2EB",
  margin: "16px 0",
};

const nav = {
  display: "flex",
  flexDirection: "column",
  gap: 5,
};

const navItem = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "10px 12px",
  borderRadius: 12,
  border: "none",
  background: "transparent",
  fontSize: 13,
  fontWeight: 600,
  color: C.textMid,
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
};

const navItemActive = {
  ...navItem,
  background: C.greenDim,
  color: "#1B4A1E",
  fontWeight: 900,
};

const navIconWrap = (active) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 28,
  height: 28,
  borderRadius: 8,
  background: active ? "#C8E6C9" : "#F0F4EC",
  color: active ? C.greenDark : "#7A9980",
  flexShrink: 0,
});

const navArrow = {
  marginLeft: "auto",
  fontSize: 16,
  color: C.green,
};

const sectionWrap = {
  background: "#fff",
  borderRadius: 22,
  padding: 24,
  boxShadow: "0 8px 24px rgba(17,24,39,.06)",
};

const sectionHead = {
  display: "flex",
  alignItems: "flex-start",
  gap: 14,
  marginBottom: 22,
};

const sectionIconWrap = {
  width: 40,
  height: 40,
  borderRadius: 12,
  background: C.greenDim,
  color: C.greenDark,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const sectionTitle = {
  margin: 0,
  fontFamily: C.sans,
  fontSize: 17,
  fontWeight: 900,
  color: C.text,
};

const sectionSub = {
  margin: "3px 0 0",
  fontSize: 12,
  color: C.textLight,
  fontWeight: 600,
};

const fieldGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 14,
};

const labelStyle = {
  display: "block",
  fontSize: 11,
  color: "#7A9980",
  fontWeight: 800,
  marginBottom: 7,
  textTransform: "uppercase",
  letterSpacing: ".06em",
};

const inputWrap = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  height: 46,
  borderRadius: 13,
  border: "1.5px solid",
  padding: "0 14px",
};

const inputIcon = {
  display: "flex",
  color: C.textLight,
  flexShrink: 0,
};

const inputBase = {
  flex: 1,
  border: "none",
  outline: "none",
  background: "transparent",
  fontSize: 13.5,
  fontFamily: "inherit",
  fontWeight: 600,
};

const editDot = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: C.green,
  flexShrink: 0,
};

const accountGrid = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 1fr",
  gap: 14,
};

const accountCard = {
  padding: 20,
  borderRadius: 16,
  border: "1.5px solid",
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const accountIcon = {
  width: 38,
  height: 38,
  borderRadius: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const accountLabel = {
  fontSize: 11,
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: ".06em",
  color: C.textMid,
};

const accountValue = {
  fontSize: 16,
  fontWeight: 900,
};

const strengthWrap = {
  marginTop: 16,
  padding: "14px 16px",
  borderRadius: 13,
  background: "#F9FCF6",
  border: "1.5px solid #E6EDE4",
};

const strengthHeader = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: 10,
};

const strengthTrack = {
  height: 5,
  borderRadius: 99,
  background: "#E6EDE4",
  overflow: "hidden",
};

const secActions = {
  display: "flex",
  gap: 10,
  marginTop: 20,
  flexWrap: "wrap",
};

const primaryBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "10px 20px",
  borderRadius: 12,
  background: C.text,
  color: "#9FD3A0",
  border: "none",
  fontSize: 13,
  fontWeight: 800,
  cursor: "pointer",
};

const ghostBtn = {
  display: "inline-flex",
  alignItems: "center",
  gap: 7,
  padding: "10px 16px",
  borderRadius: 12,
  background: "transparent",
  color: "#5C7A5E",
  border: "1.5px solid #C8DFC0",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};