import { calculateBillableDays, computeLineAmount, computeFooterTotals } from '../calculationUtils';

describe('calculationUtils', () => {
  test('calculateBillableDays - basic codes', () => {
    const entries = [
      { date: '2025-01-01', code: 'P' },
      { date: '2025-01-02', code: 'WO' },
      { date: '2025-01-03', code: 'A' },
      { date: '2025-01-04', code: 'WO-P' }
    ];
    const days = calculateBillableDays(entries, 31);
    // P(1) + WO(1) + A(0) + WO-P(2) = 4
    expect(days).toBe(4);
  });

  test('computeLineAmount', () => {
    expect(computeLineAmount(100, 10, 2)).toBe(2000);
    expect(computeLineAmount(0, 10)).toBe(0);
  });

  test('computeFooterTotals', () => {
    const res = computeFooterTotals(1000, 15, 9, 9);
    expect(res.management).toBeCloseTo(150);
    expect(res.totalBeforeTax).toBeCloseTo(1150);
    expect(res.cgst).toBeCloseTo(103.5);
    expect(res.sgst).toBeCloseTo(103.5);
    expect(res.grandTotal).toBeCloseTo(1357);
  });
});
