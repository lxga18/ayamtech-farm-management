import { useMemo, useState, useEffect } from "react";
import API from "../api/axios";
import { motion } from "framer-motion";
import { ShoppingCart, Truck, Store, CalendarDays, PackageCheck, MapPin, CheckCircle, RefreshCw, Clock, Calendar, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Toggle({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{ width: 52, height: 28, borderRadius: 999, border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 3, position: "relative", background: on ? "#4CAF50" : "#D1E8C8", transition: "background 0.3s ease" }}>
      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", position: "absolute", left: 3, transform: on ? "translateX(24px)" : "translateX(0px)", transition: "transform 0.3s cubic-bezier(.34,1.56,.64,1)" }} />
    </button>
  );
}

function CustomerPlaceOrder() {
  const customerId = sessionStorage.getItem("customer_id") || "CUS001";

  const [selectedBatch, setSelectedBatch] = useState("");
  const [quantity, setQuantity] = useState(50);
  const [deliveryType, setDeliveryType] = useState("Delivery");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [defaultAddress, setDefaultAddress] = useState("");

  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState("Monthly");
  const [duration, setDuration] = useState("1");
  const [startDate, setStartDate] = useState("");

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const today = new Date();
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 2);

  const formatInputDate = (d) => d.toISOString().split("T")[0];
  const minDate = formatInputDate(today);
  const maxAllowedDate = formatInputDate(maxDate);
  const navigate = useNavigate();

  useEffect(() => {
    API.get(`/customer/place-order-data/${customerId}`)
      .then((res) => {
        const batchList = res.data.batches || [];
        const cust = res.data.customer;

        setBatches(batchList);

        if (batchList.length > 0) {
          setSelectedBatch(batchList[0].batch_id);
        }

        const addr = `${cust?.address || ""}${cust?.area ? ", " + cust.area : ""}`;
        setDefaultAddress(addr);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load order data.");
        setLoading(false);
      });
  }, [customerId]);

  const batch = batches.find((b) => b.batch_id === selectedBatch) || batches[0];
  const availableStock = Number(batch?.available_stock || 0);

  const estimatedOrders = useMemo(() => {
    if (!recurring) return 1;
    const months = Number(duration);
    return frequency === "Monthly" ? months : months * 4;
  }, [frequency, duration, recurring]);

  const recurringDates = useMemo(() => {
    const baseDate = startDate || deliveryDate;
    if (!baseDate || !recurring) return [];

    let dates = [];
    let current = new Date(baseDate);

    for (let i = 0; i < estimatedOrders; i++) {
      dates.push(formatInputDate(current));
      if (frequency === "Weekly") current.setDate(current.getDate() + 7);
      else current.setMonth(current.getMonth() + 1);
    }

    return dates;
  }, [startDate, deliveryDate, frequency, estimatedOrders, recurring]);

  const summary = useMemo(() => {
    if (!batch) return { totalWeight: 0, subtotal: 0, deliveryFee: 0, total: 0 };

    const totalWeight = Number(quantity || 0) * Number(batch.avg_weight_kg || 0);
    const subtotal = totalWeight * Number(batch.price_per_kg || 0);
    const deliveryFee = deliveryType === "Delivery" ? 25 : 0;
    const total = subtotal + deliveryFee;

    return { totalWeight, subtotal, deliveryFee, total };
  }, [quantity, batch, deliveryType]);

  const handleQuantityChange = (value) => {
    const q = Number(value);
    setQuantity(q);

    if (q > availableStock) setError(`Cannot choose more than available stock. Available stock is ${availableStock} chickens.`);
    else if (q < 1) setError("Quantity must be at least 1 chicken.");
    else setError("");
  };

  const submitOrder = async () => {
    setError("");
    setSuccess("");

    if (!batch) return setError("Please select a batch.");
    if (!deliveryDate) return setError("Please select preferred delivery date.");
    if (Number(quantity) > availableStock) return setError(`Cannot choose more than available stock. Available stock is ${availableStock} chickens.`);
    if (Number(quantity) < 1) return setError("Quantity must be at least 1 chicken.");

    try {
      const res = await API.post("/customer/orders", {
        customer_id: customerId,
        batch_id: selectedBatch,
        quantity: Number(quantity),
        delivery_type: deliveryType,
        start_date: recurring ? startDate || deliveryDate : deliveryDate,
        is_recurring: recurring,
        recurring_frequency: recurring ? frequency : null,
        recurring_duration_months: recurring ? Number(duration) : null,
      });

      setSuccess(`${res.data.orders?.length || 1} order(s) submitted successfully.`);
      setShowSuccessPopup(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit order.");
    }
  };

  if (loading) return <div style={page}>Loading order data...</div>;
  if (!batch) return <div style={page}>No ready batch available.</div>;

  return (
    <div style={page}>
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        <div style={header}>
          <div>
            <div style={title}>Place Order</div>
            <div style={subtitle}>Select live chicken batch, quantity and delivery preference.</div>
          </div>
          <div style={orderBadge}>
            <ShoppingCart size={18} />
            New Order
          </div>
        </div>

        {error && <div style={errorBox}>{error}</div>}
        {success && <div style={successBox}>{success}</div>}

        <div style={layout}>
          <div>
            <div style={card}>
              <div style={stepTitle}>1. Choose Preferred Batch</div>
              <div style={sectionSub}>
                 For recurring orders, this batch is used as the preferred batch. Owner will confirm stock during approval.</div>

              <div style={batchGrid}>
                {batches.map((b) => {
                  const active = selectedBatch === b.batch_id;
                  return (
                    <button key={b.batch_id} onClick={() => setSelectedBatch(b.batch_id)} style={{ ...batchCard, border: active ? "2px solid #4CAF50" : "1px solid #E5EDE0", background: active ? "#EAF7E3" : "#F9FCF6" }}>
                      <div style={batchTop}>
                        <div style={chickenIcon}>🐔</div>
                        {active && <CheckCircle size={20} color="#4CAF50" />}
                      </div>
                      <div style={batchName}>{b.batch_id}</div>
                      <div style={batchSub}>{b.notes}</div>
                      <div style={miniInfo}><span>Avg Weight</span><b>{Number(b.avg_weight_kg).toFixed(1)} kg</b></div>
                      <div style={miniInfo}><span>Price</span><b>RM {Number(b.price_per_kg).toFixed(2)}/kg</b></div>
                      <div style={miniInfo}><span>Stock</span><b>{Number(b.available_stock)} chickens</b></div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={card}>
              <div style={stepTitle}>2. Order Quantity</div>
              <div style={sectionSub}>Enter the number of live chickens needed</div>

              <div style={quantityBox}>
                <button style={qtyButton} onClick={() => handleQuantityChange(Math.max(1, Number(quantity) - 10))}>-</button>
                <div style={qtyCenter}>
                  <input
                  type="text"  inputMode="numeric"  value={quantity}  onChange={(e) => { 
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      handleQuantityChange(value);
                  }} 
                    onKeyDown={(e) => {
                      if (
                        e.key === "-" ||
                        e.key === "+" ||
                        e.key === "e" ||
                        e.key === "."
                      ) {
                        e.preventDefault();
                  } 
                    }}
                    style={qtyInput}
                  />
                  <div style={qtyLabel}>chickens</div>
                </div>
                <button style={qtyButton} onClick={() => handleQuantityChange(Math.min(availableStock, Number(quantity) + 10))}>+</button>
              </div>

              <div style={{ ...stockNote, color: Number(quantity) > availableStock ? "#DC2626" : "#6E8A72", fontWeight: Number(quantity) > availableStock ? 800 : 400 }}>
                Available stock: <b>{availableStock} chickens</b>
                {Number(quantity) > availableStock && " — cannot choose more than stock"}
              </div>
            </div>

            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={stepTitle}>3. Recurring Order</div>
                  <div style={sectionSub}>Repeat this order weekly or monthly</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: recurring ? "#3A7D1C" : "#9AA89B" }}>
                    {recurring ? "Active" : "Off"}
                  </span>
                  <Toggle on={recurring} onToggle={() => setRecurring((r) => !r)} />
                </div>
              </div>

              <div onClick={() => setRecurring((r) => !r)} style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 14, background: recurring ? "#EAF7E3" : "#F9FCF6", border: recurring ? "1px solid #C3E6B5" : "1px solid #E5EDE0", cursor: "pointer" }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: recurring ? "#D0F0C0" : "#EEF4EB", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <RefreshCw size={18} color={recurring ? "#3A7D1C" : "#9AA89B"} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: recurring ? "#102114" : "#6E8A72" }}>
                    Repeat this order {frequency === "Weekly" ? "weekly" : "monthly"}
                  </div>
                  <div style={{ fontSize: 12, color: "#9AA89B", marginTop: 2 }}>Same quantity · Future orders are scheduled · Owner confirms stock before approval</div>
                </div>
              </div>

              {recurring && (
                <div style={{ marginTop: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 16 }}>
                    <div>
                      <label style={recurringLabel}><RefreshCw size={12} color="#70836B" />Frequency</label>
                      <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={selectInput}>
                        <option>Monthly</option>
                        <option>Weekly</option>
                      </select>
                    </div>

                    <div>
                      <label style={recurringLabel}><Clock size={12} color="#70836B" />Duration</label>
                      <select value={duration} onChange={(e) => setDuration(e.target.value)} style={selectInput}>
                        <option value="1">1 month</option>
                        <option value="2">2 months</option>
                        <option value="3">3 months</option>
                      </select>
                    </div>

                    <div>
                      <label style={recurringLabel}><Calendar size={12} color="#70836B" />Start Date</label>
                      <div style={inputIconBox}>
                        <input type="date" min={minDate} max={maxAllowedDate} value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputClean} />
                      </div>
                    </div>
                  </div>

                  <div style={previewBox}>
                    <div style={previewIcon}><Zap size={20} color="#3A7D1C" /></div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#102114", marginBottom: 3 }}>{estimatedOrders} auto-generated {frequency.toLowerCase()} orders</div>
                      <div style={{ fontSize: 12, color: "#4E7A3A", lineHeight: 1.5 }}>
                        Preview dates: <b>{recurringDates.length ? recurringDates.join(" → ") : "Choose start date"}</b>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={card}>
              <div style={stepTitle}>4. Delivery Preference</div>
              <div style={sectionSub}>Choose delivery or self-pickup</div>

              <div style={deliveryGrid}>
                <button onClick={() => setDeliveryType("Delivery")} style={{ ...deliveryOption, border: deliveryType === "Delivery" ? "2px solid #4CAF50" : "1px solid #E5EDE0", background: deliveryType === "Delivery" ? "#EAF7E3" : "#fff" }}>
                  <Truck size={24} color="#4CAF50" />
                  <b>Delivery</b>
                  <span>Farm sends to your address</span>
                </button>

                <button onClick={() => setDeliveryType("Pickup")} style={{ ...deliveryOption, border: deliveryType === "Pickup" ? "2px solid #4CAF50" : "1px solid #E5EDE0", background: deliveryType === "Pickup" ? "#EAF7E3" : "#fff" }}>
                  <Store size={24} color="#4CAF50" />
                  <b>Pickup</b>
                  <span>Collect directly from farm</span>
                </button>
              </div>

              <div style={formGrid}>
                <div>
                  <label style={label}>Preferred Date</label>
                  <div style={inputIconBox}>
                    <CalendarDays size={16} color="#6E8A72" />
                    <input type="date" min={minDate} max={maxAllowedDate} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} style={inputClean} />
                  </div>
                  <div style={{ fontSize: 11, color: "#9AA89B", marginTop: 6 }}>Can order prior up to 2 months only</div>
                </div>

                <div>
                  <label style={label}>Address / Notes</label>
                <div style={inputIconBox}>
                <MapPin size={16} color="#6E8A72" />
                <input
                  value={deliveryType === "Pickup" ? "Self pickup at farm" : defaultAddress}
                  disabled
                  style={inputClean}
                />
              </div>
                </div>
              </div>
            </div>
          </div>

          <div style={summaryCard}>
            <div style={summaryTop}>
              <div style={summaryIcon}><PackageCheck size={24} color="#4CAF50" /></div>
              <div>
                <div style={summaryTitle}>Order Summary</div>
                <div style={sectionSub}>Live calculation</div>
              </div>
            </div>

            <div style={summaryBatch}>
              <div>
                <div style={{ fontWeight: 800, color: "#102114" }}>{batch.batch_id}</div>
                <div style={{ fontSize: "12px", color: "#6E8A72" }}>{batch.notes}</div>
              </div>
              <span style={gradeBadge}>Stock {availableStock}</span>
            </div>

            <div style={summaryRows}>
              <div style={summaryRow}><span>Quantity</span><b>{quantity} chickens</b></div>
              <div style={summaryRow}><span>Estimated Weight</span><b>{summary.totalWeight.toFixed(1)} kg</b></div>
              <div style={summaryRow}><span>Price / kg</span><b>RM {Number(batch.price_per_kg).toFixed(2)}</b></div>
              <div style={summaryRow}><span>Subtotal</span><b>RM {summary.subtotal.toFixed(2)}</b></div>
              <div style={summaryRow}><span>Delivery Fee</span><b>RM {summary.deliveryFee.toFixed(2)}</b></div>
            </div>

            {recurring && (
              <div style={{ background: "#EAF7E3", borderRadius: 16, padding: 14, border: "1px solid #C3E6B5", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#3A7D1C", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Recurring Details</div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ ...summaryRow, fontSize: 13 }}><span>Frequency</span><b>{frequency}</b></div>
                  <div style={{ ...summaryRow, fontSize: 13 }}><span>Duration</span><b>{duration} month(s)</b></div>
                  <div style={{ ...summaryRow, fontSize: 13 }}><span>Generated Orders</span><b>{estimatedOrders} orders</b></div>
                </div>
              </div>
            )}

            <div style={totalBox}>
              <span>Total Amount</span>
              <b>RM {summary.total.toFixed(2)}</b>
            </div>

            <button onClick={submitOrder} style={submitButton}>Submit Order</button>
            <div style={smallNote}>Your order will be sent to the farm owner for approval.</div>
            {showSuccessPopup && (
            <div style={popupBackdrop}>
            <div style={popupBox}>
            <div style={popupIcon}>✓</div>
            <div style={popupTitle}>Order Submitted Successfully</div>
            <div style={popupText}>
            Your order has been sent to the farm owner for approval.
            </div>

          <div style={popupActions}>
          <button
          style={popupCloseBtn}
          onClick={() => {
            setShowSuccessPopup(false);
            window.location.reload();
          }}
        >
          Close
        </button>

        <button
          style={popupViewBtn}
          onClick={() => navigate("/customer/orders")}
        >
          See Order
        </button>
      </div>
    </div>
  </div>
)}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

const page={padding:"32px",background:"#F6F8F3",minHeight:"100vh",fontFamily:"'Inter', sans-serif"};
const header={display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"28px"};
const title={fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:"30px",fontWeight:800,color:"#102114"};
const subtitle={color:"#6E8A72",fontSize:"14px",marginTop:"4px"};
const orderBadge={height:"42px",padding:"0 16px",borderRadius:"14px",background:"#EAF7E3",color:"#3A7D1C",fontWeight:800,display:"flex",alignItems:"center",gap:"8px"};
const layout={display:"grid",gridTemplateColumns:"1.4fr 0.8fr",gap:"22px",alignItems:"start"};
const card={background:"#fff",borderRadius:"22px",padding:"22px",boxShadow:"0 10px 30px rgba(17,24,39,0.05)",marginBottom:"20px"};
const stepTitle={fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:"20px",fontWeight:800,color:"#102114"};
const sectionSub={fontSize:"12px",color:"#6E8A72",marginTop:"4px"};
const batchGrid={display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:"14px",marginTop:"18px"};
const batchCard={borderRadius:"18px",padding:"16px",cursor:"pointer",textAlign:"left"};
const batchTop={display:"flex",justifyContent:"space-between",marginBottom:"12px"};
const chickenIcon={width:"44px",height:"44px",borderRadius:"14px",background:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px"};
const batchName={fontWeight:800,fontSize:"16px",color:"#102114"};
const batchSub={fontSize:"12px",color:"#6E8A72",marginBottom:"12px"};
const miniInfo={display:"flex",justifyContent:"space-between",fontSize:"12px",color:"#6E8A72",marginBottom:"6px"};
const quantityBox={marginTop:"20px",background:"#F9FCF6",borderRadius:"18px",padding:"18px",display:"flex",alignItems:"center",justifyContent:"center",gap:"18px"};
const qtyButton={width:"46px",height:"46px",borderRadius:"14px",border:"none",background:"#4CAF50",color:"#fff",fontSize:"24px",fontWeight:800,cursor:"pointer"};
const qtyCenter={textAlign:"center"};
const qtyInput={width:"120px",textAlign:"center",border:"none",background:"transparent",fontSize:"34px",fontWeight:800,color:"#102114",outline:"none"};
const qtyLabel={fontSize:"12px",color:"#6E8A72",fontWeight:700};
const stockNote={marginTop:"12px",fontSize:"13px",color:"#6E8A72"};
const recurringLabel={display:"flex",alignItems:"center",gap:"5px",fontSize:"12px",color:"#70836B",fontWeight:600,marginBottom:"8px",letterSpacing:"0.02em"};
const selectInput={width:"100%",height:"46px",border:"1px solid #DDE8D7",borderRadius:"12px",padding:"0 14px",fontSize:"14px",fontFamily:"'Inter', sans-serif",background:"#fff",color:"#102114",outline:"none",cursor:"pointer"};
const previewBox={background:"linear-gradient(135deg, #EAF7E3 0%, #D4F0C7 100%)",borderRadius:16,padding:"16px 18px",border:"1px solid #B8E0A8",display:"flex",alignItems:"center",gap:14};
const previewIcon={width:44,height:44,borderRadius:13,background:"rgba(255,255,255,0.7)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0};
const deliveryGrid={display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginTop:"18px"};
const deliveryOption={borderRadius:"18px",padding:"18px",cursor:"pointer",display:"flex",flexDirection:"column",gap:"6px",textAlign:"left",color:"#102114"};
const formGrid={display:"grid",gridTemplateColumns:"1fr 1fr",gap:"14px",marginTop:"18px"};
const label={display:"block",fontSize:"12px",color:"#70836B",marginBottom:"8px"};
const inputIconBox={height:"46px",border:"1px solid #DDE8D7",borderRadius:"12px",padding:"0 14px",display:"flex",alignItems:"center",gap:"8px"};
const inputClean={border:"none",outline:"none",background:"transparent",width:"100%",fontSize:"14px"};
const summaryCard={background:"#fff",borderRadius:"24px",padding:"24px",boxShadow:"0 14px 40px rgba(17,24,39,0.08)",position:"sticky",top:"24px"};
const summaryTop={display:"flex",alignItems:"center",gap:"12px",marginBottom:"20px"};
const summaryIcon={width:"50px",height:"50px",borderRadius:"16px",background:"#EAF7E3",display:"flex",alignItems:"center",justifyContent:"center"};
const summaryTitle={fontSize:"20px",fontWeight:800,color:"#102114"};
const summaryBatch={background:"#F9FCF6",borderRadius:"16px",padding:"14px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"18px"};
const gradeBadge={padding:"5px 10px",borderRadius:"999px",background:"#EAF7E3",color:"#3A7D1C",fontSize:"12px",fontWeight:800};
const summaryRows={display:"grid",gap:"12px",marginBottom:"18px"};
const summaryRow={display:"flex",justifyContent:"space-between",fontSize:"14px",color:"#6E8A72"};
const totalBox={background:"#102114",color:"#fff",borderRadius:"18px",padding:"18px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"};
const submitButton={width:"100%",height:"48px",borderRadius:"14px",border:"none",background:"#4CAF50",color:"#fff",fontWeight:800,fontSize:"15px",cursor:"pointer"};
const smallNote={marginTop:"12px",fontSize:"12px",color:"#9AA89B",textAlign:"center"};
const errorBox={background:"#FEE2E2",color:"#B91C1C",padding:"12px",borderRadius:"12px",marginBottom:"16px",fontWeight:700};
const successBox={background:"#EAF7E3",color:"#3A7D1C",padding:"12px",borderRadius:"12px",marginBottom:"16px",fontWeight:700};
const popupBackdrop={position:"fixed",inset:0,background:"rgba(16,33,20,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999};
const popupBox={width:"420px",background:"#fff",borderRadius:"24px",padding:"28px",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.18)"};
const popupIcon={width:"58px",height:"58px",borderRadius:"50%",background:"#EAF7E3",color:"#3A7D1C",fontSize:"32px",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 14px"};
const popupTitle={fontSize:"20px",fontWeight:800,color:"#102114",marginBottom:"8px"};
const popupText={fontSize:"13px",color:"#6E8A72",lineHeight:1.5,marginBottom:"22px"};
const popupActions={display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"};
const popupCloseBtn={height:"44px",borderRadius:"12px",border:"1px solid #DDE8D7",background:"#F9FCF6",color:"#244128",fontWeight:800,cursor:"pointer"};
const popupViewBtn={height:"44px",borderRadius:"12px",border:"none",background:"#4CAF50",color:"#fff",fontWeight:800,cursor:"pointer"};
export default CustomerPlaceOrder;