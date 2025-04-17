// frontend/src/pages/Forecast.jsx
import React, { useEffect, useState } from 'react';
import API from '../services/api';

export default function Forecast() {
  const [years, setYears]     = useState([]);
  const [year, setYear]       = useState(null);
  const [entries, setEntries] = useState([]);
  const [isEditing, setEdit]  = useState(false);

  const MONTHS = [
    'Apr','May','Jun','Jul','Aug','Sep',
    'Oct','Nov','Dec','Jan','Feb','Mar'
  ];

  // fetch FYs
  useEffect(() => {
    API.get('/entries/years', { params: { type: 'forecast' } })
       .then(r => { setYears(r.data.years); setYear(r.data.years[0]); })
       .catch(console.error);
  }, []);

  // fetch rows
  useEffect(() => {
    if (!year) return;
    API.get('/entries', { params: { type: 'forecast', year } })
       .then(r => setEntries(r.data))
       .catch(console.error);
  }, [year]);

  const handleChange = (idx, field, val) => {
    setEntries(es => {
      const a = [...es];
      a[idx][field] = MONTHS.includes(field) ? Number(val) : val;
      return a;
    });
  };

  const addRow = () => {
    const blank = {
      accountName:'',deliveryManager:'',projectName:'',
      BU:'',VDE:'',GDE:'',account:'',
      Apr:0,May:0,Jun:0,Jul:0,Aug:0,Sep:0,
      Oct:0,Nov:0,Dec:0,Jan:0,Feb:0,Mar:0,
      comments:''
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
    window.open(`/api/entries/export?type=forecast&year=${year}`, '_blank');
  };

  // sum per row
  const rowTotal = row =>
    MONTHS.reduce((sum,m)=>sum+(row[m]||0),0).toFixed(2);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* toolbar */}
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
          className="bg-teal-600 text-white px-3 py-1 rounded hover:bg-teal-700"
        >Export as CSV</button>

        {isEditing ? (
          <>
            <button
              onClick={save}
              className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
            >Save</button>
            <button
              onClick={cancel}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
            >Cancel</button>
          </>
        ) : (
          <button
            onClick={()=>setEdit(true)}
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >Edit</button>
        )}

        {isEditing && (
          <button
            onClick={addRow}
            className="ml-auto bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
          >+ Add Project</button>
        )}
      </div>

      {/* scrollable table container */}
      <div className="border rounded bg-white shadow overflow-auto"
           style={{ maxHeight: '70vh' }}>
        <table className="min-w-max border-collapse">
          <thead>
            <tr>
              {[
                'Account Name','Delivery Manager','Project Name',
                'BU','VDE','GDE','Account',
                ...MONTHS,
                'Total','Comments',''
              ].map((h,i) => {
                // header colors & sticky
                let bg = '';
                if (i < 7)         bg = 'bg-blue-100';
                else if (i < 7+MONTHS.length) bg = 'bg-yellow-100';
                else if (i < 7+MONTHS.length+2) bg = 'bg-blue-200';
                else                bg = 'bg-white';

                // compute z-index for sticky layering
                let z = 10;
                if (i < 7) z = 30 - i;    // first 7 columns
                else if (i === 7) z = 15; // first month

                return (
                  <th
                    key={h}
                    className={`px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b ${bg} sticky top-0`}
                    style={{ zIndex: z }}
                  >
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {entries.map((row,i) => (
              <tr key={i} className="hover:bg-gray-50">
                {/* first 7 cols */}
                {[
                  'accountName','deliveryManager','projectName',
                  'BU','VDE','GDE','account'
                ].map((f,colIdx) => (
                  <td
                    key={f}
                    className="px-4 py-2 border-b text-sm"
                    style={{
                      position: 'sticky',
                      left: `${colIdx * 10}rem`,  // adjust 10rem per col
                      background: 'white',
                      zIndex: 20 - colIdx
                    }}
                  >
                    {isEditing
                      ? <input
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={row[f]||''}
                          onChange={e=>handleChange(i,f,e.target.value)}
                        />
                      : <span className="text-gray-800">{row[f]}</span>
                    }
                  </td>
                ))}

                {/* month columns */}
                {MONTHS.map(m => (
                  <td key={m} className="px-4 py-2 border-b text-right text-sm bg-yellow-50">
                    {isEditing
                      ? <input
                          type="number" step="0.01"
                          className="w-full border rounded px-2 py-1 text-sm"
                          value={row[m]}
                          onChange={e=>handleChange(i,m,e.target.value)}
                        />
                      : <span className="text-gray-800">${(row[m]||0).toFixed(2)}</span>
                    }
                  </td>
                ))}

                {/* total */}
                <td className="px-4 py-2 border-b text-right font-semibold bg-blue-200">
                  ${rowTotal(row)}
                </td>

                {/* comments */}
                <td className="px-4 py-2 border-b text-sm bg-blue-200">
                  {isEditing
                    ? <input
                        className="w-full border rounded px-2 py-1 text-sm"
                        value={row.comments||''}
                        onChange={e=>handleChange(i,'comments',e.target.value)}
                      />
                    : <span className="text-gray-600">{row.comments}</span>
                  }
                </td>

                {/* delete icon for new rows */}
                <td className="px-4 py-2 border-b text-center bg-white">
                  {isEditing && !row._id && (
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={()=>setEntries(es => es.filter((_,x)=>x!==i))}
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