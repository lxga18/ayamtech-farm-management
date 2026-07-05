import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Save,
  Edit3,
  BadgeCheck,
  Fingerprint,
  Shield,
  UserCircle2,
  Truck,
  CheckCircle2,
  XCircle,
} from "lucide-react";

const TABS = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "account", label: "Account", icon: Shield },
  { id: "security", label: "Security", icon: Lock },
];

export default function DriverProfile() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ email: "", phone_no: "" });
  const [activeTab, setActiveTab] = useState("personal");
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await API.get("/driver/profile");

      setProfile(res.data);
      setForm({
        email: res.data.email || "",
        phone_no: res.data.phone_no || "",
      });
    } catch (err) {
      console.error("Driver profile error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.error || "Failed to load driver profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    if (!form.email || !form.phone_no) {
      setToast({
        type: "error",
        message: "Email and phone number are required.",
      });
      return;
    }

    try {
      setSaving(true);

      const res = await API.patch("/driver/profile", {
        email: form.email,
        phone_no: form.phone_no,
      });

      setProfile(res.data.profile);
      setForm({
        email: res.data.profile.email || "",
        phone_no: res.data.profile.phone_no || "",
      });

      setEdit(false);
      setToast({ type: "success", message: "Profile updated successfully." });
    } catch (err) {
      console.error("Update driver profile error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.error || "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEdit(false);
    setForm({
      email: profile?.email || "",
      phone_no: profile?.phone_no || "",
    });
  };

  const changePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setToast({ type: "error", message: "Please fill in both password fields." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({ type: "error", message: "Passwords do not match." });
      return;
    }

    if (newPassword.length < 5) {
      setToast({ type: "error", message: "Password must be at least 5 characters." });
      return;
    }

    try {
      setSaving(true);

      await API.patch("/driver/profile/change-password", {
        newPassword,
      });

      setNewPassword("");
      setConfirmPassword("");
      setToast({ type: "success", message: "Password changed successfully." });
    } catch (err) {
      console.error("Change driver password error:", err);
      setToast({
        type: "error",
        message: err.response?.data?.error || "Failed to change password.",
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

  const strengthClass =
    strength === "Strong"
      ? "strong"
      : strength === "Medium"
      ? "medium"
      : strength === "Weak"
      ? "weak"
      : "";

  if (loading) {
    return (
      <div className="driver-profile loading-page">
        <style>{css}</style>
        <motion.div
          className="spinner"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        />
        <p>Loading driver profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="driver-profile loading-page">
        <style>{css}</style>
        <XCircle size={42} color="#EF4444" />
        <p>Driver profile not found.</p>
      </div>
    );
  }

  const kpis = [
    {
      label: "Driver ID",
      value: profile.user_id,
      icon: Fingerprint,
      color: "blue",
    },
    {
      label: "Vehicle",
      value: profile.vehicle_no || "Not assigned",
      icon: Truck,
      color: "green",
    },
    {
      label: "Role",
      value: profile.role,
      icon: Shield,
      color: "purple",
    },
    {
      label: "Status",
      value: profile.status,
      icon: BadgeCheck,
      color: "green",
    },
  ];

  return (
    <div className="driver-profile page">
      <style>{css}</style>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <header className="top">
          <div className="top-left">
            <div className="top-icon">
              <UserCircle2 size={28} />
            </div>
            <div>
              <h1>Driver Profile</h1>
              <p>Manage your delivery account, contact details, and password.</p>
            </div>
          </div>

          <div className="top-actions">
            <div className="status-badge">
              <BadgeCheck size={15} />
              {profile.status || "Active"}
            </div>

            {edit ? (
              <button className="btn ghost" onClick={cancelEdit}>
                Cancel
              </button>
            ) : (
              <button className="btn dark" onClick={() => setEdit(true)}>
                <Edit3 size={14} />
                Edit Profile
              </button>
            )}
          </div>
        </header>

        <section className="kpi-grid">
          {kpis.map((k, i) => {
            const Icon = k.icon;
            return (
              <motion.div
                className={`kpi ${k.color}`}
                key={k.label}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div>
                  <span>{k.label}</span>
                  <h3>{k.value || "—"}</h3>
                </div>
                <div className="kpi-icon">
                  <Icon size={19} />
                </div>
              </motion.div>
            );
          })}
        </section>

        <div className="layout">
          <aside className="side-card">
            <div className="avatar-wrap">
              <div className="avatar">
                {profile.full_name?.charAt(0)?.toUpperCase() || "D"}
              </div>
              <span className="online-dot" />
            </div>

            <h2>{profile.full_name || "Driver"}</h2>
            <p>{profile.username || profile.user_id}</p>

            <div className="divider" />

            <nav>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={active ? "nav active" : "nav"}
                  >
                    <span>
                      <Icon size={15} />
                    </span>
                    {tab.label}
                    {active && <b>›</b>}
                  </button>
                );
              })}
            </nav>
          </aside>

          <main>
            <AnimatePresence mode="wait">
              {activeTab === "personal" && (
                <motion.section key="personal" className="content-card" {...tabMotion}>
                  <SectionHead
                    icon={<User size={18} />}
                    title="Personal Information"
                    subtitle="Your identity and contact details."
                  />

                  <div className="field-grid">
                    <Field label="Driver ID" value={profile.user_id} disabled icon={<Fingerprint size={15} />} />
                    <Field label="Full Name" value={profile.full_name} disabled icon={<User size={15} />} />
                    <Field label="Username" value={profile.username} disabled icon={<Shield size={15} />} />
                    <Field label="Role" value={profile.role} disabled icon={<BadgeCheck size={15} />} />

                    <Field
                      label="Email Address"
                      value={form.email}
                      disabled={!edit}
                      icon={<Mail size={15} />}
                      onChange={(value) => setForm({ ...form, email: value })}
                    />

                    <Field
                      label="Phone Number"
                      value={form.phone_no}
                      disabled={!edit}
                      icon={<Phone size={15} />}
                      onChange={(value) => setForm({ ...form, phone_no: value })}
                    />
                  </div>

                  {edit && (
                    <button className="btn dark save-btn" onClick={updateProfile} disabled={saving}>
                      <Save size={14} />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  )}
                </motion.section>
              )}

              {activeTab === "account" && (
                <motion.section key="account" className="content-card" {...tabMotion}>
                  <SectionHead
                    icon={<Truck size={18} />}
                    title="Driver Account"
                    subtitle="Your account access and assigned vehicle."
                  />

                  <div className="account-grid">
                    <InfoBox label="Vehicle Number" value={profile.vehicle_no || "Not assigned"} icon="🚛" />
                    <InfoBox label="Account Status" value={profile.status || "Active"} icon="✅" />
                    <InfoBox label="Access Module" value="Driver Delivery Hub" icon="🛡️" />
                  </div>

                  <div className="note">
                    <b>Note:</b> Vehicle number is assigned by the owner/admin. Driver can only update email, phone number, and password.
                  </div>
                </motion.section>
              )}

              {activeTab === "security" && (
                <motion.section key="security" className="content-card" {...tabMotion}>
                  <SectionHead
                    icon={<Lock size={18} />}
                    title="Security Settings"
                    subtitle="Change your password to protect your driver account."
                  />

                  <div className="field-grid">
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
                    <div className="strength">
                      <div>
                        <span>Password strength</span>
                        <b className={strengthClass}>{strength}</b>
                      </div>
                      <div className="strength-track">
                        <motion.span
                          className={strengthClass}
                          initial={{ width: 0 }}
                          animate={{
                            width:
                              strength === "Strong"
                                ? "100%"
                                : strength === "Medium"
                                ? "60%"
                                : "28%",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="actions">
                    <button className="btn ghost" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showPassword ? "Hide Passwords" : "Show Passwords"}
                    </button>

                    <button className="btn dark" onClick={changePassword} disabled={saving}>
                      <Lock size={14} />
                      {saving ? "Changing..." : "Change Password"}
                    </button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </main>
        </div>
      </motion.div>
    </div>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`toast ${toast.type}`}
        initial={{ opacity: 0, y: -12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.96 }}
      >
        {toast.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
        <span>{toast.message}</span>
        <button onClick={onClose}>×</button>
      </motion.div>
    </AnimatePresence>
  );
}

function SectionHead({ icon, title, subtitle }) {
  return (
    <div className="section-head">
      <div>{icon}</div>
      <section>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </section>
    </div>
  );
}

function Field({ label, value, disabled, onChange, icon }) {
  return (
    <div>
      <label>{label}</label>
      <div className={disabled ? "input disabled" : "input"}>
        {icon}
        <input
          value={value || ""}
          disabled={disabled}
          onChange={(e) => onChange && onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function PasswordField({ label, value, show, onChange }) {
  return (
    <div>
      <label>{label}</label>
      <div className="input">
        <Lock size={15} />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
        />
      </div>
    </div>
  );
}

function InfoBox({ label, value, icon }) {
  return (
    <div className="info-box">
      <div>{icon}</div>
      <span>{label}</span>
      <h3>{value}</h3>
    </div>
  );
}

const tabMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
  transition: { duration: 0.25 },
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');

.driver-profile * {
  box-sizing: border-box;
}

.driver-profile {
  --bg:#F6F8F3;
  --card:#FFFFFF;
  --border:#E5EDE0;
  --green:#4CAF50;
  --green-dark:#2E7D32;
  --green-dim:#EAF7E3;
  --blue:#3B82F6;
  --blue-dim:#EFF6FF;
  --amber:#F59E0B;
  --amber-dim:#FFF8EC;
  --red:#EF4444;
  --red-dim:#FEE2E2;
  --text:#102114;
  --muted:#6E8A72;
  --light:#9AA89B;
  font-family:'Inter',sans-serif;
  color:var(--text);
}

.page {
  min-height:100vh;
  padding:32px;
  background:var(--bg);
}

.loading-page {
  min-height:100vh;
  background:var(--bg);
  display:flex;
  align-items:center;
  justify-content:center;
  flex-direction:column;
  gap:14px;
  font-weight:800;
  color:var(--muted);
}

.spinner {
  width:38px;
  height:38px;
  border-radius:50%;
  border:3px solid var(--border);
  border-top-color:var(--blue);
}

.top {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:16px;
  margin-bottom:24px;
}

.top-left {
  display:flex;
  align-items:center;
  gap:14px;
}

.top-icon {
  width:54px;
  height:54px;
  border-radius:16px;
  background:linear-gradient(135deg,var(--blue),#1D4ED8);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  box-shadow:0 10px 26px rgba(59,130,246,.25);
}

.top h1 {
  margin:0;
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:28px;
  font-weight:900;
}

.top p {
  margin:4px 0 0;
  color:var(--muted);
  font-size:13px;
  font-weight:700;
}

.top-actions {
  display:flex;
  align-items:center;
  gap:10px;
}

.status-badge {
  padding:10px 16px;
  border-radius:12px;
  background:var(--green-dim);
  color:var(--green-dark);
  font-size:13px;
  font-weight:900;
  display:flex;
  align-items:center;
  gap:6px;
}

.btn {
  border:none;
  border-radius:12px;
  padding:10px 17px;
  display:inline-flex;
  align-items:center;
  gap:7px;
  font-weight:900;
  cursor:pointer;
  transition:.2s;
}

.btn:hover {
  transform:translateY(-1px);
}

.btn.dark {
  background:var(--text);
  color:#fff;
}

.btn.ghost {
  background:transparent;
  color:var(--muted);
  border:1.5px solid var(--border);
}

.btn:disabled {
  opacity:.65;
  cursor:not-allowed;
}

.kpi-grid {
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:14px;
  margin-bottom:22px;
}

.kpi {
  background:var(--card);
  border-radius:20px;
  padding:18px;
  box-shadow:0 8px 24px rgba(17,24,39,.05);
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
}

.kpi span {
  font-size:11px;
  color:var(--muted);
  font-weight:800;
}

.kpi h3 {
  margin:8px 0 0;
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:16px;
  font-weight:900;
}

.kpi-icon {
  width:34px;
  height:34px;
  border-radius:10px;
  display:flex;
  align-items:center;
  justify-content:center;
}

.kpi.blue {
  border-top:3px solid var(--blue);
}
.kpi.blue .kpi-icon {
  color:var(--blue);
  background:var(--blue-dim);
}

.kpi.green {
  border-top:3px solid var(--green);
}
.kpi.green .kpi-icon {
  color:var(--green-dark);
  background:var(--green-dim);
}

.kpi.purple {
  border-top:3px solid #8B5CF6;
}
.kpi.purple .kpi-icon {
  color:#7C3AED;
  background:#F0EDFF;
}

.layout {
  display:grid;
  grid-template-columns:250px 1fr;
  gap:18px;
  align-items:start;
}

.side-card,
.content-card {
  background:var(--card);
  border-radius:22px;
  padding:24px 18px;
  box-shadow:0 8px 24px rgba(17,24,39,.06);
}

.content-card {
  padding:24px;
}

.avatar-wrap {
  position:relative;
  width:84px;
  margin:0 auto 14px;
}

.avatar {
  width:84px;
  height:84px;
  border-radius:24px;
  background:linear-gradient(135deg,var(--blue),#102114);
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:36px;
  font-weight:900;
}

.online-dot {
  position:absolute;
  bottom:5px;
  right:5px;
  width:13px;
  height:13px;
  border-radius:50%;
  background:var(--green);
  border:2px solid #fff;
}

.side-card h2 {
  text-align:center;
  margin:0 0 4px;
  font-size:17px;
  font-weight:900;
}

.side-card p {
  text-align:center;
  margin:0;
  font-size:12px;
  color:var(--light);
  font-weight:800;
}

.divider {
  height:1px;
  background:#EDF2EB;
  margin:18px 0;
}

.nav {
  width:100%;
  border:none;
  border-radius:12px;
  background:transparent;
  padding:10px 12px;
  display:flex;
  align-items:center;
  gap:10px;
  color:var(--muted);
  font-size:13px;
  font-weight:700;
  cursor:pointer;
  margin-bottom:6px;
}

.nav span {
  width:28px;
  height:28px;
  border-radius:8px;
  background:#F0F4EC;
  display:flex;
  align-items:center;
  justify-content:center;
}

.nav.active {
  background:var(--blue-dim);
  color:#1D4ED8;
  font-weight:900;
}

.nav.active span {
  background:#DBEAFE;
}

.nav b {
  margin-left:auto;
}

.section-head {
  display:flex;
  gap:14px;
  align-items:flex-start;
  margin-bottom:22px;
}

.section-head > div {
  width:40px;
  height:40px;
  border-radius:12px;
  background:var(--blue-dim);
  color:var(--blue);
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
}

.section-head h3 {
  margin:0;
  font-family:'Plus Jakarta Sans',sans-serif;
  font-size:17px;
  font-weight:900;
}

.section-head p {
  margin:4px 0 0;
  font-size:12px;
  color:var(--light);
  font-weight:700;
}

.field-grid,
.account-grid {
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
}

.account-grid {
  grid-template-columns:repeat(3,1fr);
}

label {
  display:block;
  font-size:11px;
  color:var(--muted);
  font-weight:900;
  margin-bottom:7px;
  text-transform:uppercase;
  letter-spacing:.06em;
}

.input {
  display:flex;
  align-items:center;
  gap:10px;
  height:46px;
  border-radius:13px;
  border:1.5px solid var(--border);
  background:#FAFCF8;
  padding:0 14px;
  color:var(--light);
}

.input.disabled {
  background:#F0F7EC;
}

.input input {
  flex:1;
  border:none;
  outline:none;
  background:transparent;
  font-size:13.5px;
  font-family:'Inter',sans-serif;
  font-weight:700;
  color:var(--text);
}

.input input:disabled {
  color:#7A9980;
  cursor:default;
}

.save-btn {
  margin-top:18px;
}

.info-box {
  border:1.5px solid var(--border);
  border-radius:16px;
  padding:20px;
  background:#FAFCF8;
}

.info-box div {
  font-size:27px;
}

.info-box span {
  display:block;
  margin-top:8px;
  font-size:11px;
  color:var(--muted);
  font-weight:900;
  text-transform:uppercase;
  letter-spacing:.06em;
}

.info-box h3 {
  margin:6px 0 0;
  font-size:16px;
  font-weight:900;
}

.note {
  margin-top:16px;
  background:var(--amber-dim);
  border:1px solid rgba(245,158,11,.25);
  color:#92400E;
  border-radius:14px;
  padding:14px;
  font-size:13px;
  font-weight:700;
}

.actions {
  display:flex;
  gap:10px;
  margin-top:20px;
  flex-wrap:wrap;
}

.strength {
  margin-top:16px;
  padding:14px;
  border-radius:13px;
  background:#F9FCF6;
  border:1.5px solid var(--border);
}

.strength > div:first-child {
  display:flex;
  justify-content:space-between;
  font-size:12px;
  font-weight:800;
  margin-bottom:9px;
}

.strength-track {
  height:6px;
  border-radius:999px;
  background:#E6EDE4;
  overflow:hidden;
}

.strength-track span {
  display:block;
  height:100%;
  border-radius:999px;
}

.strong {
  color:var(--green-dark);
  background:var(--green-dark);
}

.medium {
  color:#D97706;
  background:#D97706;
}

.weak {
  color:#B91C1C;
  background:#B91C1C;
}

.toast {
  position:fixed;
  top:90px;
  right:28px;
  z-index:1000;
  min-width:310px;
  background:#fff;
  border-radius:16px;
  padding:14px 16px;
  box-shadow:0 18px 48px rgba(16,33,20,.16);
  display:flex;
  align-items:center;
  gap:10px;
  font-weight:900;
}

.toast.success {
  color:var(--green-dark);
  border:1.5px solid #C8DFC0;
  border-left:5px solid var(--green-dark);
}

.toast.error {
  color:#991B1B;
  border:1.5px solid #FECACA;
  border-left:5px solid var(--red);
}

.toast span {
  flex:1;
}

.toast button {
  border:none;
  background:transparent;
  color:inherit;
  font-size:18px;
  cursor:pointer;
}

@media (max-width:1050px) {
  .layout,
  .field-grid,
  .account-grid {
    grid-template-columns:1fr;
  }

  .kpi-grid {
    grid-template-columns:repeat(2,1fr);
  }

  .top {
    flex-direction:column;
  }
}
`;