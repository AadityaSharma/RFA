// src/services/auth.js
import axios from 'axios'

export function login(creds) {
  return axios.post('/api/auth/login', creds)
    .then(res => {
      const tok = res.data.token
      localStorage.setItem('token', tok)
      axios.defaults.headers.common['Authorization'] = `Bearer ${tok}`
      return res
    })
}

export function signup(creds) {
  return axios.post('/api/auth/signup', creds)
    .then(res => {
      const tok = res.data.token
      localStorage.setItem('token', tok)
      axios.defaults.headers.common['Authorization'] = `Bearer ${tok}`
      return res
    })
}

export function logout() {
  localStorage.removeItem('token')
  delete axios.defaults.headers.common['Authorization']
}