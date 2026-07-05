// Transactions.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { transactionService } from '../services/apiService.js'

export default function Transactions() {
  const { token } = useAuth()
  const [txns, setTxns]     = useState([])
  const [search, setSearch] = useState('')
  const [cat, setCat]       = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    transactionService.getAll(token, { limit:50 })
      .then(d => setTxns(d.data || demoTxns))
      .catch(() => setTxns(demoTxns))
      .finally(() => setLoading(false))
  }, [token])

  const filtered = txns.filter(t =>
    (t.description?.toLowerCase().includes(search.toLowerCase()) || t.category?.includes(search.toLowerCase())) &&
    (cat === '' || t.category === cat)
  )

  const catBadge = { food:'badge-warning', income:'badge-success', grocery:'badge-info', ott:'badge-warning', insurance:'badge-info', transport:'badge-info', shopping:'badge-warning', utility:'badge-danger', loan:'badge-info', transfer:'badge-info' }

  return (
    <div>
      <h2 style={ps.h2}>Transactions</h2>
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input style={{ flex:1, minWidth:180, background:'#1c2333', border:'1px solid #2a3347', borderRadius:8, color:'#e8edf5', padding:'9px 12px', fontSize:13, outline:'none' }}
          placeholder="Search transactions…" value={search} onChange={e=>setSearch(e.target.value)} />
        <select style={{ width:150, background:'#1c2333', border:'1px solid #2a3347', borderRadius:8, color:'#e8edf5', padding:'9px 12px', fontSize:13, outline:'none' }}
          value={cat} onChange={e=>setCat(e.target.value)}>
          <option value="">All categories</option>
          {['food','income','grocery','ott','insurance','transport','shopping','utility','loan','transfer'].map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead><tr style={{ background:'#212840' }}>
            {['Description','Category','Agent','Amount','Date','Status'].map(h=>
              <th key={h} style={{ textAlign:'left', padding:'10px 14px', color:'#566480', fontWeight:400, borderBottom:'1px solid #2a3347', fontSize:11, textTransform:'uppercase' }}>{h}</th>
            )}
          </tr></thead>
          <tbody>
            {filtered.map((t,i)=>(
              <tr key={i} style={{ borderBottom:'1px solid rgba(42,51,71,.4)' }}>
                <td style={{ padding:'9px 14px', color:'#e8edf5' }}>{t.description}</td>
                <td style={{ padding:'9px 14px' }}><span className={`badge ${catBadge[t.category]||'badge-info'}`}>{t.category}</span></td>
                <td style={{ padding:'9px 14px', color:'#566480', fontSize:11 }}>{t.agent_flag || '—'}</td>
                <td style={{ padding:'9px 14px', color: t.amount>0||t.type==='credit'?'#86efac':'#fca5a5' }}>
                  {(t.amount>0||t.type==='credit')?'+':''}₹{Math.abs(t.amount).toLocaleString()}
                </td>
                <td style={{ padding:'9px 14px', color:'#8b9ab5' }}>{new Date(t.txn_date||t.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
                <td style={{ padding:'9px 14px' }}><span className="badge badge-success">Processed</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const demoTxns = [
  {description:'Swiggy Food',category:'food',agent_flag:'Spending agent',amount:-480,txn_date:'2026-06-20'},
  {description:'Salary credit',category:'income',agent_flag:'—',amount:75000,txn_date:'2026-06-18'},
  {description:'Reliance Fresh',category:'grocery',agent_flag:'Spending agent',amount:-1240,txn_date:'2026-06-17'},
  {description:'Netflix',category:'ott',agent_flag:'Bill reminder',amount:-649,txn_date:'2026-06-15'},
  {description:'LIC Premium',category:'insurance',agent_flag:'Bill reminder',amount:-3200,txn_date:'2026-06-14'},
  {description:'Ola Cabs',category:'transport',agent_flag:'Spending agent',amount:-320,txn_date:'2026-06-13'},
  {description:'Amazon Shopping',category:'shopping',agent_flag:'Spending agent',amount:-2100,txn_date:'2026-06-12'},
  {description:'BESCOM Bill',category:'utility',agent_flag:'Bill reminder',amount:-1840,txn_date:'2026-06-10'},
  {description:'HDFC EMI',category:'loan',agent_flag:'Loan agent',amount:-12450,txn_date:'2026-06-05'},
  {description:'PhonePe UPI',category:'transfer',agent_flag:'—',amount:-5000,txn_date:'2026-06-03'},
]

const ps = { h2:{ fontSize:18, fontWeight:500, marginBottom:16 } }