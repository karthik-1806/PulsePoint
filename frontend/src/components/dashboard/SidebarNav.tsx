"use client";
import React from 'react';
import { LayoutDashboard, Activity, Users, AlertTriangle, FileText, Settings, ShieldAlert, Mic, Navigation, Bus, Train, Briefcase, MessageSquare, CheckCircle, Zap, X } from 'lucide-react';
import { getRole } from '@/lib/auth';

export default function SidebarNav({ onAction }: { onAction?: (action: string) => void }) {
  const [role, setRole] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    setRole(getRole() || 'volunteer');
  }, []);

  const userName = role === 'commander' ? 'Arjun Patel' : (role === 'marshal' ? 'Marshal Staff' : 'Volunteer');
  
  return (
    <div className="w-[280px] flex-shrink-0 flex flex-col bg-[#0f172a] border-r border-slate-800 h-full p-4">
      {/* Logo Area */}
      <div className="flex items-center gap-3 mb-8 px-2 mt-2">
        <Activity className="text-emerald-400" size={32} />
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide leading-tight">PULSEPOINT</h1>
          <p className="text-[10px] text-emerald-400 tracking-widest uppercase font-semibold">Command Copilot</p>
        </div>
      </div>
      
      {/* Tournament Event */}
      <div className="flex items-center gap-3 mb-8 px-2">
         <div className="bg-amber-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-xs">W</div>
         <div>
           <p className="text-xs font-bold text-slate-200">FIFA</p>
           <p className="text-[10px] text-slate-400">WORLD CUP 2026™</p>
         </div>
      </div>
      

      {/* Nav Links */}
      <nav className="flex-1 space-y-1">
        <NavItem icon={<LayoutDashboard size={18} />} label="Dashboard" active />
      </nav>
      
      {/* Quick Actions */}
      <div className="mt-8">
        <h4 className="text-xs font-bold text-slate-400 tracking-wider mb-3">QUICK ACTIONS</h4>
        <div className="grid grid-cols-2 gap-2">
           <QuickAction icon={<AlertTriangle className="text-red-400" size={16} />} title="Report Incident" subtitle="New Report" bg="bg-slate-800/50" onClick={() => onAction?.('incident')} />
           <QuickAction icon={<Briefcase className="text-blue-400" size={16} />} title="AI Shift Briefing" subtitle="Generate Now" bg="bg-slate-800/50" onClick={() => onAction?.('briefing')} />
           <QuickAction icon={<MessageSquare className="text-emerald-400" size={16} />} title="Contact Security" subtitle="Call Channel" bg="bg-slate-800/50" onClick={() => onAction?.('security')} />
           <QuickAction icon={<Mic className="text-purple-400" size={16} />} title="Broadcast Message" subtitle="To All Staff" bg="bg-purple-900/20 border-purple-500/30" onClick={() => onAction?.('broadcast')} />
           <QuickAction icon={<CheckCircle className="text-amber-400" size={16} />} title="Volunteer Check-In" subtitle="Scan QR / NFC" bg="bg-slate-800/50" onClick={() => onAction?.('checkin')} />
           <QuickAction icon={<div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[10px] font-bold text-white">P</div>} title="Open Overflow" subtitle="Parking P4" bg="bg-slate-800/50" onClick={() => onAction?.('parking')} />
        </div>
      </div>
      

    </div>
  );
}

function NavItem({ icon, label, subLabel, active = false }: { icon: React.ReactNode, label: string, subLabel?: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors ${active ? 'bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}`}>
      <div className={`${active ? 'text-emerald-400' : 'text-slate-400'}`}>
         {icon}
      </div>
      <div>
        <p className={`text-sm font-semibold ${active ? 'text-white' : ''}`}>{label}</p>
        {subLabel && <p className={`text-[10px] ${active ? 'text-emerald-400/80' : 'text-slate-500'}`}>{subLabel}</p>}
      </div>
    </div>
  );
}

function QuickAction({ icon, title, subtitle, bg, onClick }: any) {
  return (
    <div onClick={onClick} className={`p-3 rounded-xl border border-slate-700/50 cursor-pointer hover:bg-slate-700/50 hover:border-slate-600 transition-all ${bg}`}>
      <div className="mb-2">{icon}</div>
      <p className="text-xs font-bold text-white leading-tight">{title}</p>
      <p className="text-[10px] text-slate-400">{subtitle}</p>
    </div>
  );
}
