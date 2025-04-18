// src/services/api.js
import axios from 'axios'

// ————————————————————————————————————————————
// create one axios instance for all calls
// ————————————————————————————————————————————
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
})

// ————————————————————————————————————————————
// attach bearer token if present
// ————————————————————————————————————————————
API.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// ————————————————————————————————————————————
// on 401, drop token + bounce to login
// ————————————————————————————————————————————
API.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.replace('/login')
    }
    return Promise.reject(err)
  }
)

// ————————————————————————————————————————————
// auth
// ————————————————————————————————————————————
export const signup = data => API.post('/auth/signup', data)
export const login  = data => API.post('/auth/login',  data)

// ————————————————————————————————————————————
// project admin
// ————————————————————————————————————————————
export const createProject   = data => API.post('/projects', data)
export const assignManagers  = (id, managerIds) =>
  API.put(`/projects/${id}/assign`, { managerIds })
export const setAOP           = (id, aopData) =>
  API.put(`/projects/${id}/aop`, aopData)

// ————————————————————————————————————————————
// actuals import/export
// ————————————————————————————————————————————
export const importActuals = file => {
  const fd = new FormData()
  fd.append('file', file)
  return API.post('/actuals/import', fd)
}
export const exportActuals = () =>
  API.get('/actuals/export', { responseType: 'blob' })

// ————————————————————————————————————————————
// new‑FY CSV upload
// ————————————————————————————————————————————
export const newFY = file => {
  const fd = new FormData()
  fd.append('file', file)
  return API.post('/admin/newfy', fd)
}

// ————————————————————————————————————————————
// dashboard
// ————————————————————————————————————————————
export const fetchDashboard = params =>
  API.get('/dashboard/summary', { params })

// ————————————————————————————————————————————
// forecast & opportunities entries
// ————————————————————————————————————————————
export function fetchYears(type) {
  return API.get(`/entries/years?type=${type}`)
}

export function fetchProjects() {
  return API.get('/projects')
}

export function fetchEntries({ type, year }) {
  return API.get(`/entries?type=${type}&year=${year}`)
}

export function exportEntries(type, year) {
  return API.get(
    `/entries/export?type=${type}&year=${year}`,
    { responseType: 'blob' }
  )
}

/**
 * Bulk‐upsert: send an array of entry objects
 * payload: { entries, type, year }
 */
export function upsertEntries({ entries, type, year }) {
  return API.post(`/entries?type=${type}&year=${year}`, { entries })
}

/**
 * Convenience: upsert one or more entries
 * entryOrArray: object or array
 * type: 'forecast' or 'opportunity'
 * year: number|string
 */
export function upsertEntry(entryOrArray, type, year) {
  const entries = Array.isArray(entryOrArray)
    ? entryOrArray
    : [entryOrArray]

  return API.post(
    '/entries',
    { entries },
    { params: { type, year } }
  )
}

export default API