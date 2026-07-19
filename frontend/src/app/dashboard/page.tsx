"use client";
import React, { useState, useEffect } from 'react';
import FanAgentWidget from "@/components/FanAgentWidget";

import IncidentForm from "@/components/IncidentForm";
import CommanderDashboardUI from "@/components/dashboard/CommanderDashboardUI";
import { getRole, clearToken } from '@/lib/auth';
import { useAccessibility } from '@/lib/AccessibilityContext';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);
  const { globalLanguage } = useAccessibility();
  const router = useRouter();

  useEffect(() => {
    const currentRole = getRole();
    setRole(currentRole);
    // Even fans who skip login will come here with no role (role = null)
  }, []);

  const handleLogout = () => {
    clearToken();
    router.push('/');
  };

  if (role) {
    return <CommanderDashboardUI />;
  }

  return (
    <main id="main-content" className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 focus:outline-none" tabIndex={-1}>
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tight drop-shadow-sm">PulsePoint</h1>
            <span className="text-indigo-200 font-medium bg-white/10 border border-white/20 backdrop-blur-md px-3 py-1 rounded-full text-sm mt-2 inline-block shadow-lg">Lumen Field 2026</span>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={handleLogout} className="text-indigo-200 hover:text-white underline text-sm">
                Back to Login
             </button>
          </div>
        </header>
        
        <FanAgentWidget />
      </div>
    </main>
  );
}
