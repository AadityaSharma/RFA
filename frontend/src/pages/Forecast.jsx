import React, { useEffect, useState } from 'react';
import {
  fetchProjects, fetchEntries, fetchActuals,
  upsertEntry, exportEntries
} from '../services/api';

export default function Forecast() {
  const [projects, setProjects] = useState([]);
  const [year] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [grid, setGrid] = useState([]);
  const [actuals, setActuals] = useState({});

  useEffect(() => { fetchProjects().then(r => setProjects(r.data)); }, []);
  useEffect(() => load(), [projects, month]);

  const load = async () => {
    const [ents, acts] = await Promise.all([
      fetchEntries({ year, month, type: 'forecast' }),
      fetchActuals({ year, month })
    ]);
    const eMap = ents.data.reduce((a, e) => ({ ...a, [e.projectId]: e }), {});
    const aMap = acts.data.reduce((a, a0) => ({ ...a, [a0.projectId]: a0.valueMillion }), {});
    setActuals(aMap);
    setGrid(projects.map(p => ({ project: p, entry: eMap[p._id] || {} })));
  };

  const save = async (pId, val, file, comment) => {
    const fd = new FormData();
    fd.append('projectId', pId);
    fd.append('year', year);
    fd.append('month', month);
    fd.append('type', 'forecast');
    fd.append('valueMillion', val);
    if (file) fd.append('snapshot', file);
    fd.append('comment', comment || '');
    await upsertEntry(fd);
    load();
  };

  const locked = new Date().getDate() > (new Date(year, month, 0).getDate() - 2);
  const sum = grid.reduce((s, r) => s + Number(r.entry.valueMillion || 0), 0).toFixed(1);

  const download = () => exportEntries('forecast').then(res => {
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'forecast.csv';
    a.click();
  });

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4 text-ntt-blue">Forecast</h1>
      <div className="mb-4 flex items-center space-x-4">
        Month:
        <input
          type="number"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="p-1 border rounded w-20"
        />
        <button
          onClick={download}
          className="px-3 py-1 bg-ntt-blue text-white rounded"
        >
          Export CSV
        </button>
      </div>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th>Project</th>
            <th>Value (M)</th>
            <th>Snapshot</th>
            <th>Comments</th>
            <th>Last Updated</th>
            <th>Variance</th>
          </tr>
        </thead>
        <tbody>
          {grid.map(({ project, entry }) => {
            const actual = actuals[project._id] || 0;
            const varVal = (actual - (entry.valueMillion || 0)).toFixed(1);
            const rowAge = entry.updatedAt
              ? (Date.now() - new Date(entry.updatedAt)) / 86400000
              : null;
            const rowClass =
              rowAge > 14 ? 'bg-red-100' : rowAge > 7 ? 'bg-yellow-100' : '';

            return (
              <tr key={project._id} className={`border-t ${rowClass}`}>
                <td className="p-2">{project.name}</td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={entry.valueMillion}
                    disabled={locked}
                    onBlur={e =>
                      save(
                        project._id,
                        e.target.value,
                        null,
                        entry.comment
                      )
                    }
                    className="w-24 p-1 border rounded"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="file"
                    disabled={locked}
                    onChange={e =>
                      save(
                        project._id,
                        entry.valueMillion,
                        e.target.files[0],
                        entry.comment
                      )
                    }
                  />
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    defaultValue={entry.comment}
                    onBlur={e =>
                      save(
                        project._id,
                        entry.valueMillion,
                        null,
                        e.target.value
                      )
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
                <td className="p-2 text-sm">
                  {locked && varVal != 0 && (
                    <span
                      className={
                        varVal > 0 ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {varVal > 0 ? '▲' : '▼'}{Math.abs(varVal)}
                    </span>
                  )}