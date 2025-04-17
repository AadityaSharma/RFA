// frontend/src/pages/Forecast.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  fetchEntries,
  fetchYears,
  fetchProjects,
  upsertEntry,
  exportEntries
} from '../services/api';
import { XIcon } from '@heroicons/react/solid';
import './Forecast.css';

export default function Forecast() {
  const [years, setYears] = useState([]);
  const [projects] = useState([]); // assuming used later
  const [entries, setEntries] = useState([]);
  const [draftEntries, setDraftEntries] = useState([]);
  const [year, setYear] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const wrapperRef = useRef(null);

  // month keys must match your DB (all lower‐case)
  const months = [
    'apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'
  ];

  // load years on mount
  useEffect(() => {
    fetchYears('forecast').then(r => {
      const ys = r.data.years || [];
      setYears(ys);
      if (ys.length) setYear(ys[0]);
    });
    fetchProjects().then(r => {
      // if you need to populate a project‐picker, setProjects(r.data)
    });
  }, []);

  // reload entries whenever year changes
  useEffect(() => {
    if (!year) return;
    fetchEntries({ type: 'forecast', year }).then(r => {
      const data = r.data || [];
      setEntries(data);
      // deep clone into draftEntries
      setDraftEntries(data.map(e => ({ ...e })));
    });
  }, [year]);

  // export CSV
  const handleExport = () => {
    exportEntries('forecast', year).then(res => {
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `forecast_${year}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  // upsert all drafts
  const handleSave = async () => {
    await Promise.all(
      draftEntries.map(e =>
        upsertEntry({ ...e, type: 'forecast', year })
      )
    );
    setIsEditing(false);
    // reload from server
    fetchEntries({ type: 'forecast', year }).then(r => {
      const fresh = r.data || [];
      setEntries(fresh);
      setDraftEntries(fresh.map(e => ({ ...e })));
    });
  };

  // cancel edits
  const handleCancel = () => {
    setDraftEntries(entries.map(e => ({ ...e })));
    setIsEditing(false);
  };

  // add a blank row
  const handleAddRow = () => {
    const blank = {
      accountName: '',
      deliveryManager: '',
      projectName: '',
      BU: '',
      VDE: '',
      GDE: '',
      account: '',
      apr: 0, may: 0, jun: 0, jul: 0,
      aug: 0, sep: 0, oct: 0, nov: 0,
      dec: 0, jan: 0, feb: 0, mar: 0,
      comments: '',
      __isNew: true
    };
    setDraftEntries(draftEntries.concat(blank));
    setIsEditing(true);
    // scroll to right
    setTimeout(() => {
      wrapperRef.current.scrollLeft = wrapperRef.current.scrollWidth;
    }, 100);
  };

  // remove just‐added rows
  const handleDeleteRow = idx => {
    setDraftEntries(draftEntries.filter((_, i) => i !== idx));
  };

  // update a cell
  const handleChange = (idx, field, val) => {
    const copy = draftEntries.slice();
    copy[idx] = { ...copy[idx], [field]: val };
    setDraftEntries(copy);
  };

  // sum across months
  const sum = row =>
    months.reduce((acc, m) => acc + (parseFloat(row[m]) || 0), 0);

  return (
    <div className="forecast-container">
      <div className="forecast-controls">
        <select
          className="forecast-select"
          value={year || ''}
          onChange={e => setYear(e.target.value)}
        >
          {years.map(y => (
            <option key={y} value={y}>
              FY {y}
            </option>
          ))}
        </select>
        <button className="btn-export" onClick={handleExport}>
          Export as CSV
        </button>
        {isEditing ? (
          <>
            <button className="btn-save" onClick={handleSave}>
              Save
            </button>
            <button className="btn-cancel" onClick={handleCancel}>
              Cancel
            </button>
          </>
        ) : (
          <button
            className="btn-edit"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
        )}
        <button className="btn-add" onClick={handleAddRow}>
          + Add Project
        </button>
      </div>

      <div ref={wrapperRef} className="forecast-table-wrapper">
        <table className="forecast-table">
          <thead>
            <tr>
              <th className="sticky-col col-fixed">Account Name</th>
              <th className="col-fixed">Delivery Manager</th>
              <th className="col-fixed">Project Name</th>
              <th className="col-fixed">BU</th>
              <th className="col-fixed">VDE</th>
              <th className="col-fixed">GDE</th>
              <th className="col-fixed">Account</th>
              {months.map(m => (
                <th key={m} className="col-month">
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </th>
              ))}
              <th className="col-total">Total</th>
              <th className="col-comments">Comments</th>
            </tr>
          </thead>
          <tbody>
            {draftEntries.map((row, i) => (
              <tr key={i}>
                {/* sticky first column */}
                <td className="sticky-col">
                  {isEditing ? (
                    <input
                      className="cell-input"
                      value={row.accountName}
                      onChange={e =>
                        handleChange(i, 'accountName', e.target.value)
                      }
                    />
                  ) : (
                    row.accountName
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="cell-input"
                      value={row.deliveryManager}
                      onChange={e =>
                        handleChange(i, 'deliveryManager', e.target.value)
                      }
                    />
                  ) : (
                    row.deliveryManager
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="cell-input"
                      value={row.projectName}
                      onChange={e =>
                        handleChange(i, 'projectName', e.target.value)
                      }
                    />
                  ) : (
                    row.projectName
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="cell-input"
                      value={row.BU}
                      onChange={e => handleChange(i, 'BU', e.target.value)}
                    />
                  ) : (
                    row.BU
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="cell-input"
                      value={row.VDE}
                      onChange={e =>
                        handleChange(i, 'VDE', e.target.value)
                      }
                    />
                  ) : (
                    row.VDE
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="cell-input"
                      value={row.GDE}
                      onChange={e =>
                        handleChange(i, 'GDE', e.target.value)
                      }
                    />
                  ) : (
                    row.GDE
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      className="cell-input"
                      value={row.account}
                      onChange={e =>
                        handleChange(i, 'account', e.target.value)
                      }
                    />
                  ) : (
                    row.account
                  )}
                </td>
                {months.map(m => (
                  <td key={m} className="text-right">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.01"
                        className="cell-input text-right"
                        value={row[m]}
                        onChange={e =>
                          handleChange(i, m, e.target.value)
                        }
                      />
                    ) : (
                      `$${(parseFloat(row[m]) || 0).toFixed(2)}`
                    )}
                  </td>
                ))}
                <td className="text-right">
                  ${sum(row).toFixed(2)}
                </td>
                <td className="cell-comment">
                  {isEditing ? (
                    <input
                      className="cell-input"
                      value={row.comments}
                      onChange={e =>
                        handleChange(i, 'comments', e.target.value)
                      }
                    />
                  ) : (
                    row.comments
                  )}
                  {row.__isNew && isEditing && (
                    <XIcon
                      className="delete-icon"
                      onClick={() => handleDeleteRow(i)}
                    />
                  )}
                </td>
              </tr>
            ))}

            {/* bottom totals row */}
            <tr className="total-row">
              <td colSpan={7} />
              {months.map(m => (
                <td key={m} className="text-right">
                  ${entries
                    .reduce((acc, e) => acc + (parseFloat(e[m]) || 0), 0)
                    .toFixed(2)}
                </td>
              ))}
              <td className="text-right">
                $
                {entries
                  .reduce((acc, e) => acc + sum(e), 0)
                  .toFixed(2)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}