import React, { useEffect, useState } from 'react';
import {
  fetchProjects,
  fetchEntries,
  fetchActuals,
  upsertEntry,
  exportEntries
} from '../services/api';

export default function Forecast() {
  const [projects, setProjects] = useState([]);
  const [year]     = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [grid, setGrid]   = useState([]);
  const [actuals, setActuals] = useState({});

  useEffect(() => {
    fetchProjects().then(r => setProjects(r.data));
  }, []);

  useEffect(() => {
    if (projects.length) load();
  }, [projects, month]);

  async function load() {
    const [ents, acts] = await Promise.all([
      fetchEntries({ year, month, type: 'forecast' }),
      fetchActuals({ year, month })
    ]);

    // map entries & actuals by projectId
    const eMap = Object.fromEntries(ents.data.map(e => [e.projectId, e]));
    const aMap = Object.fromEntries(acts.data.map(a => [a.projectId, a.valueMillion]));
    setActuals(aMap);

    setGrid(projects.map(p => ({
      project: p,
      entry: eMap[p._id] || { valueMillion: 0, comment: '', updatedAt: null }
    })));
  }

  async function save(pId, val, file, comment) {
    const fd = new FormData();
    fd.append('projectId', pId);
    fd.append('year', year);
    fd.append('month', month);
    fd.append('type', 'forecast');
    fd.append('valueMillion', val);
    if (file) fd.append('snapshot', file);
    fd.append('comment', comment || '');
    await upsertEntry(fd);
    await load();
  }

  const locked = new Date().getDate() > (new Date(year, month, 0).getDate() - 2);
  const sum = grid.reduce((s, r) => s + Number(r.entry.valueMillion || 0), 0).toFixed(1);

  function downloadCSV() {
    exportEntries('forecast').then(res => {
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'forecast.csv';
      a.click();
    });
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Forecast</h1>
      <div className="mb-4 flex items-center space-x-4">
        <label>Month:
          <input
            type="number"
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="ml-2 w-20 p-1 border rounded"
          />
        </label>
        <button
          onClick={downloadCSV}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Export CSV
        </button>
      </div>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Project</th>
            <th className="p-2">Value (M)</th>
            <th className="p-2">Snapshot</th>
            <th className="p-2">Comments</th>
            <th className="p-2">Last Updated</th>
            <th className="p-2">Variance</th>
          </tr>
        </thead>
        <tbody>
          {grid.map(({ project, entry }) => {
            const actual = actuals[project._id] || 0;
            const varVal = (actual - (entry.valueMillion || 0)).toFixed(1);
            const daysOld = entry.updatedAt
              ? (Date.now() - new Date(entry.updatedAt)) / 86400000
              : null;
            const rowClass = daysOld > 14
              ? 'bg-red-100'
              : daysOld > 7
              ? 'bg-yellow-100'
              : '';

            return (
              <tr key={project._id} className={rowClass}>
                <td className="p-2">{project.name}</td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={entry.valueMillion}
                    disabled={locked}
                    onBlur={e => save(project._id, e.target.value, null, entry.comment)}
                    className="w-24 p-1 border rounded"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="file"
                    disabled={locked}
                    onChange={e =>
                      save(project._id, entry.valueMillion, e.target.files[0], entry.comment)
                    }
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    defaultValue={entry.comment}
                    disabled={locked}
                    onBlur={e =>
                      save(project._id, entry.valueMillion, null, e.target.value)
                    }
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td className="p-2">
                  {entry.updatedAt &&
                    new Date(entry.updatedAt).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                </td>
                <td className="p-2">
                  {locked && varVal !== '0.0' && (
                    <span className={varVal > 0 ? 'text-green-600' : 'text-red-600'}>
                      {varVal > 0 ? '▲' : '▼'} {Math.abs(varVal)}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot className="bg-gray-200 font-bold">
          <tr>
            <td className="p-2">Total</td>
            <td className="p-2">{sum}</td>
            <td colSpan={4}></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}