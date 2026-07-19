"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { setToken, clearToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (role: string) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.access_token) {
        setToken(data.access_token);
        router.push('/dashboard');
      }
    } catch (e) {
      console.error("Login failed", e);
    }
  };

  const handleContinueAsFan = () => {
    clearToken();
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl shadow-[0_20px_60px_rgba(8,112,184,0.2)] text-center relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-emerald-400"></div>
        
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight drop-shadow-md mb-2">PulsePoint</h1>
        <p className="text-indigo-200 mb-8 font-medium">Lumen Field Operations Copilot</p>
        
        <div className="space-y-4 mb-8">
          <button 
            onClick={() => handleLogin('commander')} 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 border border-blue-500/50"
          >
            Organizers
          </button>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleLogin('marshal')} 
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl transition-all border border-white/10 hover:border-white/30"
            >
              Venue Staff
            </button>
            <button 
              onClick={() => handleLogin('volunteer')} 
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-4 rounded-xl transition-all border border-white/10 hover:border-white/30"
            >
              Volunteers
            </button>
          </div>
        </div>
        
        <div className="relative flex py-4 items-center mb-4">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-indigo-300/50 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-white/10"></div>
        </div>
        
        <button 
          onClick={handleContinueAsFan} 
          className="w-full bg-transparent hover:bg-white/5 text-emerald-400 font-semibold py-3 px-4 rounded-xl transition-all border border-emerald-500/30 hover:border-emerald-400"
        >
          Continue as Fan
        </button>
      </div>
    </main>
  );
}
