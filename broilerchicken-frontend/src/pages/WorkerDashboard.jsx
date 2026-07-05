import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api/axios";
import {
  Droplet,
  Pill,
  Heart,
  Package,
  ClipboardList,
  Sun,
  Moon,
  Zap,
  TrendingUp,
  ChevronRight,
  Flame,
  Star,
} from "lucide-react";

/* ─── Palette ───────────────────────────────────────────────────── */
const C = {
  bg: "#F4F7F1",
  surface: "#FFFFFF",
  border: "#E2EAD8",

  green: "#4CAF50",
  greenDark: "#2E7D32",
  greenDim: "#EAF7E3",

  amber: "#F59E0B",
  amberDim: "#FFF8EC",

  red: "#EF4444",
  redDim: "#FEF2F2",

  blue: "#3B82F6",
  blueDim: "#EFF6FF",

  purple: "#8B5CF6",
  purpleDim: "#F0EDFF",

  teal: "#0D9488",
  tealDim: "#F0FDFA",

  orange: "#F97316",
  orangeDim: "#FFF7ED",

  text: "#0F1F12",
  textMid: "#5A7A60",
  textLight: "#9CB4A0",

  sans: "'Plus Jakarta Sans', sans-serif",
};

/* ─── Animation Helpers ─────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

const scaleIn = (delay = 0) => ({
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ─── Helpers ───────────────────────────────────────────────────── */
function formatLastFeed(dateStr) {
  if (!dateStr) return "No feed recorded yet";
  const d = new Date(dateStr);
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - d) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return { text: "Night Owl Mode", sub: "Get some rest after this!", icon: Moon, color: C.purple, emoji: "🦉" };
  if (h < 12) return { text: "Good Morning", sub: "Start the day strong!", icon: Sun, color: C.amber, emoji: "☀️" };
  if (h < 17) return { text: "Good Afternoon", sub: "Keep the momentum going!", icon: Flame, color: C.orange, emoji: "🔥" };
  return { text: "Good Evening", sub: "Almost done for today!", icon: Star, color: C.teal, emoji: "⭐" };
}

/* Typical broiler grow-out benchmarks, used purely for the progress UI */
const CYCLE_LENGTH_DAYS = 35;

function getStage(ageDays) {
  if (ageDays <= 10) return { label: "Starter", color: C.amber, bg: C.amberDim };
  if (ageDays <= 24) return { label: "Grower", color: C.green, bg: C.greenDim };
  return { label: "Finisher", color: C.teal, bg: C.tealDim };
}

/* ─── Active Batch Card ─────────────────────────────────────────── */
function BatchCard({ batch: b, index: i, goTo }) {
  const mRate = Number(b.mortality_rate ?? 0);
  const deaths = Number(b.total_deaths ?? 0);
  const chicks = Number(b.total_chicks ?? 0);
  const ageDays = Number(b.age_days ?? 0);
  const notes = b.notes || "No notes added";

  const stage = getStage(ageDays);
  const progress = Math.min(100, Math.round((ageDays / CYCLE_LENGTH_DAYS) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: "0 16px 36px rgba(15,31,18,.12)" }}
      transition={{ delay: 0.1 + i * 0.06 }}
      style={{
        borderRadius: 20,
        border: `1.5px solid ${C.border}`,
        background: C.surface,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(15,31,18,.06)",
      }}
    >
      {/* Top accent strip — reflects growth stage */}
      <div style={{
        height: 5,
        background: `linear-gradient(90deg, ${C.green}, ${stage.color})`,
      }} />

      <div style={{ padding: "18px 20px" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", gap: 10, marginBottom: 14,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap", marginBottom: 5 }}>
              <span style={{
                fontFamily: C.sans, fontWeight: 900, fontSize: 15,
                letterSpacing: ".03em", color: C.blue,
              }}>
                {b.batch_id}
              </span>
              <span style={{
                fontSize: 10, fontWeight: 800, padding: "3px 10px",
                borderRadius: 999, background: stage.bg, color: stage.color,
              }}>
                {stage.label}
              </span>
            </div>
            <div style={{
              fontSize: 11, color: C.textMid, lineHeight: 1.45,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {notes}
            </div>
          </div>

          {/* Age badge */}
          <div style={{
            textAlign: "center",
            background: `${C.green}12`,
            borderRadius: 13,
            padding: "9px 14px",
            minWidth: 56,
            flexShrink: 0,
          }}>
            <div style={{
              fontFamily: C.sans, fontWeight: 900, fontSize: 22,
              lineHeight: 1, color: C.greenDark,
            }}>
              {ageDays}
            </div>
            <div style={{ fontSize: 9, color: C.textLight, marginTop: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>
              days old
            </div>
          </div>
        </div>

        {/* Growth progress bar */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, color: C.textLight,
              textTransform: "uppercase", letterSpacing: ".06em",
            }}>
              Cycle progress
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.textMid }}>
              {progress}% · ~{CYCLE_LENGTH_DAYS}d target
            </span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: C.border, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{
                height: "100%", borderRadius: 999,
                background: `linear-gradient(90deg, ${C.green}, ${stage.color})`,
              }}
            />
          </div>
        </div>

        {/* Chicks + Deaths */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <div style={{
            background: "#F7F9F5", borderRadius: 12, padding: "10px 13px",
            display: "flex", alignItems: "center", gap: 9,
          }}>
            <span style={{ fontSize: 16 }}>🐤</span>
            <div>
              <div style={{
                fontSize: 9, color: C.textLight, textTransform: "uppercase",
                letterSpacing: ".06em", fontWeight: 800, marginBottom: 2,
              }}>
                Chicks
              </div>
              <div style={{ fontFamily: C.sans, fontSize: 16, fontWeight: 900, color: C.text }}>
                {chicks.toLocaleString()}
              </div>
            </div>
          </div>

          <div style={{
            background: mRate > 0 ? C.redDim : "#F7F9F5", borderRadius: 12,
            padding: "10px 13px", display: "flex", alignItems: "center", gap: 9,
          }}>
            <span style={{ fontSize: 16 }}>💀</span>
            <div>
              <div style={{
                fontSize: 9, color: C.textLight, textTransform: "uppercase",
                letterSpacing: ".06em", fontWeight: 800, marginBottom: 2,
              }}>
                Deaths
              </div>
              <div style={{
                fontFamily: C.sans, fontSize: 16, fontWeight: 900,
                color: mRate > 0 ? C.red : C.text,
              }}>
                {deaths.toLocaleString()}
                <span style={{ fontSize: 11, fontWeight: 700, marginLeft: 3, color: C.textMid }}>
                  ({mRate}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feed status banner */}
        {!b.feed_today ? (
          <div style={{
            background: C.amberDim, color: "#92400E", borderRadius: 11,
            padding: "9px 13px", marginBottom: 14, fontSize: 12,
            fontWeight: 800, display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>⚠️</span>
            <span>No feed today · Last: {formatLastFeed(b.last_feed_date)}</span>
          </div>
        ) : (
          <div style={{
            background: C.greenDim, color: C.greenDark, borderRadius: 11,
            padding: "9px 13px", marginBottom: 14, fontSize: 12,
            fontWeight: 800, display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>✅</span>
            <span>Records up to date today</span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {!b.feed_today && (
            <ActionBtn
              icon="🌾"
              label="Add Feed"
              color={C.green}
              bg={C.greenDim}
              onClick={(e) => { e.stopPropagation(); goTo("/worker/feed", b.batch_id); }}
            />
          )}
          {!b.med_today && (
            <ActionBtn
              icon="💊"
              label="Add Med"
              color={C.purple}
              bg={C.purpleDim}
              onClick={(e) => { e.stopPropagation(); goTo("/worker/medication", b.batch_id); }}
            />
          )}
          {!b.mortality_today && (
            <ActionBtn
              icon="❤️"
              label="Record Death"
              color={C.red}
              bg={C.redDim}
              onClick={(e) => { e.stopPropagation(); goTo("/worker/mortality", b.batch_id); }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Small Button ──────────────────────────────────────────────── */
function ActionBtn({ icon, label, color, bg, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -1, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 13px", borderRadius: 10,
        border: `1.5px solid ${color}30`, background: bg,
        color, fontFamily: C.sans, fontSize: 12, fontWeight: 800, cursor: "pointer",
      }}
    >
      <span style={{ fontSize: 13 }}>{icon}</span>
      {label}
    </motion.button>
  );
}

/* ─── Quick Action Card ─────────────────────────────────────────── */
function QACard({ action: a, index, onClick }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, boxShadow: `0 18px 40px ${a.color}28` }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        background: C.surface, border: `1.5px solid ${C.border}`,
        borderRadius: 22, padding: "22px 20px 20px", cursor: "pointer",
        textAlign: "left", display: "flex", flexDirection: "column", gap: 14,
        boxShadow: "0 4px 16px rgba(15,31,18,.06)",
        transition: "all .24s cubic-bezier(.22,1,.36,1)",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: 4, background: a.grad, borderRadius: "22px 22px 0 0",
      }} />
      <div style={{
        position: "absolute", bottom: 14, right: 16,
        fontSize: 38, opacity: 0.07, userSelect: "none",
      }}>
        {a.emoji}
      </div>
      <div style={{
        width: 48, height: 48, borderRadius: 15, background: a.grad,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 6px 18px ${a.color}40`,
      }}>
        <a.icon size={22} color="#fff" />
      </div>
      <div>
        <div style={{ fontFamily: C.sans, fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 4 }}>
          {a.label}
        </div>
        <div style={{ fontSize: 11, color: C.textMid, lineHeight: 1.4 }}>{a.sub}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: a.color }}>
        Tap to log <ChevronRight size={13} />
      </div>
    </motion.button>
  );
}

/* ─── Row Header ───────────────────────────────────────────────── */
function RowHeader({ icon: Icon, title, sub, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: `${color}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={15} color={color} />
        </div>
        <span style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 16, color: C.text }}>
          {title}
        </span>
      </div>
      {sub && (
        <span style={{
          fontSize: 11, fontWeight: 700, color: C.textMid,
          background: `${color}14`, padding: "3px 10px", borderRadius: 999,
        }}>
          {sub}
        </span>
      )}
    </div>
  );
}

/* ─── Main Dashboard ───────────────────────────────────────────── */
export default function WorkerDashboard() {
  const name = sessionStorage.getItem("name") || "Farm Worker";
  const navigate = useNavigate();

  const g = getGreeting();
  const GIcon = g.icon;

  const [data, setData] = useState({
    todaySummary: { feed_records: 0, medication_records: 0, mortality_records: 0, batches_handled: 0 },
    batchStatus: [],
    alerts: [],
  });

  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(new Date());

useEffect(() => {
  document.title = "Worker Portal";

  const favicon = document.querySelector("#favicon");
  if (favicon) {
    favicon.href = "/worker.png";
  }

  fetchData();
  const id = setInterval(() => setTick(new Date()), 1000);
  return () => clearInterval(id);
}, []);

  const fetchData = async () => {
    try {
      const [summaryRes, batchRes, alertRes] = await Promise.all([
        API.get("/worker/today-summary"),
        API.get("/worker/batch-status"),
        API.get("/worker/alerts"),
      ]);
      setData({
        todaySummary: summaryRes.data || {},
        batchStatus: batchRes.data || [],
        alerts: alertRes.data || [],
      });
    } catch (error) {
      console.error("Worker dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const goTo = (path, batchId = null) => {
    if (!path) return;
    if (batchId) {
      navigate(`${path}?batch_id=${encodeURIComponent(batchId)}`);
    } else {
      navigate(path);
    }
  };

  const totalLogged =
    Number(data.todaySummary.feed_records || 0) +
    Number(data.todaySummary.medication_records || 0) +
    Number(data.todaySummary.mortality_records || 0);

  // Only batches that are still in active grow-out — not sold,
  // not flagged ready for harvest, and not flagged for high mortality.
  const growingBatches = data.batchStatus.filter((b) => {
    const isSold = b.batch_status === "Sold" || b.batch_status === "sold";
    const isReady = Boolean(b.is_ready);
    const isHigh = Boolean(b.high_mortality);
    return !isSold && !isReady && !isHigh;
  });

  // Quick Actions - removed "My Tasks"
  const quickActions = [
    {
      icon: Droplet, label: "Log Feed", sub: "Record batch feeding",
      color: C.green, grad: `linear-gradient(135deg,${C.green},${C.greenDark})`,
      emoji: "🌾", path: "/worker/feed",
    },
    {
      icon: Pill, label: "Log Medication", sub: "Record medicine given",
      color: C.purple, grad: "linear-gradient(135deg,#8B5CF6,#6D28D9)",
      emoji: "💊", path: "/worker/medications",
    },
    {
      icon: Heart, label: "Log Mortality", sub: "Record chicken deaths",
      color: C.red, grad: "linear-gradient(135deg,#EF4444,#DC2626)",
      emoji: "📋", path: "/worker/mortality",
    },
  ];

  if (loading) {
    return (
      <div style={{
        background: C.bg, minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 18,
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{
            width: 48, height: 48, borderRadius: "50%",
            border: `3px solid ${C.border}`, borderTopColor: C.green,
          }}
        />
        <p style={{ fontFamily: C.sans, color: C.textMid, fontSize: 14, fontWeight: 600 }}>
          Loading your workspace…
        </p>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: C.sans, color: C.text, paddingBottom: 60 }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(1.9); opacity: 0; }
        }
        .scroll-clean::-webkit-scrollbar { width: 6px; }
        .scroll-clean::-webkit-scrollbar-thumb { background: #B7C7B3; border-radius: 999px; }
        .scroll-clean::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* TOPBAR */}
      <div style={{
        position: "sticky", top: 0, zIndex: 200,
        background: "rgba(244,247,241,.93)", backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{
          maxWidth: 1440, margin: "0 auto", height: 66,
          padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <motion.div {...{ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: 0, ease: [0.22, 1, 0.36, 1] } }} style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 13,
              background: `linear-gradient(135deg,${C.green},${C.greenDark})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, animation: "float 4s ease-in-out infinite",
              boxShadow: `0 6px 20px ${C.green}40`,
            }}>
              🐔
            </div>
            <div>
              <div style={{ fontFamily: C.sans, fontWeight: 900, fontSize: 16, color: C.text, lineHeight: 1 }}>
                AyamTech
              </div>
              <div style={{ fontSize: 10, color: C.textMid, letterSpacing: 1, fontWeight: 600 }}>
                WORKER HUB
              </div>
            </div>
          </motion.div>

          <motion.div {...{ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: 0.04, ease: [0.22, 1, 0.36, 1] } }} style={{
            fontFamily: C.sans, fontSize: 24, fontWeight: 900, color: C.text,
            letterSpacing: -1, background: C.surface, border: `1.5px solid ${C.border}`,
            borderRadius: 14, padding: "8px 18px", boxShadow: "0 2px 8px rgba(15,31,18,.05)",
          }}>
            {tick.toLocaleTimeString("en-MY", { hour12: false })}
          </motion.div>

          <motion.div {...{ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] } }} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              background: C.surface, border: `1.5px solid ${C.border}`,
              borderRadius: 15, padding: "8px 14px 8px 8px",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: `linear-gradient(135deg,${C.green},${C.greenDark})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontFamily: C.sans, fontWeight: 900, fontSize: 15,
                boxShadow: `0 4px 12px ${C.green}40`,
              }}>
                {name[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 13, color: C.text, lineHeight: 1.2 }}>
                  {name}
                </div>
                <div style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>● Online</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "28px 32px 0" }}>

        {/* ROW 1 — Hero + Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 230px", gap: 18, marginBottom: 24 }}>
          <motion.div {...fadeUp(0.06)} style={{
            background: `linear-gradient(140deg,${C.green} 0%,${C.greenDark} 50%,#1B5E20 100%)`,
            borderRadius: 26, padding: "30px 36px", position: "relative", overflow: "hidden",
            boxShadow: "0 24px 56px rgba(46,125,50,.28)",
          }}>
            <div style={{
              position: "absolute", right: -50, top: -50,
              width: 220, height: 220, borderRadius: "50%", background: "rgba(255,255,255,.06)",
            }} />
            <div style={{
              position: "absolute", right: 32, top: "50%", transform: "translateY(-50%)",
              opacity: 0.08, fontSize: 120, lineHeight: 1,
              animation: "float 7s ease-in-out infinite", userSelect: "none",
            }}>
              🐔
            </div>

            <div style={{ position: "relative", zIndex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "rgba(255,255,255,.18)", borderRadius: 20, padding: "5px 14px",
                }}>
                  <GIcon size={13} color="rgba(255,255,255,.9)" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.9)" }}>
                    {g.text} {g.emoji}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,.55)" }}>{g.sub}</span>
              </div>

              <div style={{
                fontFamily: C.sans, fontSize: 36, fontWeight: 900, color: "#fff",
                lineHeight: 1.05, marginBottom: 6, letterSpacing: -1,
              }}>
                Hey, {name.split(" ")[0]}! 👋
              </div>

              <div style={{ fontSize: 13, color: "rgba(255,255,255,.65)" }}>
                {tick.toLocaleDateString("en-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
          </motion.div>

          {/* Stat Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {[
              { label: "Feed", val: data.todaySummary.feed_records, icon: Droplet, color: C.green, bg: C.greenDim },
              { label: "Medication", val: data.todaySummary.medication_records, icon: Pill, color: C.purple, bg: C.purpleDim },
              { label: "Mortality", val: data.todaySummary.mortality_records, icon: Heart, color: C.red, bg: C.redDim },
              { label: "Batches", val: data.todaySummary.batches_handled, icon: Package, color: C.blue, bg: C.blueDim },
            ].map((s, i) => (
              <motion.div key={s.label} {...scaleIn(0.1 + i * 0.07)} style={{
                background: C.surface, border: `1.5px solid ${C.border}`, borderRadius: 18,
                padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                boxShadow: "0 2px 10px rgba(15,31,18,.05)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 11, background: s.bg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <s.icon size={16} color={s.color} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.textMid }}>{s.label}</span>
                </div>
                <div style={{ fontFamily: C.sans, fontSize: 28, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                  {s.val || 0}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ROW 2 — Quick Actions (3 cards now) */}
        <motion.div {...fadeUp(0.18)} style={{ marginBottom: 24 }}>
          <RowHeader icon={Zap} title="Quick Actions" sub="Tap to log" color={C.green} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
            {quickActions.map((a, i) => (
              <QACard key={a.label} action={a} index={i} onClick={() => goTo(a.path)} />
            ))}
          </div>
        </motion.div>

        {/* ROW 3 — Growing Batches (full width) */}
        <motion.div {...fadeUp(0.26)}>
          <RowHeader
            icon={Package}
            title="Growing Batches"
            sub={growingBatches.length > 0 ? `${growingBatches.length} batch${growingBatches.length > 1 ? "es" : ""}` : "None growing"}
            color={C.blue}
          />

          {growingBatches.length === 0 ? (
            <div style={{
              background: C.surface, border: `1.5px solid ${C.border}`,
              borderRadius: 22, padding: "48px 20px",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
              boxShadow: "0 6px 24px rgba(15,31,18,.06)",
            }}>
              <Package size={36} color={C.textLight} />
              <span style={{ fontSize: 14, color: C.textMid, fontWeight: 600 }}>
                No batches currently in grow-out.
              </span>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 16,
            }}>
              {growingBatches.map((b, i) => (
                <BatchCard
                  key={b.batch_id}
                  batch={b}
                  index={i}
                  goTo={goTo}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* FOOTER */}
        <motion.div {...fadeUp(0.36)} style={{
          marginTop: 28, padding: "16px 24px", background: C.surface,
          border: `1.5px solid ${C.border}`, borderRadius: 18,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>🐔</span>
            <span style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 13, color: C.text }}>
              AyamTech Worker Hub
            </span>
            <span style={{ fontSize: 11, color: C.textLight }}>· Keep up the great work!</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <TrendingUp size={14} color={C.green} />
            <span style={{ fontFamily: C.sans, fontWeight: 700, fontSize: 12, color: C.greenDark }}>
              {totalLogged} tasks completed today
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}