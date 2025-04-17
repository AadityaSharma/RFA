// frontend/src/pages/Forecast.jsx
import React, { useEffect, useState } from 'react';
import API from '../services/api';

export default function Forecast() {
  const [years, setYears]     = useState([]);
  const [year, setYear]       = useState(null);
  const [entries, setEntries] = useState([]);
  const [isEditing, setEdit]  = useState(false);

  const months = [
    'Apr','May','Jun','Jul','Aug','Sep',
    'Oct','Nov','Dec','Jan','Feb','Mar'
  ];

  // load financial years
  useEffect(() => {
    API.get('/entries/years', { params: { type: 'forecast' } })
      .then(r => {
        setYears(r.data.years);
        if (r.data.years.length) setYear(r.data.years[0]);
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

  // handle field changes
  const handleChange = (idx, field, val) => {
    setEntries(es => {
      const a = [...es];
      a[idx][field] = months.includes(field)
        ? Number(val)
        : val;
      return a;
    });
  };

  // add a brand‑new blank row
  const addRow = () => {
    const blank = {
      accountName:'',deliveryManager:'',projectName:'',
      BU:'',VDE:'',GDE:'',account:'',
      Apr:0,May:0,Jun:0,Jul:0,Aug:0,Sep:0,
      Oct:0,Nov:0,Dec:0,Jan:0,Feb:0,Mar:0,
      total:0,comments:''
    };
    setEntries(es => [...es, blank]);
    setEdit(true);
  };

  // cancel = discard local edits
  const cancel = () => {
    setEdit(false);
    API.get('/entries', { params: { type:'forecast', year } })
       .then(r => setEntries(r.data))
       .catch(console.error);
  };

  // save = upsert to backend
  const save = () => {
    API.post('/entries', {
      type: 'forecast',
      year,
      entries
    })
    .then(() => {
      setEdit(false);
      return API.get('/entries', { params:{ type:'forecast', year }});
    })
    .then(r => setEntries(r.data))
    .catch(console.error);
  };

  // export CSV
  const exportCSV = () => {
    window.open(
      `${import.meta.env.VITE_API_URL}/entries/export?type=forecast&year=${year}`,
      '_blank'
    );
  };

  // compute per‑row total
  const rowTotal = row =>
    months.reduce((sum,m)=>sum+(row[m]||0),0).toFixed(2);

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <select
          className="border p-1 mr-4"
          disabled={isEditing}
          value={year||''}
          onChange={e=>setYear(Number(e.target.value))}
        >
          {years.map(y => (
            <option key={y} value={y}>FY {y}</option>
          ))}
        </select>

        <button
          onClick={exportCSV}
          className="bg-blue-600 text-white px-3 py-1 mr-2 rounded"
        >
          Export as CSV
        </button>

        {isEditing
          ? (
            <>
              <button
                onClick={save}
                className="bg-green-600 text-white px-3 py-1 mr-2 rounded"
              >Save</button>
              <button
                onClick={cancel}
                className="bg-gray-500 text-white px-3 py-1 mr-2 rounded"
              >Cancel</button>
            </>
          )
          : (
            <button
              onClick={()=>setEdit(true)}
              className="bg-green-600 text-white px-3 py-1 mr-2 rounded"
            >Edit</button>
          )
        }

        {isEditing && (
          <button
            onClick={addRow}
            className="bg-indigo-600 text-white px-3 py-1 rounded ml-auto"
          >+ Add Project</button>
        )}
      </div>

      <div className="overflow-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              {[
                'Account Name','Delivery Manager','Project Name',
                'BU','VDE','GDE','Account',
                ...months,
                'Total','Comments',''
              ].map(h=>(
                <th key={h} className="border p-1">{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {entries.map((row,i) => (
              <tr key={i}>
                {[
                  'accountName','deliveryManager','projectName',
                  'BU','VDE','GDE','account'
                ].map(f=>(
                  <td key={f} className="border p-1">
                    {isEditing
                      ? <input
                          className="w-full p-1 border rounded"
                          value={row[f]||''}
                          onChange={e=>handleChange(i,f,e.target.value)}
                        />
                      : row[f]
                    }
                  </td>
                ))}

                {months.map(m=>(
                  <td key={m} className="border p-1 text-right">
                    {isEditing
                      ? <input
                          type="number" step="0.01"
                          className="w-full p-1 border rounded"
                          value={row[m]}
                          onChange={e=>handleChange(i,m,e.target.value)}
                        />
                      : `$${(row[m]||0).toFixed(2)}`
                    }
                  </td>
                ))}

                <td className="border p-1 text-right">
                  {rowTotal(row)}
                </td>

                <td className="border p-1">
                  {isEditing
                    ? <input
                        className="w-full p-1 border rounded"
                        value={row.comments||''}
                        onChange={e=>handleChange(i,'comments',e.target.value)}
                      />
                    : row.comments
                  }
                </td>

                <td className="border p-1 text-center">
                  {isEditing && !row._id && (
                    <button
                      className="text-red-600"
                      onClick={()=>setEntries(es => es.filter((_,idx)=>idx!==i))}
                    >
                      🗑
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}