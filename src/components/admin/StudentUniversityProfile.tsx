import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Calendar, Globe, BookOpen } from "lucide-react";

interface University {
  name: string;
  country: string;
  city: string;
  global_rank: number | null;
}

interface Lead {
  study_destination: string;
  intake_month: number | null;
  intake_year: number | null;
  lead_universities?: Array<{
    universities: University;
  }>;
}

interface EligibilityScores {
  university_score: number;
  university_breakdown: any;
}

interface StudentUniversityProfileProps {
  lead: Lead;
  scores: EligibilityScores | null;
}

const StudentUniversityProfile = ({ lead, scores }: StudentUniversityProfileProps) => {
  const getUniversityGrade = (rank: number | null) => {
    if (!rank) return { grade: 'D', variant: 'outline' as const };
    if (rank <= 100) return { grade: 'A', variant: 'default' as const };
    if (rank <= 300) return { grade: 'B', variant: 'secondary' as const };
    if (rank <= 500) return { grade: 'C', variant: 'outline' as const };
    return { grade: 'D', variant: 'outline' as const };
  };

  const getMonthName = (month: number | null) => {
    if (!month) return 'N/A';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || 'N/A';
  };

  const universities = lead.lead_universities || [];

  return (
    <div className="space-y-6">
      {/* Study Destination */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Study Destination
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Country</label>
              <p className="font-medium text-lg">{lead.study_destination}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Intake</label>
              <p className="font-medium text-lg">
                {getMonthName(lead.intake_month)} {lead.intake_year || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* University Score Summary */}
      {scores && (
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                University Score
              </span>
              <span className="text-3xl font-bold text-primary">
                {Math.round(scores.university_score)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {scores.university_breakdown?.gradeScore !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">University Grade (80%)</span>
                  <span className="font-medium">{scores.university_breakdown.gradeScore.toFixed(1)}</span>
                </div>
              )}
              {scores.university_breakdown?.eligibilityScore !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Course Eligibility (20%)</span>
                  <span className="font-medium">{scores.university_breakdown.eligibilityScore.toFixed(1)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Universities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Selected Universities ({universities.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {universities.length > 0 ? (
            universities.map((uni, index) => {
              const grading = getUniversityGrade(uni.universities.global_rank);
              return (
                <div 
                  key={index}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {uni.universities.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {uni.universities.city}, {uni.universities.country}
                      </p>
                    </div>
                    <Badge variant={grading.variant} className="ml-2">
                      Grade {grading.grade}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    {uni.universities.global_rank && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">QS Rank:</span>
                        <span className="font-medium">#{uni.universities.global_rank}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No universities selected yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      {lead.intake_month && lead.intake_year && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Application Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">Target Intake</span>
                <span className="font-semibold">
                  {getMonthName(lead.intake_month)} {lead.intake_year}
                </span>
              </div>
              <div className="text-sm text-muted-foreground text-center mt-4">
                Application processing time: 4-8 weeks
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentUniversityProfile;
