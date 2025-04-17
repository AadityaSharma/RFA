import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Forecast from './pages/Forecast';
import Opportunities from './pages/Opportunities';
import Admin from './pages/Admin';
import NewFY from './pages/NewFY';

export default function App(){
  return (
    <>
      <Navbar/>
      <Routes>
        <Route path="/login" element={<Login/>}/>
        <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
        <Route path="/forecast" element={<ProtectedRoute><Forecast/></ProtectedRoute>}/>
        <Route path="/opportunities" element={<ProtectedRoute><Opportunities/></ProtectedRoute>}/>
        <Route path="/admin" element={<ProtectedRoute><Admin/></ProtectedRoute>}/>
        <Route path="/newfy" element={<ProtectedRoute><NewFY/></ProtectedRoute>}/>
      </Routes>
    </>
  );
}