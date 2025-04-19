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
  const [years,           setYears]           = useState([])
  const [originalEntries, setOriginalEntries] = useState([])
  const [draft,           setDraft]           = useState([])
  const [year,            setYear]            = useState(null)
  const [isEditing,       setIsEditing]       = useState(false)
  const [cols,            setCols]            = useState(STATIC_COLS.map(c=>c.key))
  const [collapsed,       setCollapsed]       = useState(true)
  const [filterBy,        setFilterBy]        = useState('')
  const [filterVal,       setFilterVal]       = useState('')
  const [sortConfig,      setSortConfig]      = useState({ key: '', direction: 'asc' })
  const wrapperRef                           = useRef()

  const allKeys = STATIC_COLS.map(c=>c.key)
  const tooltip = isEditing ? "Can't modify in edit mode" : ""

  // When entering edit, reset view & filters and notify
  useEffect(() => {
    if (!isEditing) return
    const msgs = []
    if (collapsed)               msgs.push('Switched to Detailed View')
    if (cols.length < allKeys.length) msgs.push('Showing all columns')
    if (filterBy || filterVal)   msgs.push('Cleared filters')
    setCollapsed(false)
    setCols(allKeys)
    setFilterBy('')
    setFilterVal('')
    if (msgs.length) {
      toast.info(msgs.join(' · '), { autoClose: 3000 })
    }
  }, [isEditing])

  // Load years on mount
  useEffect(() => {
    fetchYears('forecast').then(r => {
      const ys = r.data.years||[]
      setYears(ys)
      if (ys[0]) setYear(ys[0])
    })
    fetchProjects()
  }, [])

  // Load entries when year changes
  useEffect(() => {
    if (!year) return
    fetchEntries({ type:'forecast', year }).then(r => {
      const norm = (r.data||[]).map(raw => {
        const e = { ...raw }
        MONTH_KEYS.forEach(m => {
          if (raw[m]===undefined) {
            const Up = m.charAt(0).toUpperCase()+m.slice(1)
            if (raw[Up]!==undefined) {
              e[m] = raw[Up]
              delete e[Up]
            }
          }
        })
        return e
      })
      setOriginalEntries(norm.map(e=>({ ...e })))
      setDraft(norm.map(e=>({ ...e })))
      setIsEditing(false)
    })
  }, [year])

  // Export CSV
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
    } catch {
      toast.error('Export failed')
    }
  }

  // Validate draft before save
  function validateAll() {
    const errors = []
    draft.forEach((row, i) => {
      if (!row.accountName?.trim()) {
        errors.push(`Row ${i+1}: Account Name required`)
      }
      if (!row.projectName?.trim()) {
        errors.push(`Row ${i+1}: Project Name required`)
      }
      MONTH_KEYS.forEach(m => {
        const v = parseFloat(row[m])
        if (isNaN(v) || v < 0) {
          errors.push(`Row ${i+1}: ${m} must be ≥ 0`)
        }
      })
    })
    return errors
  }

  // Save edits
  const handleSave = async () => {
    const errs = validateAll()
    if (errs.length) {
      toast.error(errs.join('\n'), { autoClose: 5000 })
      return
    }
    try {
      const clean = draft.map(e => {
        const { _id, createdAt, updatedAt, __isNew, ...rest } = e
        return rest
      })
      await upsertEntries({ type:'forecast', year, entries: clean })
      toast.success('Changes saved')
      // reload from server
      const r = await fetchEntries({ type:'forecast', year })
      const norm = (r.data||[]).map(raw => {
        const e = { ...raw }
        MONTH_KEYS.forEach(m => {
          if (raw[m]===undefined) {
            const Up = m.charAt(0).toUpperCase()+m.slice(1)
            if (raw[Up]!==undefined) {
              e[m] = raw[Up]
              delete e[Up]
            }
          }
        })
        return e
      })
      setOriginalEntries(norm.map(e=>({ ...e })))
      setDraft(norm.map(e=>({ ...e })))
      setIsEditing(false)
    } catch {
      toast.error('Save failed')
    }
  }

  // Cancel edits: restore from originalEntries
  const handleCancel = () => {
    setDraft(originalEntries.map(e=>({ ...e })))
    setIsEditing(false)
    toast.info('Edits canceled')
  }

  // Add blank row
  const handleAdd = () => {
    const blank = {
      accountName:'', deliveryManager:'', projectName:'',
      BU:'', VDE:'', GDE:'', account:'',
      comments:'', __isNew:true
    }
    MONTH_KEYS.forEach(m=> blank[m]=0)
    setDraft(d=>[...d,blank])
    setIsEditing(true)
    setTimeout(()=> wrapperRef.current.scrollLeft = wrapperRef.current.scrollWidth, 100)
  }

  // Delete unsaved row
  const handleDel = idx => setDraft(d=>d.filter((_,i)=>i!==idx))

  // Cell edit
  const onChange = (i,f,v) => {
    setDraft(d => {
      const c = [...d]; c[i] = { ...c[i], [f]: v }; return c
    })
  }

  // Row total
  const rowSum = r => MONTH_KEYS.reduce((a,m)=>a+(parseFloat(r[m])||0),0)

  // Filter & sort pipeline
  const processed = useMemo(() => {
    let rows = [...draft]
    if (filterBy && filterVal) {
      rows = rows.filter(r => (r[filterBy]||'').toString() === filterVal)
    }
    if (sortConfig.key) {
      rows.sort((a,b) => {
        let av, bv; const k = sortConfig.key
        if (k==='total')                { av = rowSum(a); bv = rowSum(b) }
        else if (MONTH_KEYS.includes(k)) { av = +a[k]||0; bv = +b[k]||0 }
        else if (k==='updatedAt')        { av = new Date(a[k]).getTime()||0; bv = new Date(b[k]).getTime()||0 }
        else                             { av = (a[k]||'').toLowerCase(); bv = (b[k]||'').toLowerCase() }
        if (av < bv) return sortConfig.direction==='asc' ? -1 : 1
        if (av > bv) return sortConfig.direction==='asc' ?  1 : -1
        return 0
      })
    }
    return rows
  }, [draft, filterBy, filterVal, sortConfig])

  // Bottom totals
  const bottomTotals = useMemo(() =>
    MONTH_KEYS.map(m =>
      processed.reduce((a,r)=>a+(parseFloat(r[m])||0),0).toFixed(2)
    )
  , [processed])

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
    setSortConfig(sc => sc.key===key
      ? { key, direction: sc.direction==='asc' ? 'desc' : 'asc' }
      : { key, direction: 'asc' }
    )
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="p-6">
        {/* ... rest unchanged ... */}
      </div>
    </>
  )
}