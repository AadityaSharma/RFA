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
}