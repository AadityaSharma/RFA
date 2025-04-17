// frontend/src/App.jsx
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Projects from './pages/Projects';
import Entries from './pages/Entries';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

 export default function App() {
   return (
    <>
      <Navbar/>
       <Routes>
        <Route path="/signup" element={<Signup/>}/>
         <Route path="/login" element={<Login/>}/>
         <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>}/>
         <Route path="/projects" element={<ProtectedRoute><Projects/></ProtectedRoute>}/>
         <Route path="/entries" element={<ProtectedRoute><Entries/></ProtectedRoute>}/>
        <Route path="/admin" element={<ProtectedRoute><Admin/></ProtectedRoute>}/>
       </Routes>
    </>
   );
 }