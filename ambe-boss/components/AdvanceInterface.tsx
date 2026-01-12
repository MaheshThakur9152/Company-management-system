
import React, { useState } from 'react';

interface AdvanceInterfaceProps {
  onBack: () => void;
}

const AdvanceInterface: React.FC<AdvanceInterfaceProps> = ({ onBack }) => {
  const [selectedSite, setSelectedSite] = useState('All Sites');
  const sites = ['All Sites', 'Office', 'Maruti', 'Aalim', 'Aarti'];

  const employees = [
    { id: 1, name: 'Suman', site: 'Office', totalAdvance: 5000, recovered: 2000, pending: 3000 },
    { id: 2, name: 'Gajarabai', site: 'Maruti', totalAdvance: 10000, recovered: 1000, pending: 9000 },
    { id: 3, name: 'Maruti', site: 'Maruti', totalAdvance: 2000, recovered: 2000, pending: 0 },
    { id: 4, name: 'Vikram', site: 'Office', totalAdvance: 15000, recovered: 5000, pending: 10000 },
    { id: 5, name: 'Renu', site: 'Aalim', totalAdvance: 500, recovered: 0, pending: 500 },
  ];

  const filtered = selectedSite === 'All Sites' ? employees : employees.filter(e => e.site === selectedSite);

  // Calculate dynamic stats
  const totalGiven = filtered.reduce((acc, emp) => acc + emp.totalAdvance, 0);
  const totalRecovered = filtered.reduce((acc, emp) => acc + emp.recovered, 0);
  const totalPending = filtered.reduce((acc, emp) => acc + emp.pending, 0);

  const formatAmount = (amount: number) => {
    if (amount >= 1000) {
      return `₹${(amount / 1000).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}k`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#F3F5F9] overflow-hidden">
       {/* Header */}
      <div className="px-6 py-4 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 border-b border-white/50 shadow-sm flex-none">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition text-slate-600">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <h2 className="text-lg font-bold text-slate-800">Staff Advance</h2>
        <button className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center hover:bg-indigo-100 text-indigo-500">
            <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 pb-24 custom-scrollbar">
        
         {/* Filter */}
         <div className="mb-6">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Filter by Site</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {sites.map(site => (
                    <button
                        key={site}
                        onClick={() => setSelectedSite(site)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                            selectedSite === site 
                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' 
                            : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                    >
                        {site}
                    </button>
                ))}
            </div>
         </div>

         {/* Stats */}
         <div className="grid grid-cols-3 gap-3 mb-8">
             <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-50 text-center">
                 <p className="text-[10px] text-slate-400 font-bold uppercase">Given</p>
                 <p className="text-sm font-bold text-indigo-600 mt-1">{formatAmount(totalGiven)}</p>
             </div>
             <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-50 text-center">
                 <p className="text-[10px] text-slate-400 font-bold uppercase">Recovered</p>
                 <p className="text-sm font-bold text-green-500 mt-1">{formatAmount(totalRecovered)}</p>
             </div>
             <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-50 text-center">
                 <p className="text-[10px] text-slate-400 font-bold uppercase">Pending</p>
                 <p className="text-sm font-bold text-red-500 mt-1">{formatAmount(totalPending)}</p>
             </div>
         </div>

         {/* List */}
         <div className="space-y-4">
             {filtered.map(emp => (
                 <div key={emp.id} className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                     <div className="flex justify-between items-start mb-4">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                 {emp.name.substring(0,2).toUpperCase()}
                             </div>
                             <div>
                                 <h3 className="font-bold text-slate-800">{emp.name}</h3>
                                 <p className="text-xs text-slate-500">{emp.site}</p>
                             </div>
                         </div>
                         <div className="text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Pending</p>
                             <p className={`font-bold ${emp.pending > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                 ₹ {emp.pending.toLocaleString()}
                             </p>
                         </div>
                     </div>

                     {/* Progress Bar */}
                     <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                         <div 
                            className="absolute top-0 left-0 h-full bg-green-500 rounded-full"
                            style={{ width: `${(emp.recovered / emp.totalAdvance) * 100}%` }}
                         ></div>
                     </div>
                     <div className="flex justify-between text-[10px] font-bold text-slate-500">
                         <span>Recovered: ₹{emp.recovered}</span>
                         <span>Total: ₹{emp.totalAdvance}</span>
                     </div>
                     
                     {/* Action Buttons */}
                     {emp.pending > 0 && (
                         <div className="mt-4 flex gap-2">
                             <button className="flex-1 py-2 rounded-lg bg-green-50 text-green-600 text-xs font-bold border border-green-100 active:scale-95 transition-transform">
                                 Recover
                             </button>
                             <button className="flex-1 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold border border-indigo-100 active:scale-95 transition-transform">
                                 + Give More
                             </button>
                         </div>
                     )}
                 </div>
             ))}
             
             {filtered.length === 0 && (
                <div className="text-center py-10">
                    <p className="text-slate-400 text-sm">No advances found for {selectedSite}</p>
                </div>
             )}
         </div>

      </div>
    </div>
  );
};

export default AdvanceInterface;
