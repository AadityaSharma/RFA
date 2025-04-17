import axios from 'axios';
// const API = axios.create({ baseURL: 'http://localhost:5000/api' });

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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
export const fetchEntries = q => API.get('/entries',{params:q});
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

export const fetchYears = (type='forecast') =>
  API.get(`/entries/years?type=${type}`);

export const fetchProjects = () =>
  API.get('/projects');

export const upsertEntry = payload =>
  API.post('/entries', payload);

export const exportEntries = (type, year) =>
  API.get(`/entries/export?type=${type}&year=${year}`, {
    responseType: 'blob'
  });

export default API;