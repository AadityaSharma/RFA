import React, { useEffect, useState } from 'react';
import {
  fetchProjects,
  fetchEntries,
  upsertEntry,
  exportEntries
} from '../services/api';

export default function Opportunities() {
  const [projects, setProjects] = useState([]);
  const [year] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [grid, setGrid] = useState([]);
  const [filterStatus, setFilterStatus] = useState('In-progress');
  const [filterProb, setFilterProb] = useState('');

  useEffect(() => {
    fetchProjects().then(r => setProjects(r.data));
  }, []);

  useEffect(() => {
    if (projects.length) load();
  }, [projects, month]);

  async function load() {
    const ents = await fetchEntries({ year, month, type: 'opportunity' });
    const map = Object.fromEntries(ents.data.map(e => [e.projectId, e]));
    setGrid(
      projects.map(p => ({
        project: p,
        entry: map[p._id] || {
          valueMillion: 0,
          probability: '',
          status: 'In-progress',
          comment: '',
          updatedAt: null
        }
      }))
    );
  }

  async function save(pId, val, prob, stat, comment) {
    const fd = new FormData();
    fd.append('projectId', pId);
    fd.append('year', year);
    fd.append('month', month);
    fd.append('type', 'opportunity');
    fd.append('valueMillion', val);
    fd.append('probability', prob);
    fd.append('status', stat);
    fd.append('comment', comment);
    await upsertEntry(fd);
    await load();
  }

  const locked =
    new Date().getDate() >
    new Date(year, month, 0).getDate() - 2;

  // apply filters
  const filtered = grid.filter(
    ({ entry }) =>
      (filterStatus
        ? entry.status === filterStatus
        : true) &&
      (filterProb
        ? entry.probability === filterProb
        : true)
  );

  const sum = filtered
    .reduce((s, r) => s + Number(r.entry.valueMillion || 0), 0)
    .toFixed(1);

  function downloadCSV() {
    exportEntries('opportunity').then(res => {
      const url = URL.createObjectURL(
        new Blob([res.data], { type: 'text/csv' })
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = 'opportunities.csv';
      a.click();
    });
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Opportunities</h1>

      <div className="mb-4 flex items-center space-x-4">
        <label>
          Month:
          <input
            type="number"
            value={month}
            onChange={e =>
              setMonth(Number(e.target.value))
            }
            className="ml-2 w-20 p-1 border rounded"
          />
        </label>

        <label>
          Status:
          <select
            value={filterStatus}
            onChange={e =>
              setFilterStatus(e.target.value)
            }
            className="ml-2 p-1 border rounded"
          >
            <option value="">All</option>
            {['In-progress', 'Won', 'Abandoned'].map(s => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          Probability:
          <select
            value={filterProb}
            onChange={e =>
              setFilterProb(e.target.value)
            }
            className="ml-2 p-1 border rounded"
          >
            <option value="">All</option>
            {['A', 'B', 'C', 'D', 'E'].map(x => (
              <option key={x} value={x}>
                {x}
              </option>
            ))}
          </select>
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
            <th className="p-2">Probability</th>
            <th className="p-2">Status</th>
            <th className="p-2">Comments</th>
            <th className="p-2">Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(({ project, entry }) => {
            const daysOld = entry.updatedAt
              ? (Date.now() -
                  new Date(entry.updatedAt)) /
                86400000
              : null;
            const rowClass =
              entry.status !== 'In-progress'
                ? 'bg-gray-200'
                : daysOld > 14
                ? 'bg-red-100'
                : daysOld > 7
                ? 'bg-yellow-100'
                : '';

            return (
              <tr
                key={project._id}
                className={rowClass}
              >
                <td className="p-2">
                  {project.name}
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={
                      entry.valueMillion
                    }
                    disabled={
                      locked ||
                      entry.status !==
                        'In-progress'
                    }
                    onBlur={e =>
                      save(
                        project._id,
                        e.target.value,
                        entry.probability,
                        entry.status,
                        entry.comment
                      )
                    }
                    className="w-24 p-1 border rounded"
                  />
                </td>
                <td className="p-2">
                  <select
                    defaultValue={
                      entry.probability
                    }
                    disabled={
                      locked ||
                      entry.status !==
                        'In-progress'
                    }
                    onChange={e =>
                      save(
                        project._id,
                        entry.valueMillion,
                        e.target.value,
                        entry.status,
                        entry.comment
                      )
                    }
                    className="p-1 border rounded"
                  >
                    <option value="">
                      —
                    </option>
                    {['A', 'B', 'C', 'D', 'E'].map(
                      x => (
                        <option
                          key={x}
                          value={x}
                        >
                          {x}
                        </option>
                      )
                    )}
                  </select>
                </td>
                <td className="p-2">
                  <select
                    defaultValue={entry.status}
                    onChange={e =>
                      save(
                        project._id,
                        entry.valueMillion,
                        entry.probability,
                        e.target.value,
                        entry.comment
                      )
                    }
                    className="p-1 border rounded"
                  >
                    {[
                      'In-progress',
                      'Won',
                      'Abandoned'
                    ].map(s => (
                      <option
                        key={s}
                        value={s}
                      >
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    defaultValue={
                      entry.comment
                    }
                    disabled={locked}
                    onBlur={e =>
                      save(
                        project._id,
                        entry.valueMillion,
                        entry.probability,
                        entry.status,
                        e.target.value
                      )
                    }
                    className="w-full p-1 border rounded"
                  />
                </td>
                <td className="p-2">
                  {entry.updatedAt &&
                    new Date(
                      entry.updatedAt
                    ).toLocaleDateString(
                      'en-US',
                      {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      }
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