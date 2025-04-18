import React from 'react' import { NavLink, useNavigate } from 'react-router-dom' import Logo from '../assets/logo.svg'  // Place your brand logo SVG/PNG here

export default function Navbar() { const token = localStorage.getItem('token') const navigate = useNavigate() const handleLogout = () => { navigate('/logout') }

const linkClass = isActive => isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-800'

return ( <nav className="bg-white shadow"> <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"> <div className="flex justify-between h-16">

{/* Left: Logo & Brand */}
      <div className="flex items-center space-x-3">
        <img src={Logo} alt="Logo" className="h-8 w-auto" />
        <span className="text-xl font-bold text-gray-800">NTT Data</span>
      </div>

      {/* Right: Navigation Links */}
      <div className="flex items-center space-x-6">
        {token ? (
          <>               
            <NavLink to="/dashboard" className={({ isActive }) => linkClass(isActive)}>
              Dashboard
            </NavLink>
            <NavLink to="/forecast" className={({ isActive }) => linkClass(isActive)}>
              Forecast
            </NavLink>
            <NavLink to="/opportunities" className={({ isActive }) => linkClass(isActive)}>
              Opportunities
            </NavLink>
            <NavLink to="/insights" className={({ isActive }) => linkClass(isActive)}>
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
            <NavLink to="/login" className={({ isActive }) => linkClass(isActive)}>
              Log In
            </NavLink>
            <NavLink to="/signup" className={({ isActive }) => linkClass(isActive)}>
              Sign Up
            </NavLink>
          </>
        )}
      </div>
    </div>
  </div>
</nav>

) }

