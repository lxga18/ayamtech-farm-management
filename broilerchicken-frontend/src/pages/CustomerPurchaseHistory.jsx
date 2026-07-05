import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import jsPDF from "jspdf";
import API from "../api/axios";
import {
  Search, Filter, Download, Printer, Eye, X, Calendar,
  TrendingUp, Package, Weight, CreditCard, ChevronDown,
  ShoppingBag
} from "lucide-react";

const methodStyle = {
  Card: { bg: "#F0EDFF", color: "#5B21B6", dot: "#8B5CF6" },
  GrabPay: { bg: "#EAF7E3", color: "#3A7D1C", dot: "#4CAF50" },
  FPX: { bg: "#EFF6FF", color: "#1D4E89", dot: "#3B82F6" },
};

export default function CustomerPurchaseHistory() {
  const customerId = sessionStorage.getItem("customer_id");

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatch] = useState("All");
  const [methodFilter, setMethod] = useState("All");
  const [activeTab, setActiveTab] = useState("table");
  const [receiptOrder, setReceipt] = useState(null);
  const [expandedMonth, setExpanded] = useState(null);

  useEffect(() => {
    API.get(`/customer/purchase-history/${customerId}`)
      .then((res) => {
        const mapped = res.data.map((p) => ({
          id: p.order_id,
          date: p.order_date,
          batch: p.batch_id,
          quantity: Number(p.requested_quantity),
          weight: Number(p.requested_quantity) * Number(p.avg_weight_kg || 0),
          priceKg: Number(p.price_per_kg || 0),
          chickenAmount: Number(p.chicken_amount || 0),
          deliveryFee: Number(p.delivery_fee || 0),
          total: Number(p.total_amount || 0),
          method: p.payment_method || "-",
          receipt: p.payment_id || `RCP-${p.order_id}`,
          deliveryType: p.delivery_type,
        }));

        setPurchases(mapped);
        if (mapped.length > 0) {
          setExpanded(getMonthLabel(mapped[0].date));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Purchase history error:", err);
        setLoading(false);
      });
  }, [customerId]);

  const monthlyMap = useMemo(() => {
    const map = {};
    purchases.forEach((p) => {
      const month = getMonthLabel(p.date);
      if (!map[month]) map[month] = [];
      map[month].push(p);
    });
    return map;
  }, [purchases]);

  const months = Object.keys(monthlyMap);

  const kpi = useMemo(() => {
    const total = purchases.length;
    const spent = purchases.reduce((s, p) => s + p.total, 0);
    const chickens = purchases.reduce((s, p) => s + p.quantity, 0);
    const weight = purchases.reduce((s, p) => s + p.weight, 0);
    const last = purchases[0]?.date || "-";
    return { total, spent, chickens, weight, last };
  }, [purchases]);

  const filtered = useMemo(() => purchases.filter((p) => {
    const s = search.toLowerCase();
    return (
      (p.id.toLowerCase().includes(s) || p.batch.toLowerCase().includes(s)) &&
      (batchFilter === "All" || p.batch === batchFilter) &&
      (methodFilter === "All" || p.method === methodFilter)
    );
  }), [purchases, search, batchFilter, methodFilter]);

  const batches = [...new Set(purchases.map((p) => p.batch))];
  const methods = [...new Set(purchases.map((p) => p.method))];
  const maxMonthSpend = Math.max(1, ...Object.values(monthlyMap).map((arr) => arr.reduce((s, p) => s + p.total, 0)));

  const printInvoice = () => window.print();

  const downloadPDF = (p) => {
    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("AyamTech Invoice", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.text(`Receipt ID: ${p.receipt}`, 20, 35);
    doc.text(`Order ID: ${p.id}`, 20, 45);
    doc.text(`Date: ${p.date}`, 20, 55);
    doc.text(`Batch: ${p.batch}`, 20, 65);
    doc.text(`Quantity: ${p.quantity} chickens`, 20, 75);
    doc.text(`Weight: ${p.weight.toFixed(1)} kg`, 20, 85);
    doc.text(`Price/kg: RM ${p.priceKg.toFixed(2)}`, 20, 95);
    doc.text(`Payment Method: ${p.method}`, 20, 105);
    doc.text(`Delivery Type: ${p.deliveryType}`, 20, 115);

    doc.line(20, 125, 190, 125);

    doc.text(`Chicken Amount: RM ${p.chickenAmount.toFixed(2)}`, 20, 140);
    doc.text(`Delivery Fee: RM ${p.deliveryFee.toFixed(2)}`, 20, 150);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Grand Total: RM ${p.total.toFixed(2)}`, 20, 165);

    doc.save(`${p.id}_invoice.pdf`);
  };

  if (loading) {
    return <div style={page}>Loading purchase history...</div>;
  }

  return (
    <div style={page}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div style={header}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={headerIcon}>
              <ShoppingBag size={24} color="#4CAF50" />
            </div>
            <div>
              <div style={title}>Purchase History</div>
              <div style={subtitle}>Completed orders, invoices and payment records.</div>
            </div>
          </div>

          <div style={badge}>
            <TrendingUp size={15} color="#4CAF50" />
            {purchases.length} completed orders
          </div>
        </div>

        <div style={kpiGrid}>
          {[
            { label: "Total Purchases", value: kpi.total, accent: "#3B82F6", bg: "#EFF6FF", icon: <Package size={17} color="#3B82F6" /> },
            { label: "Total Spent", value: `RM ${kpi.spent.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, accent: "#4CAF50", bg: "#EAF7E3", icon: <CreditCard size={17} color="#4CAF50" /> },
            { label: "Chickens Bought", value: kpi.chickens.toLocaleString(), accent: "#F59E0B", bg: "#FFF8EC", icon: <span>🐔</span> },
            { label: "Total Weight", value: `${kpi.weight.toFixed(1)} kg`, accent: "#8B5CF6", bg: "#F0EDFF", icon: <Weight size={17} color="#8B5CF6" /> },
            { label: "Last Purchase", value: kpi.last, accent: "#EC4899", bg: "#FDF2F8", icon: <Calendar size={17} color="#EC4899" /> },
          ].map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} style={{ ...kpiCard, borderTop: `3px solid ${c.accent}` }}>
              <div style={kpiTop}>
                <span style={kpiLabel}>{c.label}</span>
                <div style={{ ...kpiIcon, background: c.bg }}>{c.icon}</div>
              </div>
              <div style={kpiValue}>{c.value}</div>
            </motion.div>
          ))}
        </div>

        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {[
            ["table", "📋 History Table"],
            ["monthly", "📅 Monthly Summary"],
          ].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={tabBtn(activeTab === tab)}>
              {label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "table" && (
            <motion.div key="table" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={filterCard}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "12px", alignItems: "end" }}>
                  <div style={searchBox}>
                    <Search size={15} color="#6E8A72" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order ID or batch..." style={searchInput} />
                  </div>

                  <select value={batchFilter} onChange={(e) => setBatch(e.target.value)} style={sel}>
                    <option value="All">All Batches</option>
                    {batches.map((b) => <option key={b}>{b}</option>)}
                  </select>

                  <select value={methodFilter} onChange={(e) => setMethod(e.target.value)} style={sel}>
                    <option value="All">All Methods</option>
                    {methods.map((m) => <option key={m}>{m}</option>)}
                  </select>

                  <button onClick={() => { setSearch(""); setBatch("All"); setMethod("All"); }} style={resetBtn}>
                    <Filter size={14} /> Reset
                  </button>
                </div>
              </div>

              <div style={tableCard}>
                <div style={tableHeader}>
                  <div style={sectionTitle}>Completed Purchase Records</div>
                  <span style={{ fontSize: "12px", color: "#9AA89B" }}>{filtered.length} record(s)</span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "1100px", fontFamily: "'Inter', sans-serif" }}>
                    <thead>
                      <tr>
                        {["Order ID", "Date", "Batch", "Qty", "Weight", "Price/kg", "Delivery Fee", "Total", "Method", "Receipt", "Actions"].map((h) => (
                          <th key={h} style={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.map((p, i) => {
                        const ms = methodStyle[p.method] || { bg: "#F3F4F6", color: "#4B5563", dot: "#9CA3AF" };

                        return (
                          <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} style={{ borderBottom: "1px solid #F4F7F2" }}>
                            <td style={tdc}><b>{p.id}</b></td>
                            <td style={tdc}><span style={muted}>{p.date}</span></td>
                            <td style={tdc}><span style={pill}>{p.batch}</span></td>
                            <td style={tdc}><b>{p.quantity}</b></td>
                            <td style={tdc}>{p.weight.toFixed(1)} kg</td>
                            <td style={tdc}>RM {p.priceKg.toFixed(2)}</td>
                            <td style={tdc}>RM {p.deliveryFee.toFixed(2)}</td>
                            <td style={tdc}><b style={{ color: "#4CAF50" }}>RM {p.total.toFixed(2)}</b></td>
                            <td style={tdc}>
                              <span style={{ ...methodPill, background: ms.bg, color: ms.color }}>
                                <span style={{ ...dot, background: ms.dot }} />
                                {p.method}
                              </span>
                            </td>
                            <td style={tdc}><span style={muted}>{p.receipt}</span></td>
                            <td style={tdc}>
                              <div style={{ display: "flex", gap: "5px" }}>
                                <button onClick={() => setReceipt(p)} title="View Invoice" style={actionBtn("#EAF7E3", "#3A7D1C")}><Eye size={13} /></button>
                                <button onClick={() => downloadPDF(p)} title="Download PDF" style={actionBtn("#EFF6FF", "#1D4E89")}><Download size={13} /></button>
                                <button onClick={() => { setReceipt(p); setTimeout(printInvoice, 200); }} title="Print" style={actionBtn("#F0EDFF", "#5B21B6")}><Printer size={13} /></button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {filtered.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px", color: "#6E8A72" }}>
                      No completed purchase records found.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "monthly" && (
            <motion.div key="monthly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {months.length === 0 ? (
                <div style={emptyCard}>No completed purchases yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {months.map((month, mi) => {
                    const orders = monthlyMap[month];
                    const spent = orders.reduce((s, p) => s + p.total, 0);
                    const qty = orders.reduce((s, p) => s + p.quantity, 0);
                    const weight = orders.reduce((s, p) => s + p.weight, 0);
                    const barPct = Math.round((spent / maxMonthSpend) * 100);
                    const isOpen = expandedMonth === month;

                    return (
                      <motion.div key={month} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: mi * 0.08 }} style={monthCard(isOpen)}>
                        <button onClick={() => setExpanded(isOpen ? null : month)} style={monthHeader}>
                          <div style={monthCircle(isOpen)}>
                            <div style={{ fontSize: "9px", fontWeight: 700 }}>{month.split(" ")[0].slice(0, 3).toUpperCase()}</div>
                            <div style={{ fontSize: "16px", fontWeight: 800 }}>{month.split(" ")[1]}</div>
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={monthTop}>
                              <span style={sectionTitle}>{month}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                <span style={muted}>{orders.length} orders</span>
                                <b style={{ color: "#4CAF50" }}>RM {spent.toFixed(2)}</b>
                              </div>
                            </div>

                            <div style={barBg}>
                              <motion.div initial={{ width: 0 }} animate={{ width: `${barPct}%` }} transition={{ duration: 0.9 }} style={barFill} />
                            </div>
                          </div>

                          <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
                            <ChevronDown size={20} color="#9AA89B" />
                          </motion.div>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                              <div style={monthStats}>
                                {[
                                  ["🐔 Chickens Bought", qty.toLocaleString()],
                                  ["⚖️ Total Weight", `${weight.toFixed(1)} kg`],
                                  ["📦 Avg Order", `RM ${(spent / orders.length).toFixed(2)}`],
                                ].map(([label, value]) => (
                                  <div key={label} style={miniStat}>
                                    <div style={muted}>{label}</div>
                                    <b>{value}</b>
                                  </div>
                                ))}
                              </div>

                              <div style={monthList}>
                                {orders.map((p) => (
                                  <div key={p.id} style={monthOrderRow}>
                                    <div style={monthOrderIcon}>📦</div>
                                    <div style={{ flex: 1 }}>
                                      <b>{p.id}</b>
                                      <div style={muted}>{p.date} · {p.batch} · {p.quantity} chickens · {p.weight.toFixed(1)} kg</div>
                                    </div>
                                    <b style={{ color: "#4CAF50" }}>RM {p.total.toFixed(2)}</b>
                                    <button onClick={() => setReceipt(p)} style={actionBtn("#fff", "#4B5E4F")}><Eye size={13} /></button>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {receiptOrder && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReceipt(null)} style={modalBackdrop} />

            <motion.div style={modalWrap}>
              <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.96 }} style={receiptBox}>
                <div style={receiptHeader}>
                  <div>
                    <div style={receiptSmall}>OFFICIAL INVOICE</div>
                    <div style={receiptTitle}>{receiptOrder.receipt}</div>
                    <div style={receiptSub}>{receiptOrder.id} · {receiptOrder.date}</div>
                  </div>

                  <button onClick={() => setReceipt(null)} style={closeBtn}>
                    <X size={16} color="#86A882" />
                  </button>
                </div>

                <div style={zigzag} />

                <div style={{ padding: "16px 22px 20px" }}>
                  <div style={paidBox}>
                    <div style={paidIcon}>✓</div>
                    <div>
                      <b style={{ color: "#3A7D1C" }}>Payment Confirmed</b>
                      <div style={muted}>via {receiptOrder.method} · Batch {receiptOrder.batch}</div>
                    </div>
                  </div>

                  {[
                    ["Order ID", receiptOrder.id],
                    ["Batch", receiptOrder.batch],
                    ["Delivery Type", receiptOrder.deliveryType],
                    ["Quantity", `${receiptOrder.quantity} chickens`],
                    ["Total Weight", `${receiptOrder.weight.toFixed(1)} kg`],
                    ["Price / kg", `RM ${receiptOrder.priceKg.toFixed(2)}`],
                    ["Payment Method", receiptOrder.method],
                    ["Chicken Amount", `RM ${receiptOrder.chickenAmount.toFixed(2)}`],
                    ["Delivery Fee", `RM ${receiptOrder.deliveryFee.toFixed(2)}`],
                  ].map(([label, value]) => (
                    <div key={label} style={receiptRow}>
                      <span style={muted}>{label}</span>
                      <b>{value}</b>
                    </div>
                  ))}

                  <div style={grandTotal}>
                    <span>Grand Total</span>
                    <b>RM {receiptOrder.total.toFixed(2)}</b>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <button onClick={printInvoice} style={printBtn}>
                      <Printer size={15} /> Print Invoice
                    </button>
                    <button onClick={() => downloadPDF(receiptOrder)} style={downloadBtn}>
                      <Download size={15} /> Download PDF
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function getMonthLabel(dateStr) {
  const [year, month] = String(dateStr).split("-");
  const names = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return `${names[Number(month)]} ${year}`;
}

const page = { padding: "32px", background: "#F4F7F2", minHeight: "100vh", fontFamily: "'Inter', sans-serif" };
const header = { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" };
const headerIcon = { width: "48px", height: "48px", borderRadius: "15px", background: "#102114", display: "flex", alignItems: "center", justifyContent: "center" };
const title = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "28px", fontWeight: 800, color: "#102114" };
const subtitle = { color: "#6E8A72", fontSize: "13px", marginTop: "2px" };
const badge = { padding: "10px 18px", borderRadius: "12px", background: "#EAF7E3", border: "1px solid #C8E6C9", fontSize: "13px", fontWeight: 700, color: "#3A7D1C", display: "flex", alignItems: "center", gap: "6px" };
const kpiGrid = { display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px", marginBottom: "24px" };
const kpiCard = { background: "#fff", borderRadius: "20px", padding: "18px", boxShadow: "0 8px 24px rgba(17,24,39,0.05)" };
const kpiTop = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" };
const kpiLabel = { fontSize: "11px", color: "#70836B", fontWeight: 600 };
const kpiIcon = { width: "30px", height: "30px", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" };
const kpiValue = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "18px", fontWeight: 800, color: "#102114" };
const tabBtn = (active) => ({ padding: "10px 20px", borderRadius: "12px", border: active ? "none" : "1.5px solid #E5EDE0", background: active ? "#102114" : "#fff", color: active ? "#fff" : "#4B5E4F", fontWeight: 700, fontSize: "13px", cursor: "pointer" });
const filterCard = { background: "#fff", borderRadius: "18px", padding: "18px 20px", boxShadow: "0 6px 20px rgba(17,24,39,0.05)", marginBottom: "16px" };
const searchBox = { display: "flex", alignItems: "center", gap: "10px", height: "44px", border: "1.5px solid #DDE8D7", borderRadius: "12px", padding: "0 14px" };
const searchInput = { border: "none", outline: "none", background: "transparent", fontSize: "13px", width: "100%", color: "#102114" };
const sel = { height: "44px", border: "1.5px solid #DDE8D7", borderRadius: "12px", padding: "0 12px", fontSize: "13px", outline: "none", background: "#fff", color: "#102114" };
const resetBtn = { height: "44px", padding: "0 16px", borderRadius: "12px", border: "1.5px solid #E5EDE0", background: "#F9FCF6", color: "#244128", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" };
const tableCard = { background: "#fff", borderRadius: "22px", padding: "22px", boxShadow: "0 8px 24px rgba(17,24,39,0.06)" };
const tableHeader = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" };
const sectionTitle = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "17px", fontWeight: 800, color: "#102114" };
const th = { padding: "10px 12px", textAlign: "left", fontSize: "11px", color: "#9AA89B", fontWeight: 700, whiteSpace: "nowrap", background: "#F9FCF6", borderBottom: "1px solid #F0F4EC" };
const tdc = { padding: "13px 12px", verticalAlign: "middle", whiteSpace: "nowrap", fontSize: "13px", color: "#4B5E4F" };
const muted = { fontSize: "12px", color: "#9AA89B" };
const pill = { padding: "3px 9px", borderRadius: "999px", background: "#F4F7F2", color: "#4B5E4F", fontSize: "11px", fontWeight: 700 };
const methodPill = { padding: "3px 9px", borderRadius: "999px", fontSize: "11px", fontWeight: 700 };
const dot = { width: "6px", height: "6px", borderRadius: "50%", display: "inline-block", marginRight: "4px", verticalAlign: "middle" };
const actionBtn = (bg, color) => ({ width: "30px", height: "30px", borderRadius: "9px", border: "none", background: bg, color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" });
const emptyCard = { background: "#fff", borderRadius: "22px", padding: "40px", textAlign: "center", color: "#6E8A72" };
const monthCard = (open) => ({ background: "#fff", borderRadius: "22px", overflow: "hidden", boxShadow: "0 8px 24px rgba(17,24,39,0.06)", border: open ? "1.5px solid #4CAF5044" : "1.5px solid transparent" });
const monthHeader = { width: "100%", padding: "22px 26px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "18px" };
const monthCircle = (open) => ({ width: "52px", height: "52px", borderRadius: "16px", background: open ? "#102114" : "#F4F7F2", color: open ? "#fff" : "#102114", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 });
const monthTop = { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" };
const barBg = { height: "7px", background: "#F0F4EC", borderRadius: "99px" };
const barFill = { height: "100%", background: "#4CAF50", borderRadius: "99px" };
const monthStats = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", padding: "0 26px 18px" };
const miniStat = { background: "#F9FCF6", borderRadius: "14px", padding: "14px", textAlign: "center" };
const monthList = { borderTop: "1px solid #F4F7F2", padding: "16px 26px 22px", display: "flex", flexDirection: "column", gap: "8px" };
const monthOrderRow = { display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", borderRadius: "14px", background: "#F9FCF6", border: "1px solid #E5EDE0" };
const monthOrderIcon = { width: "36px", height: "36px", borderRadius: "10px", background: "#EAF7E3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 };
const modalBackdrop = { position: "fixed", inset: 0, background: "rgba(10,20,12,0.55)", zIndex: 100, backdropFilter: "blur(6px)" };
const modalWrap = { position: "fixed", inset: 0, zIndex: 101, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", pointerEvents: "none" };
const receiptBox = { width: "390px", maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", background: "#fff", borderRadius: "22px", boxShadow: "0 30px 80px rgba(10,20,12,0.28)", pointerEvents: "auto", fontFamily: "'Inter', sans-serif" };
const receiptHeader = { background: "#102114", padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" };
const receiptSmall = { fontSize: "9px", color: "#86A882", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "4px" };
const receiptTitle = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "21px", fontWeight: 800, color: "#fff" };
const receiptSub = { fontSize: "11px", color: "#86A882", marginTop: "2px" };
const closeBtn = { width: "36px", height: "36px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const zigzag = { height: "14px", backgroundImage: "radial-gradient(circle at 7px -1px, #F4F7F2 8px, #102114 8px)", backgroundSize: "14px 14px", backgroundRepeat: "repeat-x" };
const paidBox = { display: "flex", alignItems: "center", gap: "9px", padding: "9px 12px", background: "#EAF7E3", borderRadius: "11px", marginBottom: "14px", border: "1px solid #C8E6C9" };
const paidIcon = { width: "24px", height: "24px", borderRadius: "50%", background: "#4CAF50", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", flexShrink: 0 };
const receiptRow = { display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #F4F7F2", fontSize: "12px" };
const grandTotal = { marginTop: "12px", padding: "12px 14px", background: "#F4F7F2", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", color: "#4CAF50", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: "18px", fontWeight: 800 };
const printBtn = { height: "40px", borderRadius: "11px", border: "1.5px solid #E5EDE0", background: "#fff", color: "#102114", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" };
const downloadBtn = { height: "40px", borderRadius: "11px", border: "none", background: "#4CAF50", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" };