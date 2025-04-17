// frontend/src/components/Navbar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-gray-800 text-white p-3 flex space-x-4">
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/forecast">Forecast</NavLink>
      <NavLink to="/opportunities">Opportunities</NavLink>
      <NavLink to="/new-fy">New FY</NavLink>
      <NavLink to="/actuals">Actuals</NavLink>
      <div className="ml-auto">
        <button onClick={()=>{/* logout logic */}}>Logout</button>
      </div>
    </nav>
  );
}