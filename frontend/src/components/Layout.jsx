import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
  { to: '/',                icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { to: '/transactions',    icon: 'ti-arrows-exchange',  label: 'Transactions' },
  { to: '/agents',          icon: 'ti-robot',            label: 'AI Agents' },
  { to: '/recommendations', icon: 'ti-bulb',             label: 'Recommendations' },
  { to: '/notifications',   icon: 'ti-bell',             label: 'Notifications' },
  { to: '/feedback',        icon: 'ti-message-circle',   label: 'Feedback' },
  { to: '/profile',         icon: 'ti-user',             label: 'Profile' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/login') }

  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : 'SB'

  return (
    <div style={styles.app}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <div style={styles.logoMark}>SBI</div>
          <div>
            <div style={styles.brandName}>SBI AI Assistant</div>
            <div style={styles.brandSub}>Agentic Banking</div>
          </div>
        </div>

        <nav style={styles.nav}>
          <div style={styles.navLabel}>MAIN</div>
          {navItems.slice(0,4).map(item => (
            <NavLink key={item.to} to={item.to} end={item.to==='/'} style={({ isActive }) => ({
              ...styles.navItem, ...(isActive ? styles.navActive : {})
            })}>
              <i className={`ti ${item.icon}`} style={styles.navIcon} />
              {item.label}
            </NavLink>
          ))}
          <div style={{ ...styles.navLabel, marginTop: 12 }}>ACCOUNT</div>
          {navItems.slice(4).map(item => (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              ...styles.navItem, ...(isActive ? styles.navActive : {})
            })}>
              <i className={`ti ${item.icon}`} style={styles.navIcon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userRow}>
            <div style={styles.avatar}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={styles.userName}>{user?.first_name} {user?.last_name}</div>
              <div style={styles.userSub}>A/C ••••4821</div>
            </div>
            <button onClick={handleLogout} style={styles.logoutBtn} title="Logout">
              <i className="ti ti-logout" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        <div style={styles.content}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

const styles = {
  app:          { display:'flex', height:'100vh', background:'#0f1117', overflow:'hidden' },
  sidebar:      { width:210, background:'#161b26', borderRight:'1px solid #2a3347', display:'flex', flexDirection:'column', flexShrink:0 },
  logo:         { padding:'16px', borderBottom:'1px solid #2a3347', display:'flex', alignItems:'center', gap:10 },
  logoMark:     { width:34, height:34, borderRadius:8, background:'linear-gradient(135deg,#1d4ed8,#3b82f6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:600, flexShrink:0 },
  brandName:    { fontSize:13, fontWeight:500, color:'#e8edf5' },
  brandSub:     { fontSize:11, color:'#566480' },
  nav:          { padding:'12px 8px', flex:1, overflowY:'auto' },
  navLabel:     { fontSize:10, color:'#566480', padding:'8px 8px 4px', letterSpacing:'.08em' },
  navItem:      { display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:6, cursor:'pointer', fontSize:13, color:'#8b9ab5', textDecoration:'none', marginBottom:2, transition:'all .15s' },
  navActive:    { background:'#1e3a5f', color:'#93c5fd', border:'1px solid rgba(59,130,246,.2)' },
  navIcon:      { fontSize:16 },
  sidebarFooter:{ padding:10, borderTop:'1px solid #2a3347' },
  userRow:      { display:'flex', alignItems:'center', gap:9, padding:8, borderRadius:8 },
  avatar:       { width:30, height:30, borderRadius:'50%', background:'linear-gradient(135deg,#1d4ed8,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:600, color:'#fff', flexShrink:0 },
  userName:     { fontSize:12, fontWeight:500, color:'#e8edf5', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
  userSub:      { fontSize:11, color:'#566480' },
  logoutBtn:    { background:'none', border:'none', color:'#566480', cursor:'pointer', padding:4, fontSize:16 },
  main:         { flex:1, overflowY:'auto', background:'#0f1117' },
  content:      { padding:20 },
}