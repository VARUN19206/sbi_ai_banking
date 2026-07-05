import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import authService from '../services/authService.js'

const initialForm = {
  cif_number:'', account_number:'', first_name:'', last_name:'',
  email:'', password:'', phone:'', pan_number:'', date_of_birth:'',
  branch:'', city:'', risk_profile:'moderate', otp:''
}

export default function Register() {
  const [step, setStep]     = useState(1)
  const [form, setForm]     = useState(initialForm)
  const [showPwd, setShow]  = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState(false)

  const { login } = useAuth()
  const navigate  = useNavigate()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const strength = (pwd) => {
    let s = 0
    if (pwd.length >= 8) s++
    if (/[A-Z]/.test(pwd)) s++
    if (/[0-9]/.test(pwd)) s++
    if (/[^a-zA-Z0-9]/.test(pwd)) s++
    return s
  }
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong', 'Very strong']
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e', '#22c55e']

  const handleSendOTP = async () => {
    setLoading(true); setError('')
    try { await authService.sendOTP(form.email); setOtpSent(true) }
    catch (err) { setError(err.response?.data?.message || 'Failed to send OTP') }
    finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const data = await authService.register(form)
      setSuccess(true)
      setTimeout(() => { login(data.token, data.user); navigate('/') }, 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  const pwd = form.password
  const s   = strength(pwd)

  if (success) return (
    <div style={{...st.page, flexDirection:'column', gap:16, textAlign:'center'}}>
      <div style={{width:64,height:64,borderRadius:'50%',background:'#14432a',border:'1px solid rgba(34,197,94,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,color:'#86efac'}}>
        <i className="ti ti-check" />
      </div>
      <h2 style={{color:'#e8edf5'}}>Account activated!</h2>
      <p style={{color:'#8b9ab5'}}>5 AI agents are initialising… Redirecting to dashboard.</p>
    </div>
  )

  return (
    <div style={st.page}>
      <div style={st.split}>
        <div style={st.left}>
          <div style={st.logoRow}>
            <div style={st.logoMark}>SBI</div>
            <div><div style={st.brand}>SBI AI Assistant</div><div style={st.brandSub}>Agentic Banking Platform</div></div>
          </div>
          <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center'}}>
            <h2 style={{fontSize:22,fontWeight:500,color:'#e8edf5',lineHeight:1.4,marginBottom:10}}>Join 10M+ customers<br/>banking smarter</h2>
            <p style={{fontSize:13,color:'#8b9ab5',lineHeight:1.7,marginBottom:24}}>Link your existing SBI account to unlock AI-powered insights, automated bill tracking, and personalised investment plans.</p>
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {[['#86efac','ti-shield-check','KYC verified in 2 minutes'],['#93c5fd','ti-robot','5 AI agents activated instantly'],['#fcd34d','ti-database','Encrypted on MySQL'],['#5eead4','ti-bolt','Recommendations in first login']].map(([color,icon,text])=>(
                <div key={text} style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{width:26,height:26,borderRadius:6,background:'rgba(255,255,255,.05)',display:'flex',alignItems:'center',justifyContent:'center',color,fontSize:14,flexShrink:0}}>
                    <i className={`ti ${icon}`} />
                  </div>
                  <span style={{color:'#8b9ab5',fontSize:13}}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{fontSize:11,color:'#566480'}}>Hackathon 2026 · Agentic AI & Emerging Tech</div>
        </div>

        <div style={st.right}>
          {/* Step indicator */}
          <div style={{display:'flex',alignItems:'center',marginBottom:24}}>
            {[1,2,3].map((n,i)=>(
              <React.Fragment key={n}>
                <div style={{display:'flex',alignItems:'center',gap:6}}>
                  <div style={{width:24,height:24,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,flexShrink:0,
                    background: step>n?'#14432a':step===n?'#1e3a5f':'#212840',
                    color: step>n?'#86efac':step===n?'#93c5fd':'#566480',
                    border: `1px solid ${step>n?'rgba(34,197,94,.3)':step===n?'rgba(59,130,246,.4)':'#2a3347'}`
                  }}>
                    {step>n ? <i className="ti ti-check" style={{fontSize:10}} /> : n}
                  </div>
                  <span style={{fontSize:11,color:step===n?'#93c5fd':'#566480'}}>{['Account','Personal','Verify'][n-1]}</span>
                </div>
                {i<2 && <div style={{flex:1,height:1,background:step>n?'rgba(34,197,94,.3)':'#2a3347',margin:'0 6px'}} />}
              </React.Fragment>
            ))}
          </div>

          <div style={{marginBottom:20}}>
            <h3 style={{fontSize:18,fontWeight:500}}>{['Create your account','Personal details','Verify identity'][step-1]}</h3>
            <p style={{fontSize:13,color:'#8b9ab5'}}>{['Link your SBI account to get started','Help us personalise your AI agents','One last step — confirm it\'s you'][step-1]}</p>
          </div>

          {error && <div style={st.errorBox}>{error}</div>}

          <form onSubmit={step===3 ? handleSubmit : e=>{ e.preventDefault(); setStep(step+1) }}>
            {step===1 && <>
              <div style={st.field}>
                <label style={st.label}>CIF Number</label>
                <input style={st.input} placeholder="SBI CIF number" value={form.cif_number} onChange={e=>set('cif_number',e.target.value)} required />
              </div>
              <div style={st.field}>
                <label style={st.label}>Account Number</label>
                <input style={st.input} placeholder="Account number" value={form.account_number} onChange={e=>set('account_number',e.target.value)} required />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={st.field}>
                  <label style={st.label}>First Name</label>
                  <input style={st.input} placeholder="Rajesh" value={form.first_name} onChange={e=>set('first_name',e.target.value)} required />
                </div>
                <div style={st.field}>
                  <label style={st.label}>Last Name</label>
                  <input style={st.input} placeholder="Kumar" value={form.last_name} onChange={e=>set('last_name',e.target.value)} required />
                </div>
              </div>
              <div style={st.field}>
                <label style={st.label}>Email</label>
                <input style={st.input} type="email" placeholder="rajesh@email.com" value={form.email} onChange={e=>set('email',e.target.value)} required />
              </div>
              <div style={st.field}>
                <label style={st.label}>Password</label>
                <div style={{position:'relative'}}>
                  <input style={st.input} type={showPwd?'text':'password'} placeholder="Min 8 chars, 1 number, 1 symbol" value={pwd} onChange={e=>set('password',e.target.value)} required />
                  <button type="button" style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',color:'#566480',cursor:'pointer',fontSize:15}} onClick={()=>setShow(!showPwd)}>
                    <i className={`ti ${showPwd?'ti-eye-off':'ti-eye'}`} />
                  </button>
                </div>
                {pwd && <>
                  <div style={{display:'flex',gap:3,marginTop:5}}>
                    {[1,2,3,4].map(i=><div key={i} style={{flex:1,height:3,borderRadius:2,background:i<=s?strengthColor[s]:'#2a3347'}} />)}
                  </div>
                  <div style={{fontSize:11,color:strengthColor[s],marginTop:3}}>{strengthLabel[s]}</div>
                </>}
              </div>
            </>}

            {step===2 && <>
              <div style={st.field}>
                <label style={st.label}>Mobile Number</label>
                <input style={st.input} placeholder="+91 98765 43210" value={form.phone} onChange={e=>set('phone',e.target.value)} required />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div style={st.field}>
                  <label style={st.label}>Date of Birth</label>
                  <input style={st.input} type="date" value={form.date_of_birth} onChange={e=>set('date_of_birth',e.target.value)} />
                </div>
                <div style={st.field}>
                  <label style={st.label}>PAN Number</label>
                  <input style={st.input} placeholder="ABCDE1234F" maxLength={10} value={form.pan_number} onChange={e=>set('pan_number',e.target.value.toUpperCase())} />
                </div>
              </div>
              <div style={st.field}>
                <label style={st.label}>City</label>
                <input style={st.input} placeholder="e.g. Bengaluru" value={form.city} onChange={e=>set('city',e.target.value)} />
              </div>
              <div style={st.field}>
                <label style={st.label}>Branch</label>
                <input style={st.input} placeholder="e.g. MG Road, Bengaluru" value={form.branch} onChange={e=>set('branch',e.target.value)} />
              </div>
              <div style={st.field}>
                <label style={st.label}>Risk Profile</label>
                <select style={st.input} value={form.risk_profile} onChange={e=>set('risk_profile',e.target.value)}>
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>
            </>}

            {step===3 && <>
              <div style={{background:'#1e3a5f',border:'1px solid rgba(59,130,246,.2)',borderRadius:10,padding:14,marginBottom:16,fontSize:12,color:'#93c5fd',display:'flex',gap:10}}>
                <i className="ti ti-info-circle" style={{fontSize:16,flexShrink:0}} />
                <span>An OTP will be sent to <strong>{form.email}</strong> to verify your identity.</span>
              </div>
              <div style={st.field}>
                <label style={st.label}>Verify Email OTP</label>
                <div style={{display:'flex',gap:8}}>
                  <input style={{...st.input,flex:1}} placeholder="6-digit OTP" maxLength={6} value={form.otp} onChange={e=>set('otp',e.target.value)} />
                  <button type="button" onClick={handleSendOTP} style={{background:'#212840',border:'1px solid #2a3347',borderRadius:8,color:'#8b9ab5',padding:'10px 14px',cursor:'pointer',fontSize:12,whiteSpace:'nowrap'}}>
                    {otpSent ? 'Resend' : 'Send OTP'}
                  </button>
                </div>
              </div>
              <div style={{display:'flex',alignItems:'flex-start',gap:8,marginBottom:14}}>
                <input type="checkbox" defaultChecked style={{width:16,height:16,marginTop:2,flexShrink:0,accentColor:'#3b82f6'}} required />
                <span style={{fontSize:12,color:'#8b9ab5',lineHeight:1.5}}>I agree to the Terms of service and Privacy policy. I consent to AI analysis of my transaction data.</span>
              </div>
            </>}

            <div style={{display:'flex',gap:10}}>
              {step>1 && <button type="button" onClick={()=>setStep(step-1)} style={{flex:1,background:'#212840',border:'1px solid #2a3347',borderRadius:8,color:'#8b9ab5',padding:'11px',fontSize:13,cursor:'pointer'}}>← Back</button>}
              <button type="submit" style={{flex:2,background:'#3b82f6',border:'none',borderRadius:8,color:'#fff',padding:'11px',fontSize:13,fontWeight:500,cursor:'pointer'}} disabled={loading}>
                {loading ? 'Please wait…' : step===3 ? 'Activate AI agents 🚀' : 'Continue →'}
              </button>
            </div>
          </form>

          <div style={{textAlign:'center',fontSize:12,color:'#566480',marginTop:16}}>
            Already have an account? <Link to="/login" style={{color:'#93c5fd'}}>Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const st = {
  page:     { minHeight:'100vh', background:'#0f1117', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  split:    { display:'grid', gridTemplateColumns:'1fr 1fr', width:'100%', maxWidth:920, borderRadius:16, overflow:'hidden', border:'1px solid #2a3347' },
  left:     { background:'linear-gradient(160deg,#0d1b3e 0%,#0f1117 60%,#0a1628 100%)', padding:40, display:'flex', flexDirection:'column', justifyContent:'space-between' },
  logoRow:  { display:'flex', alignItems:'center', gap:10, marginBottom:32 },
  logoMark: { width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:600 },
  brand:    { fontSize:14, fontWeight:500, color:'#e8edf5' },
  brandSub: { fontSize:11, color:'#566480' },
  right:    { background:'#1c2333', padding:40, overflowY:'auto', maxHeight:'100vh' },
  field:    { marginBottom:14 },
  label:    { display:'block', fontSize:11, color:'#8b9ab5', marginBottom:6, fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em' },
  input:    { background:'#212840', border:'1px solid #2a3347', borderRadius:8, color:'#e8edf5', padding:'10px 12px', fontSize:13, width:'100%', outline:'none' },
  errorBox: { background:'#3f1212', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, color:'#fca5a5', padding:'10px 12px', fontSize:12, marginBottom:14 },
}