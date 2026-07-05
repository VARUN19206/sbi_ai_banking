import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { userService } from '../services/apiService.js'

export default function Profile() {
  const { user, token } = useAuth()
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [msg, setMsg] = useState('')

  useEffect(() => {
    userService.getProfile(token)
      .then(d => { setProfile(d.data||d.user||demoProfile); setForm(d.data||d.user||demoProfile) })
      .catch(() => { setProfile(demoProfile); setForm(demoProfile) })
  }, [token])

  const save = async (e) => {
    e.preventDefault()
    try {
      await userService.updateProfile(token, form)
      setProfile(f => ({ ...f, ...form }))
      setEditing(false)
      setMsg('Profile updated ✓')
      setTimeout(() => setMsg(''), 3000)
    } catch { setMsg('Update failed') }
  }

  const p = profile || demoProfile
  const initials = `${p.first_name?.[0]||''}${p.last_name?.[0]||''}`

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:500, marginBottom:16 }}>Profile</h2>
      {msg && <div style={{ background:'#14432a', border:'1px solid rgba(34,197,94,.2)', borderRadius:8, color:'#86efac', padding:'10px 12px', fontSize:12, marginBottom:14 }}>{msg}</div>}
      <div style={{ maxWidth:520 }}>
        <div className="card">
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
            <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:600, color:'#fff' }}>{initials}</div>
            <div>
              <div style={{ fontSize:16, fontWeight:500 }}>{p.first_name} {p.last_name}</div>
              <div style={{ fontSize:13, color:'#8b9ab5' }}>SBI Savings Account · {p.city || 'Bengaluru'}</div>
              <span className="badge badge-success" style={{ marginTop:5, display:'inline-flex' }}>
                <i className="ti ti-shield-check" style={{ fontSize:11 }} /> KYC verified
              </span>
            </div>
          </div>

          {!editing ? (
            <>
              {[
                ['Account number', p.account_number || '••••••4821'],
                ['CIF number',     p.cif_number    || 'CIF1234567'],
                ['IFSC',           p.ifsc_code     || 'SBIN0004821'],
                ['Branch',         p.branch        || 'MG Road, Bengaluru'],
                ['Email',          p.email         || 'rajesh@email.com'],
                ['Mobile',         p.phone         || '+91 98765 43210'],
                ['Credit score',   p.credit_score  || '768'],
                ['Risk profile',   p.risk_profile  || 'Moderate'],
                ['AI plan',        p.ai_plan       || 'Smart Pro'],
              ].map(([label, val]) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(42,51,71,.5)', fontSize:13 }}>
                  <span style={{ color:'#566480' }}>{label}</span>
                  <span style={{ color:'#e8edf5' }}>{val}</span>
                </div>
              ))}
              <button onClick={() => setEditing(true)} style={{ width:'100%', marginTop:16 }}>Edit profile</button>
            </>
          ) : (
            <form onSubmit={save}>
              {[['first_name','First name'],['last_name','Last name'],['city','City'],['branch','Branch']].map(([k,l])=>(
                <div key={k} style={{ marginBottom:12 }}>
                  <label style={{ display:'block', fontSize:11, color:'#8b9ab5', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>{l}</label>
                  <input style={{ background:'#212840', border:'1px solid #2a3347', borderRadius:8, color:'#e8edf5', padding:'9px 12px', fontSize:13, width:'100%', outline:'none' }}
                    value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
                </div>
              ))}
              <div style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:11, color:'#8b9ab5', marginBottom:5, textTransform:'uppercase', letterSpacing:'.04em' }}>Risk Profile</label>
                <select style={{ background:'#212840', border:'1px solid #2a3347', borderRadius:8, color:'#e8edf5', padding:'9px 12px', fontSize:13, width:'100%', outline:'none' }}
                  value={form.risk_profile||'moderate'} onChange={e=>setForm(f=>({...f,risk_profile:e.target.value}))}>
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="button" className="secondary" onClick={()=>setEditing(false)} style={{ flex:1 }}>Cancel</button>
                <button type="submit" style={{ flex:2 }}>Save changes</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

const demoProfile = { first_name:'Rajesh', last_name:'Kumar', cif_number:'CIF1234567', account_number:'10482100004821', email:'rajesh.kumar@example.com', phone:'+919876543210', branch:'MG Road, Bengaluru', city:'Bengaluru', ifsc_code:'SBIN0004821', credit_score:768, risk_profile:'moderate', ai_plan:'smart_pro' }