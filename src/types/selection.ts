/**
 * Shared types for university and course selection components
 */

export interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  qs_rank: number | null;
  popular: boolean;
}

export interface Course {
  id: string;
  program_name: string;
  degree: string;
  study_level: string;
  stream_name: string;
  program_duration: string | null;
  tuition_fees: string | null;
  starting_month: string | null;
  study_mode: string | null;
  course_intensity: string | null;
  university_id: string;
}

export interface SelectionOption {
  id: string;
  label: string;
  sublabel?: string;
  metadata?: Record<string, any>;
}

export interface ComboboxState {
  open: boolean;
  inputValue: string;
  selectedValue: string | null;
  isCustom: boolean;
}

export type SelectionChangeHandler = (
  value: string,
  isCustom?: boolean
) => void;

// Type guard for UUID validation
export const isValidUUID = (value: string): boolean => {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

// Study destinations matching the enum in database
export const STUDY_DESTINATIONS = [
  { value: "USA", label: "USA", flag: "🇺🇸" },
  { value: "UK", label: "UK", flag: "🇬🇧" },
  { value: "Canada", label: "Canada", flag: "🇨🇦" },
  { value: "Australia", label: "Australia", flag: "🇦🇺" },
  { value: "Germany", label: "Germany", flag: "🇩🇪" },
  { value: "Ireland", label: "Ireland", flag: "🇮🇪" },
  { value: "New Zealand", label: "New Zealand", flag: "🇳🇿" },
  { value: "Other", label: "Other", flag: "🌍" },
] as const;

export type StudyDestination = typeof STUDY_DESTINATIONS[number]['value'];

// Co-applicant relationships matching the enum
export const RELATIONSHIPS = [
  { value: "parent", label: "Parent" },
  { value: "spouse", label: "Spouse" },
  { value: "sibling", label: "Sibling" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
] as const;

export type Relationship = typeof RELATIONSHIPS[number]['value'];
