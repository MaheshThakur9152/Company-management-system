import React, { useState } from 'react';
import { User, Role } from './types';
import SupervisorScreen from './screens/SupervisorScreen';
import AdminWebApp from './web/App';
import BossScreen from './screens/BossScreen';
import { ShieldCheck, UserCircle, Key, Lock, LogIn } from 'lucide-react';
import { MOCK_SITES, getSites } from './services/mockData';
import { Site } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sites, setSites] = useState<Site[]>(MOCK_SITES);

  React.useEffect(() => {
    const loadSites = async () => {
      try {
        const fetched = await getSites();
        setSites(fetched);
      } catch (e) {
        console.error("Failed to load sites", e);
      }
    };
    loadSites();
  }, []);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // --- CREDENTIAL MAPPING ---
    const lowerUser = username.toLowerCase().trim();
    const cleanPass = password.trim();

    // 1. Admin
    if (lowerUser === 'admin' && cleanPass === 'admin') {
      setUser({ userId: 'admin', name: 'Office Admin', email: 'admin@ambeservice.com', role: 'admin' });
      return;
    }

    // 2. Boss
    if (lowerUser === 'boss' && cleanPass === 'boss') {
      setUser({ userId: 'boss', name: 'Owner', email: 'boss@ambeservice.com', role: 'boss' });
      return;
    }

    // 3. Site Supervisors
    // Defined distinct credentials
    const siteConfig: Record<string, { id: string, pass: string }> = {
      'minerva9':   { id: 's1', pass: 'minerva123' },
      'minervaho':  { id: 's2', pass: 'minerva123' },
      'royal':      { id: 's3', pass: 'royal123' },
      'ceejay':     { id: 's4', pass: 'ceejay123' },
      'sanjay':     { id: 's5', pass: 'sanjay123' },
      'elara':      { id: 's6', pass: 'elara123' },
      'ajmera':     { id: 's7', pass: 'ajmera123' },
      'acme':       { id: 's8', pass: 'acme123' },
      'shreeya':    { id: 's9', pass: 'shreeya123' },
      'ambeoffice': { id: 's10', pass: 'ambe123' },
      'washroom':   { id: 's11', pass: 'washroom123' },
      'minlo':      { id: 's12', pass: 'minlo123' },
      'palacio':    { id: 's13', pass: 'palacio123' },
      'bpinfra':    { id: 's14', pass: 'bpinfra123' },
      'minsales':   { id: 's15', pass: 'minsales123' },
      'rounder':    { id: 's16', pass: 'rounder123' }
    };

    if (siteConfig[lowerUser]) {
      const config = siteConfig[lowerUser];
      if (cleanPass === config.pass) {
        const siteId = config.id;
        const siteName = sites.find(s => s.id === siteId)?.name || 'Unknown Site';
        
        setUser({
          userId: `sup-${siteId}`,
          name: `${siteName} Supervisor`,
          email: `${lowerUser}@ambeservice.com`,
          role: 'supervisor',
          assignedSites: [siteId]
        });
      } else {
        setError(`Invalid Password (Hint: ${config.pass})`);
      }
      return;
    }

    // 4. Nandani (Super Admin)
    if (lowerUser === 'nandani@ambeservice.com' || lowerUser === 'nandani') {
       if (cleanPass === 'nandani123' || cleanPass === 'admin') {
          setUser({ userId: 'nandani', name: 'Nandani', email: 'nandani@ambeservice.com', role: 'admin' });
          return;
       }
    }

    setError("Invalid Username or Password");
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
  };

  // Route based on role
  if (user) {
    switch (user.role) {
      case 'supervisor':
        return <SupervisorScreen 
                  onLogout={handleLogout} 
                  assignedSiteId={user.assignedSites?.[0] || ''} 
                />;
      case 'admin':
        return <AdminWebApp onExit={handleLogout} user={user} />;
      case 'boss':
        return <BossScreen onLogout={handleLogout} user={user} />;
      default:
        return <div>Unknown Role</div>;
    }
  }

  // Login Screen
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-primary p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-sm mb-4">
                <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Ambe Service Facility</h1>
            <p className="text-white/80 mt-2 text-sm">Secure Login Portal</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
             {error && (
               <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
                 {error}
               </div>
             )}

             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase ml-1">Username</label>
               <div className="relative">
                 <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                 <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="e.g. minerva9, admin"
                    autoFocus
                 />
               </div>
             </div>

             <div className="space-y-1">
               <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password</label>
               <div className="relative">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                 <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="Enter password"
                 />
               </div>
             </div>

             <button 
               type="submit"
               className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30"
             >
               <LogIn size={20} /> Sign In
             </button>
          </form>

          <div className="mt-8">
             <div className="text-xs text-center text-gray-400 mb-2">Login Credentials</div>
             <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100 text-left">
                <div className="col-span-2 border-b pb-1 mb-1 font-bold text-gray-700">Admins</div>
                <div>Admin: admin/admin</div>
                <div>Boss: boss/boss</div>
                <div className="col-span-2 text-purple-600 font-medium">Nandani: nandani/nandani123</div>
                
                <div className="col-span-2 border-b pb-1 mb-1 mt-2 font-bold text-gray-700">Site Supervisors</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 col-span-2">
                  <span>minerva9 / minerva123</span>
                  <span>minervaho / minerva123</span>
                  <span>royal / royal123</span>
                  <span>ceejay / ceejay123</span>
                  <span>sanjay / sanjay123</span>
                  <span>elara / elara123</span>
                  <span>ajmera / ajmera123</span>
                  <span>acme / acme123</span>
                  <span>shreeya / shreeya123</span>
                  <span>ambeoffice / ambe123</span>
                  <span>washroom / washroom123</span>
                  <span>minlo / minlo123</span>
                  <span>palacio / palacio123</span>
                  <span>bpinfra / bpinfra123</span>
                  <span>minsales / minsales123</span>
                  <span>rounder / rounder123</span>
                </div>
             </div>
          </div>
        </div>
        
      </div>
      <p className="mt-6 text-center text-xs text-gray-400">
            v2.3.0 • Multi-Site Management System
      </p>
    </div>
  );
};

export default App;