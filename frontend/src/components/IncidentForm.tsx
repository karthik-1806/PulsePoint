"use client";
import React, { useState } from 'react';
import { getToken } from '../lib/auth';

export default function IncidentForm() {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('ZONE_01');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.length > 1000) {
      setError("Description too long (max 1000 chars)");
      return;
    }
    setError('');
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const res = await fetch(`${API_URL}/ops-agent/incident`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ description, location })
      });
      if (!res.ok) throw new Error("Failed to submit incident. Are you logged in?");
      const data = await res.json();
      setResult(data);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4">Report an Incident</h2>
      {error && <div className="p-3 bg-red-100 text-red-700 rounded mb-4">{error}</div>}
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Location
          <select 
            value={location} 
            onChange={e => setLocation(e.target.value)}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            {['ZONE_01', 'ZONE_05', 'GATE_1', 'GATE_4'].map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </label>
        
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
          Description
          <textarea 
            value={description}
            onChange={e => { setDescription(e.target.value); setSubmitted(false); setResult(null); }}
            maxLength={1000}
            rows={4}
            className="p-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the incident (e.g. 'Medical emergency near concessions')"
            required
          />
          <span className="text-xs text-slate-400 self-end">{description.length}/1000</span>
        </label>
        
        <button 
          type="submit" 
          disabled={loading || !description || submitted}
          className={`${submitted ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white font-semibold p-2 rounded transition-colors disabled:opacity-50`}
        >
          {loading ? 'Processing...' : submitted ? 'Submitted!' : 'Submit Report'}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-2">AI Assessment</h3>
          {result.classification?.error ? (
            <p className="text-red-500">Classification Error: {result.classification.error}</p>
          ) : (
            <>
              <p><strong>Severity:</strong> <span className="bg-orange-200 text-orange-900 px-2 py-0.5 rounded text-sm">{result.classification?.severity}</span></p>
              <div className="mt-2 text-sm bg-white p-2 rounded shadow-sm">
                 <p><strong>Who:</strong> {result.classification?.summary?.who}</p>
                 <p><strong>What:</strong> {result.classification?.summary?.what}</p>
                 <p><strong>Where:</strong> {result.classification?.summary?.where}</p>
                 <p><strong>Action:</strong> {result.classification?.summary?.recommended_action}</p>
              </div>
            </>
          )}
          
          <h3 className="font-bold text-slate-700 mt-4 mb-2">Dispatched Responder</h3>
          {result.assigned_volunteer ? (
            <div className="text-sm bg-white p-2 rounded shadow-sm">
              <p><strong>Name:</strong> {result.assigned_volunteer.name}</p>
              <p><strong>Distance Score:</strong> {result.assigned_volunteer.match_score}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No volunteers available.</p>
          )}
        </div>
      )}
    </div>
  );
}
