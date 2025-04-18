// frontend/src/pages/NewFY.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

export default function NewFY() {
  const [year, setYear] = useState('');
  const [file, setFile] = useState(null);
  const [msg, setMsg]   = useState('');
  const nav = useNavigate();

  const upload = async () => {
    if (!year || !file) return setMsg('Pick a year & CSV file');
    const fd = new FormData();
    fd.append('year', year);
    fd.append('file', file);
    try {
      await API.post('/fy/import', fd);
      setMsg('Success! Redirecting to Forecast...');
      setTimeout(()=>nav('/forecast'), 1000);
    } catch (e) {
      setMsg('Error: ' + e.response?.data?.message || e.message);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">New Financial Year Setup</h1>
      <div className="space-y-4">
        <div>
          <label className="mr-2">Year:</label>
          <input
            type="number"
            value={year}
            onChange={e=>setYear(e.target.value)}
            className="p-1 border rounded w-24"
          />
        </div>
        <div>
          <input
            type="file"
            accept=".csv"
            onChange={e=>setFile(e.target.files[0])}
            className="border p-1"
          />
        </div>
        <button
          onClick={upload}
          className="px-3 py-1 bg-green-600 text-white rounded"
        >
          Upload CSV
        </button>
        {msg && <p className="text-red-500 mt-2">{msg}</p>}
      </div>
    </div>
  );
}