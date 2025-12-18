// Quick-select reason codes for status updates
// Grouped for easy dropdown navigation

export const REASON_CODE_GROUPS = {
  positive: {
    label: '✓ Moving Forward',
    codes: [
      { value: 'contacted_moving_forward', label: 'Contacted - moving forward' },
      { value: 'docs_received', label: 'Docs received' },
      { value: 'sent_to_lender', label: 'Sent to lender' },
      { value: 'student_responsive', label: 'Student responsive' },
      { value: 'counselling_done', label: 'Counselling done' },
      { value: 'verification_complete', label: 'Verification complete' },
    ]
  },
  drop_off: {
    label: '✗ Drop-off',
    codes: [
      { value: 'no_response', label: 'No response' },
      { value: 'competition', label: 'Went with competition' },
      { value: 'plan_dropped', label: 'Plan dropped' },
      { value: 'future_intake', label: 'Future intake' },
      { value: 'low_income', label: 'Low co-applicant income' },
      { value: 'no_co_applicant', label: 'No co-applicant' },
      { value: 'docs_refused', label: 'Docs refused/unavailable' },
      { value: 'low_cibil', label: 'Low CIBIL / defaults' },
      { value: 'not_serviceable', label: 'Location not serviceable' },
      { value: 'uni_not_supported', label: 'University not supported' },
      { value: 'wants_psu_only', label: 'Wants PSU bank only' },
    ]
  },
  neutral: {
    label: '○ Other',
    codes: [
      { value: 'follow_up_scheduled', label: 'Follow-up scheduled' },
      { value: 'pending_info', label: 'Pending info from student' },
      { value: 'internal_review', label: 'Internal review' },
      { value: 'other', label: 'Other (specify in notes)' },
    ]
  }
} as const;

// Flattened list for easier lookup
export const ALL_REASON_CODES = [
  ...REASON_CODE_GROUPS.positive.codes,
  ...REASON_CODE_GROUPS.drop_off.codes,
  ...REASON_CODE_GROUPS.neutral.codes,
];

export type ReasonCode = typeof ALL_REASON_CODES[number]['value'];

// Get label for a reason code
export function getReasonCodeLabel(code: string): string {
  const found = ALL_REASON_CODES.find(rc => rc.value === code);
  return found?.label || code;
}

// Check if reason code indicates a drop-off
export function isDropOffReason(code: string): boolean {
  return REASON_CODE_GROUPS.drop_off.codes.some(rc => rc.value === code);
}
