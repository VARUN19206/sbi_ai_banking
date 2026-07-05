// Notifications.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { notificationService } from '../services/apiService.js'

export function Notifications() {
  const { token } = useAuth()
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    notificationService.getAll(token)
      .then(d => setNotifs(d.data?.length ? d.data : demoNotifs))
      .catch(() => setNotifs(demoNotifs))
  }, [token])

  const markAll = () => notificationService.markAllRead(token).then(() => setNotifs(n => n.map(x => ({ ...x, is_read:1 }))))

  const dotColor = { alert:'#ef4444', warning:'#f59e0b', success:'#22c55e', info:'#3b82f6', reminder:'#a78bfa' }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h2 style={{ fontSize:18, fontWeight:500 }}>Notifications</h2>
        <button onClick={markAll} style={{ fontSize:12, padding:'8px 14px' }}>Mark all read</button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {notifs.map((n,i) => (
          <div key={i} className="card" style={{ display:'flex', gap:10, alignItems:'flex-start', opacity: n.is_read ? .5 : 1, borderColor: n.type==='alert' ? 'rgba(239,68,68,.3)' : '#2a3347' }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background: dotColor[n.type]||'#3b82f6', flexShrink:0, marginTop:4 }} />
            <div>
              <div style={{ fontSize:12, fontWeight:500, color:'#e8edf5', marginBottom:2 }}>{n.title}</div>
              <div style={{ fontSize:11, color:'#566480' }}>{n.body || n.agent_source} · {n.is_read ? 'Read' : <span style={{ color:'#93c5fd' }}>New</span>}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const demoNotifs = [
  { title:'BESCOM bill due in 3 days', type:'alert', agent_source:'Bill reminder agent', is_read:0 },
  { title:'Spending 8% higher than last month', type:'warning', agent_source:'Spending agent', is_read:0 },
  { title:'New SIP recommendation ready', type:'success', agent_source:'Savings agent', is_read:0 },
  { title:'Pre-approved loan offer — ₹35L at 8.4%', type:'info', agent_source:'Loan agent', is_read:1 },
  { title:'SBI FD rate increased to 6.8%', type:'info', agent_source:'Investment agent', is_read:1 },
]

export default Notifications