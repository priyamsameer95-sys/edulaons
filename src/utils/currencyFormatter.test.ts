
import { describe, it, expect } from 'vitest';
import {
    numberToWords,
    convertINRToWords,
    formatIndianNumber,
    parseFormattedNumber,
    formatIndianCurrency
} from './currencyFormatter';

describe('Currency Formatter Utility', () => {

    describe('numberToWords', () => {
        it('handles zero', () => {
            expect(numberToWords(0)).toBe('Zero');
        });

        it('handles single digits', () => {
            expect(numberToWords(5)).toBe('Five');
            expect(numberToWords(9)).toBe('Nine');
        });

        it('handles tens', () => {
            expect(numberToWords(10)).toBe('Ten');
            expect(numberToWords(15)).toBe('Fifteen');
            expect(numberToWords(25)).toBe('Twenty Five');
            expect(numberToWords(99)).toBe('Ninety Nine');
        });

        it('handles hundreds', () => {
            expect(numberToWords(100)).toBe('One Hundred');
            expect(numberToWords(105)).toBe('One Hundred Five');
            expect(numberToWords(550)).toBe('Five Hundred Fifty');
            expect(numberToWords(999)).toBe('Nine Hundred Ninety Nine');
        });

        it('handles thousands', () => {
            expect(numberToWords(1000)).toBe('One Thousand');
            expect(numberToWords(2500)).toBe('Two Thousand Five Hundred');
            expect(numberToWords(10000)).toBe('Ten Thousand');
        });

        it('handles lakhs', () => {
            expect(numberToWords(100000)).toBe('One Lakh');
            expect(numberToWords(150000)).toBe('One Lakh Fifty Thousand');
            expect(numberToWords(999999)).toBe('Nine Lakh Ninety Nine Thousand Nine Hundred Ninety Nine');
        });

        it('handles crores', () => {
            expect(numberToWords(10000000)).toBe('One Crore');
            expect(numberToWords(10500000)).toBe('One Crore Five Lakh');
            expect(numberToWords(15000000)).toBe('One Crore Fifty Lakh');
        });

        it('handles decimals by rounding', () => {
            expect(numberToWords(100.5)).toBe('One Hundred One'); // Rounds 100.5 -> 101
            expect(numberToWords(100.4)).toBe('One Hundred');     // Rounds 100.4 -> 100
        });
    });

    describe('convertINRToWords', () => {
        it('formats full Ruppees string', () => {
            expect(convertINRToWords(100)).toBe('Rupees One Hundred Only');
            expect(convertINRToWords('50000')).toBe('Rupees Fifty Thousand Only');
        });

        it('returns empty for zero or invalid input', () => {
            expect(convertINRToWords(0)).toBe('');
            expect(convertINRToWords('abc')).toBe('');
        });
    });

    describe('formatIndianNumber', () => {
        it('adds commas correctly', () => {
            expect(formatIndianNumber(1000)).toBe('1,000');
            expect(formatIndianNumber(10000)).toBe('10,000');
            expect(formatIndianNumber(100000)).toBe('1,00,000');
            expect(formatIndianNumber(10000000)).toBe('1,00,00,000');
        });

        it('handles string input', () => {
            expect(formatIndianNumber('50000')).toBe('50,000');
        });
    });

    describe('parseFormattedNumber', () => {
        it('parses numbers with commas', () => {
            expect(parseFormattedNumber('1,00,000')).toBe(100000);
            expect(parseFormattedNumber('50,000')).toBe(50000);
        });

        it('handles empty or invalid strings', () => {
            expect(parseFormattedNumber('')).toBe(0);
            expect(parseFormattedNumber('abc')).toBe(0);
        });
    });

    describe('formatIndianCurrency', () => {
        it('formats standard currency', () => {
            expect(formatIndianCurrency(1000)).toBe('₹1,000');
            expect(formatIndianCurrency(100000)).toBe('₹1,00,000');
        });

        it('formats compact currency', () => {
            expect(formatIndianCurrency(1500, true)).toBe('₹1.5K');
            expect(formatIndianCurrency(150000, true)).toBe('₹1.5L');
            expect(formatIndianCurrency(15000000, true)).toBe('₹1.5Cr');
        });

        it('handles exact compact values', () => {
            expect(formatIndianCurrency(1000, true)).toBe('₹1K');
            expect(formatIndianCurrency(100000, true)).toBe('₹1L');
            expect(formatIndianCurrency(10000000, true)).toBe('₹1Cr');
        });
    });
});
