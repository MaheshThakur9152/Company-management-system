import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Search, Camera, Check, X as XIcon, LogOut, Wifi, RefreshCw, Lock, AlertTriangle } from 'lucide-react';
import { Employee, AttendanceRecord, AttendanceStatus, Site } from '../types';
import { getEmployees, syncAttendanceData, getSites } from '../services/mockData';
import CameraModal from '../components/CameraModal';

interface SupervisorScreenProps {
  onLogout: () => void;
  assignedSiteId: string;
}

const SupervisorScreen: React.FC<SupervisorScreenProps> = ({ onLogout, assignedSiteId }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Data State
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);

  // Local buffer for offline data
  const [localAttendanceMap, setLocalAttendanceMap] = useState<Record<string, AttendanceRecord>>(() => {
    try {
      const saved = localStorage.getItem('offline_attendance_buffer');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [activeEmployeeId, setActiveEmployeeId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | undefined>(undefined);
  
  // Geofencing State
  const [distanceToSite, setDistanceToSite] = useState<number | null>(null);
  const [isWithinRange, setIsWithinRange] = useState<boolean>(false);

  // Load Data specific to this supervisor
  useEffect(() => {
    const loadData = async () => {
      if (!assignedSiteId) return;
      
      const sites = await getSites();
      const site = sites.find(s => s.id === assignedSiteId);
      if (site) {
          setCurrentSite(site);
      }

      const emps = await getEmployees();
      // Filter employees for this site only
      const siteEmps = emps.filter(e => e.siteId === assignedSiteId);
      setAllEmployees(siteEmps);
    };
    loadData();
  }, [assignedSiteId]);

  // --- Haversine Formula for Distance ---
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in meters
  };

  // Network & Location Monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Watch Position for Geofencing
    let watchId: number;
    if (navigator.geolocation && currentSite) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
            const { latitude, longitude } = pos.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });

            // Calculate Distance
            const dist = calculateDistance(
                latitude, 
                longitude, 
                currentSite.latitude, 
                currentSite.longitude
            );
            
            setDistanceToSite(dist);
            setIsWithinRange(dist <= currentSite.geofenceRadius);
        },
        (err) => console.log("Location error", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [currentSite]);

  // Persist local buffer
  useEffect(() => {
    localStorage.setItem('offline_attendance_buffer', JSON.stringify(localAttendanceMap));
  }, [localAttendanceMap]);

  const handleSync = async () => {
    if (!isOnline) {
      alert("No internet connection available.");
      return;
    }

    const unsyncedRecords = (Object.values(localAttendanceMap) as AttendanceRecord[]).filter(r => !r.isSynced);
    if (unsyncedRecords.length === 0) {
      alert("No new records to sync.");
      return;
    }

    setIsSyncing(true);

    const success = await syncAttendanceData(unsyncedRecords);

    if (success) {
      setLocalAttendanceMap(prev => {
        const next = { ...prev };
        unsyncedRecords.forEach(rec => {
           if (next[rec.employeeId]) {
             next[rec.employeeId].isSynced = true;
             next[rec.employeeId].isLocked = true;
           }
        });
        return next;
      });
      alert("Sync Successful! Records locked and sent to Admin Panel.");
    } else {
      alert("Sync failed. Please try again.");
    }
    
    setIsSyncing(false);
  };

  const handleMarkAttendance = (empId: string) => {
    // --- GEOFENCING DISABLED FOR TESTING ---
    /*
    if (!isWithinRange) {
        alert("You are outside the site boundaries. Cannot mark attendance.");
        return;
    }
    */
    setActiveEmployeeId(empId);
    setIsCameraOpen(true);
  };

  const handlePhotoCaptured = (photoUrl: string) => {
    if (!activeEmployeeId) return;

    const record: AttendanceRecord = {
        id: Date.now().toString(),
        employeeId: activeEmployeeId,
        date: selectedDate,
        status: 'P',
        checkInTime: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        photoUrl: photoUrl,
        location: currentLocation,
        isSynced: false,
        isLocked: false
    };

    setLocalAttendanceMap(prev => ({ ...prev, [activeEmployeeId]: record }));
    setActiveEmployeeId(null);
  };

  const toggleStatus = (empId: string, status: AttendanceStatus) => {
    const existing = localAttendanceMap[empId];
    if (existing && existing.isLocked) {
      alert("This record is locked and synced. Contact Admin to edit.");
      return;
    }

    setLocalAttendanceMap(prev => ({
        ...prev,
        [empId]: {
            ...prev[empId],
            id: prev[empId]?.id || Date.now().toString(),
            employeeId: empId,
            date: selectedDate,
            status: status,
            isSynced: false,
            isLocked: false,
            photoUrl: prev[empId]?.photoUrl 
        }
    }));
  };

  const filteredEmployees = allEmployees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.biometricCode.includes(searchTerm)
  );

  const pendingSyncCount = (Object.values(localAttendanceMap) as AttendanceRecord[]).filter(r => !r.isSynced).length;

  if (!assignedSiteId) return <div className="flex h-screen items-center justify-center text-red-500 font-bold">Access Denied: No Site Assigned</div>;
  if (!currentSite) return <div className="flex h-screen items-center justify-center">Loading Site Data...</div>;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-gray-50 overflow-hidden relative">
      {/* Header */}
      <div className="flex-none bg-primary p-4 pb-6 shadow-md relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-white font-bold text-xl">Attendance</h1>
          <div className="flex items-center gap-3">
             <button 
                onClick={handleSync}
                disabled={isSyncing || !isOnline || pendingSyncCount === 0}
                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm transition-all border
                ${isOnline 
                    ? 'bg-white text-primary border-transparent hover:scale-105' 
                    : 'bg-transparent text-white border-white/30'}`}
             >
                {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : <Wifi size={12} />}
                {isSyncing ? 'Syncing...' : `${pendingSyncCount} Pending`}
             </button>
             <button onClick={onLogout} className="text-white/80 hover:text-white">
                <LogOut size={20} />
             </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className={`absolute top-0 left-0 w-full h-1 ${isOnline ? 'bg-success' : 'bg-error'}`} />

        {/* Geofence Status Card */}
        <div className={`flex flex-col gap-1 p-3 rounded-lg border backdrop-blur-sm transition-colors duration-300
            ${isWithinRange 
                ? 'bg-green-500/20 border-green-300/30' 
                : distanceToSite !== null 
                    ? 'bg-red-500/20 border-red-300/30' 
                    : 'bg-white/10 border-white/20'}`}>
            
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-white" />
                  <span className="text-white font-medium text-sm truncate">{currentSite.name}</span>
                </div>
                {distanceToSite !== null ? (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isWithinRange ? 'bg-white text-green-700' : 'bg-white text-red-600'}`}>
                        Geofence Disabled (Test Mode)
                    </span>
                ) : (
                    <span className="text-white/70 text-xs animate-pulse">Locating...</span>
                )}
            </div>
        </div>

        <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2 text-white">
                <Calendar size={16} />
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-white font-medium outline-none"
                />
            </div>
            <span className="text-white/80 text-sm">{filteredEmployees.length} Workers</span>
        </div>
      </div>

      {/* Search */}
      <div className="flex-none px-4 -mt-3 mb-2 z-20 relative">
        <div className="bg-white rounded-lg shadow-sm flex items-center p-3 border border-gray-100">
            <Search size={18} className="text-gray-400 mr-2" />
            <input 
                placeholder="Search worker..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none text-sm"
            />
        </div>
      </div>

      {/* Employee List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 hide-scrollbar scroll-smooth">
        {filteredEmployees.map(emp => {
            const record = localAttendanceMap[emp.id];
            const isPresent = record?.status === 'P';
            const isLocked = record?.isLocked;
            const isBlocked = false; // Disabled for testing

            return (
                <div key={emp.id} className={`p-4 rounded-xl shadow-sm border transition-colors ${isBlocked ? 'bg-gray-100 border-gray-200 opacity-70' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                                <img 
                                    src={record?.photoUrl || emp.photoUrl} 
                                    className={`w-12 h-12 rounded-full object-cover border-2 ${isPresent ? 'border-green-500' : 'border-gray-100'}`} 
                                    alt={emp.name} 
                                />
                                <span className="text-[10px] text-gray-500 font-medium max-w-[60px] truncate text-center">
                                    {currentSite.name.split(' ')[0]}
                                </span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-800">{emp.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{emp.biometricCode}</span>
                                    <span>{emp.role}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isPresent && (
                             <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                <Check size={12} /> {record.checkInTime}
                             </span>
                          )}
                          {isLocked && (
                             <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Lock size={10} /> Synced
                             </span>
                          )}
                        </div>
                    </div>

                    {/* Controls */}
                    {!isLocked ? (
                        <div className="flex gap-2 mt-2">
                            {!isPresent ? (
                                <button 
                                    onClick={() => handleMarkAttendance(emp.id)}
                                    disabled={false}
                                    className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium shadow-sm transition-all
                                        ${true 
                                            ? 'bg-primary text-white active:scale-95 hover:bg-teal-600' 
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                                >
                                    <Camera size={16} /> 
                                    Mark Present (Test)
                                </button>
                            ) : (
                                <button 
                                    onClick={() => toggleStatus(emp.id, 'A')}
                                    className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-red-100"
                                >
                                    <XIcon size={16} /> Undo / Absent
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="mt-2 text-center py-2 bg-gray-50 rounded-lg text-xs text-gray-400 font-medium">
                            Attendance Locked
                        </div>
                    )}
                </div>
            );
        })}
        {filteredEmployees.length === 0 && (
            <div className="text-center py-10 text-gray-400 text-sm">
                No workers found for this site.
            </div>
        )}
      </div>

      {/* Floating Action / Summary - Fixed Footer */}
      <div className="flex-none p-4 bg-white/90 backdrop-blur-md border-t border-gray-200 z-30 pb-6">
        <button 
          onClick={handleSync}
          disabled={!isOnline || pendingSyncCount === 0 || isSyncing}
          className={`w-full py-4 rounded-xl shadow-lg font-bold text-lg tracking-wide transition-all flex items-center justify-center gap-3
            ${(!isOnline || pendingSyncCount === 0) 
                ? 'bg-gray-800 text-gray-400' 
                : 'bg-accent text-white hover:bg-orange-600 active:scale-[0.98]'}`}
        >
            {isSyncing ? "Syncing..." : pendingSyncCount > 0 ? `SYNC ${pendingSyncCount} RECORDS` : "ALL SYNCED"}
        </button>
      </div>

      <CameraModal 
        isOpen={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={handlePhotoCaptured} 
        location={currentLocation}
      />
    </div>
  );
};

export default SupervisorScreen;