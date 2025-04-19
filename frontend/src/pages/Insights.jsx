// frontend/src/pages/Insights.jsx
import React, { useState, useEffect } from 'react';
import { fetchYears, fetchEntries } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import './Insights.css';

const MONTH_KEYS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
const MONTH_LABELS = ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];

export default function Insights() {
  const [years, setYears] = useState([]);
  const [fy, setFy]       = useState(null);
  const [data, setData]   = useState([]); // [{ month:'Apr', total: 1.2 }, ... ]

  useEffect(()=>{
    fetchYears('forecast').then(r=>{
      setYears(r.data);
      if (r.data.length) setFy(r.data[0]);
    });
  },[]);

  useEffect(()=>{
    if (!fy) return;
    fetchEntries({ type:'forecast', year: fy }).then(r=>{
      const raw = r.data || [];
      // normalize months
      raw.forEach(e=>{
        MONTH_KEYS.forEach((k,i)=>{
          const UC = k.charAt(0).toUpperCase()+k.slice(1);
          if (e[UC] !== undefined) {
            e[k] = parseFloat(e[UC]);
            delete e[UC];
          }
        });
      });
      // sum per month
      const sums = MONTH_KEYS.map((k,i)=>({
        month: MONTH_LABELS[i],
        total: raw.reduce((s,e)=> s + (parseFloat(e[k])||0),0)
      }));
      setData(sums);
    });
  },[fy]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Forecast Insights (FY {fy})</h2>
      <div className="mb-4">
        <select
          className="px-3 py-2 border rounded"
          value={fy||''}
          onChange={e=>setFy(+e.target.value)}
        >
          {years.map(y=>(
            <option key={y} value={y}>FY {y} – {y+1}</option>
          ))}
        </select>
      </div>

      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top:20, right:30, left:0, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(val)=>`$${val.toFixed(2)}`} />
            <Bar dataKey="total" fill="#3182CE" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <table className="w-full table-auto border-collapse insights-table">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2">Month</th>
            <th className="px-4 py-2 text-right">Total ($M)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row,i)=>(
            <tr key={i} className={i%2===0?'bg-gray-50':''}>
              <td className="px-4 py-2">{row.month}</td>
              <td className="px-4 py-2 text-right">{row.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}