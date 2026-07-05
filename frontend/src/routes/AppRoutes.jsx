import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Login           from '../pages/Login.jsx'
import Register        from '../pages/Register.jsx'
import Dashboard       from '../pages/Dashboard.jsx'
import Transactions    from '../pages/Transactions.jsx'
import Recommendations from '../pages/Recommendations.jsx'
import Notifications   from '../pages/Notifications.jsx'
import Feedback        from '../pages/Feedback.jsx'
import Profile         from '../pages/Profile.jsx'
import Agents          from '../pages/Agents.jsx'
import Layout          from '../components/Layout.jsx'

const Private = ({ children }) => {
  const { token, loading } = useAuth()
  if (loading) return (
    <div style={{ color:'#8b9ab5', padding:'40px', textAlign:'center' }}>
      Loading…
    </div>
  )
  return token ? children : <Navigate to="/login" replace />
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Private><Layout /></Private>}>
        <Route index                   element={<Dashboard />} />
        <Route path="transactions"     element={<Transactions />} />
        <Route path="recommendations"  element={<Recommendations />} />
        <Route path="notifications"    element={<Notifications />} />
        <Route path="feedback"         element={<Feedback />} />
        <Route path="profile"          element={<Profile />} />
        <Route path="agents"           element={<Agents />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}