import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { aiService } from '../services/apiService.js'

const agents = [
  { key:'spending',      icon:'ti-trending-down', bg:'#431f05', fg:'#fcd34d', name:'Spending agent',      desc:'Tracks patterns, flags anomalies, categorises expenses automatically.' },
  { key:'savings',       icon:'ti-piggy-bank',    bg:'#14432a', fg:'#86efac', name:'Savings agent',       desc:'Identifies opportunities to build emergency corpus and save more.' },
  { key:'loan',          icon:'ti-building-bank', bg:'#1e3a5f', fg:'#93c5fd', name:'Loan agent',          desc:'Checks eligibility, repayment health, and surfaces pre-approved offers.' },
  { key:'bill_reminder', icon:'ti-receipt',       bg:'#3f1212', fg:'#fca5a5', name:'Bill reminder agent', desc:'Auto-detects recurring bills and sends advance alerts before due dates.' },
  { key:'investment',    icon:'ti-chart-line',    bg:'#2e1f5e', fg:'#c4b5fd', name:'Investment agent',    desc:'Recommends SIP, FD, and MF options based on risk profile and surplus.' },
]

const flowSteps = [
  'User login — JWT session verified',
  'Transaction history fetched from MySQL',
  'AI Agent Service dispatches 5 sub-agents in parallel',
  'Each agent analyses transactions and generates recommendations',
  'Recommendations stored in MySQL',
  'Notifications sent to user',
  'User submits feedback → agents improve',
]

export default function Agents() {
  const { token } = useAuth()
  const [status, setStatus] = useState([])
  const [running, setRunning] = useState(false)

  useEffect(() => {
    aiService.getAgentStatus(token).then(d => setStatus(d.data || [])).catch(()=>{})
  }, [token])

  const getStatus = (key) => {
    const run = status.find(s => s.agent_type === key)
    return run?.status || 'idle'
  }

  const triggerRun = async () => {
    setRunning(true)
    try { await aiService.triggerRun(token); const d = await aiService.getAgentStatus(token); setStatus(d.data||[]) }
    catch(e) { console.error(e) }
    finally { setRunning(false) }
  }

  const statusBadge = { completed:'badge-success', running:'badge-warning', failed:'badge-danger', idle:null, pending:null }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <h2 style={{ fontSize:18, fontWeight:500 }}>AI Agents</h2>
        <button onClick={triggerRun} disabled={running} style={{ fontSize:12, padding:'8px 14px' }}>
          {running ? '⟳ Running…' : '⚡ Run all agents'}
        </button>
      </div>
      <p style={{ fontSize:13, color:'#8b9ab5', marginBottom:20 }}>5 specialised AI agents analyse your finances in parallel after every login.</p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 }}>
        {agents.map(a => {
          const st = getStatus(a.key)
          return (
            <div key={a.key} className="card" style={{ cursor:'pointer' }}>
              <div style={{ width:36, height:36, borderRadius:8, background:a.bg, color:a.fg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:8 }}>
                <i className={`ti ${a.icon}`} />
              </div>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:3 }}>{a.name}</div>
              <div style={{ fontSize:12, color:'#8b9ab5', marginBottom:8 }}>{a.desc}</div>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background: st==='completed'?'#22c55e':st==='running'?'#f59e0b':'#566480' }} />
                {statusBadge[st] ? <span className={`badge ${statusBadge[st]}`}>{st}</span> : <span style={{ fontSize:11, color:'#566480', textTransform:'capitalize' }}>{st}</span>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div style={{ fontSize:13, fontWeight:500, marginBottom:14 }}>Agent pipeline — full flow</div>
        {flowSteps.map((step, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 0', borderBottom: i<flowSteps.length-1?'1px solid rgba(42,51,71,.5)':'none' }}>
            <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:600, flexShrink:0, background: i<3?'#14432a':i===3?'#431f05':'#212840', color: i<3?'#86efac':i===3?'#fcd34d':'#566480' }}>
              {i < 3 ? <i className="ti ti-check" style={{ fontSize:10 }} /> : i+1}
            </div>
            <span style={{ fontSize:12, color:'#8b9ab5' }}>{step}</span>
            {i<3 && <span className="badge badge-success" style={{ marginLeft:'auto' }}>Complete</span>}
            {i===3 && <span className="badge badge-warning" style={{ marginLeft:'auto' }}>In progress</span>}
          </div>
        ))}
      </div>
    </div>
  )
}