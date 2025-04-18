// frontend/src/pages/Opportunities.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  fetchYears,
  fetchProjects,
  fetchEntries,
  upsertEntry,
  exportEntries
} from '../services/api';
import { XIcon } from '@heroicons/react/solid';
import './Opportunities.css';

const MONTH_ORDER = [4,5,6,7,8,9,10,11,12,1,2,3];
const MONTH_LABELS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

export default function Opportunities() {
  const [years, setYears]       = useState([]);
  const [fy, setFy]             = useState(null);
  const [projects, setProjects] = useState([]);
  const [grid, setGrid]         = useState([]);    // rows: { project, cells }
  const [editing, setEditing]   = useState(false);
  const [filterStatus, setFilterStatus] = useState('In-progress');
  const [filterProb, setFilterProb]     = useState('');
  const wrapperRef = useRef(null);

  // fetch years & projects
  useEffect(()=>{
    fetchYears('opportunity').then(r=>{
      const yrs = r.data.years || [];
      setYears(yrs);
      if (yrs.length) setFy(r.data[0]);
    });
    fetchProjects().then(r=>setProjects(r.data));
  },[]);

  // whenever fy or projects load, pull entries
  useEffect(()=>{
    if (!fy || projects.length===0) return;
    loadEntries();
  },[fy,projects]);

  async function loadEntries(){
    const resp = await fetchEntries({ year: fy, type: 'opportunity' });
    // build a map month+projectId => entry
    const map = {};
    (resp.data||[]).forEach(e=>{
      map[`${e.projectId}-${e.month}`] = e;
    });
    // for each project, build a row of cells
    const rows = projects.map(p=>{
      const cells = {};
      MONTH_ORDER.forEach(m=>{
        cells[m] = {
          projectId: p._id,
          month: m,
          valueMillion: map[`${p._id}-${m}`]?.valueMillion || 0,
          probability:   map[`${p._id}-${m}`]?.probability   || '',
          status:        map[`${p._id}-${m}`]?.status        || 'In-progress',
          comment:       map[`${p._id}-${m}`]?.comment       || '',
          updatedAt:     map[`${p._id}-${m}`]?.updatedAt     || null,
        };
      });
      return { project: p, cells };
    });
    setGrid(rows);
  }

  const saveCell = async (projectId, month, obj) => {
    // form data for upsertEntry
    const fd = new FormData();
    fd.append('projectId', projectId);
    fd.append('year', fy);
    fd.append('month', month);
    fd.append('type', 'opportunity');
    fd.append('valueMillion', obj.valueMillion);
    fd.append('probability', obj.probability);
    fd.append('status', obj.status);
    fd.append('comment', obj.comment);
    await upsertEntry(fd);
    await loadEntries();
  };

  const exportCSV = year => exportEntries('opportunity', year)
    .then(res=>{
      const url = URL.createObjectURL(new Blob([res.data],{type:'text/csv'}));
      const a = document.createElement('a');
      a.href = url;
      a.download = `opportunity_${year}.csv`;
      a.click();
    });

  // footer sums
  const footerSums = MONTH_ORDER.map(m=>
    grid.reduce((sum,row)=> sum + Number(row.cells[m].valueMillion||0),0).toFixed(1)
  );
  const grandTotal = footerSums.reduce((acc,x)=> acc+Number(x),0).toFixed(1);

  return (
    <div className="p-6">
      {/* header bar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          className="px-3 py-1 border rounded"
          value={fy||''}
          onChange={e=>setFy(+e.target.value)}
        >
          {years.map(y=>(
            <option key={y} value={y}>FY {y} – {y+1}</option>
          ))}
        </select>

        <button
          onClick={()=>exportCSV(fy)}
          className="px-4 py-1 bg-green-600 text-white rounded"
        >
          Export CSV
        </button>

        <button
          onClick={()=>setEditing(e=>!e)}
          className={`px-4 py-1 rounded ${editing?'bg-red-600':'bg-blue-600'} text-white`}
        >
          {editing ? 'Cancel' : 'Edit'}
        </button>

        {editing && (
          <button
            onClick={()=>{
              setGrid(g=>[
                ...g,
                {
                  project: {
                    _id: 'new',
                    account: '', managerName:'', name:'', bu:'', vde:'', gde:''
                  },
                  cells: MONTH_ORDER.reduce((o,m)=>{
                    o[m]={
                      projectId:'new',month:m,valueMillion:0,
                      probability:'',status:'In-progress',
                      comment:'',updatedAt:null
                    };
                    return o;
                  },{})
                }
              ]);
            }}
            className="ml-auto px-4 py-1 bg-indigo-600 text-white rounded"
          >
            ＋ Add Project
          </button>
        )}
      </div>

      {/* filters */}
      <div className="flex items-center gap-4 mb-2">
        <label className="flex items-center space-x-2">
          <span>Status:</span>
          <select
            className="px-2 py-1 border rounded"
            value={filterStatus}
            onChange={e=>setFilterStatus(e.target.value)}
          >
            {['','In-progress','Won','Abandoned'].map(s=>(
              <option key={s} value={s}>{s||'Any'}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center space-x-2">
          <span>Probability:</span>
          <select
            className="px-2 py-1 border rounded"
            value={filterProb}
            onChange={e=>setFilterProb(e.target.value)}
          >
            {['','A','B','C','D','E'].map(p=>(
              <option key={p} value={p}>{p||'Any'}</option>
            ))}
          </select>
        </label>
      </div>

      {/* table */}
      <div
        ref={wrapperRef}
        className="overflow-x-auto border rounded"
        style={{ maxHeight:'65vh' }}
      >
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="sticky left-0 bg-gray-100 px-2 py-1 border">Account Name</th>
              <th className="px-2 py-1 border">Delivery Manager</th>
              <th className="px-2 py-1 border">Project Name</th>
              <th className="px-2 py-1 border">BU</th>
              <th className="px-2 py-1 border">VDE</th>
              <th className="px-2 py-1 border">GDE</th>
              <th className="px-2 py-1 border">Account</th>
              {MONTH_LABELS.map((l,i)=>(
                <th key={i} className="px-2 py-1 border text-right">{l}</th>
              ))}
              <th className="px-2 py-1 border">Total</th>
              <th className="px-2 py-1 border">Probability</th>
              <th className="px-2 py-1 border">Status</th>
              <th className="px-2 py-1 border">Comments</th>
            </tr>
          </thead>
          <tbody>
            {grid
              .filter(({ cells })=>{
                // apply row‐level filters: if ANY month cell matches, show row
                return Object.values(cells).some(c=>{
                  return (
                    (filterStatus===''||c.status===filterStatus) &&
                    (filterProb==='' || c.probability===filterProb)
                  );
                });
              })
              .map(({ project, cells }, ri)=>{
                // compute oldest age in days for row coloring
                const ages = MONTH_ORDER.map(m=>
                  cells[m].updatedAt
                    ? (Date.now() - new Date(cells[m].updatedAt)) / 86400000
                    : 0
                );
                const maxAge = Math.max(...ages);
                const rowBg =
                  maxAge>14 ? 'bg-red-100' :
                  maxAge>7  ? 'bg-yellow-100' :
                  '';
                const rowTotal = MONTH_ORDER
                  .reduce((sum,m)=> sum + Number(cells[m].valueMillion||0),0)
                  .toFixed(1);

                return (
                  <tr key={ri} className={`${rowBg}`}>
                    <td className="sticky left-0 bg-white px-2 py-1 border">
                      <input
                        disabled={!editing}
                        value={project.account||''}
                        onChange={e=>{
                          project.account=e.target.value;
                          setGrid(g=>[...g]); // force rerender
                        }}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="px-2 py-1 border">
                      <input
                        disabled={!editing}
                        value={project.managerName||''}
                        onChange={e=>{
                          project.managerName=e.target.value;
                          setGrid(g=>[...g]);
                        }}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="px-2 py-1 border">
                      <input
                        disabled={!editing}
                        value={project.name||''}
                        onChange={e=>{
                          project.name=e.target.value;
                          setGrid(g=>[...g]);
                        }}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                    <td className="px-2 py-1 border"><input
                      disabled={!editing}
                      value={project.bu||''}
                      onChange={e=>{
                        project.bu=e.target.value; setGrid(g=>[...g]);
                      }}
                      className="w-full p-1 border rounded"
                    /></td>
                    <td className="px-2 py-1 border"><input
                      disabled={!editing}
                      value={project.vde||''}
                      onChange={e=>{
                        project.vde=e.target.value; setGrid(g=>[...g]);
                      }}
                      className="w-full p-1 border rounded"
                    /></td>
                    <td className="px-2 py-1 border"><input
                      disabled={!editing}
                      value={project.gde||''}
                      onChange={e=>{
                        project.gde=e.target.value; setGrid(g=>[...g]);
                      }}
                      className="w-full p-1 border rounded"
                    /></td>
                    <td className="px-2 py-1 border"><input
                      disabled={!editing}
                      value={project.account||''}
                      onChange={e=>{
                        project.account=e.target.value; setGrid(g=>[...g]);
                      }}
                      className="w-full p-1 border rounded"
                    /></td>

                    {MONTH_ORDER.map((m,i)=>(
                      <td key={m} className="px-2 py-1 border text-right">
                        <input
                          type="number" step="0.1"
                          disabled={!editing}
                          value={cells[m].valueMillion}
                          onChange={e=>saveCell(project._id, m, {
                            ...cells[m],
                            valueMillion: e.target.value
                          })}
                          className="w-16 p-1 border rounded text-right"
                        />
                      </td>
                    ))}

                    <td className="px-2 py-1 border font-semibold text-right">
                      {rowTotal}
                    </td>

                    <td className="px-2 py-1 border">
                      <select
                        disabled={!editing}
                        value={cells[MONTH_ORDER[0]].probability}
                        onChange={e=>saveCell(project._id, MONTH_ORDER[0], {
                          ...cells[MONTH_ORDER[0]],
                          probability: e.target.value
                        })}
                        className="w-full p-1 border rounded"
                      >
                        <option value="">–</option>
                        {['A','B','C','D','E'].map(x=>(
                          <option key={x} value={x}>{x}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-2 py-1 border">
                      <select
                        disabled={!editing}
                        value={cells[MONTH_ORDER[0]].status}
                        onChange={e=>saveCell(project._id, MONTH_ORDER[0], {
                          ...cells[MONTH_ORDER[0]],
                          status: e.target.value
                        })}
                        className="w-full p-1 border rounded"
                      >
                        {['In-progress','Won','Abandoned'].map(s=>(
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-2 py-1 border">
                      <input
                        disabled={!editing}
                        value={cells[MONTH_ORDER[0]].comment}
                        onChange={e=>saveCell(project._id, MONTH_ORDER[0], {
                          ...cells[MONTH_ORDER[0]],
                          comment: e.target.value
                        })}
                        className="w-full p-1 border rounded"
                      />
                    </td>
                  </tr>
                );
              })
            }
          </tbody>
          <tfoot className="bg-gray-50 font-semibold">
            <tr>
              <td colSpan={7} className="px-2 py-2 border">Total</td>
              {footerSums.map((s,i)=>(
                <td key={i} className="px-2 py-2 border text-right">{s}</td>
              ))}
              <td className="px-2 py-2 border text-right">{grandTotal}</td>
              <td colSpan={3} className="border"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}