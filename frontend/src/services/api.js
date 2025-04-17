// frontend/src/services/api.js
import axios from 'axios';
const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use(req => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

export const login = creds => API.post('/auth/login', creds);
export const fetchProjects = () => API.get('/projects');
export const assignProject = (id,mgrs) => API.put(`/projects/${id}/assign`,{managerIds:mgrs});
export const fetchEntries = q => API.get('/entries',{params:q});
export const saveEntry = formData => API.post('/entries', formData);
export const fetchVersions = id => API.get(`/entries/${id}/versions`);
export const importActuals = file => {
  const fd=new FormData(); fd.append('file',file);
  return API.post('/actuals/import', fd);
};
export const fetchDashboard = q => API.get('/dashboard/summary',{params:q});

export const createProject = data => API.post('/projects', data);
export const setAOPTarget = ({ projectId, year, month, valueMillion }) =>
  API.put(`/projects/${projectId}/aop`, { year, month, valueMillion });

// Export CSV/XLSX endpoints
export const exportActuals = () =>
  API.get('/actuals/export', { responseType: 'blob' });

export const exportEntries = type =>
  API.get('/entries/export', {
    params: { type },
    responseType: 'blob'
  });