// frontend/src/pages/Opportunities.jsx
import React, { useEffect, useState } from 'react';
import {
  fetchYears,
  fetchProjects,
  fetchEntries,
  upsertEntry,
  exportEntries
} from '../services/api';

// Apr→Mar order
const MONTH_ORDER = [4,5,6,7,8,9,10,11,12,1,2,3];
const MONTH_LABELS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

export default function Opportunities() {
  const [years, setYears]         = useState([]);
  const [fy, setFy]               = useState(null);
  const [projects, setProjects]   = useState([]);
  const [grid, setGrid]           = useState([]);
  const [filterStatus, setFilterStatus] = useState('In-progress');
  const [filterProb, setFilterProb]     = useState('');
  const [editing, setEditing]     = useState(false);

  // load FYs & projects
  useEffect(() => {
    fetchYears().then(r => {
      setYears(r.data);
      if (r.data.length) setFy(r.data[0]);
    });
    fetchProjects().then(r => setProjects(r.data));
  }, []);

  // reload entries on FY or projects change
  useEffect(() => {
    if (fy && projects.length) loadEntries();
  }, [fy, projects]);

  async function loadEntries() {
    const resp = await fetchEntries({ year: fy, type: 'opportunity' });
    const entries = resp.data; // { projectId, month, valueMillion, probability, status, comment, updatedAt }

    const map = {};
    entries.forEach(e => {
      map[`${e.projectId}-${e.month}`] = e;
    });

    const rows = projects.map(p => {
      const cells = MONTH_ORDER.reduce((acc,m) => {
        acc[m] = map[`${p._id}-${m}`] || {
          projectId: p._id,
          month: m,
          valueMillion: 0,
          probability: '',
          status: 'In-progress',
          comment: '',
          updatedAt: null
        };
        return acc;
      }, {});
      return { project: p, cells };
    });

    setGrid(rows);
  }

  // single-cell save
  async function saveCell(projectId, month, data) {
    const fd = new FormData();
    fd.append('projectId', projectId);
    fd.append('year', fy);
    fd.append('month', month);
    fd.append('type', 'opportunity');
    fd.append('valueMillion', data.valueMillion);
    fd.append('probability', data.probability);
    fd.append('status', data.status);
    fd.append('comment', data.comment);
    await upsertEntry(fd);
    await loadEntries();
  }

  // export CSV
  function exportCSV() {
    exportEntries('opportunity').then(res => {
      const url = URL.createObjectURL(new Blob([res.data], { type:'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `opportunities_${fy}.csv`;
      a.click();
    });
  }

  // freeze logic: lock edits 2 days before month-end
  const today = new Date();
  const isFrozen = m => {
    const lastDay = new Date(fy, m, 0).getDate();
    return today.getDate() > lastDay - 2;
  };

  // apply filters
  const displayed = grid.filter(({ cells }) => {
    // check any month cell matching filters
    const any = MONTH_ORDER.some(m => {
      const e = cells[m];
      return (
        (!filterStatus || e.status === filterStatus) &&
        (!filterProb   || e.probability === filterProb)
      );
    });
    return any;
  });

  // footer sums per month
  const footerSums = MONTH_ORDER.map(m =>
    displayed.reduce((s, row) => s + Number(row.cells[m].valueMillion || 0), 0).toFixed(1)
  );
  const grandTotal = footerSums.reduce((s,x) => s + Number(x), 0).toFixed(1);

  return (
    <div className="p-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4">
        <select
          value={fy || ''}
          onChange={e => setFy(+e.target.value)}
          className="p-2 border rounded"
        >
          {years.map(y => (
            <option key={y} value={y}>
              FY {y}–{y+1}
            </option>
          ))}
        </select>

        <div className="space-x-2">
          <button onClick={exportCSV} className="btn bg-blue-600 text-white">
            Export CSV
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className="btn bg-green-600 text-white"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
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
              {MONTH_LABELS.map(l => (
                <th key={l} className="p-2 border">{l}</th>
              ))}
              <th className="p-2 border">Total</th>
              <th className="p-2 border">Probability</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Comments</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(({ project, cells }) => {
              // compute row class (frozen rows colored)
              const maxUpdated = Math.max(
                ...MONTH_ORDER.map(m => cells[m].updatedAt ? new Date(cells[m].updatedAt).getTime() : 0)
              );
              const age = maxUpdated ? (Date.now() - maxUpdated) / 86400000 : 0;
              const rowClass = age>14 ? 'bg-red-100' : age>7 ? 'bg-yellow-100' : '';

              const rowTotal = MONTH_ORDER.reduce((s,m) =>
                s + Number(cells[m].valueMillion||0), 0
              ).toFixed(1);

              return (
                <tr key={project._id} className={rowClass}>
                  <td className="p-2 border">{project.accountName}</td>
                  <td className="p-2 border">{project.managerName}</td>
                  <td className="p-2 border">{project.name}</td>
                  <td className="p-2 border">{project.bu}</td>
                  <td className="p-2 border">{project.vde}</td>
                  <td className="p-2 border">{project.gde}</td>
                  <td className="p-2 border">{project.account}</td>

                  {MONTH_ORDER.map(m => {
                    const cell = cells[m];
                    const frozen = isFrozen(m);
                    return (
                      <td key={m} className="p-1 border text-center">
                        <input
                          type="number"
                          step="0.1"
                          defaultValue={cell.valueMillion}
                          disabled={!editing || frozen}
                          onBlur={e =>
                            saveCell(project._id, m, {
                              valueMillion: e.target.value,
                              probability: cell.probability,
                              status:      cell.status,
                              comment:     cell.comment
                            })
                          }
                          className="w-16 p-1 border rounded"
                        />
                      </td>
                    );
                  })}

                  <td className="p-2 border font-bold">{rowTotal}</td>

                  <td className="p-2 border">
                    <select
                      defaultValue={cells[4].probability}
                      disabled={!editing}
                      onChange={e =>
                        saveCell(project._id, 4, {
                          ...cells[4],
                          probability: e.target.value
                        })
                      }
                      className="p-1 border rounded"
                    >
                      <option value="">—</option>
                      {['A','B','C','D','E'].map(x => (
                        <option key={x} value={x}>{x}</option>
                      ))}
                    </select>
                  </td>

                  <td className="p-2 border">
                    <select
                      defaultValue={cells[4].status}
                      disabled={!editing}
                      onChange={e =>
                        saveCell(project._id, 4, {
                          ...cells[4],
                          status: e.target.value
                        })
                      }
                      className="p-1 border rounded"
                    >
                      {['In-progress','Won','Abandoned'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>

                  <td className="p-2 border relative">
                    <input
                      type="text"
                      defaultValue={cells[4].comment}
                      disabled={!editing}
                      onBlur={e =>
                        saveCell(project._id, 4, {
                          ...cells[4],
                          comment: e.target.value
                        })
                      }
                      className="w-full p-1 border rounded"
                    />
                    {maxUpdated>0 && (
                      <span
                        title={new Date(maxUpdated).toLocaleDateString('en-US',{
                          day:'2-digit',month:'short',year:'numeric'
                        })}
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
              {footerSums.map((s,i) => (
                <td key={i} className="p-2 border">{s}</td>
              ))}
              <td className="p-2 border">{grandTotal}</td>
              <td colSpan={3} className="p-2 border"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}