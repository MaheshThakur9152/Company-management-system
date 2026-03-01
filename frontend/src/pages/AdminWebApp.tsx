import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate, NavLink } from 'react-router-dom';
// Vercel deployment trigger: Fixed image loading error - Force Update
import {
    FileText, Users, Plus, LogOut, Menu, FileSpreadsheet, MoreHorizontal,
    Edit2, LayoutDashboard, CheckCircle, XCircle, Trash2,
    Search, CalendarDays, ShieldCheck, Download, Filter,
    CheckSquare, Square, MapPin, Briefcase, Phone, Mail,
    Save, X, RotateCcw, Receipt, Banknote, BookOpen, AlertTriangle, ChevronDown, Camera, UserCircle, UserPlus
} from 'lucide-react';

import { Invoice, Employee, AttendanceRecord, Site, AttendanceStatus, User, LocationLog } from '@types';
import {
    API_URL,
    getSharedAttendanceData, getInvoices,
    updateInvoice, getEmployees, addEmployee, updateEmployee,
    deleteEmployee, getSites, addSite, updateSite, deleteSite,
    addInvoice, updateAttendanceRecord, deleteAttendancePhoto, deleteAttendanceRecord,
    loginUser, verifyOtp, getUsers, addUser, deleteUser, revokeUserTrust, updateUser, getLocationLogs, revokeSupervisorDevice, deleteInvoice, getSalaryRecords
} from '@services/mockData';

import EditInvoiceModal from '@components/EditInvoiceModal';
import EditEmployeeModal from '@components/EditEmployeeModal';
import AddSiteModal from '@components/AddSiteModal';
import GenerateBillModal from '@components/GenerateBillModal';
import PayrollTab from '@components/PayrollTab';
import LedgerTab from '@components/LedgerTab';
import QuickDeductionsModal from '@components/QuickDeductionsModal';
import AttendanceLogs from '@components/AttendanceLogs';
import { generateBillExcel, ensureExcelJSLoaded } from '@utils/excelGenerator';
import '@utils/excelExportBrowser.js'; // Import for side effects (window.generateAttendanceExcelBrowser)
import { loadScript } from '@utils/scriptLoader';
import { isEmployeeActiveForMonth } from '@utils/employeeUtils';

// Access global variables safely
const getDeviceId = () => {
    let deviceId = localStorage.getItem('ambe_device_id');
    if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('ambe_device_id', deviceId);
    }
    return deviceId;
};

const PLACEHOLDER_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAJ0lEQVR4nO3MMQ0AAAgDMOFf6Bzu6QAJ6aeT5F3b7fF4PB6Px+PxeDweH00D83f1HwAAAABJRU5ErkJggg==';

// Helper to generate initials avatar on the fly
const getInitialsAvatar = (name: string) => {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    
    // Generate a consistent color based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    
    return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="hsl(${hue}, 70%, 40%)"/>
            <text x="50" y="50" dy=".35em" fill="white" font-family="Arial, sans-serif" font-size="40" font-weight="bold" text-anchor="middle">${initials}</text>
        </svg>
    `)}`;
};

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    // Keep placeholder for generic errors if no name data attribute found
    const name = target.getAttribute('data-name');
    if (name) {
        target.src = getInitialsAvatar(name);
    } else {
        target.src = PLACEHOLDER_IMAGE;
    }
};

// Cache helpers for stable data
const getCachedData = (key: string) => {
    try {
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            // Cache for 5 minutes
            if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
                return parsed.data;
            }
        }
    } catch (e) {
        console.error('Cache read error:', e);
    }
    return null;
};

const setCachedData = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify({ data, timestamp: Date.now() }));
    } catch (e) {
        console.error('Cache write error:', e);
    }
};

const getSafePhotoUrl = (url: string | undefined | null) => {
    if (!url || url === 'undefined' || url === 'null') return ''; // Return empty string to trigger fallback
    const trimmedUrl = url.trim();
    if (trimmedUrl.startsWith('http') || trimmedUrl.startsWith('data:')) {
        // If it's a Cloudinary URL, add optimization parameters
        if (trimmedUrl.includes('cloudinary.com') && trimmedUrl.includes('/image/upload/')) {
            return trimmedUrl.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
        }
        return trimmedUrl;
    }

    // It's a public_id, construct direct Cloudinary URL with optimization
    const cloudName = 'di9eeahdy'; // From backend config
    return `https://res.cloudinary.com/${cloudName}/image/upload/f_auto,q_auto/${trimmedUrl}`;
};

const extractCloudinaryPublicId = (url: string | undefined | null) => {
    if (!url) return '';
    // If it's a full Cloudinary URL
    if (url.includes('cloudinary.com')) {
        try {
            // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
            const parts = url.split('/');
            const uploadIndex = parts.indexOf('upload');
            if (uploadIndex !== -1 && uploadIndex + 2 < parts.length) {
                // Get everything after 'upload/v{version}/'
                const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
                // Remove file extension
                return publicIdWithExt.replace(/\.[^/.]+$/, '');
            }
        } catch (error) {
            console.error('Error extracting public ID:', error);
        }
    }
    // If it's not a URL and not base64, assume it's already a public_id
    if (!url.startsWith('http') && !url.startsWith('data:')) {
        return url;
    }
    return '';
};

const getExcelJS = async () => {
    return await ensureExcelJSLoaded();
};

const getJSPDF = async () => {
    if ((window as any).jspdf) return (window as any).jspdf;
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/4.1.0/jspdf.umd.min.js');
    return (window as any).jspdf;
};

const getSaveAs = async () => {
    if ((window as any).saveAs) return (window as any).saveAs;
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js');
    return (window as any).saveAs;
};

interface AdminWebAppProps {
    onExit?: () => void;
    user?: User; // Accepts authenticated user from parent App
    onUserUpdate?: (user: User) => void;
}

const AdminWebApp = ({ onExit, user, onUserUpdate }: AdminWebAppProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    // If user is provided via props (Integrated mode), consider them authenticated.
    // Otherwise default to false (Standalone mode).
    const [isAuthenticated, setIsAuthenticated] = useState(!!user);
    const [userRole, setUserRole] = useState<'Admin' | 'SuperAdmin'>(
        (user?.role === 'boss' || user?.role === 'superadmin' || user?.email === 'nandani@ambeservice.com' || user?.email === 'ambeservices.nandani@gmail.com') ? 'SuperAdmin' : 'Admin'
    );

    const allowedTabs = ['invoices-tax', 'invoices-proforma', 'employees', 'attendance', 'logs', 'sites', 'payroll', 'ledger', 'users', 'photos', 'supervisor-logs', 'device-history'] as const;

    const activeTab = useMemo(() => {
        const path = location.pathname.replace(/^\//, '');
        if (path && (allowedTabs as readonly string[]).includes(path)) return path as typeof allowedTabs[number];
        return 'invoices-tax' as const;
    }, [location.pathname]);

    const setActiveTabAndHash = (tab: typeof allowedTabs[number]) => {
        if (!(allowedTabs as readonly string[]).includes(tab)) return;
        navigate(`/${tab}`);
    };

    // Redirect to default tab if at root
    useEffect(() => {
        if (location.pathname === '/') {
            navigate('/invoices-tax', { replace: true });
        }
    }, [location.pathname, navigate]);

    // Filter & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSiteFilter, setSelectedSiteFilter] = useState<string>(() => localStorage.getItem('selectedSiteFilter') || 'all');
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');

    useEffect(() => {
        localStorage.setItem('admin_active_tab', activeTab);
    }, [activeTab]);

    const [invoicesExpanded, setInvoicesExpanded] = useState(true);
    const [officeEmployeeExpanded, setOfficeEmployeeExpanded] = useState(false);
    const [ledgerType, setLedgerType] = useState<'client' | 'employee' | 'expense'>('client');

    // Data State
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [sites, setSites] = useState<Site[]>([]);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const socketRef = useRef<any>(null);
    const [lastAttendanceUpdate, setLastAttendanceUpdate] = useState<string | null>(null);
    const attendanceByEmployee = useMemo(() => {
        const m: Map<string, Map<string, AttendanceRecord>> = new Map();
        for (const r of attendanceData) {
            if (!r || !r.employeeId || !r.date) continue;
            let emap = m.get(r.employeeId);
            if (!emap) {
                emap = new Map();
                m.set(r.employeeId, emap);
            }
            emap.set(r.date, r);
        }
        return m;
    }, [attendanceData]);

    // Windowed rendering to improve performance for large employee lists
    const [visibleRows, setVisibleRows] = useState<number>(150);
    const tableContainerRef = useRef<HTMLDivElement | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

    useEffect(() => {
        if (!lastAttendanceUpdate) return;
        const updateElapsed = () => {
            const secs = Math.floor((Date.now() - new Date(lastAttendanceUpdate).getTime()) / 1000);
            setElapsedSeconds(secs);
        };
        updateElapsed();
        const t = setInterval(updateElapsed, 1000);
        return () => clearInterval(t);
    }, [lastAttendanceUpdate]);

    useEffect(() => {
        // Reset visible rows when data or site changes to avoid showing stale windows
        setVisibleRows(150);
    }, [attendanceData, selectedSiteFilter]);

    const [users, setUsers] = useState<any[]>([]); // Admin Users
    const [locationLogs, setLocationLogs] = useState<LocationLog[]>([]);

    // Loading States
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [loadingInvoices, setLoadingInvoices] = useState(false);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [otpRequired, setOtpRequired] = useState(false);
    const [otp, setOtp] = useState('');
    const [tempUserId, setTempUserId] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Modals
    const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [showEmployeeModal, setShowEmployeeModal] = useState(false);

    const [editingSite, setEditingSite] = useState<Site | null>(null);
    const [showSiteModal, setShowSiteModal] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    // Quick Deductions Modal
    const [showDeductionModal, setShowDeductionModal] = useState(false);
    const [deductionEmployee, setDeductionEmployee] = useState<Employee | null>(null);

    // Attendance Manual Edit Modal
    const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState<{
        empId: string;
        empName: string;
        date: string;
        currentStatus: AttendanceStatus | null;
        photoUrl?: string | null;
        timestamp?: string;
        location?: { lat: number; lng: number };
        checkInTime?: string;
    } | null>(null);

    const [showAutoInvoiceDropdown, setShowAutoInvoiceDropdown] = useState(false);
    const [showPhotoGallery, setShowPhotoGallery] = useState(false);
    const [showSmallMenu, setShowSmallMenu] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem('selectedSiteFilter', selectedSiteFilter);
    }, [selectedSiteFilter]);

    // Invoice Filters
    const [invFilterMonth, setInvFilterMonth] = useState<string>('all');
    const [invFilterYear, setInvFilterYear] = useState<number>(new Date().getFullYear());
    const [invFilterSite, setInvFilterSite] = useState<string>('all');
    const [invFilterStatus, setInvFilterStatus] = useState<string>('all');

    // Supervisor Logs Summary State
    const [selectedSupervisorLog, setSelectedSupervisorLog] = useState<{
        date: string;
        supervisorName: string;
        logs: LocationLog[];
    } | null>(null);

    // Socket.IO Support
    const getSocket = async () => {
        if ((window as any).io) return (window as any).io;
        await loadScript('https://cdn.socket.io/4.7.2/socket.io.min.js');
        return (window as any).io;
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        const loadData = async () => {
            // Load cached data first for instant UI
            const cachedEmp = getCachedData('employees');
            const cachedSites = getCachedData('sites');
            if (cachedEmp && Array.isArray(cachedEmp)) setEmployees(cachedEmp);
            if (cachedSites && Array.isArray(cachedSites)) setSites(cachedSites);

            // Always load essential data
            const [emp, sts] = await Promise.all([
                getEmployees(),
                getSites()
            ]);

            setEmployees(emp);
            setSites(sts);
            setCachedData('employees', emp);
            setCachedData('sites', sts);
        };
        loadData();
        const interval = setInterval(loadData, 60000);

        // Initialize Socket
        let isMounted = true;

        const initSocket = async () => {
            try {
                const io = await getSocket();
                if (!isMounted) return;

                // Determine backend origin from configured API_URL (strip trailing '/api') or fall back to origin/localhost
                const backendUrl = (function () {
                    try {
                        // If API_URL is absolute (e.g. https://api.ambeservice.com/api) use it without the '/api' suffix
                        if (API_URL && API_URL.startsWith('http')) return API_URL.replace(/\/api\/?$/, '');
                        // Local dev
                        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return 'http://localhost:3002';
                        // If API_URL is relative (/api) assume same origin as the page
                        if (API_URL && API_URL.startsWith('/')) return window.location.origin;
                        return window.location.origin;
                    } catch (e) { return window.location.origin; }
                })();

                const socket = io(backendUrl, {
                    // Prefer polling first so that environments that block raw websocket upgrades can still work
                    transports: ['polling', 'websocket'],
                    reconnectionDelay: 5000,
                    withCredentials: true
                });

                socket.on('connect_error', (err: any) => {
                    console.error('Socket connect_error:', err);
                });
                socket.on('connect', () => console.debug('Socket connected to', backendUrl));

                socketRef.current = socket;

                // Join appropriate rooms on connect
                socket.on('connect', () => {
                    if (!isMounted) return;
                    if (selectedSiteFilter === 'all') {
                        sites.forEach(s => socket.emit('join_site', s.id));
                    } else {
                        if (selectedSiteFilter) socket.emit('join_site', selectedSiteFilter);
                    }
                });

                socket.on('data_update', (data: { type: string }) => {
                    if (!isMounted) return;
                    if (data.type === 'employees') getEmployees().then(setEmployees);
                    if (data.type === 'sites') getSites().then(setSites);
                    if (data.type === 'invoices') getInvoices().then(setInvoices).catch(err => console.error('Failed to refresh invoices on data_update', err));
                });

                // Real-time attendance updates
                socket.on('attendance_update', (payload: any) => {
                    if (!isMounted) return;
                    try {
                        const n = (payload && Array.isArray(payload.records) && payload.records.length) || (payload && payload.count) || 0;
                        if (payload && Array.isArray(payload.records) && payload.records.length > 0) {
                            setAttendanceData(prev => {
                                const map = new Map(prev.map(r => [`${r.employeeId}|${r.date}`, r]));
                                for (const rec of payload.records) {
                                    const key = `${rec.employeeId}|${rec.date}`;
                                    const existing = map.get(key);

                                    // Prefer the newer record based on updatedAt -> timestamp
                                    const recTime = rec && (rec.updatedAt ? new Date(rec.updatedAt).getTime() : (rec.timestamp ? new Date(rec.timestamp).getTime() : null));
                                    const existingTime = existing && (existing.updatedAt ? new Date(existing.updatedAt).getTime() : (existing.timestamp ? new Date(existing.timestamp).getTime() : null));

                                    // Merge rules:
                                    // - If no existing record, accept incoming
                                    // - If incoming has a time and existing has a time, keep the newer
                                    // - If incoming has time but existing doesn't, accept incoming
                                    // - If incoming lacks time, do NOT overwrite existing (conservative)
                                    if (!existing) {
                                        map.set(key, rec);
                                    } else if (recTime != null && existingTime != null) {
                                        if (recTime >= existingTime) map.set(key, rec);
                                    } else if (recTime != null && existingTime == null) {
                                        map.set(key, rec);
                                    } else {
                                        // incoming has no timestamp - skip to avoid overwriting newer data
                                    }
                                }
                                const merged = Array.from(map.values());
                                setCachedData('attendance', merged);
                                return merged;
                            });
                            setLastAttendanceUpdate(new Date().toISOString());
                        } else if (payload && payload.count && payload.count > 0) {
                            // fallback: lightweight refresh if only count provided
                            getSharedAttendanceData().then(att => { setAttendanceData(att); setCachedData('attendance', att); setLastAttendanceUpdate(new Date().toISOString()); }).catch(err => console.error(err));
                        } else if (payload && payload.deleted) {
                            // Remove deleted record
                            setAttendanceData(prev => {
                                const filtered = prev.filter(r => !(r.employeeId === payload.deleted.employeeId && r.date === payload.deleted.date));
                                setCachedData('attendance', filtered);
                                return filtered;
                            });
                            setLastAttendanceUpdate(new Date().toISOString());
                        }

                        if (n > 0) {
                            setToastMessage(`${n} new attendance`);
                            setTimeout(() => setToastMessage(null), 3000);
                        }
                    } catch (err) {
                        console.error('Error applying attendance_update:', err);
                    }
                });

            } catch (e) {
                console.error("Socket connection failed", e);
            }
        };
        initSocket();

        return () => {
            isMounted = false;
            clearInterval(interval);
            if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }
        };
    }, [isAuthenticated, userRole]);

    // Re-join site rooms whenever selected site or sites list change
    useEffect(() => {
        if (!socketRef.current || !socketRef.current.connected) return;
        try {
            if (selectedSiteFilter === 'all') {
                sites.forEach(s => socketRef.current.emit('join_site', s.id));
            } else {
                if (selectedSiteFilter) socketRef.current.emit('join_site', selectedSiteFilter);
            }
        } catch (err) { console.error('Socket join error:', err); }
    }, [selectedSiteFilter, sites]);

    // Lazy load data based on active tab
    useEffect(() => {
        if (!isAuthenticated) return;

        const loadTabData = async () => {
            try {
                if (activeTab === 'attendance' && attendanceData.length === 0) {
                    const cachedAtt = getCachedData('attendance');
                    if (cachedAtt && Array.isArray(cachedAtt)) setAttendanceData(cachedAtt);
                    setLoadingAttendance(true);
                    const att = await getSharedAttendanceData();
                    setAttendanceData(att);
                    setCachedData('attendance', att);
                    setLastAttendanceUpdate(new Date().toISOString());
                } else if ((activeTab === 'invoices-tax' || activeTab === 'invoices-proforma') && invoices.length === 0) {
                    setLoadingInvoices(true);
                    const cachedInv = getCachedData('invoices');
                    if (cachedInv && Array.isArray(cachedInv)) {
                        setInvoices(cachedInv);
                    }
                    const inv = await getInvoices();
                    setInvoices(inv);
                    setCachedData('invoices', inv);
                } else if (activeTab === 'logs' && locationLogs.length === 0) {
                    setLoadingLogs(true);
                    const loc = await getLocationLogs();
                    setLocationLogs(loc);
                } else if (activeTab === 'users' && userRole === 'SuperAdmin' && users.length === 0) {
                    setLoadingUsers(true);
                    const usrs = await getUsers();
                    setUsers(usrs);
                }
            } catch (error) {
                console.error('Error loading tab data:', error);
            } finally {
                setLoadingAttendance(false);
                setLoadingInvoices(false);
                setLoadingLogs(false);
                setLoadingUsers(false);
            }
        };

        loadTabData();
    }, [isAuthenticated, activeTab, userRole]);

    const handleDeletePhoto = async (empId: string, date: string) => {
        if (!confirm("Are you sure you want to delete this photo?")) return;
        await deleteAttendancePhoto(empId, date);
        setAttendanceData(await getSharedAttendanceData());
        // If modal is open, update it
        if (selectedAttendance && selectedAttendance.empId === empId && selectedAttendance.date === date) {
            setSelectedAttendance(prev => prev ? { ...prev, photoUrl: null } : null);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setIsLoading(true);

        try {
            const deviceId = getDeviceId();
            const response = await loginUser(loginEmail, loginPassword, deviceId);

            if (response.requireOtp) {
                setOtpRequired(true);
                setTempUserId(response.userId);
                alert(response.message || "OTP sent to your email.");
            } else {
                // Login Success
                completeLogin(response);
            }
        } catch (err: any) {
            setLoginError(err.message || "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setIsLoading(true);
        try {
            const deviceId = getDeviceId();
            const response = await verifyOtp(tempUserId, otp, deviceId);
            completeLogin(response);
        } catch (err: any) {
            setLoginError(err.message || "Invalid OTP");
        } finally {
            setIsLoading(false);
        }
    };

    const completeLogin = (userData: any) => {
        if (userData.role === 'superadmin' || userData.email === 'nandani@ambeservice.com' || userData.email === 'ambeservices.nandani@gmail.com') {
            setUserRole('SuperAdmin');
        } else {
            setUserRole('Admin');
        }
        setIsAuthenticated(true);
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setOtpRequired(false);
        setOtp('');
        setLoginPassword('');
        if (onExit) onExit();
    };

    // User Management
    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as any;

        // Handle Image
        let photoUrl = '';
        const fileInput = form.photo as HTMLInputElement;
        if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            photoUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
        }

        const newUser = {
            userId: form.userId.value,
            name: form.name.value,
            email: form.email.value,
            password: form.password.value || '',
            role: 'admin',
            photoUrl: photoUrl
        };

        await addUser(newUser);
        setUsers(await getUsers());
        setShowAddUserModal(false);
        alert('Admin added successfully. Please ensure a secure password is set for the account.');
    };

    const handleRevokeTrust = async (userId: string) => {
        if (!confirm("Are you sure? This will log the user out from all trusted devices.")) return;
        await revokeUserTrust(userId);
        alert("User trust revoked. They will need OTP to login next time.");
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Delete this admin user?")) return;
        await deleteUser(userId);
        setUsers(await getUsers());
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const form = e.target as any;
        const newUserId = form.userId.value;
        const newName = form.name.value;
        const newPassword = form.password.value;
        const confirmPassword = form.confirmPassword.value;

        if (newPassword && newPassword !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        const updates: any = {
            userId: newUserId,
            name: newName
        };
        if (newPassword) updates.password = newPassword;

        try {
            const updatedUser = await updateUser(user.userId, updates);
            if (onUserUpdate) onUserUpdate(updatedUser);
            setShowProfileModal(false);
            alert("Profile updated successfully!");

            // If userId changed, we might need to re-login or just accept it.
            // Since we updated the parent state, it should be fine.
        } catch (err: any) {
            alert("Failed to update profile: " + err.message);
        }
    };

    const processLocationLogs = (logs: LocationLog[]) => {
        const groups: Record<string, {
            id: string;
            date: string;
            supervisorName: string;
            siteName: string;
            firstInTs: number;
            firstInLocation?: { latitude: number; longitude: number };
            lastOutTs: number;
            lastOutLocation?: { latitude: number; longitude: number };
            allLogs: LocationLog[];
        }> = {};

        logs.forEach(log => {
            const d = new Date(log.timestamp);
            const dateKey = d.toLocaleDateString();
            const key = `${log.supervisorName}-${dateKey}`;

            // Resolve Site Name from ID if available
            const site = sites.find(s => s.id === log.siteId);
            const siteName = site ? site.name : (log.siteName || 'Unknown Site');

            if (!groups[key]) {
                groups[key] = {
                    id: key,
                    date: dateKey,
                    supervisorName: log.supervisorName || 'Unknown Supervisor',
                    siteName: siteName,
                    firstInTs: 0,
                    lastOutTs: 0,
                    allLogs: []
                };
            }

            groups[key].allLogs.push(log);
            const ts = d.getTime();

            const status = (log.status || '').trim();

            if (status === 'In Range' || status === 'In-Range') {
                if (groups[key].firstInTs === 0 || ts < groups[key].firstInTs) {
                    groups[key].firstInTs = ts;
                    groups[key].firstInLocation = log.location;
                }
            } else if (status === 'Out of Range' || status === 'Out-Of-Range') {
                if (ts > groups[key].lastOutTs) {
                    groups[key].lastOutTs = ts;
                    groups[key].lastOutLocation = log.location;
                }
            }
        });

        return Object.values(groups).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    // --- Logic Handlers ---
    const handleCreateInvoice = () => {
        const newInvoice: Invoice = {
            id: Date.now().toString(),
            invoiceNo: `ASF/P/${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}/${(invoices.length + 1).toString().padStart(3, '0')}`,
            siteId: '',
            siteName: 'New Project',
            billingPeriod: `${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
            items: [],
            subTotal: 0,
            cgst: 0,
            sgst: 0,
            amount: 0,
            status: 'Unpaid',
            dueDate: '',
            generatedDate: new Date().toISOString().split('T')[0],
            managementRate: 7,
            materialCharges: 0
        };
        setEditingInvoice(newInvoice);
        setShowInvoiceModal(true);
    };

    const handleSaveInvoice = async (invoice: Invoice) => {
        const exists = invoices.find(i => i.id === invoice.id);
        if (exists) await updateInvoice(invoice);
        else await addInvoice(invoice);
        setInvoices(await getInvoices());
        setShowInvoiceModal(false);
        setEditingInvoice(null);
    };

    const togglePaymentStatus = async (invoice: Invoice) => {
        // Admin Flow: Can only request to mark as Paid (Pending Payment)
        if (userRole === 'Admin') {
            if (invoice.status === 'Paid') {
                alert("Only Super Admin can revert a Paid invoice.");
                return;
            }
            if (invoice.status === 'Pending Payment') {
                alert("Payment approval is already pending.");
                return;
            }
            if (!confirm("Mark this invoice as Paid? This will require approval from Nandani.")) return;

            const updated = { ...invoice, status: 'Pending Payment' } as Invoice;
            await updateInvoice(updated);
            setInvoices(await getInvoices());
            return;
        }

        // Super Admin Flow
        if (invoice.status === 'Pending Payment') {
            if (confirm("Approve this payment?")) {
                const updated = {
                    ...invoice,
                    status: 'Paid',
                    paymentDate: new Date().toISOString().split('T')[0]
                } as Invoice;
                await updateInvoice(updated);
            }
        } else {
            // Standard toggle for Super Admin
            const isPaying = invoice.status !== 'Paid';
            const updated = {
                ...invoice,
                status: isPaying ? 'Paid' : 'Unpaid',
                paymentDate: isPaying ? new Date().toISOString().split('T')[0] : undefined
            } as Invoice;
            await updateInvoice(updated);
        }
        setInvoices(await getInvoices());
    };

    const handleApproveInvoice = async (invoice: Invoice) => {
        if (userRole === 'Admin') {
            if (!confirm("Submit this Proforma Invoice for approval by Nandani?")) return;
            const updatedProforma: Invoice = { ...invoice, status: 'Pending Approval' };
            await updateInvoice(updatedProforma);
            setInvoices(await getInvoices());
            alert("Invoice submitted for approval.");
            return;
        }

        // SuperAdmin (Nandani) Flow
        if (!confirm("Are you sure you want to approve this Proforma Invoice and convert it to a Tax Invoice?")) return;

        // 1. Update the Proforma Invoice status to 'Approved'
        const updatedProforma: Invoice = {
            ...invoice,
            status: 'Approved'
        };
        await updateInvoice(updatedProforma);

        // 2. Create a new Tax Invoice
        // Generate new Tax Invoice Number
        // Format: INV/YYYY/MM/SITE_ID
        const d = new Date();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const siteIdSuffix = invoice.siteId ? invoice.siteId.substring(1) : '000';

        const newInvoiceNo = `INV/${year}/${month}/${siteIdSuffix}`;

        // Create new invoice object
        const newTaxInvoice: Invoice = {
            ...invoice,
            id: Date.now().toString() + Math.random(), // New ID
            invoiceNo: newInvoiceNo,
            status: 'Unpaid', // Reset to Unpaid as it is a new Tax Invoice
            generatedDate: new Date().toISOString().split('T')[0] // Update date to today
        };

        await addInvoice(newTaxInvoice);
        setInvoices(await getInvoices());
        alert(`Invoice approved. Proforma marked as Approved.\nNew Tax Invoice created: ${newInvoiceNo}`);
        setActiveTabAndHash('invoices-tax'); // Switch to Tax Invoices tab
    };

    const handleDeleteInvoice = async (invoice: Invoice) => {
        if (userRole !== 'SuperAdmin') {
            alert("Only Super Admin can delete invoices.");
            return;
        }

        if (!confirm(`Are you sure you want to permanently delete invoice ${invoice.invoiceNo}? This action cannot be undone.`)) return;

        const success = await deleteInvoice(invoice.id);
        if (success) {
            setInvoices(await getInvoices());
            alert("Invoice deleted successfully.");
        } else {
            alert("Failed to delete invoice.");
        }
    };

    const handleSaveEmployee = async (emp: Employee) => {
        const employeeToSave = { ...emp };
        // Direct creation for Admin
        if (!editingEmployee && !employeeToSave.status) {
            employeeToSave.status = 'Active';
        }

        if (editingEmployee) await updateEmployee(employeeToSave); else await addEmployee(employeeToSave);
        setEmployees(await getEmployees()); setShowEmployeeModal(false); setEditingEmployee(null);
    };

    const handleApproveEmployee = async (emp: Employee) => {
        if (!confirm(`Approve employee ${emp.name}?`)) return;
        const updated = { ...emp, status: 'Active' } as Employee;
        await updateEmployee(updated);
        setEmployees(await getEmployees());
    };

    const handleDeleteEmployee = async (id: string) => {
        if (confirm("Delete employee?")) { await deleteEmployee(id); setEmployees(await getEmployees()); }
    };

    const handleSaveSite = async (site: Site) => {
        const siteToSave = { ...site };
        // Direct creation for Admin
        if (!editingSite && !siteToSave.status) {
            siteToSave.status = 'Active';
        }

        if (editingSite) await updateSite(siteToSave); else await addSite(siteToSave);
        setSites(await getSites()); setShowSiteModal(false); setEditingSite(null);
    };

    const handleApproveSite = async (site: Site) => {
        if (!confirm(`Approve site ${site.name}?`)) return;
        const updated = { ...site, status: 'Active' } as Site;
        await updateSite(updated);
        setSites(await getSites());
    };

    const handleDeleteSite = async (id: string) => {
        if (confirm("Delete site?")) { await deleteSite(id); setSites(await getSites()); }
    };

    const handleRestoreEmployee = async (emp: Employee) => {
        if (confirm(`Restore employee ${emp.name}?`)) {
            const updated = { ...emp, status: 'Active' } as Employee;
            await updateEmployee(updated);
            setEmployees(await getEmployees());
        }
    };

    const handleRestoreSite = async (site: Site) => {
        if (confirm(`Restore site ${site.name}?`)) {
            const updated = { ...site, status: 'Active' } as Site;
            await updateSite(updated);
            setSites(await getSites());
        }
    };

    const handleSaveDeductions = async (updatedEmp: Employee) => {
        await updateEmployee(updatedEmp);
        setEmployees(await getEmployees());
        setShowDeductionModal(false);
        setDeductionEmployee(null);
    };

    const handleAutoGenerateInvoices = async (type: 'Tax' | 'Proforma' = 'Tax') => {
        // Determine which sites to process
        const sitesToProcess = selectedSiteFilter === 'all'
            ? sites
            : sites.filter(s => s.id === selectedSiteFilter);

        if (sitesToProcess.length === 0) {
            alert("No sites selected or available.");
            return;
        }

        // Compute expanded billing period early so the confirmation dialog shows exact range
        const daysInMonthPreview = new Date(selectedYear, selectedMonth, 0).getDate();
        const monthFullPreview = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
        const targetBillingPeriodPreview = `1st to ${daysInMonthPreview} ${monthFullPreview} ${selectedYear}`;

        // Fix: Define missing variables used in generation loop
        const daysInMonth = daysInMonthPreview;
        const targetBillingPeriod = targetBillingPeriodPreview;
        const shortMonth = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'short' });
        const targetBillingPeriodShort = `1st to ${daysInMonth} ${shortMonth} ${selectedYear}`;

        const confirmMessage = selectedSiteFilter === 'all'
            ? `Are you sure you want to generate ${type} invoices for ALL sites for ${targetBillingPeriodPreview}?`
            : `Are you sure you want to generate a ${type} invoice for ${sitesToProcess[0].name} for ${targetBillingPeriodPreview}?`;

        if (!confirm(confirmMessage)) return;

        // Ensure we have the latest invoices to avoid duplicates
        let currentInvoices = invoices;
        if (currentInvoices.length === 0) {
            try {
                currentInvoices = await getInvoices();
                setInvoices(currentInvoices);
            } catch (e) {
                console.error("Failed to fetch invoices before generation", e);
            }
        }

        let generatedCount = 0;
        const generatedSites: string[] = [];
        const skippedSites: string[] = [];
        const noAttendanceSites: string[] = [];
        const failedSites: { site: string; error: string }[] = [];
        const invoicePrefix = type === 'Proforma' ? 'PI' : 'INV';

        for (const site of sitesToProcess) {
            // Check if invoice of SAME TYPE already exists for this site and period
            const existingInvoice = currentInvoices.find(inv =>
                inv.siteId === site.id &&
                (inv.billingPeriod === targetBillingPeriod || inv.billingPeriod === targetBillingPeriodShort) &&
                inv.invoiceNo.startsWith(invoicePrefix)
            );

            if (existingInvoice) {
                skippedSites.push(site.name);
                continue;
            }

            // Deduplicate and filter site employees
            const seenSite = new Set<string>();
            const siteEmployees = employees.filter(e => {
                if (!e || !e.id) return false;
                if (seenSite.has(e.id)) return false; // dedupe
                if (e.siteId !== site.id) return false;

                // Filter out deleted/stopped employees
                if (e.status === 'Deleted' || e.status === 'Stopped') return false;

                // Filter out inactive employees who left before the selected month
                if (e.status === 'Inactive' && e.leavingDate) {
                    const leavingDate = new Date(e.leavingDate);
                    const reportMonthStart = new Date(selectedYear, selectedMonth - 1, 1);
                    if (leavingDate < reportMonthStart) {
                        return false;
                    }
                }

                seenSite.add(e.id);
                return true;
            });
            if (siteEmployees.length === 0) {
                noAttendanceSites.push(site.name);
                continue;
            }

            // Check if there is any attendance for this site in this month
            const hasAttendance = attendanceData.some(r => {
                const d = new Date(r.date);
                return siteEmployees.some(e => e.id === r.employeeId) && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
            });

            if (!hasAttendance) {
                noAttendanceSites.push(site.name);
                continue;
            }

            // Add a small delay between generations to ensure browser doesn't block multiple downloads
            if (generatedCount > 0) {
                await new Promise(resolve => setTimeout(resolve, 800));
            }

            // Calculate Items
            const items: any[] = [];
            const roleGroups: Record<string, { count: number, days: number, amount: number }> = {};

            siteEmployees.forEach(emp => {
                const empRecords = attendanceData.filter(r => {
                    const d = new Date(r.date);
                    return r.employeeId === emp.id && d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
                });

                let paidDays = 0;
                empRecords.forEach(r => {
                    if (r.status === 'P' || r.status === 'W/O' || r.status === 'PH' || r.status === 'WOE' || r.status === 'WOP') paidDays += 1;
                    else if (r.status === 'HD' || r.status === 'HDE') paidDays += 0.5;
                });

                // Calculate Amount for this employee
                const baseSalary = emp.salaryDetails?.baseSalary || 0;
                const isDaily = emp.salaryDetails?.isDailyRated || false;

                let amount = 0;
                if (isDaily) {
                    amount = baseSalary * paidDays; // baseSalary is daily rate
                } else {
                    amount = (baseSalary / daysInMonth) * paidDays;
                }

                const role = emp.role || 'Staff';
                if (!roleGroups[role]) {
                    roleGroups[role] = { count: 0, days: 0, amount: 0 };
                }
                roleGroups[role].count += 1;
                roleGroups[role].days += paidDays;
                roleGroups[role].amount += amount;
            });

            Object.keys(roleGroups).forEach(role => {
                const group = roleGroups[role];

                let rate = 0;
                let amount = 0;

                // Use site billing rate if available (overrides salary-based calculation)
                if (site.billingRate && site.billingRate > 0) {
                    rate = site.billingRate;
                    // Amount = (Rate / DaysInMonth) * TotalPaidDays
                    amount = (rate / daysInMonth) * group.days;
                } else {
                    // Back-calculate rate from salary
                    amount = group.amount;
                    rate = group.days > 0 ? (group.amount * daysInMonth) / group.days : 0;
                }

                items.push({
                    id: Date.now().toString() + Math.random(),
                    description: `${role} Services`,
                    hsn: '9985',
                    rate: Math.round(rate),
                    days: group.days,
                    persons: group.count,
                    amount: amount
                });
            });

            const subTotal = items.reduce((sum, item) => sum + item.amount, 0);
            const managementRate = 10; // 10% default
            const managementAmount = subTotal * (managementRate / 100);
            const taxable = subTotal + managementAmount;
            const cgst = taxable * 0.09;
            const sgst = taxable * 0.09;
            const total = taxable + cgst + sgst;

            const prefix = type === 'Proforma' ? 'PI' : 'INV';
            const newInvoice: Invoice = {
                id: Date.now().toString() + Math.random(),
                invoiceNo: `${prefix}/${selectedYear}/${selectedMonth}/${site.id.substring(1)}`,
                siteId: site.id,
                siteName: site.name,
                billingPeriod: targetBillingPeriod,
                items: items,
                subTotal: subTotal,
                managementRate: managementRate,
                managementAmount: managementAmount,
                taxableAmount: taxable,
                cgst: cgst,
                sgst: sgst,
                amount: Math.round(total),
                status: 'Unpaid',
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days due
                generatedDate: new Date().toISOString().split('T')[0]
            };

            // Determine Company Name
            const companyName = site.companyName || ((
                site.name.toLowerCase().includes('ajmera') ||
                site.name.toLowerCase().includes('minerva ho') ||
                site.name.toLowerCase().includes('lift operator')
            ) ? 'AMBE SERVICE FACILITIES PRIVATE LIMITED' : 'AMBE SERVICE');

            // Persist invoice and handle failures
            try {
                await addInvoice(newInvoice);
                generatedCount++;
                generatedSites.push(site.name);
            } catch (err) {
                console.error(`Failed to save invoice for site ${site.name}:`, err);
                failedSites.push({ site: site.name, error: String(err && err.message ? err.message : err) });
            }
        }

        if (generatedCount > 0 || failedSites.length > 0) {
            setInvoices(await getInvoices());

            // Show success message and redirect
            let message = '';
            if (generatedCount > 0) message += `Successfully generated ${generatedCount} invoices. Please check the ${type === 'Proforma' ? 'Proforma' : 'Tax'} Invoices tab.`;
            if (failedSites.length > 0) {
                message += `\n\nFailed to persist for:\n${failedSites.map(f => `${f.site} - ${f.error}`).join('\n')}`;
            }

            alert(message);

            if (type === 'Proforma') setActiveTabAndHash('invoices-proforma');
            else setActiveTabAndHash('invoices-tax');
        } else {
            let message = "No invoices generated.\n";
            if (skippedSites.length > 0) {
                message += `\nAlready exists for:\n${skippedSites.join('\n')}`;
            }
            if (noAttendanceSites.length > 0) {
                message += `\nNo attendance data for:\n${noAttendanceSites.join('\n')}`;
            }
            alert(message);
        }
    };

    const handleCellClick = (emp: Employee, day: number) => {
        const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const record = attendanceByEmployee.get(emp.id)?.get(dateStr) || null;
        setSelectedAttendance({
            empId: emp.id,
            empName: emp.name,
            date: dateStr,
            currentStatus: record ? record.status : null,
            photoUrl: record?.photoUrl,
            timestamp: record?.timestamp,
            location: record?.location,
            checkInTime: record?.checkInTime
        });
        setAttendanceModalOpen(true);
    };

    const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
        try {
            const target = e.currentTarget;
            if (target.scrollHeight - target.scrollTop - target.clientHeight < 300) {
                setVisibleRows(v => Math.min(v + 150, filteredEmployees.length));
            }
        } catch (err) { console.error('Scroll handler error', err); }
    };

    const saveManualAttendance = async (status: AttendanceStatus | null) => {
        if (!selectedAttendance) return;

        // Close modal immediately for better UX
        setAttendanceModalOpen(false);

        // Store previous state for rollback
        const previousData = [...attendanceData];

        // Optimistic update
        setAttendanceData(prev => {
            const newData = prev.filter(r => !(r.employeeId === selectedAttendance.empId && r.date === selectedAttendance.date));

            if (status !== null) {
                newData.push({
                    id: Date.now().toString(),
                    employeeId: selectedAttendance.empId,
                    date: selectedAttendance.date,
                    status: status,
                    checkInTime: selectedAttendance.checkInTime || 'Manual',
                    timestamp: selectedAttendance.timestamp || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    photoUrl: selectedAttendance.photoUrl,
                    location: selectedAttendance.location,
                    isSynced: true,
                    isLocked: true,
                    remarks: 'Added by Admin'
                });
            }
            return newData;
        });

        try {
            if (status === null) {
                const success = await deleteAttendanceRecord(selectedAttendance.empId, selectedAttendance.date);
                if (!success) {
                    console.warn("Delete call returned non-success, but may be already deleted");
                }
            } else {
                const record: AttendanceRecord = {
                    id: Date.now().toString(),
                    employeeId: selectedAttendance.empId,
                    date: selectedAttendance.date,
                    status: status,
                    checkInTime: selectedAttendance.checkInTime || 'Manual',
                    timestamp: selectedAttendance.timestamp || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    photoUrl: selectedAttendance.photoUrl,
                    location: selectedAttendance.location,
                    isSynced: true,
                    isLocked: true,
                    remarks: 'Added by Admin'
                };

                // Wait for the backend to confirm before we trust the state.
                const success = await updateAttendanceRecord(record);
                if (!success) throw new Error("Update failed on server");

                // Removed aggressive full re-fetch to avoid race conditions/stale cache.
                // We trust the optimistic update + the socket event that will follow.
            }
        } catch (err) {
            console.error("Failed to save manual attendance", err);
            alert("Failed to update attendance. Reverting changes.");
            setAttendanceData(previousData);
        }
    };

    // --- EXCEL GENERATION FOR SINGLE INVOICE ---
    const downloadInvoiceExcel = async (invoice: Invoice) => {
        // Prefer server-backed, template-preserving download to avoid malformed files
        try {
            const resp = await fetch(`${API_URL}/invoices/${encodeURIComponent(invoice.id)}/download`, { credentials: 'include' });
            if (!resp.ok) {
                const text = await resp.text();
                throw new Error(`Server download failed: ${resp.status} ${text}`);
            }
            const blob = await resp.blob();
            const saveAs = await getSaveAs();
            const filename = `${(invoice.invoiceNo || invoice.id).replace(/\//g, '-').replace(/[^a-zA-Z0-9_\-.]/g, '_')}.xlsx`;
            saveAs(blob, filename);
        } catch (serverErr) {
            console.error('Server download failed:', serverErr);
            alert(`Failed to download invoice from server: ${serverErr instanceof Error ? serverErr.message : String(serverErr)}`);
        }
    };

    // --- DOWNLOAD MULTI-INVOICE WORKBOOK ---
    const downloadInvoicesForSite = async (siteId: string, siteName: string) => {
        try {
            setLoadingInvoices(true);
            const resp = await fetch(`${API_URL}/invoices/export?siteId=${encodeURIComponent(siteId)}&month=${selectedMonth}&year=${selectedYear}`, { credentials: 'include' });
            if (!resp.ok) {
                let txt = await resp.text();
                try {
                    const parsed = JSON.parse(txt);
                    txt = parsed.msg || parsed.error || JSON.stringify(parsed);
                } catch (e) { /* not JSON, keep text */ }
                throw new Error(`Export failed: ${resp.status} ${txt}`);
            }
            const blob = await resp.blob();
            const saveAs = await getSaveAs();
            const fileName = `Invoices_${siteName.replace(/\s+/g, '_')}_${new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'short' })}_${selectedYear}.xlsx`;
            saveAs(blob, fileName);
            // Refresh invoices list so Proforma tab reflects newly generated entries
            try {
                setInvoices(await getInvoices());
            } catch (e) { console.warn('Failed to refresh invoices list after export', e); }
        } catch (e) {
            console.error('Download invoices failed', e);
            alert('Failed to download invoices: ' + (e && e.message ? e.message : String(e)));
        } finally {
            setLoadingInvoices(false);
        }
    };

    const handleViewScoreReport = () => {
        const reportData = filteredEmployees.map(emp => {
            const empAttendance = attendanceByEmployee.get(emp.id);
            const records: { date: string, status: string, score: number }[] = [];
            let totalScore = 0;

            if (empAttendance) {
                // Sort dates to ensure chronological order
                const sortedDates = Array.from(empAttendance.keys()).sort();

                for (const dateStr of sortedDates) {
                    const record = empAttendance.get(dateStr);
                    if (!record) continue;

                    const [rYear, rMonth, rDay] = dateStr.split('-').map(Number);

                    if (rMonth === selectedMonth && rYear === selectedYear) {
                        const dateObj = new Date(rYear, rMonth - 1, rDay);
                        const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon...

                        // Map week day string to index
                        const weekDayMap: Record<string, number> = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
                        const empWeekOffIdx = weekDayMap[emp.weeklyOff || 'Sunday'] ?? 0;
                        const isWeekOffDay = dayOfWeek === empWeekOffIdx;

                        let score = 0;
                        if (record.status === 'P') {
                            score = isWeekOffDay ? 2 : 1;
                        }
                        else if (record.status === 'A') score = 0;
                        else if (record.status === 'W/O') score = 1;
                        else if (record.status === 'WOP') score = 2;
                        else if (record.status === 'PH') score = 1;
                        else if (record.status === 'HD') score = 0.5;

                        // Only add to list if it has a relevant status or it affects score
                        if (record.status) {
                            totalScore += score;
                            records.push({
                                date: dateStr,
                                status: record.status,
                                score: score
                            });
                        }
                    }
                }
            }

            return {
                name: emp.name,
                code: emp.biometricCode,
                records,
                totalScore
            };
        }).filter(d => d.records.length > 0);

        // Generate HTML
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Attendance Score Report - ${selectedMonth}/${selectedYear}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; background-color: #f9fafb; color: #1f2937; }
                    .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    h1 { color: #3730a3; margin-bottom: 5px; }
                    h2 { color: #6b7280; font-weight: normal; margin-top: 0; margin-bottom: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 20px; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 0; font-size: 14px; }
                    th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; }
                    th { background-color: #f3f4f6; color: #374151; font-weight: 600; }
                    .emp-section { margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
                    .emp-header { background-color: #e0e7ff; padding: 12px 15px; font-weight: bold; color: #3730a3; display: flex; justify-content: space-between; align-items: center; }
                    .score-badge { background: #4f46e5; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.9em; }
                    .status-P { color: #166534; font-weight: 500; }
                    .status-A { color: #dc2626; font-weight: 500; }
                    .status-W-O { color: #d97706; font-weight: 500; }
                    .status-WOP { color: #7e22ce; font-weight: 500; }
                    .score-pos { color: #166534; }
                    .score-neg { color: #dc2626; }
                    .no-print { margin-bottom: 20px; text-align: right; }
                    button { background: #3730a3; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-family: inherit; }
                    button:hover { background: #4338ca; }
                    @media print {
                        .no-print { display: none; }
                        body { background: white; padding: 0; }
                        .container { box-shadow: none; padding: 0; }
                        .emp-section { break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="no-print">
                        <button onclick="window.print()">Print Report</button>
                    </div>
                    <h1>Attendance Score Report</h1>
                    <h2>Month: ${selectedMonth} / ${selectedYear}</h2>
                    
                    ${reportData.map(emp => `
                        <div class="emp-section">
                            <div class="emp-header">
                                <span>${emp.name} <span style="font-weight:normal; opacity:0.7">(${emp.code})</span></span>
                                <span class="score-badge">Score: ${emp.totalScore}</span>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th style="width: 120px">Date</th>
                                        <th>Status</th>
                                        <th style="width: 100px; text-align: right">Impact</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${emp.records.map(rec => `
                                        <tr>
                                            <td>${rec.date}</td>
                                            <td class="status-${rec.status.replace('/', '-')}">${rec.status}</td>
                                            <td style="text-align: right" class="${rec.score >= 0 ? 'score-pos' : 'score-neg'}">${rec.score > 0 ? '+' + rec.score : rec.score}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    `).join('')}
                    
                    ${reportData.length === 0 ? '<p style="text-align:center; color: #6b7280; padding: 20px;">No attendance records found for this selection.</p>' : ''}
                </div>
            </body>
            </html>
        `;

        const newWindow = window.open('', '_blank');
        if (newWindow) {
            newWindow.document.write(htmlContent);
            newWindow.document.close();
            newWindow.focus();
        }
    };

    // --- EXCEL GENERATION ---
    const downloadExcelReport = async () => {
        try {
            await getExcelJS();
            // Use the advanced ExcelJS implementation from utils/excelExportBrowser.js
            // This matches the exact format of Ambe-Bill.xlsx including colors, fonts, and formulas
            if ((window as any).generateAttendanceExcelBrowser) {
                // Filter employees first (exclude employees not active in selected month)
                const filteredEmployees = (selectedSiteFilter === 'all'
                    ? employees
                    : employees.filter(e => e.siteId === selectedSiteFilter))
                    .filter(e => isEmployeeActiveForMonth(e, selectedMonth, selectedYear));

                const filteredSites = selectedSiteFilter === 'all'
                    ? sites
                    : sites.filter(s => s.id === selectedSiteFilter);

                // Current month/year (Hardcoded to Nov 2025 as per context, but can be dynamic)
                await (window as any).generateAttendanceExcelBrowser(filteredEmployees, attendanceData, selectedMonth, selectedYear, filteredSites);
            } else {
                alert("Excel generation script not loaded. Please refresh.");
            }
        } catch (error) {
            console.error("Excel Export Error:", error);
            alert("Failed to generate Excel file. See console.");
        }
    };

    const handleExportPayroll = async (siteId: string) => {
        try {
            await getExcelJS();
            if ((window as any).generatePayrollExcel) {
                // Fetch latest salary records to reflect saved deductions/overrides
                const salaryRecords = await getSalaryRecords();

                const employeesToExport = (siteId === 'all'
                    ? employees
                    : employees.filter(e => e.siteId === siteId))
                    .filter(e => isEmployeeActiveForMonth(e, selectedMonth, selectedYear));

                await (window as any).generatePayrollExcel(employeesToExport, attendanceData, selectedMonth, selectedYear, sites, salaryRecords);
            } else {
                alert("Payroll script not loaded");
            }
        } catch (e) {
            console.error(e);
            alert("Export failed");
        }
    };

    // Filter Employees based on site selection and dedupe by id
    const filteredEmployees = useMemo(() => {
        // Deduplicate employees array by id (keep first occurrence)
        const seen = new Set<string>();
        const uniqueEmps: Employee[] = [];
        for (const e of employees) {
            if (!e || !e.id) continue;
            if (seen.has(e.id)) continue;
            seen.add(e.id);
            uniqueEmps.push(e);
        }

        return uniqueEmps.filter(e => {
            // Exclude deleted/stopped employees immediately
            if (e.status === 'Deleted' || e.status === 'Stopped') return false;

            const matchesSearch = (e.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (e.biometricCode || '').includes(searchTerm);
            const matchesSite = selectedSiteFilter === 'all' || e.siteId === selectedSiteFilter;
            const isVisible = isEmployeeActiveForMonth(e, selectedMonth, selectedYear);

            return matchesSearch && matchesSite && isVisible;
        }).sort((a, b) => {
            const shiftA = (a.shift || a.role || 'Unassigned').toUpperCase();
            const shiftB = (b.shift || b.role || 'Unassigned').toUpperCase();
            
            if (shiftA !== shiftB) return shiftA.localeCompare(shiftB);
            
            // Secondary sort by Role if Shift matches (or both are using Role as group)
            const roleA = (a.role || '').toUpperCase();
            const roleB = (b.role || '').toUpperCase();
            if (roleA !== roleB) return roleA.localeCompare(roleB);
            
            return (a.name || '').localeCompare(b.name || '');
        });
    }, [employees, searchTerm, selectedSiteFilter, selectedYear, selectedMonth]);

    // Modals
    const [showStatsModal, setShowStatsModal] = useState(false);

    // Summary Stats for the grid (Current View)
    const attendanceStats = useMemo(() => {
        let presentToday = 0;
        let absentToday = 0;
        let totalWorkingScore = 0;

        const todayStr = new Date().toLocaleDateString('en-CA');

        for (const emp of filteredEmployees) {
            const empAttendance = attendanceByEmployee.get(emp.id);
            if (empAttendance) {
                // Calculate total score for the CURRENTLY VIEWED month/year
                for (const [dateStr, record] of empAttendance.entries()) {
                    const [rYear, rMonth, rDay] = dateStr.split('-').map(Number);
                    if (rMonth === selectedMonth && rYear === selectedYear) {
                        // Determine if this date is the employee's weekoff to correctly score P on weekoff as +2
                        const dateObj = new Date(rYear, rMonth - 1, rDay);
                        const dayOfWeek = dateObj.getDay(); // 0=Sun, 1=Mon...
                        const weekDayMap: Record<string, number> = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6 };
                        const empWeekOffIdx = weekDayMap[emp.weeklyOff || 'Sunday'] ?? 0;
                        const isWeekOffDay = dayOfWeek === empWeekOffIdx;

                        if (record.status === 'P') totalWorkingScore += isWeekOffDay ? 2 : 1;
                        else if (record.status === 'A') totalWorkingScore += 0; // Absent is neutral (0)
                        else if (record.status === 'W/O') totalWorkingScore += 1;
                        else if (record.status === 'WOP') totalWorkingScore += 2;
                        else if (record.status === 'PH') totalWorkingScore += 1;
                        else if (record.status === 'HD') totalWorkingScore += 0.5;
                    }
                }

                // Stats for TODAY
                const todayRecord = empAttendance.get(todayStr);

                // If there is ANY record for today (photo or explicit status), counting logic
                if (todayRecord) {
                    // Logic: If explicitly Present/WeekoffPresent OR if there is a PHOTO (implies present), count as present
                    if (todayRecord.status === 'P' || todayRecord.status === 'WOP' || (todayRecord.photoUrl && todayRecord.status !== 'A')) {
                        presentToday++;
                    }
                    else if (todayRecord.status === 'A') {
                        absentToday++;
                    }
                }
            }
        }

        return { presentToday, absentToday, totalWorkingScore };
    }, [filteredEmployees, attendanceByEmployee, selectedMonth, selectedYear]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
                    <div className="text-center mb-8"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck size={32} className="text-primary" /></div><h1 className="text-2xl font-bold text-gray-800">Admin Portal</h1></div>

                    {loginError && <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm text-center">{loginError}</div>}

                    {!otpRequired ? (
                        <form onSubmit={handleLogin} className="space-y-4">
                            <input
                                type="text"
                                value={loginEmail}
                                onChange={e => setLoginEmail(e.target.value)}
                                placeholder="Email or Username"
                                className="w-full border rounded-lg px-3 py-2"
                                required
                            />
                            <input
                                type="password"
                                value={loginPassword}
                                onChange={e => setLoginPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full border rounded-lg px-3 py-2"
                                required
                            />
                            <button disabled={isLoading} className="w-full bg-primary text-white py-3 rounded-xl font-bold disabled:opacity-50">
                                {isLoading ? 'Checking...' : 'Sign In'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                            <div className="text-center text-sm text-gray-600 mb-4">
                                Enter the OTP sent to your registered email.<br />
                                <span className="text-xs text-gray-400">This device will be trusted after verification.</span>
                            </div>
                            <input
                                type="text"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                className="w-full border rounded-lg px-3 py-2 text-center text-2xl tracking-widest"
                                maxLength={6}
                                required
                            />
                            <button disabled={isLoading} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold disabled:opacity-50">
                                {isLoading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            <button type="button" onClick={() => setOtpRequired(false)} className="w-full text-gray-500 text-sm hover:underline">
                                Back to Login
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900 relative">
            {/* Mobile Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            <aside className={
                'fixed inset-y-0 left-0 z-40 w-64 bg-secondary text-white flex flex-col shadow-2xl transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ' +
                (mobileMenuOpen ? 'translate-x-0' : '-translate-x-full')
            }>
                <div className="p-6 border-b border-gray-600 bg-secondary/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary p-2 rounded-lg"><LayoutDashboard size={20} /></div>
                        <div>
                            <h1 className="font-bold text-lg">Ambe Admin (v2.3.1)</h1>
                            {userRole === 'SuperAdmin' && <span className="text-xs text-yellow-400 font-mono">Super Admin</span>}
                        </div>
                    </div>
                    <button onClick={() => setMobileMenuOpen(false)} className="md:hidden text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto pr-4 sidebar-nav">
                    <div className="space-y-1">
                        <button onClick={() => setInvoicesExpanded(!invoicesExpanded)} className={`w-full flex justify-between items-center px-4 py-3 rounded-lg hover:bg-white/5 text-left`}>
                            <div className="flex gap-3 items-center"><FileText size={18} /> Invoices</div>
                            <ChevronDown size={16} className={`transition-transform ${invoicesExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {invoicesExpanded && (
                            <div className="pl-4 space-y-1 bg-black/10 py-2 rounded-lg">
                                <NavLink to="/invoices-tax" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `w-full flex gap-3 px-4 py-2 rounded-lg text-sm ${isActive ? 'bg-primary shadow-lg' : 'hover:bg-white/5 text-gray-300'}`}>Tax Invoices</NavLink>
                                <NavLink to="/invoices-proforma" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `w-full flex gap-3 px-4 py-2 rounded-lg text-sm ${isActive ? 'bg-primary shadow-lg' : 'hover:bg-white/5 text-gray-300'}`}>Proforma Invoices</NavLink>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <button onClick={() => setOfficeEmployeeExpanded(!officeEmployeeExpanded)} className={`w-full flex justify-between items-center px-4 py-3 rounded-lg hover:bg-white/5 text-left`}>
                            <div className="flex gap-3 items-center"><Users size={18} /> Office Employee</div>
                            <ChevronDown size={16} className={`transition-transform ${officeEmployeeExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {officeEmployeeExpanded && (
                            <div className="pl-4 space-y-1 bg-black/10 py-2 rounded-lg">
                                <NavLink to="/employees" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `w-full flex gap-3 px-4 py-2 rounded-lg text-sm ${isActive ? 'bg-primary shadow-lg' : 'hover:bg-white/5 text-gray-300'}`}>Staff</NavLink>
                                <NavLink to="/attendance" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `w-full flex gap-3 px-4 py-2 rounded-lg text-sm ${isActive ? 'bg-primary shadow-lg' : 'hover:bg-white/5 text-gray-300'}`}>Attendance</NavLink>
                                <NavLink to="/logs" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `w-full flex gap-3 px-4 py-2 rounded-lg text-sm ${isActive ? 'bg-primary shadow-lg' : 'hover:bg-white/5 text-gray-300'}`}>Logs</NavLink>
                                <NavLink to="/payroll" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `w-full flex gap-3 px-4 py-2 rounded-lg text-sm ${isActive ? 'bg-primary shadow-lg' : 'hover:bg-white/5 text-gray-300'}`}>Payroll</NavLink>
                            </div>
                        )}
                    </div>

                    <NavLink to="/sites" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `w-full flex gap-3 px-4 py-3 rounded-lg ${isActive ? 'bg-primary shadow-lg' : 'hover:bg-white/5'}`}><MapPin size={18} /> Sites</NavLink>

                    <NavLink to="/photos" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `w-full flex gap-3 px-4 py-3 rounded-lg ${isActive ? 'bg-primary shadow-lg' : 'hover:bg-white/5'}`}>
                        <Camera size={18} /> Photos
                    </NavLink>
                    {userRole === 'SuperAdmin' && (
                        <NavLink to="/ledger" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `w-full flex gap-3 px-4 py-3 rounded-lg ${isActive ? 'bg-primary shadow-lg' : 'hover:bg-white/5'}`}>
                            <BookOpen size={18} /> Ledger
                        </NavLink>
                    )}
                    {userRole === 'SuperAdmin' && (
                        <NavLink to="/users" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `w-full flex gap-3 px-4 py-3 rounded-lg ${isActive ? 'bg-primary shadow-lg' : 'hover:bg-white/5'}`}>
                            <ShieldCheck size={18} /> Admin Users
                        </NavLink>
                    )}
                    {(userRole === 'Admin' || userRole === 'SuperAdmin') && (
                        <NavLink to="/device-history" onClick={() => setMobileMenuOpen(false)} className={({ isActive }) => `w-full flex gap-3 px-4 py-3 rounded-lg ${isActive ? 'bg-primary shadow-lg' : 'hover:bg-white/5'}`}>
                            <Phone size={18} /> Device History
                        </NavLink>
                    )}
                </nav>
                <div className="p-4 border-t border-gray-600">
                    {userRole === 'SuperAdmin' && (
                        <button
                            onClick={() => setShowProfileModal(true)}
                            className="flex items-center gap-3 text-gray-400 hover:text-white hover:bg-gray-800 w-full p-3 rounded-lg transition-colors mb-2"
                        >
                            <UserCircle size={20} />
                            <span>My Profile</span>
                        </button>
                    )}
                    <button onClick={handleLogout} className="flex gap-2 text-red-300 hover:text-white w-full px-4 py-2"><LogOut size={16} /> Sign Out</button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
                {/* Mobile Header */}
                <div className="md:hidden bg-secondary text-white p-4 flex justify-between items-center shadow-md z-20 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary p-1.5 rounded-lg"><LayoutDashboard size={18} /></div>
                        <h1 className="font-bold text-lg">Ambe Admin</h1>
                    </div>
                    <button onClick={() => setMobileMenuOpen(true)} className="p-1 hover:bg-white/10 rounded">
                        <Menu size={24} />
                    </button>
                </div>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        {(activeTab === 'invoices-tax' || activeTab === 'invoices-proforma') && (
                            <div className="space-y-6">
                                {loadingInvoices && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                                        <div className="inline-flex items-center gap-2 text-green-700">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-700 border-t-transparent"></div>
                                            Loading invoices...
                                        </div>
                                    </div>
                                )}
                                {showStatsModal && (
                                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) setShowStatsModal(false); }}>
                                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 animate-in zoom-in-95 duration-200">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>
                                                    <h3 className="text-2xl font-bold text-gray-800">Attendance Metrics</h3>
                                                    <p className="text-gray-500 text-sm">Real-time overview for {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                </div>
                                                <button onClick={() => setShowStatsModal(false)} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors">
                                                    <X size={20} />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                                <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-2xl border border-green-100 shadow-sm relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                                        <CheckCircle size={100} className="text-green-600" />
                                                    </div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="bg-green-100 p-2 rounded-lg text-green-600"><CheckCircle size={24} /></div>
                                                        <h4 className="font-bold text-gray-700">Present Today</h4>
                                                    </div>
                                                    <div className="text-4xl font-extrabold text-green-700 mb-1">{attendanceStats.presentToday}</div>
                                                    <p className="text-xs text-green-600 font-medium bg-green-100/50 inline-block px-2 py-1 rounded">Active Workforce</p>
                                                </div>

                                                <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border border-red-100 shadow-sm relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                                        <XCircle size={100} className="text-red-600" />
                                                    </div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="bg-red-100 p-2 rounded-lg text-red-600"><XCircle size={24} /></div>
                                                        <h4 className="font-bold text-gray-700">Absent Today</h4>
                                                    </div>
                                                    <div className="text-4xl font-extrabold text-red-700 mb-1">{attendanceStats.absentToday}</div>
                                                    <p className="text-xs text-red-600 font-medium bg-red-100/50 inline-block px-2 py-1 rounded">Missing Workforce</p>
                                                </div>

                                                <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                                        <CalendarDays size={100} className="text-indigo-600" />
                                                    </div>
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600"><CalendarDays size={24} /></div>
                                                        <h4 className="font-bold text-gray-700">Working Score</h4>
                                                    </div>
                                                    <div className="text-4xl font-extrabold text-indigo-700 mb-1">{attendanceStats.totalWorkingScore}</div>
                                                    <div className="flex gap-2">
                                                        <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">P: +1</span>
                                                        <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">A: 0</span>
                                                        <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">WO: +1</span>
                                                        <span className="text-[10px] text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">WOP: +2</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                                                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><div className="w-1 h-4 bg-primary rounded-full" /> Attendance Breakdown</h4>
                                                <div className="h-4 bg-white rounded-full overflow-hidden flex border border-gray-200">
                                                    <div style={{ width: `${(attendanceStats.presentToday / (attendanceStats.presentToday + attendanceStats.absentToday || 1)) * 100}%` }} className="bg-green-500 h-full transition-all duration-1000" />
                                                    <div style={{ width: `${(attendanceStats.absentToday / (attendanceStats.presentToday + attendanceStats.absentToday || 1)) * 100}%` }} className="bg-red-500 h-full transition-all duration-1000" />
                                                </div>
                                                <div className="flex justify-between mt-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <span>Present ({Math.round((attendanceStats.presentToday / (attendanceStats.presentToday + attendanceStats.absentToday || 1)) * 100)}%)</span>
                                                    <span>Absent ({Math.round((attendanceStats.absentToday / (attendanceStats.presentToday + attendanceStats.absentToday || 1)) * 100)}%)</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                    <h2 className="text-2xl font-bold">{activeTab === 'invoices-proforma' ? 'Proforma Invoices' : 'Tax Invoices'}</h2>
                                    <div className="flex flex-wrap gap-2 items-center">
                                        {/* Filters */}
                                        <select value={invFilterMonth} onChange={(e) => setInvFilterMonth(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-primary/20">
                                            <option value="all">All Months</option>
                                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'short' })}</option>
                                            ))}
                                        </select>
                                        <select value={invFilterYear} onChange={(e) => setInvFilterYear(parseInt(e.target.value))} className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-primary/20">
                                            {[2024, 2025, 2026, 2027].map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                        <select value={invFilterSite} onChange={(e) => setInvFilterSite(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-primary/20 max-w-[150px]">
                                            <option value="all">All Sites</option>
                                            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                        <select value={invFilterStatus} onChange={(e) => setInvFilterStatus(e.target.value)} className="border rounded-lg px-3 py-2 text-sm bg-white shadow-sm outline-none focus:ring-2 focus:ring-primary/20">
                                            <option value="all">All Status</option>
                                            <option value="Paid">Paid</option>
                                            <option value="Unpaid">Unpaid</option>
                                            <option value="Approved">Approved</option>
                                        </select>
                                        <button
                                            onClick={async () => {
                                                setLoadingInvoices(true);
                                                try {
                                                    const inv = await getInvoices();
                                                    setInvoices(inv);
                                                    setCachedData('invoices', inv);
                                                } finally {
                                                    setLoadingInvoices(false);
                                                }
                                            }}
                                            disabled={loadingInvoices}
                                            className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
                                        >
                                            <RotateCcw size={18} /> Refresh
                                        </button>
                                        <button onClick={() => setShowBillModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-indigo-700 transition-colors">
                                            <Receipt size={18} /> Generate Bill
                                        </button>
                                        <button onClick={handleCreateInvoice} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-primary/90 transition-colors"><Plus size={18} /> New Invoice</button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border overflow-hidden overflow-x-auto">
                                    <table className="w-full text-left min-w-[800px]">
                                        <thead className="bg-gray-50 border-b"><tr><th className="p-4">Details</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr></thead>
                                        <tbody>
                                            {invoices.filter(inv => {
                                                const isProforma = inv.invoiceNo.startsWith('PI') || inv.status === 'Pending Approval' || inv.status === 'Approved';
                                                if (activeTab === 'invoices-proforma' && !isProforma) return false;
                                                if (activeTab === 'invoices-tax' && isProforma) return false;

                                                const d = new Date(inv.generatedDate);
                                                const matchMonth = invFilterMonth === 'all' || (d.getMonth() + 1) === parseInt(invFilterMonth);
                                                const matchYear = d.getFullYear() === invFilterYear;
                                                const matchSite = invFilterSite === 'all' || inv.siteId === invFilterSite;
                                                const matchStatus = invFilterStatus === 'all' || inv.status === invFilterStatus;
                                                return matchMonth && matchYear && matchSite && matchStatus;
                                            })
                                                .sort((a, b) => new Date(b.generatedDate).getTime() - new Date(a.generatedDate).getTime())
                                                .map(inv => (
                                                    <tr key={inv.id} className="border-b hover:bg-gray-50">
                                                        <td className="p-4"><div>{inv.siteName}</div><div className="text-xs text-gray-500">{inv.invoiceNo}</div><div className="text-xs text-gray-400">{inv.billingPeriod}</div></td>
                                                        <td className="p-4 font-bold">₹{(inv.amount || 0).toLocaleString()}</td>
                                                        <td className="p-4">
                                                            {inv.invoiceNo.startsWith('PI') ? (
                                                                inv.status === 'Approved' ? (
                                                                    <span className="px-3 py-1 rounded text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                                        Approved
                                                                    </span>
                                                                ) : inv.status === 'Pending Approval' ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="px-3 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                                            Pending Approval
                                                                        </span>
                                                                        {userRole === 'SuperAdmin' && (
                                                                            <button onClick={() => handleApproveInvoice(inv)} className="px-3 py-1 rounded text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm">
                                                                                Approve
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <button onClick={() => handleApproveInvoice(inv)} className="px-3 py-1 rounded text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors border border-red-200">
                                                                        {userRole === 'SuperAdmin' ? 'Approve Now' : 'Submit for Approval'}
                                                                    </button>
                                                                )
                                                            ) : (
                                                                userRole === 'SuperAdmin' ? (
                                                                    inv.status === 'Pending Payment' ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="px-3 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
                                                                                Payment Pending
                                                                            </span>
                                                                            <button onClick={() => togglePaymentStatus(inv)} className="px-3 py-1 rounded text-xs font-bold bg-green-600 text-white hover:bg-green-700 transition-colors shadow-sm">
                                                                                Approve
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button onClick={() => togglePaymentStatus(inv)} className={`px-2 py-1 rounded text-xs font-bold ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} hover:opacity-80 transition-opacity`}>
                                                                            {inv.status}
                                                                        </button>
                                                                    )
                                                                ) : null
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-right flex justify-end gap-2">
                                                            <button onClick={() => downloadInvoiceExcel(inv)} className="p-2 hover:bg-green-50 text-green-600 rounded transition-colors" title="Download Excel"><Download size={16} /></button>
                                                            <button onClick={() => { setEditingInvoice(inv); setShowInvoiceModal(true); }} className="p-2 hover:bg-blue-50 text-blue-600 rounded transition-colors" title="Edit Invoice"><Edit2 size={16} /></button>
                                                            {userRole === 'SuperAdmin' && (
                                                                <button onClick={() => handleDeleteInvoice(inv)} className="p-2 hover:bg-red-50 text-red-600 rounded transition-colors" title="Delete Invoice"><Trash2 size={16} /></button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            {invoices.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No invoices found</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {activeTab === 'employees' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Staff Management</h2><div className="flex gap-3"><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search staff..." className="pl-4 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary" /><button onClick={() => { setEditingEmployee(null); setShowEmployeeModal(true); }} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> Add Staff</button></div></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{employees.filter(e => {
                                    const matchesSearch = (e.name || '').toLowerCase().includes(searchTerm.toLowerCase());
                                    if (userRole === 'SuperAdmin') return matchesSearch;
                                    return matchesSearch && e.status !== 'Deleted';
                                }).map(emp => (
                                    <div key={emp.id} className={`bg-white p-5 rounded-xl border shadow-sm hover:shadow-md ${emp.status === 'Pending' ? 'border-yellow-400 bg-yellow-50' : (emp.status === 'Deleted' ? 'border-red-400 bg-red-50 opacity-75' : (emp.status === 'Inactive' ? 'border-gray-300 bg-gray-50' : (emp.status === 'On Leave' ? 'border-orange-200 bg-orange-50' : '')))}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-4">
                                                <img src={getSafePhotoUrl(emp.photoUrl)} className="w-12 h-12 rounded-full object-cover border" onError={handleImageError} loading="lazy" />
                                                <div>
                                                    <h3 className="font-bold text-gray-800">{emp.name}</h3>
                                                    <div className="text-xs text-gray-500 font-mono">{emp.biometricCode}</div>
                                                    {emp.status === 'Pending' && <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded font-bold">Pending Approval</span>}
                                                    {emp.status === 'Deleted' && <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-bold">Deleted</span>}
                                                    {emp.status === 'Inactive' && <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold">Inactive</span>}
                                                    {emp.status === 'On Leave' && <span className="text-[10px] bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded font-bold">On Leave</span>}
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                {emp.status === 'Deleted' ? (
                                                    userRole === 'SuperAdmin' && (
                                                        <button onClick={() => handleRestoreEmployee(emp)} className="p-1.5 text-green-600 hover:bg-green-100 rounded flex items-center gap-1" title="Restore Employee">
                                                            <RotateCcw size={16} /> <span className="text-xs font-bold">Restore</span>
                                                        </button>
                                                    )
                                                ) : (
                                                    <>
                                                        {emp.status === 'Pending' && userRole === 'SuperAdmin' && (
                                                            <button onClick={() => handleApproveEmployee(emp)} className="p-1.5 text-green-600 hover:bg-green-100 rounded" title="Approve Employee"><CheckCircle size={16} /></button>
                                                        )}
                                                        <button onClick={() => { setEditingEmployee(emp); setShowEmployeeModal(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-xs text-gray-500"><span>{emp.role}</span><span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">{emp.phone || 'No Phone'}</span></div>
                                    </div>
                                ))}</div>
                            </div>
                        )}
                        {activeTab === 'attendance' && (
                            <div className="space-y-6 animate-in fade-in">


                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        Attendance Grid
                                        <span className="inline-flex items-center gap-2 text-sm text-green-600 ml-2">
                                            <span className="h-2 w-2 bg-green-500 rounded-full inline-block" />
                                            Live
                                        </span>
                                        {lastAttendanceUpdate && (
                                            <span className="text-xs text-gray-400 ml-2 hidden sm:inline">• Updated {elapsedSeconds <= 1 ? 'now' : `${elapsedSeconds}s ago`}</span>
                                        )}
                                        <button
                                            onClick={() => setShowPhotoGallery(true)}
                                            className="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                                            title="View All Photos"
                                        >
                                            <Camera size={12} />
                                            {attendanceData.filter(r => r.photoUrl).length} Photos
                                        </button>
                                    </h2>
                                    <div className="flex flex-wrap gap-2 items-center">

                                        {/* Quick Stats Pills */}

                                        <button onClick={() => { setEditingEmployee(null); setShowEmployeeModal(true); }} className="bg-primary text-white px-3 py-1 rounded-lg flex items-center gap-2 shadow-sm hover:bg-primary/90 transition-colors sm:px-4 sm:py-2 sm:text-sm text-xs">
                                            <Plus size={18} /> Add Staff
                                        </button>

                                        {/* MONTH FILTER */}
                                        <div className="flex items-center bg-white border rounded-lg px-2 py-1 shadow-sm sm:px-3 sm:py-2">
                                            <CalendarDays size={16} className="text-gray-400 mr-2" />
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                                className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer mr-2"
                                            >
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                    <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'short' })}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer border-l pl-2"
                                            >
                                                {[2024, 2025, 2026, 2027].map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* SITE FILTER */}
                                        <div className="flex items-center bg-white border rounded-lg px-2 py-1 shadow-sm sm:px-3 sm:py-2">
                                            <Filter size={16} className="text-gray-400 mr-2" />
                                            <select
                                                value={selectedSiteFilter}
                                                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                                                className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer"
                                            >
                                                <option value="all">All Sites</option>
                                                {sites.map(site => (
                                                    <option key={site.id} value={site.id}>{site.attendanceGridName || site.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                setLoadingAttendance(true);
                                                try {
                                                    const att = await getSharedAttendanceData();
                                                    setAttendanceData(att);
                                                    setCachedData('attendance', att);
                                                    setLastAttendanceUpdate(new Date().toISOString());
                                                } finally {
                                                    setLoadingAttendance(false);
                                                }
                                            }}
                                            disabled={loadingAttendance}
                                            className="bg-orange-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 shadow-sm hover:bg-orange-700 transition-colors disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm text-xs"
                                        >
                                            <RotateCcw size={18} /> Refresh Data
                                        </button>

                                        <div className="hidden sm:block relative">
                                            <button
                                                onClick={() => setShowAutoInvoiceDropdown(!showAutoInvoiceDropdown)}
                                                className="bg-purple-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 shadow-sm hover:bg-purple-700 transition-colors sm:px-4 sm:py-2 sm:text-sm text-xs"
                                            >
                                                <FileText size={18} /> Auto-Invoice <ChevronDown size={16} />
                                            </button>
                                            {showAutoInvoiceDropdown && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50 animate-in fade-in slide-in-from-top-2">
                                                    <button
                                                        onClick={() => { handleAutoGenerateInvoices('Proforma'); setShowAutoInvoiceDropdown(false); }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-700 border-b flex items-center gap-2"
                                                    >
                                                        <FileText size={14} className="text-gray-400" /> Proforma Invoice
                                                    </button>
                                                    <button
                                                        onClick={() => { handleAutoGenerateInvoices('Tax'); setShowAutoInvoiceDropdown(false); }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm font-medium text-gray-700 flex items-center gap-2"
                                                    >
                                                        <Receipt size={14} className="text-gray-400" /> Tax Invoice
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="hidden sm:inline-block">
                                            <button onClick={downloadExcelReport} className="bg-green-600 text-white px-3 py-1 rounded-lg flex items-center gap-2 shadow-sm hover:bg-green-700 transition-colors sm:px-4 sm:py-2 sm:text-sm text-xs">
                                                <FileSpreadsheet size={18} /> Export Excel
                                            </button>
                                        </div>

                                        {/* Quick Stats Pills - MOVED HERE */}
                                        <div className="flex items-center gap-2 border-l pl-3 ml-1">
                                            <div onClick={() => setShowStatsModal(true)} className="bg-green-50 text-green-700 px-3 py-1 rounded-lg flex items-center gap-2 border border-green-200 shadow-sm h-[38px] cursor-pointer hover:bg-green-100 transition-colors" title="View Detailed Stats">
                                                <CheckCircle size={16} />
                                                <span className="text-sm font-bold">{attendanceStats.presentToday}</span>
                                                <span className="text-[10px] font-bold uppercase opacity-70">Present</span>
                                            </div>
                                            <div onClick={() => setShowStatsModal(true)} className="bg-red-50 text-red-700 px-3 py-1 rounded-lg flex items-center gap-2 border border-red-200 shadow-sm h-[38px] cursor-pointer hover:bg-red-100 transition-colors" title="View Detailed Stats">
                                                <XCircle size={16} />
                                                <span className="text-sm font-bold">{attendanceStats.absentToday}</span>
                                                <span className="text-[10px] font-bold uppercase opacity-70">Absent</span>
                                            </div>
                                            <div onClick={handleViewScoreReport} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg flex items-center gap-2 border border-indigo-200 shadow-sm h-[38px] cursor-pointer hover:bg-indigo-100 transition-colors" title="View Detailed Score Report">
                                                <CalendarDays size={16} />
                                                <span className="text-sm font-bold">{attendanceStats.totalWorkingScore}</span>
                                                <span className="text-[10px] font-bold uppercase opacity-70">Score</span>
                                            </div>
                                        </div>

                                        {/* Small screen actions */}
                                        <div className="sm:hidden relative">
                                            <button onClick={() => setShowSmallMenu(!showSmallMenu)} className="bg-gray-100 p-2 rounded">
                                                <MoreHorizontal size={16} />
                                            </button>
                                            {showSmallMenu && (
                                                <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-xl border z-50 animate-in fade-in slide-in-from-top-2">
                                                    <button onClick={() => { handleAutoGenerateInvoices('Proforma'); setShowSmallMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700"><FileText size={14} /> Auto-Invoice</button>
                                                    <button onClick={() => { handleAutoGenerateInvoices('Tax'); setShowSmallMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700"><Receipt size={14} /> Tax Invoice</button>
                                                    <button onClick={() => { downloadExcelReport(); setShowSmallMenu(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-gray-700"><FileSpreadsheet size={14} /> Export Excel</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div ref={tableContainerRef} onScroll={handleTableScroll} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto overflow-y-auto max-h-[520px] custom-scrollbar">
                                    <table className="w-full text-center text-xs border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="p-3 sticky left-0 top-0 bg-gray-50 z-30 border-r border-gray-100 text-left min-w-[180px] shadow-sm">Employee</th>
                                                {Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1).map(d => {
                                                    const date = new Date(selectedYear, selectedMonth - 1, d);
                                                    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
                                                    return (
                                                        <th key={d} className="p-2 sticky top-0 bg-gray-50 z-20 border-r border-gray-100 min-w-[32px] font-medium text-gray-500 shadow-sm">
                                                            <div className="flex flex-col items-center">
                                                                <span>{d}</span>
                                                                <span className="text-[9px] font-normal text-gray-400 uppercase">{weekday}</span>
                                                            </div>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredEmployees.slice(0, visibleRows).map((emp, index, arr) => {
                                                const empMap = attendanceByEmployee.get(emp.id) || new Map<string, AttendanceRecord>();

                                                const prevEmp = index > 0 ? arr[index - 1] : null;
                                                
                                                // Group by Shift first, then Role
                                                const currentGroup = emp.shift || emp.role || 'Unassigned';
                                                const prevGroup = prevEmp ? (prevEmp.shift || prevEmp.role || 'Unassigned') : null;
                                                const showHeader = !prevEmp || currentGroup !== prevGroup;
                                                const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

                                                return (
                                                    <React.Fragment key={emp.id}>
                                                        {showHeader && (
                                                            <tr className="bg-slate-50/50 border-b border-slate-200/40">
                                                                <td colSpan={daysInMonth + 1} className="p-0 sticky left-0 z-20 overflow-hidden">
                                                                    <div className="flex items-center gap-4 px-5 py-3.5 bg-gradient-to-r from-teal-50/40 via-white to-transparent">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-1.5 h-8 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.25)]" />
                                                                            <div className="flex flex-col">
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="text-sm font-black text-slate-700 tracking-[0.1em] uppercase">
                                                                                        {currentGroup}
                                                                                    </span>
                                                                                    {emp.role && emp.shift && (
                                                                                        <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded">
                                                                                            {/* Optional: Show role if shift is group header? No, row shows role anyway */}
                                                                                        </span>
                                                                                    )}
                                                                                    <div className="flex items-center gap-2 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                                                                                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full shadow-[0_0_4px_rgba(20,184,166,0.5)]" />
                                                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                                                                            {filteredEmployees.filter(e => (e.shift || e.role || 'Unassigned') === currentGroup).length} Active Staff
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex-1 h-px bg-gradient-to-r from-slate-200/60 to-transparent" />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="p-3 sticky left-0 bg-white z-20 border-r border-gray-100 text-left font-medium text-gray-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                                <div className="flex items-center justify-between gap-3 min-w-[180px]">
                                                                    <div className="flex items-center gap-3">
                                                                        <div
                                                                            className="relative cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                                                                            onClick={() => { setEditingEmployee(emp); setShowEmployeeModal(true); }}
                                                                            title="Click to Edit Staff"
                                                                        >
                                                                            <img 
                                                                                src={getSafePhotoUrl(emp.photoUrl) || getInitialsAvatar(emp.name)} 
                                                                                data-name={emp.name}
                                                                                className="w-10 h-10 rounded-xl object-cover border border-gray-100 shadow-sm bg-gray-50" 
                                                                                alt={emp.name} 
                                                                                onError={handleImageError} 
                                                                                loading="lazy" 
                                                                            />
                                                                            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                                                        </div>
                                                                        <div className="text-left">
                                                                            {(() => {
                                                                                const d = emp.salaryDetails?.deductionBreakdown;
                                                                                const total = (d?.advance || 0) + (d?.uniform || 0) + (d?.shoes || 0) + (d?.others || 0);
                                                                                if (total > 0) {
                                                                                    const breakdown = [
                                                                                        d?.advance ? `Adv: ${d.advance}` : '',
                                                                                        d?.uniform ? `Uni: ${d.uniform}` : '',
                                                                                        d?.shoes ? `Shoes: ${d.shoes}` : '',
                                                                                        d?.others ? `Oth: ${d.others}` : ''
                                                                                    ].filter(Boolean).join(', ');
                                                                                    return (
                                                                                        <div className="group relative w-fit">
                                                                                            <div className="text-[10px] text-red-500 font-bold mb-0.5 cursor-help border-b border-dotted border-red-300">
                                                                                                ₹{total}
                                                                                            </div>
                                                                                            <div className="hidden group-hover:block absolute left-0 bottom-full mb-1 bg-gray-900 text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                                                                                                {breakdown}
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                                return null;
                                                                            })()}
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="font-bold text-gray-800">{emp.name}</div>
                                                                                {emp.weeklyOff && (
                                                                                    <div className="text-[10px] font-bold text-red-600 border border-red-200 bg-red-50 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                                        {emp.weeklyOff.slice(0, 3)}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <div className="text-[10px] text-gray-400 font-mono">{emp.biometricCode}</div>
                                                                                <div className="text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{emp.phone || 'No Phone'}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setDeductionEmployee(emp); setShowDeductionModal(true); }}
                                                                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                                                                        title="Edit Deductions (Advance, Uniform, etc.)"
                                                                    >
                                                                        <Banknote size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            {Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1).map(d => {
                                                                const dateStr = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
                                                                const currentDate = new Date(selectedYear, selectedMonth - 1, d);

                                                                // --- NEW JOINING LOGIC ---
                                                                // Reliever status takes precedence over New Joining - user request: "when the person is reliever the new joining should not shows"
                                                                if (emp.joiningDate && emp.status !== 'Reliever') {
                                                                    const [jy, jm, jd] = emp.joiningDate.split('-').map(Number);
                                                                    const joinDateObj = new Date(jy, jm - 1, jd);
                                                                    
                                                                    // Only apply if the joining date is IN THE CURRENT MONTH
                                                                    // The user requested: "new joining status on the current months before the joining date only in the current month only"
                                                                    // So if joining is Feb 3, Jan should be blank, Feb 1-2 should be "New Joining".
                                                                    const isJoiningMonth = joinDateObj.getMonth() === (selectedMonth - 1) && joinDateObj.getFullYear() === selectedYear;

                                                                    if (isJoiningMonth && currentDate.getTime() < joinDateObj.getTime()) {
                                                                        // Render individual cells for each day before joining (similar style to Reliever)
                                                                        return (
                                                                            <td key={d} className="border-r border-gray-100 p-1 bg-blue-50/20 text-center align-middle">
                                                                                <span className="text-[9px] text-blue-500 font-medium px-1 leading-tight block transform -rotate-45 origin-center opacity-70 select-none whitespace-nowrap">
                                                                                    NEW JOINING
                                                                                </span>
                                                                            </td>
                                                                        );
                                                                    }
                                                                }

                                                                // Check for Leave Spanning
                                                                if (emp.status === 'On Leave' && emp.leavingDate) {
                                                                    const [ly, lm, ld] = emp.leavingDate.split('-').map(Number);
                                                                    const leaveStart = new Date(ly, lm - 1, ld);

                                                                    let leaveEnd = null;
                                                                    if (emp.returnDate) {
                                                                        const [ry, rm, rd] = emp.returnDate.split('-').map(Number);
                                                                        leaveEnd = new Date(ry, rm - 1, rd);
                                                                    }

                                                                    const currentMs = currentDate.getTime();
                                                                    const startMs = leaveStart.getTime();

                                                                    // If no return date, assume indefinite leave (just show for rest of visible month)
                                                                    const shouldShow = leaveEnd ? (currentMs >= startMs && currentMs <= leaveEnd.getTime()) : (currentMs >= startMs);

                                                                    if (shouldShow) {
                                                                        // Determine if we should render the colspan cell
                                                                        const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
                                                                        const effectiveStart = startMs < monthStart.getTime() ? monthStart : leaveStart;

                                                                        // Render only on the effective start day
                                                                        if (currentMs === effectiveStart.getTime()) {
                                                                            // Calculate colspan
                                                                            const monthEnd = new Date(selectedYear, selectedMonth, 0);
                                                                            const effectiveEnd = (leaveEnd && leaveEnd.getTime() < monthEnd.getTime()) ? leaveEnd : monthEnd;

                                                                            const diffTime = effectiveEnd.getTime() - effectiveStart.getTime();
                                                                            const spanDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                                                                            return (
                                                                                <td key={d} colSpan={spanDays} className="bg-orange-50/80 border-r border-gray-200 p-1 text-xs text-orange-800 font-medium text-left px-3 align-middle">
                                                                                    <div className="line-clamp-1 overflow-hidden text-ellipsis whitespace-nowrap" title={emp.leaveReason}>
                                                                                        {emp.leaveReason ? `On Leave: ${emp.leaveReason}` : 'On Leave'}
                                                                                    </div>
                                                                                </td>
                                                                            );
                                                                        } else {
                                                                            // Skip rendering for spanned days
                                                                            return null;
                                                                        }
                                                                    }
                                                                }

                                                                const record = empMap.get(dateStr);
                                                                let content = <span className="text-gray-200">-</span>;
                                                                let cellClass = "cursor-pointer hover:bg-gray-100";

                                                                // --- RELIEVER LOGIC ---
                                                                if (emp.status === 'Reliever' && !record) {
                                                                    // If employee is a Reliever and has NO record for this day
                                                                    return (
                                                                        <td key={d} className="border-r border-gray-100 p-1 bg-indigo-50/20 text-center align-middle" onClick={() => handleCellClick(emp, d)}>
                                                                            <span className="text-[9px] text-indigo-300 font-medium px-1 leading-tight block transform -rotate-45 origin-center opacity-70 select-none">
                                                                                RELIEVER
                                                                            </span>
                                                                        </td>
                                                                    );
                                                                }

                                                                if (record) {
                                                                    const status = record.status;

                                                                    // Color mapping
                                                                    let bgClass = '';
                                                                    let textClass = '';
                                                                    let borderClass = 'border-transparent';

                                                                    if (status === 'P') { bgClass = 'bg-green-50/30'; textClass = 'text-green-600'; borderClass = 'border-green-500'; }
                                                                    else if (status === 'A') { bgClass = 'bg-red-50'; textClass = 'text-red-500'; borderClass = 'border-red-500'; }
                                                                    else if (status === 'HD') { bgClass = 'bg-orange-50'; textClass = 'text-orange-600'; borderClass = 'border-orange-500'; }
                                                                    else if (status === 'W/O') { bgClass = 'bg-blue-50'; textClass = 'text-blue-600'; borderClass = 'border-blue-500'; }
                                                                    else if (status === 'WOP') { bgClass = 'bg-purple-50'; textClass = 'text-purple-600'; borderClass = 'border-purple-500'; }
                                                                    else if (status === 'WOE' || status === 'HDE' || status === 'PH') { bgClass = 'bg-gray-50'; textClass = 'text-gray-600'; }

                                                                    cellClass += ` ${bgClass}`;

                                                                    if (record.photoUrl) {
                                                                        content = (
                                                                            <div className="flex justify-center items-center group relative w-full h-full">
                                                                                <img
                                                                                    src={getSafePhotoUrl(record.photoUrl)}
                                                                                    className={`w-8 h-8 rounded object-cover border ${borderClass} shadow-sm`}
                                                                                    alt={status}
                                                                                    onError={handleImageError}
                                                                                    loading="lazy"
                                                                                />
                                                                                <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5 border border-white">
                                                                                    <Camera size={8} className="text-white" />
                                                                                </div>
                                                                                <div className="fixed hidden group-hover:block z-[9999] pointer-events-none" style={{ transform: 'translate(-50%, -110%)' }}>
                                                                                    <img src={getSafePhotoUrl(record.photoUrl)} className="w-48 h-48 rounded-lg shadow-2xl border-4 border-white object-cover bg-gray-800" alt="Preview" onError={handleImageError} loading="lazy" />
                                                                                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
                                                                                        {status} • {new Date(record.timestamp || record.checkInTime || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    } else {
                                                                        content = <span className={`${textClass} font-bold`}>{status}</span>;
                                                                    }
                                                                }
                                                                return (<td key={d} className={`border-r border-gray-100 p-1 ${cellClass}`} onClick={() => handleCellClick(emp, d)}>{content}</td>);
                                                            })}
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                            {filteredEmployees.length === 0 && (
                                                <tr><td colSpan={32} className="p-8 text-center text-gray-400">No employees found for the selected site.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>


                                {/* Transient toast for new attendance */}
                                {toastMessage && (
                                    <div className="fixed right-4 bottom-6 z-50">
                                        <div className="bg-black text-white px-4 py-2 rounded shadow-lg">{toastMessage}</div>
                                    </div>
                                )}
                            </div>
                        )}
                        {activeTab === 'logs' && (
                            <AttendanceLogs
                                locationLogs={locationLogs}
                                sites={sites}
                            />
                        )}
                        {activeTab === 'sites' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Site Management</h2><button onClick={() => { setEditingSite(null); setShowSiteModal(true); }} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2"><Plus size={18} /> Add Site</button></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{sites.filter(s => {
                                    if (userRole === 'SuperAdmin') return true;
                                    return s.status !== 'Deleted';
                                }).map(site => {
                                    // Calculate Expiry Alert
                                    let expiryAlert = null;
                                    if (site.workOrderEndDate) {
                                        const today = new Date();
                                        const expiry = new Date(site.workOrderEndDate);
                                        const diffTime = expiry.getTime() - today.getTime();
                                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                        if (diffDays < 0) {
                                            expiryAlert = <div className="mt-2 bg-red-100 text-red-700 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2"><AlertTriangle size={14} /> Work Order Expired!</div>;
                                        } else if (diffDays <= 60) {
                                            expiryAlert = <div className="mt-2 bg-orange-100 text-orange-700 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2"><AlertTriangle size={14} /> Expires in {diffDays} days</div>;
                                        }
                                    }

                                    return (
                                        <div key={site.id} className={`bg-white p-5 rounded-xl border shadow-sm hover:shadow-md ${site.status === 'Pending' ? 'border-yellow-400 bg-yellow-50' : (site.status === 'Deleted' ? 'border-red-400 bg-red-50 opacity-75' : '')}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                                        {site.name}
                                                        {site.status === 'Pending' && <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded font-bold">Pending Approval</span>}
                                                        {site.status === 'Deleted' && <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-bold">Deleted</span>}
                                                    </h3>
                                                    <p className="text-gray-500 text-sm flex items-center gap-1"><MapPin size={14} /> {site.location}</p>
                                                </div>
                                                <div className="flex gap-1">
                                                    {site.status === 'Deleted' ? (
                                                        userRole === 'SuperAdmin' && (
                                                            <button onClick={() => handleRestoreSite(site)} className="p-1.5 text-green-600 hover:bg-green-100 rounded flex items-center gap-1" title="Restore Site">
                                                                <RotateCcw size={16} /> <span className="text-xs font-bold">Restore</span>
                                                            </button>
                                                        )
                                                    ) : (
                                                        <>
                                                            {site.status === 'Pending' && userRole === 'SuperAdmin' && (
                                                                <button onClick={() => handleApproveSite(site)} className="p-1.5 text-green-600 hover:bg-green-100 rounded" title="Approve Site"><CheckCircle size={16} /></button>
                                                            )}
                                                            {(userRole === 'SuperAdmin' || userRole === 'Admin') && (
                                                                <button
                                                                    onClick={async () => {
                                                                        if (confirm(`Revoke device access for ${site.name} supervisor? They will need to login again on a new device.`)) {
                                                                            await revokeSupervisorDevice(site.id);
                                                                            alert("Device revoked successfully.");
                                                                        }
                                                                    }}
                                                                    className="p-1.5 text-orange-500 hover:bg-orange-50 rounded"
                                                                    title="Revoke Device Access"
                                                                >
                                                                    <LogOut size={16} />
                                                                </button>
                                                            )}
                                                            <button onClick={() => { setEditingSite(site); setShowSiteModal(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={16} /></button>
                                                            <button onClick={() => handleDeleteSite(site.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {expiryAlert}

                                            <div className="mb-3 p-3 bg-blue-50 rounded-lg text-xs space-y-1 border border-blue-100">
                                                <div className="font-bold text-blue-800 flex items-center gap-1"><Briefcase size={12} /> Client Details</div>
                                                <div className="text-gray-600"><span className="font-medium">Name:</span> {site.clientName || 'N/A'}</div>
                                                <div className="text-gray-600"><span className="font-medium">GSTIN:</span> {site.clientGstin || 'N/A'}</div>
                                                <div className="text-gray-600"><span className="font-medium">Contact:</span> {site.clientContact || 'N/A'}</div>
                                                {site.workOrderNo && <div className="text-gray-600 pt-1 border-t border-blue-200 mt-1"><span className="font-medium">WO No:</span> {site.workOrderNo}</div>}
                                                {site.billingRate && <div className="text-gray-600"><span className="font-medium">Rate:</span> ₹{site.billingRate}</div>}
                                            </div>
                                            <div className="flex gap-4 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <div><span className="block font-bold">Workers</span> {site.activeWorkers}</div>
                                                <div><span className="block font-bold">Geofence</span> {site.geofenceRadius}m</div>
                                                <div><span className="block font-bold">GPS</span> {(site.latitude || 0).toFixed(4)}, {(site.longitude || 0).toFixed(4)}</div>
                                            </div>
                                        </div>
                                    )
                                })}</div>
                            </div>
                        )}
                        {activeTab === 'photos' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                    <h2 className="text-2xl font-bold flex items-center gap-2">
                                        <Camera size={24} /> Photo Gallery
                                    </h2>
                                    <div className="flex gap-3 items-center">
                                        {/* DAY FILTER */}
                                        <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
                                            <CalendarDays size={16} className="text-gray-400 mr-2" />
                                            <select
                                                value={selectedDay}
                                                onChange={(e) => setSelectedDay(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                                                className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer"
                                            >
                                                <option value="all">Daily</option>
                                                {Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => i + 1).map(d => (
                                                    <option key={d} value={d}>{d}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* SITE FILTER */}
                                        <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
                                            <Filter size={16} className="text-gray-400 mr-2" />
                                            <select
                                                value={selectedSiteFilter}
                                                onChange={(e) => setSelectedSiteFilter(e.target.value)}
                                                className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer"
                                            >
                                                <option value="all">All Sites</option>
                                                {sites.map(site => (
                                                    <option key={site.id} value={site.id}>{site.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* MONTH FILTER */}
                                        <div className="flex items-center bg-white border rounded-lg px-3 py-2 shadow-sm">
                                            <CalendarDays size={16} className="text-gray-400 mr-2" />
                                            <select
                                                value={selectedMonth}
                                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                                className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer mr-2"
                                            >
                                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                                    <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleString('default', { month: 'short' })}</option>
                                                ))}
                                            </select>
                                            <select
                                                value={selectedYear}
                                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                                className="bg-transparent text-sm outline-none font-medium text-gray-700 cursor-pointer border-l pl-2"
                                            >
                                                {[2024, 2025, 2026, 2027].map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {/* Employee Photos */}
                                    {employees.filter(emp => {
                                        const matchesSite = selectedSiteFilter === 'all' || emp.siteId === selectedSiteFilter;
                                        return emp.photoUrl && matchesSite && selectedDay === 'all';
                                    }).map(emp => {
                                        const site = sites.find(s => s.id === emp.siteId);
                                        return (
                                            <div key={`emp-${emp.id}`} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                                <div className="aspect-square relative group">
                                                    <img
                                                        src={getSafePhotoUrl(emp.photoUrl)}
                                                        className="w-full h-full object-cover"
                                                        alt={emp.name}
                                                        onError={handleImageError}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                    <div className="absolute top-3 left-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                                        Employee
                                                    </div>
                                                    <a
                                                        href={extractCloudinaryPublicId(emp.photoUrl) && !emp.photoUrl?.startsWith('data:') ? `${API_URL}/download/image/${extractCloudinaryPublicId(emp.photoUrl)}` : getSafePhotoUrl(emp.photoUrl)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        download={(!extractCloudinaryPublicId(emp.photoUrl) || emp.photoUrl?.startsWith('data:')) ? `${emp.name.replace(/\s+/g, '_')}.png` : undefined}
                                                        className="absolute bottom-3 right-3 bg-white/90 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-blue-600"
                                                        title="Download PNG"
                                                    >
                                                        <Download size={16} />
                                                    </a>
                                                </div>
                                                <div className="p-4">
                                                    <div className="font-bold text-gray-800 truncate" title={emp.name}>{emp.name}</div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                        <Phone size={12} /> {emp.phone || 'No Phone'}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-1">{emp.role}</div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Attendance Photos */}
                                    {attendanceData.filter(record => {
                                        if (!record.photoUrl) return false;
                                        const emp = employees.find(e => e.id === record.employeeId);
                                        if (!emp) return false;

                                        const matchesSite = selectedSiteFilter === 'all' || emp.siteId === selectedSiteFilter;
                                        const recordDate = new Date(record.date);
                                        const matchesMonth = recordDate.getMonth() + 1 === selectedMonth;
                                        const matchesYear = recordDate.getFullYear() === selectedYear;
                                        const matchesDay = selectedDay === 'all' || recordDate.getDate() === selectedDay;

                                        return matchesSite && matchesMonth && matchesYear && matchesDay;
                                    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => {
                                        const emp = employees.find(e => e.id === record.employeeId);
                                        const site = sites.find(s => s.id === emp?.siteId);
                                        return (
                                            <div key={`att-${record.id}`} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                                <div className="aspect-square relative group">
                                                    <img
                                                        src={getSafePhotoUrl(record.photoUrl)}
                                                        className="w-full h-full object-cover"
                                                        alt={`${emp?.name} - ${record.date}`}
                                                        onError={handleImageError}
                                                    />
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                    <div className="absolute top-3 left-3 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                                        Attendance
                                                    </div>
                                                    <div className="absolute top-3 right-3 bg-white/90 text-gray-800 text-xs px-2 py-1 rounded-full font-bold">
                                                        {record.status}
                                                    </div>
                                                    <a
                                                        href={extractCloudinaryPublicId(record.photoUrl) && !record.photoUrl?.startsWith('data:') ? `${API_URL}/download/image/${extractCloudinaryPublicId(record.photoUrl)}` : getSafePhotoUrl(record.photoUrl)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        download={(!extractCloudinaryPublicId(record.photoUrl) || record.photoUrl?.startsWith('data:')) ? `${emp?.name?.replace(/\s+/g, '_') || 'attendance'}_${record.date}.png` : undefined}
                                                        className="absolute bottom-3 right-3 bg-white/90 p-2 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-blue-600"
                                                        title="Download PNG"
                                                    >
                                                        <Download size={16} />
                                                    </a>
                                                </div>
                                                <div className="p-4">
                                                    <div className="font-bold text-gray-800 truncate" title={emp?.name}>{emp?.name || 'Unknown'}</div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                        <CalendarDays size={12} /> {record.date}
                                                    </div>
                                                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                                        <MapPin size={12} /> {site?.name || 'Unknown Site'}
                                                    </div>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className={`text-xs px-2 py-1 rounded font-bold ${record.status === 'P' ? 'bg-green-100 text-green-700' :
                                                            record.status === 'A' ? 'bg-red-100 text-red-700' :
                                                                record.status === 'HD' ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {record.status}
                                                        </span>
                                                        {userRole === 'SuperAdmin' && (
                                                            <button
                                                                onClick={() => handleDeletePhoto(record.employeeId, record.date)}
                                                                className="text-xs text-red-600 hover:underline"
                                                                title="Delete Photo"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* No Photos Message */}
                                {(() => {
                                    const hasEmployeePhotos = employees.some(emp => {
                                        const matchesSite = selectedSiteFilter === 'all' || emp.siteId === selectedSiteFilter;
                                        return emp.photoUrl && matchesSite;
                                    });

                                    const hasAttendancePhotos = attendanceData.some(record => {
                                        if (!record.photoUrl) return false;
                                        const emp = employees.find(e => e.id === record.employeeId);
                                        if (!emp) return false;

                                        const matchesSite = selectedSiteFilter === 'all' || emp.siteId === selectedSiteFilter;
                                        const recordDate = new Date(record.date);
                                        const matchesMonth = recordDate.getMonth() + 1 === selectedMonth;
                                        const matchesYear = recordDate.getFullYear() === selectedYear;

                                        return matchesSite && matchesMonth && matchesYear;
                                    });

                                    if (!hasEmployeePhotos && !hasAttendancePhotos) {
                                        return (
                                            <div className="text-center py-12 text-gray-400">
                                                <Camera size={48} className="mx-auto mb-4 opacity-20" />
                                                <p className="text-lg font-medium">No photos found</p>
                                                <p className="text-sm">Try adjusting your filters or check back later</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                        )}
                        {activeTab === 'payroll' && (
                            <PayrollTab
                                employees={employees}
                                attendanceData={attendanceData}
                                sites={sites}
                                selectedMonth={selectedMonth}
                                selectedYear={selectedYear}
                                onMonthChange={setSelectedMonth}
                                onYearChange={setSelectedYear}
                                onExport={handleExportPayroll}
                            />
                        )}
                        {activeTab === 'ledger' && (
                            <LedgerTab
                                invoices={invoices}
                                sites={sites}
                                employees={employees}
                                attendanceData={attendanceData}
                                activeLedgerType={ledgerType}
                                userRole={userRole}
                            />
                        )}
                        {activeTab === 'users' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold">Admin User Management</h2>
                                    {userRole === 'SuperAdmin' && (
                                        <button onClick={() => setShowAddUserModal(true)} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                            <Plus size={18} /> Add Admin
                                        </button>
                                    )}
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border overflow-hidden overflow-x-auto">
                                    <table className="w-full text-left min-w-[800px]">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="p-4">User ID</th>
                                                <th className="p-4">Name</th>
                                                <th className="p-4">Email</th>
                                                <th className="p-4">Role</th>
                                                <th className="p-4">Trusted Devices</th>
                                                <th className="p-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.userId} className="border-b hover:bg-gray-50">
                                                    <td className="p-4 font-mono text-sm">{u.userId}</td>
                                                    <td className="p-4 font-bold">{u.name}</td>
                                                    <td className="p-4 text-gray-600">{u.email}</td>
                                                    <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold uppercase">{u.role}</span></td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${u.trustedDevices?.length > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                                            {u.trustedDevices?.length || 0} Devices
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleRevokeTrust(u.userId)}
                                                            className="px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded text-xs font-bold flex items-center gap-1"
                                                            title="Log out from all devices"
                                                        >
                                                            <LogOut size={14} /> Revoke Trust
                                                        </button>
                                                        {u.userId !== 'nandani' && (
                                                            <button
                                                                onClick={() => handleDeleteUser(u.userId)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                                                                title="Delete User"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {users.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-500">No users found</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {activeTab === 'supervisor-logs' && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold">Supervisor Location Logs</h2>
                                    <button onClick={async () => setLocationLogs(await getLocationLogs())} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                        <RotateCcw size={18} /> Refresh
                                    </button>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border overflow-hidden overflow-x-auto">
                                    <table className="w-full text-left min-w-[800px]">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="p-4">Date</th>
                                                <th className="p-4">Supervisor</th>
                                                <th className="p-4">Site</th>
                                                <th className="p-4">First In</th>
                                                <th className="p-4">Last Out</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {processLocationLogs(locationLogs).map(group => (
                                                <tr key={group.id} className="border-b hover:bg-gray-50">
                                                    <td className="p-4 text-sm text-gray-600">{group.date}</td>
                                                    <td className="p-4 font-bold">{group.supervisorName}</td>
                                                    <td className="p-4">{group.siteName}</td>
                                                    <td className="p-4">
                                                        {group.firstInTs > 0 ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800">
                                                                    {new Date(group.firstInTs).toLocaleTimeString()}
                                                                </span>
                                                                {group.firstInLocation && (
                                                                    <a
                                                                        href={`https://www.google.com/maps/search/?api=1&query=${group.firstInLocation.latitude},${group.firstInLocation.longitude}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-blue-600 hover:text-blue-800"
                                                                        title="View on Google Maps"
                                                                    >
                                                                        <MapPin size={16} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ) : <span className="text-gray-400">-</span>}
                                                    </td>
                                                    <td className="p-4">
                                                        {group.lastOutTs > 0 ? (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => setSelectedSupervisorLog({
                                                                        date: group.date,
                                                                        supervisorName: group.supervisorName,
                                                                        logs: group.allLogs
                                                                    })}
                                                                    className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800 hover:bg-red-200 underline"
                                                                >
                                                                    {new Date(group.lastOutTs).toLocaleTimeString()}
                                                                </button>
                                                                {group.lastOutLocation && (
                                                                    <a
                                                                        href={`https://www.google.com/maps/search/?api=1&query=${group.lastOutLocation.latitude},${group.lastOutLocation.longitude}`}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="text-blue-600 hover:text-blue-800"
                                                                        title="View on Google Maps"
                                                                    >
                                                                        <MapPin size={16} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ) : <span className="text-gray-400">-</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                            {locationLogs.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500">No logs found</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                        {activeTab === 'device-history' && (userRole === 'Admin' || userRole === 'SuperAdmin') && (
                            <div className="space-y-6 animate-in fade-in">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-2xl font-bold">Device History</h2>
                                    <button onClick={async () => setSites(await getSites())} className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2">
                                        <RotateCcw size={18} /> Refresh
                                    </button>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50 border-b">
                                            <tr>
                                                <th className="p-4">Site / Supervisor</th>
                                                <th className="p-4">Username</th>
                                                <th className="p-4">Bound Device</th>
                                                <th className="p-4">Device Model</th>
                                                <th className="p-4">Status</th>
                                                <th className="p-4">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sites.filter(s => s.username).map(site => (
                                                <tr key={site.id} className="border-b hover:bg-gray-50">
                                                    <td className="p-4 font-bold">{site.name}</td>
                                                    <td className="p-4 font-mono text-sm text-gray-600">{site.username}</td>
                                                    <td className="p-4 font-mono text-xs text-gray-500">{site.deviceId || '-'}</td>
                                                    <td className="p-4 text-sm">{site.deviceName || '-'}</td>
                                                    <td className="p-4">
                                                        {site.deviceId ? (
                                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                                                <CheckCircle size={12} /> Active
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
                                                                Unbound
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        {site.deviceId && (userRole === 'SuperAdmin' || userRole === 'Admin') && (
                                                            <button
                                                                onClick={async () => {
                                                                    if (confirm(`Revoke device access for ${site.name}? They will need to login again.`)) {
                                                                        await revokeSupervisorDevice(site.id);
                                                                        setSites(await getSites());
                                                                    }
                                                                }}
                                                                className="text-red-600 hover:text-red-800 text-sm font-bold hover:underline"
                                                            >
                                                                Revoke Access
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {sites.filter(s => s.username).length === 0 && (
                                                <tr><td colSpan={6} className="p-8 text-center text-gray-500">No supervisor accounts found</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {selectedSupervisorLog && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200 max-h-[80vh] flex flex-col">
                            <div className="bg-primary px-6 py-4 flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="text-white font-bold">Supervisor Location History</h3>
                                    <p className="text-white/80 text-xs">{selectedSupervisorLog.supervisorName} • {selectedSupervisorLog.date}</p>
                                </div>
                                <button onClick={() => setSelectedSupervisorLog(null)} className="text-white/80 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="p-0 overflow-y-auto flex-1">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b sticky top-0">
                                        <tr>
                                            <th className="p-4">Time</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Location</th>
                                            <th className="p-4">Map</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedSupervisorLog.logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => (
                                            <tr key={log._id} className="border-b hover:bg-gray-50">
                                                <td className="p-4 font-mono text-sm">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.status === 'In Range' || log.status === 'In-Range' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-xs text-gray-600">
                                                    {(log.latitude || log.location?.latitude || 0).toFixed(6)}, {(log.longitude || log.location?.longitude || 0).toFixed(6)}
                                                </td>
                                                <td className="p-4">
                                                    <a
                                                        href={`https://www.google.com/maps/search/?api=1&query=${log.latitude || log.location?.latitude || 0},${log.longitude || log.location?.longitude || 0}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                                    >
                                                        <MapPin size={14} /> View
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border-t bg-gray-50 text-right">
                                <button onClick={() => setSelectedSupervisorLog(null)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-bold text-gray-700">Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {showAddUserModal && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                            <div className="bg-primary px-6 py-4 flex justify-between items-center">
                                <h3 className="text-white font-bold">Add New Admin</h3>
                                <button onClick={() => setShowAddUserModal(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleAddUser} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID (Username)</label>
                                    <input name="userId" placeholder="e.g. ambe" className="w-full border rounded-lg px-3 py-2" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input name="name" placeholder="e.g. Ambe Admin" className="w-full border rounded-lg px-3 py-2" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input name="email" type="email" placeholder="admin@example.com" className="w-full border rounded-lg px-3 py-2" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
                                    <input name="photo" type="file" accept="image/*" className="w-full border rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input name="password" type="text" defaultValue="" placeholder="Enter a secure password" className="w-full border rounded-lg px-3 py-2 bg-gray-50" />
                                    <p className="text-xs text-gray-500 mt-1">Please set a secure password for the account.</p>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setShowAddUserModal(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90">Create Admin</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {attendanceModalOpen && selectedAttendance && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col animate-in zoom-in duration-200 overflow-hidden">
                            <div className="bg-primary px-6 py-4 flex justify-between items-center shrink-0">
                                <h3 className="text-white font-bold">Update Attendance</h3>
                                <button onClick={() => setAttendanceModalOpen(false)} className="text-white/80 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                                {selectedAttendance.photoUrl && (
                                    <div className="mb-6 -mx-6 -mt-6 bg-black relative">
                                        <div className="w-full flex justify-center bg-black">
                                            <img
                                                src={getSafePhotoUrl(selectedAttendance.photoUrl)}
                                                className="w-full h-auto max-h-[500px] object-contain"
                                                alt="Attendance"
                                                onError={handleImageError}
                                            />
                                        </div>

                                        <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                                            {selectedAttendance.timestamp && (
                                                <div className="bg-black/60 backdrop-blur-md text-white/90 text-xs px-2 py-1 rounded border border-white/20 font-mono shadow-lg">
                                                    {new Date(selectedAttendance.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                            <div className="bg-green-500 text-white text-xs px-2.5 py-1 rounded font-bold shadow-lg flex items-center gap-1.5 border border-white/20">
                                                <CheckCircle size={12} /> Verified
                                            </div>
                                        </div>

                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 pt-12">
                                            <p className="text-xs font-medium text-white/80 mb-0.5">Employee</p>
                                            <p className="text-2xl font-bold text-white shadow-sm">{selectedAttendance.empName}</p>
                                        </div>
                                    </div>
                                )}

                                {userRole === 'SuperAdmin' && selectedAttendance.photoUrl && (
                                    <div className="flex justify-end px-4 mb-4 -mt-2">
                                        <button
                                            onClick={() => handleDeletePhoto(selectedAttendance.empId, selectedAttendance.date)}
                                            className="text-red-500 text-xs hover:bg-red-50 px-2 py-1.5 rounded flex items-center gap-1 transition-colors border border-transparent hover:border-red-100"
                                        >
                                            <Trash2 size={14} /> Delete Photo
                                        </button>
                                    </div>
                                )}

                                <div className="mb-6 flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div className="bg-white p-2.5 rounded-lg text-gray-500 shadow-sm border border-gray-100">
                                        <CalendarDays size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Attendance Date</p>
                                        <p className="font-bold text-gray-900 text-lg">{new Date(selectedAttendance.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 pb-4">
                                    <button onClick={() => saveManualAttendance('P')} className="bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 py-3 rounded-lg font-bold">Present (P)</button>
                                    <button onClick={() => saveManualAttendance('A')} className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 py-3 rounded-lg font-bold">Absent (A)</button>
                                    <button onClick={() => saveManualAttendance('HD')} className="bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 py-3 rounded-lg font-bold">Half Day (HD)</button>
                                    <button onClick={() => saveManualAttendance('W/O')} className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 py-3 rounded-lg font-bold">Weekly Off</button>
                                    <button onClick={() => saveManualAttendance('WOP')} className="bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 py-3 rounded-lg font-bold">Weekoff Present</button>
                                    <button onClick={() => saveManualAttendance(null)} className="col-span-2 bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100 py-3 rounded-lg font-bold flex items-center justify-center gap-2">
                                        <RotateCcw size={16} /> Clear / Reset
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showPhotoGallery && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-[80vh] flex flex-col animate-in zoom-in duration-200">
                            <div className="bg-primary px-6 py-4 flex justify-between items-center shrink-0">
                                <h3 className="text-white font-bold flex items-center gap-2"><Camera size={20} /> Photo Gallery</h3>
                                <button onClick={() => setShowPhotoGallery(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {attendanceData.filter(r => r.photoUrl).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => {
                                    const emp = employees.find(e => e.id === record.employeeId);
                                    const site = sites.find(s => s.id === emp?.siteId);
                                    return (
                                        <div key={record.id} className="bg-gray-50 rounded-lg border p-3 hover:shadow-md transition-shadow">
                                            <div className="aspect-square rounded-lg overflow-hidden mb-3 border bg-white relative group">
                                                <img src={getSafePhotoUrl(record.photoUrl)} className="w-full h-full object-cover" onError={handleImageError} loading="lazy" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                <a
                                                    href={extractCloudinaryPublicId(record.photoUrl) && !record.photoUrl?.startsWith('data:') ? `${API_URL}/download/image/${extractCloudinaryPublicId(record.photoUrl)}` : getSafePhotoUrl(record.photoUrl)}
                                                    download={!(extractCloudinaryPublicId(record.photoUrl) && !record.photoUrl?.startsWith('data:')) ? `${emp?.name?.replace(/\s+/g, '_') || 'attendance'}_${record.date}.png` : undefined}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="absolute bottom-2 right-2 bg-white/90 p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-blue-600"
                                                >
                                                    <Download size={14} />
                                                </a>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-bold text-sm truncate" title={emp?.name}>{emp?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1"><CalendarDays size={10} /> {record.date}</div>
                                                <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} /> {site?.name || 'Unknown Site'}</div>
                                                <div className="mt-2 pt-2 border-t flex justify-between items-center">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${record.status === 'P' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                                        {record.status}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        {userRole === 'SuperAdmin' && (
                                                            <button
                                                                onClick={() => handleDeletePhoto(record.employeeId, record.date)}
                                                                className="text-[10px] text-red-600 hover:underline"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setShowPhotoGallery(false);
                                                                if (emp) {
                                                                    const day = parseInt(record.date.split('-')[2]);
                                                                    handleCellClick(emp, day);
                                                                }
                                                            }}
                                                            className="text-[10px] text-blue-600 hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {attendanceData.filter(r => r.photoUrl).length === 0 && (
                                    <div className="col-span-full text-center py-12 text-gray-400">
                                        <Camera size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>No photos found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <EditInvoiceModal isOpen={showInvoiceModal} invoice={editingInvoice} onClose={() => setShowInvoiceModal(false)} onSave={handleSaveInvoice} />
                <EditEmployeeModal
                    isOpen={showEmployeeModal}
                    employee={editingEmployee}
                    onClose={() => setShowEmployeeModal(false)}
                    onSave={handleSaveEmployee}
                    defaultSiteId={selectedSiteFilter}
                />
                <AddSiteModal isOpen={showSiteModal} site={editingSite} onClose={() => setShowSiteModal(false)} onSave={handleSaveSite} />

                {showProfileModal && user && (
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
                            <div className="bg-primary px-6 py-4 flex justify-between items-center">
                                <h3 className="text-white font-bold">Edit Profile</h3>
                                <button onClick={() => setShowProfileModal(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID (Username)</label>
                                    <input name="userId" defaultValue={user.userId} className="w-full border rounded-lg px-3 py-2 bg-gray-50" readOnly title="Cannot change User ID directly" />
                                    <p className="text-xs text-gray-500 mt-1">User ID cannot be changed.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input name="name" defaultValue={user.name} className="w-full border rounded-lg px-3 py-2" required />
                                </div>
                                <div className="border-t pt-4 mt-2">
                                    <h4 className="text-sm font-bold text-gray-800 mb-3">Change Password</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                            <input name="password" type="password" placeholder="Leave blank to keep current" className="w-full border rounded-lg px-3 py-2" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                            <input name="confirmPassword" type="password" placeholder="Confirm new password" className="w-full border rounded-lg px-3 py-2" />
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <button type="button" onClick={() => setShowProfileModal(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
                                    <button type="submit" className="flex-1 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90">Save Changes</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <GenerateBillModal
                    isOpen={showBillModal}
                    onClose={() => setShowBillModal(false)}
                    employees={employees}
                    attendanceData={attendanceData}
                    sites={sites}
                    selectedMonth={selectedMonth}
                    selectedYear={selectedYear}
                    onSave={async (invoice) => {
                        try {
                            await addInvoice(invoice);
                            setInvoices(await getInvoices());
                            alert("Invoice saved successfully!");
                            if (invoice.invoiceNo.startsWith('PI') || invoice.status === 'Pending Approval') {
                                setActiveTabAndHash('invoices-proforma');
                            } else {
                                setActiveTabAndHash('invoices-tax');
                            }
                        } catch (err) {
                            console.error("Failed to save invoice:", err);
                            alert("Failed to save invoice record.");
                        }
                    }}
                />
                <QuickDeductionsModal
                    isOpen={showDeductionModal}
                    employee={deductionEmployee}
                    onClose={() => setShowDeductionModal(false)}
                    onSave={handleSaveDeductions}
                />
            </div>
        </div>
    );
};

export default AdminWebApp;