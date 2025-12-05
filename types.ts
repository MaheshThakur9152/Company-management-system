
export type Role = 'admin' | 'superadmin' | 'boss' | 'supervisor';

export interface User {
  userId: string;
  name: string;
  role: Role;
  assignedSites?: string[];
  email: string;
}

export interface Site {
  id: string;
  name: string; // Project Name
  location: string; // Address
  activeWorkers: number;
  latitude: number; // Geofence center
  longitude: number; // Geofence center
  geofenceRadius: number; // In meters
  
  // Detailed Client Info
  clientName?: string;
  clientGstin?: string;
  clientEmail?: string;
  clientContact?: string;

  // Work Order & Billing Info
  workOrderNo?: string;
  workOrderDate?: string; // Start Date
  workOrderEndDate?: string; // Expiry Date
  billingRate?: number; // Rate used for bill
  companyName?: 'AMBE SERVICE' | 'AMBE SERVICE FACILITIES PRIVATE LIMITED';
  status?: 'Active' | 'Pending' | 'Deleted';
}

export interface Employee {
  id: string;
  biometricCode: string;
  name: string;
  role: 'Janitor' | 'Key Supervisor' | 'Security';
  siteId: string;
  photoUrl: string;
  weeklyOff: string;
  status: 'Active' | 'Inactive' | 'Stopped' | 'Pending' | 'Deleted';
  stoppedDate?: string;
  leavingDate?: string;
  joiningDate: string;
  aadharNumber?: string;
  panNumber?: string;
  bankDetails?: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName?: string;
  };
  salaryDetails?: {
    baseSalary?: number;
    isDailyRated?: boolean;
    dailyRateOverride?: number;
    deductionBreakdown?: {
      advance?: number;
      uniform?: number;
      shoes?: number;
      idCard?: number;
      cbre?: number;
      others?: number;
    };
    allowancesBreakdown?: {
      travelling?: number;
      others?: number;
    };
    // Legacy fields
    basic?: number;
    hra?: number;
    conveyance?: number;
    allowances?: number;
    deductions?: number;
    netSalary?: number;
    paymentType?: 'Daily' | 'Monthly';
  };
}

export type AttendanceStatus = 'P' | 'A' | 'W/O' | 'HD' | 'Leave' | 'WOE' | 'HDE' | 'PH' | 'WOP';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName?: string;
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  photoUrl?: string; // Base64 string
  location?: { lat: number; lng: number; address?: string };
  siteId?: string;
  siteName?: string;
  deviceId?: string;
  type?: 'IN' | 'OUT';
  isSynced: boolean;
  isLocked: boolean; // Prevents editing after sync
  remarks?: string;
  overtimeHours?: number;
  supervisorName?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  rate: number;
  days: number;
  persons: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  siteId: string;
  siteName: string;
  billingPeriod: string;
  items: InvoiceItem[]; // Detailed line items
  
  // Calculation Fields
  subTotal: number;
  managementRate?: number; // Percentage (e.g., 7)
  managementAmount?: number; // Calculated
  materialCharges?: number; // Fixed amount
  taxableAmount?: number; // Base for Tax
  
  cgst: number;
  sgst: number;
  amount: number; // Grand Total
  
  status: 'Paid' | 'Unpaid' | 'Approved' | 'Pending Approval' | 'Pending Payment';
  dueDate: string;
  generatedDate: string;
  paymentDate?: string; // Date when status changed to Paid
}

export interface DashboardStats {
  totalUnpaid: number;
  activeSites: number;
  totalWorkers: number;
  revenue: number;
}

export interface ManualLedgerEntry {
  id: string;
  siteId: string;
  date: string;
  particulars: string;
  vchType: string;
  vchNo: string;
  debit: number;
  credit: number;
  status?: 'Pending' | 'Approved' | 'Rejected';
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  netSalary: number;
  grossSalary?: number;
  totalDeductions?: number;
  breakdown?: any;
  status: 'Paid' | 'Unpaid';
  paymentDate?: string;
  complianceStatus: 'Compliant' | 'Non-Compliant' | 'Pending';
  complianceRemarks?: string;
}

export interface LocationLog {
  _id: string;
  supervisorName: string;
  status: 'In Range' | 'Out of Range';
  siteName: string;
  siteId?: string;
  timestamp: string;
  location: {
    latitude: number;
    longitude: number;
  };
  deviceId: string;
}
