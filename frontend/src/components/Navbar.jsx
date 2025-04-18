// frontend/src/components/Navbar.jsx 
import React from 'react'; 
import { NavLink, useNavigate } from 'react-router-dom'; 
// import Logo from '../assets/logo.svg';

export default function Navbar() { const token = localStorage.getItem('token'); const navigate = useNavigate();

const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };

const linkClass = ({ isActive }) => isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-800';

return ( <nav className="bg-white shadow"> <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div className="flex justify-between h-16 items-center">

{/* Left: Logo & Brand */}
      <div className="flex items-center space-x-3">
        { /* <img src={Logo} alt="NTT Data Logo" className="h-8 w-auto" /> */ }
        <span className="text-xl font-bold text-gray-800">NTT Data</span>
      </div>

      {/* Right: Navigation Links */}
      <div className="flex items-center space-x-6">
        {token ? (
          <>
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/forecast" className={linkClass}>
              Forecast
            </NavLink>
            <NavLink to="/opportunities" className={linkClass}>
              Opportunities
            </NavLink>
            <NavLink to="/insights" className={linkClass}>
              Insights
            </NavLink>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className={linkClass}>
              Log In
            </NavLink>
            <NavLink to="/signup" className={linkClass}>
              Sign Up
            </NavLink>
          </>
        )}
      </div>
    </div>
  </div>
</nav>

); }

