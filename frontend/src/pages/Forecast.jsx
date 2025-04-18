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
  const [years, setYears] = useState([])
  const [projects, setProjects] = useState([])
  const [entries, setEntries] = useState([])
  const [draftEntries, setDraftEntries] = useState([])
  const [year, setYear] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const wrapperRef = useRef()

  // months in DB = lower‑case keys; labels = title‑case headers
  const MONTH_ORDER  = ['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar']
  const MONTH_LABELS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']

  // load years & projects
  useEffect(() => {
    fetchYears('forecast').then(r => {
      setYears(r.data.years || [])
      if (r.data.years?.length) setYear(r.data.years[0])
    })
    fetchProjects().then(r => setProjects(r.data))
  }, [])

  // when year changes, reload
  useEffect(() => {
    if (!year) return
    fetchEntries({ type: 'forecast', year }).then(r => {
      setEntries(r.data)
      setDraftEntries(r.data.map(e => ({ ...e })))
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

  // Save all rows
  const handleSave = async () => {
    // build payloads with lower‑case month keys
    const payloads = draftEntries.map(row => {
      const base = {
        ...row,
        type: 'forecast',
        year
      }
      // ensure only schema fields remain (strip out __isNew)
      delete base.__isNew
      return base
    })

    try {
      await Promise.all(payloads.map(e => upsertEntry(e)))
      setIsEditing(false)
      // reload from DB
      const fresh = await fetchEntries({ type: 'forecast', year })
      setEntries(fresh.data)
      setDraftEntries(fresh.data.map(e => ({ ...e })))
    } catch (err) {
      console.error(err)
      alert('Save failed: ' + err.message)
    }
  }

  // Cancel edits
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
      __isNew: true,
      // init all months to zero
      apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0,
      oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0
    }
    setDraftEntries(draftEntries.concat(blank))
    setIsEditing(true)
    // scroll to right so new row is visible
    setTimeout(() => {
      wrapperRef.current.scrollLeft = wrapperRef.current.scrollWidth
    }, 100)
  }

  // Delete an unsaved row
  const handleDeleteRow = idx => {
    setDraftEntries(draftEntries.filter((_, i) => i !== idx))
  }

  // Single‑cell edit
  const handleChange = (idx, field, val) => {
    const copy = draftEntries.slice()
    copy[idx] = { ...copy[idx], [field]: val }
    setDraftEntries(copy)
  }

  // sum helper
  const sum = row =>
    MONTH_ORDER.reduce((tot, m) => tot + (parseFloat(row[m]) || 0), 0)

  return (
    <div className="p-6">
      <div className="flex items-center mb-4 space-x-2">
        <select
          className="border rounded px-2 py-1"
          value={year||''}
          onChange={e=>setYear(e.target.value)}
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
          ? <>
              <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-1 rounded">Save</button>
              <button onClick={handleCancel} className="bg-red-600 text-white px-4 py-1 rounded">Cancel</button>
            </>
          : <button onClick={()=>setIsEditing(true)} className="bg-blue-600 text-white px-4 py-1 rounded">Edit</button>
        }
        <button onClick={handleAddRow} className="ml-auto bg-indigo-600 text-white px-4 py-1 rounded">
          + Add Project
        </button>
      </div>

      <div ref={wrapperRef} className="overflow-x-auto border rounded" style={{ maxHeight: '65vh' }}>
        <table className="forecast-table w-max border-collapse min-w-full">
          <thead>
            <tr>
              <th className="sticky-col">Account Name</th>
              <th>Delivery Manager</th>
              <th>Project Name</th>
              <th>BU</th>
              <th>VDE</th>
              <th>GDE</th>
              <th>Account</th>
              {MONTH_ORDER.map((mon,i)=>(
                <th key={mon} className="month-col">
                  {MONTH_LABELS[i]}
                </th>
              ))}
              <th className="total-col">Total</th>
              <th className="comments-col">Comments</th>
            </tr>
          </thead>
          <tbody>
            {draftEntries.map((row,i)=>(
              <tr key={i} className={row.__isNew ? 'new-row' : ''}>
                <td className="sticky-col p-1">
                  <input
                    disabled={!isEditing}
                    value={row.accountName}
                    onChange={e=>handleChange(i,'accountName',e.target.value)}
                    className="cell-input"
                  />
                </td>
                <td className="p-1">
                  <input
                    disabled={!isEditing}
                    value={row.deliveryManager}
                    onChange={e=>handleChange(i,'deliveryManager',e.target.value)}
                    className="cell-input"
                  />
                </td>
                <td className="p-1">
                  <input
                    disabled={!isEditing}
                    value={row.projectName}
                    onChange={e=>handleChange(i,'projectName',e.target.value)}
                    className="cell-input"
                  />
                </td>
                <td className="p-1">
                  <input
                    disabled={!isEditing}
                    value={row.BU}
                    onChange={e=>handleChange(i,'BU',e.target.value)}
                    className="cell-input"
                  />
                </td>
                <td className="p-1">
                  <input
                    disabled={!isEditing}
                    value={row.VDE}
                    onChange={e=>handleChange(i,'VDE',e.target.value)}
                    className="cell-input"
                  />
                </td>
                <td className="p-1">
                  <input
                    disabled={!isEditing}
                    value={row.GDE}
                    onChange={e=>handleChange(i,'GDE',e.target.value)}
                    className="cell-input"
                  />
                </td>
                <td className="p-1">
                  <input
                    disabled={!isEditing}
                    value={row.account}
                    onChange={e=>handleChange(i,'account',e.target.value)}
                    className="cell-input"
                  />
                </td>

                {MONTH_ORDER.map(mon=>(
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

                <td className="total-col p-1 text-right font-semibold">
                  ${sum(row).toFixed(2)}
                </td>
                <td className="comments-col p-1 flex items-center space-x-1">
                  <input
                    disabled={!isEditing}
                    value={row.comments}
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