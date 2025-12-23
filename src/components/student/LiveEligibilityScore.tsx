import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Users, Building2, Sparkles, CheckCircle2 } from 'lucide-react';
import { StudentApplicationData } from '@/hooks/useStudentApplication';
import { cn } from '@/lib/utils';

interface LiveEligibilityScoreProps {
  data: Partial<StudentApplicationData>;
  className?: string;
}

export const LiveEligibilityScore = ({ data, className }: LiveEligibilityScoreProps) => {
  // Calculate eligibility score based on filled data
  const eligibilityData = useMemo(() => {
    let score = 0;
    let maxScore = 100;
    let breakdown: { label: string; score: number; max: number; filled: boolean }[] = [];

    // Personal details (10 points)
    const personalScore = [
      data.name,
      data.phone,
      data.dateOfBirth,
      data.postalCode,
      data.gender
    ].filter(Boolean).length * 2;
    breakdown.push({ label: 'Personal', score: personalScore, max: 10, filled: personalScore >= 8 });
    score += personalScore;

    // Academic scores (25 points)
    let academicScore = 0;
    if (data.highestQualification) academicScore += 5;
    if (data.tenthPercentage) {
      academicScore += Math.min(5, Math.floor(data.tenthPercentage / 20));
    }
    if (data.twelfthPercentage) {
      academicScore += Math.min(5, Math.floor(data.twelfthPercentage / 20));
    }
    if (data.bachelorsPercentage || data.bachelorsCgpa) academicScore += 5;
    if (data.tests && data.tests.length > 0) academicScore += 5;
    breakdown.push({ label: 'Academic', score: academicScore, max: 25, filled: academicScore >= 15 });
    score += academicScore;

    // Study details (30 points)
    let studyScore = 0;
    if (data.studyDestination) studyScore += 10;
    if (data.universities && data.universities.length > 0) studyScore += 10;
    if (data.loanAmount && data.loanAmount >= 500000) studyScore += 5;
    if (data.intakeMonth && data.intakeYear) studyScore += 5;
    breakdown.push({ label: 'Study Plans', score: studyScore, max: 30, filled: studyScore >= 20 });
    score += studyScore;

    // Co-applicant (35 points)
    let coApplicantScore = 0;
    if (data.coApplicantName) coApplicantScore += 5;
    if (data.coApplicantRelationship) coApplicantScore += 5;
    if (data.coApplicantPhone) coApplicantScore += 5;
    if (data.coApplicantEmploymentType) coApplicantScore += 5;
    if (data.coApplicantMonthlySalary) {
      if (data.coApplicantMonthlySalary >= 100000) coApplicantScore += 15;
      else if (data.coApplicantMonthlySalary >= 75000) coApplicantScore += 12;
      else if (data.coApplicantMonthlySalary >= 50000) coApplicantScore += 8;
      else coApplicantScore += 5;
    }
    breakdown.push({ label: 'Co-Applicant', score: coApplicantScore, max: 35, filled: coApplicantScore >= 25 });
    score += coApplicantScore;

    // Calculate approval likelihood
    let approvalLikelihood = 'Low';
    let approvalColor = 'text-warning';
    if (score >= 80) {
      approvalLikelihood = 'Very High';
      approvalColor = 'text-success';
    } else if (score >= 60) {
      approvalLikelihood = 'High';
      approvalColor = 'text-success';
    } else if (score >= 40) {
      approvalLikelihood = 'Medium';
      approvalColor = 'text-warning';
    }

    // Calculate matched lenders
    const matchedLenders = score >= 30 ? Math.min(5, Math.floor(score / 20) + 1) : 0;

    return { score, maxScore, breakdown, approvalLikelihood, approvalColor, matchedLenders };
  }, [data]);

  const scoreColor = eligibilityData.score >= 60 ? 'text-success' : 
                     eligibilityData.score >= 40 ? 'text-warning' : 'text-warning';

  return (
    <Card className={cn(
      "border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/5",
      "shadow-lg shadow-primary/10 overflow-hidden",
      className
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Live Eligibility</span>
        </div>

        {/* Score Circle */}
        <div className="flex items-center justify-center">
          <div className="relative">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted/30"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${(eligibilityData.score / 100) * 251.2} 251.2`}
                strokeLinecap="round"
                className={cn("transition-all duration-500", scoreColor)}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className={cn("text-2xl font-bold", scoreColor)}>
                {eligibilityData.score}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Approval</span>
            </div>
            <span className={cn("font-medium", eligibilityData.approvalColor)}>
              {eligibilityData.approvalLikelihood}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Lenders</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {eligibilityData.matchedLenders} matched
            </Badge>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-1.5 pt-2 border-t">
          {eligibilityData.breakdown.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.filled ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
              ) : (
                <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0" />
              )}
              <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
              <span className="text-xs font-medium">{item.score}/{item.max}</span>
            </div>
          ))}
        </div>

        {/* Motivational message */}
        {eligibilityData.score < 100 && (
          <p className="text-xs text-center text-muted-foreground pt-2 border-t">
            {eligibilityData.score < 30 && "Keep going! Fill in more details 🚀"}
            {eligibilityData.score >= 30 && eligibilityData.score < 60 && "Great progress! Almost halfway there 💪"}
            {eligibilityData.score >= 60 && eligibilityData.score < 80 && "Looking good! Just a few more steps 🎯"}
            {eligibilityData.score >= 80 && "Almost there! Complete to submit 🔥"}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
