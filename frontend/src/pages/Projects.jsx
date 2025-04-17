// frontend/src/pages/Projects.jsx
import React from 'react';
import { useEffect, useState } from 'react';
import { fetchProjects, assignProject } from '../services/api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  useEffect(()=>{ fetchProjects().then(r=>setProjects(r.data)); },[]);
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Projects</h1>
      <table className="w-full border">
        <thead>
          <tr><th>Name</th><th>Managers</th></tr>
        </thead>
        <tbody>
          {projects.map(p=>(
            <tr key={p._id} className="border-t">
              <td className="p-2">{p.name}</td>
              <td className="p-2">
                {p.managers.map(m=>m.name).join(', ')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}