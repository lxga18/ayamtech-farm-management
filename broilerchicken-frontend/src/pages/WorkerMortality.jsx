import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/axios";
import {
  Heart, Package, ChevronDown, CalendarDays, CheckCircle2, AlertTriangle,
  Loader2, ClipboardList, RefreshCw, X, Info, Save, Search, Lightbulb, BarChart3
} from "lucide-react";

const C = {
  bg:"#F6F8F3", surface:"#FFFFFF", border:"#E5EDE0",
  green:"#4CAF50", greenDark:"#2E7D32", greenDim:"#EAF7E3",
  amber:"#F59E0B", amberDim:"#FFF8EC",
  red:"#EF4444", redDark:"#B91C1C", redDim:"#FEE2E2",
  blue:"#3B82F6", text:"#102114", textMid:"#6E8A72", textLight:"#9AA89B",
  sans:"'Plus Jakarta Sans', sans-serif", body:"'Inter', sans-serif",
};

const ease = [0.22, 1, 0.36, 1];
const fadeUp = (delay=0) => ({
  initial:{opacity:0,y:22},
  animate:{opacity:1,y:0},
  transition:{duration:.45,delay,ease}
});
const causes = ["Weak chicks", "Disease", "Heat stress", "Unknown", "Injury", "Other"];

function localDateInput(date = new Date()) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split("T")[0];
}
function n(value, digits = 0) {
  return Number(value || 0).toLocaleString("en-MY", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-MY", { day:"numeric", month:"short", year:"numeric" });
}
function formatLastMortality(value) {
  if (!value) return "No mortality recorded yet";
  const d = new Date(value);
  const today = new Date();
  const diff = Math.floor((today.setHours(0,0,0,0) - d.setHours(0,0,0,0)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff} days ago`;
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{opacity:0,y:-16,scale:.96}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-16,scale:.96}}
        style={{position:"fixed",top:86,right:28,zIndex:900,background:C.surface,border:`1.5px solid ${toast.type==="success"?C.green:C.red}40`,borderLeft:`5px solid ${toast.type==="success"?C.green:C.red}`,borderRadius:16,padding:"14px 18px",boxShadow:"0 18px 48px rgba(16,33,20,.18)",minWidth:330,display:"flex",alignItems:"center",gap:10,fontFamily:C.body}}>
        {toast.type==="success" ? <CheckCircle2 size={20} color={C.green}/> : <AlertTriangle size={20} color={C.red}/>}
        <div style={{flex:1,fontFamily:C.sans,fontWeight:800,fontSize:13,color:C.text}}>{toast.message}</div>
        <button onClick={onClose} style={{border:"none",background:"transparent",cursor:"pointer",display:"flex",color:C.textLight}}><X size={16}/></button>
      </motion.div>
    </AnimatePresence>
  );
}

function Section({ title, icon: Icon, children, right }) {
  return (
    <motion.section {...fadeUp(.06)} style={{background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:22,padding:20,boxShadow:"0 6px 24px rgba(16,33,20,.06)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{width:32,height:32,borderRadius:10,background:C.redDim,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon size={16} color={C.red}/>
          </div>
          <div style={{fontFamily:C.sans,fontWeight:900,fontSize:15,color:C.text}}>{title}</div>
        </div>
        {right}
      </div>
      {children}
    </motion.section>
  );
}

function Metric({ label, value, icon, color=C.text }) {
  return (
    <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 16px"}}>
      <div style={{fontFamily:C.sans,fontWeight:900,fontSize:18,color,marginBottom:4}}>{icon} {value}</div>
      <div style={{fontSize:11,color:C.textLight,textTransform:"uppercase",letterSpacing:".06em",fontWeight:700}}>{label}</div>
    </div>
  );
}

function QuickButton({ children, onClick, active=false }) {
  return (
    <motion.button whileHover={{y:-2}} whileTap={{scale:.96}} onClick={onClick} type="button"
      style={{border:`1.5px solid ${active?C.red:C.red+"30"}`,background:active?`${C.red}18`:C.surface,color:C.red,borderRadius:12,padding:"9px 12px",fontFamily:C.sans,fontWeight:800,fontSize:12,cursor:"pointer"}}>
      {children}
    </motion.button>
  );
}

const inputStyle = {
  width:"100%", height:52, border:`1.5px solid ${C.border}`, borderRadius:16,
  padding:"0 15px", fontFamily:C.body, fontSize:13, fontWeight:600, color:C.text, background:C.bg,
};

export default function WorkerMortality() {
  const location = useLocation();

  const [batches, setBatches] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [causeSummary, setCauseSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [quantityDead, setQuantityDead] = useState("");
  const [cause, setCause] = useState("");
  const [mortalityDate, setMortalityDate] = useState(localDateInput());
  const [toast, setToast] = useState(null);
  const [savedState, setSavedState] = useState(false);

  const queryBatchId = new URLSearchParams(location.search).get("batch_id");

  const selectedBatch = useMemo(() => batches.find((b) => b.batch_id === selectedBatchId), [batches, selectedBatchId]);
  const recentBatches = useMemo(() => batches.filter((b) => Number(b.total_deaths || 0) > 0).slice(0, 3), [batches]);
  const remainingChicks = Number(selectedBatch?.current_alive || 0);

  const validation = useMemo(() => {
    if (!selectedBatchId) return "Please select a batch";
    if (!Number.isInteger(Number(quantityDead)) || Number(quantityDead) <= 0) return "Please enter a valid number of deaths";
    if (selectedBatch && Number(quantityDead) > Number(selectedBatch.current_alive || 0)) return "Deaths cannot exceed remaining chicks";
    if (!cause.trim() || cause.trim().length > 255) return "Please select a cause";
    if (!mortalityDate || mortalityDate > localDateInput()) return "Please select a valid date";
    return "";
  }, [selectedBatchId, quantityDead, selectedBatch, cause, mortalityDate]);

  const formComplete = !validation;

  useEffect(() => { fetchPageData(); }, []);

  useEffect(() => {
    if (!batches.length) return;
    const target = queryBatchId && batches.some((b) => b.batch_id === queryBatchId) ? queryBatchId : batches[0].batch_id;
    setSelectedBatchId((prev) => prev || target);
  }, [batches, queryBatchId]);

  useEffect(() => {
    const id = setTimeout(() => { if (toast) setToast(null); }, 3500);
    return () => clearTimeout(id);
  }, [toast]);

  const fetchPageData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/worker/mortality/page-data");
      setBatches(Array.isArray(res.data?.batches) ? res.data.batches : []);
      setRecentRecords(Array.isArray(res.data?.recentRecords) ? res.data.recentRecords : []);
      setCauseSummary(Array.isArray(res.data?.causeSummary) ? res.data.causeSummary : []);
    } catch (err) {
      console.error("Failed to load mortality page:", err);
      setToast({ type:"error", message:"Failed to load mortality page data." });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setQuantityDead("");
    setCause("");
    setMortalityDate(localDateInput());
  };

  const handleSubmit = async () => {
    if (!formComplete || saving) {
      if (validation) setToast({ type:"error", message:validation });
      return;
    }

    try {
      setSaving(true);
      await API.post("/worker/mortality", {
        batch_id: selectedBatchId,
        quantity_dead: Number(quantityDead),
        cause: cause.trim(),
        mortality_date: mortalityDate,
      });

      setSavedState(true);
      setToast({ type:"success", message:"Mortality record saved successfully!" });
      resetForm();
      await fetchPageData();
      setTimeout(() => setSavedState(false), 1300);
    } catch (err) {
      console.error("Failed to save mortality record:", err);
      setToast({ type:"error", message: err.response?.data?.error || "Failed to save. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:14,fontFamily:C.body}}>
        <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1,ease:"linear"}}
          style={{width:46,height:46,borderRadius:"50%",border:`3px solid ${C.border}`,borderTopColor:C.red}} />
        <p style={{color:C.textMid,fontWeight:600}}>Loading mortality page…</p>
      </div>
    );
  }

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:C.body,color:C.text,paddingBottom:60}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .input-focus:focus, .select-focus:focus { outline: none; border-color: ${C.red} !important; box-shadow: 0 0 0 4px ${C.red}18; }
        ::-webkit-scrollbar { width: 7px; height: 7px; }
        ::-webkit-scrollbar-thumb { background: #C8D7C1; border-radius: 10px; }
        .spin { animation: spin .8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1000px) { main > div, main section div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; } }
      `}</style>

      <Toast toast={toast} onClose={() => setToast(null)} />

      <div style={{position:"sticky",top:0,zIndex:200,background:"rgba(246,248,243,.92)",backdropFilter:"blur(14px)",borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1320,margin:"0 auto",height:70,padding:"0 32px",display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:44,height:44,borderRadius:14,background:`linear-gradient(135deg,${C.red},${C.redDark})`,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 8px 22px ${C.red}35`}}>
            <Heart size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{margin:0,fontFamily:C.sans,fontSize:23,fontWeight:900,color:C.text}}>Record Mortality</h1>
            <p style={{margin:"3px 0 0",fontSize:12,color:C.textMid,fontWeight:600}}>Record chicken deaths for any active farm batch</p>
          </div>
          <button onClick={fetchPageData} style={{marginLeft:"auto",border:`1.5px solid ${C.border}`,background:C.surface,borderRadius:13,padding:"10px 14px",display:"flex",alignItems:"center",gap:8,fontFamily:C.sans,fontWeight:800,fontSize:12,color:C.text,cursor:"pointer"}}>
            <RefreshCw size={14}/> Refresh
          </button>
        </div>
      </div>

      <main style={{maxWidth:1320,margin:"0 auto",padding:"28px 32px 0"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <Section title="Select Batch" icon={Package}>
            <div style={{position:"relative",marginBottom:14}}>
              <Search size={15} color={C.textLight} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
              <select className="select-focus" value={selectedBatchId} onChange={(e)=>setSelectedBatchId(e.target.value)}
                style={{width:"100%",height:52,border:`1.5px solid ${C.border}`,borderRadius:16,padding:"0 44px",fontFamily:C.sans,fontWeight:800,fontSize:13,color:C.text,background:C.bg,appearance:"none",cursor:"pointer"}}>
                <option value="">Select a batch</option>
                {batches.map((b) => (
                  <option key={b.batch_id} value={b.batch_id}>
                    {b.batch_id} - {b.batch_status} - Day {b.age_days} ({n(b.total_chicks)} chicks)
                  </option>
                ))}
              </select>
              <ChevronDown size={16} color={C.textLight} style={{position:"absolute",right:15,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
            </div>

            <div style={{fontSize:12,color:C.textMid,fontWeight:700,marginBottom:8}}>Recent batches with mortality:</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {recentBatches.length === 0 ? (
                <div style={{color:C.textLight,fontSize:12}}>No mortality records yet.</div>
              ) : recentBatches.map((b) => (
                <button key={b.batch_id} type="button" onClick={() => setSelectedBatchId(b.batch_id)}
                  style={{border:`1px solid ${selectedBatchId===b.batch_id?C.red:C.border}`,background:selectedBatchId===b.batch_id?C.redDim:C.surface,color:C.text,borderRadius:13,padding:"10px 12px",cursor:"pointer",textAlign:"left",fontFamily:C.body,fontSize:12,display:"flex",justifyContent:"space-between",gap:12}}>
                  <span><strong style={{color:C.redDark}}>{b.batch_id}</strong> - {n(b.last_quantity_dead)} deaths - {b.last_cause || "—"}</span>
                  {selectedBatchId===b.batch_id && <span style={{color:C.red,fontWeight:900}}>✓</span>}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Batch Information" icon={Info}>
            {!selectedBatch ? (
              <div style={{padding:28,textAlign:"center",color:C.textMid}}>Select a batch to view mortality details.</div>
            ) : (
              <>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
                  <Metric label="Age" value={`Day ${selectedBatch.age_days || 0}`} icon="📅" color={C.blue}/>
                  <Metric label="Original Chicks" value={n(selectedBatch.original_chicks)} icon="🐤" color={C.greenDark} />
                  <Metric label="Alive" value={n(selectedBatch.current_alive)} icon="✅" color={C.green}/>
                </div>
                <div style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:16,padding:14,fontSize:12,color:C.textMid,lineHeight:1.8}}>
                  <div>⚠️ Current mortality: <strong style={{color:selectedBatch.high_mortality?C.red:C.text}}>{n(selectedBatch.total_deaths)} / {n(selectedBatch.original_chicks)} ({selectedBatch.mortality_rate || 0}%)</strong></div>
                  <div>📊 Total deaths: <strong style={{color:C.text}}>{n(selectedBatch.total_deaths)}</strong></div>
                  <div>Last record: <strong style={{color:C.text}}>{formatLastMortality(selectedBatch.last_mortality_date)}</strong></div>
                </div>
              </>
            )}
          </Section>
        </div>

        {selectedBatch?.high_mortality && (
          <motion.section {...fadeUp(.07)} style={{background:C.redDim,border:`1.5px solid ${C.red}35`,borderRadius:22,padding:18,marginBottom:20,display:"flex",alignItems:"flex-start",gap:12,boxShadow:"0 6px 24px rgba(239,68,68,.12)"}}>
            <AlertTriangle size={22} color={C.red}/>
            <div>
              <div style={{fontFamily:C.sans,fontWeight:900,color:C.red,marginBottom:4}}>High Mortality Warning</div>
              <div style={{fontSize:13,color:C.redDark,lineHeight:1.6}}>Mortality rate is {selectedBatch.mortality_rate}% and exceeds the 5% threshold. Please investigate and record cause immediately.</div>
            </div>
          </motion.section>
        )}

        <Section title="Mortality Record Details" icon={Heart}>
          <label style={labelStyle}>Number of Deaths *</label>
          <input className="input-focus" type="number" min="1" step="1" value={quantityDead} onChange={(e)=>setQuantityDead(e.target.value)} placeholder="3" style={inputStyle}/>
          <div style={{marginTop:8,marginBottom:16,fontSize:12,color:C.textMid}}>Remaining chicks: <strong style={{color:C.text}}>{n(remainingChicks)}</strong></div>

          <label style={labelStyle}>Cause of Death *</label>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
            {causes.map((item) => (
              <QuickButton key={item} active={cause===item} onClick={()=>setCause(item)}>
                {cause===item ? "●" : "○"} {item}
              </QuickButton>
            ))}
          </div>

          <label style={labelStyle}>Date *</label>
          <div style={{position:"relative",marginBottom:10}}>
            <CalendarDays size={16} color={C.textLight} style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
            <input className="input-focus" type="date" value={mortalityDate} max={localDateInput()} onChange={(e)=>setMortalityDate(e.target.value)} style={{...inputStyle,paddingLeft:44}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <QuickButton onClick={()=>setMortalityDate(localDateInput())}>Today</QuickButton>
            <QuickButton onClick={()=>{ const d=new Date(); d.setDate(d.getDate()-1); setMortalityDate(localDateInput(d)); }}>Yesterday</QuickButton>
          </div>
        </Section>

        <motion.section {...fadeUp(.1)} style={{marginTop:20}}>
          <motion.button whileHover={formComplete&&!saving?{y:-3,boxShadow:`0 14px 34px ${C.red}35`}:{}} whileTap={formComplete&&!saving?{scale:.98}:{}} disabled={!formComplete||saving} onClick={handleSubmit} type="button"
            style={{width:"100%",height:58,border:"none",borderRadius:18,background:savedState?`linear-gradient(135deg,${C.green},${C.greenDark})`:formComplete?`linear-gradient(135deg,${C.red},${C.redDark})`:"#D1DDD0",color:"#fff",fontFamily:C.sans,fontSize:15,fontWeight:900,cursor:formComplete&&!saving?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            {saving ? <><Loader2 size={18} className="spin"/> Saving...</> : savedState ? <><CheckCircle2 size={18}/> Saved!</> : formComplete ? <><Save size={18}/> ❤️ Save Mortality Record</> : <><AlertTriangle size={18}/> Please fill all fields</>}
          </motion.button>
          {validation && <div style={{textAlign:"center",marginTop:10,fontSize:11,color:C.textMid}}>{validation}</div>}
        </motion.section>

        <motion.section {...fadeUp(.14)} style={{marginTop:24,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:22,boxShadow:"0 6px 24px rgba(16,33,20,.06)",overflow:"hidden"}}>
          <div style={{padding:"18px 20px",borderBottom:`1.5px solid ${C.border}`,display:"flex",alignItems:"center",gap:9}}>
            <ClipboardList size={18} color={C.red}/>
            <div style={{fontFamily:C.sans,fontWeight:900,fontSize:15}}>Recent Mortality Records</div>
            <span style={{marginLeft:8,fontSize:11,color:C.textMid,fontWeight:700}}>Last 10 records</span>
          </div>

          {recentRecords.length === 0 ? (
            <div style={{padding:40,textAlign:"center",color:C.textMid}}>
              <Heart size={34} color={C.textLight}/>
              <div style={{marginTop:10,fontFamily:C.sans,fontWeight:800}}>No recent mortality records</div>
              <div style={{fontSize:12,marginTop:4}}>Save a mortality record to see it here.</div>
            </div>
          ) : (
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
                <thead>
                  <tr style={{background:C.redDim}}>
                    {["Batch","Date","Deaths","Cause","Recorded By"].map((h) => (
                      <th key={h} style={{padding:"13px 16px",textAlign:"left",color:C.redDark,fontFamily:C.sans,fontWeight:900,fontSize:11,letterSpacing:".07em",textTransform:"uppercase",borderBottom:`1.5px solid ${C.border}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((r, idx) => (
                    <tr key={r.mortality_id || `${r.batch_id}-${r.mortality_date}-${idx}`} style={{background:r.is_mine?C.redDim:idx%2===0?C.surface:C.bg}}>
                      <td style={cellStyle}><strong style={{color:C.blue}}>{r.batch_id}</strong></td>
                      <td style={cellStyle}>{formatDate(r.mortality_date)}</td>
                      <td style={cellStyle}>{n(r.quantity_dead)}</td>
                      <td style={cellStyle}>{r.cause || "—"}</td>
                      <td style={cellStyle}><span style={{background:r.is_mine?C.red:C.bg,color:r.is_mine?"#fff":C.textMid,borderRadius:99,padding:"4px 9px",fontSize:11,fontWeight:800}}>{r.recorded_by || r.user_id}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.section>

        <motion.section {...fadeUp(.16)} style={{marginTop:24,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:22,padding:20,boxShadow:"0 6px 24px rgba(16,33,20,.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:14}}>
            <BarChart3 size={18} color={C.red}/>
            <div style={{fontFamily:C.sans,fontWeight:900,fontSize:15}}>Mortality Summary by Cause</div>
          </div>
          {causeSummary.length===0 ? <div style={{fontSize:12,color:C.textMid}}>No summary data yet.</div> : causeSummary.map((item) => (
            <div key={item.cause} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                <span style={{fontSize:12,fontWeight:800,color:C.text}}>{item.cause}</span>
                <span style={{fontSize:12,color:C.textMid}}>{n(item.total_deaths)} deaths ({item.percentage}%)</span>
              </div>
              <div style={{height:10,background:C.bg,borderRadius:99,overflow:"hidden"}}>
                <div style={{width:`${Math.min(100,Number(item.percentage||0))}%`,height:"100%",background:`linear-gradient(90deg,${C.red},${C.redDark})`,borderRadius:99}} />
              </div>
            </div>
          ))}
        </motion.section>

        <motion.section {...fadeUp(.18)} style={{marginTop:24,background:C.surface,border:`1.5px solid ${C.border}`,borderRadius:22,padding:20,boxShadow:"0 6px 24px rgba(16,33,20,.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:12}}>
            <Lightbulb size={18} color={C.amber}/>
            <div style={{fontFamily:C.sans,fontWeight:900,fontSize:15}}>Quick Tips</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
            {["mortality_id is auto-generated by the database.","user_id is automatically linked to your account.","Record deaths as soon as possible for accurate tracking."].map((tip,i) => (
              <div key={i} style={{background:C.amberDim,border:`1px solid ${C.amber}25`,borderRadius:15,padding:"13px 14px",fontSize:12,color:"#92400E",lineHeight:1.6,fontWeight:700}}>• {tip}</div>
            ))}
          </div>
        </motion.section>

        <div style={{marginTop:28,color:C.textLight,fontSize:11,fontWeight:700}}>AyamTech Worker Hub · Keep up the great work!</div>
      </main>
    </div>
  );
}

const labelStyle = { display:"block", fontFamily:C.sans, fontWeight:900, fontSize:13, marginBottom:10, color:C.text };
const cellStyle = { padding:"14px 16px", borderBottom:`1px solid ${C.border}`, color:C.textMid, fontWeight:600 };
