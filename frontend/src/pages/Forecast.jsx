// frontend/src/pages/Forecast.jsx
import React, { useEffect, useState } from 'react';
import {
  fetchYears,
  fetchProjects,
  fetchEntries,
  upsertEntry,
  exportEntries
} from '../services/api';
import { Tooltip } from 'react-tooltip'; // or your preferred tooltip lib

// Month order: Apr (4) → Dec (12), Jan (1) → Mar (3)
const MONTH_ORDER = [4,5,6,7,8,9,10,11,12,1,2,3];
const MONTH_LABELS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

export default function Forecast() {
  const [years, setYears]       = useState([]);
  const [fy, setFy]             = useState(null);
  const [projects, setProjects] = useState([]);
  const [grid, setGrid]         = useState([]);
  const [editing, setEditing]   = useState(false);

  // 1) Load fiscal years and projects
  useEffect(() => {
    fetchYears().then(r => {
      setYears(r.data);
      if (r.data.length) setFy(r.data[0]);
    });
    fetchProjects().then(r => setProjects(r.data));
  }, []);

  // 2) Whenever FY or projects change, reload entries
  useEffect(() => {
    if (fy && projects.length) loadEntries();
  }, [fy, projects]);

  // 3) Fetch all forecast entries for the chosen FY
  async function loadEntries() {
    const resp = await fetchEntries({ year: fy, type: 'forecast' });
    const entries = resp.data; // each has projectId, month, valueMillion, comment, updatedAt

    // Build a lookup map: key = `${projectId}-${month}`
    const map = {};
    entries.forEach(e => { map[`${e.projectId}-${e.month}`] = e; });

    // Build grid rows
    const rows = projects.map(p => {
      // collect cell data for each month
      const cells = MONTH_ORDER.reduce((acc, m) => {
        acc[m] = map[`${p._id}-${m}`] || {
          projectId: p._id,
          month: m,
          valueMillion: 0,
          comment: '',
          updatedAt: null
        };
        return acc;
      }, {});
      return { project: p, cells };
    });

    setGrid(rows);
  }

  // 4) Save a single cell on blur
  async function saveCell(projectId, month, value, comment) {
    const fd = new FormData();
    fd.append('projectId', projectId);
    fd.append('year', fy);
    fd.append('month', month);
    fd.append('type', 'forecast');
    fd.append('valueMillion', value);
    fd.append('comment', comment);
    await upsertEntry(fd);
    await loadEntries();
  }

  // 5) Export CSV
  function exportCSV() {
    exportEntries('forecast').then(res => {
      const url = URL.createObjectURL(new Blob([res.data], { type:'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `forecast_${fy}.csv`;
      a.click();
    });
  }

  // 6) Freeze logic: lock edits 2 days before month-end
  const today = new Date();
  const freezeThreshold = (m) => {
    const lastDay = new Date(fy, m, 0).getDate();
    return today.getDate() > lastDay - 2;
  };

  // 7) Calculate footer sums per month
  const footerSums = MONTH_ORDER.map(m =>
    grid.reduce((sum, row) => sum + Number(row.cells[m].valueMillion || 0), 0).toFixed(1)
  );
  const grandTotal = footerSums.reduce((sum, s) => sum + Number(s), 0).toFixed(1);

  return (
    <div className="p-4">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        {/* FY Dropdown */}
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

        {/* Action Buttons */}
        <div className="space-x-2">
          <button onClick={exportCSV} className="px-3 py-1 bg-blue-600 text-white rounded">
            Export as CSV
          </button>
          <button
            onClick={() => setEditing(!editing)}
            className="px-3 py-1 bg-green-600 text-white rounded"
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
          {/* Admin-only “+” could go here */}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Account Name</th>
              <th className="p-2 border">Delivery Manager</th>
              <th className="p-2 border">Project Name</th>
              <th className="p-2 border">BU</th>
              <th className="p-2 border">VDE</th>
              <th className="p-2 border">GDE</th>
              <th className="p-2 border">Account</th>
              {MONTH_LABELS.map(label => (
                <th key={label} className="p-2 border">
                  {label}
                </th>
              ))}
              <th className="p-2 border">Total</th>
              <th className="p-2 border">Comments</th>
            </tr>
          </thead>
          <tbody>
            {grid.map(({ project, cells }) => {
              // compute row age on last updated (max over all months)
              const latest = Math.max(
                ...MONTH_ORDER.map(m => (cells[m].updatedAt
                  ? new Date(cells[m].updatedAt).getTime()
                  : 0))
              );
              const ageDays = latest
                ? (Date.now() - latest) / 86400000
                : null;
              const rowClass = ageDays > 14
                ? 'bg-red-100'
                : ageDays > 7
                ? 'bg-yellow-100'
                : '';

              const rowTotal = MONTH_ORDER
                .reduce((s,m) => s + Number(cells[m].valueMillion || 0), 0)
                .toFixed(1);

              return (
                <tr key={project._id} className={rowClass}>
                  <td className="p-2 border">{project.accountName}</td>
                  <td className="p-2 border">{project.managerName}</td>
                  <td className="p-2 border">{project.name}</td>
                  <td className="p-2 border">{project.bu}</td>
                  <td className="p-2 border">{project.vde}</td>
                  <td className="p-2 border">{project.gde}</td>
                  <td className="p-2 border">{project.account}</td>

                  {/* 12 month cells */}
                  {MONTH_ORDER.map(m => {
                    const cell = cells[m];
                    const isFrozen = freezeThreshold(m);

                    return (
                      <td key={m} className="p-1 border text-center">
                        <input
                          type="number"
                          step="0.1"
                          defaultValue={cell.valueMillion}
                          disabled={!editing || isFrozen}
                          onBlur={e =>
                            saveCell(
                              project._id,
                              m,
                              e.target.value,
                              cell.comment
                            )
                          }
                          className="w-16 p-1 border rounded"
                        />
                      </td>
                    );
                  })}

                  <td className="p-2 border font-bold">{rowTotal}</td>

                  {/* Comments + hover clock */}
                  <td className="p-2 border relative">
                    <input
                      type="text"
                      defaultValue={cells[4].comment} // you may want to consolidate comments per row
                      disabled={!editing}
                      onBlur={e =>
                        saveCell(
                          project._id,
                          4,
                          cells[4].valueMillion,
                          e.target.value
                        )
                      }
                      className="w-full p-1 border rounded"
                    />
                    {latest && (
                      <Tooltip
                        anchorSelect=".last-upd-icon"
                        place="top"
                        content={new Date(latest).toLocaleDateString('en-US',{
                          day:'2-digit',
                          month:'short',
                          year:'numeric'
                        })}
                      >
                        <span className="last-upd-icon absolute top-1 right-1 cursor-help">
                          🕒
                        </span>
                      </Tooltip>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-200 font-bold">
            <tr>
              <td className="p-2 border" colSpan={7}>
                Total
              </td>
              {footerSums.map((s,i) => (
                <td key={i} className="p-2 border">
                  {s}
                </td>
              ))}
              <td className="p-2 border">{grandTotal}</td>
              <td className="p-2 border"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}