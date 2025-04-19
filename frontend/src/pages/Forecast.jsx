// frontend/src/pages/Forecast.jsx
import React, { useState, useEffect, useRef } from 'react'
import {
  fetchEntries,
  fetchYears,
  fetchProjects,
  upsertEntries,
  exportEntries
} from '../services/api'
import { XIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon } from '@heroicons/react/solid'
import './Forecast.css'

const STATIC_COLS = [
  { key: 'accountName', label: 'Account Name' },
  { key: 'deliveryManager', label: 'Delivery Manager' },
  { key: 'projectName', label: 'Project Name' },
  { key: 'BU', label: 'BU' },
  { key: 'VDE', label: 'VDE' },
  { key: 'GDE', label: 'GDE' },
  { key: 'account', label: 'Account' }
]

const MONTH_KEYS = [
  'Apr','May','Jun','Jul','Aug','Sep',
  'Oct','Nov','Dec','Jan','Feb','Mar'
]

export default function Forecast() {
  const [years, setYears]               = useState([])
  const [entries, setEntries]           = useState([])
  const [draft, setDraft]               = useState([])
  const [year, setYear]                 = useState(null)
  const [isEditing, setIsEditing]       = useState(false)
  const [collapsed, setCollapsed]       = useState(false)
  const wrapperRef                      = useRef()

  // load years & initial
  useEffect(() => {
    fetchYears('forecast').then(r => {
      const ys = r.data.years || []
      setYears(ys)
      if (ys[0]) setYear(ys[0])
    })
    fetchProjects() // no-op, for future UX
  }, [])

  // reload whenever year changes
  useEffect(() => {
    if (!year) return
    fetchEntries({ type:'forecast', year }).then(r => {
      // normalize month keys from server
      const norm = (r.data||[]).map(raw => {
        const e = { ...raw }
        MONTH_KEYS.forEach(m => {
          if (raw[m] !== undefined) return
          const up = m.charAt(0).toUpperCase()+m.slice(1)
          if (raw[up] !== undefined) {
            e[m] = raw[up]
            delete e[up]
          }
        })
        return e
      })
      setEntries(norm)
      setDraft(norm.map(e=>({ ...e })))
      setIsEditing(false)
    })
  }, [year])

  // Export CSV
  const handleExport = () => {
    exportEntries('forecast', year).then(res => {
      const blob = new Blob([res.data], { type:'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `forecast_${year}.csv`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  // Save bulk
  const handleSave = async () => {
    const clean = draft.map(e => {
      const { _id, createdAt, updatedAt, __isNew, ...rest } = e
      return rest
    })
    await upsertEntries({ type:'forecast', year, entries: clean })
    setIsEditing(false)
    setYear(year) // re‑trigger reload
  }

  // Cancel
  const handleCancel = () => {
    setDraft(entries.map(e=>({ ...e })))
    setIsEditing(false)
  }

  // Add row
  const handleAdd = () => {
    const blank = { accountName:'',deliveryManager:'',projectName:'',
      BU:'',VDE:'',GDE:'',account:'',comments:'',__isNew:true }
    MONTH_KEYS.forEach(m=> blank[m]=0)
    setDraft(d => [...d, blank])
    setIsEditing(true)
    setTimeout(()=> wrapperRef.current.scrollLeft = wrapperRef.current.scrollWidth, 100)
  }

  // Delete unsaved
  const handleDel = idx => {
    setDraft(d => d.filter((_,i)=>i!==idx))
  }

  // Single change
  const onChange = (i, f, v) => {
    setDraft(d => {
      const c = [...d]; c[i] = { ...c[i], [f]: v }; return c
    })
  }

  // Per-row total
  const rowSum = row => MONTH_KEYS.reduce((a,m)=>a+(parseFloat(row[m])||0),0)

  // Bottom totals
  const bottomTotals = MONTH_KEYS.map(m =>
    draft.reduce((a,r)=>a+(parseFloat(r[m])||0),0).toFixed(2)
  )

  return (
    <div className="p-6">
      {/* controls */}
      <div className="flex items-center mb-4 space-x-2">
        <select
          className="border rounded px-2 py-1"
          value={year||''}
          onChange={e=>setYear(e.target.value)}
        >
          {years.map(y=><option key={y} value={y}>FY {y}</option>)}
        </select>
        <button onClick={handleExport} className="btn-export">Export CSV</button>
        {isEditing
          ? <>
              <button onClick={handleSave}   className="btn-save">Save</button>
              <button onClick={handleCancel} className="btn-cancel">Cancel</button>
            </>
          : <button onClick={()=>setIsEditing(true)} className="btn-edit">Edit</button>
        }
        <button onClick={handleAdd} className="btn-add ml-auto">+ Add Project</button>
        <button
          onClick={()=>setCollapsed(c=>!c)}
          className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
        >
          {collapsed
            ? <><ChevronDoubleRightIcon className="h-5 w-5"/> <span>Expand Info</span></>
            : <><ChevronDoubleLeftIcon  className="h-5 w-5"/> <span>Collapse Info</span></>
          }
        </button>
      </div>

      {/* table */}
      <div ref={wrapperRef} className="table-wrapper" style={{ maxHeight:'65vh' }}>
        <table className="forecast-table">
          <thead>
            <tr>
              {/* always‑visible */}
              <th className="sticky-col">Account Name</th>
              {/* collapsed group */}
              {!collapsed && STATIC_COLS.slice(1).map(col=>(
                <th key={col.key}>{col.label}</th>
              ))}
              {/* months */}
              {MONTH_KEYS.map(m=>(
                <th key={m} className="month-col">{m}</th>
              ))}
              <th className="total-col">Total</th>
              <th className="comments-col">Comments</th>
              <th className="timestamp-col sticky-col">Last Updated</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {draft.map((row,i)=>(
              <tr key={i}>
                {/* always */}
                <td className="sticky-col">
                  <input
                    disabled={!isEditing}
                    value={row.accountName||''}
                    onChange={e=>onChange(i,'accountName',e.target.value)}
                    className="cell-input wrap"
                  />
                </td>
                {/* info group */}
                {!collapsed && STATIC_COLS.slice(1).map(col=>(
                  <td key={col.key}>
                    <input
                      disabled={!isEditing}
                      value={row[col.key]||''}
                      onChange={e=>onChange(i,col.key,e.target.value)}
                      className="cell-input wrap"
                    />
                  </td>
                ))}
                {/* months */}
                {MONTH_KEYS.map(m=>(
                  <td key={m} className="month-col">
                    <input
                      type="number" step="0.01"
                      disabled={!isEditing}
                      value={row[m]}
                      onChange={e=>onChange(i,m,e.target.value)}
                      className="cell-input wrap text-right"
                    />
                  </td>
                ))}
                {/* total */}
                <td className="total-col text-right font-semibold">
                  ${rowSum(row).toFixed(2)}
                </td>
                {/* comments */}
                <td className="comments-col">
                  <input
                    disabled={!isEditing}
                    value={row.comments||''}
                    onChange={e=>onChange(i,'comments',e.target.value)}
                    className="cell-input wrap"
                  />
                </td>
                {/* timestamp */}
                <td className="timestamp-col">
                  {row.updatedAt
                    ? new Date(row.updatedAt).toLocaleDateString(undefined,{
                        day:'2-digit',month:'short',year:'numeric'})
                    : '--'}
                </td>
                {/* delete */}
                <td>
                  {row.__isNew && isEditing &&
                    <XIcon
                      onClick={()=>handleDel(i)}
                      className="h-4 w-4 text-red-600 cursor-pointer"
                    />}
                </td>
              </tr>
            ))}

            {/* bottom‑totals row */}
            <tr className="bottom-row">
              <td className="sticky-col font-semibold">Totals</td>
              {!collapsed && <td colSpan={STATIC_COLS.length - 1}></td>}
              {bottomTotals.map((t,i)=>(
                <td key={i} className="month-col text-right font-semibold">{t}</td>
              ))}
              <td className="total-col"></td>
              <td className="comments-col"></td>
              <td className="timestamp-col"></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}