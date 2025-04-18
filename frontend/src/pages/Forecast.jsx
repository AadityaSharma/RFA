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

const MONTH_KEYS = [
  'apr','may','jun','jul','aug','sep',
  'oct','nov','dec','jan','feb','mar'
]

export default function Forecast() {
  const [years, setYears]             = useState([])
  const [entries, setEntries]         = useState([])
  const [draftEntries, setDraftEntries] = useState([])
  const [year, setYear]               = useState(null)
  const [isEditing, setIsEditing]     = useState(false)
  const wrapperRef                    = useRef()

  // compute freeze cutoff dates (month‐end minus 24h)
  const freezeDates = React.useMemo(() => {
    if (!year) return {}
    const nowYear = Number(year)
    const map = {}
    MONTH_KEYS.forEach((m, idx) => {
      // idx=0 -> april=3, since Date month is 0‐Jan
      const monthIndex = (3 + idx) % 12 
      const mYear = monthIndex < 3 ? nowYear + 1 : nowYear
      const lastDay = new Date(mYear, monthIndex + 1, 0, 0, 0, 0)
      map[m] = new Date(lastDay.getTime() - 24*60*60*1000)
    })
    return map
  }, [year])

  // load years
  useEffect(() => {
    fetchYears('forecast').then(r => {
      const ys = r.data.years || []
      setYears(ys)
      if (ys.length) setYear(ys[0])
    })
    fetchProjects()  // if you need projects dropdown later
  }, [])

  // reload + normalize + row‐color logic
  useEffect(() => {
    if (!year) return
    fetchEntries({ type:'forecast', year }).then(r => {
      const now = Date.now()
      const data = (r.data || []).map(raw => {
        const e = { ...raw }
        // normalize month keys
        MONTH_KEYS.forEach(k => {
          const C = k.charAt(0).toUpperCase() + k.slice(1)
          if (raw[C] !== undefined) {
            e[k] = raw[C]
            delete e[C]
          }
        })
        // parse updatedAt to Date
        e._updatedAt = e.updatedAt ? new Date(e.updatedAt) : null

        // ** stub for history **
        // e._history = raw._history || []  
        //   // e._history should be array of last two values for each month
        return e
      })
      setEntries(data)
      setDraftEntries(data.map(e => ({ ...e })))
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

  // Save
  const handleSave = async () => {
    /* await Promise.all(
      draftEntries.map(e =>
        upsertEntry({ ...e, type:'forecast', year })
      )
    ) */
    await upsertEntries(draft entries, 'forecast', year);
    setIsEditing(false)
    // reload
    setYear(year)  // triggers useEffect above
  }

  // Cancel
  const handleCancel = () => {
    setDraftEntries(entries.map(e => ({ ...e })))
    setIsEditing(false)
  }

  // Add new
  const handleAddRow = () => {
    const blank = {
      accountName:'',
      deliveryManager:'',
      projectName:'',
      BU:'',VDE:'',GDE:'',account:'',
      comments:'',
      __isNew:true
    }
    MONTH_KEYS.forEach(m => blank[m]=0)
    setDraftEntries(draftEntries.concat(blank))
    setIsEditing(true)
    setTimeout(()=>{
      wrapperRef.current.scrollLeft = wrapperRef.current.scrollWidth
    },100)
  }

  // Delete just‐new rows
  const handleDeleteRow = idx => {
    setDraftEntries(draftEntries.filter((_,i)=>i!==idx))
  }

  // single‐cell edit
  const handleChange = (i,field,val) => {
    const copy = [...draftEntries]
    copy[i] = { ...copy[i], [field]: val }
    setDraftEntries(copy)
  }

  // row age class
  const rowAgeClass = e => {
    if (!e._updatedAt) return ''
    const days = (Date.now() - e._updatedAt.getTime())/(1000*60*60*24)
    if (days>14) return 'age-danger'
    if (days>7)  return 'age-warning'
    return ''
  }

  // helper for total
  const sum = row =>
    MONTH_KEYS.reduce((tot,m)=>tot+(parseFloat(row[m])||0),0)

  // variance arrow (stub)
  const renderVariance = (row,m) => {
    // you’ll need backend to send last two values e._history[m] = [prev,actual]
    const hist = row._history && row._history[m]
    if (!hist || hist.length<2) return null
    const delta = hist[1] - hist[0]
    const sym   = delta>0 ? '↑' : '↓'
    return <sup className={delta>0?'var-up':'var-down'}>
      {sym}{Math.abs(delta).toFixed(2)}
    </sup>
  }

  return (
    <div className="p-6">
      <div className="flex items-center mb-4 space-x-2">
        <select
          className="border rounded px-2 py-1"
          value={year||''}
          onChange={e=>setYear(e.target.value)}
        >
          {years.map(y=>
            <option key={y} value={y}>FY {y}</option>
          )}
        </select>
        <button onClick={handleExport}
                className="btn-export">Export CSV</button>

        {isEditing
          ? <>
              <button onClick={handleSave} className="btn-save">Save</button>
              <button onClick={handleCancel} className="btn-cancel">Cancel</button>
            </>
          : <button onClick={()=>setIsEditing(true)} className="btn-edit">Edit</button>
        }

        <button onClick={handleAddRow} className="btn-add ml-auto">
          + Add Project
        </button>
      </div>

      <div ref={wrapperRef}
           className="table-wrapper"
           style={{ maxHeight:'65vh' }}>
        <table className="forecast-table">
          <thead>
            <tr>
              <th className="sticky-col">Account Name</th>
              <th>Delivery Manager</th>
              <th>Project Name</th>
              <th>BU</th>
              <th>VDE</th>
              <th>GDE</th>
              <th>Account</th>
              {MONTH_KEYS.map(m=>
                <th key={m} className="month-col">
                  {m.charAt(0).toUpperCase()+m.slice(1)}
                </th>
              )}
              <th className="total-col">Total</th>
              <th className="comments-col">Comments</th>
              <th className="timestamp-col sticky-col">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {draftEntries.map((row,i)=>(
              <tr key={i} className={rowAgeClass(row)}>
                {/* Sticky first */}
                <td className="sticky-col">
                  <input
                    disabled={!isEditing}
                    value={row.accountName||''}
                    onChange={e=>handleChange(i,'accountName',e.target.value)}
                    className="cell-input"
                  />
                </td>

                {[
                  'deliveryManager','projectName',
                  'BU','VDE','GDE','account'
                ].map((fld,j)=>(
                  <td key={j}>
                    <input
                      disabled={!isEditing}
                      value={row[fld]||''}
                      onChange={e=>handleChange(i,fld,e.target.value)}
                      className="cell-input"
                    />
                  </td>
                ))}

                {MONTH_KEYS.map(mon=>(
                  <td key={mon} className="month-col text-right">
                    <div className="cell-wrapper">
                      <input
                        type="number" step="0.01"
                        disabled={!isEditing || Date.now()>freezeDates[mon]}
                        value={row[mon]}
                        onChange={e=>handleChange(i,mon,e.target.value)}
                        className="cell-input text-right"
                      />
                      {!isEditing && Date.now()>freezeDates[mon] &&
                        renderVariance(row,mon)
                      }
                    </div>
                  </td>
                ))}

                <td className="total-col text-right font-semibold">
                  ${sum(row).toFixed(2)}
                </td>

                <td className="comments-col">
                  <div className="cell-wrapper">
                    <input
                      disabled={!isEditing}
                      value={row.comments||''}
                      onChange={e=>handleChange(i,'comments',e.target.value)}
                      className="cell-input"
                    />
                    {row.__isNew && isEditing &&
                      <XIcon
                        onClick={()=>handleDeleteRow(i)}
                        className="h-4 w-4 text-red-600 cursor-pointer"
                      />
                    }
                  </div>
                </td>

                <td className="timestamp-col sticky-col">
                  {row._updatedAt
                    ? row._updatedAt.toLocaleDateString(undefined,{
                        day:'2-digit',month:'short',year:'numeric'
                      })
                    : '--'
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}