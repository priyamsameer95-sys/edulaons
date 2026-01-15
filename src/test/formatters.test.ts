
import { describe, it, expect } from 'vitest';
import {
    formatDate,
    formatCurrency,
    formatRelativeTime,
    formatDisplayText,
    isPlaceholderEmail,
    validateEmail
} from '../utils/formatters';

describe('Formatters Utility', () => {
    describe('formatDate', () => {
        it('formats ISO date string (short)', () => {
            const result = formatDate('2024-01-15');
            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
        });

        it('formats ISO date string (long)', () => {
            const result = formatDate('2024-01-15', 'long');
            expect(result).toContain('2024');
        });

        it('formats Date object', () => {
            const result = formatDate(new Date('2024-06-20'));
            expect(result).toBeTruthy();
        });
    });

    describe('formatCurrency', () => {
        it('formats INR by default', () => {
            const result = formatCurrency(100000);
            expect(result).toContain('₹');
            expect(result).toContain('1,00,000');
        });

        it('formats other currencies', () => {
            const result = formatCurrency(1000, 'USD');
            expect(result).toContain('$');
        });
    });

    describe('formatRelativeTime', () => {
        it('returns relative time string', () => {
            const now = new Date().toISOString();
            const result = formatRelativeTime(now);
            expect(result).toBeTruthy();
            expect(result).toContain('ago');
        });

        it('handles past dates', () => {
            const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
            const result = formatRelativeTime(pastDate);
            expect(result).toContain('day');
        });
    });

    describe('formatDisplayText', () => {
        it('converts snake_case to Title Case', () => {
            expect(formatDisplayText('first_name')).toBe('First Name');
            expect(formatDisplayText('co_applicant_salary')).toBe('Co Applicant Salary');
        });

        it('preserves acronyms', () => {
            expect(formatDisplayText('pan_card')).toBe('PAN Card');
            expect(formatDisplayText('kyc_status')).toBe('KYC Status');
        });

        it('handles null/undefined', () => {
            expect(formatDisplayText(null)).toBe('');
            expect(formatDisplayText(undefined)).toBe('');
        });
    });

    describe('isPlaceholderEmail', () => {
        it('detects placeholder emails', () => {
            expect(isPlaceholderEmail('9876543210@temp.placeholder')).toBe(true);
            expect(isPlaceholderEmail('quick@quick.placeholder')).toBe(true);
        });

        it('returns false for real emails', () => {
            expect(isPlaceholderEmail('john@gmail.com')).toBe(false);
            expect(isPlaceholderEmail('test@company.org')).toBe(false);
        });

        it('handles null/undefined', () => {
            expect(isPlaceholderEmail(null)).toBe(false);
            expect(isPlaceholderEmail(undefined)).toBe(false);
        });
    });

    describe('validateEmail', () => {
        it('returns null for valid emails', () => {
            expect(validateEmail('valid@email.com')).toBeNull();
        });

        it('returns error for invalid format', () => {
            expect(validateEmail('notanemail')).toBe('Invalid email format');
        });

        it('blocks placeholder emails', () => {
            expect(validateEmail('123@temp.placeholder')).toBe('Please enter a real email address');
        });

        it('allows empty emails', () => {
            expect(validateEmail('')).toBeNull();
            expect(validateEmail(null)).toBeNull();
        });
    });
});
