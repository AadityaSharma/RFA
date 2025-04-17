import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Navbar(){
  const nav = useNavigate();
  const logout = () => {
    localStorage.removeItem('token');
    nav('/login');
  };
  return (
    <nav className="bg-gray-800 text-white px-4 py-2 flex justify-between">
      <div className="space-x-4">
        <Link to="/" className="hover:underline">Dashboard</Link>
        <Link to="/forecast" className="hover:underline">Forecast</Link>
        <Link to="/opportunities" className="hover:underline">Opportunities</Link>
        <Link to="/admin" className="hover:underline">Admin</Link>
      </div>
      <button onClick={logout} className="hover:underline">Logout</button>
    </nav>
  );
}