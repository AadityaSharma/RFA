import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../services/api';

export default function Signup() {
  const [form, setForm] = useState({ name:'', email:'', password:'', role:'manager' });
  const nav = useNavigate();

  const submit = async e => {
    e.preventDefault();
    await signup(form);
    nav('/login');
  };

  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="p-6 bg-white rounded shadow w-80">
        <h1 className="text-xl mb-4">Sign Up</h1>
        {['name','email','password'].map(field => (
          <input
            key={field}
            type={field==='password'?'password':'text'}
            placeholder={field.charAt(0).toUpperCase()+field.slice(1)}
            value={form[field]}
            onChange={e=>setForm({...form,[field]:e.target.value})}
            className="w-full mb-2 p-2 border rounded"
          />
        ))}
        <select
          value={form.role}
          onChange={e=>setForm({...form,role:e.target.value})}
          className="w-full mb-4 p-2 border rounded"
        >
          <option value="manager">Delivery Manager</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit"
          className="w-full p-2 bg-green-600 text-white rounded">
          Create Account
        </button>
      </form>
    </div>
  );
}