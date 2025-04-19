// frontend/src/pages/Forecast.jsx
import React, { useState, useEffect, useRef } from 'react'
import {
  fetchEntries,
  fetchYears,
  fetchProjects,
  upsertEntries,
  exportEntries
} from '../services/api'
import {
  XIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon
} from '@heroicons/react/solid'
import './Forecast.css'

const STATIC_COLS = [
  { key: 'deliveryManager', label: 'Delivery Manager' },
  { key: 'projectName',     label: 'Project Name'     },
  { key: 'BU',              label: 'BU'               },
  { key: 'VDE',             label: 'VDE'              },
  { key: 'GDE',             label: 'GDE'              },
  { key: 'account',         label: 'Account'          }
]

const MONTH_KEYS = [
  'Apr','May','Jun','Jul','Aug','Sep',
  'Oct','Nov','Dec','Jan','Feb','Mar'
]

export default function Forecast() {
  const [years,      setYears]    = useState([])
  const [entries,    setEntries]  = useState([])
  const [draft,      setDraft]    = useState([])
  const [year,       setYear]     = useState(null)
  const [isEditing,  setIsEditing]= useState(false)
  const [cols,       setCols]     = useState(STATIC_COLS.map(c=>c.key))
  const [collapsed,  setCollapsed]= useState(false)
  const wrapperRef                = useRef()

  // load years
  useEffect(() => {
    fetchYears('forecast').then(r => {
      const ys = r.data.years||[]
      setYears(ys)
      if (ys[0]) setYear(ys[0])
    })
    fetchProjects() // for future use
  }, [])

  // reload on year change
  useEffect(() => {
    if (!year) return
    fetchEntries({ type:'forecast', year }).then(r => {
      const norm = (r.data||[]).map(raw => {
        const e = {...raw}
        MONTH_KEYS.forEach(m => {
          if (raw[m]===undefined) {
            const Up = m.charAt(0).toUpperCase()+m.slice(1)
            if (raw[Up]!==undefined) {
              e[m]=raw[Up]; delete e[Up]
            }
          }
        })
        return e
      })
      setEntries(norm)
      setDraft(norm.map(e=>({ ...e })))
      setIsEditing(false)
    })
  }, [year])

  const handleExport = () => {
    exportEntries('forecast', year).then(res => {
      const blob = new Blob([res.data],{type:'text/csv'})
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `forecast_${year}.csv`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  const handleSave = async () => {
    const clean = draft.map(e => {
      const { _id,createdAt,updatedAt,__isNew,...rest } = e
      return rest
    })
    await upsertEntries({ type:'forecast', year, entries: clean })
    setIsEditing(false)
    setYear(year) // reload
  }

  const handleCancel = () => {
    setDraft(entries.map(e=>({ ...e })))
    setIsEditing(false)
  }

  const handleAdd = () => {
    const blank = { accountName:'',deliveryManager:'',projectName:'',
      BU:'',VDE:'',GDE:'',account:'',comments:'',__isNew:true }
    MONTH_KEYS.forEach(m=> blank[m]=0)
    setDraft(d=>[...d,blank])
    setIsEditing(true)
    setTimeout(()=>wrapperRef.current.scrollLeft=wrapperRef.current.scrollWidth,100)
  }

  const handleDel = idx => setDraft(d=>d.filter((_,i)=>i!==idx))

  const onChange = (i,f,v) => {
    setDraft(d=>{
      const c = [...d]; c[i]={...c[i],[f]:v}; return c
    })
  }

  const rowSum = r => MONTH_KEYS.reduce((a,m)=>a+(parseFloat(r[m])||0),0)

  const bottomTotals = MONTH_KEYS.map(m=>
    draft.reduce((a,r)=>a+(parseFloat(r[m])||0),0).toFixed(2)
  )

  // toggle column on/off
  const toggleCol = key =>
    setCols(c => c.includes(key)
      ? c.filter(x=>x!==key)
      : [...c,key]
    )

  return (
    <div className="p-6">
      {/* controls */}
      <div className="flex flex-wrap items-center mb-4 space-x-2">
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

        {/* collapse info */}
        <button
          onClick={()=>setCollapsed(c=>!c)}
          className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
        >
          {collapsed
            ? <><ChevronDoubleRightIcon className="h-5 w-5"/><span>Expand Info</span></>
            : <><ChevronDoubleLeftIcon  className="h-5 w-5"/><span>Collapse Info</span></>
          }
        </button>
      </div>

      {/* column toggles */}
      <div className="mb-3">
        <strong>Show columns:</strong>{' '}
        {STATIC_COLS.map(c=>(
          <label key={c.key} className="mr-4">
            <input
              type="checkbox"
              checked={cols.includes(c.key)}
              onChange={()=>toggleCol(c.key)}
            /> {c.label}
          </label>
        ))}
      </div>

      {/* table */}
      <div ref={wrapperRef} className="table-wrapper" style={{ maxHeight:'60vh' }}>
        <table className="forecast-table">
          <thead>
            <tr>
              <th className="sticky-header">Account Name</th>
              {!collapsed && STATIC_COLS.map(c=>
                cols.includes(c.key)
                  ? <th key={c.key} className="sticky-header">{c.label}</th>
                  : null
              )}
              {MONTH_KEYS.map(m=><th key={m}>{m}</th>)}
              <th className="total-col sticky-header">Total</th>
              <th className="comments-col sticky-header">Comments</th>
              <th className="timestamp-col sticky-header">Last Updated</th>
              <th className="sticky-header"></th>
            </tr>
          </thead>
          <tbody>
            {draft.map((row,i)=>(
              <tr key={i}>
                <td className="sticky-first wrap">{row.accountName}</td>
                {!collapsed && STATIC_COLS.map(c=>
                  cols.includes(c.key)
                    ? <td key={c.key} className="wrap">
                        <input
                          disabled={!isEditing}
                          value={row[c.key]||''}
                          onChange={e=>onChange(i,c.key,e.target.value)}
                          className="cell-input wrap"
                        />
                      </td>
                    : null
                )}
                {MONTH_KEYS.map(m=>
                  <td key={m} className="month-col">
                    <input
                      type="number" step="0.01"
                      disabled={!isEditing}
                      value={row[m]}
                      onChange={e=>onChange(i,m,e.target.value)}
                      className="cell-input wrap text-right"
                    />
                  </td>
                )}
                <td className="total-col text-right">${rowSum(row).toFixed(2)}</td>
                <td className="comments-col wrap">
                  <input
                    disabled={!isEditing}
                    value={row.comments||''}
                    onChange={e=>onChange(i,'comments',e.target.value)}
                    className="cell-input wrap"
                  />
                </td>
                <td className="timestamp-col">
                  {row.updatedAt
                    ? new Date(row.updatedAt).toLocaleDateString(undefined,{
                        day:'2-digit',month:'short',year:'numeric'})
                    : '--'}
                </td>
                <td>
                  {row.__isNew && isEditing &&
                    <XIcon
                      onClick={()=>handleDel(i)}
                      className="h-4 w-4 text-red-600 cursor-pointer"
                    />}
                </td>
              </tr>
            ))}

            {/* bottom‑totals */}
            <tr className="bottom-row">
              <td className="sticky-first font-semibold">Totals</td>
              {!collapsed && STATIC_COLS.map((c,j)=> (
                cols.includes(c.key)
                  ? <td key={j}></td>
                  : null
              ))}
              {bottomTotals.map((t,i)=>
                <td
                  key={i}
                  className="month-col total-background text-right font-semibold"
                >{t}</td>
              )}
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