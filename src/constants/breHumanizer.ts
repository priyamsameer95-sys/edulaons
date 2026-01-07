/**
 * BRE Humanizer - Translates technical BRE tags into human-friendly messages
 * 
 * This module transforms "robotic" validation output into warm, consultative
 * guidance that feels like talking to a senior loan advisor.
 */

export interface HumanizedBREFactor {
  label: string;           // "Global Destination Support"
  description: string;     // "They accept students studying anywhere..."
  impact: 'high' | 'medium' | 'low';
  category: 'strength' | 'eligibility' | 'consideration';
  icon?: 'star' | 'check' | 'info' | 'alert';
}

export interface ScoreInsight {
  label: string;
  message: string;
  variant: 'excellent' | 'strong' | 'good' | 'explore';
}

export interface ProTip {
  title: string;
  message: string;
  type: 'opportunity' | 'info' | 'action';
}

// ============================================================================
// BRE TAG TRANSLATIONS
// ============================================================================

export const BRE_TRANSLATIONS: Record<string, HumanizedBREFactor> = {
  // ==================== DESTINATION FACTORS ====================
  'DESTINATION_PREFERENCES_NONE': {
    label: 'Global Destination Support',
    description: 'No country restrictions — your study plans fit perfectly.',
    impact: 'medium',
    category: 'eligibility',
    icon: 'check',
  },
  'Preferred destination': {
    label: 'Preferred Study Destination',
    description: 'This lender specializes in your chosen country.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },
  'Non-preferred destination': {
    label: 'Destination Consideration',
    description: 'Your destination isn\'t their primary focus, but still supported.',
    impact: 'low',
    category: 'consideration',
    icon: 'info',
  },

  // ==================== COURSE/EDUCATION FACTORS ====================
  'COURSES_ALLOWED_POSTGRADUATE': {
    label: 'Masters-Ready Lender',
    description: 'Specializes in postgraduate education loans like yours.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },
  'COURSES_ALLOWED_UNDERGRADUATE': {
    label: 'Undergraduate Specialist',
    description: 'Strong track record with undergraduate study loans.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },
  'COURSES_MBA_MANAGEMENT': {
    label: 'MBA Specialist',
    description: 'Well-versed in business school financing requirements.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },
  'COURSES_STEM': {
    label: 'STEM Program Expert',
    description: 'Experienced with technical and engineering programs.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },
  'Education loan specialist': {
    label: 'Education Loan Expert',
    description: 'Focuses exclusively on education financing.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },

  // ==================== INCOME/FINANCIAL FACTORS ====================
  'CO_APPLICANT_SALARIED_MIN_MONTHLY': {
    label: 'Strong Financial Backing',
    description: 'Your co-applicant\'s stable income is a major advantage.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },
  'Income meets expectations': {
    label: 'Income Requirements Met',
    description: 'The financial backing matches what this lender looks for.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },
  'Strong income profile': {
    label: 'Excellent Financial Profile',
    description: 'Strong income significantly improves approval chances.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },
  'Income below expectations': {
    label: 'Income Consideration',
    description: 'Income is slightly below their typical expectation.',
    impact: 'medium',
    category: 'consideration',
    icon: 'alert',
  },
  'Salaried employment': {
    label: 'Stable Employment Verified',
    description: 'Salaried income is preferred by this lender.',
    impact: 'medium',
    category: 'eligibility',
    icon: 'check',
  },
  'Government employment': {
    label: 'Government Employment Bonus',
    description: 'Government employees receive preferential treatment.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },
  'Self-employed': {
    label: 'Self-Employment Accepted',
    description: 'This lender works with self-employed applicants.',
    impact: 'low',
    category: 'eligibility',
    icon: 'check',
  },

  // ==================== LOAN AMOUNT FACTORS ====================
  'LOAN_AMOUNT_SECURED_RANGE': {
    label: 'Loan Amount Covered',
    description: 'Your requested amount fits within their secured loan range.',
    impact: 'medium',
    category: 'eligibility',
    icon: 'check',
  },
  'LOAN_AMOUNT_UNSECURED_RANGE': {
    label: 'Unsecured Loan Available',
    description: 'Your amount qualifies for an unsecured loan option.',
    impact: 'medium',
    category: 'eligibility',
    icon: 'check',
  },
  'Loan amount within range': {
    label: 'Loan Amount Approved',
    description: 'The amount you need is well within their offering.',
    impact: 'medium',
    category: 'eligibility',
    icon: 'check',
  },
  'Good loan headroom available': {
    label: 'Room for Flexibility',
    description: 'They can offer more if your needs change.',
    impact: 'medium',
    category: 'strength',
    icon: 'star',
  },
  'Sufficient loan capacity': {
    label: 'Adequate Loan Capacity',
    description: 'They can cover your loan requirement.',
    impact: 'medium',
    category: 'eligibility',
    icon: 'check',
  },
  'Loan amount below minimum': {
    label: 'Below Minimum Amount',
    description: 'Your loan amount is less than their minimum.',
    impact: 'high',
    category: 'consideration',
    icon: 'alert',
  },
  'Loan amount exceeds maximum': {
    label: 'Exceeds Maximum Limit',
    description: 'Your requirement exceeds their maximum offering.',
    impact: 'high',
    category: 'consideration',
    icon: 'alert',
  },
  'LOAN_AMOUNT_EXCEEDS_MAX': {
    label: 'Loan Amount Exceeds Limit',
    description: 'Your requested amount exceeds this lender\'s maximum limit. Consider splitting between lenders or adding collateral.',
    impact: 'high',
    category: 'consideration',
    icon: 'alert',
  },
  'LOAN_AMOUNT_BELOW_MIN': {
    label: 'Below Minimum Amount',
    description: 'Your loan amount is below this lender\'s minimum threshold.',
    impact: 'high',
    category: 'consideration',
    icon: 'alert',
  },

  // ==================== PROCESSING & SERVICE FACTORS ====================
  'Competitive interest rate': {
    label: 'Competitive Rates',
    description: 'One of the best interest rates in the market.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },
  'Higher interest rate': {
    label: 'Rate Consideration',
    description: 'Interest rates are on the higher side.',
    impact: 'medium',
    category: 'consideration',
    icon: 'info',
  },
  'Fast processing time': {
    label: 'Quick Processing',
    description: 'Known for fast loan approvals and disbursements.',
    impact: 'medium',
    category: 'strength',
    icon: 'star',
  },
  'Excellent service record': {
    label: 'Excellent Service',
    description: 'Highly rated for customer experience and support.',
    impact: 'medium',
    category: 'strength',
    icon: 'star',
  },
  'Good service record': {
    label: 'Reliable Service',
    description: 'Consistent and dependable loan servicing.',
    impact: 'low',
    category: 'eligibility',
    icon: 'check',
  },

  // ==================== PRIORITY/RANKING FACTORS ====================
  'Priority lender (rank 1)': {
    label: 'Top Priority Lender',
    description: 'Our highest recommended lender for your profile.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },
  'Priority lender (rank 2)': {
    label: 'Highly Recommended',
    description: 'Second-choice lender with excellent fit.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },
  'Priority lender (rank 3)': {
    label: 'Recommended Option',
    description: 'A solid third-choice lender to consider.',
    impact: 'medium',
    category: 'strength',
    icon: 'star',
  },

  // ==================== COLLATERAL FACTORS ====================
  'COLLATERAL_PROPERTY_ACCEPTED': {
    label: 'Property Collateral Accepted',
    description: 'They accept property as security for better rates.',
    impact: 'medium',
    category: 'eligibility',
    icon: 'check',
  },
  'COLLATERAL_NOT_REQUIRED': {
    label: 'No Collateral Needed',
    description: 'Unsecured loan option available.',
    impact: 'medium',
    category: 'eligibility',
    icon: 'check',
  },

  // ==================== UNIVERSITY FACTORS ====================
  'UNIVERSITY_TIER_1_PREFERRED': {
    label: 'Top University Match',
    description: 'Your university ranking is highly favored.',
    impact: 'high',
    category: 'strength',
    icon: 'star',
  },
  'UNIVERSITY_ACCEPTED': {
    label: 'University Approved',
    description: 'Your university is on their approved list.',
    impact: 'medium',
    category: 'eligibility',
    icon: 'check',
  },
};

// ============================================================================
// SCORE INSIGHT GENERATOR
// ============================================================================

export function getScoreInsight(
  score: number, 
  lenderName: string, 
  topLenderName?: string,
  gapReason?: string
): ScoreInsight {
  if (score >= 85) {
    return {
      label: 'Excellent Match',
      message: `Your profile aligns perfectly with ${lenderName}'s preferred borrower profile. High approval likelihood.`,
      variant: 'excellent',
    };
  }
  
  if (score >= 70) {
    const gapText = gapReason 
      ? ` ${gapReason}` 
      : topLenderName && topLenderName !== lenderName 
        ? ` ${topLenderName} may offer faster processing for your profile.`
        : '';
    return {
      label: 'Strong Option',
      message: `You meet all key criteria for ${lenderName}.${gapText}`,
      variant: 'strong',
    };
  }
  
  if (score >= 55) {
    return {
      label: 'Good Backup',
      message: `A solid option to consider. ${lenderName} works well for your destination and course type.`,
      variant: 'good',
    };
  }
  
  return {
    label: 'Worth Exploring',
    message: `Some conditions may apply. Review the details to see if ${lenderName} works for your situation.`,
    variant: 'explore',
  };
}

// ============================================================================
// PRO-TIP GENERATOR
// ============================================================================

interface ProTipContext {
  loanAmount?: number;
  maxUnsecuredLimit?: number;
  processingTimeAdvantage?: boolean;
  hasCollateral?: boolean;
  incomeExceedsExpectations?: boolean;
  universityRankConcern?: boolean;
  factors?: string[];
}

export function generateProTip(context: ProTipContext): ProTip | null {
  const { 
    loanAmount, 
    maxUnsecuredLimit, 
    processingTimeAdvantage,
    hasCollateral,
    incomeExceedsExpectations,
    factors = []
  } = context;

  // Near unsecured limit - suggest collateral
  if (loanAmount && maxUnsecuredLimit && loanAmount >= maxUnsecuredLimit * 0.85 && !hasCollateral) {
    return {
      title: 'Interest Rate Opportunity',
      message: 'You\'re near the unsecured loan limit. Adding property as collateral could reduce your interest rate by 1-1.5%.',
      type: 'opportunity',
    };
  }

  // Fast processing advantage
  if (processingTimeAdvantage || factors.includes('Fast processing time')) {
    return {
      title: 'Quick Turnaround',
      message: 'This lender is known for fast approvals — ideal if you have upcoming tuition deadlines.',
      type: 'info',
    };
  }

  // Strong income profile
  if (incomeExceedsExpectations || factors.includes('Strong income profile')) {
    return {
      title: 'Negotiation Leverage',
      message: 'Your strong financial profile may give you room to negotiate better terms or faster processing.',
      type: 'opportunity',
    };
  }

  // Education loan specialist
  if (factors.includes('Education loan specialist')) {
    return {
      title: 'Specialized Expertise',
      message: 'Education-focused lenders often have more flexible documentation requirements and understand student needs better.',
      type: 'info',
    };
  }

  // Competitive rates
  if (factors.includes('Competitive interest rate')) {
    return {
      title: 'Cost Savings',
      message: 'This lender offers one of the most competitive rates, which could save you lakhs over the loan tenure.',
      type: 'opportunity',
    };
  }

  return null;
}

// ============================================================================
// FACTOR HUMANIZER
// ============================================================================

export function humanizeFactor(rawFactor: string): HumanizedBREFactor {
  // Direct match
  if (BRE_TRANSLATIONS[rawFactor]) {
    return BRE_TRANSLATIONS[rawFactor];
  }

  // Partial match for priority lender variants
  if (rawFactor.startsWith('Priority lender (rank')) {
    const rankMatch = rawFactor.match(/rank (\d+)/);
    const rank = rankMatch ? parseInt(rankMatch[1]) : 4;
    if (rank <= 3) {
      return BRE_TRANSLATIONS[`Priority lender (rank ${Math.min(rank, 3)})`] || createGenericFactor(rawFactor);
    }
  }

  // Fuzzy matching for common patterns
  const lowerFactor = rawFactor.toLowerCase();
  
  if (lowerFactor.includes('destination') && !lowerFactor.includes('non-preferred')) {
    return BRE_TRANSLATIONS['DESTINATION_PREFERENCES_NONE'];
  }
  
  if (lowerFactor.includes('postgraduate') || lowerFactor.includes('masters')) {
    return BRE_TRANSLATIONS['COURSES_ALLOWED_POSTGRADUATE'];
  }
  
  if (lowerFactor.includes('income') && lowerFactor.includes('meet')) {
    return BRE_TRANSLATIONS['Income meets expectations'];
  }
  
  if (lowerFactor.includes('loan') && lowerFactor.includes('range')) {
    return BRE_TRANSLATIONS['Loan amount within range'];
  }
  
  if (lowerFactor.includes('salaried')) {
    return BRE_TRANSLATIONS['Salaried employment'];
  }
  
  if (lowerFactor.includes('interest') && lowerFactor.includes('competitive')) {
    return BRE_TRANSLATIONS['Competitive interest rate'];
  }
  
  if (lowerFactor.includes('processing') && lowerFactor.includes('fast')) {
    return BRE_TRANSLATIONS['Fast processing time'];
  }

  // Generic fallback
  return createGenericFactor(rawFactor);
}

function createGenericFactor(rawFactor: string): HumanizedBREFactor {
  // Clean up the raw factor for display
  // Handle SCREAMING_SNAKE_CASE, camelCase, and mixed formats
  const cleanedLabel = rawFactor
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Only add space before uppercase if preceded by lowercase (for camelCase)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim()
    // Title case each word
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return {
    label: cleanedLabel,
    description: 'This criteria has been evaluated for your profile.',
    impact: 'low',
    category: 'eligibility',
    icon: 'check',
  };
}

// ============================================================================
// GROUP FACTORS BY CATEGORY
// ============================================================================

export interface GroupedFactors {
  bigWins: HumanizedBREFactor[];
  eligibilityMet: HumanizedBREFactor[];
  considerations: HumanizedBREFactor[];
}

export function groupAndHumanizeFactors(
  matchedRules: string[], 
  riskFlags: string[] = []
): GroupedFactors {
  const humanizedMatches = matchedRules.map(humanizeFactor);
  const humanizedRisks = riskFlags.map(flag => ({
    ...humanizeFactor(flag),
    category: 'consideration' as const,
    icon: 'alert' as const,
  }));

  const bigWins = humanizedMatches
    .filter(f => f.impact === 'high' && f.category === 'strength')
    .slice(0, 3);

  const eligibilityMet = humanizedMatches
    .filter(f => f.category === 'eligibility' || (f.category === 'strength' && f.impact !== 'high'))
    .slice(0, 5);

  const considerations = [
    ...humanizedMatches.filter(f => f.category === 'consideration'),
    ...humanizedRisks,
  ].slice(0, 3);

  return { bigWins, eligibilityMet, considerations };
}
