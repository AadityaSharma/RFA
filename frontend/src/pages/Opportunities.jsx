// frontend/src/pages/Opportunities.jsx
import React, { useState, useEffect, useRef } from 'react'
import {
  fetchYears,
  fetchProjects,
  fetchEntries,
  upsertEntries,
  exportEntries
} from '../services/api'
import { XIcon } from '@heroicons/react/solid'
import '../pages/Forecast.css'    // reuse the same base table styles

const MONTH_KEYS  = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar']
const MONTH_LABEL = m => m.charAt(0).toUpperCase()+m.slice(1)
const PROBS       = ['A','B','C','D','E']
const STATUSES    = ['In-Progress','Abandoned','Won']

export default function Opportunities() {
  const [years,        setYears]        = useState([])
  const [fy,           setFy]           = useState(null)
  const [projects,     setProjects]     = useState([])
  const [entries,      setEntries]      = useState([])
  const [draftEntries, setDraftEntries] = useState([])
  const [isEditing,    setIsEditing]    = useState(false)
  const [filterProb,   setFilterProb]   = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const wrapperRef = useRef()

  //–– load years & projects
  useEffect(() => {
    fetchYears('opportunity').then(r => {
      const ys = r.data.years || []
      setYears(ys)
      if (ys[0]) setFy(ys[0])
    })
    fetchProjects().then(r => setProjects(r.data))
  }, [])

  //–– when fy changes, reload & normalize keys
  useEffect(() => {
    if (!fy) return
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
  }, [fy])

  //–– CSV export
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

  //–– Save all edits/new rows in bulk
  const handleSave = async () => {
    // strip out client‐only props before sending
    const clean = draftEntries.map(e => {
      /* pull off anything we don't want to send */
      const { _id, createdAt, updatedAt, __isNew, ...rest } = e
      return rest
    })

    await upsertEntries({
      entries: clean,
      type:    'opportunity',
      year:    fy
    })

    // re‐reload from server
    const r = await fetchEntries({ type:'opportunity', year:fy })
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
  }

  //–– Cancel => rollback
  const handleCancel = () => {
    setDraftEntries(entries.map(e=>({ ...e })))
    setIsEditing(false)
  }

  //–– Add a blank new row
  const handleAddRow = () => {
    const blank = {
      accountName:     '',
      deliveryManager: '',
      projectName:     '',
      probability:     '',
      status:          'In-Progress',
      comments:        '',
      __isNew:         true
    }
    MONTH_KEYS.forEach(k=> blank[k]=0)
    setDraftEntries(draftEntries.concat(blank))
    setIsEditing(true)
    setTimeout(() => {
      wrapperRef.current.scrollLeft = wrapperRef.current.scrollWidth
    }, 100)
  }

  //–– Remove an unsaved row
  const handleDeleteRow = idx => {
    setDraftEntries(draftEntries.filter((_,i)=>i!==idx))
  }

  //–– One‐cell edit
  const handleChange = (i, fld, val) => {
    const copy = [...draftEntries]
    copy[i]  = { ...copy[i], [fld]: val }
    setDraftEntries(copy)
  }

  //–– Sum helper
  const sum = row =>
    MONTH_KEYS.reduce((acc,k)=> acc + (parseFloat(row[k])||0), 0)

  //–– Visibility + always show unsaved (__isNew) rows
  const visible = draftEntries.filter(row => {
    if (row.__isNew) return true
    if (filterProb   && row.probability !== filterProb) return false
    if (filterStatus && row.status      !== filterStatus) return false
    return true
  })

  return (
    <div className="p-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center mb-4 space-x-2">
        {/* FY */}
        <select
          className="border rounded px-2 py-1"
          value={fy||''}
          onChange={e=>setFy(e.target.value)}
          disabled={isEditing}
        >
          {years.map(y=> <option key={y} value={y}>FY {y}</option>)}
        </select>

        {/* Probability filter */}
        <select
          className="border rounded px-2 py-1"
          value={filterProb}
          onChange={e=>setFilterProb(e.target.value)}
          disabled={isEditing}
        >
          <option value="">All Probabilities</option>
          {PROBS.map(p=> <option key={p} value={p}>{p}</option>)}
        </select>

        {/* Status filter */}
        <select
          className="border rounded px-2 py-1"
          value={filterStatus}
          onChange={e=>setFilterStatus(e.target.value)}
          disabled={isEditing}
        >
          <option value="">All Statuses</option>
          {STATUSES.map(s=> <option key={s} value={s}>{s}</option>)}
        </select>

        <button onClick={handleExport}
                className="bg-green-600 text-white px-4 py-1 rounded">
          Export CSV
        </button>

        {isEditing
          ? <>
              <button onClick={handleSave}
                      className="bg-blue-600 text-white px-4 py-1 rounded">
                Save
              </button>
              <button onClick={handleCancel}
                      className="bg-red-600 text-white px-4 py-1 rounded">
                Cancel
              </button>
            </>
          : <button onClick={()=>setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-1 rounded">
              Edit
            </button>
        }

        <button onClick={handleAddRow}
                className="ml-auto bg-indigo-600 text-white px-4 py-1 rounded">
          + Add Opportunity
        </button>
      </div>

      {/* Table */}
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
                <th key={m} className="month-col">{MONTH_LABEL(m)}</th>
              ))}
              <th className="total-col">Total</th>
              <th>Last Updated At</th>
              <th className="comments-col">Comments</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row,i) => {
              const isFrozen = row.status==='Abandoned' || row.status==='Won'
              const rowClass = row.status==='Abandoned'
                ? 'abandoned-row'
                : row.status==='Won'
                  ? 'won-row'
                  : ''
              return (
                <tr key={i} className={`${row.__isNew?'new-row':''} ${rowClass}`}>
                  {['accountName','deliveryManager','projectName'].map((fld,j)=>(
                    <td key={fld} className={j===0?'sticky-col p-1':'p-1'}>
                      <input
                        disabled={!isEditing||isFrozen}
                        value={row[fld]||''}
                        onChange={e=>handleChange(i,fld,e.target.value)}
                        className="cell-input"
                      />
                    </td>
                  ))}

                  {/* probability */}
                  <td className="p-1">
                    <select
                      disabled={!isEditing||isFrozen}
                      value={row.probability||''}
                      onChange={e=>handleChange(i,'probability',e.target.value)}
                      className="cell-input"
                    >
                      <option value="">–</option>
                      {PROBS.map(p=> <option key={p} value={p}>{p}</option>)}
                    </select>
                  </td>

                  {/* status */}
                  <td className="p-1">
                    <select
                      disabled={!isEditing}
                      value={row.status||''}
                      onChange={e=>handleChange(i,'status',e.target.value)}
                      className="cell-input"
                    >
                      <option value="">–</option>
                      {STATUSES.map(s=> <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>

                  {/* months */}
                  {MONTH_KEYS.map(mon=>(
                    <td key={mon} className="month-col p-1 text-right">
                      <input
                        type="number"
                        step="0.01"
                        disabled={!isEditing||isFrozen}
                        value={row[mon]}
                        onChange={e=>handleChange(i,mon,e.target.value)}
                        className="cell-input text-right"
                      />
                    </td>
                  ))}

                  {/* total */}
                  <td className="total-col p-1 text-right font-semibold">
                    ${ row.status==='Abandoned'
                        ? '0.00'
                        : sum(row).toFixed(2)
                    }
                  </td>

                  {/* last updated */}
                  <td className="p-1 text-sm text-gray-600">
                    {row.updatedAt
                      ? new Date(row.updatedAt).toLocaleDateString('en-US',{
                          day:'2-digit',month:'short',year:'numeric'
                        })
                      : '-'}
                  </td>

                  {/* comments + delete‑icon */}
                  <td className="comments-col p-1 flex items-center space-x-1">
                    <input
                      disabled={!isEditing||isFrozen}
                      value={row.comments||''}
                      onChange={e=>handleChange(i,'comments',e.target.value)}
                      className="cell-input flex-grow"
                    />
                    {row.__isNew&&isEditing&&(
                      <XIcon
                        onClick={()=>handleDeleteRow(i)}
                        className="h-4 w-4 text-red-600 cursor-pointer"
                      />
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}