// frontend/src/pages/Entries.jsx
import { useEffect,useState } from 'react';
import { fetchEntries, saveEntry, fetchProjects } from '../services/api';

export default function Entries() {
  const [projects, setProjects] = useState([]);
  const [month, setMonth] = useState(new Date().getMonth()+1);
  const [year] = useState(new Date().getFullYear());
  const [type, setType] = useState('forecast');
  const [grid, setGrid] = useState([]);
  useEffect(()=>{
    fetchProjects().then(r=>setProjects(r.data));
  },[]);
  useEffect(()=>load(),[projects,month,type]);
  const load=()=>{
    fetchEntries({ year, month, type })
      .then(r=>{
        const m=r.data.reduce((a,e)=>({
          ...a,[e.projectId]:e
        }),{});
        setGrid(projects.map(p=>m[p._id]||{ projectId:p._id, valueMillion:0 }));
      });
  };
  const onChange=(idx,v)=>{
    const row=grid[idx];
    const fd=new FormData();
    fd.append('projectId', row.projectId);
    fd.append('month', month);
    fd.append('year', year);
    fd.append('type', type);
    fd.append('valueMillion', v);
    saveEntry(fd).then(()=>load());
  };
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Entries</h1>
      <div className="mb-4 flex space-x-2">
        <select value={type} onChange={e=>setType(e.target.value)}
          className="p-2 border rounded">
          <option value="forecast">Forecast</option>
          <option value="opportunity">Opportunity</option>
        </select>
        <input type="number" value={month}
          onChange={e=>setMonth(e.target.value)}
          className="p-2 border rounded w-20" />
      </div>
      <table className="w-full border">
        <thead><tr><th>Project</th><th>Value (M)</th></tr></thead>
        <tbody>
          {grid.map((r,i)=>(
            <tr key={r.projectId} className="border-t">
              <td className="p-2">{projects.find(p=>p._id===r.projectId)?.name}</td>
              <td className="p-2">
                <input type="number" step="0.1"
                  value={r.valueMillion}
                  onChange={e=>onChange(i,e.target.value)}
                  className="w-24 p-1 border rounded"/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}