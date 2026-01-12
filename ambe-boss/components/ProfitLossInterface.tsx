
import React, { useState } from 'react';

interface ProfitLossInterfaceProps {
  onBack: () => void;
}

const ProfitLossInterface: React.FC<ProfitLossInterfaceProps> = ({ onBack }) => {
  const [period, setPeriod] = useState('Dec 2025');

  // Mock Data
  const stats = {
    netProfit: 124500,
    totalIncome: 450000,
    totalExpense: 325500,
  };

  const monthlyData = [
    { month: 'Sep', income: 30, expense: 20 },
    { month: 'Oct', income: 45, expense: 35 },
    { month: 'Nov', income: 38, expense: 40 },
    { month: 'Dec', income: 60, expense: 45 },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F3F5F9] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-white/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 border-b border-white/50 shadow-sm flex-none">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition text-slate-600">
          <i className="fa-solid fa-chevron-left"></i>
        </button>
        <h2 className="text-lg font-bold text-slate-800">Financial Overview</h2>
        <div className="w-10"></div>
      </div>

      <div className="overflow-y-auto pb-24 custom-scrollbar px-6 py-6">
        
        {/* Period Selector */}
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-700 text-lg">Report</h3>
            <div className="relative">
                <select 
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="appearance-none bg-white border border-slate-200 py-2 pl-4 pr-10 rounded-xl text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-200"
                >
                    <option>Oct 2025</option>
                    <option>Nov 2025</option>
                    <option>Dec 2025</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <i className="fa-solid fa-chevron-down text-xs"></i>
                </div>
            </div>
        </div>

        {/* Net Profit Card */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <p className="text-slate-300 text-sm font-medium mb-1">Net Profit ({period})</p>
            <h2 className="text-4xl font-bold mb-4 tracking-tight">₹ {stats.netProfit.toLocaleString()}</h2>
            <div className="flex items-center gap-2 text-green-400 bg-white/10 w-max px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                <i className="fa-solid fa-arrow-trend-up text-xs"></i>
                <span className="text-xs font-bold">+12.5% vs last month</span>
            </div>
        </div>

        {/* Income vs Expense Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 mb-3">
                    <i className="fa-solid fa-arrow-down-long transform rotate-45"></i>
                </div>
                <p className="text-slate-500 text-xs font-medium mb-1">Total Income</p>
                <p className="text-xl font-bold text-slate-800">₹ {(stats.totalIncome / 1000).toFixed(1)}k</p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-3">
                    <i className="fa-solid fa-arrow-up-long transform rotate-45"></i>
                </div>
                <p className="text-slate-500 text-xs font-medium mb-1">Total Expense</p>
                <p className="text-xl font-bold text-slate-800">₹ {(stats.totalExpense / 1000).toFixed(1)}k</p>
            </div>
        </div>

        {/* Simple Visual Chart */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800">Performance</h3>
                <div className="flex gap-3">
                     <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-800"></span>
                        <span className="text-[10px] font-bold text-slate-500">Income</span>
                     </div>
                     <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                        <span className="text-[10px] font-bold text-slate-500">Expense</span>
                     </div>
                </div>
            </div>
            
            <div className="flex items-end justify-between h-40 gap-4">
                {monthlyData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 flex-1">
                        <div className="w-full flex justify-center items-end gap-1 h-full">
                            <div className="w-3 bg-slate-800 rounded-t-full" style={{ height: `${data.income}%` }}></div>
                            <div className="w-3 bg-slate-200 rounded-t-full" style={{ height: `${data.expense}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{data.month}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* Detailed Breakdown */}
        <div>
            <h3 className="font-bold text-slate-800 mb-4">Breakdown</h3>
            <div className="space-y-3">
                {[
                    { label: 'Site Operations', amount: 120000, color: 'bg-blue-500' },
                    { label: 'Staff Salaries', amount: 85000, color: 'bg-purple-500' },
                    { label: 'Equipment Maintenance', amount: 45000, color: 'bg-orange-500' },
                    { label: 'Logistics', amount: 30000, color: 'bg-pink-500' },
                ].map((item, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                            <span className="text-sm font-semibold text-slate-700">{item.label}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800">₹ {item.amount.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default ProfitLossInterface;
