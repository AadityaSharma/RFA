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

const MONTH_KEYS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'];

export default function Forecast() {
  const [years, setYears] = useState([]);
  const [projects, setProjects] = useState([]);
  const [entries, setEntries] = useState([]);
  const [draftEntries, setDraftEntries] = useState([]);
  const [year, setYear] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const wrapperRef = useRef();

  // load years & projects
  useEffect(() => {
    fetchYears('forecast').then(r => {
      const y = r.data.years || [];
      setYears(y);
      if (y.length) setYear(y[0]);
    });
    fetchProjects().then(r => setProjects(r.data));
  }, []);

  // when year changes, reload entries
  useEffect(() => {
    if (!year) return;
    fetchEntries({ type: 'forecast', year }).then(r => {
      // normalize month keys (API may return uppercase keys)
      const normalized = (r.data || []).map(raw => {
        const obj = { ...raw };
        MONTH_KEYS.forEach(k => {
          const up = k.charAt(0).toUpperCase() + k.slice(1);
          if (raw[up] !== undefined) obj[k] = raw[up];
        });
        return obj;
      });
      setEntries(normalized);
      setDraftEntries(normalized.map(e => ({ ...e })));
      setIsEditing(false);
    });
  }, [year]);

  // Export CSV
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

  // Save changes
  const handleSave = async () => {
    // batch upsert new + edited rows
    await Promise.all(
      draftEntries.map(e => upsertEntry({ ...e, type: 'forecast', year }))
    );
    // reload
    fetchEntries({ type: 'forecast', year }).then(r => {
      const normalized = (r.data || []).map(raw => {
        const obj = { ...raw };
        MONTH_KEYS.forEach(k => {
          const up = k.charAt(0).toUpperCase() + k.slice(1);
          if (raw[up] !== undefined) obj[k] = raw[up];
        });
        return obj;
      });
      setEntries(normalized);
      setDraftEntries(normalized.map(e => ({ ...e })));
      setIsEditing(false);
    });
  };

  // Cancel edits
  const handleCancel = () => {
    setDraftEntries(entries.map(e => ({ ...e })));
    setIsEditing(false);
  };

  // Add a new blank row locally
  const handleAddRow = () => {
    const blank = {
      accountName: '', deliveryManager: '', projectName: '', BU: '', VDE: '', GDE: '', account: '',
      comments: '',
      __isNew: true,
      ...MONTH_KEYS.reduce((o,k) => ({ ...o, [k]: 0 }), {})
    };
    setDraftEntries(draftEntries.concat(blank));
    setIsEditing(true);
    setTimeout(() => {
      wrapperRef.current.scrollLeft = wrapperRef.current.scrollWidth;
    }, 100);
  };

  // Delete just-new rows
  const handleDeleteRow = idx => {
    setDraftEntries(draftEntries.filter((_,i) => i!==idx));
  };

  // Handle single-cell change
  const handleChange = (idx, field, val) => {
    const copy = [...draftEntries];
    copy[idx] = { ...copy[idx], [field]: val };
    setDraftEntries(copy);
  };

  // Sum helper
  const sum = row => MONTH_KEYS.reduce((tot,k) => tot + (parseFloat(row[k])||0), 0);

  return (
    <div className="p-6">
      <div className="flex items-center mb-4 space-x-2">
        <select
          className="border rounded px-2 py-1"
          value={year||''}
          onChange={e=>setYear(e.target.value)}
        >
          {years.map(y=> <option key={y} value={y}>FY {y}</option>)}
        </select>
        <button onClick={handleExport} className="bg-green-600 text-white px-4 py-1 rounded">Export CSV</button>
        {isEditing ? (
          <>
            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-1 rounded">Save</button>
            <button onClick={handleCancel} className="bg-red-600 text-white px-4 py-1 rounded">Cancel</button>
          </>
        ) : (
          <button onClick={()=>setIsEditing(true)} className="bg-blue-600 text-white px-4 py-1 rounded">Edit</button>
        )}
        <button onClick={handleAddRow} className="ml-auto bg-indigo-600 text-white px-4 py-1 rounded">+ Add Project</button>
      </div>

      <div ref={wrapperRef} className="table-wrapper" style={{ maxHeight: '65vh' }}>
        <table className="forecast-table w-max border-collapse min-w-full">
          <thead>
            <tr>
              <th className="sticky-col">Account Name</th>
              <th>Delivery Manager</th>
              <th>Project Name</th>
              <th>BU</th>
              <th>VDE</th>
              <th>GDE</th>
              <th>Account</th>
              {MONTH_KEYS.map(m=> <th key={m} className="month-col">{m.charAt(0).toUpperCase()+m.slice(1)}</th>)}
              <th className="total-col">Total</th>
              <th className="comments-col">Comments</th>
            </tr>
          </thead>
          <tbody>
            {draftEntries.map((row,i) => (
              <tr key={i} className={row.__isNew? 'new-row':''}>
                {/* Sticky first cell */}
                <td className="sticky-col"><input disabled={!isEditing} value={row.accountName} onChange={e=>handleChange(i,'accountName',e.target.value)} className="cell-input" /></td>
                <td><input disabled={!isEditing} value={row.deliveryManager} onChange={e=>handleChange(i,'deliveryManager',e.target.value)} className="cell-input" /></td>
                <td><input disabled={!isEditing} value={row.projectName} onChange={e=>handleChange(i,'projectName',e.target.value)} className="cell-input" /></td>
                <td><input disabled={!isEditing} value={row.BU} onChange={e=>handleChange(i,'BU',e.target.value)} className="cell-input" /></td>
                <td><input disabled={!isEditing} value={row.VDE} onChange={e=>handleChange(i,'VDE',e.target.value)} className="cell-input" /></td>
                <td><input disabled={!isEditing} value={row.GDE} onChange={e=>handleChange(i,'GDE',e.target.value)} className="cell-input" /></td>
                <td><input disabled={!isEditing} value={row.account} onChange={e=>handleChange(i,'account',e.target.value)} className="cell-input" /></td>
                {MONTH_KEYS.map(mon => (
                  <td key={mon} className="month-col"><input type="number" step="0.01" disabled={!isEditing} value={row[mon]} onChange={e=>handleChange(i,mon,e.target.value)} className="cell-input text-right" /></td>
                ))}
                <td className="total-col">${sum(row).toFixed(2)}</td>
                <td className="comments-col flex items-center">
                  <input disabled={!isEditing} value={row.comments} onChange={e=>handleChange(i,'comments',e.target.value)} className="cell-input flex-grow" />
                  {row.__isNew && isEditing && <XIcon onClick={()=>handleDeleteRow(i)} className="h-4 w-4 text-red-600 cursor-pointer" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}