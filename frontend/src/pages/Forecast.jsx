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

  useEffect(() => {
    API.get('/entries/years', { params: { type: 'forecast' } })
      .then(r => { setYears(r.data.years); setYear(r.data.years[0]); })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!year) return;
    API.get('/entries', { params: { type: 'forecast', year } })
      .then(r => setEntries(r.data))
      .catch(console.error);
  }, [year]);

  const handleChange = (idx, field, val) => {
    setEntries(es => {
      const a = [...es];
      a[idx][field] = months.includes(field) ? Number(val) : val;
      return a;
    });
  };

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

  const cancel = () => {
    setEdit(false);
    API.get('/entries', { params: { type:'forecast', year } })
       .then(r => setEntries(r.data));
  };

  const save = () => {
    API.post('/entries', { type:'forecast', year, entries })
      .then(() => {
        setEdit(false);
        return API.get('/entries', { params:{ type:'forecast', year }});
      })
      .then(r => setEntries(r.data))
      .catch(console.error);
  };

  const exportCSV = () => {
    // now goes to /api/entries/export via the proxy
    window.open(`/api/entries/export?type=forecast&year=${year}`, '_blank');
  };

  const rowTotal = row =>
    months.reduce((sum,m)=>sum+(row[m]||0),0).toFixed(2);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-wrap items-center mb-4 space-x-2">
        <select
          className="border rounded px-2 py-1 bg-white"
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
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
        >Export CSV</button>

        {isEditing ? (
          <>
            <button
              onClick={save}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >Save</button>
            <button
              onClick={cancel}
              className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
            >Cancel</button>
          </>
        ) : (
          <button
            onClick={()=>setEdit(true)}
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          >Edit</button>
        )}

        {isEditing && (
          <button
            onClick={addRow}
            className="ml-auto bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
          >+ Add Project</button>
        )}
      </div>

      <div className="overflow-x-auto border rounded bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              {[
                'Account Name','Delivery Manager','Project Name',
                'BU','VDE','GDE','Account',
                ...months,
                'Total','Comments',''
              ].map(h=>(
                <th key={h}
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {entries.map((row,i) => (
              <tr key={i} className="hover:bg-gray-50">
                {[
                  'accountName','deliveryManager','projectName',
                  'BU','VDE','GDE','account'
                ].map(f=>(
                  <td key={f} className="px-2 py-1">
                    {isEditing
                      ? <input
                          className="w-full border rounded px-1 py-1"
                          value={row[f]||''}
                          onChange={e=>handleChange(i,f,e.target.value)}
                        />
                      : <span className="text-gray-800">{row[f]}</span>
                    }
                  </td>
                ))}

                {months.map(m=>(
                  <td key={m} className="px-2 py-1 text-right">
                    {isEditing
                      ? <input
                          type="number" step="0.01"
                          className="w-full border rounded px-1 py-1"
                          value={row[m]}
                          onChange={e=>handleChange(i,m,e.target.value)}
                        />
                      : <span className="text-gray-800">${(row[m]||0).toFixed(2)}</span>
                    }
                  </td>
                ))}

                <td className="px-2 py-1 text-right font-semibold">
                  ${rowTotal(row)}
                </td>

                <td className="px-2 py-1">
                  {isEditing
                    ? <input
                        className="w-full border rounded px-1 py-1"
                        value={row.comments||''}
                        onChange={e=>handleChange(i,'comments',e.target.value)}
                      />
                    : <span className="text-gray-600">{row.comments}</span>
                  }
                </td>

                <td className="px-2 py-1 text-center">
                  {isEditing && !row._id && (
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={()=>setEntries(es => es.filter((_,idx)=>idx!==i))}
                    >🗑</button>
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