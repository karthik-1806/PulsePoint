"use client";
import React, { useState, useEffect } from 'react';
import { getToken } from '@/lib/auth';
import SidebarNav from './SidebarNav';
import { Cloud, MapPin, Users, ShieldAlert, CheckCircle, ChevronRight, Activity, Thermometer, Clock, MessageSquare, Briefcase, Zap, Info, AlertTriangle, Train, Bus, Mic, X } from 'lucide-react';
import Image from 'next/image';
import IncidentForm from '../IncidentForm';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function CommanderDashboardUI() {
  const [briefing, setBriefing] = useState<any>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [briefingError, setBriefingError] = useState<string | null>(null);
  const prevDataRef = React.useRef({ incidents: -1, density: -1 });
  const [snapshot, setSnapshot] = useState<any>(null);
  const [sustainability, setSustainability] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [p4Congested, setP4Congested] = useState(false);

  const handleSidebarAction = (action: string) => {
    switch(action) {
      case 'incident': setActiveModal('incident'); break;
      case 'briefing': setActiveModal('briefing'); break;
      case 'security': setActiveModal('security'); break;
      case 'broadcast': setActiveModal('broadcast'); break;
      case 'checkin': setActiveModal('checkin'); break;
      case 'parking': 
        setP4Congested(true);
        showToast('Overflow Parking P4 Opened and quickly became congested.'); 
        break;
    }
  };
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    // Old briefing fetch removed, using new logic below

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8001';

    // Fetch Sustainability
    fetch(`${API_URL}/sustainability`)
    .then(res => res.json())
    .then(data => setSustainability(data))
    .catch(console.error);

    // Fetch Forecast
    fetch(`${API_URL}/forecast`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    })
    .then(res => res.json())
    .then(data => setForecast(data))
    .catch(console.error);

    // WebSocket for live snapshot
    const ws = new WebSocket(`${WS_URL}/ws/venue-pulse`);
    ws.onmessage = (event) => {
      try {
        setSnapshot(JSON.parse(event.data));
      } catch (e) {
        console.error(e);
      }
    };
    return () => ws.close();
  }, []);

  const fetchBriefing = async () => {
    setBriefingLoading(true);
    setBriefingError(null);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const res = await fetch(`${API_URL}/ops-agent/daily-briefing`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (!res.ok) throw new Error('Failed to fetch briefing');
      const data = await res.json();
      setBriefing(data);
    } catch (e: any) {
      setBriefingError(e.message || "Failed to generate briefing.");
    } finally {
      setBriefingLoading(false);
    }
  };

  useEffect(() => {
    if (!snapshot) return;
    const currentIncidents = snapshot.incidents?.length || 0;
    const currentDensity = Math.round((snapshot.gates?.Gate_C?.density || 0) / 10) * 10;
    
    if (
      !briefing || 
      currentIncidents !== prevDataRef.current.incidents ||
      currentDensity !== prevDataRef.current.density
    ) {
      fetchBriefing();
      prevDataRef.current = { incidents: currentIncidents, density: currentDensity };
    }
  }, [snapshot]);

  const getBriefingIcon = (type: string) => {
    switch(type) {
      case 'footfall': return <Activity size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />;
      case 'weather': return <Thermometer size={14} className="text-cyan-400 flex-shrink-0 mt-0.5" />;
      case 'parking': return <MapPin size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />;
      case 'staffing': return <Briefcase size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />;
      case 'incident': return <ShieldAlert size={14} className="text-red-400 flex-shrink-0 mt-0.5" />;
      default: return <Info size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />;
    }
  };

  // Compute derived values from live snapshot
  const totalAttendance = snapshot?.total_attendance || 84256;
  const capacityPct = Math.round((totalAttendance / (snapshot?.capacity || 90000)) * 100) || 92;
  const volunteers = snapshot?.roster?.length || 612;
  const activeIncidents = snapshot?.active_incidents || [];
  
  // Parse gates
  const gateA = snapshot?.gates?.find((g: any) => g.id === "A")?.density || 62;
  const gateB = snapshot?.gates?.find((g: any) => g.id === "B")?.density || 74;
  const gateC = snapshot?.gates?.find((g: any) => g.id === "C")?.density || 87;
  const gateD = snapshot?.gates?.find((g: any) => g.id === "D")?.density || 55;
  const gateE = snapshot?.gates?.find((g: any) => g.id === "E")?.density || 48;

  // Transport
  const parkingP1 = snapshot?.parking?.find((p: any) => p.id === "P1")?.fill_percentage || 68;
  const parkingP2 = snapshot?.parking?.find((p: any) => p.id === "P2")?.fill_percentage || 81;
  const parkingP3 = snapshot?.parking?.find((p: any) => p.id === "P3")?.fill_percentage || 92;
  const parkingP4 = p4Congested ? 98 : (snapshot?.parking?.find((p: any) => p.id === "P4")?.fill_percentage || 35);

  const greenScore = sustainability?.score_data?.score || 78;

  return (
    <div className="flex h-screen bg-[#0B1120] text-slate-200 overflow-hidden font-sans relative">
      <SidebarNav onAction={handleSidebarAction} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto h-full scrollbar-hide">
        <div className="p-6 pb-24">
          
          {/* Header Row */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
               <div>
                 <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                   Operations Command Center
                 </h2>
               </div>
            </div>
            
            {/* Weather Widget */}
            <div className="bg-[#1e293b]/60 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4">
              <Cloud size={32} className="text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-white leading-none">14&deg;C <span className="text-sm font-normal text-slate-300">Light Rain</span></p>
                <div className="flex gap-4 text-xs text-slate-400 mt-1">
                  <span>Wind 12 km/h</span>
                  <span>Humidity 72%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Greeting */}
          <div className="bg-gradient-to-r from-blue-900/40 to-transparent p-6 rounded-2xl border border-blue-800/30 mb-6 relative overflow-hidden">
             <div className="absolute right-0 top-0 opacity-10 pointer-events-none">
               <svg viewBox="0 0 100 100" width="400" height="400"><circle cx="50" cy="50" r="40" stroke="white" strokeWidth="2" fill="none"/></svg>
             </div>
             <h3 className="text-2xl font-bold text-white mb-1">Live operational intelligence — Here's your operational overview for today.</h3>
             
             {/* Stats Cards Row */}
             <div className="grid grid-cols-5 gap-4 mt-6">
               <StatCard icon={<Users className="text-emerald-400" />} label="ATTENDANCE" value={totalAttendance.toLocaleString()} subText={`${capacityPct}% capacity`} subColor="text-emerald-400" expected="Expected" />
               <StatCard icon={<ShieldAlert className="text-red-400" />} label="GATE CROWD RISK" value={gateC > 80 ? "HIGH" : "NORMAL"} subText="Most Concerning" subColor={gateC > 80 ? "text-red-400" : "text-emerald-400"} expected={`Gate C • ${gateC}%`} border={gateC > 80 ? "border-red-500/30" : "border-slate-700/50"} />
               <StatCard icon={<Briefcase className="text-purple-400" />} label="VOLUNTEERS" value={volunteers} subText="28 on standby" subColor="text-purple-400" expected="Deployed" />
               <StatCard icon={<AlertTriangle className="text-amber-400" />} label="INCIDENTS TODAY" value={activeIncidents.length || 7} subText="3 Open • 4 Resolved" subColor="text-amber-400" expected="" />
               <StatCard icon={<CheckCircle className="text-emerald-400" />} label="SAFETY STATUS" value="GOOD" subText="No critical alerts" subColor="text-emerald-400" expected="All clear" />
             </div>
          </div>

          {/* Venue Pulse & Density Row */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="col-span-2 bg-[#1e293b]/60 border border-slate-700/50 rounded-2xl p-6 relative">
               <div className="flex justify-between items-center mb-4">
                 <h4 className="text-sm font-bold text-slate-300 tracking-wider">VENUE PULSE <span className="text-emerald-400 text-xs ml-2 font-normal">&bull; Live Status</span></h4>
               </div>
               <div className="flex gap-6 h-[250px]">
                  {/* Gate List */}
                  <div className="flex flex-col justify-between w-[150px]">
                    <GateStatus gate="Gate A" status={`${gateA}%`} color={gateA > 80 ? "text-red-400" : "text-emerald-400"} border={gateA > 80 ? "border-red-500/50" : "border-emerald-500/30"} active={gateA > 80} bg={gateA > 80 ? "bg-red-500/10" : "bg-transparent"} />
                    <GateStatus gate="Gate B" status={`${gateB}%`} color={gateB > 80 ? "text-red-400" : gateB > 60 ? "text-amber-400" : "text-emerald-400"} border={gateB > 80 ? "border-red-500/50" : gateB > 60 ? "border-amber-500/30" : "border-emerald-500/30"} active={gateB > 80} bg={gateB > 80 ? "bg-red-500/10" : "bg-transparent"} />
                    <GateStatus gate="Gate C" status={`${gateC}%`} color={gateC > 80 ? "text-red-400" : "text-emerald-400"} border={gateC > 80 ? "border-red-500/50" : "border-emerald-500/30"} active={gateC > 80} bg={gateC > 80 ? "bg-red-500/10" : "bg-transparent"} />
                    <GateStatus gate="Gate D" status={`${gateD}%`} color={gateD > 80 ? "text-red-400" : "text-emerald-400"} border={gateD > 80 ? "border-red-500/50" : "border-emerald-500/30"} active={gateD > 80} bg={gateD > 80 ? "bg-red-500/10" : "bg-transparent"} />
                    <GateStatus gate="Gate E" status={`${gateE}%`} color={gateE > 80 ? "text-red-400" : "text-emerald-400"} border={gateE > 80 ? "border-red-500/50" : "border-emerald-500/30"} active={gateE > 80} bg={gateE > 80 ? "bg-red-500/10" : "bg-transparent"} />
                  </div>
                  {/* Image Area */}
                  <div className="flex-1 relative rounded-xl overflow-hidden border border-slate-700/50 flex items-center justify-center bg-black/50">
                    <img src="/stadium_pulse.png" alt="Stadium Map" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className={`absolute top-4 left-[40%] text-white text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${gateA > 80 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-emerald-500'}`}>A</div>
                    <div className={`absolute left-4 top-[40%] text-white text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${gateB > 80 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : gateB > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}>B</div>
                    <div className={`absolute right-4 top-[40%] text-white text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${gateC > 80 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-emerald-500'}`}>C</div>
                    <div className={`absolute bottom-4 right-[30%] text-white text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${gateD > 80 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-emerald-500'}`}>D</div>
                    <div className={`absolute bottom-4 left-[30%] text-white text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${gateE > 80 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]' : 'bg-emerald-500'}`}>E</div>
                  </div>
               </div>
            </div>
            
            {/* Density Chart */}
            <div className="col-span-1 bg-[#1e293b]/60 border border-slate-700/50 rounded-2xl p-6 flex flex-col relative">
               <h4 className="text-sm font-bold text-slate-300 tracking-wider mb-2">PREDICTED CROWD DENSITY</h4>
               <p className="text-xs text-slate-400 mb-2">Next 60 Minutes</p>
               
               <div className="absolute top-6 right-6 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
                 {forecast?.forecasts?.Gate_C?.[4]?.value || gateC}%
               </div>

               <div className="flex-1 w-full h-[120px] mt-2">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={[
                      { time: 'Now', density: 20 },
                      { time: '10m', density: 24 },
                      { time: '20m', density: 30 },
                      { time: '30m', density: 50 },
                      { time: '40m', density: 44 },
                      { time: '50m', density: 70 },
                      { time: '60m', density: 84 },
                   ]} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                     <defs>
                       <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                         <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                     <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} domain={[0, 100]} hide />
                     <Tooltip 
                       contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px', fontSize: '12px' }}
                       itemStyle={{ color: '#ef4444' }}
                     />
                     <Area 
                       type="monotone" 
                       dataKey="density" 
                       stroke="#ef4444" 
                       strokeWidth={2}
                       fillOpacity={1} 
                       fill="url(#colorDensity)" 
                       activeDot={{ r: 4, fill: '#ef4444', stroke: '#fff', strokeWidth: 2 }}
                       dot={{ r: 3, fill: '#1e293b', stroke: '#ef4444', strokeWidth: 1.5 }}
                     />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
               
               <div className="bg-[#1e293b] border border-slate-700 rounded-lg p-3 flex gap-3 items-start mt-4">
                 <div className="text-amber-400 mt-1"><Users size={16} /></div>
                 <div className="flex-1">
                    <p className="text-xs font-bold text-slate-300">AI RECOMMENDATION</p>
                    <p className="text-xs text-slate-400">{forecast?.recommendations?.[0] || 'Redirect incoming fans from Gate C to Gate D and E to balance density.'}</p>
                 </div>
                 <ChevronRight size={16} className="text-slate-500 mt-2" />
               </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-6">
             <div className="bg-[#1e293b]/60 border border-slate-700/50 rounded-2xl p-6">
               <h4 className="text-sm font-bold text-slate-300 tracking-wider mb-4">TRANSPORT & PARKING</h4>
               <p className="text-xs text-slate-400 mb-4 -mt-3">Live Status</p>
               <div className="space-y-3">
                 <TransportRow label="Parking P1" value={`${parkingP1}%`} color={parkingP1 > 85 ? "text-red-400" : "text-emerald-400"} />
                 <TransportRow label="Parking P2" value={`${parkingP2}%`} color={parkingP2 > 85 ? "text-red-400" : parkingP2 > 70 ? "text-amber-400" : "text-emerald-400"} />
                 <TransportRow label="Parking P3" value={`${parkingP3}%`} color={parkingP3 > 85 ? "text-red-400" : "text-emerald-400"} />
                 <TransportRow label="Parking P4" value={`${parkingP4}%`} color={parkingP4 > 85 ? "text-red-400" : "text-emerald-400"} />
               </div>
               <button onClick={() => setActiveModal('map')} className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 border border-slate-700 transition-colors flex justify-between items-center px-4">
                 View Map <ChevronRight size={14} />
               </button>
             </div>
             
             <div className="bg-[#1e293b]/60 border border-slate-700/50 rounded-2xl p-6">
               <h4 className="text-sm font-bold text-slate-300 tracking-wider mb-4">PUBLIC TRANSPORT</h4>
               <p className="text-xs text-slate-400 mb-4 -mt-3">Live Updates</p>
               <div className="space-y-4">
                 <div className="flex justify-between items-center p-2 rounded bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-2"><Train size={14} className="text-slate-400" /><span className="text-sm">Light Rail</span></div>
                    <span className="text-emerald-400 text-xs flex items-center gap-1">On Time <CheckCircle size={10} /></span>
                 </div>
                 <div className="flex justify-between items-center p-2 rounded bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-2"><Bus size={14} className="text-slate-400" /><span className="text-sm">Metro Bus</span></div>
                    <span className="text-amber-400 text-xs flex items-center gap-1">Minor Delays <AlertTriangle size={10} /></span>
                 </div>
                 <div className="flex justify-between items-center p-2 rounded bg-slate-800/50 border border-slate-700">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-400 rounded-full" /><span className="text-sm">Ferry</span></div>
                    <span className="text-emerald-400 text-xs flex items-center gap-1">On Time <CheckCircle size={10} /></span>
                 </div>
               </div>
               <button onClick={() => setActiveModal('transport')} className="w-full mt-[18px] py-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-xs font-bold text-blue-400 border border-blue-500/30 transition-colors flex justify-between items-center px-4">
                 View All <ChevronRight size={14} />
               </button>
             </div>
             
             <div className="bg-[#1e293b]/60 border border-slate-700/50 rounded-2xl p-6 flex flex-col justify-between">
               <div>
                 <h4 className="text-sm font-bold text-slate-300 tracking-wider mb-4">GREEN MATCHDAY SCORE <span className="text-emerald-400 text-[10px] font-normal ml-2">&bull; Live Score</span></h4>
                 <div className="flex items-center gap-6 mb-4">
                   <div className="relative w-24 h-24 rounded-full border-[6px] border-slate-700 flex items-center justify-center">
                     <div className="absolute inset-0 rounded-full border-[6px] border-emerald-400 border-r-transparent border-t-transparent -rotate-45"></div>
                     <div className="text-center">
                       <span className="text-3xl font-bold text-white block leading-none">{greenScore}</span>
                       <span className="text-[10px] text-slate-400">/100</span>
                     </div>
                   </div>
                   <div>
                     <p className="text-white font-bold mb-1">Great Progress!</p>
                     <p className="text-xs text-slate-400">Keep it up, team! You're making a positive impact.</p>
                   </div>
                 </div>
               </div>
               <div>
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center divide-x divide-slate-700">
                    <div>
                      <Cloud size={14} className="text-emerald-400 mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400">CO₂ Saved</p>
                      <p className="text-sm font-bold text-white">2.4 t</p>
                    </div>
                    <div>
                      <div className="w-3 h-3 bg-emerald-400 rounded-sm mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400">Waste Diverted</p>
                      <p className="text-sm font-bold text-white">1.8 t</p>
                    </div>
                    <div>
                      <div className="w-3 h-3 bg-blue-400 rounded-full mx-auto mb-1" />
                      <p className="text-[10px] text-slate-400">Water Saved</p>
                      <p className="text-sm font-bold text-white">12.6 kL</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveModal('sustainability')} className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300 border border-slate-700 transition-colors flex justify-between items-center px-4">
                    View Details <ChevronRight size={14} />
                  </button>
               </div>
             </div>
          </div>
          
        </div>
      </div>
      
      {/* Right Sidebar */}
      <div className="w-[320px] flex-shrink-0 flex flex-col bg-[#0f172a] border-l border-slate-800 h-full overflow-y-auto p-4 scrollbar-hide">
        
        {/* AI Briefing */}
        <div className="bg-blue-900/10 border border-blue-500/20 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
             <div className="flex items-center gap-2">
               <div className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(59,130,246,0.5)]">AI</div>
               <h4 className="text-xs font-bold text-white tracking-wider">AI DAILY BRIEFING</h4>
             </div>
             {briefing && briefing.generated_at && (
               <span className="text-[9px] text-slate-400">Generated {new Date(briefing.generated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
             )}
          </div>
          
          {briefingLoading && !briefing ? (
             <div className="space-y-3 mb-4">
                <div className="h-4 bg-slate-800 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-slate-800 rounded animate-pulse w-5/6"></div>
                <div className="h-4 bg-slate-800 rounded animate-pulse w-4/6"></div>
             </div>
          ) : briefingError && !briefing ? (
             <div className="mb-4 text-center">
                <p className="text-xs text-red-400 mb-2">{briefingError}</p>
                <button onClick={fetchBriefing} className="text-[10px] bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded border border-slate-700 text-white">Retry</button>
             </div>
          ) : briefing ? (
             <ul className="space-y-3 text-xs text-slate-300 mb-4">
                {briefing.items?.slice(0, 4).map((item: any, idx: number) => (
                  <li key={idx} className="flex gap-2 items-start">
                    {getBriefingIcon(item.type)} 
                    <span className="leading-snug">{item.message}</span>
                  </li>
                ))}
             </ul>
          ) : (
             <div className="text-center text-xs text-slate-500 mb-4 py-4">Waiting for venue data...</div>
          )}
          
          <button onClick={() => setActiveModal('briefing')} disabled={!briefing && !briefingError} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg flex justify-center items-center gap-2 transition-colors">
            <Zap size={12} /> View Full Briefing <ChevronRight size={12} />
          </button>
        </div>
        
        {/* Recent Incidents */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold text-slate-300 tracking-wider">RECENT INCIDENTS</h4>
            <span className="text-[10px] text-slate-400 hover:text-white cursor-pointer">View All</span>
          </div>
          <div className="space-y-2">
             <IncidentRow icon={<Activity className="text-red-400" size={14} />} title="Medical Assistance Required" loc="Section 128 • 2 mins ago" status="OPEN" statusColor="bg-red-900/30 text-red-400 border-red-500/30" />
             <IncidentRow icon={<Users className="text-red-400" size={14} />} title="Crowd Congestion" loc="Gate C • 7 mins ago" status="OPEN" statusColor="bg-red-900/30 text-red-400 border-red-500/30" />
             <IncidentRow icon={<Info className="text-emerald-400" size={14} />} title="Lost & Found: Child" loc="Section 110 • 15 mins ago" status="RESOLVED" statusColor="bg-emerald-900/30 text-emerald-400 border-emerald-500/30" />
             <IncidentRow icon={<Thermometer className="text-emerald-400" size={14} />} title="Spill Reported" loc="Concourse B • 18 mins ago" status="RESOLVED" statusColor="bg-emerald-900/30 text-emerald-400 border-emerald-500/30" />
          </div>
        </div>
        
        <div className="mt-auto pt-6 text-center pb-2">
          <p className="text-[9px] tracking-[0.2em] text-slate-400 font-bold">ONE WORLD. ONE GAME. ONE TEAM.</p>
        </div>
      </div>

      {/* Modals & Overlays */}
      {activeModal === 'incident' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Report an Incident</h2>
            <IncidentForm />
          </div>
        </div>
      )}

      {activeModal === 'briefing' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#0f172a] border border-blue-500/30 rounded-3xl p-8 max-w-5xl w-full relative shadow-[0_0_50px_rgba(59,130,246,0.15)] max-h-[85vh] flex flex-col">
            <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-600 p-2 rounded-lg text-white"><Zap size={24} /></div>
              <h2 className="text-2xl font-bold text-white">Full AI Shift Briefing & Grounding Data</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 gap-8">
               <div>
                 <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2">Generated Briefing</h3>
                 {briefingError ? (
                   <div className="bg-red-900/20 text-red-400 p-4 rounded-xl border border-red-500/30 text-sm">
                     {briefingError}
                   </div>
                 ) : briefingLoading && !briefing ? (
                   <p className="text-slate-400">Generating briefing...</p>
                 ) : briefing ? (
                   <div className="space-y-4">
                     <p className="text-xs text-slate-500 mb-2">Generated at: {new Date(briefing.generated_at).toLocaleString()}</p>
                     {briefing.items?.map((item: any, idx: number) => (
                       <div key={idx} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex gap-3 items-start shadow-sm">
                          <div className="mt-1 p-2 bg-slate-900 rounded-lg">{getBriefingIcon(item.type)}</div>
                          <div>
                             <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">{item.type}</p>
                             <p className="text-sm text-slate-200">{item.message}</p>
                          </div>
                       </div>
                     ))}
                   </div>
                 ) : <p className="text-slate-500">No briefing available.</p>}
               </div>
               
               <div>
                 <h3 className="text-lg font-bold text-slate-200 mb-4 border-b border-slate-700 pb-2 flex justify-between items-end">
                   <span>Grounding Data</span>
                   <span className="text-[10px] font-normal text-slate-400 pb-1">Raw Venue Pulse</span>
                 </h3>
                 <div className="bg-[#1e293b] rounded-xl border border-slate-700 overflow-hidden h-[calc(100%-3rem)] flex flex-col">
                   <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 text-xs font-mono text-slate-400 flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-red-500"></div>
                     <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                     <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                   </div>
                   <pre className="p-4 text-[11px] font-mono text-emerald-400 overflow-y-auto flex-1">
                     {JSON.stringify(snapshot, null, 2)}
                   </pre>
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'security' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-8 max-w-lg w-full relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Contact Security</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Emergency Information</label>
                <textarea rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-blue-500" placeholder="Describe the situation..."></textarea>
              </div>
              <button onClick={() => { setActiveModal(null); showToast("Message sent to security!"); }} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors">
                Send to Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'broadcast' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-8 max-w-lg w-full relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Broadcast Message</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Message to All Staff</label>
                <textarea rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" placeholder="Enter message to broadcast..."></textarea>
              </div>
              <button onClick={() => { setActiveModal(null); showToast("Broadcast sent!"); }} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-colors">
                Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'checkin' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-8 max-w-sm w-full relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Volunteer Check-In</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Volunteer ID or Name</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-500" placeholder="e.g. VOL-8422 or John Doe" />
              </div>
              <button onClick={() => { setActiveModal(null); showToast("Volunteer checked in successfully!"); }} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-colors">
                Check In
              </button>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'map' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-8 max-w-4xl w-full relative shadow-2xl h-[80vh] flex flex-col">
            <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white z-10">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Live Parking Map</h2>
            <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 relative overflow-hidden flex items-center justify-center">
              {/* Generated Map Background */}
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: 'url(/stadium_map.png)' }}>
                <div className="absolute inset-0 bg-[#0f172a]/60"></div> {/* Overlay to ensure pins are visible */}
              </div>
              
              {/* Fake pins */}
              <div className="absolute top-[20%] left-[20%] flex flex-col items-center animate-pulse">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.5)]">P1</div>
                <div className="text-white text-[10px] font-bold mt-1 bg-black/50 px-2 py-0.5 rounded">68% Full</div>
              </div>
              <div className="absolute top-[30%] right-[25%] flex flex-col items-center animate-pulse">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-[0_0_15px_rgba(245,158,11,0.5)]">P2</div>
                <div className="text-white text-[10px] font-bold mt-1 bg-black/50 px-2 py-0.5 rounded">81% Full</div>
              </div>
              <div className="absolute bottom-[25%] right-[30%] flex flex-col items-center animate-pulse">
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-[0_0_15px_rgba(239,68,68,0.5)]">P3</div>
                <div className="text-white text-[10px] font-bold mt-1 bg-black/50 px-2 py-0.5 rounded">92% Full</div>
              </div>
              <div className="absolute bottom-[20%] left-[30%] flex flex-col items-center animate-pulse">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${p4Congested ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'}`}>P4</div>
                <div className="text-white text-[10px] font-bold mt-1 bg-black/50 px-2 py-0.5 rounded">{p4Congested ? '98% Full' : '35% Full'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'transport' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Full Transportation Schedule</h2>
            <div className="space-y-4">
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2"><Train size={16} /> Light Rail (Green Line)</h3>
                <div className="grid grid-cols-3 text-sm text-slate-300">
                  <div>Next Train: <span className="font-bold text-white">2 Mins</span></div>
                  <div>Frequency: <span className="font-bold text-white">Every 5m</span></div>
                  <div>Status: <span className="font-bold text-emerald-400">On Time</span></div>
                </div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <h3 className="text-amber-400 font-bold mb-3 flex items-center gap-2"><Bus size={16} /> Metro Bus (Routes 40, 62)</h3>
                <div className="grid grid-cols-3 text-sm text-slate-300">
                  <div>Next Bus: <span className="font-bold text-white">8 Mins</span></div>
                  <div>Frequency: <span className="font-bold text-white">Every 15m</span></div>
                  <div>Status: <span className="font-bold text-amber-400">Minor Delays</span></div>
                </div>
                <p className="text-xs text-slate-500 mt-2 italic">Traffic congestion on Main St causing delays.</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-slate-400 flex items-center justify-center text-[8px] text-slate-900 font-bold">F</div> Water Taxi</h3>
                <div className="grid grid-cols-3 text-sm text-slate-300">
                  <div>Next Ferry: <span className="font-bold text-white">12 Mins</span></div>
                  <div>Frequency: <span className="font-bold text-white">Every 30m</span></div>
                  <div>Status: <span className="font-bold text-emerald-400">On Time</span></div>
                </div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white font-bold">S</div> Ride Share (Uber/Lyft)</h3>
                <div className="grid grid-cols-3 text-sm text-slate-300">
                  <div>Wait Time: <span className="font-bold text-white">4 Mins</span></div>
                  <div>Surge: <span className="font-bold text-red-400">1.5x</span></div>
                  <div>Status: <span className="font-bold text-emerald-400">Active</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'sustainability' && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-[#1e293b] border border-slate-700 rounded-3xl p-8 max-w-2xl w-full relative shadow-2xl">
            <button onClick={() => setActiveModal(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold text-white mb-2">Sustainability Report</h2>
            <p className="text-slate-400 mb-6">Detailed breakdown of the current matchday environmental impact.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl">
                <h3 className="text-emerald-400 font-bold mb-1">Carbon Footprint</h3>
                <p className="text-2xl font-bold text-white mb-2">2.4 t <span className="text-sm font-normal text-slate-400">CO₂ Saved</span></p>
                <p className="text-xs text-slate-300">Equivalent to planting 114 trees. Powered entirely by solar grid credits.</p>
              </div>
              <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl">
                <h3 className="text-blue-400 font-bold mb-1">Water Conservation</h3>
                <p className="text-2xl font-bold text-white mb-2">12.6 kL <span className="text-sm font-normal text-slate-400">Saved</span></p>
                <p className="text-xs text-slate-300">Through low-flow fixtures and rainwater harvesting systems.</p>
              </div>
              <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-xl col-span-2">
                <h3 className="text-amber-400 font-bold mb-1">Waste Diversion</h3>
                <p className="text-2xl font-bold text-white mb-2">1.8 t <span className="text-sm font-normal text-slate-400">Diverted from landfill</span></p>
                <div className="w-full bg-slate-800 rounded-full h-2 mb-2 mt-3">
                  <div className="bg-amber-400 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <p className="text-xs text-slate-300">85% of all stadium waste has been successfully composted or recycled today.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-6 right-[340px] bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold text-sm flex items-center gap-3 animate-bounce">
          <CheckCircle size={18} />
          {toastMessage}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, subText, subColor, expected, border = "border-slate-700/50" }: any) {
  return (
    <div className={`bg-[#1e293b]/80 border ${border} rounded-xl p-3 flex flex-col justify-between`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-[10px] font-bold text-slate-400 tracking-wider">{label}</p>
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none mb-1">{value}</p>
        <p className="text-xs text-slate-400">{expected}</p>
        <p className={`text-[10px] font-bold ${subColor} mt-1`}>{subText}</p>
      </div>
    </div>
  );
}

function GateStatus({ gate, status, color, active = false, border, bg = "bg-transparent" }: any) {
  return (
    <div className={`flex items-center justify-between p-2 rounded-lg border ${border} ${bg} ${active ? 'shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}`}>
       <div className="flex items-center gap-2">
         <div className={`w-4 h-4 rounded flex items-center justify-center border ${border}`}>
           {active ? <AlertTriangle size={10} className="text-red-400" /> : <CheckCircle size={10} className={color} />}
         </div>
         <span className="text-xs font-semibold text-slate-300">{gate}</span>
       </div>
       <span className={`text-xs font-bold ${color}`}>{status}</span>
    </div>
  );
}

function TransportRow({ label, value, color }: any) {
  return (
    <div className="flex justify-between items-center p-2 rounded bg-slate-800/50 border border-slate-700">
       <div className="flex items-center gap-2">
         <div className="w-4 h-4 rounded bg-slate-700 flex items-center justify-center">
            <div className={`w-2 h-2 rounded-full bg-current ${color}`}></div>
         </div>
         <span className="text-sm">{label}</span>
       </div>
       <span className={`text-xs font-bold ${color}`}>{value} <span className="text-slate-500 font-normal ml-1">&gt;</span></span>
    </div>
  );
}

function QuickAction({ icon, title, subtitle, bg, onClick }: any) {
  return (
    <div onClick={onClick} className={`${bg} border border-slate-700 rounded-lg p-3 cursor-pointer hover:bg-slate-700 transition-colors`}>
      <div className="mb-2">{icon}</div>
      <p className="text-[10px] font-bold text-slate-200">{title}</p>
      <p className="text-[9px] text-slate-400">{subtitle}</p>
    </div>
  );
}

function IncidentRow({ icon, title, loc, status, statusColor }: any) {
  return (
    <div className="flex items-start gap-3 p-2 rounded hover:bg-slate-800/50 transition-colors cursor-pointer border border-transparent hover:border-slate-700">
      <div className="mt-1 bg-slate-800 p-1.5 rounded-full">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-slate-200">{title}</p>
        <p className="text-[10px] text-slate-400">{loc}</p>
      </div>
      <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${statusColor}`}>
        {status}
      </div>
    </div>
  );
}
