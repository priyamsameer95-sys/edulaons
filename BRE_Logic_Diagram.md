# BRE v4.0 Comprehensive Logic Flow (v2)

This diagram details the exact logic used by the `suggest-lender` Edge Function, including **Edge Cases** and **Null Handling**.

```mermaid
flowchart TD
    Start(["Start: Process Lead"]) --> DataValidation{"Data Validation"}
    
    DataValidation -- "Missing Intake Date" --> DefaultDate["Set Default:<br/>Urgency = YELLOW<br/>(60 Days)"]
    DataValidation -- "Missing Loan Amount" --> DefaultLoan["Use Lead Amount or 0"]
    DataValidation -- "Missing Course Type" --> DefaultCourse["Use 'others'<br/>(Multiplier 0.8x)"]
    DataValidation -- "Valid Data" --> FetchLenders["Fetch Active Lenders"]
    
    DefaultDate --> FetchLenders
    DefaultLoan --> FetchLenders
    DefaultCourse --> FetchLenders

    subgraph LenderLoop ["Per-Lender Evaluation Loop"]
        FetchLenders --> StringNorm["Normalize Strings:<br/>Trim & Lowercase"]
        
        StringNorm --> RecCheckPremium{"Premium Match Check<br/>(Partial/Fuzzy Match)"}
        
        %% PREMIUM PATH
        RecCheckPremium -- "Match Found" --> PremiumSet["Base Score = 100<br/>Badge: 'Premium Partner'<br/>**Bypass Income Check**"]
        
        %% STANDARD PATH
        RecCheckPremium -- "No Match/Null Uni" --> RecCheckRanked{"Ranked List Check<br/>(Partial/Fuzzy Match)"}
        
        RecCheckRanked -- "Match Found" --> TierCalc["Calculate Tier Score:<br/>Top 10% = 95<br/>Top 30% = 85<br/>Top 50% = 75<br/>Top 80% = 60<br/>In List = 45"]
        RecCheckRanked -- "No Match/Null Uni" --> StandardScore["Base Score = 30"]
        
        PremiumSet --> EligibilityGate
        TierCalc --> EligibilityGate
        StandardScore --> EligibilityGate
        
        %% ELIGIBILITY GATE (THE KNOCKOUTS)
        EligibilityGate{"CRITICAL ELIGIBILITY CHECK"}
        
        EligibilityGate -- "Loan Amount > Max" --> Knockout["result = LOCKED"]
        EligibilityGate -- "Loan Amount < Min" --> Knockout
        EligibilityGate -- "Not Premium AND<br/>No Collateral AND<br/>Income < Min" --> Knockout
        
        Knockout --> ApplyPenalty["Score Penalty: -30 pts<br/>Status: LOCKED"]
        
        EligibilityGate -- "Pass" --> CourseLogic
        ApplyPenalty --> CourseLogic
        
        %% COURSE LOGIC
        CourseLogic{"Course Type Check"}
        CourseLogic -- "STEM / MBA / Mgmt" --> MultOne["Multiplier: 1.0x"]
        CourseLogic -- "Other / Arts / Null" --> MultReduced["Multiplier: 0.8x"]
        
        MultOne --> UrgencyLogic
        MultReduced --> UrgencyLogic
        
        %% URGENCY & PROCESSING LOGIC
        UrgencyLogic{"Intake Urgency<br/>(Effective Days = Days - 7)"}
        
        UrgencyLogic -- "RED (< 30 Days)" --> RedCheck{"Lender Processing Time"}
        RedCheck -- "< 10 Days" --> BonusFast["+10 pts (Fast Approval)"]
        RedCheck -- "< 20 Days" --> BonusQuick["+5 pts (Quick Processing)"]
        RedCheck -- "> 40 Days" --> PenaltySlow["-5 pts (Slow for Deadline)"]
        RedCheck -- "Else" --> NoRedAdj["No Adjustment"]
        
        UrgencyLogic -- "YELLOW (30-60 Days)" --> YellowCheck{"Lender Processing Time"}
        YellowCheck -- "< 15 Days" --> BonusMod["+5 pts (Good Timeline)"]
        YellowCheck -- "Else" --> NoYellowAdj["No Adjustment"]
        
        UrgencyLogic -- "GREEN (> 60 Days)" --> NoGreenAdj["No Adjustment"]
        
        %% FINAL SCORE CALCULATION
        BonusFast & BonusQuick & PenaltySlow & NoRedAdj --> FinalMath
        BonusMod & NoYellowAdj --> FinalMath
        NoGreenAdj --> FinalMath
        
        FinalMath["Calculate Raw Score:<br/>(Base * Multiplier) + UrgencyAdj - Penalty"] --> Clamping
        
        Clamping{"Score Clamping"}
        Clamping --> ClampHigh["If > 100, set 100"]
        Clamping --> ClampLow["If < 0, set 0"]
        
        ClampHigh --> AssignStatus
        ClampLow --> AssignStatus
        
        %% STATUS ASSIGNMENT
        AssignStatus{"Final Status Assignment"}
        AssignStatus -- "Was Locked/Knockout" --> StatLocked[LOCKED]
        AssignStatus -- "Premium Match" --> StatPremium[PREMIUM MATCH]
        AssignStatus -- "Score >= 85" --> StatBest[BEST FIT]
        AssignStatus -- "Score >= 65" --> StatGood[GOOD FIT]
        AssignStatus -- "Score < 65" --> StatBackup[BACKUP]
    end

    StatLocked & StatPremium & StatBest & StatGood & StatBackup --> Top5Selection

    subgraph FinalSort ["Final Selection Logic"]
        Top5Selection["Sort Lenders:<br/>1. Premium Matches (First)<br/>2. Locked Lenders (Last)<br/>3. Score (High to Low)<br/>4. Interest Rate (Low to High)*"]
        
        Top5Selection --> Slice["Take Top 5 Active Lenders"]
    end
    
    Slice --> Output(["Return JSON Response"])
```

## Edge Case Handling Table

| Scenario | Handling Logic | Outcome |
| :--- | :--- | :--- |
| **Missing University Name** | Treated as "Not in Ranked List" | **Base Score = 30**. No Premium Match possible. |
| **University Name Mismatch** | `includes()` Check (Partial Match) | Matches "Oxford" with "University of Oxford". |
| **Missing Intake Date** | Defaults to `YELLOW` Zone | Assumes matching is for standard timeline (60 days out). |
| **Missing Course Type** | Defaults to "Other" | **0.8x Multiplier** applied (conservative scoring). |
| **Null Loan Amount** | Uses 0 | Likely triggers `Loan Amount < Min` lockout if lender has min limit. |
| **Processing Time Unknown** | Uses Default (20 Days) | Neutral urgency score (no bonus/penalty). |
| **Score Overflow** | Clamped at 100 | Prevents scores like 115 if Lender is Premium + Fast. |
| **Score Underflow** | Clamped at 0 | Prevents negative scores if Locked + Slow. |
