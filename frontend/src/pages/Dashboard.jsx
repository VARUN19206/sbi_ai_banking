import React, { useEffect, useState } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { useAuth } from '../context/AuthContext.jsx'
import { transactionService, aiService } from '../services/apiService.js'
import { useNavigate } from 'react-router-dom'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const MetricCard = ({ icon, label, value, change, changeType }) => (
  <div style={s.metric}>
    <div style={s.metricLabel}><i className={`ti ${icon}`} style={{fontSize:13}} /> {label}</div>
    <div style={s.metricVal}>{value}</div>
    {change && <div style={{fontSize:11,marginTop:4,color:changeType==='up'?'#86efac':'#fca5a5'}}>{change}</div>}
  </div>
)

export default function Dashboard() {
  const { token } = useAuth()
  const navigate  = useNavigate()
  const [summary, setSummary]   = useState([])
  const [cats, setCats]         = useState([])
  const [txns, setTxns]         = useState([])
  const [agentStatus, setAgentStatus] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      transactionService.getSummary(token),
      transactionService.getCategories(token),
      transactionService.getAll(token, { limit: 5 }),
      aiService.getAgentStatus(token),
    ]).then(([sum, cat, txn, agent]) => {
      setSummary(sum.data || [])
      setCats(cat.data || [])
      setTxns(txn.data || [])
      setAgentStatus(agent.data || [])
    }).catch(console.error).finally(() => setLoading(false))
  }, [token])

  // Fallback demo data when API not connected
  const months     = summary.length ? summary.map(r=>r.month?.slice(5)) : ['Jan','Feb','Mar','Apr','May','Jun']
  const spendData  = summary.length ? summary.map(r=>parseFloat(r.total_expense)||0) : [32000,29500,35000,38000,36500,38720]
  const catLabels  = cats.length ? cats.map(c=>c.category) : ['Food','Grocery','OTT','Insurance','Transport','Other']
  const catVals    = cats.length ? cats.map(c=>parseFloat(c.total)||0) : [4800,6200,1200,3200,1800,12000]
  const recentTxns = txns.length ? txns : [
    {description:'Swiggy Food',category:'food',amount:-480,txn_date:'2026-06-20'},
    {description:'Salary credit',category:'income',amount:75000,txn_date:'2026-06-18'},
    {description:'Reliance Fresh',category:'grocery',amount:-1240,txn_date:'2026-06-17'},
    {description:'Netflix',category:'ott',amount:-649,txn_date:'2026-06-15'},
    {description:'LIC Premium',category:'insurance',amount:-3200,txn_date:'2026-06-14'},
  ]

  const barData = {
    labels: months,
    datasets:[{ label:'Spending (₹)', data: spendData, backgroundColor:'rgba(59,130,246,.25)', borderColor:'#3b82f6', borderWidth:1.5, borderRadius:4 }]
  }
  const pieColors = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#a78bfa','#2dd4bf']
  const doughnutData = {
    labels: catLabels,
    datasets:[{ data: catVals, backgroundColor: pieColors, borderWidth:0, hoverOffset:4 }]
  }

  const flowSteps = agentStatus.length ? agentStatus : [
    {agent_type:'spending',status:'completed'},{agent_type:'savings',status:'completed'},
    {agent_type:'loan',status:'running'},{agent_type:'bill_reminder',status:'pending'},{agent_type:'investment',status:'pending'},
  ]

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:18,fontWeight:500}}>Dashboard</h2>
        <div style={{fontSize:13,color:'#8b9ab5'}}>Welcome back! Your AI agents have been busy.</div>
      </div>

      {/* Metrics */}
      <div style={s.metrics}>
        <MetricCard icon="ti-wallet"       label="Balance"       value="₹2,84,350" change="↑ ₹12,400 this month" changeType="up" />
        <MetricCard icon="ti-trending-down" label="Monthly spend" value="₹38,720"  change="↑ 8% vs last month"   changeType="down" />
        <MetricCard icon="ti-piggy-bank"   label="Savings"       value="₹1,10,000" change="↑ ₹5,000 added"      changeType="up" />
        <MetricCard icon="ti-credit-card"  label="Loan EMI due"  value="₹12,450"   change="Due in 4 days" />
      </div>

      {/* Charts */}
      <div style={s.grid2}>
        <div className="card">
          <div style={s.cardHead}><span style={s.cardTitle}>Spending overview</span><span className="badge badge-info">June 2026</span></div>
          <div style={{height:180}}>
            <Bar data={barData} options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{ticks:{color:'#566480',callback:v=>'₹'+Math.round(v/1000)+'K'},grid:{color:'rgba(255,255,255,.04)'},border:{color:'rgba(255,255,255,.04)'}},x:{ticks:{color:'#566480'},grid:{display:false}}} }} />
          </div>
        </div>
        <div className="card">
          <div style={s.cardHead}><span style={s.cardTitle}>Categories</span></div>
          <div style={{height:140}}>
            <Doughnut data={doughnutData} options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, cutout:'68%' }} />
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:3,marginTop:8}}>
            {catLabels.slice(0,4).map((l,i)=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#8b9ab5'}}>
                <span style={{width:8,height:8,borderRadius:2,background:pieColors[i],flexShrink:0}} />{l}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions + Agent flow */}
      <div style={s.grid2}>
        <div className="card">
          <div style={s.cardHead}>
            <span style={s.cardTitle}>Recent transactions</span>
            <span style={{fontSize:12,color:'#93c5fd',cursor:'pointer'}} onClick={()=>navigate('/transactions')}>View all →</span>
          </div>
          <table style={s.table}>
            <thead><tr>{['Description','Category','Amount','Date'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>
              {recentTxns.map((t,i) => (
                <tr key={i}>
                  <td style={s.td}>{t.description}</td>
                  <td style={s.td}><span className={`badge badge-${t.category==='income'?'success':t.category==='food'||t.category==='ott'?'warning':'info'}`}>{t.category}</span></td>
                  <td style={{...s.td,color:t.amount>0?'#86efac':'#fca5a5'}}>{t.amount>0?'+':''}₹{Math.abs(t.amount).toLocaleString()}</td>
                  <td style={s.td}>{new Date(t.txn_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <div style={s.cardHead}>
            <span style={s.cardTitle}>AI agent pipeline</span>
            <span style={{fontSize:12,color:'#93c5fd',cursor:'pointer'}} onClick={()=>navigate('/agents')}>View all →</span>
          </div>
          {flowSteps.slice(0,5).map((step,i)=>{
            const statuses = { completed:'badge-success', running:'badge-warning', pending:null, failed:'badge-danger' }
            return (
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:i<4?'1px solid rgba(42,51,71,.5)':'none'}}>
                <div style={{width:22,height:22,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:600,flexShrink:0,background:step.status==='completed'?'#14432a':step.status==='running'?'#431f05':'#212840',color:step.status==='completed'?'#86efac':step.status==='running'?'#fcd34d':'#566480'}}>{i+1}</div>
                <div style={{flex:1,fontSize:12,color:'#8b9ab5',textTransform:'capitalize'}}>{step.agent_type?.replace('_',' ')} agent</div>
                {statuses[step.status] ? <span className={`badge ${statuses[step.status]}`}>{step.status}</span> : <span style={{fontSize:11,color:'#566480'}}>Pending</span>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const s = {
  metrics:  { display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 },
  metric:   { background:'#1c2333', border:'1px solid #2a3347', borderRadius:12, padding:'14px 16px' },
  metricLabel:{ fontSize:11, color:'#566480', marginBottom:6, display:'flex', alignItems:'center', gap:5, textTransform:'uppercase', letterSpacing:'.04em' },
  metricVal:{ fontSize:21, fontWeight:600, color:'#e8edf5' },
  grid2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 },
  cardHead: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 },
  cardTitle:{ fontSize:13, fontWeight:500, color:'#e8edf5' },
  table:    { width:'100%', borderCollapse:'collapse', fontSize:12 },
  th:       { textAlign:'left', padding:'6px 10px', color:'#566480', fontWeight:400, borderBottom:'1px solid #2a3347', fontSize:11, textTransform:'uppercase', letterSpacing:'.04em' },
  td:       { padding:'8px 10px', borderBottom:'1px solid rgba(42,51,71,.5)', color:'#8b9ab5' },
}