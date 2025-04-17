// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar          from './components/Navbar';
import Dashboard       from './pages/Dashboard';
import Forecast        from './pages/Forecast';
import Opportunities   from './pages/Opportunities';
import NewFY           from './pages/NewFY';
import Login           from './pages/Login';
import Signup          from './pages/Signup';
import Actuals from './pages/Actuals';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/new-fy" element={<NewFY />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/actuals" element={<Actuals />} />
      </Routes>
    </BrowserRouter>
  );
}