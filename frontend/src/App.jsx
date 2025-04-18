import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar        from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Login         from './pages/Login'
import Signup        from './pages/Signup'
import Logout        from './pages/Logout'
import Dashboard     from './pages/Dashboard'
import Forecast      from './pages/Forecast'
import Opportunities from './pages/Opportunities'
import NewFY         from './pages/NewFY'
import Actuals       from './pages/Actuals'
import Insights      from './pages/Insights'

export default function App() {
  return (
    <>
      <Navbar />

      <Routes>
        {/* Public */}
        <Route path="/login"  element={<Login/>} />
        <Route path="/signup" element={<Signup/>} />
        <Route path="/logout" element={<Logout/>} />

        {/* Everything below here is protected */}
        <Route element={<ProtectedRoute/>}>
          <Route path="/"            element={<Navigate to="/dashboard" replace/>} />
          <Route path="/dashboard"   element={<Dashboard/>} />
          <Route path="/forecast"    element={<Forecast/>} />
          <Route path="/opportunities" element={<Opportunities/>} />
          <Route path="/new-fy"      element={<NewFY/>} />
          <Route path="/actuals"     element={<Actuals/>} />
          <Route path="/insights"    element={<Insights/>} />
        </Route>

        {/* Catch‑all: redirect to login or dashboard */}
        <Route
          path="*"
          element={
            localStorage.getItem('token')
              ? <Navigate to="/dashboard" replace/>
              : <Navigate to="/login"     replace/>
          }
        />
      </Routes>
    </>
  )
}