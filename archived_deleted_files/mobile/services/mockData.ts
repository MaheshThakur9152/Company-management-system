
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Employee, Invoice, Site, AttendanceRecord, DashboardStats, InvoiceItem, ManualLedgerEntry } from '../types';

// Empty arrays as placeholders to avoid breaking imports, but data should be fetched via API
export const MOCK_SITES: Site[] = [];
export const MOCK_EMPLOYEES: Employee[] = [];
export const MOCK_INVOICES: Invoice[] = [];

export const MOCK_STATS: DashboardStats = {
    totalUnpaid: 0,
    activeSites: 0,
    totalWorkers: 0,
    revenue: 0
};

export const CHART_DATA = [
    { name: 'Jul', revenue: 120000 },
    { name: 'Aug', revenue: 150000 },
    { name: 'Sep', revenue: 180000 },
    { name: 'Oct', revenue: 140000 },
    { name: 'Nov', revenue: 185000 },
];

// --- Simulated Backend Logic using AsyncStorage ---
// REPLACED WITH REAL BACKEND API CALLS

const API_URL = 'http://192.168.1.96:3000/api'; // Use LAN IP for physical device/emulator

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
        const data = await AsyncStorage.getItem('server_ledger_db_v3');
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
};

export const addManualLedgerEntry = async (entry: ManualLedgerEntry): Promise<boolean> => {
    try {
        const current = await getManualLedgerEntries();
        current.push(entry);
        await AsyncStorage.setItem('server_ledger_db_v3', JSON.stringify(current));
        return true;
    } catch (e) {
        return false;
    }
};

export const updateManualLedgerEntry = async (entry: ManualLedgerEntry): Promise<boolean> => {
    try {
        const current = await getManualLedgerEntries();
        const updated = current.map(e => e.id === entry.id ? entry : e);
        await AsyncStorage.setItem('server_ledger_db_v3', JSON.stringify(updated));
        return true;
    } catch (e) {
        return false;
    }
};

export const deleteManualLedgerEntry = async (id: string): Promise<boolean> => {
    try {
        const current = await getManualLedgerEntries();
        const updated = current.filter(e => e.id !== id);
        await AsyncStorage.setItem('server_ledger_db_v3', JSON.stringify(updated));
        return true;
    } catch (e) {
        return false;
    }
};
