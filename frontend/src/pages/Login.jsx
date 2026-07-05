import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import authService from '../services/authService.js'

export default function Login() {
  const [tab, setTab]           = useState('password')
  const [cifNumber, setCif]     = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail]       = useState('')
  const [otp, setOtp]           = useState('')
  const [otpSent, setOtpSent]   = useState(false)
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const { login } = useAuth()
  const navigate  = useNavigate()

  const handlePasswordLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = await authService.login(cifNumber, password)
      login(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  const handleSendOTP = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await authService.sendOTP(email)
      setOtpSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const handleVerifyOTP = async (e) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      const data = await authService.verifyOTP(email, otp)
      login(data.token, data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP')
    } finally { setLoading(false) }
  }

  return (
    <div style={s.page}>
      <div style={s.split}>
        {/* Left panel */}
        <div style={s.left}>
          <div style={s.logoRow}>
            <div style={s.logoMark}>SBI</div>
            <div>
              <div style={s.brand}>SBI AI Assistant</div>
              <div style={s.brandSub}>Agentic Banking Platform</div>
            </div>
          </div>
          <div style={s.heroText}>
            <h2 style={s.h2}>Your bank account,<br/>powered by AI agents</h2>
            <p style={s.p}>5 specialised agents watch your finances 24/7 — spotting savings, flagging bills, and surfacing the right offer at the right time.</p>
            <div style={s.features}>
              {[
                ['#93c5fd','ti-brain','Agentic AI recommendations'],
                ['#86efac','ti-shield-lock','JWT-secured sessions'],
                ['#fcd34d','ti-bell','Real-time bill reminders'],
                ['#c4b5fd','ti-chart-line','Investment insights'],
              ].map(([color, icon, text]) => (
                <div key={text} style={s.feat}>
                  <div style={{...s.featIcon, color}}>
                    <i className={`ti ${icon}`} />
                  </div>
                  <span style={{color:'#8b9ab5',fontSize:13}}>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{fontSize:11,color:'#566480'}}>Agentic AI & Emerging Tech</div>
        </div>

        {/* Right panel */}
        <div style={s.right}>
          <div style={{marginBottom:24}}>
            <h3 style={{fontSize:20,fontWeight:500,marginBottom:6}}>Welcome back</h3>
            <p style={{fontSize:13,color:'#8b9ab5'}}>Sign in to your SBI AI Assistant account</p>
          </div>

          {/* Tabs */}
          <div style={s.tabs}>
            <div style={{...s.tab, ...(tab==='password'?s.tabActive:{})}} onClick={()=>setTab('password')}>Password</div>
            <div style={{...s.tab, ...(tab==='otp'?s.tabActive:{})}} onClick={()=>setTab('otp')}>OTP</div>
          </div>

          {error && <div style={s.error}>{error}</div>}

          {tab === 'password' ? (
            <form onSubmit={handlePasswordLogin}>
              <div style={s.field}>
                <label style={s.label}>CIF / Account Number</label>
                <div style={s.inputWrap}>
                  <i className="ti ti-id-badge-2" style={s.inputIcon} />
                  <input style={s.input} placeholder="Enter CIF number" value={cifNumber} onChange={e=>setCif(e.target.value)} required />
                </div>
              </div>
              <div style={s.field}>
                <label style={s.label}>Password</label>
                <div style={s.inputWrap}>
                  <i className="ti ti-lock" style={s.inputIcon} />
                  <input style={s.input} type={showPwd?'text':'password'} placeholder="Enter password" value={password} onChange={e=>setPassword(e.target.value)} required />
                  <button type="button" style={s.eye} onClick={()=>setShowPwd(!showPwd)}>
                    <i className={`ti ${showPwd?'ti-eye-off':'ti-eye'}`} />
                  </button>
                </div>
              </div>
              <div style={{textAlign:'right',marginBottom:14}}>
                <span style={{fontSize:11,color:'#93c5fd',cursor:'pointer'}} onClick={()=>setTab('otp')}>Forgot password?</span>
              </div>
              <button type="submit" style={{...s.btn, width:'100%', marginBottom:12}} disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>
          ) : (
            <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP}>
              <div style={s.field}>
                <label style={s.label}>Registered Email</label>
                <div style={s.inputWrap}>
                  <i className="ti ti-mail" style={s.inputIcon} />
                  <input style={s.input} type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} required disabled={otpSent} />
                </div>
              </div>
              {otpSent && (
                <div style={s.field}>
                  <label style={s.label}>Enter OTP</label>
                  <div style={s.inputWrap}>
                    <i className="ti ti-device-mobile" style={s.inputIcon} />
                    <input style={s.input} placeholder="6-digit OTP" maxLength={6} value={otp} onChange={e=>setOtp(e.target.value)} required />
                  </div>
                </div>
              )}
              <button type="submit" style={{...s.btn, width:'100%', marginBottom:12}} disabled={loading}>
                {loading ? 'Please wait…' : otpSent ? 'Verify & Sign in →' : 'Send OTP →'}
              </button>
            </form>
          )}

          <div style={{textAlign:'center',fontSize:12,color:'#566480'}}>
            Don't have an account? <Link to="/register" style={{color:'#93c5fd'}}>Create one →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  page:     { minHeight:'100vh', background:'#0f1117', display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  split:    { display:'grid', gridTemplateColumns:'1fr 1fr', width:'100%', maxWidth:880, borderRadius:16, overflow:'hidden', border:'1px solid #2a3347' },
  left:     { background:'linear-gradient(160deg,#0d1b3e 0%,#0f1117 60%,#0a1628 100%)', padding:40, display:'flex', flexDirection:'column', justifyContent:'space-between' },
  logoRow:  { display:'flex', alignItems:'center', gap:10, marginBottom:32 },
  logoMark: { width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:13, fontWeight:600 },
  brand:    { fontSize:14, fontWeight:500, color:'#e8edf5' },
  brandSub: { fontSize:11, color:'#566480' },
  heroText: { flex:1, display:'flex', flexDirection:'column', justifyContent:'center' },
  h2:       { fontSize:22, fontWeight:500, color:'#e8edf5', lineHeight:1.4, marginBottom:10 },
  p:        { fontSize:13, color:'#8b9ab5', lineHeight:1.7, marginBottom:24 },
  features: { display:'flex', flexDirection:'column', gap:10 },
  feat:     { display:'flex', alignItems:'center', gap:10 },
  featIcon: { width:26, height:26, borderRadius:6, background:'rgba(255,255,255,.05)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 },
  right:    { background:'#1c2333', padding:40, display:'flex', flexDirection:'column', justifyContent:'center' },
  tabs:     { display:'flex', gap:4, background:'#212840', borderRadius:8, padding:3, marginBottom:20 },
  tab:      { flex:1, textAlign:'center', padding:'7px', borderRadius:6, fontSize:12, fontWeight:500, cursor:'pointer', color:'#566480', transition:'all .15s' },
  tabActive:{ background:'#1e3a5f', color:'#93c5fd' },
  field:    { marginBottom:16 },
  label:    { display:'block', fontSize:11, color:'#8b9ab5', marginBottom:6, fontWeight:500, textTransform:'uppercase', letterSpacing:'.04em' },
  inputWrap:{ position:'relative' },
  inputIcon:{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', fontSize:16, color:'#566480', pointerEvents:'none' },
  input:    { paddingLeft:36, background:'#212840', border:'1px solid #2a3347', borderRadius:8, color:'#e8edf5', padding:'10px 12px 10px 36px', fontSize:13, width:'100%', outline:'none' },
  eye:      { position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#566480', cursor:'pointer', fontSize:15, padding:4 },
  btn:      { background:'#3b82f6', border:'none', borderRadius:8, color:'#fff', padding:'11px 16px', fontSize:13, fontWeight:500, cursor:'pointer' },
  error:    { background:'#3f1212', border:'1px solid rgba(239,68,68,.2)', borderRadius:8, color:'#fca5a5', padding:'10px 12px', fontSize:12, marginBottom:14 },
}