import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  HelpCircle, Search, Mail, Phone, Send,
  ChevronDown, CreditCard, Truck, Package, User, ShieldCheck,
  Clock, Headphones, Zap
} from "lucide-react";

const faqs = [
  { q: "How do I place an order?", a: "Go to Place Order, choose batch, quantity, delivery type, preferred date, then submit. The owner will approve it first.", cat: "Order", icon: <Package size={17} /> },
  { q: "Why can't I pay for my order?", a: "Only approved and unpaid orders will appear in the payment page.", cat: "Payment", icon: <CreditCard size={17} /> },
  { q: "How much is the delivery fee?", a: "Delivery fee is RM25 for delivery orders. Pickup orders do not include delivery fee.", cat: "Delivery", icon: <Truck size={17} /> },
  { q: "How do I know my order is completed?", a: "For delivery, the order is completed when delivery status becomes Completed. For pickup, it is completed after successful pickup.", cat: "Order", icon: <Package size={17} /> },
  { q: "Can I change my address?", a: "Yes. Go to Profile > Address and update your registered address.", cat: "Account", icon: <User size={17} /> },
  { q: "How do I change my password?", a: "Go to Profile > Security, enter new password and confirm password, then click Change Password.", cat: "Account", icon: <ShieldCheck size={17} /> },
];

const categories = ["All", "Order", "Payment", "Delivery", "Account"];

const catMeta = {
  Order: { color: "#3B82F6", bg: "#EFF6FF" },
  Payment: { color: "#8B5CF6", bg: "#F0EDFF" },
  Delivery: { color: "#F59E0B", bg: "#FFF8EC" },
  Account: { color: "#EC4899", bg: "#FDF2F8" },
};

export default function CustomerSupport() {
  const customerId = sessionStorage.getItem("customer_id");
  const [profile, setProfile] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState(null);
  const [form, setForm] = useState({
    subject: "",
    issueType: "Order Issue",
    priority: "Medium",
    message: "",
  });

  useEffect(() => {
    API.get(`/customer/profile/${customerId}`)
      .then((res) => setProfile(res.data))
      .catch((err) => console.error("Support profile error:", err));
  }, [customerId]);

  const filteredFaqs = useMemo(() => {
    const s = search.toLowerCase();
    return faqs.filter((f) =>
      (category === "All" || f.cat === category) &&
      (f.q.toLowerCase().includes(s) || f.a.toLowerCase().includes(s))
    );
  }, [search, category]);

  const emailBody = `
Customer Support Request

Customer ID: ${profile?.customer_id || customerId}
Name: ${profile?.full_name || "-"}
Email: ${profile?.email || "-"}
Phone: ${profile?.phone_no || "-"}

Issue Type: ${form.issueType}
Priority: ${form.priority}

Message:
${form.message}
`;

  const sendEmail = () => {
    const ownerEmail = "legasheenee@gmail.com";
    const url = `mailto:${ownerEmail}?subject=${encodeURIComponent(form.subject || "AyamTech Support Request")}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = url;
  };

  return (
    <div style={page}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div style={header}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={headerIcon}>
              <Headphones size={24} color="#4CAF50" />
            </div>
            <div>
              <div style={title}>Support Center</div>
              <div style={subtitle}>Get help with orders, payments, deliveries and account issues.</div>
            </div>
          </div>

          <div style={statusBadge}>
            <Zap size={13} color="#3A7D1C" />
            Response within 24 hours
          </div>
        </div>

        <div style={layout}>
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <div style={card}>
              <div style={cardHeader}>
                <div style={cardIconWrap}><HelpCircle size={18} /></div>
                <div>
                  <div style={cardTitle}>FAQ Help Center</div>
                  <div style={cardSub}>Browse common questions by category</div>
                </div>
              </div>

              <div style={searchBox}>
                <Search size={15} color="#6E8A72" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search help topics…"
                  style={searchInput}
                />
              </div>

              <div style={catRow}>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    style={category === c ? catActive : catBtn}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {filteredFaqs.length === 0 ? (
                  <div style={emptyState}>No results found for "{search}"</div>
                ) : (
                  filteredFaqs.map((faq, index) => {
                    const meta = catMeta[faq.cat] || { color: "#4CAF50", bg: "#EAF7E3" };
                    const isOpen = openFaq === index;

                    return (
                      <motion.div
                        key={faq.q}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ ...faqCard, border: isOpen ? `1.5px solid ${meta.color}44` : "1.5px solid #E5EDE0" }}
                      >
                        <button onClick={() => setOpenFaq(isOpen ? null : index)} style={faqButton}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ ...faqIconWrap, background: meta.bg, color: meta.color }}>
                              {faq.icon}
                            </div>
                            <div style={{ textAlign: "left" }}>
                              <div style={faqQ}>{faq.q}</div>
                              <span style={{ ...catTag, background: meta.bg, color: meta.color }}>
                                {faq.cat}
                              </span>
                            </div>
                          </div>

                          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                            <ChevronDown size={18} color="#9AA89B" />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25 }}
                              style={{ overflow: "hidden" }}
                            >
                              <div style={faqAnswer}>{faq.a}</div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div style={card}>
              <div style={cardHeader}>
                <div style={cardIconWrap}><Send size={18} /></div>
                <div>
                  <div style={cardTitle}>Contact Support</div>
                  <div style={cardSub}>Send us a message and we'll get back to you</div>
                </div>
              </div>

              <div style={profileBox}>
                <div style={avatarCircle}>
                  {profile?.full_name?.charAt(0) || "C"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, color: "#102114", fontSize: "14px" }}>{profile?.full_name || "Customer"}</div>
                  <div style={mutedText}>{profile?.customer_id || customerId}</div>
                </div>
                <div style={verifiedPill}>
                  <ShieldCheck size={11} />
                  Verified
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={fieldLabel}>Issue Type</label>
                  <select style={sel} value={form.issueType} onChange={(e) => setForm({ ...form, issueType: e.target.value })}>
                    <option>Order Issue</option>
                    <option>Payment Issue</option>
                    <option>Delivery Issue</option>
                    <option>Account Issue</option>
                    <option>Technical Problem</option>
                  </select>
                </div>

                <div>
                  <label style={fieldLabel}>Priority</label>
                  <select style={sel} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: "12px" }}>
                <label style={fieldLabel}>Subject</label>
                <input
                  style={textInput}
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  placeholder="e.g. Payment successful but order not updated"
                />
              </div>

              <div style={{ marginTop: "12px" }}>
                <label style={fieldLabel}>Message</label>
                <textarea
                  style={textareaStyle}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Describe your issue in detail…"
                />
              </div>

              <div style={{ marginTop: "16px" }}>
                <button style={{ ...emailBtn, width: "100%" }}
                  onClick={sendEmail}
                >
                  <Mail size={15} /> Send Email
                </button>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div style={{ ...card, marginTop: "16px" }}>
                <div style={cardHeader}>
                  <div style={cardIconWrap}><Phone size={18} /></div>
                  <div>
                    <div style={cardTitle}>Support Information</div>
                    <div style={cardSub}>Other ways to reach us</div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  <InfoRow icon={<Mail size={15} />} label="Email" value="owner@ayamtech.com" color="#3B82F6" bg="#EFF6FF" />
                  <InfoRow icon={<Phone size={15} />} label="Phone" value="+60 12-345 6789" color="#4CAF50" bg="#EAF7E3" />
                  <InfoRow icon={<Clock size={15} />} label="Hours" value="Mon–Fri, 9AM–6PM" color="#F59E0B" bg="#FFF8EC" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

function InfoRow({ icon, label, value, color, bg }) {
  return (
    <div style={infoRow}>
      <div style={{ ...infoIconWrap, color, background: bg }}>{icon}</div>
      <div>
        <div style={{ fontSize: "11px", color: "#9AA89B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#102114", marginTop: "2px" }}>{value}</div>
      </div>
    </div>
  );
}

const page = { padding: "32px", background: "#F4F7F2", minHeight: "100vh", fontFamily: "'Inter', sans-serif" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "22px" };
const headerIcon = { width: "48px", height: "48px", borderRadius: "15px", background: "#102114", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const title = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "28px", fontWeight: 800, color: "#102114" };
const subtitle = { color: "#6E8A72", fontSize: "13px", marginTop: "2px" };
const statusBadge = { padding: "10px 18px", borderRadius: "12px", background: "#EAF7E3", border: "1px solid #C8E6C9", fontSize: "13px", fontWeight: 700, color: "#3A7D1C", display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" };
const layout = { display: "grid", gridTemplateColumns: "1.5fr 0.9fr", gap: "18px", alignItems: "start" };
const card = { background: "#fff", borderRadius: "22px", padding: "24px", boxShadow: "0 8px 24px rgba(17,24,39,0.06)" };
const cardHeader = { display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "20px" };
const cardIconWrap = { width: "40px", height: "40px", borderRadius: "12px", background: "#EAF7E3", color: "#2E6634", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const cardTitle = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "16px", fontWeight: 800, color: "#102114", margin: 0 };
const cardSub = { fontSize: "12px", color: "#9AA89B", marginTop: "2px" };
const searchBox = { display: "flex", alignItems: "center", gap: "10px", height: "46px", border: "1.5px solid #DDE8D7", borderRadius: "13px", padding: "0 14px", marginBottom: "14px", background: "#FAFCF8" };
const searchInput = { border: "none", outline: "none", background: "transparent", width: "100%", fontSize: "13px", color: "#102114" };
const catRow = { display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" };
const catBtn = { padding: "7px 14px", borderRadius: "999px", border: "1.5px solid #E5EDE0", background: "#fff", color: "#4B5E4F", fontWeight: 700, fontSize: "12px", cursor: "pointer" };
const catActive = { ...catBtn, background: "#102114", color: "#fff", border: "1.5px solid #102114" };
const faqCard = { borderRadius: "16px", overflow: "hidden", background: "#FAFCF8", transition: "border-color 0.2s" };
const faqButton = { width: "100%", padding: "16px", border: "none", background: "transparent", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" };
const faqIconWrap = { width: "38px", height: "38px", borderRadius: "11px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };
const faqQ = { fontWeight: 700, color: "#102114", fontSize: "13.5px", marginBottom: "5px" };
const catTag = { display: "inline-block", padding: "2px 9px", borderRadius: "999px", fontSize: "10px", fontWeight: 800, letterSpacing: "0.04em" };
const faqAnswer = { padding: "4px 18px 18px 70px", color: "#5C7A5E", fontSize: "13px", lineHeight: 1.7 };
const emptyState = { textAlign: "center", padding: "32px", color: "#9AA89B", fontSize: "13px" };
const profileBox = { display: "flex", alignItems: "center", gap: "12px", background: "#F4F7F2", borderRadius: "14px", padding: "14px 16px", marginBottom: "18px", border: "1px solid #E5EDE0" };
const avatarCircle = { width: "42px", height: "42px", borderRadius: "12px", background: "#102114", color: "#4CAF50", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "18px", flexShrink: 0 };
const verifiedPill = { display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "999px", background: "#EAF7E3", color: "#3A7D1C", fontSize: "11px", fontWeight: 800 };
const mutedText = { fontSize: "12px", color: "#9AA89B", marginTop: "1px" };
const fieldLabel = { display: "block", fontSize: "11px", color: "#7A9980", fontWeight: 700, marginBottom: "7px", textTransform: "uppercase", letterSpacing: "0.06em" };
const sel = { width: "100%", height: "44px", border: "1.5px solid #DDE8D7", borderRadius: "12px", padding: "0 12px", outline: "none", background: "#FAFCF8", fontSize: "13px", color: "#102114", fontFamily: "'Inter', sans-serif" };
const textInput = { width: "100%", height: "44px", border: "1.5px solid #DDE8D7", borderRadius: "12px", padding: "0 14px", outline: "none", boxSizing: "border-box", fontSize: "13px", fontFamily: "'Inter', sans-serif", background: "#FAFCF8", color: "#102114" };
const textareaStyle = { width: "100%", minHeight: "108px", border: "1.5px solid #DDE8D7", borderRadius: "12px", padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter', sans-serif", fontSize: "13px", background: "#FAFCF8", color: "#102114" };
const emailBtn = { height: "44px", borderRadius: "13px", border: "none", background: "#102114", color: "#9FD3A0", fontWeight: 800, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" };
const infoRow = { display: "flex", alignItems: "center", gap: "12px", padding: "13px 0", borderTop: "1px solid #F0F4EC" };
const infoIconWrap = { width: "34px", height: "34px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 };