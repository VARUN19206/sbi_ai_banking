import axios from 'axios'

const BASE = '/api'
const h = (token) => ({ headers: { Authorization: `Bearer ${token}` } })

export const transactionService = {
  getAll:      (token, params={}) => axios.get(`${BASE}/transactions`, { ...h(token), params }).then(r => r.data),
  getSummary:  (token)            => axios.get(`${BASE}/transactions/summary`, h(token)).then(r => r.data),
  getCategories:(token, month)    => axios.get(`${BASE}/transactions/categories`, { ...h(token), params: { month } }).then(r => r.data),
}

export const aiService = {
  getRecommendations: (token, params={}) => axios.get(`${BASE}/recommendations`, { ...h(token), params }).then(r => r.data),
  triggerRun:         (token)            => axios.post(`${BASE}/recommendations/run`, {}, h(token)).then(r => r.data),
  markRead:           (token, id)        => axios.put(`${BASE}/recommendations/${id}/read`, {}, h(token)).then(r => r.data),
  dismiss:            (token, id)        => axios.put(`${BASE}/recommendations/${id}/dismiss`, {}, h(token)).then(r => r.data),
  getAgentStatus:     (token)            => axios.get(`${BASE}/agents/status`, h(token)).then(r => r.data),
}

export const notificationService = {
  getAll:      (token) => axios.get(`${BASE}/notifications`, h(token)).then(r => r.data),
  markAllRead: (token) => axios.put(`${BASE}/notifications/read-all`, {}, h(token)).then(r => r.data),
  markOneRead: (token, id) => axios.put(`${BASE}/notifications/${id}/read`, {}, h(token)).then(r => r.data),
}

export const feedbackService = {
  submit:     (token, data) => axios.post(`${BASE}/feedback`, data, h(token)).then(r => r.data),
  getStats:   (token)       => axios.get(`${BASE}/feedback/stats`, h(token)).then(r => r.data),
}

export const userService = {
  getProfile:     (token)       => axios.get(`${BASE}/users`, h(token)).then(r => r.data),
  updateProfile:  (token, data) => axios.put(`${BASE}/users`, data, h(token)).then(r => r.data),
  changePassword: (token, data) => axios.put(`${BASE}/users/change-password`, data, h(token)).then(r => r.data),
}