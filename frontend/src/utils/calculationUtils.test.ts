
import { describe, it, expect } from 'vitest';
import { calculateBillableDays, computeLineAmount, computeFooterTotals, getHeaderKey } from './calculationUtils';

describe('calculationUtils', () => {
    describe('calculateBillableDays', () => {
        it('should count P as 1', () => {
            expect(calculateBillableDays([{ date: '1', code: 'P' }], 30)).toBe(1);
        });
        it('should count WO as 1', () => {
            expect(calculateBillableDays([{ date: '1', code: 'WO' }], 30)).toBe(1);
        });
        it('should count WO-P as 2', () => {
            expect(calculateBillableDays([{ date: '1', code: 'WO-P' }], 30)).toBe(2);
        });
        it('should count A as 0', () => {
            expect(calculateBillableDays([{ date: '1', code: 'A' }], 30)).toBe(0);
        });
        it('should cap at monthDays', () => {
            const entries = Array(32).fill({ date: 'x', code: 'P' });
            expect(calculateBillableDays(entries, 30)).toBe(30);
        });
    });

    describe('computeLineAmount', () => {
        it('should compute rate * days * persons (daily rate)', () => {
            expect(computeLineAmount(100, 5, 2)).toBe(1000);
        });
        it('should default persons to 1', () => {
            expect(computeLineAmount(100, 5)).toBe(500);
        });
        it('should compute pro-rata monthly (rate / monthDays * days)', () => {
            // 17500 / 31 * 26 * 1 = 14677.419...
            const val = computeLineAmount(17500, 26, 1, 31);
            expect(val).toBeCloseTo(14677.41935, 4);
        });
        it('should fallback to daily if monthDays is 0', () => {
            expect(computeLineAmount(100, 5, 1, 0)).toBe(500);
        });
    });

    describe('getHeaderKey', () => {
        it('should map standard headers correctly', () => {
            expect(getHeaderKey('Sr No')).toBe('sr_no');
            expect(getHeaderKey('Description of Services')).toBe('description');
            expect(getHeaderKey('HSN Code')).toBe('hsn');
            expect(getHeaderKey('Rate')).toBe('rate');
            expect(getHeaderKey('Working Days')).toBe('working_days');
            expect(getHeaderKey('Persons')).toBe('persons');
            expect(getHeaderKey('Amount (RS)')).toBe('amount');
        });
        it('should be case insensitive', () => {
            expect(getHeaderKey('amount')).toBe('amount');
        });
        it('should handle fuzzy matches', () => {
            expect(getHeaderKey('Total Amount (RS)')).toBe('amount'); // includes 'amount'
            expect(getHeaderKey('Description')).toBe('description');
        });
        it('should return null for unknown', () => {
            expect(getHeaderKey('Random Header')).toBeNull();
        });
    });
});
