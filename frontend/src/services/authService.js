import axios from 'axios'

const BASE = '/api'

const authHeaders = (token) => ({ headers: { Authorization: `Bearer ${token}` } })

const authService = {
  register: async (data) => {
    const res = await axios.post(`${BASE}/auth/register`, data)
    return res.data
  },
  login: async (cif_number, password) => {
    const res = await axios.post(`${BASE}/auth/login`, { cif_number, password })
    return res.data
  },
  sendOTP: async (email) => {
    const res = await axios.post(`${BASE}/auth/send-otp`, { email })
    return res.data
  },
  verifyOTP: async (email, otp) => {
    const res = await axios.post(`${BASE}/auth/verify-otp`, { email, otp })
    return res.data
  },
  getMe: async (token) => {
    const res = await axios.get(`${BASE}/auth/me`, authHeaders(token))
    return res.data.user
  },
}

export default authService