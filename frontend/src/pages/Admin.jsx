import React from 'react';
import { useState, useEffect } from 'react';
import {
  fetchProjects,
  assignProject,
  importActuals,
  // new endpoints:
  createProject,
  setAOPTarget
} from '../services/api';

export default function Admin() {
  const [projects, setProjects] = useState([]);
  const [file, setFile] = useState(null);
  const [newProj, setNewProj] = useState({ name:'', description:'' });
  const [target, setTarget] = useState({ projectId:'', year:'', month:'', valueMillion:'' });
  const [assign, setAssign] = useState({ projectId:'', managerIds:[] });

  useEffect(() => {
    fetchProjects().then(r=>setProjects(r.data));
  }, []);

  const onImport = async () => {
    await importActuals(file);
    alert('Actuals imported');
  };

  const onCreate = async () => {
    await createProject(newProj);
    setNewProj({ name:'', description:'' });
    fetchProjects().then(r=>setProjects(r.data));
  };

  const onSetTarget = async () => {
    await setAOPTarget(target);
    alert('AOP Target set');
  };

  const onAssign = async () => {
    await assignProject(assign.projectId, assign.managerIds);
    alert('Assigned');
  };

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl">Admin Panel</h1>

      {/* 1. Create Project */}
      <div className="space-y-2">
        <h2 className="text-xl">New Project</h2>
        <input className="border p-2 rounded w-64" placeholder="Name"
          value={newProj.name} onChange={e=>setNewProj({...newProj,name:e.target.value})}/>
        <input className="border p-2 rounded w-64" placeholder="Description"
          value={newProj.description}
          onChange={e=>setNewProj({...newProj,description:e.target.value})}/>
        <button onClick={onCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
      </div>

      {/* 2. Assign Managers */}
      <div className="space-y-2">
        <h2 className="text-xl">Assign Managers</h2>
        <select
          className="border p-2 rounded"
          onChange={e=>setAssign({...assign, projectId:e.target.value})}
        >
          <option value="">Select Project</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <input
          className="border p-2 rounded w-64"
          placeholder="Comma‑separated manager IDs"
          value={assign.managerIds.join(',')}
          onChange={e=>setAssign({...assign, managerIds: e.target.value.split(',')})}
        />
        <button onClick={onAssign}
          className="px-4 py-2 bg-blue-600 text-white rounded">Assign</button>
      </div>

      {/* 3. Set AOP Target */}
      <div className="space-y-2">
        <h2 className="text-xl">Set AOP Target</h2>
        <select
          className="border p-2 rounded"
          onChange={e=>setTarget({...target, projectId:e.target.value})}
        >
          <option value="">Select Project</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>
        <input className="border p-2 rounded w-24" type="number" placeholder="Year"
          onChange={e=>setTarget({...target, year:e.target.value})}/>
        <input className="border p-2 rounded w-24" type="number" placeholder="Month"
          onChange={e=>setTarget({...target, month:e.target.value})}/>
        <input className="border p-2 rounded w-32" type="number" step="0.1" placeholder="Value M"
          onChange={e=>setTarget({...target, valueMillion:e.target.value})}/>
        <button onClick={onSetTarget}
          className="px-4 py-2 bg-blue-600 text-white rounded">Set Target</button>
      </div>

      {/* 4. Import Actuals */}
      <div className="space-y-2">
        <h2 className="text-xl">Import Actuals (CSV/XLSX)</h2>
        <input type="file"
          accept=".csv,.xlsx"
          onChange={e=>setFile(e.target.files[0])}/>
        <button onClick={onImport}
          className="px-4 py-2 bg-green-600 text-white rounded">Upload</button>
      </div>
    </div>
  );
}