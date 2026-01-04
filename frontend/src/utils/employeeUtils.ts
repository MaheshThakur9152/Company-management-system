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

  const reportMonthStart = new Date(year, month - 1, 1);

  let activeUntil: Date | null = null;
  if (e.leavingDate) {
    activeUntil = new Date(e.leavingDate);
  } else if (e.status === 'Inactive') {
    // If no explicit leavingDate but status is Inactive, treat them as active only through the end of the current month
    const today = new Date();
    activeUntil = new Date(today.getFullYear(), today.getMonth() + 1, 0); // last day of current month
  }

  if (activeUntil) {
    // If they stopped being active before the start of the report month, they should not be included
    if (activeUntil < reportMonthStart) return false;
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
export function computeWorkingDaysForEmployee(records: AttendanceRecord[], e: Employee, month: number, year: number) {
  const daysInMonth = getDaysInMonth(month, year);
  const breakdown = { present: 0, absent: 0, weekoff: 0, hd: 0, ph: 0, other: 0 };
  let workingDays = 0;

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
    const rec = records.find(r => {
      const rd = new Date(r.date);
      return rd.getFullYear() === dateObj.getFullYear() && rd.getMonth() === dateObj.getMonth() && rd.getDate() === dateObj.getDate();
    });

    const isWeekoff = dateObj.getDay() === weeklyOffIdx;

    if (!rec) {
      // No record: do not change workingDays
      continue;
    }

    switch (rec.status) {
      case 'P':
        if (isWeekoff) {
          workingDays += 2; // present on weekoff counts double
          breakdown.present += 1;
          breakdown.weekoff += 1;
        } else {
          workingDays += 1;
          breakdown.present += 1;
        }
        break;
      case 'A':
        workingDays -= 1;
        breakdown.absent += 1;
        break;
      case 'W/O':
        workingDays += 1;
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
        // WOE, WOP, Leave, etc. Treat as 1 by default except Leave which is 0
        if (rec.status === 'Leave') {
          // No addition
        } else {
          workingDays += 1;
          breakdown.other += 1;
        }
        break;
    }
  }

  return { workingDays, breakdown, daysInMonth };
}
