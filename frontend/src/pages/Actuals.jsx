import React, { useState } from 'react';
import API from '../services/api';

export default function Actuals() {
  const [year, setYear] = useState('');
  const [file, setFile] = useState(null);
  const [msg,  setMsg]  = useState('');

  async function upload() {
    if (!year||!file) return setMsg('Pick year & CSV');
    const fd = new FormData();
    fd.append('year', year);
    fd.append('file', file);
    try {
      await API.post('/actuals/import', fd);
      setMsg('Actuals imported ✅');
    } catch (e) {
      setMsg('Error: ' + (e.response?.data?.details || e.message));
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-xl mb-4">Import Actuals (Finance CSV)</h1>
      <div className="space-y-3">
        <input
          type="number"
          placeholder="Year"
          onChange={e=>setYear(e.target.value)}
          className="p-1 border rounded w-24"
        />
        <input
          type="file"
          accept=".csv"
          onChange={e=>setFile(e.target.files[0])}
          className="border p-1"
        />
        <button
          onClick={upload}
          className="px-3 py-1 bg-green-600 text-white rounded"
        >
          Upload Actuals CSV
        </button>
        {msg && <p className="mt-2 text-red-500">{msg}</p>}
      </div>
    </div>
  );
}