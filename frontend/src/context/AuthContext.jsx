import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [token, setToken]     = useState(() => localStorage.getItem('sbi_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      api.getMe(token)
        .then(u => setUser(u))
        .catch(() => { localStorage.removeItem('sbi_token'); setToken(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  const login = (tok, userData) => {
    localStorage.setItem('sbi_token', tok)
    setToken(tok)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('sbi_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)