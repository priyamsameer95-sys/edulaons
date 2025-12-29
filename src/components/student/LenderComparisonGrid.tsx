import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import LenderFeaturedCard from './LenderFeaturedCard';
import LenderRowCard from './LenderRowCard';

interface LenderData {
  lender_id: string;
  lender_name: string;
  lender_code: string;
  logo_url: string | null;
  interest_rate_min: number | null;
  interest_rate_max?: number | null;
  loan_amount_min?: number | null;
  loan_amount_max: number | null;
  processing_time_days: number | null;
  approval_rate?: number | null;
  compatibility_score: number;
  is_preferred?: boolean;
  eligible_loan_max?: number | null;
  student_facing_reason?: string;
  lender_description?: string | null;
  eligible_expenses?: any[] | null;
}

interface LenderComparisonGridProps {
  lenders: LenderData[];
  selectedLenderId: string | null;
  onSelect: (lenderId: string) => void;
  isUpdating: boolean;
}

const LenderComparisonGrid = ({
  lenders,
  selectedLenderId,
  onSelect,
  isUpdating
}: LenderComparisonGridProps) => {
  const [showAllOthers, setShowAllOthers] = useState(false);
  
  if (lenders.length === 0) return null;

  // Split lenders: top 3 featured, rest as "other qualified"
  const featuredLenders = lenders.slice(0, 3);
  const otherLenders = lenders.slice(3);
  const visibleOtherLenders = showAllOthers ? otherLenders : otherLenders.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-foreground">Top 3 Lender Recommendations</h3>
        <p className="text-sm text-muted-foreground">
          Personalized based on your financial profile and AI-driven insights.
        </p>
      </div>

      {/* Featured Lenders - Top 3 with equal height */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {featuredLenders.map((lender, index) => (
          <LenderFeaturedCard
            key={lender.lender_id}
            lender={lender}
            rank={index + 1}
            isSelected={selectedLenderId === lender.lender_id}
            onSelect={onSelect}
            isUpdating={isUpdating}
          />
        ))}
      </div>

      {/* Other Qualified Lenders Section */}
      {otherLenders.length > 0 && (
        <div className="space-y-4">
          {/* Section Divider */}
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground px-3 uppercase tracking-wider">
              Other Qualified Lenders
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Other Lenders List */}
          <div className="space-y-3">
            {visibleOtherLenders.map((lender) => (
              <LenderRowCard
                key={lender.lender_id}
                lender={lender}
                isSelected={selectedLenderId === lender.lender_id}
                onSelect={onSelect}
                isUpdating={isUpdating}
              />
            ))}
          </div>

          {/* Show More/Less Toggle */}
          {otherLenders.length > 3 && (
            <button
              onClick={() => setShowAllOthers(!showAllOthers)}
              className="flex items-center gap-1.5 mx-auto text-sm font-medium text-primary hover:text-primary/80 transition-colors py-2"
            >
              {showAllOthers ? 'Show fewer' : `View all ${otherLenders.length} lenders`}
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform duration-200",
                showAllOthers && "rotate-180"
              )} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LenderComparisonGrid;
