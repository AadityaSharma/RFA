// frontend/src/pages/Forecast.jsx
import React, { useState, useEffect } from 'react'
import { fetchEntries, exportEntriesCSV, saveEntries } from '../services/api'

const FY_YEARS = []          // fetched from API in real app
const MONTHS  = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']

// widths of the sticky columns (in px)
const stickyWidths = [150, 150, 180, 120, 120, 120, 150]

// compute left offsets for each sticky column
const leftOffsets = stickyWidths.map((_,i) =>
  stickyWidths.slice(0,i).reduce((sum,w)=>sum+w, 0)
)

export default function Forecast() {
  const [year, setYear]       = useState('')
  const [entries, setEntries] = useState([])
  const [editing, setEditing] = useState(false)

  // load available FYs & default year
  useEffect(() => {
    // e.g. from /api/years?type=forecast
    fetchEntries('years?type=forecast').then(yrs => {
      FY_YEARS.splice(0, FY_YEARS.length, ...yrs)
      setYear(yrs[0])
    })
  }, [])

  // load table whenever year changes
  useEffect(() => {
    if (!year) return
    fetchEntries(`entries?type=forecast&year=${year}`)
      .then(setEntries)
      .catch(console.error)
  }, [year])

  const onExport = () => {
    exportEntriesCSV('forecast', year)
  }

  const onAddRow = () => {
    setEntries(es => [
      ...es,
      {
        id:       `NEW_${Date.now()}`,
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

  const onDeleteRow = idx => {
    setEntries(es => es.filter((_,i) => i!==idx))
  }

  const onSave = () => {
    saveEntries('forecast', year, entries)
      .then(_ => {
        setEditing(false)
        // reload
        return fetchEntries(`entries?type=forecast&year=${year}`)
      })
      .then(setEntries)
      .catch(console.error)
  }

  const onCancel = () => {
    setEditing(false)
    // reload
    fetchEntries(`entries?type=forecast&year=${year}`)
      .then(setEntries)
      .catch(console.error)
  }

  return (
    <div className="p-4 space-y-4">
      {/* Controls */}
      <div className="flex items-center space-x-2">
        <select
          className="border px-2 py-1 rounded"
          value={year}
          onChange={e => setYear(e.target.value)}
        >
          {FY_YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
        <button
          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
          onClick={onExport}
        >
          Export as CSV
        </button>
        {editing
          ? <>
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                onClick={onSave}
              >Save</button>
              <button
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                onClick={onCancel}
              >Cancel</button>
            </>
          : <button
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              onClick={() => setEditing(true)}
            >Edit</button>
        }
        {editing &&
          <button
            className="ml-auto bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
            onClick={onAddRow}
          >+ Add Project</button>
        }
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed border-collapse">
          <thead>
            <tr>
              {[
                'Account Name','Delivery Manager','Project Name',
                'BU','VDE','GDE','Account',
                ...MONTHS,
                'Total','Comments',''
              ].map((h,i) => {
                const bg = i < 7
                  ? 'bg-blue-100'
                  : i < 7 + MONTHS.length
                    ? 'bg-yellow-100'
                    : 'bg-blue-200'

                // sticky first 7 columns
                const isSticky = i < stickyWidths.length
                const style = {
                  position: 'sticky',
                  top: 0,
                  zIndex: 300,
                  left:   isSticky ? leftOffsets[i] : undefined
                }

                return (
                  <th
                    key={i}
                    className={`${bg} border px-2 py-1 text-left text-sm font-semibold`}
                    style={style}
                  >{h}</th>
                )
              })}
            </tr>
          </thead>

          <tbody>
            {entries.map((row, idx) => {
              // alternating row shading
              const rowBg = idx % 2
                ? 'bg-white'
                : 'bg-gray-50'

              return (
                <tr key={row.id} className={rowBg}>
                  {/* first 7 sticky cols */}
                  {[
                    row.accountName,
                    row.deliveryManager,
                    row.projectName,
                    row.bu, row.vde, row.gde, row.account
                  ].map((cell, i) => {
                    const style = {
                      position: 'sticky',
                      left: leftOffsets[i],
                      zIndex: 200
                    }
                    return (
                      <td
                        key={`c${i}`}
                        className="border px-2 py-1 text-sm whitespace-nowrap"
                        style={style}
                      >
                        {editing
                          ? <input
                              className="w-full border rounded px-1 py-0.5 text-sm"
                              value={cell||''}
                              onChange={e => {
                                const v = e.target.value
                                setEntries(es => {
                                  const copy = [...es]
                                  copy[idx][
                                    ['accountName',
                                     'deliveryManager',
                                     'projectName',
                                     'bu','vde','gde','account'][i]
                                  ] = v
                                  return copy
                                })
                              }}
                            />
                          : cell
                        }
                      </td>
                    )
                  })}

                  {/* month columns */}
                  {row.months.map((mval, mi) => (
                    <td
                      key={mi}
                      className="border px-2 py-1 text-right text-sm whitespace-nowrap"
                    >
                      {editing
                        ? <input
                            className="w-full border rounded px-1 py-0.5 text-sm text-right"
                            value={mval||''}
                            onChange={e => {
                              const v = e.target.value
                              setEntries(es => {
                                const copy = [...es]
                                copy[idx].months[mi] = v
                                copy[idx].total = copy[idx].months
                                  .map(parseFloat)
                                  .filter(n=>!isNaN(n))
                                  .reduce((sum,n)=>sum+n,0)
                                return copy
                              })
                            }}
                          />
                        : (
                            typeof mval === 'number'
                              ? `$${mval.toFixed(2)}`
                              : mval
                          )
                      }
                    </td>
                  ))}

                  {/* total */}
                  <td className="border px-2 py-1 text-right font-semibold text-sm">
                    ${row.total.toFixed(2)}
                  </td>

                  {/* comments */}
                  <td className="border px-2 py-1 text-sm">
                    {editing
                      ? <input
                          className="w-full border rounded px-1 py-0.5 text-sm"
                          value={row.comments||''}
                          onChange={e => {
                            const v = e.target.value
                            setEntries(es => {
                              const copy = [...es]
                              copy[idx].comments = v
                              return copy
                            })
                          }}
                        />
                      : row.comments
                    }
                  </td>

                  {/* delete icon for new rows */}
                  <td className="border px-2 py-1 text-center">
                    {editing && row.isNew && (
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={() => onDeleteRow(idx)}
                      >&times;</button>
                    )}
                  </td>
                </tr>
              )
            })}

            {/* bottom totals row */}
            <tr className="bg-gray-100 font-semibold">
              <td colSpan={7} className="border px-2 py-1 text-right">Total</td>
              {MONTHS.map((_,mi) => {
                const sum = entries
                  .map(r => parseFloat(r.months[mi])||0)
                  .reduce((a,b)=>a+b,0)
                return (
                  <td key={mi} className="border px-2 py-1 text-right">
                    { `$${sum.toFixed(2)}` }
                  </td>
                )
              })}
              <td className="border px-2 py-1 text-right">
                {`$${entries
                  .map(r=>r.total)
                  .reduce((a,b)=>a+b,0)
                  .toFixed(2)}`}
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