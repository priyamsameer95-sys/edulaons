# Business Rule Engine (BRE) v4.0 Documentation

**Version:** 4.0
**Type:** Deterministic Rule-Based System
**Location:** `supabase/functions/suggest-lender/index.ts`

## 1. Overview
The BRE is a centralized decisioning engine that matches students with lenders based on their profile, university, and timeline. It runs as a Supabase Edge Function to ensure security and consistency.

Unlike a "Black Box" AI, this system is **deterministic**: the same input always produces the same output score (0-100).

## 2. Architecture

### Core Components
1.  **Edge Function (`suggest-lender`)**: The brain. Fetches data, executes logic, and commits results to the database.
2.  **Database (`lenders` table)**: Stores the rules. Rules are active JSON configurations, not free text.
3.  **Humanizer (`breHumanizer.ts`)**: The voice. Translates technical flags (e.g., `COURSES_STEM`) into user-friendly text ("STEM Program Expert").

## 3. Scoring Logic

The engine evaluates **every active lender** against the student lead. The final score (0-100) is calculated as follows:

### Step 1: Base Score (University)
The most critical factor is the university's standing with the lender.

| Condition | Score | Notes |
| :--- | :--- | :--- |
| **Premium Match** | **100** | Student's university is in the lender's `premium` array. **Bypasses Income Check.** |
| **Top 10% Rank** | **95** | University rank is in the top 10% of the lender's `ranked` list. |
| **Top 30% Rank** | **85** | University rank is in the top 30%. |
| **Top 50% Rank** | **75** | University rank is in the top 50%. |
| **Top 80% Rank** | **60** | University rank is in the top 80%. |
| **In List** | **45** | University is present but low-ranked. |
| **Not Found** | **30** | University is not in the lender's lists. |

### Step 2: Eligibility Gates (Knockouts)
If any of these fail, the lender is **LOCKED** (Status: `LOCKED`, Penalty: -30 pts).

1.  **Loan Amount**: Must be between `loan_amount_min` and `loan_amount_max`.
2.  **Income**: For **Unsecured Loans**, Co-applicant income must meet `income_expectations_min`.
    *   *Exception:* **Premium Matches** skip the income check.

### Step 3: Course Multiplier
*   **STEM / MBA / Management**: `1.0x` (Full Score)
*   **Other / Arts**: `0.8x` (20% reduction)

### Step 4: Urgency Adjustment
The system calculates "Effective Days" (Days to Intake - 7 Day Buffer).

*   **RED Zone (< 30 Days)**:
    *   Lender < 10 Days Processing: **+10 pts** (Fast Approval Bonus)
    *   Lender < 20 Days Processing: **+5 pts**
    *   Lender > 40 Days Processing: **-5 pts**
*   **YELLOW Zone (30-60 Days)**:
    *   Lender < 15 Days Processing: **+5 pts**

## 4. Lender Configuration

Lenders are configured via the Admin Dashboard, which updates the `lenders` table JSON columns.

**Key Config Fields:**
*   `university_restrictions`: JSON object containing:
    *   `premium`: Array of `{ name, country }`
    *   `ranked`: Array of `{ name, rank, country }`
*   `loan_amount_min` / `loan_amount_max`: Integer (in Rupees)
*   `income_expectations_min`: Integer (Monthly Income)
*   `processing_time_days`: Integer (Average days)

## 5. Extensibility

### Adding a New Rule
To add a new factor (e.g., "State Restrictions"):
1.  **Update DB**: Add `restricted_states` array to `lenders` table.
2.  **Update Logic**: In `suggest-lender/index.ts`, add a check loop:
    ```typescript
    if (lender.restricted_states.includes(lead.state)) {
      status = 'LOCKED';
      reason = 'State not serviced';
    }
    ```
3.  **Update Humanizer**: Add a translation entry in `BRE_TRANSLATIONS`.

## 6. Edge Cases

*   **Missing Data**:
    *   No Intake Date → Defaults to YELLOW zone (standard timeline).
    *   No Course Type → Defaults to "Other" (0.8x multiplier).
*   **Partial Matching**: String matching is fuzzy. "Oxford" matches "University of Oxford".
*   **Score Clamping**: Scores never exceed 100 or drop below 0.

## 7. Output Status Tiers

*   **PREMIUM MATCH**: 100 pts + Premium List match.
*   **BEST FIT**: ≥ 85 pts.
*   **GOOD FIT**: 65 - 84 pts.
*   **BACKUP**: < 65 pts.
*   **LOCKED**: Failed eligibility.
