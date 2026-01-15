
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn(() => ({
                eq: vi.fn(() => ({
                    single: vi.fn(() => Promise.resolve({ data: null, error: null })),
                    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
                })),
                order: vi.fn(() => Promise.resolve({ data: [], error: null })),
                limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
            insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
            update: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
            })),
        })),
        auth: {
            getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user' } }, error: null })),
        },
        rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
        functions: {
            invoke: vi.fn(() => Promise.resolve({ data: null, error: null })),
        },
    },
}));

vi.mock('@/hooks/use-toast', () => ({
    useToast: () => ({
        toast: vi.fn(),
    }),
}));

describe('Admin Data Utilities', () => {
    describe('Country Mapping', () => {
        it('has country code to name mappings', async () => {
            const { COUNTRY_CODE_TO_NAME } = await import('@/utils/countryMapping');
            expect(COUNTRY_CODE_TO_NAME).toBeDefined();
            expect(COUNTRY_CODE_TO_NAME.US).toBe('United States');
            expect(COUNTRY_CODE_TO_NAME.UK).toBe('United Kingdom');
        });

        it('converts country code to name', async () => {
            const { getCountryNameFromCode } = await import('@/utils/countryMapping');
            expect(getCountryNameFromCode('USA')).toBe('United States');
            expect(getCountryNameFromCode('UK')).toBe('United Kingdom');
        });

        it('converts country name to code', async () => {
            const { getCountryCodeFromName } = await import('@/utils/countryMapping');
            expect(getCountryCodeFromName('United States')).toBe('USA');
            expect(getCountryCodeFromName('United Kingdom')).toBe('UK');
        });
    });

    describe('PIN Code Lookup', () => {
        it('exports lookup function', async () => {
            const { lookupPinCode } = await import('@/utils/pinCodeLookup');
            expect(lookupPinCode).toBeDefined();
        });
    });
});

describe('Document Utilities', () => {
    describe('Document Status Utils', () => {
        it('exports document status labels', async () => {
            const { adminDocumentStatusLabels, partnerDocumentStatusLabels } = await import('@/utils/documentStatusUtils');
            expect(adminDocumentStatusLabels).toBeDefined();
            expect(partnerDocumentStatusLabels).toBeDefined();
        });

        it('has correct verified status label', async () => {
            const { adminDocumentStatusLabels } = await import('@/utils/documentStatusUtils');
            expect(adminDocumentStatusLabels.verified).toBe('Verified');
        });

        it('has correct rejected status label', async () => {
            const { adminDocumentStatusLabels } = await import('@/utils/documentStatusUtils');
            expect(adminDocumentStatusLabels.rejected).toBe('Need Attention');
        });

        it('canPartnerUpload returns correct value', async () => {
            const { canPartnerUpload } = await import('@/utils/documentStatusUtils');
            expect(canPartnerUpload('not_uploaded')).toBe(true);
            expect(canPartnerUpload('rejected')).toBe(true);
            expect(canPartnerUpload('verified')).toBe(false);
        });

        it('canPartnerReupload returns correct value', async () => {
            const { canPartnerReupload } = await import('@/utils/documentStatusUtils');
            expect(canPartnerReupload('rejected')).toBe(true);
            expect(canPartnerReupload('verified')).toBe(false);
            expect(canPartnerReupload('not_uploaded')).toBe(false);
        });
    });
});
