// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Entries from './pages/Entries';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login/>}/>
      <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
      <Route path="/projects" element={<ProtectedRoute><Projects/></ProtectedRoute>}/>
      <Route path="/entries" element={<ProtectedRoute><Entries/></ProtectedRoute>}/>
    </Routes>
  );
}