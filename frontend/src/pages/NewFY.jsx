import React, { useState } from 'react';
import { newFY } from '../services/api';

export default function NewFY(){
  const [file, setFile] = useState(null);
  return (
    <div className="p-4">
      <h1 className="text-2xl mb-4">Initialize New Financial Year</h1>
      <input type="file" accept=".csv,.xlsx" onChange={e=>setFile(e.target.files[0])}
        className="mr-2"/>
      <button onClick={()=>newFY(file)} className="px-3 py-1 bg-blue-600 text-white rounded">
        Upload & Create
      </button>
    </div>
  );
}