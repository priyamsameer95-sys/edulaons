/**
 * DesignTokens.tsx
 * 
 * The Single Source of Truth for the Edu-Fintech Platform Design System (V3).
 * These values map directly to the Tailwind configuration and CSS Variables.
 */

export const COLORS = {
    // Primary - Trust Navy
    PRIMARY: {
        DEFAULT: "#1E3A8A", // Royal Blue
        HOVER: "#1E40AF",
        LIGHT: "#EFF6FF", // Backgrounds
    },
    // Semantic Status
    STATUS: {
        SUCCESS: "#10B981", // Emerald 500
        WARNING: "#F59E0B", // Amber 500
        ERROR: "#EF4444",   // Red 500
        INFO: "#3B82F6",    // Blue 500
    },
    // Neutrals
    NEUTRAL: {
        BACKGROUND: "#F1F5F9", // Slate 100
        SURFACE: "#FFFFFF",
        TEXT_MAIN: "#0F172A", // Slate 900
        TEXT_SECONDARY: "#64748B", // Slate 500
        BORDER: "#E2E8F0", // Slate 200
    }
} as const;

export const TYPOGRAPHY = {
    FONT_FAMILY: {
        SANS: "Inter, sans-serif",
    },
    WEIGHTS: {
        REGULAR: 400,
        MEDIUM: 500,
        SEMIBOLD: 600,
        BOLD: 700,
    },
    // Classes helper for financial numbers
    NUMERIC: "tabular-nums tracking-tight",
} as const;

export const COMPONENTS = {
    CARD: {
        BASE: "bg-white rounded-xl shadow-sm border border-border/60",
        HOVER: "hover:shadow-md transition-shadow duration-200",
    },
    BADGE: {
        BASE: "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
    },
    INPUT: {
        BASE: "h-11 rounded-lg border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        ERROR: "border-destructive focus-visible:ring-destructive",
    }
} as const;

export type ColorToken = typeof COLORS;
export type TypographyToken = typeof TYPOGRAPHY;
