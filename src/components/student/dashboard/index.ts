/**
 * Student Dashboard Components Index
 */

// New compact design components
export { default as CompactStatusHeader } from './CompactStatusHeader';
export { default as ApplicationDetailsCard } from './ApplicationDetailsCard';
export { default as CollapsibleDocumentSection } from './CollapsibleDocumentSection';

// Document table (still used in collapsible section)
export { default as DocumentTable } from './DocumentTable';
export type { DocumentItem } from './DocumentTable';

// Legacy components (kept for reference, no longer used in main dashboard)
export { default as ApplicationSummaryStrip } from './ApplicationSummaryStrip';
export { default as HeroActionCard } from './HeroActionCard';
export { default as DocumentStatusCards } from './DocumentStatusCards';
export type { DocumentFilter } from './DocumentStatusCards';
export { default as StageTimeline, getTimelineStep } from './StageTimeline';
