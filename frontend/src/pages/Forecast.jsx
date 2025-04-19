import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  fetchEntries,
  fetchYears,
  fetchProjects,
  upsertEntries,
  exportEntries
} from '../services/api'
import {
  TrashIcon,
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
  const [years,      setYears]      = useState([])
  const [draft,      setDraft]      = useState([])
  const [year,       setYear]       = useState(null)
  const [isEditing,  setIsEditing]  = useState(false)
  const [cols,       setCols]       = useState(STATIC_COLS.map(c=>c.key))
  const [collapsed,  setCollapsed]  = useState(true)
  const [filterBy,   setFilterBy]   = useState('')
  const [filterVal,  setFilterVal]  = useState('')
  const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' })
  const wrapperRef                  = useRef()

  const allKeys = STATIC_COLS.map(c=>c.key)

  // When entering edit mode: expand all & select all columns
  useEffect(() => {
    if (isEditing) {
      setCollapsed(false)
      setCols(allKeys)
    }
  }, [isEditing])

  // Load years
  useEffect(() => {
    fetchYears('forecast').then(r => {
      const ys = r.data.years || []
      setYears(ys)
      if (ys[0]) setYear(ys[0])
    })
    fetchProjects()
  }, [])

  // Reload on year change
  useEffect(() => {
    if (!year) return
    fetchEntries({ type:'forecast', year }).then(r => {
      const norm = (r.data||[]).map(raw => {
        const e = { ...raw }
        MONTH_KEYS.forEach(m => {
          if (raw[m] === undefined) {
            const Up = m.charAt(0).toUpperCase()+m.slice(1)
            if (raw[Up] !== undefined) {
              e[m] = raw[Up]
              delete e[Up]
            }
          }
        })
        return e
      })
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

  // Save
  const handleSave = async () => {
    const clean = draft.map(e => {
      const { _id, createdAt, updatedAt, __isNew, ...rest } = e
      return rest
    })
    await upsertEntries({ type:'forecast', year, entries: clean })
    setIsEditing(false)
    setYear(year) // trigger reload
  }

  // Cancel
  const handleCancel = () => {
    setDraft(d => d.map(row => ({ ...row })))
    setIsEditing(false)
  }

  // Add row
  const handleAdd = () => {
    const blank = {
      accountName:'', deliveryManager:'', projectName:'',
      BU:'', VDE:'', GDE:'', account:'',
      comments:'', __isNew:true
    }
    MONTH_KEYS.forEach(m=> blank[m]=0)
    setDraft(d=>[...d,blank])
    setIsEditing(true)
    setTimeout(()=>wrapperRef.current.scrollLeft = wrapperRef.current.scrollWidth, 100)
  }

  // Delete unsaved
  const handleDel = idx => setDraft(d=>d.filter((_,i)=>i!==idx))

  // Change cell
  const onChange = (i, f, v) => {
    setDraft(d => {
      const c = [...d]; c[i] = { ...c[i], [f]: v }; return c
    })
  }

  // Row sum
  const rowSum = r => MONTH_KEYS.reduce((a,m)=>a+(parseFloat(r[m])||0),0)

  // Processed: filter + sort
  const processed = useMemo(() => {
    let rows = [...draft]

    // Filter
    if (filterBy && filterVal) {
      rows = rows.filter(r=> (r[filterBy]||'') === filterVal)
    }

    // Sort
    if (sortConfig.key) {
      rows.sort((a,b) => {
        let av, bv
        const k = sortConfig.key
        if (k === 'total') {
          av = rowSum(a); bv = rowSum(b)
        } else if (MONTH_KEYS.includes(k)) {
          av = +a[k]||0; bv = +b[k]||0
        } else if (k==='updatedAt') {
          av = new Date(a[k]).getTime()||0; bv = new Date(b[k]).getTime()||0
        } else {
          av = (a[k]||'').toString().toLowerCase()
          bv = (b[k]||'').toString().toLowerCase()
        }
        if (av < bv) return sortConfig.direction==='asc' ? -1 : 1
        if (av > bv) return sortConfig.direction==='asc' ? 1 : -1
        return 0
      })
    }

    return rows
  }, [draft, filterBy, filterVal, sortConfig])

  // Bottom totals
  const bottomTotals = useMemo(() =>
    MONTH_KEYS.map(m => processed.reduce((a,r)=>a+(parseFloat(r[m])||0),0).toFixed(2))
  ,[processed])

  // Filter options
  const filterOptions = useMemo(() => {
    if (!filterBy) return []
    return Array.from(new Set(draft.map(r=>(r[filterBy]||'').toString()).filter(v=>v)))
  }, [draft, filterBy])

  // Toggle column
  const toggleCol = key =>
    setCols(c => c.includes(key) ? c.filter(x=>x!==key) : [...c,key])

  // Sort handler
  const handleSort = key => {
    setSortConfig(sc => sc.key === key
      ? { key, direction: sc.direction==='asc'?'desc':'asc' }
      : { key, direction:'asc' }
    )
  }

  return (
    <div className="p-6">
      {/* Top controls */}
      <div className="flex flex-wrap items-center mb-4 space-x-2">
        <select
          className="border rounded px-2 py-1"
          value={year||''}
          onChange={e=>setYear(e.target.value)}
          disabled={isEditing}
          title={isEditing ? "Can't modify in edit mode" : ""}
        >
          {years.map(y=> <option key={y} value={y}>FY {y}</option>)}
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
      </div>

      {/* Collapse / Columns / Filter */}
      <div className="flex flex-wrap items-center mb-4">
        {/* left group */}
        <div className="flex items-center space-x-4">
          <button
            onClick={()=>setCollapsed(c=>!c)}
            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
          >
            {collapsed
              ? <><ChevronDoubleRightIcon className="h-5 w-5"/><span>Detailed View</span></>
              : <><ChevronDoubleLeftIcon  className="h-5 w-5"/><span>Compact View</span></>
            }
          </button>
          {!collapsed && <>
            <strong>Show columns:</strong>
            {STATIC_COLS.map(c=> (
              <label key={c.key} className="mr-4">
                <input
                  type="checkbox"
                  checked={cols.includes(c.key)}
                  onChange={()=>toggleCol(c.key)}
                /> {c.label}
              </label>
            ))}
          </>}
        </div>

        {/* right group */}
        <div className="flex items-center space-x-2 ml-auto">
          <label>Filter By:</label>
          <select
            className="border rounded px-2 py-1"
            value={filterBy}
            onChange={e=>{ setFilterBy(e.target.value); setFilterVal('') }}
            disabled={isEditing}
            title={isEditing ? "Can't modify in edit mode" : ""}
          >
            <option value="">None</option>
            <option value="accountName">Account Name</option>
            {STATIC_COLS.map(c=>(
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>

          {filterBy && (
            <select
              className="border rounded px-2 py-1"
              value={filterVal}
              onChange={e=>setFilterVal(e.target.value)}
              disabled={isEditing}
              title={isEditing ? "Can't modify in edit mode" : ""}
            >
              <option value="">All Values</option>
              {filterOptions.map(v=>(
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          )}

          {(filterBy||filterVal) && (
            <button
              onClick={()=>{ setFilterBy(''); setFilterVal('') }}
              disabled={isEditing}
              title={isEditing ? "Can't modify in edit mode" : ""}
              className="text-red-600"
            >
              <TrashIcon className="h-4 w-4"/>
            </button>
          )}
        </div>
      </div>

      {/* Data table */}
      <div ref={wrapperRef} className="table-wrapper">
        <table className="forecast-table">
          <thead>
            <tr>
              <th
                className="sticky-first cursor-pointer"
                onClick={()=>handleSort('accountName')}
              >
                Account Name
                {sortConfig.key==='accountName' && (sortConfig.direction==='asc'?' ↑':' ↓')}
              </th>

              {!collapsed && STATIC_COLS.map(c=>cols.includes(c.key)&&(
                <th
                  key={c.key}
                  className="cursor-pointer"
                  onClick={()=>handleSort(c.key)}
                >
                  {c.label}
                  {sortConfig.key===c.key && (sortConfig.direction==='asc'?' ↑':' ↓')}
                </th>
              ))}

              {MONTH_KEYS.map(m=>(
                <th
                  key={m}
                  className="cursor-pointer month-col"
                  onClick={()=>handleSort(m)}
                >
                  {m}
                  {sortConfig.key===m && (sortConfig.direction==='asc'?' ↑':' ↓')}
                </th>
              ))}

              <th
                className="cursor-pointer total-col"
                onClick={()=>handleSort('total')}
              >
                Total{sortConfig.key==='total'&&(sortConfig.direction==='asc'?' ↑':' ↓')}
              </th>

              <th
                className="cursor-pointer comments-col"
                onClick={()=>handleSort('comments')}
              >
                Comments{sortConfig.key==='comments'&&(sortConfig.direction==='asc'?' ↑':' ↓')}
              </th>

              <th
                className="cursor-pointer timestamp-col"
                onClick={()=>handleSort('updatedAt')}
              >
                Last Updated{sortConfig.key==='updatedAt'&&(sortConfig.direction==='asc'?' ↑':' ↓')}
              </th>

              <th></th>
            </tr>
          </thead>
          <tbody>
            {processed.map((row,i)=>(
              <tr key={i}>
                <td className="sticky-first wrap">
                  <input
                    disabled={!isEditing}
                    value={row.accountName||''}
                    onChange={e=>onChange(i,'accountName',e.target.value)}
                    className="cell-input wrap"
                  />
                </td>
                {!collapsed && STATIC_COLS.map(c=>cols.includes(c.key)&&(
                  <td key={c.key} className="wrap">
                    <input
                      disabled={!isEditing}
                      value={row[c.key]||''}
                      onChange={e=>onChange(i,c.key,e.target.value)}
                      className="cell-input wrap"
                    />
                  </td>
                ))}
                {MONTH_KEYS.map(m=>(
                  <td key={m} className="month-col wrap">
                    <input
                      type="number" step="0.01" disabled={!isEditing}
                      value={row[m]}
                      onChange={e=>onChange(i,m,e.target.value)}
                      className="cell-input wrap text-right"
                    />
                  </td>
                ))}
                <td className="total-col text-right">
                  ${rowSum(row).toFixed(2)}
                </td>
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
                        day:'2-digit',month:'short',year:'numeric'
                      })
                    : '--'
                  }
                </td>
                <td>
                  {row.__isNew && isEditing && (
                    <TrashIcon
                      onClick={()=>handleDel(i)}
                      className="h-4 w-4 text-red-600 cursor-pointer"
                    />
                  )}
                </td>
              </tr>
            ))}

            {/* bottom totals */}
            <tr className="bottom-row">
              <td className="sticky-first font-semibold">Totals</td>
              {!collapsed && STATIC_COLS.map(c=>cols.includes(c.key)&&(
                <td key={c.key}></td>
              ))}
              {bottomTotals.map((t,i)=>(
                <td
                  key={i}
                  className="month-col total-background text-right font-semibold"
                >
                  {t}
                </td>
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