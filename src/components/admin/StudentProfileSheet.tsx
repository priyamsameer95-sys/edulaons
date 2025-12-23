import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, GraduationCap, DollarSign, Building, FileText, ShieldAlert, MessageSquare, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import StudentScoreBreakdown from "./StudentScoreBreakdown";
import StudentAcademicProfile from "./StudentAcademicProfile";
import StudentFinancialProfile from "./StudentFinancialProfile";
import StudentUniversityProfile from "./StudentUniversityProfile";
import { ClarificationHistoryTab } from "./ClarificationHistoryTab";
import { RaiseClarificationModal } from "./RaiseClarificationModal";
import { FieldAuditTrail } from "./FieldAuditTrail";
import { Badge } from "@/components/ui/badge";
import { useStudentProfile } from "@/hooks/useStudentProfile";
import { useAuth } from "@/hooks/useAuth";
import { isSuperAdmin } from "@/utils/roleCheck";
import { useClarifications } from "@/hooks/useClarifications";

interface StudentProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string | null;
}

const StudentProfileSheet = ({ open, onOpenChange, leadId }: StudentProfileSheetProps) => {
  const { appUser } = useAuth();
  const { profile, scores, loading, error } = useStudentProfile(leadId);
  const { clarifications, templates, loading: clarificationsLoading, pendingCount, createClarification, resolveClarification, dismissClarification } = useClarifications({ leadId });
  const [showRaiseClarification, setShowRaiseClarification] = useState(false);

  // Only super_admin can access Student Profile
  if (!isSuperAdmin(appUser?.role)) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[600px]">
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <ShieldAlert className="h-16 w-16 text-destructive" />
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">
                Only Super Administrators can view Student Profiles.
              </p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!leadId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[900px] overflow-y-auto">
        <SheetHeader className="space-y-4 pb-6 border-b">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <SheetTitle className="text-2xl font-bold">Student Profile</SheetTitle>
              {loading ? (
                <Skeleton className="h-4 w-32" />
              ) : profile ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Case ID: {profile.lead.case_id}
                  </span>
                  {scores && (
                    <Badge 
                      variant={
                        scores.overall_score >= 90 ? "default" : 
                        scores.overall_score >= 75 ? "secondary" : 
                        scores.overall_score >= 60 ? "outline" : 
                        "destructive"
                      }
                      className="text-xs"
                    >
                      {Math.round(scores.overall_score)}/100
                    </Badge>
                  )}
                </div>
              ) : null}
            </div>
          </div>
          
          {profile?.lead.students && (
            <div>
              <h3 className="text-lg font-semibold">{profile.lead.students.name}</h3>
              <p className="text-sm text-muted-foreground">{profile.lead.students.email}</p>
            </div>
          )}
        </SheetHeader>

        {loading ? (
          <div className="space-y-4 mt-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-destructive">{error}</p>
          </div>
        ) : profile ? (
          <Tabs defaultValue="personal" className="mt-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="personal" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="hidden lg:inline">Personal</span>
              </TabsTrigger>
              <TabsTrigger value="scoring" className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                <span className="hidden lg:inline">Scoring</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span className="hidden lg:inline">Financial</span>
              </TabsTrigger>
              <TabsTrigger value="universities" className="flex items-center gap-1">
                <Building className="h-4 w-4" />
                <span className="hidden lg:inline">Unis</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span className="hidden lg:inline">Docs</span>
              </TabsTrigger>
              <TabsTrigger value="clarifications" className="flex items-center gap-1 relative">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden lg:inline">Q&A</span>
                {pendingCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
                    {pendingCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-1">
                <History className="h-4 w-4" />
                <span className="hidden lg:inline">Audit</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="mt-6">
              <StudentAcademicProfile 
                student={profile.lead.students}
                testScores={profile.testScores}
              />
            </TabsContent>

            <TabsContent value="scoring" className="mt-6">
              {scores ? (
                <StudentScoreBreakdown 
                  scores={{
                    university: scores.university_score,
                    student: scores.student_score,
                    coApplicant: scores.co_applicant_score,
                    overall: scores.overall_score
                  }}
                  breakdowns={{
                    university: scores.university_breakdown as any,
                    student: scores.student_breakdown as any,
                    coApplicant: scores.co_applicant_breakdown as any
                  }}
                  eligibility={{
                    status: scores.approval_status,
                    reason: scores.rejection_reason
                  }}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No eligibility scores calculated yet
                </div>
              )}
            </TabsContent>

            <TabsContent value="financial" className="mt-6">
              <StudentFinancialProfile 
                lead={profile.lead}
                coApplicant={profile.lead.co_applicants}
                scores={scores}
              />
            </TabsContent>

            <TabsContent value="universities" className="mt-6">
              <StudentUniversityProfile 
                lead={profile.lead}
                scores={scores}
              />
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
              <div className="text-center py-12 text-muted-foreground">
                Document management coming soon
              </div>
            </TabsContent>

            <TabsContent value="clarifications" className="mt-6">
              <ClarificationHistoryTab
                clarifications={clarifications}
                loading={clarificationsLoading}
                onResolve={resolveClarification}
                onDismiss={dismissClarification}
                onRaiseNew={() => setShowRaiseClarification(true)}
              />
            </TabsContent>

            <TabsContent value="audit" className="mt-6">
              <FieldAuditTrail leadId={leadId} />
            </TabsContent>
          </Tabs>
        ) : null}

        {leadId && (
          <RaiseClarificationModal
            open={showRaiseClarification}
            onOpenChange={setShowRaiseClarification}
            leadId={leadId}
            templates={templates}
            onSubmit={createClarification}
            createdBy={appUser?.id}
            createdByRole="admin"
          />
        )}
      </SheetContent>
    </Sheet>
  );
};

export default StudentProfileSheet;
