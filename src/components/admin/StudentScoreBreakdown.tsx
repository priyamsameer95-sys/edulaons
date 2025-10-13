import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScoreBreakdown {
  university: {
    gradeScore?: number;
    eligibilityScore?: number;
  };
  student: {
    academic?: number;
    qualification?: number;
    pinCode?: number;
    testBonus?: number;
  };
  coApplicant: {
    relationship?: number;
    employment?: number;
    salary?: number;
    pinCode?: number;
  };
}

interface StudentScoreBreakdownProps {
  scores: {
    university: number;
    student: number;
    coApplicant: number;
    overall: number;
  };
  breakdowns: ScoreBreakdown;
  eligibility: {
    status: string;
    reason?: string | null;
  };
}

const StudentScoreBreakdown = ({ scores, breakdowns, eligibility }: StudentScoreBreakdownProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 75) return "text-primary";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreTier = (score: number) => {
    if (score >= 90) return { label: "Excellent", variant: "default" as const };
    if (score >= 75) return { label: "Good", variant: "secondary" as const };
    if (score >= 60) return { label: "Average", variant: "outline" as const };
    return { label: "Below Threshold", variant: "destructive" as const };
  };

  const getEligibilityIcon = () => {
    switch (eligibility.status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'conditional':
        return <AlertTriangle className="h-5 w-5 text-warning" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const tier = getScoreTier(scores.overall);

  return (
    <div className="space-y-6">
      {/* Overall Score Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-2">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div>
              <div className={`text-6xl font-bold ${getScoreColor(scores.overall)}`}>
                {scores.overall.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground mt-2">Overall Profile Score</div>
            </div>
            <Badge variant={tier.variant} className="text-base px-4 py-1">
              {tier.label}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Eligibility Status */}
      <Alert variant={eligibility.status === 'approved' ? 'default' : 'destructive'}>
        <div className="flex items-center gap-3">
          {getEligibilityIcon()}
          <div className="flex-1">
            <div className="font-semibold capitalize">
              {eligibility.status === 'approved' ? 'Application Approved' : 
               eligibility.status === 'rejected' ? 'Application Rejected' : 
               'Under Review'}
            </div>
            {eligibility.reason && (
              <AlertDescription className="mt-1">
                {eligibility.reason}
              </AlertDescription>
            )}
          </div>
        </div>
      </Alert>

      {/* Individual Score Cards */}
      <div className="grid gap-4">
        {/* University Score */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">University Score</CardTitle>
              <span className={`text-3xl font-bold ${getScoreColor(scores.university)}`}>
                {Math.round(scores.university)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={scores.university} className="h-2" />
            {breakdowns.university && (
              <div className="space-y-2 text-sm">
                {breakdowns.university.gradeScore !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">University Grade (80%)</span>
                    <span className="font-medium">{breakdowns.university.gradeScore.toFixed(1)}</span>
                  </div>
                )}
                {breakdowns.university.eligibilityScore !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course Eligibility (20%)</span>
                    <span className="font-medium">{breakdowns.university.eligibilityScore.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Student Score */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Student Score</CardTitle>
              <span className={`text-3xl font-bold ${getScoreColor(scores.student)}`}>
                {Math.round(scores.student)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={scores.student} className="h-2" />
            {breakdowns.student && (
              <div className="space-y-2 text-sm">
                {breakdowns.student.academic !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Academic Performance (60%)</span>
                    <span className="font-medium">{breakdowns.student.academic.toFixed(1)}</span>
                  </div>
                )}
                {breakdowns.student.qualification !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Qualification (20%)</span>
                    <span className="font-medium">{breakdowns.student.qualification.toFixed(1)}</span>
                  </div>
                )}
                {breakdowns.student.pinCode !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location (10%)</span>
                    <span className="font-medium">{breakdowns.student.pinCode.toFixed(1)}</span>
                  </div>
                )}
                {breakdowns.student.testBonus !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Test Score Bonus (10%)</span>
                    <span className="font-medium">{breakdowns.student.testBonus.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Co-Applicant Score */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Co-Applicant Score</CardTitle>
              <span className={`text-3xl font-bold ${getScoreColor(scores.coApplicant)}`}>
                {Math.round(scores.coApplicant)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={scores.coApplicant} className="h-2" />
            {breakdowns.coApplicant && (
              <div className="space-y-2 text-sm">
                {breakdowns.coApplicant.relationship !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Relationship (25%)</span>
                    <span className="font-medium">{breakdowns.coApplicant.relationship.toFixed(1)}</span>
                  </div>
                )}
                {breakdowns.coApplicant.employment !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Employment (25%)</span>
                    <span className="font-medium">{breakdowns.coApplicant.employment.toFixed(1)}</span>
                  </div>
                )}
                {breakdowns.coApplicant.salary !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Salary (40%)</span>
                    <span className="font-medium">{breakdowns.coApplicant.salary.toFixed(1)}</span>
                  </div>
                )}
                {breakdowns.coApplicant.pinCode !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location (10%)</span>
                    <span className="font-medium">{breakdowns.coApplicant.pinCode.toFixed(1)}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentScoreBreakdown;
