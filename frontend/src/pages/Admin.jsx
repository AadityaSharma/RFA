import React, { useState } from 'react';
import {
  createProject, assignManagers, setAOP,
  importActuals, exportActuals
} from '../services/api';

export default function Admin(){
  const [proj, setProj] = useState({ name:'', description:'' });
  const [assign, setAssign] = useState({ projectId:'', managerIds:'' });
  const [target, setTarget] = useState({ projectId:'', year:'', month:'', valueMillion:'' });
  const [file, setFile] = useState(null);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl">Admin Panel</h1>
      {/* Create Project */}
      <div>
        <h2 className="text-xl">Create Project</h2>
        <input placeholder="Name" value={proj.name} onChange={e=>setProj({...proj,name:e.target.value})}
          className="border p-1 rounded mr-2"/>
        <input placeholder="Description" value={proj.description} onChange={e=>setProj({...proj,description:e.target.value})}
          className="border p-1 rounded mr-2"/>
        <button onClick={()=>createProject(proj)} className="px-3 py-1 bg-blue-600 text-white rounded">Create</button>
      </div>
      {/* Assign Managers */}
      <div>
        <h2 className="text-xl">Assign Managers</h2>
        <input placeholder="Project ID" value={assign.projectId}
          onChange={e=>setAssign({...assign,projectId:e.target.value})}
          className="border p-1 rounded mr-2"/>
        <input placeholder="Comma-separated Manager IDs"
          value={assign.managerIds}
          onChange={e=>setAssign({...assign,managerIds:e.target.value})}
          className="border p-1 rounded mr-2"/>
        <button onClick={()=>assignManagers(assign.projectId,assign.managerIds.split(','))}
          className="px-3 py-1 bg-blue-600 text-white rounded">Assign</button>
      </div>
      {/* Set AOP */}
      <div>
        <h2 className="text-xl">Set AOP Target</h2>
        <input placeholder="Project ID" onChange={e=>setTarget({...target,projectId:e.target.value})}
          className="border p-1 rounded mr-2"/>
        <input type="number" placeholder="Year" onChange={e=>setTarget({...target,year:e.target.value})}
          className="border p-1 rounded mr-2 w-24"/>
        <input type="number" placeholder="Month" onChange={e=>setTarget({...target,month:e.target.value})}
          className="border p-1 rounded mr-2 w-24"/>
        <input type="number" step="0.1" placeholder="Value M"
          onChange={e=>setTarget({...target,valueMillion:e.target.value})}
          className="border p-1 rounded mr-2 w-32"/>
        <button onClick={()=>setAOP(target.projectId, target)}
          className="px-3 py-1 bg-blue-600 text-white rounded">Set</button>
      </div>
      {/* Import/Export Actuals */}
      <div>
        <h2 className="text-xl">Actuals Import/Export</h2>
        <input type="file" accept=".csv,.xlsx" onChange={e=>setFile(e.target.files[0])}
          className="mr-2"/>
        <button onClick={()=>importActuals(file)} className="px-3 py-1 bg-green-600 text-white rounded mr-2">Upload</button>
        <button onClick={exportActuals} className="px-3 py-1 bg-yellow-600 text-white rounded">Download</button>
      </div>
    </div>
  );
}