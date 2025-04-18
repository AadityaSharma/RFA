// frontend/src/App.jsx
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar       from './components/Navbar'
import Dashboard    from './pages/Dashboard'
import Forecast     from './pages/Forecast'
import Opportunities from './pages/Opportunities'
import NewFY        from './pages/NewFY'
import Actuals      from './pages/Actuals'
import Insights     from './pages/Insights'
import Login        from './pages/Login'
import Signup       from './pages/Signup'
import Logout       from './pages/Logout'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />
+       <Route path="/logout" element={<Logout />} />

        {/* All others require auth */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/forecast"
          element={
            <ProtectedRoute>
              <Forecast />
            </ProtectedRoute>
          }
        />
        <Route
          path="/opportunities"
          element={
            <ProtectedRoute>
              <Opportunities />
            </ProtectedRoute>
          }
        />
        <Route
          path="/new-fy"
          element={
            <ProtectedRoute>
              <NewFY />
            </ProtectedRoute>
          }
        />
        <Route
          path="/actuals"
          element={
            <ProtectedRoute>
              <Actuals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <Insights />
            </ProtectedRoute>
          }
        />

        {/* catch‑all redirect to dashboard (or login) */}
        <Route
          path="*"
          element={
            localStorage.getItem('token')
              ? <Navigate to="/dashboard" replace />
              : <Navigate to="/login"     replace />
          }
        />
      </Routes>
    </BrowserRouter>
  )
}