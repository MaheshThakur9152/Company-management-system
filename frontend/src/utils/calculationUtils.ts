export type AttendanceCode = 'P' | 'WO' | 'A' | 'WO-P' | string;

export interface AttendanceEntry {
  date: string; // ISO date or day identifier
  code: AttendanceCode; // 'P', 'WO', 'A', 'WO-P'
}

/**
 * Calculate billable days for given attendance entries using rules:
 * P => +1
 * WO => +1
 * A => +0
 * WO-P => +2
 * Ensures final value does not exceed monthDays and not negative.
 */
export function calculateBillableDays(entries: AttendanceEntry[], monthDays: number): number {
  if (!Array.isArray(entries)) return 0;
  let total = 0;
  for (const e of entries) {
    const code = (e?.code || '').toString().trim().toUpperCase();
    switch (code) {
      case 'P':
        total += 1;
        break;
      case 'WO':
        total += 1;
        break;
      case 'WO-P':
      case 'WO P':
      case 'WOP':
        total += 2;
        break;
      case 'A':
      default:
        // Absent or unknown codes contribute 0
        break;
    }
  }
  // clamp to valid range
  if (total < 0) total = 0;
  if (monthDays && total > monthDays) total = monthDays;
  return total;
}

export function computeLineAmount(rate: number, billableDays: number, persons: number = 1, monthDays?: number): number {
  const r = Number(rate) || 0;
  const d = Number(billableDays) || 0;
  const p = Number(persons) || 1;
  const m = Number(monthDays) || 0;

  if (m > 0) {
    // Pro-rata monthly calculation: (Rate / MonthDays) * BillableDays * Persons
    return Math.round((r / m) * d * p);
  }
  // Default: Daily Rate calculation: Rate * BillableDays * Persons
  return Math.round(r * d * p);
}

export function computeFooterTotals(subtotal: number, managementRate = 15, cgstRate = 9, sgstRate = 9) {
  const mgmt = Math.round(subtotal * (managementRate / 100));
  const totalBeforeTax = Math.round(subtotal + mgmt);
  const cgst = Math.round(totalBeforeTax * (cgstRate / 100));
  const sgst = Math.round(totalBeforeTax * (sgstRate / 100));
  const grandTotal = Math.round(totalBeforeTax + cgst + sgst);
  return {
    management: mgmt,
    totalBeforeTax,
    cgst,
    sgst,
    grandTotal
  };
}

export function getHeaderKey(cellValue: string): string | null {
  const val = (cellValue || '').toLowerCase().trim();
  const map: Record<string, string> = {
    'sr no': 'sr_no', 'srno': 'sr_no', 's r no': 'sr_no',
    'description of services': 'description', 'description': 'description',
    'hsn code': 'hsn', 'hsn': 'hsn',
    'rate': 'rate',
    'working days': 'working_days', 'working day': 'working_days',
    'persons': 'persons',
    'amount (rs)': 'amount', 'amount': 'amount'
  };

  for (const k of Object.keys(map)) {
    if (val.includes(k)) return map[k];
  }
  return null;
}
