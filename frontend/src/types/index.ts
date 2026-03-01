export type Role = 'admin' | 'superadmin' | 'boss' | 'supervisor';

export interface User {
  userId: string;
  name: string;
  role: Role;
  assignedSites?: string[];
  email: string;
  token?: string;
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
  attendanceGridName?: string;
  clientGstin?: string;
  clientEmail?: string;
  clientContact?: string;

  // Work Order & Billing Info
  workOrderNo?: string;
  workOrderDate?: string; // Start Date
  workOrderEndDate?: string; // Expiry Date
  billingRate?: number; // Rate used for bill
  managementRate?: number; // Management Fee %
  companyName?: 'AMBE SERVICE' | 'AMBE SERVICE FACILITIES PRIVATE LIMITED';
  status?: 'Active' | 'Pending' | 'Deleted';
  username?: string;
  password?: string;
}

export interface Employee {
  id: string;
  biometricCode: string;
  name: string;
  phone?: string;
  role: string;
  shift?: string; 
  siteId: string;
  photoUrl: string;
  weeklyOff: string;
  status: 'Active' | 'Inactive' | 'Stopped' | 'Pending' | 'Deleted' | 'On Leave' | 'Reliever';
  stoppedDate?: string;
  leavingDate?: string;
  returnDate?: string;
  leaveReason?: string;
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
  date: string;
  status: AttendanceStatus;
  checkInTime?: string;
  timestamp?: string;
  photoUrl?: string;
  location?: { lat: number; lng: number };
  isSynced: boolean;
  isLocked: boolean;
  remarks?: string;
  overtimeHours?: number;
}

export interface LocationLog {
  id: string;
  siteId: string;
  siteName?: string;
  supervisorName?: string;
  timestamp: string;
  status: string;
  location: {
    latitude: number;
    longitude: number;
  };
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
  siteId: string;
  siteName?: string;
  invoiceNo: string;
  billingPeriod?: string;
  generatedDate: string;
  dueDate?: string;
  items: InvoiceItem[];
  subTotal: number;
  managementRate?: number;
  managementAmount?: number;
  taxableAmount?: number;
  cgst: number;
  sgst: number;
  amount: number;
  status: 'Unpaid' | 'Paid' | 'Pending Payment' | 'Pending Approval' | 'Approved' | 'Pending' | 'Cancelled';
  materialCharges?: number;
  paymentDate?: string;
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
  manualPaidDays?: number;
  status: 'Paid' | 'Unpaid';
  paymentDate?: string;
  complianceStatus: 'Compliant' | 'Non-Compliant' | 'Pending';
  complianceRemarks?: string;
}
