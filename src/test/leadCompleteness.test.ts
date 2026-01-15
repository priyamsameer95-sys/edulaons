
import { describe, it, expect } from 'vitest';
import {
    getCompletenessColor,
    getMissingSummary,
    LeadCompletenessResult
} from '../utils/leadCompleteness';

// Note: getLeadCompleteness requires PaginatedLead type which is complex
// We test the simpler utility functions

describe('Lead Completeness Utility', () => {
    describe('getCompletenessColor', () => {
        it('returns emerald/green for high scores (90+)', () => {
            const color = getCompletenessColor(95);
            expect(color).toContain('emerald');
        });

        it('returns amber/yellow for medium scores (70-89)', () => {
            const color = getCompletenessColor(75);
            expect(color).toContain('amber');
        });

        it('returns red for low scores (below 70)', () => {
            const color = getCompletenessColor(50);
            expect(color).toContain('red');
        });

        it('handles edge cases at boundaries', () => {
            expect(getCompletenessColor(90)).toContain('emerald');
            expect(getCompletenessColor(70)).toContain('amber');
            expect(getCompletenessColor(69)).toContain('red');
        });
    });

    describe('getMissingSummary', () => {
        it('returns success message when complete', () => {
            const completenessResult: LeadCompletenessResult = {
                completenessScore: 100,
                missingRequired: [],
                missingOptional: [],
                isComplete: true,
                totalFields: 20,
                filledFields: 20,
            };
            const summary = getMissingSummary(completenessResult);
            expect(summary).toBe('All required fields complete');
        });

        it('returns count of missing required fields', () => {
            const incompleteLead: LeadCompletenessResult = {
                completenessScore: 50,
                missingRequired: [
                    { fieldName: 'email', displayName: 'Email', section: 'student', isRequired: true },
                    { fieldName: 'phone', displayName: 'Phone', section: 'student', isRequired: true },
                ],
                missingOptional: [],
                isComplete: false,
                totalFields: 20,
                filledFields: 10,
            };
            const summary = getMissingSummary(incompleteLead);
            expect(summary).toBe('2 required fields missing');
        });

        it('handles singular field missing', () => {
            const result: LeadCompletenessResult = {
                completenessScore: 90,
                missingRequired: [
                    { fieldName: 'email', displayName: 'Email', section: 'student', isRequired: true },
                ],
                missingOptional: [],
                isComplete: false,
                totalFields: 20,
                filledFields: 19,
            };
            const summary = getMissingSummary(result);
            expect(summary).toBe('1 required field missing');
        });
    });
});
