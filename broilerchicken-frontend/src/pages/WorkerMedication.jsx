import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  Pill,
  Package,
  ChevronDown,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ClipboardList,
  RefreshCw,
  X,
  Info,
  Save,
  Search,
  UploadCloud,
  Image as ImageIcon,
  Lightbulb,
} from "lucide-react";

/* ─── Dashboard Font + Design Tokens ───────────────────────────── */
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
  purpleDark: "#6D28D9",
  purpleDim: "#F0EDFF",
  teal: "#14B8A6",
  tealDim: "#E6FFFA",
  text: "#102114",
  textMid: "#6E8A72",
  textLight: "#9AA89B",
  sans: "'Plus Jakarta Sans', sans-serif",
  body: "'Inter', sans-serif",
};

const ease = [0.22, 1, 0.36, 1];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease },
});

function localDateInput(date = new Date()) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}

function n(value, digits = 0) {
  return Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function money(value) {
  return `RM ${n(value, 2)}`;
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatLastMedication(value) {
  if (!value) return "No medication recorded yet";
  const d = new Date(value);
  const today = new Date();
  const diff = Math.floor(
    (today.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) / 86400000
  );
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -16, scale: 0.96 }}
        style={{
          position: "fixed",
          top: 86,
          right: 28,
          zIndex: 900,
          background: C.surface,
          border: `1.5px solid ${toast.type === "success" ? C.green : C.red}40`,
          borderLeft: `5px solid ${toast.type === "success" ? C.green : C.red}`,
          borderRadius: 16,
          padding: "14px 18px",
          boxShadow: "0 18px 48px rgba(16,33,20,.18)",
          minWidth: 330,
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontFamily: C.body,
        }}
      >
        {toast.type === "success" ? (
          <CheckCircle2 size={20} color={C.green} />
        ) : (
          <AlertTriangle size={20} color={C.red} />
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 13, color: C.text }}>
            {toast.message}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
            color: C.textLight,
          }}
        >
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

function Section({ title, icon: Icon, children, right }) {
  return (
    <motion.section
      {...fadeUp(0.06)}
      style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 22,
        padding: 20,
        boxShadow: "0 6px 24px rgba(16,33,20,.06)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: C.purpleDim,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Icon size={16} color={C.purpleDark} />
          </div>
          <div style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 15, color: C.text }}>{title}</div>
        </div>
        {right}
      </div>
      {children}
    </motion.section>
  );
}

function Metric({ label, value, icon, color = C.text }) {
  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      padding: "14px 16px",
    }}>
      <div style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 18, color, marginBottom: 4 }}>
        {icon} {value}
      </div>
      <div style={{ fontSize: 11, color: C.textLight, textTransform: "uppercase", letterSpacing: ".06em", fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}

function QuickButton({ children, onClick, color = C.purple }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      type="button"
      style={{
        border: `1.5px solid ${color}30`,
        background: `${color}12`,
        color,
        borderRadius: 12,
        padding: "8px 12px",
        fontFamily: C.sans,
        fontWeight: 800,
        fontSize: 12,
        cursor: "pointer",
      }}
    >
      {children}
    </motion.button>
  );
}

const inputStyle = {
  width: "100%",
  height: 52,
  border: `1.5px solid ${C.border}`,
  borderRadius: 16,
  padding: "0 15px",
  fontFamily: C.body,
  fontSize: 13,
  fontWeight: 600,
  color: C.text,
  background: C.bg,
};

export default function WorkerMedication() {
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef(null);

  const [batches, setBatches] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [medicationName, setMedicationName] = useState("");
  const [dosage, setDosage] = useState("");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState("");
  const [medicationDate, setMedicationDate] = useState(localDateInput());
  const [remark, setRemark] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [toast, setToast] = useState(null);
  const [savedState, setSavedState] = useState(false);

  const queryBatchId = new URLSearchParams(location.search).get("batch_id");

  const selectedBatch = useMemo(
    () => batches.find((b) => b.batch_id === selectedBatchId),
    [batches, selectedBatchId]
  );

  const recentBatches = useMemo(() => batches.slice(0, 3), [batches]);

  const validation = useMemo(() => {
    if (!selectedBatchId) return "Please select a batch";
    if (!medicationName.trim() || medicationName.trim().length < 2) return "Please enter medication name";
    if (!dosage.trim()) return "Please enter dosage";
    if (Number(quantity) <= 0 || Number.isNaN(Number(quantity))) return "Quantity must be greater than 0";
    if (Number(cost) < 0 || Number.isNaN(Number(cost))) return "Cost cannot be negative";
    if (!medicationDate) return "Please select date";
    if (medicationDate > localDateInput()) return "Date cannot be in the future";
    return "";
  }, [selectedBatchId, medicationName, dosage, quantity, cost, medicationDate]);

  const formComplete = !validation;

  useEffect(() => {
    fetchPageData();
  }, []);

  useEffect(() => {
    if (!batches.length) return;

    const target =
      queryBatchId && batches.some((b) => b.batch_id === queryBatchId)
        ? queryBatchId
        : batches[0].batch_id;

    setSelectedBatchId((prev) => prev || target);
  }, [batches, queryBatchId]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (toast) setToast(null);
    }, 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/worker/medications/page-data");
      setBatches(Array.isArray(res.data?.batches) ? res.data.batches : []);
      setRecentRecords(Array.isArray(res.data?.recentRecords) ? res.data.recentRecords : []);
    } catch (err) {
      console.error("Failed to load medication page:", err);
      setToast({ type: "error", message: "Failed to load medication page data." });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setToast({ type: "error", message: "Please upload an image file only." });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: "error", message: "Photo must be below 5MB." });
      return;
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoPreview("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const resetForm = () => {
    setMedicationName("");
    setDosage("");
    setQuantity("");
    setCost("");
    setMedicationDate(localDateInput());
    setRemark("");
    clearPhoto();
  };

  const handleSubmit = async () => {
    if (!formComplete || saving) {
      if (validation) setToast({ type: "error", message: validation });
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();
      formData.append("batch_id", selectedBatchId);
      formData.append("medication_name", medicationName.trim());
      formData.append("dosage", dosage.trim());
      formData.append("quantity", String(Number(quantity)));
      formData.append("cost", String(Number(cost || 0)));
      formData.append("medication_date", medicationDate);
      formData.append("remark", remark.trim());

      if (photo) {
        formData.append("medication_photo", photo);
      }

      await API.post("/worker/medications", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSavedState(true);
      setToast({ type: "success", message: "Medication record saved successfully!" });
      resetForm();
      await fetchPageData();

      setTimeout(() => setSavedState(false), 1300);
    } catch (err) {
      console.error("Failed to save medication record:", err);
      setToast({
        type: "error",
        message: err.response?.data?.error || "Failed to save. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSubmit();
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: C.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 14,
        fontFamily: C.body,
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: 46, height: 46, borderRadius: "50%", border: `3px solid ${C.border}`, borderTopColor: C.purple }}
        />
        <p style={{ color: C.textMid, fontWeight: 600 }}>Loading medication page…</p>
      </div>
    );
  }

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        background: C.bg,
        minHeight: "100vh",
        fontFamily: C.body,
        color: C.text,
        paddingBottom: 60,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .input-focus:focus, .select-focus:focus, .textarea-focus:focus {
          outline: none;
          border-color: ${C.purple} !important;
          box-shadow: 0 0 0 4px ${C.purple}18;
        }
        ::-webkit-scrollbar { width: 7px; height: 7px; }
        ::-webkit-scrollbar-thumb { background: #C8D7C1; border-radius: 10px; }
      `}</style>

      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Header */}
      <div style={{
        position: "sticky",
        top: 0,
        zIndex: 200,
        background: "rgba(246,248,243,.92)",
        backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          maxWidth: 1320,
          margin: "0 auto",
          height: 70,
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}>

          <div style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: `linear-gradient(135deg,${C.purple},${C.purpleDark})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 8px 22px ${C.purple}35`,
          }}>
            <Pill size={22} color="#fff" />
          </div>

          <div>
            <h1 style={{ margin: 0, fontFamily: C.sans, fontSize: 23, fontWeight: 900, color: C.text }}>
              Record Medication
            </h1>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: C.textMid, fontWeight: 600 }}>
              Log medication, dosage, cost and photo proof for any active batch
            </p>
          </div>

          <button
            onClick={fetchPageData}
            style={{
              marginLeft: "auto",
              border: `1.5px solid ${C.border}`,
              background: C.surface,
              borderRadius: 13,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: C.sans,
              fontWeight: 800,
              fontSize: 12,
              color: C.text,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "28px 32px 0" }}>
        {/* Row 1 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {/* Batch Selector */}
          <Section title="Select Batch" icon={Package}>
            <div style={{ position: "relative", marginBottom: 14 }}>
              <Search
                size={15}
                color={C.textLight}
                style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
              <select
                className="select-focus"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                style={{
                  width: "100%",
                  height: 52,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 16,
                  padding: "0 44px",
                  fontFamily: C.sans,
                  fontWeight: 800,
                  fontSize: 13,
                  color: C.text,
                  background: C.bg,
                  appearance: "none",
                  cursor: "pointer",
                }}
              >
                <option value="">Select a batch</option>
                {batches.map((b) => (
                  <option key={b.batch_id} value={b.batch_id}>
                    {b.batch_id} - {b.batch_status} - Day {b.age_days} ({n(b.total_chicks)} chicks)
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                color={C.textLight}
                style={{ position: "absolute", right: 15, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
              />
            </div>

            <div style={{ fontSize: 12, color: C.textMid, fontWeight: 700, marginBottom: 8 }}>
              Quick select:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentBatches.length === 0 ? (
                <div style={{ color: C.textLight, fontSize: 12 }}>No active batches found.</div>
              ) : recentBatches.map((b) => (
                <button
                  key={b.batch_id}
                  type="button"
                  onClick={() => setSelectedBatchId(b.batch_id)}
                  style={{
                    border: `1px solid ${selectedBatchId === b.batch_id ? C.purple : C.border}`,
                    background: selectedBatchId === b.batch_id ? C.purpleDim : C.surface,
                    color: C.text,
                    borderRadius: 13,
                    padding: "10px 12px",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: C.body,
                    fontSize: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <span>
                    <strong style={{ color: C.purpleDark }}>{b.batch_id}</strong> - Last: {formatLastMedication(b.last_medication_date)}
                  </span>
                  {selectedBatchId === b.batch_id && (
                    <span style={{ color: C.purple, fontWeight: 900 }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </Section>

          {/* Batch Info Card */}
          <Section title="Batch Information" icon={Info}>
            {!selectedBatch ? (
              <div style={{ padding: 28, textAlign: "center", color: C.textMid }}>
                Select a batch to view details.
              </div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 14 }}>
                  <Metric label="Age" value={`Day ${selectedBatch.age_days || 0}`} icon="📅" color={C.blue} />
                  <Metric label="Chicks" value={n(selectedBatch.total_chicks)} icon="🐤" color={C.greenDark} />
                  <Metric label="Med Cost" value={money(selectedBatch.total_medication_cost)} icon="💊" color={C.purple} />
                </div>

                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, fontSize: 12, color: C.textMid, lineHeight: 1.8 }}>
                  <div>
                    Last medication:{" "}
                    <strong style={{ color: C.text }}>
                      {formatLastMedication(selectedBatch.last_medication_date)}
                    </strong>
                  </div>
                  <div>
                    Name:{" "}
                    <strong style={{ color: C.text }}>
                      {selectedBatch.last_medication_name || "—"}
                    </strong>
                  </div>
                  <div>
                    Dosage:{" "}
                    <strong style={{ color: C.text }}>
                      {selectedBatch.last_medication_dosage || "—"}
                    </strong>
                  </div>
                </div>
              </>
            )}
          </Section>
        </div>

        {/* Medication Details Form */}
        <Section title="Medication Details" icon={Pill}>
          <label style={labelStyle}>Medication Name *</label>
          <input
            className="input-focus"
            value={medicationName}
            onChange={(e) => setMedicationName(e.target.value)}
            placeholder="Vitamin B12 Complex"
            style={inputStyle}
          />
          <div style={{ marginTop: 8, marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, color: C.textMid, fontWeight: 700 }}>💡 Suggestions:</span>
            {["Vitamin B12", "Antibiotic", "Vaccine", "Probiotic"].map((s) => (
              <QuickButton key={s} onClick={() => setMedicationName(s)}>
                {s}
              </QuickButton>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Dosage *</label>
              <input
                className="input-focus"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                placeholder="5ml per litre water"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Quantity *</label>
              <input
                className="input-focus"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="2.5"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Cost (RM) *</label>
              <input
                className="input-focus"
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="150.00"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Date *</label>
              <div style={{ position: "relative" }}>
                <CalendarDays
                  size={16}
                  color={C.textLight}
                  style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                />
                <input
                  className="input-focus"
                  type="date"
                  value={medicationDate}
                  max={localDateInput()}
                  onChange={(e) => setMedicationDate(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 44 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <QuickButton onClick={() => setMedicationDate(localDateInput())}>
                  Today
                </QuickButton>
                <QuickButton onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  setMedicationDate(localDateInput(d));
                }}>
                  Yesterday
                </QuickButton>
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Photo (Optional)</label>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                minHeight: 132,
                border: `2px dashed ${photoPreview ? C.purple : C.border}`,
                background: photoPreview ? C.purpleDim : C.bg,
                borderRadius: 18,
                padding: 18,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              {photoPreview ? (
                <>
                  <img
                    src={photoPreview}
                    alt="Medication preview"
                    style={{
                      width: 100,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 14,
                      border: `1.5px solid ${C.border}`,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: C.sans, fontWeight: 900, color: C.purpleDark, marginBottom: 5 }}>
                      Photo selected
                    </div>
                    <div style={{ fontSize: 12, color: C.textMid }}>{photo?.name}</div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearPhoto();
                      }}
                      style={{
                        marginTop: 10,
                        border: `1.5px solid ${C.red}30`,
                        background: C.redDim,
                        color: C.red,
                        borderRadius: 10,
                        padding: "7px 10px",
                        fontFamily: C.sans,
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Remove photo
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    background: C.purpleDim,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <UploadCloud size={28} color={C.purple} />
                  </div>
                  <div>
                    <div style={{ fontFamily: C.sans, fontWeight: 900, color: C.text, marginBottom: 5 }}>
                      📸 Upload photo of medication or invoice
                    </div>
                    <div style={{ fontSize: 12, color: C.textMid }}>
                      Click to choose JPG, PNG or WEBP. Maximum 5MB.
                    </div>
                  </div>
                </>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                style={{ display: "none" }}
              />
            </div>
          </div>

          {/* Remark */}
          <div>
            <label style={labelStyle}>Remarks</label>
            <textarea
              className="textarea-focus"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Mixed with water, chickens responded well. No adverse reactions observed."
              style={{
                width: "100%",
                minHeight: 118,
                resize: "vertical",
                border: `1.5px solid ${C.border}`,
                borderRadius: 16,
                padding: "14px 16px",
                fontFamily: C.body,
                fontSize: 13,
                color: C.text,
                background: C.bg,
                lineHeight: 1.6,
              }}
            />
          </div>
        </Section>

        {/* Submit */}
        <motion.section {...fadeUp(0.1)} style={{ marginTop: 20 }}>
          <motion.button
            whileHover={formComplete && !saving ? { y: -3, boxShadow: `0 14px 34px ${C.purple}35` } : {}}
            whileTap={formComplete && !saving ? { scale: 0.98 } : {}}
            disabled={!formComplete || saving}
            onClick={handleSubmit}
            type="button"
            style={{
              width: "100%",
              height: 58,
              border: "none",
              borderRadius: 18,
              background: savedState
                ? `linear-gradient(135deg,${C.green},${C.greenDark})`
                : formComplete
                ? `linear-gradient(135deg,${C.purple},${C.purpleDark})`
                : "#D1DDD0",
              color: "#fff",
              fontFamily: C.sans,
              fontSize: 15,
              fontWeight: 900,
              cursor: formComplete && !saving ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            {saving ? (
              <>
                <Loader2 size={18} className="spin" />
                Saving...
              </>
            ) : savedState ? (
              <>
                <CheckCircle2 size={18} />
                Saved!
              </>
            ) : formComplete ? (
              <>
                <Save size={18} />
                💾 Save Medication Record
              </>
            ) : (
              <>
                <AlertTriangle size={18} />
                Please fill all fields
              </>
            )}
          </motion.button>
          {validation && (
            <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: C.textMid }}>
              {validation}
            </div>
          )}
        </motion.section>

        {/* Recent Medication Records */}
        <motion.section {...fadeUp(0.14)} style={{
          marginTop: 24,
          background: C.surface,
          border: `1.5px solid ${C.border}`,
          borderRadius: 22,
          boxShadow: "0 6px 24px rgba(16,33,20,.06)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "18px 20px", borderBottom: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", gap: 9 }}>
            <ClipboardList size={18} color={C.purpleDark} />
            <div style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 15 }}>
              Recent Medication Records
            </div>
            <span style={{ marginLeft: 8, fontSize: 11, color: C.textMid, fontWeight: 700 }}>
              Last 10 records
            </span>
          </div>

          {recentRecords.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: C.textMid }}>
              <Pill size={34} color={C.textLight} />
              <div style={{ marginTop: 10, fontFamily: C.sans, fontWeight: 800 }}>No recent medication records</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Save a medication record to see it here.</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.purpleDim }}>
                    {["Batch", "Date", "Medication", "Dosage", "Cost", "Photo", "By"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "13px 16px",
                          textAlign: "left",
                          color: C.purpleDark,
                          fontFamily: C.sans,
                          fontWeight: 900,
                          fontSize: 11,
                          letterSpacing: ".07em",
                          textTransform: "uppercase",
                          borderBottom: `1.5px solid ${C.border}`,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((r, idx) => (
                    <tr
                      key={r.medication_id || `${r.batch_id}-${r.medication_date}-${idx}`}
                      style={{
                        background: r.is_mine ? C.purpleDim : idx % 2 === 0 ? C.surface : C.bg,
                      }}
                    >
                      <td style={cellStyle}><strong style={{ color: C.blue }}>{r.batch_id}</strong></td>
                      <td style={cellStyle}>{formatDate(r.medication_date)}</td>
                      <td style={cellStyle}>{r.medication_name || "—"}</td>
                      <td style={cellStyle}>{r.dosage || "—"}</td>
                      <td style={cellStyle}>{money(r.cost)}</td>
                      <td style={cellStyle}>
                        {r.medication_photo ? (
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: C.purpleDark, fontWeight: 800 }}>
                            <ImageIcon size={14} /> Uploaded
                          </span>
                        ) : "—"}
                      </td>
                      <td style={cellStyle}>
                        <span style={{
                          background: r.is_mine ? C.purple : C.bg,
                          color: r.is_mine ? "#fff" : C.textMid,
                          borderRadius: 99,
                          padding: "4px 9px",
                          fontSize: 11,
                          fontWeight: 800,
                        }}>
                          {r.recorded_by || r.user_id}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>

        {/* Quick Tips */}
        <motion.section {...fadeUp(0.18)} style={{
          marginTop: 24,
          background: C.surface,
          border: `1.5px solid ${C.border}`,
          borderRadius: 22,
          padding: 20,
          boxShadow: "0 6px 24px rgba(16,33,20,.06)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
            <Lightbulb size={18} color={C.amber} />
            <div style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 15 }}>Quick Tips</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            {[
              "Always follow withdrawal periods before harvest.",
              "Record batch number and expiry date of medication.",
              "Note any unusual reactions after administration.",
            ].map((tip, i) => (
              <div
                key={i}
                style={{
                  background: C.amberDim,
                  border: `1px solid ${C.amber}25`,
                  borderRadius: 15,
                  padding: "13px 14px",
                  fontSize: 12,
                  color: "#92400E",
                  lineHeight: 1.6,
                  fontWeight: 700,
                }}
              >
                • {tip}
              </div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <div style={{ marginTop: 28, color: C.textLight, fontSize: 11, fontWeight: 700 }}>
          AyamTech Worker Hub · Keep up the great work!
        </div>
      </main>

      <style>{`
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1000px) {
          main > div, main section div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontFamily: C.sans,
  fontWeight: 900,
  fontSize: 13,
  marginBottom: 10,
  color: C.text,
};

const cellStyle = {
  padding: "14px 16px",
  borderBottom: `1px solid ${C.border}`,
  color: C.textMid,
  fontWeight: 600,
};
