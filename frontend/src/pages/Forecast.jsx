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
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './Forecast.css'

const STATIC_COLS = [ /* ... unchanged ... */ ]
const MONTH_KEYS  = [ /* ... unchanged ... */ ]

export default function Forecast() {
  const [years,     setYears]     = useState([])
  const [draft,     setDraft]     = useState([])
  const [year,      setYear]      = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [cols,      setCols]      = useState(STATIC_COLS.map(c=>c.key))
  const [collapsed, setCollapsed] = useState(true)
  const [filterBy,  setFilterBy]  = useState('')
  const [filterVal, setFilterVal] = useState('')
  const [sortConfig,setSortConfig]= useState({ key:'', direction:'asc' })
  const wrapperRef               = useRef()
  const allKeys                  = STATIC_COLS.map(c=>c.key)
  const tooltip                  = isEditing ? "Can't modify in edit mode" : ""

  // When entering edit: expand, select all, clear filters + toast
  useEffect(() => {
    if (!isEditing) return
    const msgs = []
    if (collapsed)            msgs.push('Switched to detailed view')
    if (cols.length < allKeys.length) msgs.push('Showing all columns')
    if (filterBy || filterVal) msgs.push('Cleared filters')
    setCollapsed(false)
    setCols(allKeys)
    setFilterBy('')
    setFilterVal('')
    if (msgs.length) {
      toast.info(msgs.join(' · '), { autoClose: 3000 })
    }
  }, [isEditing])

  useEffect(() => { /* fetch years/projects unchanged */ }, [])
  useEffect(() => { /* fetch entries unchanged */ }, [year])

  // Frontend validation
  const validateDraft = () => {
    const errs = []
    if (!year) errs.push('FY must be selected')
    draft.forEach((r, i) => {
      if (!r.accountName?.trim())  errs.push(`Row ${i+1}: Account Name required`)
      if (!r.projectName?.trim())  errs.push(`Row ${i+1}: Project Name required`)
      MONTH_KEYS.forEach(m => {
        const v = parseFloat(r[m])
        if (isNaN(v) || v < 0) errs.push(`Row ${i+1}: ${m} must be ≥ 0`)
      })
    })
    return errs
  }

  const handleExport = async () => {
    try {
      const res = await exportEntries('forecast', year)
      const blob = new Blob([res.data], { type:'text/csv' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `forecast_${year}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('CSV exported')
    } catch (err) {
      const msg = err.response?.data?.message || 'Export failed'
      toast.error(msg)
    }
  }

  const handleSave = async () => {
    const errors = validateDraft()
    if (errors.length) {
      toast.error(errors.join('; '))
      return
    }
    try {
      const clean = draft.map(e => {
        const { _id, createdAt, updatedAt, __isNew, ...rest } = e
        return rest
      })
      await upsertEntries({ type:'forecast', year, entries: clean })
      toast.success('Changes saved')
      setIsEditing(false)
      setYear(year)  // reload
    } catch (err) {
      const msg = err.response?.data?.message || 'Save failed'
      toast.error(msg)
    }
  }

  const handleCancel = () => {
    setDraft(d => d.map(r=>({ ...r })))
    setIsEditing(false)
    toast.info('Edits canceled')
  }

  const handleAdd = () => {
    const blank = { accountName:'',deliveryManager:'',projectName:'',BU:'',VDE:'',GDE:'',account:'',comments:'',__isNew:true }
    MONTH_KEYS.forEach(m=> blank[m]=0)
    setDraft(d=>[...d,blank])
    setIsEditing(true)
    setTimeout(()=> wrapperRef.current.scrollLeft=wrapperRef.current.scrollWidth, 100)
  }

  const handleDel = idx => setDraft(d=>d.filter((_,i)=>i!==idx))
  const onChange   = (i,f,v)=>{ setDraft(d=>{ const c=[...d]; c[i]={...c[i],[f]:v}; return c }) }
  const rowSum     = r=> MONTH_KEYS.reduce((a,m)=>a+(parseFloat(r[m])||0),0)

  const processed = useMemo(() => {
    let rows = [...draft]
    if (filterBy && filterVal) rows = rows.filter(r=> (r[filterBy]||'') === filterVal)
    if (sortConfig.key) {
      rows.sort((a,b) => {
        let av, bv, k = sortConfig.key
        if (k==='total')           { av=rowSum(a); bv=rowSum(b) }
        else if (MONTH_KEYS.includes(k)) { av=+a[k]||0; bv=+b[k]||0 }
        else if (k==='updatedAt')  { av=new Date(a[k]).getTime()||0; bv=new Date(b[k]).getTime()||0 }
        else                      { av=(a[k]||'').toLowerCase(); bv=(b[k]||'').toLowerCase() }
        if (av< bv) return sortConfig.direction==='asc'? -1:1
        if (av> bv) return sortConfig.direction==='asc'? 1:-1
        return 0
      })
    }
    return rows
  }, [draft, filterBy, filterVal, sortConfig])

  const bottomTotals = useMemo(()=>
    MONTH_KEYS.map(m=> processed.reduce((a,r)=>a+(parseFloat(r[m])||0),0).toFixed(2))
  ,[processed])

  const filterOptions = useMemo(() => {
    if (!filterBy) return []
    return Array.from(new Set(draft.map(r=>(r[filterBy]||'').toString()).filter(v=>v)))
  }, [draft, filterBy])

  const toggleCol = key => setCols(c=> c.includes(key) ? c.filter(x=>x!==key) : [...c,key])
  const handleSort = key => setSortConfig(sc => sc.key===key ? { key, direction: sc.direction==='asc'?'desc':'asc' } : { key, direction:'asc' })

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6">
        {/* Top controls */}
        <div className="flex flex-wrap items-center mb-4">
          {/* left: FY, export, add */}
          <div className="flex items-center space-x-2">
            <select
              className="border rounded px-2 py-1"
              value={year||''}
              onChange={e=>setYear(e.target.value)}
              disabled={isEditing}
              title={tooltip}
            >
              {years.map(y=> <option key={y} value={y}>FY {y}</option>)}
            </select>
            <button onClick={handleExport} className="btn-export">Export CSV</button>
            <button onClick={handleAdd}    className="btn-add">+ Add Project</button>
          </div>
          {/* right: edit / save / cancel */}
          <div className="ml-auto flex items-center space-x-2">
            {isEditing
              ? <>
                  <button onClick={handleSave}   className="btn-save">Save</button>
                  <button onClick={handleCancel} className="btn-cancel">Cancel</button>
                </>
              : <button onClick={()=>setIsEditing(true)} className="btn-edit">Edit</button>
            }
          </div>
        </div>

        {/* Collapse / Columns / Filter */}
        <div className="flex flex-wrap items-center mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={()=>setCollapsed(c=>!c)}
              disabled={isEditing}
              title={tooltip}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
            >
              {collapsed
                ? <><ChevronDoubleRightIcon className="h-5 w-5"/><span>Detailed View</span></>
                : <><ChevronDoubleLeftIcon  className="h-5 w-5"/><span>Compact View</span></>
              }
            </button>
            {!collapsed && STATIC_COLS.map(c=>(
              <label key={c.key} className="mr-4">
                <input
                  type="checkbox"
                  checked={cols.includes(c.key)}
                  onChange={()=>toggleCol(c.key)}
                  disabled={isEditing}
                  title={tooltip}
                />{' '}
                {c.label}
              </label>
            ))}
          </div>
          <div className="ml-auto flex items-center space-x-2">
            <label>Filter By:</label>
            <select
              className="border rounded px-2 py-1"
              value={filterBy}
              onChange={e=>{ setFilterBy(e.target.value); setFilterVal('') }}
              disabled={isEditing}
              title={tooltip}
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
                title={tooltip}
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
                title={tooltip}
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
            {/* ... table body/head unchanged ... */}
          </table>
        </div>
      </div>
    </>
  )
}