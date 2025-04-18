// frontend/src/pages/Forecast.jsx
import React, { useState, useEffect, useRef } from 'react'
import {
  fetchEntries,
  fetchYears,
  fetchProjects,
  upsertEntry,
  exportEntries
} from '../services/api'
import { XIcon } from '@heroicons/react/solid'
import './Forecast.css'

export default function Forecast() {
  // lowercase keys, exactly matching your Mongo schema
  const MONTHS = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar']


 const CORE_FIELDS = [
   'accountName','deliveryManager','projectName',
   'BU','VDE','GDE','account','comments'
 ]


  const [years, setYears] = useState([])
  const [projects, setProjects] = useState([])
  const [entries, setEntries] = useState([])
  const [draftEntries, setDraftEntries] = useState([])
  const [year, setYear] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const wrapperRef = useRef()

  // 1) load FY list and projects
  useEffect(() => {
    fetchYears('forecast').then(r => {
      const yrs = r.data.years || []
      setYears(yrs)
      if (yrs.length) setYear(yrs[0])
    })
    fetchProjects().then(r => setProjects(r.data))
  }, [])

  // 2) on FY change → fetch & normalize month keys
  useEffect(() => {
    if (!year) return
    fetchEntries({ type: 'forecast', year }).then(r => {
      const normalized = (r.data || []).map(raw => {
        const e = { ...raw }
        MONTHS.forEach(m => {
          const cap = m.charAt(0).toUpperCase() + m.slice(1)
          if (e[cap] !== undefined) {
            e[m] = e[cap]
            delete e[cap]
          }
        })
        return e
      })
      setEntries(normalized)
      setDraftEntries(normalized.map(e => ({ ...e })))
      setIsEditing(false)
    })
  }, [year])

  // Export CSV
  const handleExport = () => {
    exportEntries('forecast', year).then(res => {
      const blob = new Blob([res.data], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `forecast_${year}.csv`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  // Save (upsert each row)
  const handleSave = async () => {
    /* await Promise.all(
      draftEntries.map(e => {
        // strip any stray uppercase-month props before sending
        MONTHS.forEach(m => delete e[m.charAt(0).toUpperCase() + m.slice(1)])
        return upsertEntry({ ...e, type: 'forecast', year })
      })
    ) */

        // build a truly “clean” payload for each row
    const payloads = draftEntries.map(row => {
      const clean = { type: 'forecast', year }
      // preserve existing _id so Mongoose can update
      if (row._id) clean._id = row._id

      // core scalar fields
      CORE_FIELDS.forEach(f => {
        clean[f] = row[f] !== undefined ? row[f] : ''
      })

      // months as numbers
      MONTHS.forEach(m => {
        clean[m] = parseFloat(row[m]) || 
      })

      return clean
    })

    // send each one as an array of length=1 (per our new api.js helper)
    await Promise.all(
      payloads.map(pl => upsertEntry(pl, 'forecast', year))
    )

    // reload after save
    fetchEntries({ type: 'forecast', year }).then(r => {
      const normalized = (r.data || []).map(raw => {
        const e = { ...raw }
        MONTHS.forEach(m => {
          const cap = m.charAt(0).toUpperCase() + m.slice(1)
          if (e[cap] !== undefined) {
            e[m] = e[cap]
            delete e[cap]
          }
        })
        return e
      })
      setEntries(normalized)
      setDraftEntries(normalized.map(e => ({ ...e })))
      setIsEditing(false)
    })
  }

  // Cancel edits → rollback draft
  const handleCancel = () => {
    setDraftEntries(entries.map(e => ({ ...e })))
    setIsEditing(false)
  }

  // Add new blank row
  const handleAddRow = () => {
    const blank = {
      accountName: '',
      deliveryManager: '',
      projectName: '',
      BU: '',
      VDE: '',
      GDE: '',
      account: '',
      comments: '',
      __isNew: true
    }
    // zero‐initialize months
    MONTHS.forEach(m => { blank[m] = 0 })
    setDraftEntries(draftEntries.concat(blank))
    setIsEditing(true)
    // scroll to end
    setTimeout(() => {
      wrapperRef.current.scrollLeft = wrapperRef.current.scrollWidth
    }, 100)
  }

  // Delete just‐new row
  const handleDeleteRow = idx => {
    setDraftEntries(draftEntries.filter((_, i) => i !== idx))
  }

  // Single‐cell edit
  const handleChange = (idx, field, val) => {
    const copy = draftEntries.slice()
    copy[idx] = { ...copy[idx], [field]: val }
    setDraftEntries(copy)
  }

  // sum helper
  const sumRow = row =>
    MONTHS.reduce((tot, m) => tot + (parseFloat(row[m]) || 0), 0)

  return (
    <div className="p-6">
      <div className="flex items-center mb-4 space-x-2">
        <select
          className="border rounded px-2 py-1"
          value={year || ''}
          onChange={e => setYear(e.target.value)}
        >
          {years.map(y => (
            <option key={y} value={y}>FY {y}</option>
          ))}
        </select>
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-4 py-1 rounded"
        >
          Export CSV
        </button>
        {isEditing ? (
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
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-1 rounded"
          >
            Edit
          </button>
        )}
        <button
          onClick={handleAddRow}
          className="ml-auto bg-indigo-600 text-white px-4 py-1 rounded"
        >
          + Add Project
        </button>
      </div>

      <div
        ref={wrapperRef}
        className="overflow-x-auto border rounded table-wrapper"
        style={{ maxHeight: '65vh' }}
      >
        <table className="forecast-table w-max border-collapse min-w-full">
          <thead>
            <tr>
              <th className="sticky-col">Account Name</th>
              <th>Delivery Manager</th>
              <th>Project Name</th>
              <th>BU</th>
              <th>VDE</th>
              <th>GDE</th>
              <th>Account</th>
              {MONTHS.map(m => (
                <th key={m} className="month-col">
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </th>
              ))}
              <th className="total-col">Total</th>
              <th className="comments-col">Comments</th>
            </tr>
          </thead>
          <tbody>
            {draftEntries.map((row, i) => (
              <tr key={i} className={row.__isNew ? 'new-row' : ''}>
                {[
                  'accountName','deliveryManager','projectName',
                  'BU','VDE','GDE','account'
                ].map((f, j) => (
                  <td key={j} className={j===0?'sticky-col p-1':'p-1'}>
                    <input
                      disabled={!isEditing}
                      value={row[f]||''}
                      onChange={e => handleChange(i,f,e.target.value)}
                      className="cell-input"
                    />
                  </td>
                ))}

                {MONTHS.map(mon => (
                  <td key={mon} className="month-col p-1 text-right">
                    <input
                      type="number"
                      step="0.01"
                      disabled={!isEditing}
                      value={row[mon]}
                      onChange={e => handleChange(i,mon,e.target.value)}
                      className="cell-input text-right"
                    />
                  </td>
                ))}

                <td className="total-col p-1 text-right font-semibold">
                  ${sumRow(row).toFixed(2)}
                </td>
                <td className="comments-col p-1 flex items-center space-x-1">
                  <input
                    disabled={!isEditing}
                    value={row.comments||''}
                    onChange={e => handleChange(i,'comments',e.target.value)}
                    className="cell-input flex-grow"
                  />
                  {row.__isNew && isEditing && (
                    <XIcon
                      onClick={() => handleDeleteRow(i)}
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