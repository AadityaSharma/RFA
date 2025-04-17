import React, { useEffect, useState } from 'react';
import { fetchProjects, fetchEntries, upsertEntry } from '../services/api';

export default function Opportunities(){
  const [projects,setProjects] = useState([]);
  const [year] = useState(new Date().getFullYear());
  const [month,setMonth] = useState(new Date().getMonth()+1);
  const [grid,setGrid] = useState([]);

  useEffect(()=>{ fetchProjects().then(r=>setProjects(r.data)); },[]);
  useEffect(()=> load(), [projects, month]);

  const load = () => {
    fetchEntries({ year, month, type:'opportunity' }).then(r=> {
      const map = r.data.reduce((a,e)=> ({ ...a, [e.projectId]: e }), {});
      setGrid(projects.map(p=>({
        project: p, entry: map[p._id] || { valueMillion:0, probability:'', status:'In-progress'}
      })));
    });
  };

  const save = async (pId, val, prob, stat) => {
    const fd = new FormData();
    fd.append('projectId', pId);
    fd.append('year', year);
    fd.append('month', month);
    fd.append('type', 'opportunity');
    fd.append('valueMillion', val);
    fd.append('probability', prob);
    fd.append('status', stat);
    await upsertEntry(fd);
    load();
  };

  const locked = new Date().getDate() > (new Date(year, month, 0).getDate() - 2);

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Opportunities</h1>
      <div className="mb-4">
        Month:
        <input type="number" value={month}
          onChange={e=>setMonth(e.target.value)}
          className="ml-2 p-1 border rounded w-20"/>
      </div>
      <table className="w-full border">
        <thead><tr className="bg-gray-100">
          <th>Project</th><th>Value (M)</th><th>Probability</th><th>Status</th>
        </tr></thead>
        <tbody>
          {grid.map(({project,entry})=>(
            <tr key={project._id} className={`border-t ${entry.status!=='In-progress'?'bg-gray-200':''}`}>
              <td className="p-2">{project.name}</td>
              <td className="p-2">
                <input type="number" step="0.1" defaultValue={entry.valueMillion}
                  disabled={locked || entry.status!=='In-progress'}
                  onBlur={e=>save(project._id,e.target.value,entry.probability,entry.status)}
                  className="w-24 p-1 border rounded"/>
              </td>
              <td className="p-2">
                <select defaultValue={entry.probability} disabled={locked || entry.status!=='In-progress'}
                  onBlur={e=>save(project._id,entry.valueMillion,e.target.value,entry.status)}
                  className="border p-1 rounded">
                  <option value="">—</option>
                  {['A','B','C','D','E'].map(x=> <option key={x} value={x}>{x}</option>)}
                </select>
              </td>
              <td className="p-2">
                <select defaultValue={entry.status} onBlur={e=>save(project._id,entry.valueMillion,entry.probability,e.target.value)}
                  className="border p-1 rounded">
                  {['In-progress','Won','Abandoned'].map(s=> <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}