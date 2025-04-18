import React, { useState, useEffect, useRef } from 'react'
import {
  fetchYears,
  fetchProjects,
  fetchEntries,
  upsertEntry,
  exportEntries
} from '../services/api'
import { XIcon } from '@heroicons/react/solid'
import '../pages/Forecast.css'    // reuse the exact same table styles

const MONTH_KEYS  = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar']
const MONTH_LABEL = month => month.charAt(0).toUpperCase() + month.slice(1)

export default function Opportunities() {
  const [years,        setYears]        = useState([])
  const [fy,           setFy]           = useState(null)
  const [projects,     setProjects]     = useState([])
  const [entries,      setEntries]      = useState([])
  const [draftEntries, setDraftEntries] = useState([])
  const [isEditing,    setIsEditing]    = useState(false)
  const wrapperRef = useRef()

  //–– load years & projects
  useEffect(() => {
    fetchYears('opportunity').then(r => {
      const ys = r.data.years || []
      setYears(ys)
      if (ys.length) setFy(ys[0])
    })
    fetchProjects().then(r => setProjects(r.data))
  }, [])

  //–– when fy changes, reload & normalize keys
  useEffect(() => {
    if (!fy) return
    fetchEntries({ type:'opportunity', year:fy }).then(r => {
      const norm = (r.data||[]).map(raw => {
        const e = { ...raw }
        // migrate any Uppercase‐month to lowercase
        MONTH_KEYS.forEach(k => {
          const K = MONTH_LABEL(k)
          if (raw[K] !== undefined) {
            e[k] = raw[K]
            delete e[K]
          }
        })
        return e
      })
      setEntries(norm)
      setDraftEntries(norm.map(e=>({ ...e })))
      setIsEditing(false)
    })
  }, [fy])

  //–– export CSV
  const handleExport = () => {
    exportEntries('opportunity', fy).then(res => {
      const blob = new Blob([res.data], { type:'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `opportunities_${fy}.csv`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  //–– save edits
  const handleSave = async () => {
    // send each row to backend
    await Promise.all(
      draftEntries.map(e =>
        upsertEntry({ ...e, type:'opportunity', year:fy })
      )
    )
    // reload
    fetchEntries({ type:'opportunity', year:fy }).then(r => {
      const norm = (r.data||[]).map(raw => {
        const e = { ...raw }
        MONTH_KEYS.forEach(k => {
          const K = MONTH_LABEL(k)
          if (raw[K] !== undefined) {
            e[k] = raw[K]
            delete e[K]
          }
        })
        return e
      })
      setEntries(norm)
      setDraftEntries(norm.map(e=>({ ...e })))
      setIsEditing(false)
    })
  }

  //–– cancel edits
  const handleCancel = () => {
    setDraftEntries(entries.map(e=>({ ...e })))
    setIsEditing(false)
  }

  //–– add a blank row
  const handleAddRow = () => {
    const blank = {
      accountName: '',
      deliveryManager: '',
      projectName: '',
      probability: '',   // A, B, C…
      status: '',        // In‑progress / Won / Abandoned
      comments: '',
      __isNew: true
    }
    MONTH_KEYS.forEach(k => blank[k]=0)
    setDraftEntries(draftEntries.concat(blank))
    setIsEditing(true)
    setTimeout(() => {
      wrapperRef.current.scrollLeft = wrapperRef.current.scrollWidth
    }, 100)
  }

  //–– delete just‐new rows
  const handleDeleteRow = idx => {
    setDraftEntries(draftEntries.filter((_,i)=>i!==idx))
  }

  //–– single cell change
  const handleChange = (i, field, val) => {
    const copy = [...draftEntries]
    copy[i] = { ...copy[i], [field]: val }
    setDraftEntries(copy)
  }

  //–– helper to sum up months
  const sum = row =>
    MONTH_KEYS.reduce((acc,k)=> acc + (parseFloat(row[k])||0), 0)

  return (
    <div className="p-6">
      {/* controls */}
      <div className="flex items-center mb-4 space-x-2">
        <select
          className="border rounded px-2 py-1"
          value={fy||''}
          onChange={e=>setFy(e.target.value)}
        >
          {years.map(y=>(
            <option key={y} value={y}>FY {y}</option>
          ))}
        </select>

        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-4 py-1 rounded"
        >
          Export CSV
        </button>

        {isEditing
          ? (
            <>
              <button
                onClick={handleSave}
                className="bg-blue-600 text-white px-4 py-1 rounded"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-red-600 text-white px-4 py-1 rounded"
              >
                Cancel
              </button>
            </>
          )
          : (
            <button
              onClick={()=>setIsEditing(true)}
              className="bg-blue-600 text-white px-4 py-1 rounded"
            >
              Edit
            </button>
          )
        }

        <button
          onClick={handleAddRow}
          className="ml-auto bg-indigo-600 text-white px-4 py-1 rounded"
        >
          + Add Opportunity
        </button>
      </div>

      {/* table */}
      <div
        ref={wrapperRef}
        className="overflow-x-auto border rounded table-wrapper"
        style={{ maxHeight:'65vh' }}
      >
        <table className="forecast-table w-max border-collapse min-w-full">
          <thead>
            <tr>
              <th className="sticky-col">Account Name</th>
              <th>Delivery Manager</th>
              <th>Project Name</th>
              <th>Probability</th>
              <th>Status</th>
              {MONTH_KEYS.map(m=>(
                <th key={m} className="month-col">
                  {MONTH_LABEL(m)}
                </th>
              ))}
              <th className="total-col">Total</th>
              <th className="comments-col">Comments</th>
            </tr>
          </thead>

          <tbody>
            {draftEntries.map((row,i)=>(
              <tr key={i} className={row.__isNew?'new-row':''}>
                {/* first 5 fields */}
                {['accountName','deliveryManager','projectName','probability','status']
                  .map((fld,j)=>(
                    <td key={j}
                        className={j===0?'sticky-col p-1':'p-1'}>
                      <input
                        disabled={!isEditing}
                        value={row[fld]||''}
                        onChange={e=>handleChange(i,fld,e.target.value)}
                        className="cell-input"
                      />
                    </td>
                  ))
                }

                {/* month columns */}
                {MONTH_KEYS.map(mon=>(
                  <td key={mon} className="month-col p-1 text-right">
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isEditing}
                      value={row[mon]}
                      onChange={e=>handleChange(i,mon,e.target.value)}
                      className="cell-input text-right"
                    />
                  </td>
                ))}

                {/* total */}
                <td className="total-col p-1 text-right font-semibold">
                  ${sum(row).toFixed(2)}
                </td>

                {/* comments + delete‑icon for new rows */}
                <td className="comments-col p-1 flex items-center space-x-1">
                  <input
                    disabled={!isEditing}
                    value={row.comments||''}
                    onChange={e=>handleChange(i,'comments',e.target.value)}
                    className="cell-input flex-grow"
                  />
                  {row.__isNew && isEditing && (
                    <XIcon
                      onClick={()=>handleDeleteRow(i)}
                      className="h-4 w-4 text-red-600 cursor-pointer"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}