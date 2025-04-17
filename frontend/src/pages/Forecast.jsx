import React, { useEffect, useState } from 'react';
import API from '../services/api';

export default function Forecast() {
  const [years, setYears]       = useState([]);
  const [year, setYear]         = useState(null);
  const [entries, setEntries]   = useState([]);
  const [isEditing, setEdit]    = useState(false);

  // load financial years
  useEffect(() => {
    API.get('/entries/years', { params: { type: 'forecast' } })
      .then(r => {
        setYears(r.data.years);
        setYear(r.data.years[0]);
      })
      .catch(console.error);
  }, []);

  // load entries when year changes
  useEffect(() => {
    if (!year) return;
    API.get('/entries', { params: { type: 'forecast', year } })
      .then(r => setEntries(r.data))
      .catch(console.error);
  }, [year]);

  // handlers
  const handleChange = (idx, field, val) => {
    const a = [...entries];
    a[idx][field] = field.match(/^(Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Jan|Feb|Mar)$/)
      ? Number(val) : val;
    setEntries(a);
  };

  const addRow = () => {
    setEntries(e => ([...e, {
      accountName:'',deliveryManager:'',projectName:'',
      BU:'',VDE:'',GDE:'',account:'',
      Apr:0,May:0,Jun:0,Jul:0,Aug:0,Sep:0,Oct:0,Nov:0,Dec:0,Jan:0,Feb:0,Mar:0,
      total:0,comments:''
    }]));
    setEdit(true);
  };

  const cancel = () => {
    setEdit(false);
    // reload
    API.get('/entries', { params:{ type:'forecast', year }})
       .then(r=>setEntries(r.data))
       .catch(console.error);
  };

  const save = () => {
    API.post('/entries', { type:'forecast', year, entries })
      .then(()=> {
        setEdit(false);
        // reload
        return API.get('/entries', { params:{ type:'forecast', year }});
      })
      .then(r=>setEntries(r.data))
      .catch(console.error);
  };

  const exportCSV = () => {
    window.open(`${import.meta.env.VITE_API_URL}/api/entries/export?type=forecast&year=${year}`, '_blank');
  };

  // compute total per row
  const months = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
  const calcTotal = row => months.reduce((s,m)=>s+(row[m]||0), 0).toFixed(2);

  return (
    <div className="p-4">
      <div className="flex items-center mb-3">
        <select
          value={year || ''}
          onChange={e=>setYear(Number(e.target.value))}
          className="border p-1 mr-4"
          disabled={isEditing}
        >
          {years.map(y=> <option key={y} value={y}>FY {y}</option>)}
        </select>
        <button onClick={exportCSV} className="bg-blue-600 text-white px-3 py-1 mr-2 rounded">
          Export as CSV
        </button>
        {isEditing
          ? <>
              <button onClick={save} className="bg-green-600 text-white px-3 py-1 mr-2 rounded">Save</button>
              <button onClick={cancel} className="bg-gray-500 text-white px-3 py-1 mr-2 rounded">Cancel</button>
            </>
          : <button onClick={()=>setEdit(true)} className="bg-green-600 text-white px-3 py-1 rounded">
              Edit
            </button>
        }
        {isEditing && (
          <button onClick={addRow} className="bg-indigo-600 text-white px-3 py-1 ml-auto rounded">
            + Add Project
          </button>
        )}
      </div>

      <div className="overflow-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-1">Account Name</th>
              <th className="border p-1">Delivery Manager</th>
              <th className="border p-1">Project Name</th>
              <th className="border p-1">BU</th>
              <th className="border p-1">VDE</th>
              <th className="border p-1">GDE</th>
              <th className="border p-1">Account</th>
              {months.map(m=> <th key={m} className="border p-1">{m}</th>)}
              <th className="border p-1">Total</th>
              <th className="border p-1">Comments</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((row, i) => (
              <tr key={i}>
                {['accountName','deliveryManager','projectName','BU','VDE','GDE','account'].map(f=>(
                  <td key={f} className="border p-1">
                    {isEditing
                      ? <input
                          type="text"
                          value={row[f]||''}
                          onChange={e=>handleChange(i, f, e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      : row[f]
                    }
                  </td>
                ))}
                {months.map(m=>(
                  <td key={m} className="border p-1">
                    {isEditing
                      ? <input
                          type="number" step="0.01"
                          value={row[m]}
                          onChange={e=>handleChange(i, m, e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      : `$${row[m]?.toFixed(2)||'0.00'}`
                    }
                  </td>
                ))}
                <td className="border p-1 text-right">
                  {calcTotal(row)}
                </td>
                <td className="border p-1">
                  {isEditing
                    ? <input
                        type="text"
                        value={row.comments||''}
                        onChange={e=>handleChange(i, 'comments', e.target.value)}
                        className="w-full p-1 border rounded"
                      />
                    : row.comments
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}