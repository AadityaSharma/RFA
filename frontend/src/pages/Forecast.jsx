// frontend/src/pages/Forecast.jsx
import React, { useState, useEffect, useRef } from 'react'
import {
  fetchEntries,
  fetchYears,
  fetchProjects,
  upsertEntry,
  exportEntries
} from '../services/api'
import './Forecast.css' // see CSS snippet below

export default function Forecast() {
  const [years, setYears] = useState([])
  const [projects, setProjects] = useState([])
  const [entries, setEntries] = useState([])
  const [selectedYear, setSelectedYear] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [draftEntries, setDraftEntries] = useState([])
  const tableWrapper = useRef()

  // load years & projects on mount
  useEffect(() => {
    fetchYears('forecast').then(res => {
      const y = res.data.years || []
      setYears(y)
      if (y.length) setSelectedYear(y[0])
    })
    fetchProjects().then(res => setProjects(res.data))
  }, [])

  // reload entries whenever year changes
  useEffect(() => {
    if (!selectedYear) return
    fetchEntries({ type: 'forecast', year: selectedYear }).then(res => {
      setEntries(res.data)
      setDraftEntries(res.data.map(e => ({ ...e })))
    })
  }, [selectedYear])

  // Export CSV
  const handleExport = () => {
    exportEntries('forecast', selectedYear)
      .then(res => {
        const blob = new Blob([res.data], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `forecast_${selectedYear}.csv`
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(console.error)
  }

  // Save all edited rows
  const handleSave = async () => {
    try {
      await Promise.all(
        draftEntries.map(e =>
          upsertEntry({ ...e, type: 'forecast', year: selectedYear })
        )
      )
      setIsEditing(false)
      // reload
      fetchEntries({ type: 'forecast', year: selectedYear }).then(res => {
        setEntries(res.data)
        setDraftEntries(res.data.map(e => ({ ...e })))
      })
    } catch (err) {
      console.error(err)
      alert('Failed to save')
    }
  }

  // Cancel edits
  const handleCancel = () => {
    setDraftEntries(entries.map(e => ({ ...e })))
    setIsEditing(false)
  }

  // Add a new blank row
  const handleAddRow = () => {
    setDraftEntries([
      ...draftEntries,
      {
        accountName: '',
        deliveryManager: '',
        projectName: '',
        BU: '',
        VDE: '',
        GDE: '',
        account: '',
        // months apr..mar
        apr: 0, may: 0, jun: 0, jul: 0, aug: 0, sep: 0,
        oct: 0, nov: 0, dec: 0, jan: 0, feb: 0, mar: 0,
        comments: ''
      }
    ])
    setIsEditing(true)
    // scroll to bottom
    setTimeout(
      () =>
        tableWrapper.current.scrollTo({
          top: tableWrapper.current.scrollHeight,
          behavior: 'smooth'
        }),
      100
    )
  }

  // Update a single cell in draftEntries
  const handleChange = (idx, field, value) => {
    const updated = draftEntries.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    )
    setDraftEntries(updated)
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-4 space-x-2">
        <select
          className="border px-2 py-1 rounded"
          value={selectedYear || ''}
          onChange={e => setSelectedYear(e.target.value)}
        >
          {years.map(y => (
            <option key={y} value={y}>
              FY {y}
            </option>
          ))}
        </select>
        <button
          onClick={handleExport}
          className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
        >
          Export as CSV
        </button>
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            Edit
          </button>
        )}
        <button
          onClick={handleAddRow}
          className="ml-auto bg-indigo-600 text-white px-4 py-1 rounded hover:bg-indigo-700"
        >
          + Add Project
        </button>
      </div>

      <div
        ref={tableWrapper}
        className="overflow-auto border rounded shadow"
        style={{ maxHeight: '70vh' }}
      >
        <table className="min-w-full table-auto border-collapse forecast-table">
          <thead className="bg-gray-100">
            <tr>
              <th className="sticky left-0 bg-gray-100">Account Name</th>
              <th>Delivery Manager</th>
              <th>Project Name</th>
              <th>BU</th>
              <th>VDE</th>
              <th>GDE</th>
              <th>Account</th>
              {['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'].map(m => (
                <th key={m} className="bg-yellow-200">
                  {m}
                </th>
              ))}
              <th className="bg-blue-100">Total</th>
              <th>Comments</th>
            </tr>
          </thead>
          <tbody>
            {draftEntries.map((row, i) => {
              const total = [
                row.apr,row.may,row.jun,row.jul,row.aug,row.sep,
                row.oct,row.nov,row.dec,row.jan,row.feb,row.mar
              ].reduce((a,b) => a + Number(b || 0), 0)
              return (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="sticky left-0 bg-white border px-2 py-1">
                    <input
                      disabled={!isEditing}
                      value={row.accountName}
                      onChange={e => handleChange(i, 'accountName', e.target.value)}
                      className="w-full border p-1 rounded"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      disabled={!isEditing}
                      value={row.deliveryManager}
                      onChange={e => handleChange(i, 'deliveryManager', e.target.value)}
                      className="w-full border p-1 rounded"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      disabled={!isEditing}
                      value={row.projectName}
                      onChange={e => handleChange(i, 'projectName', e.target.value)}
                      className="w-full border p-1 rounded"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      disabled={!isEditing}
                      value={row.BU}
                      onChange={e => handleChange(i, 'BU', e.target.value)}
                      className="w-full border p-1 rounded"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      disabled={!isEditing}
                      value={row.VDE}
                      onChange={e => handleChange(i, 'VDE', e.target.value)}
                      className="w-full border p-1 rounded"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      disabled={!isEditing}
                      value={row.GDE}
                      onChange={e => handleChange(i, 'GDE', e.target.value)}
                      className="w-full border p-1 rounded"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      disabled={!isEditing}
                      value={row.account}
                      onChange={e => handleChange(i, 'account', e.target.value)}
                      className="w-full border p-1 rounded"
                    />
                  </td>
                  {['apr','may','jun','jul','aug','sep','oct','nov','dec','jan','feb','mar'].map(mon => (
                    <td key={mon} className="border px-2 py-1">
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={row[mon]}
                        onChange={e => handleChange(i, mon, e.target.value)}
                        className="w-full border p-1 rounded text-right"
                      />
                    </td>
                  ))}
                  <td className="bg-blue-100 border px-2 py-1 text-right font-semibold">
                    ${total.toFixed(2)}
                  </td>
                  <td className="border px-2 py-1">
                    <input
                      disabled={!isEditing}
                      value={row.comments}
                      onChange={e => handleChange(i, 'comments', e.target.value)}
                      className="w-full border p-1 rounded"
                    />
                  </td>
                </tr>
              )
            })}
            {draftEntries.length === 0 && (
              <tr>
                <td colSpan={20} className="text-center py-4">
                  No data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}