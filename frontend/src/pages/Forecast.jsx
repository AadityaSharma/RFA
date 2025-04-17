import React, { useEffect, useState } from 'react';
import { fetchProjects, fetchEntries, upsertEntry } from '../services/api';

export default function Forecast(){
  const [projects,setProjects] = useState([]);
  const [year] = useState(new Date().getFullYear());
  const [month,setMonth] = useState(new Date().getMonth()+1);
  const [grid,setGrid] = useState([]);

  useEffect(()=>{ fetchProjects().then(r=>setProjects(r.data)); },[]);
  useEffect(()=> load(), [projects, month]);

  const load = () => {
    fetchEntries({ year, month, type:'forecast' }).then(r=> {
      const map = r.data.reduce((a,e)=> ({ ...a, [e.projectId]: e }), {});
      setGrid(projects.map(p=>({
        project: p, entry: map[p._id] || { valueMillion:0, snapshotURL:'' }
      })));
    });
  };

  const save = async (pid, val, file) => {
    const fd = new FormData();
    fd.append('projectId', pid);
    fd.append('year', year);
    fd.append('month', month);
    fd.append('type', 'forecast');
    fd.append('valueMillion', val);
    if (file) fd.append('snapshot', file);
    await upsertEntry(fd);
    load();
  };

  // freeze if within 2 days of month-end
  const locked = new Date().getDate() > (new Date(year, month, 0).getDate() - 2);

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Forecast</h1>
      <div className="mb-4">
        Month:
        <input type="number" value={month}
          onChange={e=>setMonth(e.target.value)}
          className="ml-2 p-1 border rounded w-20"/>
      </div>
      <table className="w-full border">
        <thead><tr className="bg-gray-100"><th>Project</th><th>Value (M)</th><th>Snapshot</th></tr></thead>
        <tbody>
          {grid.map(({project,entry})=>(
            <tr key={project._id} className="border-t">
              <td className="p-2">{project.name}</td>
              <td className="p-2">
                <input type="number" step="0.1" defaultValue={entry.valueMillion}
                  disabled={locked}
                  onBlur={e=>save(project._id, e.target.value, null)}
                  className="w-24 p-1 border rounded"/>
              </td>
              <td className="p-2">
                <input type="file" disabled={locked}
                  onChange={e=>save(project._id, entry.valueMillion, e.target.files[0])}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}