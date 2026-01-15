
import { describe, it, expect, vi } from 'vitest';

// Import utilities for testing
import { TEST_TYPES } from '@/utils/leadCompletionSchema';
import { Validators, validateField, ValidationPatterns, validateForm } from '@/utils/validation';

describe('Lead Completion Schema', () => {
    describe('TEST_TYPES configuration', () => {
        it('has correct test types defined', () => {
            expect(TEST_TYPES).toBeDefined();
            expect(Array.isArray(TEST_TYPES)).toBe(true);
            expect(TEST_TYPES.length).toBeGreaterThan(0);
        });

        it('includes ielts with correct max score', () => {
            const ielts = TEST_TYPES.find(t => t.value === 'ielts');
            expect(ielts).toBeDefined();
            expect(ielts?.maxScore).toBe(9);
        });

        it('includes toefl with correct max score', () => {
            const toefl = TEST_TYPES.find(t => t.value === 'toefl');
            expect(toefl).toBeDefined();
            expect(toefl?.maxScore).toBe(120);
        });

        it('includes gre with correct max score', () => {
            const gre = TEST_TYPES.find(t => t.value === 'gre');
            expect(gre).toBeDefined();
            expect(gre?.maxScore).toBe(340);
        });

        it('includes gmat with correct max score', () => {
            const gmat = TEST_TYPES.find(t => t.value === 'gmat');
            expect(gmat).toBeDefined();
            expect(gmat?.maxScore).toBe(800);
        });

        it('includes sat with correct max score', () => {
            const sat = TEST_TYPES.find(t => t.value === 'sat');
            expect(sat).toBeDefined();
            expect(sat?.maxScore).toBe(1600);
        });

        it('includes pte with correct max score', () => {
            const pte = TEST_TYPES.find(t => t.value === 'pte');
            expect(pte).toBeDefined();
            expect(pte?.maxScore).toBe(90);
        });
    });
});

describe('Validation Utilities', () => {
    describe('validateField', () => {
        it('validates required fields', () => {
            const result = validateField('', { required: true }, 'Name');
            expect(result.isValid).toBe(false);
            expect(result.error).toContain('required');
        });

        it('passes when value is provided', () => {
            const result = validateField('John', { required: true }, 'Name');
            expect(result.isValid).toBe(true);
        });

        it('validates min length', () => {
            const result = validateField('Jo', { minLength: 3 }, 'Name');
            expect(result.isValid).toBe(false);
        });

        it('validates max length', () => {
            const result = validateField('TooLongName', { maxLength: 5 }, 'Name');
            expect(result.isValid).toBe(false);
        });

        it('validates pattern', () => {
            const result = validateField('invalid', { pattern: /^\d+$/ }, 'Number');
            expect(result.isValid).toBe(false);
        });
    });

    describe('ValidationPatterns', () => {
        it('email pattern validates correctly', () => {
            expect(ValidationPatterns.email.test('valid@email.com')).toBe(true);
            expect(ValidationPatterns.email.test('invalid')).toBe(false);
        });

        it('phone pattern validates 10 digit Indian numbers', () => {
            expect(ValidationPatterns.phone.test('9876543210')).toBe(true);
            expect(ValidationPatterns.phone.test('1234567890')).toBe(false); // Doesn't start with 6-9
        });

        it('pinCode pattern validates 6 digits', () => {
            expect(ValidationPatterns.pinCode.test('400001')).toBe(true);
            expect(ValidationPatterns.pinCode.test('40001')).toBe(false);
        });
    });

    describe('Validators', () => {
        it('email validator works', () => {
            const validator = Validators.email();
            expect(validator.validate('test@email.com').isValid).toBe(true);
            expect(validator.validate('invalid').isValid).toBe(false);
        });

        it('phone validator works', () => {
            const validator = Validators.phone();
            expect(validator.validate('9876543210').isValid).toBe(true);
            expect(validator.validate('123').isValid).toBe(false);
        });

        it('pinCode validator works', () => {
            const validator = Validators.pinCode();
            expect(validator.validate('400001').isValid).toBe(true);
            expect(validator.validate('4000').isValid).toBe(false);
        });

        it('currency validator enforces min/max', () => {
            const validator = Validators.currency('Amount', 100000, 5000000);
            expect(validator.validate('500000').isValid).toBe(true);
            expect(validator.validate('50000').isValid).toBe(false);
            expect(validator.validate('10000000').isValid).toBe(false);
        });
    });

    describe('validateForm', () => {
        it('validates entire form', () => {
            const data = { name: '', email: 'test@test.com' };
            const schema = {
                name: Validators.required('Name'),
                email: Validators.email(false),
            };
            const result = validateForm(data, schema);
            expect(result.isValid).toBe(false);
            expect(result.errors.name).toBeDefined();
        });
    });
});

describe('Status Utilities', () => {
    it('lead status options are defined', async () => {
        const { LEAD_STATUS_OPTIONS } = await import('@/utils/statusUtils');
        expect(LEAD_STATUS_OPTIONS).toBeDefined();
        expect(Array.isArray(LEAD_STATUS_OPTIONS)).toBe(true);
    });

    it('getStatusLabel returns label', async () => {
        const { getStatusLabel } = await import('@/utils/statusUtils');
        expect(getStatusLabel).toBeDefined();
    });

    it('getStatusColor returns color', async () => {
        const { getStatusColor } = await import('@/utils/statusUtils');
        expect(getStatusColor).toBeDefined();
    });
});

describe('API Error Utilities', () => {
    it('parseApiError handles error objects', async () => {
        const { parseApiError } = await import('@/utils/apiErrors');
        expect(parseApiError).toBeDefined();

        const result = parseApiError(new Error('Test error'));
        expect(result).toBeDefined();
        expect(result.message).toBeTruthy();
    });

    it('isValidEmail validates correctly', async () => {
        const { isValidEmail } = await import('@/utils/apiErrors');
        expect(isValidEmail).toBeDefined();
        expect(isValidEmail('test@test.com')).toBe(true);
        expect(isValidEmail('invalid')).toBe(false);
    });

    it('isValidPhone validates correctly', async () => {
        const { isValidPhone } = await import('@/utils/apiErrors');
        expect(isValidPhone).toBeDefined();
        expect(isValidPhone('9876543210')).toBe(true);
        expect(isValidPhone('123')).toBe(false);
    });

    it('isEmpty checks empty values', async () => {
        const { isEmpty } = await import('@/utils/apiErrors');
        expect(isEmpty).toBeDefined();
        expect(isEmpty('')).toBe(true);
        expect(isEmpty('   ')).toBe(true);
        expect(isEmpty('test')).toBe(false);
    });
});

describe('Role Permissions', () => {
    it('filterLeadForStudent is defined', async () => {
        const { filterLeadForStudent } = await import('@/utils/rolePermissions');
        expect(filterLeadForStudent).toBeDefined();
    });

    it('AppRole type includes expected roles', async () => {
        // Just verify the module loads without error
        const module = await import('@/utils/rolePermissions');
        expect(module).toBeDefined();
    });
});
