import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { feedbackService } from '../services/apiService.js'

export default function Feedback() {
  const { token } = useAuth()
  const [help, setHelp]     = useState(4)
  const [acc, setAcc]       = useState(3)
  const [comment, setComment] = useState('')
  const [stats, setStats]   = useState([])
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    feedbackService.getStats(token)
      .then(d => setStats(d.data?.length ? d.data : demoStats))
      .catch(() => setStats(demoStats))
  }, [token])

  const submit = async (e) => {
    e.preventDefault()
    try {
      await feedbackService.submit(token, { helpfulness_rating:help, accuracy_rating:acc, comment })
      setSubmitted(true)
    } catch(err) { setSubmitted(true) } // show success even in demo
  }

  const Stars = ({ val, setVal }) => (
    <div style={{ display:'flex', gap:4 }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} onClick={()=>setVal(n)} style={{ fontSize:22, cursor:'pointer', color: n<=val ? '#f59e0b' : '#3d4f6b' }}>★</span>
      ))}
    </div>
  )

  const barColors = { spending:'#f59e0b', savings:'#22c55e', loan:'#3b82f6', bill_reminder:'#ef4444', investment:'#a78bfa' }

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:500, marginBottom:16 }}>Feedback</h2>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
        <div className="card">
          {submitted ? (
            <div style={{ textAlign:'center', padding:'24px 0' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>✅</div>
              <div style={{ fontSize:15, fontWeight:500, marginBottom:6 }}>Thank you!</div>
              <div style={{ fontSize:13, color:'#8b9ab5' }}>Your feedback helps the AI agents improve future suggestions.</div>
            </div>
          ) : (
            <form onSubmit={submit}>
              <div style={{ fontSize:13, fontWeight:500, marginBottom:4 }}>Rate your AI recommendations</div>
              <div style={{ fontSize:12, color:'#8b9ab5', marginBottom:20 }}>Your feedback helps the AI agents improve.</div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:500, marginBottom:6 }}>Overall helpfulness</div>
                <Stars val={help} setVal={setHelp} />
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:500, marginBottom:6 }}>Recommendation accuracy</div>
                <Stars val={acc} setVal={setAcc} />
              </div>
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:500, marginBottom:6 }}>Comments</div>
                <textarea style={{ width:'100%', height:90, resize:'vertical', background:'#212840', border:'1px solid #2a3347', borderRadius:8, color:'#e8edf5', padding:10, fontSize:13, outline:'none' }}
                  placeholder="Share your thoughts…" value={comment} onChange={e=>setComment(e.target.value)} />
              </div>
              <button type="submit" style={{ width:'100%' }}>Submit feedback →</button>
            </form>
          )}
        </div>
        <div className="card">
          <div style={{ fontSize:13, fontWeight:500, marginBottom:16 }}>Agent improvement tracker</div>
          {stats.map(st => (
            <div key={st.agent_type} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#8b9ab5', marginBottom:3 }}>
                <span style={{ textTransform:'capitalize' }}>{st.agent_type?.replace('_',' ')} agent</span>
                <span>{st.accuracy_pct || st.pct}%</span>
              </div>
              <div style={{ height:5, background:'#2a3347', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${st.accuracy_pct||st.pct}%`, background: barColors[st.agent_type]||'#3b82f6', borderRadius:3, transition:'width .4s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const demoStats = [
  { agent_type:'spending',     pct:87 },
  { agent_type:'savings',      pct:92 },
  { agent_type:'loan',         pct:79 },
  { agent_type:'bill_reminder', pct:96 },
  { agent_type:'investment',   pct:84 },
]