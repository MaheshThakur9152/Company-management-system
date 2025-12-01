
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Employee, Invoice, Site, AttendanceRecord, DashboardStats, InvoiceItem, ManualLedgerEntry } from '../types';

export const MOCK_SITES: Site[] = [];

// Helper to generate employees
const createEmp = (id: string, code: string, name: string, siteId: string, role: any = 'Janitor', baseSalary: number = 15000, isDailyRated: boolean = false): Employee => ({
    id, biometricCode: code, name, role, siteId,
    photoUrl: `https://ui-avatars.com/api/?name=${name.replace(' ', '+')}&background=random`,
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: {
        baseSalary: baseSalary,
        isDailyRated: isDailyRated,
        dailyRateOverride: isDailyRated ? baseSalary : 0,
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

// --- Simulated Backend Logic using AsyncStorage ---
// REPLACED WITH REAL BACKEND API CALLS

export const API_URL = 'http://192.168.1.96:3000/api'; // Use LAN IP for physical device/emulator

async function apiCall<T>(endpoint: string, method: string = 'GET', body?: any): Promise<T> {
    try {
        const headers: any = { 'Content-Type': 'application/json' };
        const config: any = { method, headers };
        if (body) config.body = JSON.stringify(body);
        
        const response = await fetch(`${API_URL}${endpoint}`, config);
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
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
        // We can use sync for single record update as well
        await apiCall('/attendance/sync', 'POST', [record]);
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
        // Soft delete via update
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
