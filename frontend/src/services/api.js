import axios from 'axios';
// const API = axios.create({ baseURL: 'http://localhost:5000/api' });

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true
});

API.interceptors.request.use(req => {
  const t = localStorage.getItem('token');
  if (t) req.headers.Authorization = `Bearer ${t}`;
  return req;
});
export const signup = data => API.post('/auth/signup', data);
export const login = data => API.post('/auth/login', data);
export const createProject = d => API.post('/projects', d);
export const assignManagers = (id, m) => API.put(`/projects/${id}/assign`, { managerIds: m });
export const setAOP = (id, d) => API.put(`/projects/${id}/aop`, d);
export const importActuals = file => {
  const fd = new FormData(); fd.append('file',file);
  return API.post('/actuals/import', fd);
};
export const exportActuals = () => API.get('/actuals/export',{responseType:'blob'});
export const newFY = file => {
  const fd = new FormData(); fd.append('file',file);
  return API.post('/admin/newfy', fd);
};
export const fetchDashboard = q => API.get('/dashboard/summary',{params:q});



/**
 * Fetch available years for a given entry type (forecast or opportunities)
 */
export function fetchYears(type) {
  return axios.get(`/entries/years?type=${type}`);
}

/**
 * Fetch all projects (used to populate dropdowns or new rows)
 */
export function fetchProjects() {
  return axios.get('/projects');
}

/**
 * Fetch all entries for a given type and year
 */
export function fetchEntries({ type, year }) {
  return axios.get(`/entries?type=${type}&year=${year}`);
}

/**
 * Export entries as CSV (returns blob)
 */
export function exportEntries(type, year) {
  return axios.get(`/entries/export?type=${type}&year=${year}`, {
    responseType: 'blob'
  });
}

/**
 * Upsert one or more entries in bulk
 * We expect payload.entries to be an array of entry objects
 */
export function upsertEntries({ type, year, entries }) {
  return axios.post(`/entries?type=${type}&year=${year}`, { entries });
}

// For convenience, alias single-entry upsert
export function upsertEntry(entry) {
  const { type, year, ...rest } = entry;
  return upsertEntries({ type, year, entries: [rest] });
}

export default API;