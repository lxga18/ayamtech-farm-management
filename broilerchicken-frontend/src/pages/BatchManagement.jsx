import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  Search,
  Filter,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Egg,
  Leaf,
  AlertTriangle,
  TrendingUp,
  ShoppingBag,
  Zap,
  Bell,
  User,
  Package,
  Truck,
  RefreshCw,
  Clock,
  Skull,
  Activity,
  DollarSign,
  Weight,
} from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";

const C = {
  forest: "#0F1F12",
  pine: "#244128",
  fern: "#4CAF50",
  fernDark: "#2E7D32",
  sage: "#6E8A72",
  mist: "#E3EBD9",
  foam: "#F5F7F2",
  white: "#FFFFFF",
  amber: "#F59E0B",
  amberDim: "#FFF5DC",
  amberText: "#92620A",
  red: "#EF4444",
  redDim: "#FEE2E2",
  redText: "#991B1B",
  blue: "#3B82F6",
  blueDim: "#EFF6FF",
  blueText: "#1D4ED8",
  greenDim: "#EAF5E0",
  greenText: "#166534",
  ink: "#1A2E1C",
};

const STAT_ICONS = [Leaf, Egg, Activity, AlertTriangle, ShoppingBag, Clock];
const STAT_COLORS = [C.fern, C.pine, C.blue, C.red, C.amber, C.fern];
const STAT_BG = [C.greenDim, "#E8F4EA", C.blueDim, C.redDim, C.amberDim, C.greenDim];

const getAge = (date) => {
  if (!date) return 0;
  const start = new Date(date);
  const today = new Date();
  if (Number.isNaN(start.getTime())) return 0;
  if (start > today) return 0;
  return Math.floor((today - start) / 86400000);
};

const formatDate = (date) => {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-CA");
};

const numberFormat = (value, decimals = 0) => {
  return Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const statusStyle = (status) => {
  if (status === "Growing") return { bg: C.greenDim, color: C.greenText };
  if (status === "Ready for Sale") return { bg: C.amberDim, color: C.amberText };
  if (status === "Sold") return { bg: "#F3F4F6", color: "#6B7280" };
  return { bg: "#F3F4F6", color: "#6B7280" };
};

function StatCard({ title, value, sub, index }) {
  const Icon = STAT_ICONS[index % STAT_ICONS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -3 }}
      style={{
        background: C.white,
        borderRadius: 18,
        padding: 18,
        border: `1px solid ${C.mist}`,
        boxShadow: "0 8px 24px rgba(16,33,20,0.06)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -24,
          right: -24,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: STAT_BG[index % STAT_BG.length],
          opacity: 0.65,
        }}
      />

      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 13,
          background: STAT_BG[index % STAT_BG.length],
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <Icon size={20} color={STAT_COLORS[index % STAT_COLORS.length]} />
      </div>

      <div
        style={{
          fontSize: 11,
          color: C.sage,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 5,
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          color: C.ink,
          lineHeight: 1,
          fontFamily: "inherit",
        }}
      >
        {value}
      </div>

      <div style={{ fontSize: 12, color: C.sage, marginTop: 7, fontWeight: 600 }}>{sub}</div>
    </motion.div>
  );
}

function SectionHeader({ title, icon: Icon, accent = C.fern }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 24, borderRadius: 99, background: accent }} />
      <Icon size={17} color={accent} />
      <span
        style={{
          fontSize: 14,
          fontWeight: 900,
          color: C.ink,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {title}
      </span>
    </div>
  );
}

function Pill({ children, bg, color }) {
  return (
    <span
      style={{
        padding: "5px 11px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        background: bg,
        color,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function ActionButton({ children, onClick, bg = C.foam, color = C.pine, border = C.mist }) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        height: 36,
        padding: "0 13px",
        borderRadius: 10,
        border: `1px solid ${border}`,
        background: bg,
        color,
        fontWeight: 800,
        fontSize: 12,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "inherit",
      }}
    >
      {children}
    </motion.button>
  );
}

function DetailBox({ label, value }) {
  return (
    <div
      style={{
        background: C.foam,
        borderRadius: 13,
        padding: "12px 14px",
        border: `1px solid ${C.mist}`,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: C.sage,
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          marginBottom: 5,
        }}
      >
        {label}
      </div>

      <div style={{ fontSize: 15, fontWeight: 900, color: C.ink }}>{value ?? "—"}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ textAlign: "center", padding: "30px 0", color: C.sage }}>
      <Leaf size={34} color={C.mist} style={{ marginBottom: 8 }} />
      <div style={{ fontSize: 13, fontWeight: 800 }}>{text}</div>
    </div>
  );
}

function MiniTitle({ children, icon, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      {icon}
      <strong
        style={{
          fontSize: 12,
          color,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {children}
      </strong>
      <div style={{ height: 1, flex: 1, background: C.mist }} />
    </div>
  );
}

function BatchCard({ batch, onView, onEdit, onDelete, onHarvestInfo, canAddHarvestInfo }) {
  const age = getAge(batch.start_date);
  const ss = statusStyle(batch.status);
  const hasHarvestInfo = batch.avg_weight_kg && batch.price_per_kg;
  const isSold = batch.status === "Sold";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: C.white,
        border: `1px solid ${C.mist}`,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(16,33,20,0.05)",
      }}
    >
      <div
        style={{
          height: 4,
          background: batch.status === "Ready for Sale" ? C.amber : 
                     batch.status === "Sold" ? C.sage : C.fern,
        }}
      />

      <div style={{ padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 15 }}>
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 15,
              background: batch.status === "Ready for Sale" ? C.amberDim : 
                        batch.status === "Sold" ? "#F3F4F6" : C.greenDim,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 22 }}>{age >= 35 ? "🐔" : "🐥"}</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: C.sage }}>Day {age}</span>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: C.ink,
                  fontFamily: "inherit",
                }}
              >
                {batch.id}
              </span>

              <Pill bg={ss.bg} color={ss.color}>{batch.status}</Pill>

              {hasHarvestInfo && (
                <Pill bg={C.blueDim} color={C.blueText}>
                  <Weight size={12} style={{ display: "inline", marginRight: 4 }} />
                  {batch.avg_weight_kg}kg @ RM{batch.price_per_kg}/kg
                </Pill>
              )}
            </div>

            <div style={{ height: 1, background: C.mist, marginTop: 10, width: "100%" }} />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
            marginBottom: 15,
          }}
        >
          <DetailBox label="🐤 Initial Chicks" value={numberFormat(batch.chicks)} />
          <DetailBox label="📦 Remaining Stock" value={numberFormat(batch.remaining)} />
          <DetailBox label="💀 Mortality" value={`${numberFormat(batch.dead)} (${Number(batch.mortality || 0).toFixed(1)}%)`} />
          <DetailBox label="🌾 Feed Used" value={`${numberFormat(batch.feed_used, 2)} kg`} />
          <DetailBox label="💊 Med Cost" value={`RM ${numberFormat(batch.medication_cost, 2)}`} />
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <ActionButton onClick={onView} bg={C.blueDim} color={C.blueText} border={`${C.blue}40`}>
            <Eye size={14} /> View
          </ActionButton>

          <ActionButton onClick={onEdit}>
            <Pencil size={14} /> Edit
          </ActionButton>

          <ActionButton onClick={onDelete} bg={C.redDim} color={C.redText} border={`${C.red}40`}>
            <Trash2 size={14} /> Delete
          </ActionButton>

          {/* Only show harvest info button if NOT sold AND (can add or has harvest info) */}
          {!isSold && (canAddHarvestInfo || hasHarvestInfo) && (
            <ActionButton
              onClick={onHarvestInfo}
              bg={hasHarvestInfo ? C.blueDim : C.greenDim}
              color={hasHarvestInfo ? C.blueText : C.greenText}
              border={`${hasHarvestInfo ? C.blue : C.fern}40`}
            >
              <Truck size={14} /> {hasHarvestInfo ? "Update Harvest Info" : "Add Harvest Info"}
            </ActionButton>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Modal({ title, onClose, children, maxWidth = 600 }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(10,28,16,0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 18 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 18 }}
        style={{
          width: "100%",
          maxWidth,
          background: C.white,
          borderRadius: 24,
          padding: "26px 28px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
          border: `1px solid ${C.mist}`,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: C.ink, fontSize: 22, fontWeight: 900 }}>{title}</h2>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 11,
              border: `1px solid ${C.mist}`,
              background: C.foam,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={18} color={C.sage} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

function BatchDetailModal({ batch, onClose }) {
  const age = getAge(batch.start_date);
  const ss = statusStyle(batch.status);
  const hasHarvestInfo = batch.avg_weight_kg && batch.price_per_kg;

  return (
    <Modal title="Batch Details" onClose={onClose} maxWidth={560}>
      <div
        style={{
          background: `linear-gradient(135deg, ${C.fernDark}, ${C.fern})`,
          color: "#fff",
          borderRadius: 18,
          padding: 20,
          marginBottom: 15,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 24 }}>{batch.id}</h2>
        <div style={{ marginTop: 6, opacity: 0.8 }}>{batch.status}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <DetailBox label="Status" value={<Pill bg={ss.bg} color={ss.color}>{batch.status}</Pill>} />
        <DetailBox label="Age" value={`${age} days`} />
        <DetailBox label="Start Date" value={formatDate(batch.start_date)} />
        <DetailBox label="Harvest Date" value={formatDate(batch.expected_harvest_date)} />
        <DetailBox label="Initial Chicks" value={numberFormat(batch.chicks)} />
        <DetailBox label="Remaining" value={numberFormat(batch.remaining)} />
        <DetailBox label="Dead Chickens" value={numberFormat(batch.dead)} />
        <DetailBox label="Mortality Rate" value={`${Number(batch.mortality || 0).toFixed(1)}%`} />
        <DetailBox label="Feed Used" value={`${numberFormat(batch.feed_used, 2)} kg`} />
        <DetailBox label="Medication Cost" value={`RM ${numberFormat(batch.medication_cost, 2)}`} />
        <DetailBox label="Chick Cost" value={`RM ${numberFormat(batch.chick_cost, 2)}`} />
        {hasHarvestInfo && (
          <>
            <DetailBox label="Avg Weight" value={`${batch.avg_weight_kg} kg`} />
            <DetailBox label="Price per KG" value={`RM ${batch.price_per_kg}`} />
          </>
        )}
      </div>

      {batch.notes && (
        <div style={{ marginTop: 12 }}>
          <DetailBox label="Notes" value={batch.notes} />
        </div>
      )}
    </Modal>
  );
}

function FormInput({ label, value, onChange, type = "text", readOnly = false }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...inputStyle, background: readOnly ? "#EEF4EA" : C.foam }}
      />
    </div>
  );
}

function MessagePopup({ popup, onClose }) {
  if (!popup) return null;

  const isSuccess = popup.type === "success";

  return (
    <Modal
      title={isSuccess ? "Success" : "Notice"}
      onClose={onClose}
      maxWidth={430}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: isSuccess ? C.greenDim : C.redDim,
            color: isSuccess ? C.greenText : C.redText,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 14px",
            fontSize: 28,
            fontWeight: 900,
          }}
        >
          {isSuccess ? "✓" : "!"}
        </div>

        <h3
          style={{
            margin: "0 0 8px",
            color: C.ink,
            fontSize: 20,
            fontWeight: 900,
          }}
        >
          {popup.title}
        </h3>

        <p
          style={{
            margin: "0 0 20px",
            color: C.sage,
            fontSize: 14,
            lineHeight: 1.6,
            fontWeight: 700,
          }}
        >
          {popup.message}
        </p>

        <button
          type="button"
          onClick={onClose}
          style={{
            height: 42,
            padding: "0 22px",
            borderRadius: 12,
            border: "none",
            background: isSuccess ? C.fern : C.red,
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          OK
        </button>
      </div>
    </Modal>
  );
}

export default function BatchManagement() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [ageFilter, setAgeFilter] = useState("All");
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editBatch, setEditBatch] = useState(null);
  const [deleteBatch, setDeleteBatch] = useState(null);
  const [popup, setPopup] = useState(null);
  const [newBatch, setNewBatch] = useState({ startDate: "", chicks: "", harvestDate: "", totalPrice: "", supplierName: "", notes: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showHarvestModal, setShowHarvestModal] = useState(false);
  const [harvestBatch, setHarvestBatch] = useState(null);
  const [harvestInfo, setHarvestInfo] = useState({
    avg_weight_kg: "",
    price_per_kg: "",
  });

  const itemsPerPage = 20;

  useEffect(() => {
    fetchBatches();
  }, []);

  const normalizeBatch = (b) => ({
    ...b,
    id: b.id || b.batch_id,
    status: b.status || b.batch_status || "Growing",
    start_date: b.start_date,
    expected_harvest_date: b.expected_harvest_date || b.end_date,
    avg_weight_kg: b.avg_weight_kg ?? "",
    price_per_kg: b.price_per_kg ?? "",
    chicks: Number(b.chicks ?? b.initial_chicks ?? b.original_chicks ?? b.total_initial_chicks ?? b.total_chicks ?? 0),
    remaining: Number(b.remaining ?? b.current_alive ?? b.total_chicks ?? 0),
    dead: Number(b.dead ?? b.total_deaths ?? 0),
    mortality: Number(b.mortality ?? b.mortality_rate ?? 0),
    feed_used: Number(b.feed_used ?? b.total_feed_used ?? b.feed_kg ?? 0),
    medication_cost: Number(b.medication_cost ?? b.total_medication_cost ?? 0),
    chick_cost: Number(b.chick_cost ?? b.total_price ?? b.purchase_cost ?? 0),
    notes: b.notes || "",
  });

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const res = await API.get("/owner/batches");
      const rows = Array.isArray(res.data) ? res.data : [];
      setBatches(rows.map(normalizeBatch));
    } catch (err) {
      console.error("Fetch batch error:", err);
      alert(err.response?.data?.message || "Failed to fetch batches.");
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = useMemo(() => {
    const keyword = search.toLowerCase();
    return batches.filter((b) => {
      const age = getAge(b.start_date);
      const matchSearch =
        String(b.id || "").toLowerCase().includes(keyword) ||
        String(b.breed || "").toLowerCase().includes(keyword);
      const matchStatus = statusFilter === "All" || b.status === statusFilter;
      let matchAge = true;
      if (ageFilter === "Recent") matchAge = age <= 14;
      if (ageFilter === "Older") matchAge = age > 14;
      return matchSearch && matchStatus && matchAge;
    });
  }, [batches, search, statusFilter, ageFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, ageFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredBatches.length / itemsPerPage));

  const paginatedBatches = filteredBatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const overview = useMemo(() => {
    const active = batches.filter((b) => b.status !== "Sold");
    const growing = batches.filter((b) => b.status === "Growing");
    const ready = batches.filter((b) => b.status === "Ready for Sale");
    const avgMortality = batches.length
      ? batches.reduce((sum, b) => sum + Number(b.mortality || 0), 0) / batches.length
      : 0;
    const avgAge = active.length
      ? active.reduce((sum, b) => sum + getAge(b.start_date), 0) / active.length
      : 0;

    return {
      activeBatches: growing.length,
      totalChickens: batches.reduce((sum, b) => sum + Number(b.remaining || 0), 0),
      avgMortality,
      ready: ready.length,
      avgAge,
    };
  }, [batches]);

  const mortalityChartData = useMemo(() => {
    return filteredBatches
      .filter((b) => b.status !== "Sold")
      .slice(0, 8)
      .map((b) => ({ batch: b.id, mortality: Number(b.mortality || 0) }));
  }, [filteredBatches]);

  const activityLog = useMemo(() => {
    return batches
      .slice()
      .sort((a, b) => new Date(b.start_date || 0) - new Date(a.start_date || 0))
      .slice(0, 5)
      .map((b) => {
        const age = getAge(b.start_date);
        if (b.status === "Ready for Sale")
          return { icon: Truck, color: C.amber, time: `Day ${age}`, text: `${b.id} is ready for sale / harvest` };
        if (b.status === "Sold")
          return { icon: ShoppingBag, color: C.sage, time: formatDate(b.expected_harvest_date), text: `${b.id} has been sold` };
        return { icon: Package, color: C.fern, time: `Day ${age}`, text: `${b.id} is currently growing with ${numberFormat(b.remaining)} chicks remaining` };
      });
  }, [batches]);

  const growingBatches = paginatedBatches.filter((b) => b.status === "Growing");
  const readyBatches = paginatedBatches.filter((b) => b.status === "Ready for Sale");
  const soldBatches = paginatedBatches.filter((b) => b.status === "Sold");

  const validateNewBatch = () => {
    if (!newBatch.startDate || !newBatch.harvestDate || !newBatch.chicks || !newBatch.totalPrice || !newBatch.supplierName) {
      alert("Please fill in all required fields.");
      return false;
    }
    if (new Date(newBatch.startDate) > new Date(newBatch.harvestDate)) {
      alert("Harvest date cannot be before start date.");
      return false;
    }
    if (Number(newBatch.chicks) <= 0) {
      alert("Number of chicks must be greater than 0.");
      return false;
    }
    if (Number(newBatch.totalPrice) < 0) {
      alert("Total price cannot be negative.");
      return false;
    }
    return true;
  };

  const validateEditBatch = () => {
    if (!editBatch?.start_date || !editBatch?.end_date || !editBatch?.status) {
      alert("Please fill in all required fields.");
      return false;
    }
    if (new Date(editBatch.start_date) > new Date(editBatch.end_date)) {
      alert("End date cannot be before start date.");
      return false;
    }
    return true;
  };

  const showPopup = (type, title, message) => {
    setPopup({ type, title, message });
  };

  const canShowHarvestButton = (batch) => {
    // Don't show harvest button for Sold batches
    if (batch.status === "Sold") return false;
    
    // Show harvest button for Ready for Sale batches
    // Also show for Growing if it's past the harvest date
    if (!batch?.expected_harvest_date) return false;
    const harvestDate = new Date(batch.expected_harvest_date);
    const today = new Date();
    harvestDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const harvestDue = today >= harvestDate;
    
    // Show for Ready for Sale or Growing past harvest date
    return (batch.status === "Ready for Sale" || 
            (batch.status === "Growing" && harvestDue));
  };

  const openHarvestModal = (batch) => {
    setHarvestBatch(batch);
    setHarvestInfo({
      avg_weight_kg: batch.avg_weight_kg || "",
      price_per_kg: batch.price_per_kg || "",
    });
    setShowHarvestModal(true);
  };

  const handleSaveHarvestInfo = async (e) => {
    e.preventDefault();
    if (!harvestBatch?.id) return;
    if (Number(harvestInfo.avg_weight_kg) <= 0) {
      showPopup("error", "Invalid Weight", "Average weight must be greater than 0.");
      return;
    }
    if (Number(harvestInfo.price_per_kg) <= 0) {
      showPopup("error", "Invalid Price", "Price per kg must be greater than 0.");
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await API.patch(`/owner/batches/${harvestBatch.id}/harvest-info`, {
        avg_weight_kg: Number(harvestInfo.avg_weight_kg),
        price_per_kg: Number(harvestInfo.price_per_kg),
      });
      setShowHarvestModal(false);
      setHarvestBatch(null);
      showPopup("success", "Harvest Info Saved", res.data?.message || "Harvest information saved successfully.");
      fetchBatches();
    } catch (err) {
      showPopup("error", "Cannot Save Harvest Info", err.response?.data?.message || err.response?.data?.error || "Failed to save harvest information.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    if (!validateNewBatch()) return;
    if (!window.confirm("Create this new batch?")) return;
    try {
      setIsSubmitting(true);
      const res = await API.post("/owner/batches", {
        startDate: newBatch.startDate,
        harvestDate: newBatch.harvestDate,
        chicks: Number(newBatch.chicks),
        totalPrice: Number(newBatch.totalPrice),
        supplierName: newBatch.supplierName,
        notes: newBatch.notes,
        user_id: localStorage.getItem("user_id"),
      });
      showPopup("success", "Batch Created", `Batch created successfully: ${res.data?.batch_id || res.data?.id || "Success"}`);
      setShowAddModal(false);
      setNewBatch({ startDate: "", chicks: "", harvestDate: "", totalPrice: "", supplierName: "", notes: "" });
      fetchBatches();
    } catch (err) {
      showPopup("error", "Failed to Create Batch", err.response?.data?.message || err.response?.data?.error || "Failed to create batch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (batch) => {
    setEditBatch({
      id: batch.id,
      status: batch.status,
      start_date: batch.start_date ? new Date(batch.start_date).toLocaleDateString("en-CA") : "",
      end_date: batch.expected_harvest_date ? new Date(batch.expected_harvest_date).toLocaleDateString("en-CA") : "",
    });
    setShowEditModal(true);
  };

  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    if (!editBatch?.id) { alert("Batch ID not found."); return; }
    if (!validateEditBatch()) return;
    if (!window.confirm("Are you sure you want to update this batch?")) return;
    try {
      setIsSubmitting(true);
      await API.patch(`/owner/batches/${editBatch.id}`, {
        status: editBatch.status,
        start_date: editBatch.start_date,
        end_date: editBatch.end_date,
      });
      alert("Batch updated successfully.");
      setShowEditModal(false);
      setEditBatch(null);
      fetchBatches();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || "Failed to update batch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteConfirm = (batch) => {
    setDeleteBatch(batch);
    setShowDeleteConfirm(true);
  };

  const handleDeleteBatch = async () => {
    if (!deleteBatch?.id) return;
    try {
      setIsSubmitting(true);
      const res = await API.delete(`/owner/batches/${deleteBatch.id}`);
      setShowDeleteConfirm(false);
      setDeleteBatch(null);
      if (selectedBatch?.id === deleteBatch.id) setSelectedBatch(null);
      showPopup("success", "Batch Deleted", res.data?.message || "Batch deleted successfully.");
      fetchBatches();
    } catch (err) {
      setShowDeleteConfirm(false);
      showPopup("error", "Cannot Delete Batch", err.response?.data?.message || err.response?.data?.error || "Failed to delete batch.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.foam, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, fontFamily: "inherit", color: C.sage }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}>
          <Leaf size={36} color={C.fern} />
        </motion.div>
        <strong>Loading batches...</strong>
      </div>
    );
  }

  return (
    <div style={{ background: C.foam, minHeight: "100vh", fontFamily: "inherit" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: ${C.mist}; borderRadius: 99px; }
        select, input, textarea, button { font-family: inherit; }
        @media (max-width: 950px) {
          .batch-filter-grid { grid-template-columns: 1fr !important; }
          .batch-insights-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <motion.header
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{ background: C.white, borderBottom: `1px solid ${C.mist}`, padding: "0 32px", height: 62, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: C.fern, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🐔</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, color: C.ink }}>AyamTech Farm</div>
            <div style={{ fontSize: 11, color: C.sage, fontWeight: 700 }}>Owner Batch Control</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button type="button" style={{ width: 38, height: 38, borderRadius: 12, border: `1px solid ${C.mist}`, background: C.foam, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Bell size={16} color={C.sage} />
          </button>
          <div style={{ height: 38, padding: "0 14px", borderRadius: 12, border: `1px solid ${C.mist}`, background: C.foam, display: "flex", alignItems: "center", gap: 8 }}>
            <User size={15} color={C.fern} />
            <span style={{ fontSize: 13, color: C.ink, fontWeight: 800 }}>{sessionStorage.getItem("name") || "Farm Owner"}</span>
            <span style={{ fontSize: 11, color: C.sage }}>(Owner)</span>
          </div>
        </div>
      </motion.header>

      <main style={{ padding: "28px 32px", maxWidth: 1450, margin: "0 auto" }}>
        {/* Hero Banner */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: `linear-gradient(110deg, ${C.fernDark}, ${C.fern})`, borderRadius: 22, padding: "26px 30px", color: "#fff", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, flexWrap: "wrap", position: "relative", overflow: "hidden" }}
        >
          <div style={{ position: "absolute", top: -45, right: 150, width: 170, height: 170, borderRadius: "50%", border: "30px solid rgba(255,255,255,0.06)" }} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.75, fontWeight: 800, marginBottom: 5 }}>🐔 Batch Management</div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, fontFamily: "inherit" }}>Monitor, track and optimize</h1>
            <p style={{ margin: "6px 0 0", opacity: 0.75, fontSize: 14 }}>your broiler batch performance using real database records</p>
          </div>
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddModal(true)}
            style={{ height: 46, padding: "0 22px", borderRadius: 13, border: "none", background: "#fff", color: C.fernDark, fontSize: 14, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, zIndex: 2 }}
          >
            <Plus size={18} /> Add New Batch
          </motion.button>
        </motion.section>

        {/* Stat Cards */}
        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { title: "Growing Batches", value: overview.activeBatches, sub: "Currently growing" },
            { title: "Total Chicks", value: numberFormat(overview.totalChickens), sub: "Live remaining" },
            { title: "Mortality Rate", value: `${overview.avgMortality.toFixed(1)}%`, sub: "Overall average" },
            { title: "Ready", value: overview.ready, sub: "Ready for sale" },
            { title: "Avg Age", value: `${Math.round(overview.avgAge)}d`, sub: "Active batches" },
          ].map((s, index) => <StatCard key={s.title} {...s} index={index} />)}
        </section>

        {/* Filter Bar */}
        <section style={{ background: C.white, borderRadius: 20, padding: "18px 20px", border: `1px solid ${C.mist}`, boxShadow: "0 8px 24px rgba(16,33,20,0.05)", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Filter size={15} color={C.sage} />
            <strong style={{ color: C.sage, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em" }}>Filters</strong>
            <div style={{ flex: 1 }} />
            <ActionButton onClick={() => { setSearch(""); setStatusFilter("All"); setAgeFilter("All"); }}>
              <RefreshCw size={13} /> Reset All Filters
            </ActionButton>
            <span style={{ background: C.foam, border: `1px solid ${C.mist}`, borderRadius: 99, padding: "6px 12px", fontSize: 12, fontWeight: 800, color: C.sage }}>
              {filteredBatches.length} batch{filteredBatches.length !== 1 ? "es" : ""} found
            </span>
          </div>

          <div className="batch-filter-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, height: 44, border: `1.5px solid ${C.mist}`, borderRadius: 12, padding: "0 13px", background: C.foam }}>
              <Search size={15} color={C.sage} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search batch ID or breed..."
                style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: C.ink, fontWeight: 700 }}
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} style={{ border: "none", background: "transparent", cursor: "pointer" }}>
                  <X size={14} color={C.sage} />
                </button>
              )}
            </div>

            {[
              { label: "Status", value: statusFilter, set: setStatusFilter, options: ["All", "Growing", "Ready for Sale", "Sold"] },
              { label: "Age Range", value: ageFilter, set: setAgeFilter, options: ["All", "Recent", "Older"] },
            ].map((item) => (
              <select
                key={item.label}
                value={item.value}
                onChange={(e) => item.set(e.target.value)}
                style={{ height: 44, border: `1.5px solid ${C.mist}`, borderRadius: 12, background: C.foam, color: C.ink, fontSize: 13, fontWeight: 800, padding: "0 12px", outline: "none" }}
              >
                {item.options.map((o) => (
                  <option key={o} value={o}>{o === "All" ? `${item.label} — All` : o}</option>
                ))}
              </select>
            ))}
          </div>
        </section>

        {/* Batch Records */}
        <section style={{ background: C.white, borderRadius: 20, padding: "20px 22px", border: `1px solid ${C.mist}`, boxShadow: "0 8px 24px rgba(16,33,20,0.05)", marginBottom: 24 }}>
          <SectionHeader title="Batch Records" icon={Leaf} />

          {growingBatches.length > 0 && (
            <div style={{ marginBottom: readyBatches.length > 0 ? 18 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {growingBatches.map((batch) => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    onView={() => setSelectedBatch(batch)}
                    onEdit={() => openEditModal(batch)}
                    onDelete={() => openDeleteConfirm(batch)}
                    onHarvestInfo={() => openHarvestModal(batch)}
                    canAddHarvestInfo={canShowHarvestButton(batch)}
                  />
                ))}
              </div>
            </div>
          )}

          {readyBatches.length > 0 && (
            <div>
              <MiniTitle color={C.amberText} icon={<Truck size={14} />}>Ready for Harvest</MiniTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {readyBatches.map((batch) => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    onView={() => setSelectedBatch(batch)}
                    onEdit={() => openEditModal(batch)}
                    onDelete={() => openDeleteConfirm(batch)}
                    onHarvestInfo={() => openHarvestModal(batch)}
                    canAddHarvestInfo={canShowHarvestButton(batch)}
                  />
                ))}
              </div>
            </div>
          )}

          {soldBatches.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <MiniTitle color={C.sage} icon={<ShoppingBag size={14} />}>Sold Batches</MiniTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {soldBatches.map((batch) => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    onView={() => setSelectedBatch(batch)}
                    onEdit={() => openEditModal(batch)}
                    onDelete={() => openDeleteConfirm(batch)}
                    onHarvestInfo={() => openHarvestModal(batch)}
                    canAddHarvestInfo={canShowHarvestButton(batch)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredBatches.length === 0 && <EmptyState text="No batches match your filters." />}
        </section>

        {/* Insights + Batch Overview */}
        <section className="batch-insights-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18, marginBottom: 24 }}>
          <div style={{ background: C.white, borderRadius: 20, padding: "20px 22px", border: `1px solid ${C.mist}`, boxShadow: "0 8px 24px rgba(16,33,20,0.05)" }}>
            <SectionHeader title="Quick Insights" icon={TrendingUp} accent={C.blue} />
            <div style={{ height: 220 }}>
              {mortalityChartData.length === 0 ? (
                <EmptyState text="No mortality data available." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mortalityChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.mist} vertical={false} />
                    <XAxis dataKey="batch" tick={{ fontSize: 11, fill: C.sage }} />
                    <YAxis tick={{ fontSize: 11, fill: C.sage }} tickFormatter={(v) => `${v}%`} />
                    <Tooltip contentStyle={{ background: C.white, border: `1px solid ${C.mist}`, borderRadius: 10 }} formatter={(v) => [`${Number(v).toFixed(1)}%`, "Mortality"]} />
                    <Bar dataKey="mortality" radius={[8, 8, 0, 0]} fill={C.fern} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div style={{ background: C.blueDim, border: `1px solid ${C.blue}25`, color: C.blueText, borderRadius: 12, padding: "11px 13px", fontSize: 13, fontWeight: 700, marginTop: 12 }}>
              💡 Tip: Monitor batches with mortality rate above 4%. These batches should be checked first.
            </div>
          </div>

          {/* Batch Overview */}
          <div style={{ background: C.white, borderRadius: 20, padding: "20px 22px", border: `1px solid ${C.mist}`, boxShadow: "0 8px 24px rgba(16,33,20,0.05)" }}>
            <SectionHeader title="Batch Overview" icon={Activity} accent={C.amber} />
            {[
              { label: "Total Batches", value: batches.length, color: C.fern },
              { label: "Growing", value: overview.activeBatches, color: C.blue },
              { label: "Ready for Sale", value: overview.ready, color: C.amber },
            ].map((item) => {
              const pct = batches.length ? (item.value / batches.length) * 100 : 0;
              return (
                <div key={item.label} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ color: C.sage, fontSize: 12, fontWeight: 800 }}>{item.label}</span>
                    <strong style={{ color: item.color }}>{item.value}</strong>
                  </div>
                  <div style={{ height: 7, background: C.mist, borderRadius: 99, overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} style={{ height: "100%", background: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Activity Log */}
        <section style={{ background: C.white, borderRadius: 20, padding: "20px 22px", border: `1px solid ${C.mist}`, boxShadow: "0 8px 24px rgba(16,33,20,0.05)", marginBottom: 24 }}>
          <SectionHeader title="Farm Activity Log" icon={Clock} accent={C.amber} />
          {activityLog.length === 0 ? (
            <EmptyState text="No batch activity available." />
          ) : (
            activityLog.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={`${activity.text}-${index}`} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: index < activityLog.length - 1 ? `1px solid ${C.mist}` : "none" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${activity.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={15} color={activity.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{activity.text}</div>
                    <div style={{ fontSize: 11, color: C.sage, marginTop: 3 }}>🕐 {activity.time}</div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        <footer style={{ background: C.white, borderRadius: 14, padding: "13px 16px", border: `1px solid ${C.mist}`, color: C.sage, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <Zap size={14} color={C.fern} />
          AyamTech Farm Management · Data loaded from database · Last updated: {new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit" })}
        </footer>
      </main>

      {/* Modals */}
      <AnimatePresence>{selectedBatch && <BatchDetailModal batch={selectedBatch} onClose={() => setSelectedBatch(null)} />}</AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <Modal title="Add New Batch" onClose={() => setShowAddModal(false)} maxWidth={660}>
            <form onSubmit={handleAddBatch}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <FormInput
                  label="Start Date"
                  type="date"
                  value={newBatch.startDate}
                  onChange={(value) => {
                    const start = new Date(value);
                    const end = new Date(start);
                    end.setDate(end.getDate() + 45);
                    setNewBatch({ ...newBatch, startDate: value, harvestDate: Number.isNaN(end.getTime()) ? "" : end.toLocaleDateString("en-CA") });
                  }}
                />
                <FormInput label="Initial Number of Chicks" type="number" value={newBatch.chicks} onChange={(value) => setNewBatch({ ...newBatch, chicks: value })} />
                <FormInput label="Harvest Date" type="date" value={newBatch.harvestDate} readOnly onChange={() => {}} />
                <FormInput label="Total Purchase Price" type="number" value={newBatch.totalPrice} onChange={(value) => setNewBatch({ ...newBatch, totalPrice: value })} />
                <FormInput label="Supplier Name" type="text" value={newBatch.supplierName} onChange={(value) => setNewBatch({ ...newBatch, supplierName: value })} />
              </div>
              <label style={labelStyle}>Notes</label>
              <textarea value={newBatch.notes} onChange={(e) => setNewBatch({ ...newBatch, notes: e.target.value })} rows={3} placeholder="Notes optional..." style={textareaStyle} />
              <div style={modalActions}>
                <button type="button" onClick={() => setShowAddModal(false)} style={cancelBtn}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ ...saveBtn, opacity: isSubmitting ? 0.65 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}>
                  <Plus size={16} />
                  {isSubmitting ? "Saving..." : "Save Batch"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && editBatch && (
          <Modal title="Edit Batch" onClose={() => setShowEditModal(false)} maxWidth={520}>
            <form onSubmit={handleUpdateBatch}>
              <label style={labelStyle}>Status</label>
              <select value={editBatch.status} onChange={(e) => setEditBatch({ ...editBatch, status: e.target.value })} style={inputStyle}>
                <option>Growing</option>
                <option>Ready for Sale</option>
                <option>Sold</option>
              </select>
              <FormInput
                label="Start Date"
                type="date"
                value={editBatch.start_date}
                onChange={(value) => {
                  const start = new Date(value);
                  const end = new Date(start);
                  end.setDate(end.getDate() + 45);
                  setEditBatch({ ...editBatch, start_date: value, end_date: Number.isNaN(end.getTime()) ? "" : end.toLocaleDateString("en-CA") });
                }}
              />
              <FormInput label="End Date" type="date" value={editBatch.end_date} readOnly onChange={() => {}} />
              <div style={modalActions}>
                <button type="button" onClick={() => setShowEditModal(false)} style={cancelBtn}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ ...saveBtn, opacity: isSubmitting ? 0.65 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}>
                  {isSubmitting ? "Updating..." : "Update Batch"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && deleteBatch && (
          <Modal title="Delete Batch?" onClose={() => setShowDeleteConfirm(false)} maxWidth={420}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>⚠️</div>
              <p style={{ color: C.sage, fontSize: 14, lineHeight: 1.6 }}>
                Are you sure you want to delete <strong>{deleteBatch.id}</strong>? This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
                <button type="button" onClick={() => setShowDeleteConfirm(false)} style={{ ...cancelBtn, flex: 1 }}>Cancel</button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleDeleteBatch}
                  style={{ ...deleteBtn, flex: 1, opacity: isSubmitting ? 0.65 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}
                >
                  {isSubmitting ? "Deleting..." : "Yes, Delete"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {popup && <MessagePopup popup={popup} onClose={() => setPopup(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showHarvestModal && harvestBatch && (
          <Modal
            title={`${harvestBatch.avg_weight_kg && harvestBatch.price_per_kg ? 'Update' : 'Add'} Harvest Info - ${harvestBatch.id}`}
            onClose={() => { setShowHarvestModal(false); setHarvestBatch(null); }}
            maxWidth={460}
          >
            <form onSubmit={handleSaveHarvestInfo}>
              <div style={{ 
                background: harvestBatch.avg_weight_kg && harvestBatch.price_per_kg ? C.blueDim : C.greenDim, 
                border: `1px solid ${harvestBatch.avg_weight_kg && harvestBatch.price_per_kg ? C.blue : C.fern}40`, 
                color: harvestBatch.avg_weight_kg && harvestBatch.price_per_kg ? C.blueText : C.greenText, 
                borderRadius: 12, 
                padding: "12px 14px", 
                fontSize: 13, 
                fontWeight: 800, 
                marginBottom: 16 
              }}>
                {harvestBatch.avg_weight_kg && harvestBatch.price_per_kg ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Weight size={16} />
                      Update harvest information for {harvestBatch.id}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, opacity: 0.8 }}>
                      Current: {harvestBatch.avg_weight_kg}kg @ RM{harvestBatch.price_per_kg}/kg
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Truck size={16} />
                      Enter harvest information for {harvestBatch.id}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, opacity: 0.8 }}>
                      This batch is ready for harvest
                    </div>
                  </>
                )}
              </div>
              
              <FormInput
                label="Average Weight Per Chicken (KG)"
                type="number"
                value={harvestInfo.avg_weight_kg}
                onChange={(value) => setHarvestInfo({ ...harvestInfo, avg_weight_kg: value })}
                placeholder="e.g. 2.5"
              />
              
              <FormInput
                label="Price Per KG (RM)"
                type="number"
                value={harvestInfo.price_per_kg}
                onChange={(value) => setHarvestInfo({ ...harvestInfo, price_per_kg: value })}
                placeholder="e.g. 8.50"
              />
              
              <div style={modalActions}>
                <button type="button" onClick={() => { setShowHarvestModal(false); setHarvestBatch(null); }} style={cancelBtn}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ ...saveBtn, opacity: isSubmitting ? 0.65 : 1, cursor: isSubmitting ? "not-allowed" : "pointer" }}>
                  {isSubmitting ? "Saving..." : harvestBatch.avg_weight_kg && harvestBatch.price_per_kg ? "Update Harvest Info" : "Save Harvest Info"}
                </button>
              </div>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

const labelStyle = {
  fontSize: 11,
  color: C.sage,
  fontWeight: 900,
  display: "block",
  marginBottom: 7,
  textTransform: "uppercase",
  letterSpacing: "0.07em",
};

const inputStyle = {
  width: "100%",
  height: 44,
  border: `1.5px solid ${C.mist}`,
  borderRadius: 12,
  padding: "0 13px",
  outline: "none",
  fontSize: 14,
  background: C.foam,
  color: C.ink,
  marginBottom: 14,
};

const textareaStyle = {
  width: "100%",
  border: `1.5px solid ${C.mist}`,
  borderRadius: 12,
  padding: "12px 13px",
  outline: "none",
  fontSize: 14,
  background: C.foam,
  color: C.ink,
  resize: "none",
  marginBottom: 18,
};

const modalActions = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const cancelBtn = {
  height: 44,
  padding: "0 18px",
  borderRadius: 12,
  border: `1.5px solid ${C.mist}`,
  background: "#fff",
  color: C.pine,
  fontWeight: 900,
  cursor: "pointer",
};

const saveBtn = {
  height: 44,
  padding: "0 20px",
  borderRadius: 12,
  border: "none",
  background: C.fern,
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const deleteBtn = {
  height: 44,
  padding: "0 18px",
  borderRadius: 12,
  border: "none",
  background: C.red,
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};