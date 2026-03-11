/**
 * BRE Timeline Risk Regression Tests
 * 
 * Tests the core BRE logic for urgency zone calculation and timeline warnings.
 * These tests ensure the recommendation engine correctly flags risk scenarios.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// EXTRACTED BRE LOGIC (mirrored from suggest-lender/index.ts)
// ============================================================================

type UrgencyZone = 'GREEN' | 'YELLOW' | 'RED';
type Strategy = 'COST_OPTIMIZATION' | 'BALANCED' | 'SPEED_PRIORITY';
type UniversityTier = 'S' | 'A' | 'B' | 'C';

/**
 * Calculate urgency zone based on intake date
 * - RED: ≤30 days (SPEED_PRIORITY)
 * - YELLOW: 31-60 days (BALANCED)
 * - GREEN: >60 days (COST_OPTIMIZATION)
 */
function calculateUrgencyZone(
    intakeMonth: number | null,
    intakeYear: number | null,
    currentDate?: Date
): { zone: UrgencyZone; daysUntil: number } {
    if (!intakeMonth || !intakeYear) {
        return { zone: 'YELLOW', daysUntil: 60 }; // Default to balanced
    }

    const now = currentDate || new Date();
    const intakeDate = new Date(intakeYear, intakeMonth - 1, 1);
    const diffTime = intakeDate.getTime() - now.getTime();
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const VISA_BUFFER = 7;
    const effectiveDays = daysUntil - VISA_BUFFER;

    if (effectiveDays <= 30) return { zone: 'RED', daysUntil };
    if (effectiveDays <= 60) return { zone: 'YELLOW', daysUntil };
    return { zone: 'GREEN', daysUntil };
}

/**
 * Determine strategy based on urgency zone
 */
function determineStrategy(zone: UrgencyZone): Strategy {
    switch (zone) {
        case 'RED': return 'SPEED_PRIORITY';
        case 'GREEN': return 'COST_OPTIMIZATION';
        default: return 'BALANCED';
    }
}

/**
 * Calculate weighted academic score
 */
function calculateWeightedAcademicScore(
    tenth: number | null,
    twelfth: number | null,
    bachelors: number | null,
    cgpa: number | null
): number {
    // Convert CGPA to percentage if needed
    const bachPercent = bachelors || (cgpa ? cgpa * 10 : null);

    const scores: { value: number; weight: number }[] = [];
    if (tenth) scores.push({ value: tenth, weight: 0.2 });
    if (twelfth) scores.push({ value: twelfth, weight: 0.3 });
    if (bachPercent) scores.push({ value: bachPercent, weight: 0.5 });

    if (scores.length === 0) return 50; // Default

    // Normalize weights if not all present
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
    const weightedSum = scores.reduce((sum, s) => sum + (s.value * s.weight / totalWeight), 0);

    return Math.round(weightedSum);
}

/**
 * Calculate university tier from global rank
 */
function calculateUniversityTier(globalRank: number | null | undefined): UniversityTier {
    if (!globalRank || globalRank <= 0) return 'C';
    if (globalRank <= 100) return 'S';
    if (globalRank <= 300) return 'A';
    if (globalRank <= 500) return 'B';
    return 'C';
}

/**
 * Generate timeline warning message
 */
function generateTimelineWarning(context: { urgency_zone: UrgencyZone; days_until_deadline: number }): string | null {
    if (context.urgency_zone === 'RED') {
        return `⚠️ CRITICAL: Your intake is in ${context.days_until_deadline} days. We've prioritized fast lenders.`;
    }
    if (context.urgency_zone === 'YELLOW') {
        return `🕐 Moderate timeline: ${context.days_until_deadline} days until intake.`;
    }
    return null;
}

// ============================================================================
// TESTS
// ============================================================================

describe('BRE Timeline Risk Calculation', () => {
    // Use a fixed current date for consistent tests
    const FIXED_NOW = new Date(2026, 0, 15); // Jan 15, 2026

    describe('calculateUrgencyZone', () => {
        it('should flag RED zone for intake < 30 days away (after visa buffer)', () => {
            // Feb 2026 = ~17 days away, effective = 17 - 7 = 10 days
            const result = calculateUrgencyZone(2, 2026, FIXED_NOW);
            expect(result.zone).toBe('RED');
            expect(result.daysUntil).toBeLessThanOrEqual(30);
        });

        it('should flag YELLOW zone for intake 30-60 days away', () => {
            // March 2026 = ~45 days away, effective = 45 - 7 = 38 days
            const result = calculateUrgencyZone(3, 2026, FIXED_NOW);
            expect(result.zone).toBe('YELLOW');
            expect(result.daysUntil).toBeGreaterThan(30);
            expect(result.daysUntil).toBeLessThanOrEqual(70);
        });

        it('should flag GREEN zone for intake > 60 days away', () => {
            // September 2026 = ~230 days away
            const result = calculateUrgencyZone(9, 2026, FIXED_NOW);
            expect(result.zone).toBe('GREEN');
            expect(result.daysUntil).toBeGreaterThan(60);
        });

        it('should default to YELLOW when intake date is missing', () => {
            const result = calculateUrgencyZone(null, null, FIXED_NOW);
            expect(result.zone).toBe('YELLOW');
            expect(result.daysUntil).toBe(60);
        });

        it('should handle edge case: intake month is current month', () => {
            // Same month, should be very close
            const result = calculateUrgencyZone(1, 2026, FIXED_NOW);
            expect(result.zone).toBe('RED');
            expect(result.daysUntil).toBeLessThanOrEqual(17);
        });

        it('should handle past intake dates as RED zone', () => {
            // December 2025 = already passed
            const result = calculateUrgencyZone(12, 2025, FIXED_NOW);
            expect(result.zone).toBe('RED');
            expect(result.daysUntil).toBeLessThan(0);
        });
    });

    describe('determineStrategy', () => {
        it('should return SPEED_PRIORITY for RED zone', () => {
            expect(determineStrategy('RED')).toBe('SPEED_PRIORITY');
        });

        it('should return COST_OPTIMIZATION for GREEN zone', () => {
            expect(determineStrategy('GREEN')).toBe('COST_OPTIMIZATION');
        });

        it('should return BALANCED for YELLOW zone', () => {
            expect(determineStrategy('YELLOW')).toBe('BALANCED');
        });
    });

    describe('generateTimelineWarning', () => {
        it('should generate critical warning for RED zone', () => {
            const result = generateTimelineWarning({ urgency_zone: 'RED', days_until_deadline: 20 });
            expect(result).toContain('CRITICAL');
            expect(result).toContain('20 days');
            expect(result).toContain('fast lenders');
        });

        it('should generate moderate notice for YELLOW zone', () => {
            const result = generateTimelineWarning({ urgency_zone: 'YELLOW', days_until_deadline: 45 });
            expect(result).toContain('Moderate');
            expect(result).toContain('45 days');
        });

        it('should return null for GREEN zone', () => {
            const result = generateTimelineWarning({ urgency_zone: 'GREEN', days_until_deadline: 120 });
            expect(result).toBeNull();
        });
    });
});

describe('BRE GPA Scoring', () => {
    describe('calculateWeightedAcademicScore', () => {
        it('should apply correct weights: 10th=20%, 12th=30%, Bachelors=50%', () => {
            // All scores are 80 → weighted average should also be 80
            const result = calculateWeightedAcademicScore(80, 80, 80, null);
            expect(result).toBe(80);
        });

        it('should weight Bachelors most heavily', () => {
            // High bachelors (90) should raise score despite lower 10th (60)
            const result = calculateWeightedAcademicScore(60, 70, 90, null);
            // Expected: (60*0.2 + 70*0.3 + 90*0.5) = 12 + 21 + 45 = 78
            expect(result).toBe(78);
        });

        it('should convert CGPA to percentage (×10)', () => {
            // CGPA 8.5 = 85%
            const result = calculateWeightedAcademicScore(80, 80, null, 8.5);
            // Expected: (80*0.2 + 80*0.3 + 85*0.5) = 16 + 24 + 42.5 = 82.5 → 83
            expect(result).toBe(83);
        });

        it('should normalize weights when not all scores present', () => {
            // Only 10th and 12th present
            const result = calculateWeightedAcademicScore(80, 90, null, null);
            // Weights: 0.2 + 0.3 = 0.5, normalized: 0.4 + 0.6
            // Expected: (80*0.4 + 90*0.6) = 32 + 54 = 86
            expect(result).toBe(86);
        });

        it('should return 50 as default when no scores provided', () => {
            const result = calculateWeightedAcademicScore(null, null, null, null);
            expect(result).toBe(50);
        });

        it('should handle only 10th percentage', () => {
            const result = calculateWeightedAcademicScore(75, null, null, null);
            // Only 10th, full weight to it
            expect(result).toBe(75);
        });
    });
});

describe('BRE University Tier', () => {
    describe('calculateUniversityTier', () => {
        it('should assign S tier for top 100 universities', () => {
            expect(calculateUniversityTier(1)).toBe('S');
            expect(calculateUniversityTier(50)).toBe('S');
            expect(calculateUniversityTier(100)).toBe('S');
        });

        it('should assign A tier for rank 101-300', () => {
            expect(calculateUniversityTier(101)).toBe('A');
            expect(calculateUniversityTier(200)).toBe('A');
            expect(calculateUniversityTier(300)).toBe('A');
        });

        it('should assign B tier for rank 301-500', () => {
            expect(calculateUniversityTier(301)).toBe('B');
            expect(calculateUniversityTier(400)).toBe('B');
            expect(calculateUniversityTier(500)).toBe('B');
        });

        it('should assign C tier for rank > 500', () => {
            expect(calculateUniversityTier(501)).toBe('C');
            expect(calculateUniversityTier(1000)).toBe('C');
        });

        it('should default to C tier for missing/invalid rank', () => {
            expect(calculateUniversityTier(null)).toBe('C');
            expect(calculateUniversityTier(undefined)).toBe('C');
            expect(calculateUniversityTier(0)).toBe('C');
            expect(calculateUniversityTier(-100)).toBe('C');
        });
    });
});

describe('BRE Integration Scenarios', () => {
    const FIXED_NOW = new Date(2026, 0, 15);

    it('Scenario: High-urgency student with top 100 university', () => {
        // Feb 2026 intake, MIT (rank 1)
        const urgency = calculateUrgencyZone(2, 2026, FIXED_NOW);
        const tier = calculateUniversityTier(1);
        const strategy = determineStrategy(urgency.zone);
        const academic = calculateWeightedAcademicScore(85, 88, 92, null);

        expect(urgency.zone).toBe('RED');
        expect(tier).toBe('S');
        expect(strategy).toBe('SPEED_PRIORITY');
        expect(academic).toBeGreaterThan(85); // Strong academic profile
    });

    it('Scenario: Comfortable timeline, moderate university', () => {
        // Sep 2026 intake, rank 350 university
        const urgency = calculateUrgencyZone(9, 2026, FIXED_NOW);
        const tier = calculateUniversityTier(350);
        const strategy = determineStrategy(urgency.zone);

        expect(urgency.zone).toBe('GREEN');
        expect(tier).toBe('B');
        expect(strategy).toBe('COST_OPTIMIZATION');
    });

    it('Scenario: Warning should trigger for RED zone intake', () => {
        const urgency = calculateUrgencyZone(2, 2026, FIXED_NOW);
        const warning = generateTimelineWarning({
            urgency_zone: urgency.zone,
            days_until_deadline: urgency.daysUntil
        });

        expect(warning).not.toBeNull();
        expect(warning).toContain('CRITICAL');
    });
});
