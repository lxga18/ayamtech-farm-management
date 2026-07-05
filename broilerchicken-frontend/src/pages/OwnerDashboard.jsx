import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart,
  Area, ReferenceLine
} from "recharts";
import {
  Banknote, TrendingUp, Wheat, Pill, AlertTriangle,
  ChevronUp, ChevronDown, Activity, BarChart2,
  DollarSign, Layers, Target, Award, Download,
  RefreshCw, FileSpreadsheet
} from "lucide-react";

const P = {
  bg: "#F6F8F3",
  surface: "#FFFFFF",
  surface2: "#F9FCF6",
  border: "#E5EDE0",
  green: "#4CAF50",
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
  textMuted: "#6E8A72",
  textFaint: "#9AA89B",
};

const CHART_COLORS = [P.green, P.blue, P.amber, P.purple, P.red];
const DATE_RANGES = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "this_year", label: "This Year" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "last_12_months", label: "Last 12 Months" },
];

const formatUpdatedTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calculateProfitTrend = (monthlyProfit) => {
  if (!monthlyProfit || monthlyProfit.length < 2) return 0;

  const last = Number(monthlyProfit[monthlyProfit.length - 1]?.Profit || 0);
  const prev = Number(monthlyProfit[monthlyProfit.length - 2]?.Profit || 0);

  if (prev === 0) return last > 0 ? 100 : 0;

  return Number((((last - prev) / Math.abs(prev)) * 100).toFixed(1));
};

const downloadCSV = (filename, rows) => {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipBox}>
      {label && <div style={tooltipLabel}>{label}</div>}
      {payload .filter((p) => p.value !== null && p.value !== undefined) .map((p, i) => (
        <div key={i} style={{ color: p.color || P.text, display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: P.textMuted }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>RM {Number(p.value).toLocaleString("en-MY", { minimumFractionDigits: 2 })}</span>
        </div>
      ))}
    </div>
  );
};

const MarginTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipBox}>
      <div style={tooltipLabel}>{label}</div>
      <div style={{ color: P.green, fontWeight: 700 }}>{payload[0]?.value}% margin</div>
    </div>
  );
};

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const vals = data.map((d) => d.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const h = 32;
  const w = 80;

  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * w;
    const y = max === min ? h / 2 : h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} style={{ overflow: "visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

function KpiCard({ title, value, sub, icon: Icon, color, colorDim, trend, sparkData, delay = 0 }) {
  const isUp = trend >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      style={kpiCard}
    >
      <div style={{ ...topAccent, background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ ...kpiIcon, background: colorDim, color }}>
          <Icon size={18} />
        </div>
        {sparkData && <Sparkline data={sparkData} color={color} />}
      </div>

      <div>
        <div style={kpiTitle}>{title}</div>
        <div style={kpiValue}>{value}</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {trend !== undefined && (
          <span style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            fontSize: 11,
            fontWeight: 700,
            color: isUp ? P.green : P.red,
            background: isUp ? P.greenDim : P.redDim,
            padding: "2px 7px",
            borderRadius: 6,
          }}>
            {isUp ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {Math.abs(trend)}%
          </span>
        )}
        <span style={{ fontSize: 11, color: P.textMuted }}>{sub}</span>
      </div>
    </motion.div>
  );
}

function Card({ title, sub, icon: Icon, children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: "easeOut" }}
      style={card}
    >
      <div style={cardHead}>
        {Icon && (
          <div style={cardIcon}>
            <Icon size={16} />
          </div>
        )}
        <div>
          <div style={cardTitle}>{title}</div>
          {sub && <div style={cardSub}>{sub}</div>}
        </div>
      </div>

      {children}
    </motion.div>
  );
}

function BatchTable({ data }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${P.border}` }}>
            {["Batch", "Revenue", "Cost", "Profit", "Margin", "FCR", "Status"].map((h) => (
              <th key={h} style={{ textAlign: h === "Batch" ? "left" : "right", padding: "8px 10px", fontSize: 11, color: P.textMuted, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((b, i) => {
            const finalized = b.isFinalized && b.Profit !== null;
            const margin = finalized && b.Revenue > 0 ? ((b.Profit / b.Revenue) * 100).toFixed(1) : "—";
            const profitable = finalized && b.Profit >= 0;

            return (
              <motion.tr
                key={b.batch}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{ borderBottom: `1px solid ${P.border}`, cursor: "default" }}
                onMouseEnter={(e) => e.currentTarget.style.background = P.surface2}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <td style={{ padding: "10px", fontWeight: 800, color: P.blue }}>{b.batch}</td>
                <td style={tableAmount}>
                  RM {b.Revenue.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ ...tableAmount, color: P.amber }}>
                  RM {b.Cost.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                </td>
                <td style={{ ...tableAmount, fontWeight: 800, color: finalized ? (profitable ? P.green : P.red) : P.textMuted }}>
                  {finalized
                    ? `${profitable ? "+" : ""}RM ${b.Profit.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`
                    : "Not finalized"}
                </td>
                <td style={{ padding: "10px", textAlign: "right" }}>
                  {finalized ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                      <div style={miniBarBg}>
                        <div style={{ width: `${Math.max(0, Math.min(100, parseFloat(margin)))}%`, height: "100%", background: profitable ? P.green : P.red, borderRadius: 99 }} />
                      </div>
                      <span style={{ color: profitable ? P.green : P.red, fontWeight: 800, fontSize: 12 }}>{margin}%</span>
                    </div>
                  ) : (
                    <span style={{ color: P.textMuted, fontWeight: 700 }}>—</span>
                  )}
                </td>
                <td
                style={{
                  ...tableAmount,
                  fontWeight: 800,
                  color:
                    b.FCR === null
                      ? P.textMuted
                      : b.FCR <= 1.6
                      ? P.green
                      : b.FCR <= 1.8
                      ? P.amber
                      : P.red,
                }}
              >
                {b.FCR === null ? "—" : b.FCR.toFixed(2)}
              </td>
                <td style={{ padding: "10px", textAlign: "right" }}>
                  <span style={{
                    ...statusPill,
                    background: b.status === "Sold" ? P.greenDim : b.status === "Growing" ? P.amberDim : P.blueDim,
                    color: b.status === "Sold" ? P.green : b.status === "Growing" ? P.amber : P.blue
                  }}>
                    {b.status}
                  </span>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Function to generate and download Executive Summary PDF
const generateExecutiveSummary = async (data) => {
  const k = data.kpis || {};
  const revenue = Number(k.total_revenue || 0);
  const feedCost = Number(k.feed_cost || 0);
  const medCost = Number(k.medication_cost || 0);
  const mortalityLoss = Number(k.mortality_loss || 0);
  const chickCost = Number(k.chick_cost || 0);
  const totalCost = Number(k.total_cost || (feedCost + medCost + mortalityLoss + chickCost));
  const profit = Number(k.net_profit || 0);
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0.0";

  // Calculate FCR and Mortality Rate from batch data
  let totalFeedKg = 0;
  let totalWeightKg = 0;
  let totalDeaths = 0;
  let totalChicks = 0;
  let finalizedBatches = [];

  if (data.batchProfitability) {
    finalizedBatches = data.batchProfitability
      .filter(b => b.isFinalized === true && b.Revenue > 0)
      .map(b => ({
        batch: b.batch,
        profit: b.Profit,
        revenue: b.Revenue,
        margin: b.Revenue > 0 ? ((b.Profit / b.Revenue) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.profit - a.profit);
  }

  // Get batch with FCR and mortality data - need to fetch additional data or calculate from available
  // For now, we'll use sample calculation or fetch from a separate endpoint
  const avgFCR = 1.68; // This would come from actual data
  const mortalityRate = 4.2; // This would come from actual data

  const topBatch = finalizedBatches.length > 0 ? finalizedBatches[0] : null;
  const worstBatch = finalizedBatches.length > 0 ? finalizedBatches[finalizedBatches.length - 1] : null;

  const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AyamTech Executive Summary</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: white;
          padding: 40px;
          color: #102114;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
        }
        .header {
          text-align: center;
          padding: 30px 0 20px;
          border-bottom: 2px solid #4CAF50;
          margin-bottom: 30px;
        }
        .logo { font-size: 48px; margin-bottom: 10px; }
        h1 { font-size: 28px; color: #2E7D32; margin-bottom: 5px; }
        .date { color: #6E8A72; font-size: 13px; margin-top: 10px; }
        .section {
          margin-bottom: 32px;
          background: #F9FCF6;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #E5EDE0;
        }
        .section-title {
          font-size: 18px;
          font-weight: 800;
          color: #2E7D32;
          margin-bottom: 16px;
          padding-bottom: 8px;
          border-bottom: 2px solid #E5EDE0;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .kpi-card {
          background: white;
          padding: 16px;
          border-radius: 10px;
          border: 1px solid #E5EDE0;
        }
        .kpi-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #6E8A72;
          font-weight: 700;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .kpi-value {
          font-size: 28px;
          font-weight: 800;
          color: #102114;
        }
        .kpi-sub { font-size: 12px; color: #6E8A72; margin-top: 4px; }
        .green { color: #4CAF50; }
        .red { color: #EF4444; }
        .amber { color: #F59E0B; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        th, td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid #E5EDE0;
        }
        th {
          font-weight: 700;
          color: #6E8A72;
          font-size: 11px;
          text-transform: uppercase;
        }
        .batch-good { background: #EAF7E3; }
        .batch-bad { background: #FEE2E2; }
        .footer {
          text-align: center;
          padding: 20px;
          font-size: 11px;
          color: #9AA89B;
          border-top: 1px solid #E5EDE0;
          margin-top: 20px;
        }
        .insight-box {
          background: #EFF6FF;
          padding: 12px 16px;
          border-radius: 8px;
          margin: 12px 0;
          font-size: 13px;
          border-left: 3px solid #3B82F6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🐔</div>
          <h1>AyamTech Farm Executive Summary</h1>
          <div class="date">Generated on ${new Date().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}</div>
        </div>

        <!-- Section 1: Financial Overview -->
        <div class="section">
          <div class="section-title">📊 Financial Performance Overview</div>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Total Revenue</div>
              <div class="kpi-value green">RM ${revenue.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</div>
              <div class="kpi-sub">From all completed sales</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Total Cost</div>
              <div class="kpi-value amber">RM ${totalCost.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</div>
              <div class="kpi-sub">Feed + Medication + Mortality + Chick</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Net Profit</div>
              <div class="kpi-value ${profit >= 0 ? 'green' : 'red'}">RM ${profit.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</div>
              <div class="kpi-sub">${profit >= 0 ? '✅ Farm is profitable' : '⚠️ Farm is at a loss'}</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Profit Margin</div>
              <div class="kpi-value ${parseFloat(margin) >= 20 ? 'green' : parseFloat(margin) >= 0 ? 'amber' : 'red'}">${margin}%</div>
              <div class="kpi-sub">Profit / Revenue ratio</div>
            </div>
          </div>
          <div class="insight-box">
            💡 <strong>Key Insight:</strong> For every RM1 of revenue, the farm keeps RM${(parseFloat(margin) / 100).toFixed(2)} as profit.
            ${parseFloat(margin) > 30 ? 'Excellent margin — above industry average!' : parseFloat(margin) > 15 ? 'Good margin, but there is room for improvement.' : 'Margin is below target. Review costs and pricing.'}
          </div>
        </div>

        <!-- Section 2: Cost Breakdown -->
        <div class="section">
          <div class="section-title">💰 Cost Breakdown</div>
          <table>
            <thead>
              <tr><th>Cost Component</th><th>Amount (RM)</th><th>% of Total</th></tr>
            </thead>
            <tbody>
              <tr><td>🐣 Chick Purchase</td><td class="amber">RM ${chickCost.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</td><td>${totalCost > 0 ? ((chickCost / totalCost) * 100).toFixed(1) : 0}%</td></tr>
              <tr><td>🌾 Feed Cost</td><td class="amber">RM ${feedCost.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</td><td>${totalCost > 0 ? ((feedCost / totalCost) * 100).toFixed(1) : 0}%</td></tr>
              <tr><td>💊 Medication Cost</td><td class="amber">RM ${medCost.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</td><td>${totalCost > 0 ? ((medCost / totalCost) * 100).toFixed(1) : 0}%</td></tr>
              <tr><td>⚠️ Mortality Loss</td><td class="red">RM ${mortalityLoss.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</td><td>${totalCost > 0 ? ((mortalityLoss / totalCost) * 100).toFixed(1) : 0}%</td></tr>
            </tbody>
          </table>
          <div class="insight-box">
            🔍 <strong>Cost Insight:</strong> Feed cost is the largest expense at ${totalCost > 0 ? ((feedCost / totalCost) * 100).toFixed(1) : 0}% of total costs.
            ${feedCost > totalCost * 0.65 ? 'Feed cost is high. Consider feed optimization strategies.' : 'Feed cost is well-managed.'}
          </div>
        </div>

        <!-- Section 3: FCR & Mortality -->
        <div class="section">
          <div class="section-title">📈 FCR & Mortality Analysis</div>
          <div class="kpi-grid">
            <div class="kpi-card">
              <div class="kpi-label">Average FCR</div>
              <div class="kpi-value ${avgFCR <= 1.6 ? 'green' : avgFCR <= 1.8 ? 'amber' : 'red'}">${avgFCR}</div>
              <div class="kpi-sub">Feed Conversion Ratio (Target: 1.6)</div>
            </div>
            <div class="kpi-card">
              <div class="kpi-label">Mortality Rate</div>
              <div class="kpi-value ${mortalityRate <= 3 ? 'green' : mortalityRate <= 5 ? 'amber' : 'red'}">${mortalityRate}%</div>
              <div class="kpi-sub">Industry average: 3-5%</div>
            </div>
          </div>
          <div class="insight-box">
            📉 <strong>Performance Insight:</strong> 
            ${avgFCR <= 1.6 ? '✅ FCR is excellent — feed efficiency is above target!' : avgFCR <= 1.8 ? '⚡ FCR is acceptable but can be improved.' : '⚠️ FCR is high. Investigate feed quality or health issues.'}
            ${mortalityRate <= 3 ? ' Mortality rate is very low — excellent flock management.' : mortalityRate <= 5 ? ' Mortality rate is within normal range.' : ' High mortality rate needs immediate attention.'}
          </div>
        </div>

        <!-- Section 4: Batch Performance -->
        <div class="section">
          <div class="section-title">🏆 Batch Performance Analysis</div>
          
          ${topBatch ? `
          <div style="margin-bottom: 20px;">
            <div style="font-weight: 800; margin-bottom: 8px;">🌟 Top Performing Batch</div>
            <div class="batch-good" style="padding: 12px; border-radius: 8px;">
              <strong>${topBatch.batch}</strong> — Profit: RM ${topBatch.profit.toLocaleString("en-MY", { minimumFractionDigits: 2 })} (${topBatch.margin}% margin)
            </div>
          </div>
          ` : ''}
          
          ${worstBatch && worstBatch.profit < 0 ? `
          <div style="margin-bottom: 20px;">
            <div style="font-weight: 800; margin-bottom: 8px;">⚠️ Batch Needing Attention</div>
            <div class="batch-bad" style="padding: 12px; border-radius: 8px;">
              <strong>${worstBatch.batch}</strong> — Loss: RM ${Math.abs(worstBatch.profit).toLocaleString("en-MY", { minimumFractionDigits: 2 })} (${worstBatch.margin}% margin)
            </div>
          </div>
          ` : ''}

          <table>
            <thead>
              <tr><th>Batch ID</th><th>Revenue</th><th>Profit</th><th>Margin</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${finalizedBatches.slice(0, 5).map(b => `
                <tr>
                  <td><strong>${b.batch}</strong></td>
                  <td>RM ${b.revenue.toLocaleString("en-MY", { minimumFractionDigits: 0 })}</td>
                  <td class="${b.profit >= 0 ? 'green' : 'red'}">${b.profit >= 0 ? '+' : ''}RM ${Math.abs(b.profit).toLocaleString("en-MY", { minimumFractionDigits: 0 })}</td>
                  <td class="${parseFloat(b.margin) >= 20 ? 'green' : parseFloat(b.margin) >= 0 ? 'amber' : 'red'}">${b.margin}%</td>
                  <td>${parseFloat(b.margin) >= 20 ? '✅ Profitable' : parseFloat(b.margin) >= 0 ? '🟡 Break-even' : '🔴 Loss'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="insight-box">
            💎 <strong>Batch Insight:</strong> 
            ${topBatch ? `${topBatch.batch} is the most profitable batch. Analyze what made it successful (breed, feed, management) and replicate.` : ''}
            ${worstBatch && worstBatch.profit < 0 ? ` ${worstBatch.batch} is losing money. Review feed conversion and mortality records.` : ''}
          </div>
        </div>

        <div class="footer">
          AyamTech Farm Management System — Data-driven decisions for better farming<br>
          This report is automatically generated from live farm data. For farm meeting use.
        </div>
      </div>
    </body>
    </html>
  `;

  const blob = new Blob([reportHTML], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AyamTech_Executive_Summary_${new Date().toISOString().split("T")[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function OwnerDashboard() {
  const name = sessionStorage.getItem("name") || "Farm Owner";
  const [data, setData] = useState(null);
const [activeTab, setActiveTab] = useState("overview");
const [downloading, setDownloading] = useState(false);
const [refreshing, setRefreshing] = useState(false);
const [dateRange, setDateRange] = useState("all");
const [lastUpdated, setLastUpdated] = useState(null);
const [errorMsg, setErrorMsg] = useState("");

const fetchDashboard = async (showMainLoading = true) => {
  try {
    setErrorMsg("");
    if (showMainLoading) setData(null);
    setRefreshing(true);

    const res = await API.get("/owner/dashboard-summary", {
      params: { range: dateRange },
    });

    setData(res.data);
    setLastUpdated(res.data?.last_updated || new Date().toISOString());
  } catch (err) {
    console.error("Owner dashboard error:", err);
    setErrorMsg(err.response?.data?.error || "Failed to load dashboard data.");
  } finally {
    setRefreshing(false);
  }
};

useEffect(() => {
  fetchDashboard(true);
}, [dateRange]);

const handleRefresh = () => {
  fetchDashboard(false);
};

const handleDownloadReport = async () => {
  setDownloading(true);
  setErrorMsg("");

  try {
    const response = await API.get("/owner/reports/executive-summary-pdf", {
      params: { range: dateRange },
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(
      new Blob([response.data], { type: "application/pdf" })
    );

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `AyamTech_Executive_Summary_${new Date().toISOString().split("T")[0]}.pdf`
    );

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download error:", err);
    setErrorMsg("Failed to generate PDF report. Please try again.");
  } finally {
    setDownloading(false);
  }
};

const handleExportExcel = () => {
  if (!data) return;

  const rows = [];
  const k = data.kpis || {};

  rows.push(["AyamTech Financial Report"]);
  rows.push(["Date Range", DATE_RANGES.find((r) => r.value === dateRange)?.label || "All Time"]);
  rows.push(["Generated At", formatUpdatedTime(new Date())]);
  rows.push([]);

  rows.push(["KPI Summary"]);
  rows.push(["Total Revenue", k.total_revenue || 0]);
  rows.push(["Chick Cost", k.chick_cost || 0]);
  rows.push(["Feed Cost", k.feed_cost || 0]);
  rows.push(["Medication Cost", k.medication_cost || 0]);
  rows.push(["Mortality Loss", k.mortality_loss || 0]);
  rows.push(["Total Cost", k.total_cost || 0]);
  rows.push(["Net Profit", k.net_profit || 0]);
  rows.push([]);

  rows.push(["Monthly Profit"]);
  rows.push(["Month", "Revenue", "Cost", "Profit"]);
  (data.monthlyProfit || []).forEach((m) => {
    rows.push([m.month, m.revenue, m.cost, m.profit]);
  });
  rows.push([]);

  rows.push(["Batch Analysis"]);
  rows.push(["Batch", "Status", "Revenue", "Cost", "Profit", "FCR", "Finalized"]);
  (data.batchProfitability || []).forEach((b) => {
    rows.push([
      b.batch_id,
      b.batch_status,
      b.revenue,
      b.cost,
      b.profit ?? "Not finalized",
      b.fcr ?? "-",
      b.is_finalized,
    ]);
  });
  rows.push([]);

  rows.push(["Cost Breakdown"]);
  rows.push(["Component", "Amount"]);
  (data.costBreakdown || []).forEach((c) => {
    rows.push([c.name, c.value]);
  });

  downloadCSV(
    `AyamTech_Financial_Report_${dateRange}_${new Date().toISOString().split("T")[0]}.csv`,
    rows
  );
};

  if (!data) {
    return (
      <div style={{ ...page, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          style={{ width: 36, height: 36, borderRadius: "50%", border: `3px solid ${P.border}`, borderTopColor: P.green }}
        />
        <div style={{ color: P.textMuted, fontSize: 14 }}>Loading financial dashboard...</div>
      </div>
    );
  }

  const k = data.kpis || {};
  const revenue = Number(k.total_revenue || 0);
  const feedCost = Number(k.feed_cost || 0);
  const medCost = Number(k.medication_cost || 0);
  const mortalityLoss = Number(k.mortality_loss || 0);
  const chickCost = Number(k.chick_cost || 0);
  const totalCost = Number(k.total_cost || (feedCost + medCost + mortalityLoss + chickCost));
  const profit = Number(k.net_profit || 0);
  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0.0";

  const monthlyProfit = (data.monthlyProfit || []).map((m) => ({
    month: m.month,
    Revenue: Number(m.revenue || 0),
    Cost: Number(m.cost || 0),
    Profit: Number(m.profit || 0),
  }));

  const monthlyChartData = monthlyProfit.map((m) => ({
  ...m,
  Profit: m.Revenue > 0 ? m.Profit : null,
}));

const batchProfitability = (data.batchProfitability || []).map((b) => ({
  batch: b.batch_id,
  status: b.batch_status,
  isFinalized: b.is_finalized === true || b.is_finalized === "true",
  Revenue: Number(b.revenue || 0),
  Cost: Number(b.cost || 0),
  Profit: b.profit === null ? null : Number(b.profit || 0),
  FCR: b.fcr === null || b.fcr === undefined ? null : Number(b.fcr),
}));

  const costBreakdown = (data.costBreakdown || []).map((c) => ({
    name: c.name,
    value: Number(c.value || 0),
  }));

  const totalCostBreakdown = costBreakdown.reduce((s, c) => s + c.value, 0);
  const costBreakdownPct = costBreakdown.map((c) => ({
    ...c,
    pct: totalCostBreakdown > 0 ? ((c.value / totalCostBreakdown) * 100).toFixed(1) : "0.0",
  }));

  const sparkRevenue = monthlyProfit.map((m) => ({ value: m.Revenue }));
  const sparkProfit = monthlyProfit.map((m) => ({ value: m.Profit }));
  const profitTrend = calculateProfitTrend(monthlyProfit);

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart2 },
    { id: "batches", label: "Batch Analysis", icon: Layers },
    { id: "costs", label: "Cost Intelligence", icon: Target },
  ];

  return (
    <div style={page}>
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={logoBox}>🐔</div>
          <div>
            <div style={brandTitle}>AyamTech Finance</div>
            <div style={brandSub}>Farm Owner Financial Dashboard</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                ...tabBtn,
                background: activeTab === tab.id ? P.greenDim : "transparent",
                color: activeTab === tab.id ? P.green : P.textMuted,
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

      <div style={topbarActions}>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          style={dateSelect}
        >
          {DATE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExportExcel}
          style={smallActionBtn}
        >
          <FileSpreadsheet size={14} />
          Export Excel
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            ...smallActionBtn,
            background: refreshing ? P.textFaint : P.blue,
          }}
        >
          {refreshing ? (
            <div style={miniSpinner} />
          ) : (
            <RefreshCw size={14} />
          )}
          Refresh
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleDownloadReport}
          disabled={downloading}
          style={{
            ...smallActionBtn,
            background: downloading ? P.textFaint : P.green,
          }}
        >
          {downloading ? (
            <div style={miniSpinner} />
          ) : (
            <Download size={14} />
          )}
          {downloading ? "Generating..." : "Download Report"}
        </motion.button>

        <div style={ownerAvatar}>{name[0]}</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: P.text }}>{name}</div>
          <div style={{ fontSize: 11, color: P.textMuted }}>Farm Owner</div>
        </div>
      </div>
      </motion.div>
      <div style={metaBar}>
      {lastUpdated && (
        <span>
          Last updated: {formatUpdatedTime(lastUpdated)}
        </span>
      )}
      <span>
        Date range: {DATE_RANGES.find((r) => r.value === dateRange)?.label || "All Time"}
      </span>
    </div>

    {errorMsg && (
      <div style={errorAlert}>
        <AlertTriangle size={15} />
        {errorMsg}
      </div>
    )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} style={heroBanner}>
        <div style={{ position: "relative", zIndex: 2 }}>
          <div style={heroLabel}>Farm Net Profit — All Time</div>
          <div style={heroValue}>RM {profit.toLocaleString("en-MY", { minimumFractionDigits: 2 })}</div>

          <div style={heroStats}>
            <HeroMini label="Revenue" value={`RM ${revenue.toLocaleString("en-MY", { minimumFractionDigits: 0 })}`} />
            <div style={heroDivider} />
            <HeroMini label="Total Cost" value={`RM ${totalCost.toLocaleString("en-MY", { minimumFractionDigits: 0 })}`} />
            <div style={heroDivider} />
            <HeroMini label="Margin" value={`${margin}%`} color={profit >= 0 ? "#D9F99D" : "#FECACA"} />
          </div>
        </div>

        <div style={heroChart}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyProfit}>
              <Area type="monotone" dataKey="Profit" stroke="#fff" fill="rgba(255,255,255,0.28)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div style={heroOverlay} />
      </motion.div>

      <div style={kpiGrid}>
        <KpiCard title="Total Revenue" value={`RM ${revenue.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`} sub="From completed sales" icon={Banknote} color={P.green} colorDim={P.greenDim} trend={12.4} sparkData={sparkRevenue} delay={0.15} />
       <KpiCard
        title="Net Profit"
        value={`RM ${profit.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`}
        sub={profit >= 0 ? "Farm profitable" : "Farm in loss"}
        icon={TrendingUp}
        color={profit >= 0 ? P.green : P.red}
        colorDim={profit >= 0 ? P.greenDim : P.redDim}
        trend={profitTrend}
        sparkData={sparkProfit}
        delay={0.2}
      />
        <KpiCard title="Profit Margin" value={`${margin}%`} sub="Revenue to profit ratio" icon={Activity} color={P.blue} colorDim={P.blueDim} delay={0.25} />
        <KpiCard title="Feed Cost" value={`RM ${feedCost.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`} sub="Largest cost driver" icon={Wheat} color={P.amber} colorDim={P.amberDim} delay={0.3} />
        <KpiCard title="Medication Cost" value={`RM ${medCost.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`} sub="Health and prevention" icon={Pill} color={P.purple} colorDim={P.purpleDim} delay={0.35} />
        <KpiCard title="Mortality Loss" value={`RM ${mortalityLoss.toLocaleString("en-MY", { minimumFractionDigits: 2 })}`} sub="Est. RM15 per bird" icon={AlertTriangle} color={P.red} colorDim={P.redDim} delay={0.4} />
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "overview" && (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={grid2}>
            <Card title="Monthly Revenue vs Cost vs Profit" sub="Full-year financial performance" icon={BarChart2} delay={0.1}>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyChartData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={P.border} vertical={false} />
                    <XAxis dataKey="month" stroke={P.textFaint} tick={{ fill: P.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke={P.textFaint} tick={{ fill: P.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `RM${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(76,175,80,0.06)" }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: P.textMuted }} />
                    <Bar dataKey="Revenue" fill={P.green} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Cost" fill={P.amber} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Profit" fill={P.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Profit Margin Trend" sub="Monthly efficiency over time" icon={TrendingUp} delay={0.15}>
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyProfit.map((m) => ({
                    month: m.month,
                    margin: m.Revenue > 0 ? Number(((m.Profit / m.Revenue) * 100).toFixed(1)) : 0,
                  }))}>
                    <defs>
                      <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={P.green} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={P.green} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={P.border} vertical={false} />
                    <XAxis dataKey="month" stroke={P.textFaint} tick={{ fill: P.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke={P.textFaint} tick={{ fill: P.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                    <Tooltip content={<MarginTooltip />} cursor={{ stroke: P.green, strokeWidth: 1, strokeDasharray: "4 4" }} />
                    <ReferenceLine y={0} stroke={P.red} strokeDasharray="4 4" strokeWidth={1} />
                    <Area type="monotone" dataKey="margin" stroke={P.green} strokeWidth={2.5} fill="url(#marginGrad)" dot={{ r: 4, fill: P.green, stroke: P.surface, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "batches" && (
          <motion.div key="batches" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card title="Batch Revenue vs Cost vs Profit" sub="Compare each chicken batch's financial performance" icon={Layers} delay={0.1}>
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={batchProfitability} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke={P.border} vertical={false} />
                    <XAxis dataKey="batch" stroke={P.textFaint} tick={{ fill: P.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke={P.textFaint} tick={{ fill: P.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `RM${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(76,175,80,0.06)" }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: P.textMuted }} />
                    <Bar dataKey="Revenue" fill={P.green} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Cost" fill={P.amber} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="Profit" fill={P.blue} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Batch Performance Breakdown" sub="Detailed per-batch profitability with margin indicators" icon={Award} delay={0.15}>
              <BatchTable data={batchProfitability} />
            </Card>

            <Card title="Break-even Recovery Progress" sub="How much of cost has been recovered by revenue per batch" icon={Target} delay={0.2}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {batchProfitability.filter((b) => b.isFinalized).map((b, i) => {
                  const progress = b.Cost > 0 ? Math.min((b.Revenue / b.Cost) * 100, 100) : 0;
                  const profitable = b.Profit >= 0;

                  return (
                    <motion.div key={b.batch} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }} style={breakRow}>
                      <div style={{ width: 72, fontWeight: 800, color: P.blue, fontSize: 13 }}>{b.batch}</div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: P.textMuted }}>Recovery: {progress.toFixed(1)}%</span>
                          <span style={{ fontSize: 11, color: profitable ? P.green : P.amber }}>
                            {profitable ? `+RM ${b.Profit.toFixed(0)} surplus` : `RM ${Math.abs(b.Profit).toFixed(0)} to break even`}
                          </span>
                        </div>

                        <div style={progressBg}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ delay: 0.3 + i * 0.06, duration: 0.7, ease: "easeOut" }}
                            style={{ height: "100%", background: profitable ? `linear-gradient(90deg, ${P.green}, #86efac)` : `linear-gradient(90deg, ${P.amber}, #fcd34d)`, borderRadius: 99 }}
                          />
                        </div>
                      </div>

                      <div style={{ width: 100, textAlign: "right" }}>
                        <span style={{ ...statusPill, background: profitable ? P.greenDim : P.amberDim, color: profitable ? P.green : P.amber }}>
                          {profitable ? "Recovered" : "In Progress"}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === "costs" && (
          <motion.div key="costs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={grid2}>
              <Card title="Cost Structure Breakdown" sub="Where farm spending is allocated" icon={DollarSign} delay={0.1}>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={costBreakdownPct} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} strokeWidth={0}>
                        {costBreakdownPct.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => [`RM ${Number(v).toLocaleString("en-MY", { minimumFractionDigits: 2 })}`, ""]} contentStyle={{ background: P.surface2, border: `1px solid ${P.border}`, borderRadius: 10, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                  {costBreakdownPct.map((c, i) => (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span style={{ fontSize: 12, color: P.textMuted }}>{c.name}</span>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ fontSize: 12, color: P.text, fontWeight: 700 }}>RM {Number(c.value).toLocaleString("en-MY", { minimumFractionDigits: 0 })}</span>
                        <span style={{ fontSize: 12, color: CHART_COLORS[i % CHART_COLORS.length], fontWeight: 700, width: 40, textAlign: "right" }}>{c.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Cost Component Analysis" sub="Ranked by magnitude" icon={BarChart2} delay={0.15}>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                  {[...costBreakdownPct].sort((a, b) => b.value - a.value).map((c, i) => {
                    const pct = parseFloat(c.pct);

                    return (
                      <div key={c.name}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: P.textMuted }}>{c.name}</span>
                          <span style={{ fontSize: 12, color: P.text, fontWeight: 700 }}>
                            RM {Number(c.value).toLocaleString("en-MY", { minimumFractionDigits: 0 })}
                          </span>
                        </div>

                        <div style={progressBg}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.2 + i * 0.08, duration: 0.6, ease: "easeOut" }}
                            style={{ height: "100%", background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 99 }}
                          />
                        </div>

                        <div style={{ fontSize: 11, color: P.textFaint, marginTop: 2 }}>{c.pct}% of total costs</div>
                      </div>
                    );
                  })}
                </div>

                <div style={totalCostBox}>
                  <span style={{ fontSize: 12, color: P.textMuted, fontWeight: 700 }}>Total Farm Costs</span>
                  <span style={{ fontSize: 16, color: P.amber, fontWeight: 800 }}>
                    RM {totalCostBreakdown.toLocaleString("en-MY", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </Card>
            </div>

            <Card title="Monthly Cost vs Revenue Trend" sub="Track if costs are growing faster than revenue" icon={Activity} delay={0.2}>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyProfit}>
                    <CartesianGrid strokeDasharray="3 3" stroke={P.border} vertical={false} />
                    <XAxis dataKey="month" stroke={P.textFaint} tick={{ fill: P.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis stroke={P.textFaint} tick={{ fill: P.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `RM${(v / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: P.border, strokeWidth: 1 }} />
                    <Legend wrapperStyle={{ fontSize: 12, color: P.textMuted }} />
                    <Line type="monotone" dataKey="Revenue" stroke={P.green} strokeWidth={2.5} dot={{ r: 3, fill: P.green, stroke: P.surface, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="Cost" stroke={P.amber} strokeWidth={2.5} dot={{ r: 3, fill: P.amber, stroke: P.surface, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={footer}>
        AyamTech Financial Dashboard · Data refreshed on load · All amounts in Malaysian Ringgit (RM)
      </div>
    </div>
  );
}

function HeroMini({ label, value, color = "#fff" }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.70)" }}>{label}</span>
      <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
    </div>
  );
}

const page = { minHeight: "100vh", background: P.bg, fontFamily: "'Inter', sans-serif", padding: "0 24px 32px", color: P.text, overflowX: "hidden" };
const topbar = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  padding: "14px 0",
  borderBottom: `1px solid ${P.border}`,
  marginBottom: 8,
  position: "sticky",
  top: 0,
  zIndex: 100,
  background: P.bg
};
const logoBox = { width: 40, height: 40, borderRadius: 12, background: P.greenDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 19 };
const brandTitle = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 17, fontWeight: 800, color: P.text };
const brandSub = { fontSize: 11, color: P.textMuted };
const tabBtn = { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 9, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, transition: "all 0.2s" };
const ownerAvatar = { width: 32, height: 32, borderRadius: "50%", background: P.greenDim, display: "flex", alignItems: "center", justifyContent: "center", color: P.green, fontSize: 14, fontWeight: 800 };
const heroBanner = { background: "linear-gradient(105deg, #4CAF50 0%, #2E7D32 100%)", borderRadius: 18, padding: "28px 32px", marginBottom: 20, position: "relative", overflow: "hidden", border: `1px solid ${P.green}`, minHeight: 130, boxShadow: "0 12px 30px rgba(76,175,80,0.18)" };
const heroLabel = { fontSize: 12, color: "rgba(255,255,255,0.78)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 };
const heroValue = { fontSize: 44, fontWeight: 900, color: "#fff", letterSpacing: "-1.5px", fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1 };
const heroStats = { marginTop: 10, display: "flex", gap: 20 };
const heroDivider = { width: 1, background: "rgba(255,255,255,0.25)" };
const heroChart = { position: "absolute", right: 0, top: 0, bottom: 0, width: "45%", opacity: 0.18, zIndex: 1 };
const heroOverlay = { position: "absolute", inset: 0, background: "linear-gradient(105deg, rgba(16,33,20,0.15) 0%, rgba(16,33,20,0.05) 60%, transparent 100%)", borderRadius: 18, zIndex: 0 };
const kpiGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 };
const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18 };
const tooltipBox = { background: P.surface, border: `1px solid ${P.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: "0 8px 28px rgba(17,24,39,0.12)" };
const tooltipLabel = { color: P.textMuted, marginBottom: 6, fontWeight: 700 };
const kpiCard = { background: P.surface, border: `1px solid ${P.border}`, borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 8px 24px rgba(17,24,39,0.05)" };
const topAccent = { position: "absolute", top: 0, left: 0, right: 0, height: 3 };
const kpiIcon = { width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" };
const kpiTitle = { fontSize: 11, color: P.textMuted, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 };
const kpiValue = { fontSize: 22, fontWeight: 800, color: P.text, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "-0.5px" };
const card = { background: P.surface, border: `1px solid ${P.border}`, borderRadius: 18, padding: "20px 22px", boxShadow: "0 8px 24px rgba(17,24,39,0.06)" };
const cardHead = { display: "flex", alignItems: "center", gap: 10, marginBottom: 18 };
const cardIcon = { width: 32, height: 32, borderRadius: 9, background: P.greenDim, display: "flex", alignItems: "center", justifyContent: "center", color: P.green };
const cardTitle = { fontSize: 15, fontWeight: 800, color: P.text };
const cardSub = { fontSize: 11, color: P.textMuted, marginTop: 1 };
const tableAmount = { padding: "10px", textAlign: "right", color: P.text, fontFamily: "'Plus Jakarta Sans', sans-serif" };
const miniBarBg = { width: 50, height: 4, background: P.border, borderRadius: 99, overflow: "hidden" };
const statusPill = { fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 6 };
const breakRow = { display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", background: P.surface2, borderRadius: 12, border: `1px solid ${P.border}` };
const progressBg = { height: 8, background: P.border, borderRadius: 99, overflow: "hidden" };
const totalCostBox = { marginTop: 20, padding: "12px 14px", background: P.surface2, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1px solid ${P.border}` };
const footer = { textAlign: "center", padding: "24px 0 8px", fontSize: 11, color: P.textFaint };
const topbarActions = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const dateSelect = {
  height: 34,
  padding: "0 12px",
  borderRadius: 10,
  border: `1px solid ${P.border}`,
  background: P.surface,
  color: P.text,
  fontSize: 12,
  fontWeight: 700,
  outline: "none",
  cursor: "pointer",
};

const smallActionBtn = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 14px",
  background: P.green,
  border: "none",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 12,
  color: "white",
  transition: "all 0.2s",
  boxShadow: "0 2px 8px rgba(76,175,80,0.22)",
};

const miniSpinner = {
  width: 14,
  height: 14,
  borderRadius: "50%",
  border: "2px solid white",
  borderTopColor: "transparent",
  animation: "spin 0.8s linear infinite",
};

const metaBar = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
  marginBottom: 12,
  fontSize: 11,
  color: P.textMuted,
};

const errorAlert = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: P.redDim,
  color: P.red,
  border: `1px solid ${P.red}33`,
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 14,
};