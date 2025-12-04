
import { Employee, Invoice, Site, AttendanceRecord, DashboardStats, InvoiceItem, ManualLedgerEntry, SalaryRecord } from '../types';

export const MOCK_SITES: Site[] = [];

// Helper to generate employees
const createEmp = (id: string, code: string, name: string, siteId: string, role: any = 'Janitor', baseSalary: number = 15000, isDailyRated: boolean = false): Employee => ({
  id, biometricCode: code, name, role, siteId, 
  photoUrl: `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`, 
  weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
  salaryDetails: {
    baseSalary: baseSalary,
    isDailyRated: isDailyRated,
    dailyRateOverride: isDailyRated ? baseSalary : 0, // If daily rated, baseSalary param is treated as daily rate
    deductionBreakdown: {
        advance: 0,
        uniform: 0,
        shoes: 0,
        idCard: 0,
        cbre: 0,
        others: 0
    },
    // Legacy fields
    basic: baseSalary * 0.6,
    hra: baseSalary * 0.2,
    conveyance: baseSalary * 0.1,
    allowances: baseSalary * 0.1,
    deductions: 0,
    netSalary: baseSalary,
    paymentType: isDailyRated ? 'Daily' : 'Monthly'
  }
});

export const MOCK_EMPLOYEES: Employee[] = [];

export const MOCK_INVOICES: Invoice[] = [];

export const MOCK_STATS: DashboardStats = {
  totalUnpaid: 0,
  activeSites: 0,
  totalWorkers: 0,
  revenue: 0
};

export const CHART_DATA = [];

// --- Simulated Backend Logic using LocalStorage (FALLBACK) ---
// REPLACED WITH REAL BACKEND API CALLS

export const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://api.ambeservice.com/api' : '/api');

async function apiCall<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    try {
        const headers: any = { 'Content-Type': 'application/json' };
        const config: any = { method, headers, credentials: 'include' };
        
        // Add Authorization header if token exists
        const token = localStorage.getItem('authToken');
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        
        if (body) config.body = JSON.stringify(body);
        
        const response = await fetch(`${API_URL}${endpoint}`, config);
        if (!response.ok) {
            // Try to parse error message from body
            let errorMessage = `API Error: ${response.status}`;
            try {
                const errorData = await response.json();
                if (errorData && errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                // Ignore JSON parse error, use default message
            }
            throw new Error(errorMessage);
        }
        return await response.json();
    } catch (error) {
        console.warn(`API Call Failed (${endpoint})`, error);
        throw error;
    }
}

export const getSharedAttendanceData = async (): Promise<AttendanceRecord[]> => {
    try {
        return await apiCall<AttendanceRecord[]>('/attendance');
    } catch (e) {
        return [];
    }
};

export const syncAttendanceData = async (localRecords: AttendanceRecord[]): Promise<boolean> => {
    try {
        await apiCall('/attendance/sync', 'POST', localRecords);
        return true;
    } catch (e) {
        return false;
    }
};

export const updateAttendanceRecord = async (record: AttendanceRecord): Promise<boolean> => {
    try {
        await apiCall('/attendance/sync', 'POST', [record]);
        return true;
    } catch (e) {
        return false;
    }
};

export const deleteAttendancePhoto = async (employeeId: string, date: string): Promise<boolean> => {
    try {
        await apiCall(`/attendance/photo/${employeeId}/${date}`, 'DELETE');
        return true;
    } catch (e) {
        return false;
    }
};

// --- INVOICES ---
export const getInvoices = async (): Promise<Invoice[]> => {
    try {
        return await apiCall<Invoice[]>('/invoices');
    } catch (e) {
        console.error("Failed to fetch invoices", e);
        return [];
    }
};

export const addInvoice = async (invoice: Invoice): Promise<boolean> => {
    try {
        await apiCall('/invoices', 'POST', invoice);
        return true;
    } catch (e) {
        return false;
    }
};

export const updateInvoice = async (updatedInvoice: Invoice): Promise<boolean> => {
    try {
        await apiCall(`/invoices/${updatedInvoice.id}`, 'PUT', updatedInvoice);
        return true;
    } catch (e) {
        return false;
    }
};

// --- EMPLOYEES ---
export const getEmployees = async (): Promise<Employee[]> => {
    try {
        return await apiCall<Employee[]>('/employees');
    } catch (e) {
        console.error("Failed to fetch employees", e);
        return [];
    }
};

export const addEmployee = async (employee: Employee): Promise<boolean> => {
    try {
        await apiCall('/employees', 'POST', employee);
        return true;
    } catch (e) {
        return false;
    }
};

export const updateEmployee = async (employee: Employee): Promise<boolean> => {
    try {
        await apiCall(`/employees/${employee.id}`, 'PUT', employee);
        return true;
    } catch (e) {
        return false;
    }
};

export const deleteEmployee = async (id: string): Promise<boolean> => {
    try {
        // In a real API, we would have a DELETE endpoint
        // For now, we'll just update the status to 'Deleted' via PUT if no DELETE endpoint exists
        // But let's assume we can just update it.
        // Ideally: await apiCall(`/employees/${id}`, 'DELETE');
        
        // Fetch to get current data (inefficient but safe for now)
        const emps = await getEmployees();
        const emp = emps.find(e => e.id === id);
        if (emp) {
            emp.status = 'Deleted';
            await updateEmployee(emp);
        }
        return true;
    } catch (e) {
        return false;
    }
};

// --- SITES ---
export const getSites = async (): Promise<Site[]> => {
    try {
        return await apiCall<Site[]>('/sites');
    } catch (e) {
        console.error("Failed to fetch sites", e);
        return [];
    }
};

export const addSite = async (site: Site): Promise<boolean> => {
    try {
        await apiCall('/sites', 'POST', site);
        return true;
    } catch (e) {
        return false;
    }
};

export const updateSite = async (site: Site): Promise<boolean> => {
    try {
        await apiCall(`/sites/${site.id}`, 'PUT', site);
        return true;
    } catch (e) {
        return false;
    }
};

export const deleteSite = async (id: string): Promise<boolean> => {
    try {
        const sites = await getSites();
        const site = sites.find(s => s.id === id);
        if (site) {
            site.status = 'Deleted';
            await updateSite(site);
        }
        return true;
    } catch (e) {
        return false;
    }
};

// --- MANUAL LEDGER ENTRIES ---
export const getManualLedgerEntries = async (): Promise<ManualLedgerEntry[]> => {
    try {
        return await apiCall<ManualLedgerEntry[]>('/ledger');
    } catch (e) {
        return [];
    }
};

export const addManualLedgerEntry = async (entry: ManualLedgerEntry): Promise<boolean> => {
    try {
        await apiCall('/ledger', 'POST', entry);
        return true;
    } catch (e) {
        return false;
    }
};

export const updateManualLedgerEntry = async (entry: ManualLedgerEntry): Promise<boolean> => {
    try {
        await apiCall(`/ledger/${entry.id}`, 'PUT', entry);
        return true;
    } catch (e) {
        return false;
    }
};

export const deleteManualLedgerEntry = async (id: string): Promise<boolean> => {
    try {
        await apiCall(`/ledger/${id}`, 'DELETE');
        return true;
    } catch (e) {
        return false;
    }
};

// --- SALARY RECORDS ---
export const getSalaryRecords = async (): Promise<SalaryRecord[]> => {
    try {
        return await apiCall<SalaryRecord[]>('/salary-records');
    } catch (e) {
        return [];
    }
};

export const updateSalaryRecord = async (record: SalaryRecord): Promise<boolean> => {
    try {
        await apiCall(`/salary-records/${record.id}`, 'PUT', record);
        return true;
    } catch (e) {
        return false;
    }
};

// --- USER MANAGEMENT (ADMINS) ---
export const getUsers = async (): Promise<any[]> => {
    try {
        return await apiCall<any[]>('/users');
    } catch (e) {
        console.error("Failed to fetch users", e);
        return [];
    }
};

export const addUser = async (user: any): Promise<boolean> => {
    try {
        await apiCall('/users', 'POST', user);
        return true;
    } catch (e) {
        console.error("Failed to add user", e);
        return false;
    }
};

export const deleteUser = async (userId: string): Promise<boolean> => {
    try {
        await apiCall(`/users/${userId}`, 'DELETE');
        return true;
    } catch (e) {
        console.error("Failed to delete user", e);
        return false;
    }
};

export const updateUser = async (userId: string, userData: any): Promise<any> => {
    try {
        return await apiCall(`/users/${userId}`, 'PUT', userData);
    } catch (e) {
        console.error("Failed to update user", e);
        throw e;
    }
};

export const revokeUserTrust = async (userId: string): Promise<boolean> => {
    try {
        await apiCall('/auth/revoke-trust', 'POST', { userId });
        return true;
    } catch (e) {
        console.error("Failed to revoke trust", e);
        return false;
    }
};

// --- AUTH ---
export const loginUser = async (email: string, password: string, deviceId?: string): Promise<any> => {
    try {
        return await apiCall('/login', 'POST', { email, password, deviceId });
    } catch (e) {
        throw e;
    }
};

export const sendOtp = async (username: string): Promise<boolean> => {
    try {
        await apiCall('/auth/send-otp', 'POST', { username });
        return true;
    } catch (e) {
        console.error("Failed to send OTP", e);
        return false;
    }
};

export const verifyOtp = async (username: string, otp: string, deviceId?: string): Promise<any> => {
    try {
        return await apiCall('/auth/verify-otp', 'POST', { username, otp, deviceId });
    } catch (e) {
        throw e;
    }
};

export const checkAuth = async (): Promise<any> => {
    try {
        return await apiCall('/auth/me', 'GET');
    } catch (e) {
        throw e;
    }
};

export const logoutUser = async (): Promise<boolean> => {
    try {
        await apiCall('/auth/logout', 'POST');
        return true;
    } catch (e) {
        console.error("Failed to logout", e);
        return false;
    }
};

export const revokeSupervisorDevice = async (siteId: string): Promise<boolean> => {
    try {
        await apiCall('/supervisor/revoke-device', 'POST', { siteId });
        return true;
    } catch (e) {
        console.error("Failed to revoke supervisor device", e);
        return false;
    }
};

// --- LOCATION LOGS ---
export const getLocationLogs = async (): Promise<any[]> => {
    try {
        return await apiCall<any[]>('/supervisor/location');
    } catch (e) {
        console.error("Failed to fetch location logs", e);
        return [];
    }
};

