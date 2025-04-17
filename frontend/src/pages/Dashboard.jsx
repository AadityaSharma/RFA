// frontend/src/pages/Dashboard.jsx
import React from 'react';
import { useEffect,useState } from 'react';
import { fetchDashboard } from '../services/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [data,setData] = useState([]);
  const [year] = useState(new Date().getFullYear());
  useEffect(()=>{
    fetchDashboard({ year }).then(r=>{
      const f = r.data.forecasts, a=r.data.actuals;
      const m = {};
      f.forEach(o=>{ m[o._id.month]={ month:o._id.month, forecast:o.sum }; });
      a.forEach(o=>{ m[o._id.month]={ ...m[o._id.month], actual:o.sum }; });
      setData(Object.values(m));
    });
  },[year]);
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Dashboard</h1>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="month"/>
          <YAxis/>
          <Tooltip/>
          <Legend/>
          <Line type="monotone" dataKey="forecast" name="Forecast"/>
          <Line type="monotone" dataKey="actual" name="Actual"/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}