import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import API from "../api/axios";
import {
  BarChart3,
  Trophy,
  Star,
  Target,
  RefreshCw,
  ClipboardList,
  Award,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Users,
  Activity,
  CheckCircle2,
  Camera,
  Wheat,
  Pill,
  Heart,
  Package,
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
  purpleDark: "#6D28D9",
  purpleDim: "#F0EDFF",
  text: "#102114",
  textMid: "#6E8A72",
  textLight: "#9AA89B",
  sans: "'Plus Jakarta Sans', sans-serif",
  body: "'Inter', sans-serif",
};

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] },
});

function n(value, digits = 0) {
  return Number(value || 0).toLocaleString("en-MY", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
  });
}

function StatCard({ icon: Icon, title, value, sub, color, delay }) {
  return (
    <motion.div
      {...fadeUp(delay)}
      whileHover={{ y: -4 }}
      style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 22,
        padding: 22,
        boxShadow: "0 8px 28px rgba(16,33,20,.06)",
        minHeight: 150,
      }}
    >
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 16,
        background: `${color}18`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
      }}>
        <Icon size={24} color={color} />
      </div>
      <div style={{ fontFamily: C.sans, fontSize: 30, fontWeight: 900, color: C.text, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ marginTop: 8, fontFamily: C.sans, fontSize: 13, fontWeight: 900, color: C.text }}>
        {title}
      </div>
      <div style={{ marginTop: 5, fontSize: 12, color: C.textMid, fontWeight: 700 }}>
        {sub}
      </div>
    </motion.div>
  );
}

function Section({ title, icon: Icon, children, right, delay = 0.05 }) {
  return (
    <motion.section
      {...fadeUp(delay)}
      style={{
        background: C.surface,
        border: `1.5px solid ${C.border}`,
        borderRadius: 22,
        padding: 22,
        boxShadow: "0 8px 28px rgba(16,33,20,.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: C.greenDim,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Icon size={18} color={C.greenDark} />
          </div>
          <h2 style={{ margin: 0, fontFamily: C.sans, fontSize: 17, fontWeight: 900, color: C.text }}>
            {title}
          </h2>
        </div>
        {right}
      </div>
      {children}
    </motion.section>
  );
}

function ProgressBar({ value, color = C.green, height = 10 }) {
  return (
    <div style={{
      height,
      background: C.bg,
      borderRadius: 99,
      overflow: "hidden",
      border: `1px solid ${C.border}`,
    }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Number(value || 0))}%` }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{
          height: "100%",
          background: `linear-gradient(90deg,${color},${color}CC)`,
          borderRadius: 99,
        }}
      />
    </div>
  );
}

function BadgeCard({ badge }) {
  return (
    <div style={{
      background: badge.unlocked ? C.greenDim : C.bg,
      border: `1.5px solid ${badge.unlocked ? C.green + "40" : C.border}`,
      borderRadius: 18,
      padding: 16,
      display: "flex",
      gap: 12,
      alignItems: "center",
    }}>
      <div style={{ fontSize: 30 }}>{badge.icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontFamily: C.sans, fontWeight: 900, color: C.text }}>{badge.title}</div>
          <div style={{
            fontSize: 11,
            fontFamily: C.sans,
            fontWeight: 900,
            color: badge.unlocked ? C.greenDark : C.textMid,
          }}>
            {badge.unlocked ? "Achieved ✓" : `${badge.progress}%`}
          </div>
        </div>
        <div style={{ margin: "4px 0 10px", color: C.textMid, fontSize: 12, fontWeight: 700 }}>
          {badge.description}
        </div>
        <ProgressBar value={badge.progress} color={badge.unlocked ? C.green : C.amber} height={8} />
      </div>
    </div>
  );
}

function Chart({ data }) {
  const max = Math.max(1, ...data.map((d) => Number(d.total_tasks || 0)));

  return (
    <div style={{
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 18,
      padding: 18,
    }}>
      <div style={{ height: 230, display: "flex", alignItems: "end", gap: 12 }}>
        {data.map((d) => {
          const value = Number(d.total_tasks || 0);
          const h = Math.max(8, (value / max) * 180);
          return (
            <div key={d.activity_date} style={{ flex: 1, textAlign: "center" }}>
              <div style={{
                height: 190,
                display: "flex",
                alignItems: "end",
                justifyContent: "center",
              }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: h }}
                  transition={{ duration: 0.6 }}
                  style={{
                    width: "70%",
                    maxWidth: 54,
                    background: d.completed_day
                      ? `linear-gradient(180deg,${C.green},${C.greenDark})`
                      : "#D9E4D4",
                    borderRadius: "12px 12px 6px 6px",
                    position: "relative",
                  }}
                >
                  <span style={{
                    position: "absolute",
                    top: -24,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: C.sans,
                    fontWeight: 900,
                    fontSize: 12,
                    color: C.text,
                  }}>
                    {value}
                  </span>
                </motion.div>
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: C.textMid, fontWeight: 800 }}>
                {d.day_label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function WorkerPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const stats = data?.stats || {};
  const daily = data?.dailyCompletion || [];
  const badges = data?.badges || [];
  const recent = data?.recentActivity || [];
  const team = data?.teamAverage || [];
  const batchSummary = data?.batchSummary || [];

  const totalMonthlyRecords =
    Number(stats.feed_records_month || 0) +
    Number(stats.medication_records_month || 0) +
    Number(stats.mortality_records_month || 0);

  const trend = Number(data?.trend || 0);
  const completedDays = Number(data?.completedDays || 0);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const res = await API.get("/worker/performance");
      setData(res.data);
    } catch (err) {
      console.error("Failed to load performance:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const aboveAverage = useMemo(() => {
    if (!team.length) return false;
    return team.every((row) => Number(row.you_value || 0) >= Number(row.avg_value || 0));
  }, [team]);

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
          style={{
            width: 46,
            height: 46,
            borderRadius: "50%",
            border: `3px solid ${C.border}`,
            borderTopColor: C.green,
          }}
        />
        <p style={{ color: C.textMid, fontWeight: 600 }}>Loading performance page…</p>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: C.body, color: C.text, paddingBottom: 60 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 7px; height: 7px; }
        ::-webkit-scrollbar-thumb { background: #C8D7C1; border-radius: 10px; }
      `}</style>

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
          height: 78,
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}>
          <div style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            background: `linear-gradient(135deg,${C.green},${C.greenDark})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 10px 28px ${C.green}35`,
          }}>
            <BarChart3 size={27} color="#fff" />
          </div>

          <div>
            <h1 style={{ margin: 0, fontFamily: C.sans, fontSize: 25, fontWeight: 900, color: C.text }}>
              My Performance
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: C.textMid, fontWeight: 700 }}>
              Track your monthly records, streak, rank and farm activity performance
            </p>
          </div>

          <button
            onClick={fetchPerformance}
            style={{
              marginLeft: "auto",
              border: `1.5px solid ${C.border}`,
              background: C.surface,
              borderRadius: 14,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: C.sans,
              fontWeight: 900,
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginBottom: 24 }}>
          <StatCard
            icon={Trophy}
            title="Tasks This Month"
            value={n(stats.tasks_this_month)}
            sub={`${Number(stats.month_difference || 0) >= 0 ? "+" : ""}${n(stats.month_difference)} vs last month`}
            color={C.amber}
            delay={0.02}
          />
          <StatCard
            icon={BarChart3}
            title="Accuracy Score"
            value={`${n(stats.accuracy_score)}%`}
            sub={`${completedDays}/7 active days this week`}
            color={C.blue}
            delay={0.04}
          />
          <StatCard
            icon={Star}
            title="Rank"
            value={`#${n(stats.worker_rank)}`}
            sub={`of ${n(stats.total_workers)} workers`}
            color={C.purple}
            delay={0.06}
          />
          <StatCard
            icon={Target}
            title="Streak Days"
            value={n(stats.current_streak)}
            sub={`Best: ${n(stats.best_streak)} days`}
            color={C.green}
            delay={0.08}
          />
        </div>

        <Section
          title="Performance Overview"
          icon={TrendingUp}
          right={
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: trend >= 0 ? C.greenDim : C.redDim,
              color: trend >= 0 ? C.greenDark : C.red,
              padding: "7px 10px",
              borderRadius: 99,
              fontFamily: C.sans,
              fontWeight: 900,
              fontSize: 12,
            }}>
              {trend >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {trend >= 0 ? "+" : ""}{trend}% vs last week
            </span>
          }
        >
          <Chart data={daily} />
          <div style={{
            marginTop: 14,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            fontSize: 13,
            color: C.textMid,
            fontWeight: 800,
          }}>
            <span>✅ Completed: <strong style={{ color: C.text }}>{completedDays}/7 days</strong></span>
            <span>📈 Total this month: <strong style={{ color: C.text }}>{n(stats.tasks_this_month)} records</strong></span>
          </div>
        </Section>

        <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 20, marginTop: 24 }}>
          <Section title="Achievement Badges" icon={Award} delay={0.08}>
            <div style={{ display: "grid", gap: 12 }}>
              {badges.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </Section>

          <div style={{ display: "grid", gap: 20 }}>
            <Section title="Record Breakdown" icon={ClipboardList} delay={0.1}>
              {[
                { label: "Feed Records", value: stats.feed_records_month, icon: Wheat, color: C.green },
                { label: "Medication", value: stats.medication_records_month, icon: Pill, color: C.purple },
                { label: "Mortality", value: stats.mortality_records_month, icon: Heart, color: C.red },
                { label: "Photos Uploaded", value: stats.photo_count, icon: Camera, color: C.blue },
              ].map((row) => {
                const pct = totalMonthlyRecords > 0 ? (Number(row.value || 0) / Math.max(1, totalMonthlyRecords)) * 100 : 0;
                const Icon = row.icon;
                return (
                  <div key={row.label} style={{ marginBottom: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 900 }}>
                        <Icon size={15} color={row.color} /> {row.label}
                      </span>
                      <span style={{ fontFamily: C.sans, fontWeight: 900 }}>{n(row.value)}</span>
                    </div>
                    <ProgressBar value={pct} color={row.color} />
                  </div>
                );
              })}
              <div style={{
                marginTop: 4,
                paddingTop: 14,
                borderTop: `1px solid ${C.border}`,
                fontFamily: C.sans,
                fontWeight: 900,
              }}>
                Total: {n(totalMonthlyRecords)} records this month
              </div>
            </Section>

            <Section title="Monthly Comparison" icon={Activity} delay={0.12}>
              <div style={{ display: "grid", gap: 10, fontSize: 13, fontWeight: 800, color: C.textMid }}>
                <div>Tasks: <strong style={{ color: stats.month_difference >= 0 ? C.greenDark : C.red }}>{stats.month_difference >= 0 ? "+" : ""}{n(stats.month_difference)} records</strong></div>
                <div>Accuracy: <strong style={{ color: C.greenDark }}>{n(stats.accuracy_score)}%</strong></div>
                <div>Rank: <strong style={{ color: C.purpleDark }}>#{n(stats.worker_rank)} of {n(stats.total_workers)}</strong></div>
                <div>Current streak: <strong style={{ color: C.greenDark }}>{n(stats.current_streak)} days</strong></div>
              </div>
            </Section>
          </div>
        </div>

        <Section title="Recent Activity Summary" icon={ClipboardList} delay={0.14} right={
          <span style={{ fontSize: 11, color: C.textMid, fontWeight: 800 }}>Last 30 days</span>
        }>
          {recent.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", color: C.textMid, fontWeight: 700 }}>
              No activity records found yet.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.greenDim }}>
                    {["Date", "Feed", "Medication", "Mortality"].map((h) => (
                      <th key={h} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.map((row, idx) => (
                    <tr key={row.activity_date} style={{ background: idx % 2 === 0 ? C.surface : C.bg }}>
                      <td style={tdStyle}>{formatDate(row.activity_date)}</td>
                      <td style={tdStyle}>{row.feed_summary}</td>
                      <td style={tdStyle}>{row.medication_summary}</td>
                      <td style={tdStyle}>{row.mortality_summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Performance vs Team Average" icon={Users} delay={0.16} right={
          aboveAverage ? (
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: C.greenDim,
              color: C.greenDark,
              borderRadius: 99,
              padding: "7px 10px",
              fontSize: 11,
              fontFamily: C.sans,
              fontWeight: 900,
            }}>
              <CheckCircle2 size={13} /> Above average
            </span>
          ) : null
        }>
          <div style={{ display: "grid", gap: 16 }}>
            {team.map((row) => {
              const max = Math.max(Number(row.you_value || 0), Number(row.avg_value || 0), 1);
              const pct = (Number(row.you_value || 0) / max) * 100;
              return (
                <div key={row.metric}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 13, fontWeight: 800 }}>
                    <span>{row.metric}</span>
                    <span style={{ color: C.textMid }}>
                      You: <strong style={{ color: C.text }}>{n(row.you_value)}</strong>
                      {" "} Avg: <strong style={{ color: C.text }}>{n(row.avg_value, 1)}</strong>
                    </span>
                  </div>
                  <ProgressBar value={pct} color={pct >= 100 ? C.green : C.blue} />
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop: 16,
            background: aboveAverage ? C.greenDim : C.blueDim,
            color: aboveAverage ? C.greenDark : C.blue,
            borderRadius: 16,
            padding: 14,
            fontFamily: C.sans,
            fontWeight: 900,
            fontSize: 13,
          }}>
            {aboveAverage
              ? "🎉 You are above average in all categories!"
              : "Keep recording consistently to improve your team ranking."}
          </div>
        </Section>

        <Section title="Batch Chicks Summary" icon={Package} delay={0.18} right={
          <span style={{ fontSize: 11, color: C.textMid, fontWeight: 800 }}>
            Original chicks from chick_purchase.quantity · Remaining chicks from batch.total_chicks
          </span>
        }>
          {batchSummary.length === 0 ? (
            <div style={{ padding: 24, color: C.textMid }}>No batch data found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: C.blueDim }}>
                    {["Batch", "Status", "Original Chicks", "Remaining Chicks", "Deaths", "Mortality"].map((h) => (
                      <th key={h} style={{ ...thStyle, color: C.blue }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {batchSummary.slice(0, 8).map((row, idx) => (
                    <tr key={row.batch_id} style={{ background: idx % 2 === 0 ? C.surface : C.bg }}>
                      <td style={tdStyle}><strong style={{ color: C.blue }}>{row.batch_id}</strong></td>
                      <td style={tdStyle}>{row.batch_status}</td>
                      <td style={tdStyle}>{n(row.original_chicks)}</td>
                      <td style={tdStyle}>{n(row.remaining_chicks)}</td>
                      <td style={tdStyle}>{n(row.total_deaths)}</td>
                      <td style={tdStyle}>{n(row.mortality_rate, 2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Tips to Improve Your Performance" icon={Lightbulb} delay={0.2}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {[
              "Record feed consistently each day for stronger streaks.",
              "Add photos to medication records to improve proof quality.",
              "Record mortality immediately so owners see updated remaining chicks.",
              "Keep daily records complete to improve your rank.",
            ].map((tip, i) => (
              <div key={i} style={{
                background: C.amberDim,
                border: `1px solid ${C.amber}25`,
                borderRadius: 16,
                padding: 14,
                fontSize: 12,
                color: "#92400E",
                fontWeight: 700,
                lineHeight: 1.6,
              }}>
                • {tip}
              </div>
            ))}
          </div>
        </Section>

        <div style={{ marginTop: 28, color: C.textLight, fontSize: 11, fontWeight: 700 }}>
          AyamTech Worker Hub · You're doing great — keep recording consistently!
        </div>
      </main>

      <style>{`
        main > section { margin-top: 24px; }
        @media (max-width: 1050px) {
          main > div, main section div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

const thStyle = {
  padding: "13px 16px",
  textAlign: "left",
  color: C.greenDark,
  fontFamily: C.sans,
  fontWeight: 900,
  fontSize: 11,
  letterSpacing: ".07em",
  textTransform: "uppercase",
  borderBottom: `1.5px solid ${C.border}`,
};

const tdStyle = {
  padding: "14px 16px",
  borderBottom: `1px solid ${C.border}`,
  color: C.textMid,
  fontWeight: 700,
};
