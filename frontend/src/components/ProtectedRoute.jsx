import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'

export default function ProtectedRoute() {
  const token = localStorage.getItem('token')
  return token
    ? <Outlet/>                     // render the matching child route
    : <Navigate to="/login" replace/>  // otherwise kick to login
}