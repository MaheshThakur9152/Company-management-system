import React, { useState } from 'react';
import { User, Role } from './types';
import AdminWebApp from './web/App';
import { ShieldCheck, UserCircle, Key, Lock, LogIn, Mail } from 'lucide-react';
import { MOCK_SITES, getSites, loginUser, sendOtp, verifyOtp } from './services/mockData';
import { Site } from './types';

const getDeviceId = () => {
    let deviceId = localStorage.getItem('ambe_device_id');
    if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('ambe_device_id', deviceId);
    }
    return deviceId;
};

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
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [tempUserId, setTempUserId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const lowerUser = username.toLowerCase().trim();
    const cleanPass = password.trim();
    const deviceId = getDeviceId();

    try {
        if (showOtpInput) {
            // Verify OTP
            const apiUser = await verifyOtp(tempUserId, otp, deviceId);
            if (apiUser) {
                setUser(apiUser);
            }
        } else {
            // Initial Login
            const response = await loginUser(lowerUser, cleanPass, deviceId);
            
            if (response.requireOtp) {
                setShowOtpInput(true);
                setTempUserId(response.userId);
                setError(response.message || 'OTP sent to your registered email.');
            } else if (response.userId) {
                // Login Success
                setUser(response);
            } else {
                setError("Invalid credentials");
            }
        }
    } catch (err: any) {
        console.error("Login error", err);
        setError(err.message || "Login failed. Please check your credentials.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
    setOtp('');
    setShowOtpInput(false);
    setTempUserId('');
  };

  // Route based on role
  if (user) {
    switch (user.role) {
      case 'admin':
      case 'superadmin':
        return <AdminWebApp onExit={handleLogout} user={user} onUserUpdate={setUser} />;
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
               <div className={`text-sm p-3 rounded-lg border text-center ${error.includes('OTP sent') ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
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
                    onChange={(e) => {
                        setUsername(e.target.value);
                        if (e.target.value.toLowerCase() !== 'nandani') setShowOtpInput(false);
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    placeholder="e.g. minerva9, admin"
                    autoFocus
                    disabled={showOtpInput}
                 />
               </div>
             </div>

             {!showOtpInput ? (
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
             ) : (
                 <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-500 uppercase ml-1">One-Time Password (OTP)</label>
                   <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                     <input 
                        type="text" 
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="Enter 6-digit OTP"
                        maxLength={6}
                     />
                   </div>
                 </div>
             )}

             <button 
               type="submit"
               className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-teal-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30"
             >
               <LogIn size={20} /> {showOtpInput ? 'Verify & Login' : 'Sign In'}
             </button>
          </form>
        </div>
        
      </div>
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400">
            v2.4.1 • Multi-Site Management System
        </p>
        <p className="text-[10px] text-gray-300 mt-1">
            API: {import.meta.env.PROD ? 'Production' : 'Local'}
        </p>
      </div>
    </div>
  );
};

export default App;