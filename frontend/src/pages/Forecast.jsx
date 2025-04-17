// frontend/src/pages/Forecast.jsx
import React, { useEffect, useState } from 'react';
import {
  fetchYears,
  fetchProjects,
  fetchEntries,
  upsertEntry,
  exportEntries
} from '../services/api';

const MONTH_ORDER  = [4,5,6,7,8,9,10,11,12,1,2,3];
const MONTH_LABELS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

export default function Forecast() {
  const [years, setYears]       = useState([]);
  const [fy,    setFy]          = useState(null);
  const [projects, setProjects] = useState([]);
  const [grid,  setGrid]        = useState([]);
  const [editing, setEditing]   = useState(false);

  useEffect(()=>{
    fetchYears('forecast').then(r=>{
      setYears(r.data);
      if(r.data.length) setFy(r.data[0]);
    });
    fetchProjects().then(r=>setProjects(r.data));
  },[]);

  useEffect(()=>{
    if (fy && projects.length) loadEntries();
  },[fy,projects]);

  async function loadEntries(){
    const resp = await fetchEntries({ year: fy, type: 'forecast' });
    const map = {};
    resp.data.forEach(e=>{
      map[`${e.projectId}-${e.month}`] = e;
    });
    const rows = projects.map(p=>{
      const cells = {};
      MONTH_ORDER.forEach(m=>{
        cells[m] = map[`${p._id}-${m}`] || {
          projectId: p._id,
          month: m,
          valueMillion: 0,
          comment: '',
          updatedAt: null
        };
      });
      return { project: p, cells };
    });
    setGrid(rows);
  }

  const saveCell = async (projectId, month, obj) => {
    const fd = new FormData();
    fd.append('projectId', projectId);
    fd.append('year', fy);
    fd.append('month', month);
    fd.append('type', 'forecast');
    fd.append('valueMillion', obj.valueMillion);
    fd.append('comment',     obj.comment);
    await upsertEntry(fd);
    await loadEntries();
  };

  const exportCSV = year =>
    exportEntries('forecast', year).then(res=>{
      const url = URL.createObjectURL(
        new Blob([res.data],{type:'text/csv'})
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = `forecast_${year}.csv`;
      a.click();
    });

  const today = new Date();
  const isFrozen = m => {
    // freeze 24h before month-end
    const last = new Date(fy, m, 0).getDate();
    return today.getDate() > last - 1;
  };

  // footer sums
  const footerSums = MONTH_ORDER.map(m =>
    grid.reduce((sum,row)=>sum + Number(row.cells[m].valueMillion||0),0)
      .toFixed(1)
  );
  const grandTotal = footerSums.reduce((s,x)=>s+Number(x),0).toFixed(1);

  return (
    <div className="p-4">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <select
          value={fy||''}
          onChange={e=>setFy(+e.target.value)}
          className="p-2 border rounded"
        >
          {years.map(y=>(
            <option key={y} value={y}>
              FY {y}–{y+1}
            </option>
          ))}
        </select>

        <div className="space-x-2">
          <button
            onClick={()=>exportCSV(fy)}
            className="px-3 py-1 bg-blue-600 text-white rounded"
          >
            Export as CSV
          </button>
          <button
            onClick={()=>setEditing(!editing)}
            className="px-3 py-1 bg-green-600 text-white rounded"
          >
            {editing?'Cancel':'Edit'}
          </button>
          {editing && (
            <button
              onClick={()=>{
                // add blank row
                setGrid(g=>[
                  ...g,
                  {
                    project: {
                      _id: 'new',
                      accountName:'',managerName:'',
                      name:'',bu:'',vde:'',gde:'',account:''
                    },
                    cells: MONTH_ORDER.reduce((o,m)=>{
                      o[m]={
                        projectId:'new',
                        month:m,
                        valueMillion:0,
                        comment:'',
                        updatedAt:null
                      }; return o;
                    },{})
                  }
                ]);
              }}
              className="px-3 py-1 bg-gray-600 text-white rounded"
            >
              ＋ Add Project
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Account Name</th>
              <th className="p-2 border">Delivery Manager</th>
              <th className="p-2 border">Project Name</th>
              <th className="p-2 border">BU</th>
              <th className="p-2 border">VDE</th>
              <th className="p-2 border">GDE</th>
              <th className="p-2 border">Account</th>
              {MONTH_LABELS.map(l=>(
                <th key={l} className="p-2 border">{l}</th>
              ))}
              <th className="p-2 border">Total</th>
              <th className="p-2 border">Comments</th>
            </tr>
          </thead>
          <tbody>
            {grid.map(({project,cells},ri)=> {
              // row color by age
              const ages = MONTH_ORDER.map(m=>
                cells[m].updatedAt
                  ? (Date.now()-new Date(cells[m].updatedAt))/86400000
                  : 0
              );
              const maxAge = Math.max(...ages);
              const rowClass = maxAge>14
                              ? 'bg-red-100'
                              : maxAge>7
                              ? 'bg-yellow-100'
                              : '';

              const rowTotal = MONTH_ORDER
                .reduce((s,m)=>s + Number(cells[m].valueMillion||0),0)
                .toFixed(1);

              return (
                <tr key={ri} className={rowClass}>
                  <td className="p-2 border">
                    <input
                      type="text"
                      defaultValue={project.accountName}
                      disabled={!editing}
                      onBlur={e=>
                        project._id==='new'
                          ? project.accountName = e.target.value
                          : null
                      }
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="text"
                      defaultValue={project.managerName}
                      disabled={!editing}
                      onBlur={e=>
                        project._id==='new'
                          ? project.managerName = e.target.value
                          : null
                      }
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="text"
                      defaultValue={project.name}
                      disabled={!editing}
                      onBlur={e=>
                        project._id==='new'
                          ? project.name = e.target.value
                          : null
                      }
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="text"
                      defaultValue={project.bu}
                      disabled={!editing}
                      onBlur={e=>project.bu=e.target.value}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="text"
                      defaultValue={project.vde}
                      disabled={!editing}
                      onBlur={e=>project.vde=e.target.value}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="text"
                      defaultValue={project.gde}
                      disabled={!editing}
                      onBlur={e=>project.gde=e.target.value}
                      className="w-full p-1 border rounded"
                    />
                  </td>
                  <td className="p-2 border">
                    <input
                      type="text"
                      defaultValue={project.account}
                      disabled={!editing}
                      onBlur={e=>project.account=e.target.value}
                      className="w-full p-1 border rounded"
                    />
                  </td>

                  {MONTH_ORDER.map(m=>{
                    const cell = cells[m];
                    return (
                      <td key={m} className="p-1 border text-center">
                        <input
                          type="number"
                          step="0.1"
                          defaultValue={cell.valueMillion}
                          disabled={!editing || isFrozen(m)}
                          onBlur={e=>
                            saveCell(project._id, m, {
                              ...cell,
                              valueMillion: e.target.value
                            })
                          }
                          className="w-16 p-1 border rounded"
                        />
                      </td>
                    );
                  })}

                  <td className="p-2 border font-bold">{rowTotal}</td>

                  <td className="p-2 border relative">
                    <input
                      type="text"
                      defaultValue={cells[MONTH_ORDER[0]].comment}
                      disabled={!editing}
                      onBlur={e=>
                        saveCell(project._id, MONTH_ORDER[0], {
                          ...cells[MONTH_ORDER[0]],
                          comment: e.target.value
                        })
                      }
                      className="w-full p-1 border rounded"
                    />
                    {true && (
                      <span
                        title={
                          cells[MONTH_ORDER[0]].updatedAt
                            ? new Date(cells[MONTH_ORDER[0]].updatedAt)
                                .toLocaleDateString('en-US',{
                                  day:'2-digit',
                                  month:'short',
                                  year:'numeric'
                                })
                            : ''
                        }
                        className="absolute top-1 right-1 text-gray-400 cursor-help"
                      >
                        🕒
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-200 font-bold">
            <tr>
              <td colSpan={7} className="p-2 border">Total</td>
              {footerSums.map((s,i)=>(
                <td key={i} className="p-2 border">{s}</td>
              ))}
              <td className="p-2 border">{grandTotal}</td>
              <td colSpan={1} className="p-2 border"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}