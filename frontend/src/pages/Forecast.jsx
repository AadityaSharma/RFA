// frontend/src/pages/Forecast.jsx
import React, { useState, useEffect } from 'react'
import {
  fetchForecastYears,
  fetchForecastEntries,
  exportForecastCSV,
  saveForecastEntries
} from '../services/api'

const MONTHS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']

export default function Forecast() {
  const [year, setYear]       = useState('')
  const [years, setYears]     = useState([])
  const [entries, setEntries] = useState([])
  const [editing, setEditing] = useState(false)

  // 1) load FY list
  useEffect(() => {
    fetchForecastYears().then((yrs) => {
      setYears(yrs)
      if (yrs.length) setYear(yrs[0])
    })
  }, [])

  // 2) load table when year changes
  useEffect(() => {
    if (!year) return
    fetchForecastEntries(year).then(setEntries)
  }, [year])

  // 3) Export CSV
  const handleExport = () => {
    exportForecastCSV(year)
  }

  // 4) Add a new local row
  const handleAdd = () => {
    setEntries(es => [
      ...es,
      {
        id: `NEW_${Date.now()}`,         // temporary client‑only id
        accountName: '',
        deliveryManager: '',
        projectName: '',
        bu: '', vde: '', gde: '', account: '',
        months: Array(12).fill(''),
        total: 0,
        comments: '',
        isNew: true
      }
    ])
    setEditing(true)
  }

  // 5) Delete only client‑only rows
  const handleDelete = idx => {
    setEntries(es => es.filter((_,i) => i !== idx))
  }

  // 6) Save all edits back up
  const handleSave = () => {
    saveForecastEntries(year, entries)
      .then(() => {
        setEditing(false)
        return fetchForecastEntries(year)
      })
      .then(setEntries)
  }

  // 7) Cancel edits (reload original)
  const handleCancel = () => {
    setEditing(false)
    fetchForecastEntries(year).then(setEntries)
  }

  return (
    <div className="p-4 space-y-4">
      {/* CONTROLS */}
      <div className="flex items-center space-x-2">
        <select
          className="border px-2 py-1 rounded"
          value={year}
          onChange={e => setYear(e.target.value)}
          disabled={editing}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        <button
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          onClick={handleExport}
          disabled={editing || !year}
        >
          Export as CSV
        </button>

        {!editing
          ? <button
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              onClick={() => setEditing(true)}
            >Edit</button>
          : <>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                onClick={handleSave}
              >Save</button>
              <button
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                onClick={handleCancel}
              >Cancel</button>
            </>
        }

        {editing &&
          <button
            className="ml-auto bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
            onClick={handleAdd}
          >+ Add Project</button>
        }
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border-collapse">
          <thead>
            <tr>
              {/* FIRST COLUMN STICKY */}
              <th
                className="bg-blue-100 border px-2 py-1 text-left text-sm font-semibold"
                style={{ position:'sticky', top:0, left:0, zIndex:50, minWidth:150 }}
              >Account Name</th>

              {/* remaining columns */}
              {[
                'Delivery Manager','Project Name','BU','VDE','GDE','Account',
                ...MONTHS,'Total','Comments',''
              ].map((h,i) => (
                <th
                  key={i}
                  className={
                    i < 6
                      ? 'bg-blue-100'
                      : i < 6 + MONTHS.length
                        ? 'bg-yellow-100'
                        : 'bg-blue-200'
                    + ' border px-2 py-1 text-left text-sm font-semibold'
                  }
                  style={{ position:'sticky', top:0, zIndex:30, backgroundClip:'padding-box' }}
                >{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((row, idx) => (
              <tr
                key={row.id}
                className={idx%2 ? 'bg-white' : 'bg-gray-50'}
              >
                {/* STICKY FIRST CELL */}
                <td
                  className="border px-2 py-1 text-sm whitespace-nowrap"
                  style={{ position:'sticky', left:0, background:'#f3f4f6', zIndex:20 }}
                >
                  {editing
                    ? <input
                        className="w-full border rounded px-1 py-0.5 text-sm"
                        value={row.accountName}
                        onChange={e => {
                          const v=e.target.value
                          setEntries(es=>{
                            const copy=[...es]
                            copy[idx].accountName=v
                            return copy
                          })
                        }}
                      />
                    : row.accountName
                  }
                </td>

                {/* REMAINING NON‑STICKY CELLS */}
                {[
                  row.deliveryManager, row.projectName,
                  row.bu, row.vde, row.gde, row.account
                ].map((val,i) => (
                  <td key={i} className="border px-2 py-1 text-sm whitespace-nowrap">
                    {editing
                      ? <input
                          className="w-full border rounded px-1 py-0.5 text-sm"
                          value={val}
                          onChange={e=>{
                            const v=e.target.value
                            const field=[
                              'deliveryManager','projectName',
                              'bu','vde','gde','account'
                            ][i]
                            setEntries(es=>{
                              const copy=[...es]
                              copy[idx][field]=v
                              return copy
                            })
                          }}
                        />
                      : val
                    }
                  </td>
                ))}

                {/* MONTHS */}
                {row.months.map((mval,mi) => (
                  <td key={mi} className="border px-2 py-1 text-right text-sm whitespace-nowrap">
                    {editing
                      ? <input
                          className="w-full border rounded px-1 py-0.5 text-sm text-right"
                          value={mval}
                          onChange={e=>{
                            const v=e.target.value
                            setEntries(es=>{
                              const copy=[...es]
                              copy[idx].months[mi]=v
                              copy[idx].total = copy[idx].months
                                .map(n=>parseFloat(n)||0)
                                .reduce((a,b)=>a+b,0)
                              return copy
                            })
                          }}
                        />
                      : (isNaN(parseFloat(mval)) ? mval : `$${parseFloat(mval).toFixed(2)}`)
                    }
                  </td>
                ))}

                {/* TOTAL */}
                <td className="border px-2 py-1 text-right font-semibold text-sm">
                  ${row.total.toFixed(2)}
                </td>

                {/* COMMENTS */}
                <td className="border px-2 py-1 text-sm">
                  {editing
                    ? <input
                        className="w-full border rounded px-1 py-0.5 text-sm"
                        value={row.comments}
                        onChange={e=>{
                          const v=e.target.value
                          setEntries(es=>{
                            const copy=[...es]
                            copy[idx].comments=v
                            return copy
                          })
                        }}
                      />
                    : row.comments
                  }
                </td>

                {/* DELETE ICON */}
                <td className="border px-2 py-1 text-center">
                  {editing && row.isNew && (
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={()=>handleDelete(idx)}
                    >&times;</button>
                  )}
                </td>
              </tr>
            ))}

            {/* BOTTOM TOTALS */}
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={1} className="border px-2 py-1 text-right">Totals:</td>
              <td colSpan={6} className="border px-2 py-1" />
              {MONTHS.map((_,mi) => {
                const sum = entries
                  .reduce((s,r)=>s + (parseFloat(r.months[mi])||0), 0)
                return (
                  <td key={mi} className="border px-2 py-1 text-right">
                    ${sum.toFixed(2)}
                  </td>
                )
              })}
              <td className="border px-2 py-1 text-right">
                ${entries.reduce((s,r)=>s + r.total, 0).toFixed(2)}
              </td>
              <td className="border px-2 py-1" />
              <td className="border px-2 py-1" />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}