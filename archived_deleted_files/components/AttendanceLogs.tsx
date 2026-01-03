import React, { useState, useMemo } from 'react';
import { LocationLog, Site } from '../types';
import { MapPin, Search, Calendar, Clock, X } from 'lucide-react';

interface AttendanceLogsProps {
  locationLogs: LocationLog[];
  sites: Site[];
}

const AttendanceLogs: React.FC<AttendanceLogsProps> = ({ locationLogs, sites }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedLogGroup, setSelectedLogGroup] = useState<any>(null);

  const groupedLogs = useMemo(() => {
    const groups: Record<string, {
      id: string;
      date: string;
      supervisorName: string;
      siteName: string;
      firstInTs: number;
      firstInLocation?: { latitude: number; longitude: number };
      lastOutTs: number;
      lastOutLocation?: { latitude: number; longitude: number };
      duration: string;
      status: string;
      logs: LocationLog[];
    }> = {};

    // Sort logs by timestamp asc first
    const sortedLogs = [...locationLogs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sortedLogs.forEach(log => {
      const d = new Date(log.timestamp);
      const dateKey = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
      
      // Search Term (Supervisor Name)
      const matchesSearch = !searchTerm || 
        (log.supervisorName?.toLowerCase().includes(searchTerm.toLowerCase()) || false);

      // Site Filter
      const matchesSite = selectedSite === 'all' || (log.siteId === selectedSite);

      // Date Filter
      const matchesDate = !selectedDate || dateKey === selectedDate;

      if (matchesSearch && matchesSite && matchesDate) {
        const key = `${log.supervisorName}-${dateKey}`;
        
        // Resolve Site Name
        const site = sites.find(s => s.id === log.siteId);
        const siteName = site ? site.name : (log.siteName || 'Unknown Site');

        if (!groups[key]) {
          groups[key] = {
            id: key,
            date: dateKey,
            supervisorName: log.supervisorName || 'Unknown Supervisor',
            siteName: siteName,
            firstInTs: 0,
            firstInLocation: undefined,
            lastOutTs: 0,
            lastOutLocation: undefined,
            duration: '-',
            status: 'Unknown',
            logs: []
          };
        }

        groups[key].logs.push(log);

        const ts = d.getTime();
        const status = (log.status || '').trim();

        // Logic: First IN is the first "In Range" event. Last OUT is the last "Out of Range" event.
        if (status === 'In Range' || status === 'In-Range') {
            if (groups[key].firstInTs === 0) {
                groups[key].firstInTs = ts;
                groups[key].firstInLocation = log.location;
            }
            // Update status to In Range
            groups[key].status = 'In Range';
        } else if (status === 'Out of Range' || status === 'Out-Of-Range') {
            // Always update last out to the latest one
            groups[key].lastOutTs = ts;
            groups[key].lastOutLocation = log.location;
            groups[key].status = 'Out of Range';
        }
      }
    });

    // Calculate Duration
    Object.values(groups).forEach(group => {
        if (group.firstInTs > 0 && group.lastOutTs > 0 && group.lastOutTs > group.firstInTs) {
            const diff = (group.lastOutTs - group.firstInTs) / (1000 * 60 * 60); // hours
            group.duration = `${diff.toFixed(1)} hrs`;
        }
    });

    return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [locationLogs, sites, searchTerm, selectedSite, selectedDate]);

  const getGoogleMapsLink = (lat?: number, lng?: number) => {
    if (!lat || !lng) return '#';
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in relative">
      {/* Modal Overlay */}
      {selectedLogGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="bg-primary text-white p-4 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">Out of Range Logs</h3>
                        <div className="text-sm opacity-90">{selectedLogGroup.supervisorName} • {selectedLogGroup.date}</div>
                    </div>
                    <button onClick={() => setSelectedLogGroup(null)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-0">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b sticky top-0">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600">Time</th>
                                <th className="p-4 font-semibold text-gray-600">Location</th>
                                <th className="p-4 font-semibold text-gray-600">Map</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedLogGroup.logs
                                .filter((l: LocationLog) => l.status === 'Out of Range' || l.status === 'Out-Of-Range')
                                .sort((a: LocationLog, b: LocationLog) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                .map((log: LocationLog, i: number) => (
                                <tr key={i} className="border-b hover:bg-gray-50">
                                    <td className="p-4 font-mono text-sm">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {log.location?.latitude?.toFixed(6) || '-'}, {log.location?.longitude?.toFixed(6) || '-'}
                                    </td>
                                    <td className="p-4">
                                        <a 
                                            href={getGoogleMapsLink(log.location?.latitude, log.location?.longitude)} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-blue-600 hover:underline text-sm font-medium"
                                        >
                                            <MapPin size={14} /> View
                                        </a>
                                    </td>
                                </tr>
                            ))}
                            {selectedLogGroup.logs.filter((l: LocationLog) => l.status === 'Out of Range' || l.status === 'Out-Of-Range').length === 0 && (
                                <tr>
                                    <td colSpan={3} className="p-8 text-center text-gray-500">No 'Out of Range' events recorded for this day.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button 
                        onClick={() => setSelectedLogGroup(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          Supervisor Location Logs
          <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {groupedLogs.length} Records
          </span>
        </h2>
        
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search Supervisor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary w-48"
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
             <input 
               type="date" 
               value={selectedDate}
               onChange={(e) => setSelectedDate(e.target.value)}
               className="pl-3 pr-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
             />
          </div>

          {/* Site Filter */}
          <select 
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Sites</option>
            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Supervisor</th>
              <th className="p-4 font-semibold text-gray-600">Site</th>
              <th className="p-4 font-semibold text-gray-600">Date</th>
              <th className="p-4 font-semibold text-gray-600">First IN (Geofence)</th>
              <th className="p-4 font-semibold text-gray-600">Last OUT (Geofence)</th>
              <th className="p-4 font-semibold text-gray-600">Duration</th>
              <th className="p-4 font-semibold text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {groupedLogs.map(group => (
                <tr key={group.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{group.supervisorName}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-gray-700">{group.siteName}</div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium">{group.date}</div>
                  </td>
                  
                  {/* First IN */}
                  <td className="p-4">
                    {group.firstInTs > 0 ? (
                        <div>
                            <div className="text-sm font-bold text-green-700">{new Date(group.firstInTs).toLocaleTimeString()}</div>
                            {group.firstInLocation && (
                                <a href={getGoogleMapsLink(group.firstInLocation.latitude, group.firstInLocation.longitude)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                                    <MapPin size={10} /> Location
                                </a>
                            )}
                        </div>
                    ) : <span className="text-gray-400">-</span>}
                  </td>

                  {/* Last OUT */}
                  <td className="p-4">
                    {group.lastOutTs > 0 ? (
                        <div 
                            className="cursor-pointer group"
                            onClick={() => setSelectedLogGroup(group)}
                            title="Click to view all Out of Range logs"
                        >
                            <div className="text-sm font-bold text-red-700 group-hover:underline">{new Date(group.lastOutTs).toLocaleTimeString()}</div>
                            {group.lastOutLocation && (
                                <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                                    <MapPin size={10} /> Location
                                </div>
                            )}
                        </div>
                    ) : <span className="text-gray-400">-</span>}
                  </td>

                  <td className="p-4">
                    <span className="font-mono text-sm flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" /> {group.duration}
                    </span>
                  </td>

                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                        group.status === 'In Range' ? 'bg-green-100 text-green-800' : 
                        group.status === 'Out of Range' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {group.status}
                    </span>
                  </td>
                </tr>
            ))}
            {groupedLogs.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  No supervisor logs found matching your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceLogs;
