import React, { useState } from 'react';

interface AttendanceInterfaceProps {
  onBack: () => void;
}

interface AttendanceRecord {
  status: 'P' | 'A' | 'WO' | 'H'; // Present, Absent, Weekly Off, Holiday
  imageUrl?: string; // Optional image for Present
  timestamp?: string;
}

interface Employee {
  id: string;
  name: string;
  site: string;
  role: string;
  avatarSeed: string;
  phone?: string;
  attendance: AttendanceRecord[]; 
}

const AttendanceInterface: React.FC<AttendanceInterfaceProps> = ({ onBack }) => {
  const [selectedSite, setSelectedSite] = useState('All Sites');
  const [selectedMonth, setSelectedMonth] = useState('Dec 2025');
  const [viewImage, setViewImage] = useState<{url: string, employeeName: string, date: string} | null>(null);

  const sites = ['All Sites', 'Office', 'Maruti', 'Aalim', 'Aarti'];

  // Mock Data Generation
  const generateAttendance = (seed: number): AttendanceRecord[] => {
    return Array.from({ length: 31 }, (_, i) => {
      const rand = Math.random();
      if (rand > 0.8) return { status: 'A' };
      if (rand > 0.7) return { status: 'H' };
      if (rand > 0.6) return { status: 'WO' };
      
      // Present with random images for some days
      const hasImage = Math.random() > 0.5;
      return { 
        status: 'P', 
        imageUrl: hasImage ? `https://picsum.photos/seed/${seed + i}/400/600` : undefined 
      };
    });
  };

  const employees: Employee[] = [
    { id: '1234', name: 'Suman', site: 'Office', role: 'Staff', avatarSeed: 'Suman', phone: '12345679', attendance: generateAttendance(100) },
    { id: '1235', name: 'Gajarabai', site: 'Maruti', role: 'Worker', avatarSeed: 'Gajarabai', attendance: generateAttendance(200) },
    { id: '1236', name: 'Maruti', site: 'Maruti', role: 'Worker', avatarSeed: 'Maruti', attendance: generateAttendance(300) },
    { id: '1237', name: 'Renu', site: 'Aalim', role: 'Worker', avatarSeed: 'Renu', attendance: generateAttendance(400) },
    { id: '2001', name: 'Aalim', site: 'Aalim', role: 'Supervisor', avatarSeed: 'Aalim', attendance: generateAttendance(500) },
    { id: '14084', name: 'Aarti', site: 'Aarti', role: 'Manager', avatarSeed: 'Aarti', attendance: generateAttendance(600) },
    { id: '14085', name: 'Vikram', site: 'Office', role: 'Driver', avatarSeed: 'Vikram', phone: '98765432', attendance: generateAttendance(700) },
    { id: '14086', name: 'Rohit', site: 'Office', role: 'Staff', avatarSeed: 'Rohit', attendance: generateAttendance(800) },
    { id: '14087', name: 'Priya', site: 'Aalim', role: 'Worker', avatarSeed: 'Priya', attendance: generateAttendance(900) },
  ];

  const filteredEmployees = selectedSite === 'All Sites' 
    ? employees 
    : employees.filter(emp => emp.site === selectedSite);

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full bg-[#F3F5F9] relative">
      {/* Header */}
      <div className="px-5 py-4 bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 shadow-sm flex-none">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition text-slate-600 active:scale-95">
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div className="text-center">
            <h2 className="text-lg font-bold text-slate-800">Attendance Grid</h2>
            <p className="text-xs text-slate-500 font-medium">{selectedSite} • {selectedMonth}</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center border border-green-100 active:scale-95">
             <i className="fa-solid fa-file-export text-green-600 text-sm"></i>
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          <div className="relative min-w-[140px]">
            <select 
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-4 pr-8 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300"
            >
              {sites.map(site => <option key={site} value={site}>{site}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <i className="fa-solid fa-chevron-down text-[10px]"></i>
            </div>
          </div>

          <div className="relative min-w-[130px]">
             <div className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-between">
                <i className="fa-regular fa-calendar mr-2 text-slate-400"></i>
                <span>{selectedMonth}</span>
             </div>
          </div>
          
           <button className="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-purple-200 whitespace-nowrap active:scale-95 transition-transform flex items-center">
              <i className="fa-solid fa-plus mr-2"></i> Staff
           </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 overflow-hidden relative bg-white">
        <div className="h-full overflow-auto touch-pan-x touch-pan-y custom-scrollbar overscroll-contain">
            <table className="w-full text-left border-collapse min-w-max">
                <thead className="bg-slate-50/95 backdrop-blur-sm sticky top-0 z-30 shadow-sm">
                    <tr>
                        <th className="sticky left-0 bg-slate-50 z-40 p-3 min-w-[180px] border-r border-slate-200/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                            Employee
                        </th>
                        {days.map(day => (
                            <th key={day} className="p-1 min-w-[52px] text-center text-[10px] font-bold text-slate-400 border-r border-slate-100 last:border-0 bg-slate-50">
                                <div className="flex flex-col items-center justify-center h-full py-1">
                                    <span className="text-slate-600 text-xs mb-0.5">{day}</span>
                                    <span className="font-medium text-[9px] opacity-60">MON</span>
                                </div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                            {/* Employee Sticky Column */}
                            <td className="sticky left-0 bg-white z-20 p-3 border-r border-slate-200 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center space-x-3">
                                    <div className="relative flex-shrink-0">
                                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-slate-700 bg-gradient-to-br from-yellow-100 to-yellow-300 border-2 border-white shadow-sm overflow-hidden`}>
                                            {emp.avatarSeed.substring(0,2).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-slate-800 truncate max-w-[120px]">{emp.name}</h3>
                                        <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate flex flex-wrap gap-1 max-w-[120px]">
                                           <span className="text-slate-400">#{emp.id}</span>
                                           <span>•</span>
                                           <span>{emp.site}</span>
                                        </div>
                                    </div>
                                </div>
                            </td>

                            {/* Attendance Cells */}
                            {emp.attendance.map((record, index) => (
                                <td key={index} className="p-1 border-r border-slate-50 last:border-0 text-center align-middle h-16">
                                    {record.status === 'P' && record.imageUrl ? (
                                        <button 
                                          onClick={() => setViewImage({
                                            url: record.imageUrl!, 
                                            employeeName: emp.name, 
                                            date: `${index + 1} Dec 2025`
                                          })}
                                          className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden relative group active:scale-90 transition-transform mx-auto shadow-sm"
                                        >
                                            <img src={record.imageUrl} alt="Attendance" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                                <i className="fa-solid fa-camera text-white text-[10px] drop-shadow-md"></i>
                                            </div>
                                        </button>
                                    ) : record.status === 'P' ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <div className="w-6 h-6 rounded-full bg-green-50 text-green-500 flex items-center justify-center">
                                              <i className="fa-solid fa-check text-xs"></i>
                                            </div>
                                        </div>
                                    ) : record.status === 'A' ? (
                                        <div className="flex items-center justify-center">
                                            <span className="px-2 py-1 rounded-md bg-red-50 text-red-500 text-[10px] font-bold border border-red-100">
                                                Ab
                                            </span>
                                        </div>
                                    ) : record.status === 'H' ? (
                                        <div className="flex items-center justify-center">
                                            <span className="px-2 py-1 rounded-md bg-blue-50 text-blue-500 text-[10px] font-bold border border-blue-100">
                                                HL
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-slate-300 text-[10px] font-medium">WO</div>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            
            {filteredEmployees.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <i className="fa-regular fa-folder-open text-2xl text-slate-300"></i>
                </div>
                <p className="font-medium">No staff found for this site.</p>
              </div>
            )}
            
            {/* Bottom Padding for visual comfort */}
            <div className="h-24"></div>
        </div>
      </div>

      {/* Image Modal (Lightbox) */}
      {viewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="absolute inset-0" onClick={() => setViewImage(null)}></div>
           
           <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
              {/* Modal Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-white">
                 <div>
                    <h3 className="font-bold text-slate-800">{viewImage.employeeName}</h3>
                    <p className="text-xs text-slate-500">{viewImage.date} • {selectedSite}</p>
                 </div>
                 <button 
                   onClick={() => setViewImage(null)}
                   className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200"
                 >
                   <i className="fa-solid fa-xmark"></i>
                 </button>
              </div>
              
              {/* Image Container */}
              <div className="flex-1 bg-black relative overflow-hidden flex items-center justify-center group">
                 <img src={viewImage.url} alt="Proof" className="w-full h-auto max-h-[60vh] object-contain" />
                 
                 {/* Metadata Overlay */}
                 <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[10px] px-2 py-1 rounded backdrop-blur-md flex items-center gap-1">
                    <i className="fa-solid fa-location-dot"></i>
                    <span>GPS Verified</span>
                 </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 bg-slate-50 flex gap-3">
                 <button className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-semibold text-sm shadow-lg shadow-purple-200 active:scale-95 transition-transform">
                    Verify
                 </button>
                 <button className="flex-1 bg-white text-slate-700 border border-slate-200 py-3 rounded-xl font-semibold text-sm active:scale-95 transition-transform">
                    Report Issue
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceInterface;