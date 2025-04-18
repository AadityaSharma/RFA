/* 
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';

export default function Login(){
  const nav = useNavigate();
  const [form,setForm] = useState({ email:'', password:'' });
  const submit = async e => {
    e.preventDefault();
    const { data } = await login(form);
    localStorage.setItem('token', data.token);
    nav('/');
  };
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="p-6 bg-white rounded shadow w-80">
        <h1 className="text-xl mb-4">Login</h1>
        <input type="email" placeholder="Email" required value={form.email}
          onChange={e=>setForm({...form,email:e.target.value})}
          className="w-full mb-2 p-2 border rounded" />
        <input type="password" placeholder="Password" required value={form.password}
          onChange={e=>setForm({...form,password:e.target.value})}
          className="w-full mb-4 p-2 border rounded" />
        <button type="submit" className="w-full p-2 bg-blue-600 text-white rounded">
          Sign In
        </button>
      </form>
    </div>
  );
} */


// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg]           = useState('');
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    try {
      const { data } = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      nav('/forecast');
    } catch (err) {
      setMsg('Login failed');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-2xl mb-4">Log In</h2>
      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e=>setEmail(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e=>setPassword(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">
          Log In
        </button>
      </form>
      {msg && <p className="mt-4 text-center">{msg}</p>}
    </div>
  );
}