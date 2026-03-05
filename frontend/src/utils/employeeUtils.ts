import { Employee, AttendanceRecord } from '@types';

/**
 * Determine whether an employee should be considered active for the given report month/year.
 * - If employee.status === 'Deleted' -> not active
 * - If employee.leavingDate is present -> they are active up to that date (inclusive). If leavingDate < reportMonthStart => not active
 * - If employee.status === 'Inactive' and no leavingDate -> treat them as active through the end of the current month
 *
 * Months are 1-based (1 = January)
 */
export function isEmployeeActiveForMonth(e: Employee, month: number, year: number): boolean {
  if (!e) return false;
  if (e.status === 'Deleted') return false;

  // Report Month Start (Local Beginning of Day)
  const reportMonthStart = new Date(year, month - 1, 1, 0, 0, 0, 0);

  let activeUntil: Date | null = null;

  if (e.leavingDate) {
    // Robust parsing for YYYY-MM-DD to avoid UTC conversion issues
    if (typeof e.leavingDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.leavingDate)) {
      const [y, m, d] = e.leavingDate.split('-').map(Number);
      // Create Local Date at End of Day (23:59:59.999)
      activeUntil = new Date(y, m - 1, d, 23, 59, 59, 999);
    } else {
      // Fallback for other formats (Date object or non-standard string)
      activeUntil = new Date(e.leavingDate);
      activeUntil.setHours(23, 59, 59, 999);
    }
  } else if (e.status === 'Inactive') {
    // Inactive but no date: Assume inactive "as of today" to prevent ghosting in future months,
    // but keep visible in current/past months.
    const today = new Date();
    activeUntil = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
  } else if (e.status === 'On Leave') {
    // Employees on leave should ALWAYS be visible in the list, 
    // because they are technically still employed and might return any time.
    return true;
  }

  if (activeUntil) {
    // If the employee left BEFORE the 1st of the requested month, return false (Hidden).
    if (activeUntil.getTime() < reportMonthStart.getTime()) {
      // EXCEPTION: If they are "On Leave", we want them to stay visible in the sheet 
      // regardless of the date they started their leave.
      if (e.status === 'On Leave') {
        return true;
      }
      return false;
    }
  }

  return true;
}

/**
 * Return number of days in a month (month 1-12)
 */
export function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Compute working days for an employee for a given month/year using site rules:
 * - Present (P) => +1 working day
 * - Absent (A) => -1 working day
 * - Weekoff (W/O) => +1 working day
 * - Weekoff but Present (date falls on employee.weeklyOff and status === 'P') => +2 working days
 * - Half Day (HD) => +0.5
 * - Public Holiday (PH) => +1
 * - Other statuses are treated conservatively (0 or as indicated)
 *
 * Only records present in `records` are considered; days with no record are ignored.
 * Returns { workingDays: number, breakdown: { present, absent, weekoff, hd, ph, other } }
 */
export function computeWorkingDaysForEmployee(records: AttendanceRecord[], e: Employee, month: number, year: number, isPayroll: boolean = false) {
  const daysInMonth = getDaysInMonth(month, year);
  const breakdown = { present: 0, absent: 0, weekoff: 0, hd: 0, ph: 0, other: 0 };
  let workingDays = 0;

  // Build a Map to ensure we use the latest record for each date, consistent with AdminWebApp grid logic
  const recordMap = new Map<string, AttendanceRecord>();
  records.forEach(r => {
    if (r.date) recordMap.set(r.date, r);
  });

  const weekDayMap: Record<string, number> = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };
  const weeklyOffIdx = weekDayMap[e.weeklyOff || 'Sunday'] ?? 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month - 1, d);
    const targetDateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const rec = recordMap.get(targetDateStr);

    const isWeekoff = dateObj.getDay() === weeklyOffIdx;

    if (!rec) {
      // No record: do not change workingDays
      continue;
    }

    switch (rec.status) {
      case 'P':
        // If explicitly marked P on a weekoff day in the system without WOP status, it's still double?
        // Usually the system marks it as WOP. But if it's P and it isWeekoff, let's count as 2 to be safe/generous, 
        // or strictly follow status. Let's strictly follow status but handle the P on W/O edge case if needed.
        // Assuming 'P' means standard working day present.
        if (isWeekoff) {
          workingDays += 2;
          breakdown.present += 1;
          breakdown.weekoff += 1;
        } else {
          workingDays += 1;
          breakdown.present += 1;
        }
        break;
      case 'WOP': // Week Off Present - Explicit status
        workingDays += 2;
        breakdown.present += 1;
        breakdown.weekoff += 1; // It counts as both weekoff benefit + working
        break;
      case 'A':
        // Absent should NOT subtract from 0 if we are summing up working days. 
        // We are calculating "Days to be Paid". 
        // If I am absent, I get 0 pay for that day. I don't get -1 pay.
        // PREVIOUS BUG: workingDays -= 1; 
        workingDays += 0;
        breakdown.absent += 1;
        break;
      case 'W/O':
        // Standard Week Off - Paid Leave
        // For Payroll, Week Offs are generally UNPAID (0) unless marked otherwise (e.g., PH or P).
        // For Billing/Proforma, Week Offs are counted as Billable (1).
        workingDays += isPayroll ? 0 : 1;
        breakdown.weekoff += 1;
        break;
      case 'HD':
        workingDays += 0.5;
        breakdown.hd += 1;
        break;
      case 'PH':
        workingDays += 1;
        breakdown.ph += 1;
        break;
      default:
        // For other statuses, if it's 'Leave', it's 0 (unless paid leave, but 'Leave' usually implies approved unpaid or deducted elsewhere).
        // Let's assume neutral 0 for unknown statuses to be safe, unless explicitly mapped.
        if (rec.status === 'Leave') {
          workingDays += 0;
        } else {
          // Fallback
          // If it's something like "Site Closed" or similar paid event? 
          // Better to count 0 to avoid overpayment bugs.
          workingDays += 0;
          breakdown.other += 1;
        }
        break;
    }
  }

  return { workingDays, breakdown, daysInMonth };
}
