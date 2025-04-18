// frontend/src/components/ProtectedRoute.jsx
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

/**
 * Wrap any page that requires authentication.
 * If no JWT token in localStorage, redirect to /login.
 */
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  const location = useLocation()

  if (!token) {
    // remember where the user wanted to go, so you can redirect after login if desired
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}