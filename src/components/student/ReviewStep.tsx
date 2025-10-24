import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StudentApplicationData } from '@/hooks/useStudentApplication';
import { formatCurrency } from '@/utils/formatters';
import { Loader2, Edit, CheckCircle2, User, GraduationCap, Plane, Users } from 'lucide-react';

interface ReviewStepProps {
  data: Partial<StudentApplicationData>;
  onSubmit: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
  goToStep?: (step: number) => void;
}

const ReviewStep = ({ data, onSubmit, onPrev, isSubmitting, goToStep }: ReviewStepProps) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2 stagger-fade-1">
        <h2 className="text-2xl font-bold">Review Your Application</h2>
        <p className="text-muted-foreground">Please review all details before submitting</p>
      </div>

      {/* Personal Details */}
      <Card className="premium-card hover-lift stagger-fade-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Personal Details</CardTitle>
          </div>
          {goToStep && (
            <Button variant="ghost" size="sm" onClick={() => goToStep(0)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Name</span>
              <p className="font-medium">{data.name}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Phone</span>
              <p className="font-medium">{data.phone}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Date of Birth</span>
              <p className="font-medium">{data.dateOfBirth}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Gender</span>
              <p className="font-medium capitalize">{data.gender}</p>
            </div>
            <div className="space-y-1 col-span-2">
              <span className="text-muted-foreground text-xs">Location</span>
              <p className="font-medium">{data.city}, {data.state} - {data.postalCode}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Academic Background */}
      <Card className="premium-card hover-lift stagger-fade-3">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Academic Background</CardTitle>
          </div>
          {goToStep && (
            <Button variant="ghost" size="sm" onClick={() => goToStep(1)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <span className="text-muted-foreground text-xs">Highest Qualification</span>
              <Badge variant="secondary">{data.highestQualification || 'Not provided'}</Badge>
            </div>
            {data.tenthPercentage && (
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">10th Percentage</span>
                <p className="font-medium">{data.tenthPercentage}%</p>
              </div>
            )}
            {data.twelfthPercentage && (
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">12th Percentage</span>
                <p className="font-medium">{data.twelfthPercentage}%</p>
              </div>
            )}
            {data.bachelorsPercentage && (
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">Bachelor's Percentage</span>
                <p className="font-medium">{data.bachelorsPercentage}%</p>
              </div>
            )}
            {data.bachelorsCgpa && (
              <div className="space-y-1">
                <span className="text-muted-foreground text-xs">Bachelor's CGPA</span>
                <p className="font-medium">{data.bachelorsCgpa}</p>
              </div>
            )}
          </div>
          {data.tests && data.tests.length > 0 && (
            <div className="pt-3 border-t space-y-2">
              <span className="text-muted-foreground text-xs font-semibold">Test Scores</span>
              {data.tests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="font-medium">{test.testType}</span>
                  <Badge>{test.testScore}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Study Details */}
      <Card className="premium-card hover-lift stagger-fade-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plane className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Study Details</CardTitle>
          </div>
          {goToStep && (
            <Button variant="ghost" size="sm" onClick={() => goToStep(2)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Destination</span>
              <p className="font-medium">{data.studyDestination}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Intake</span>
              <p className="font-medium">
                {new Date(2000, (data.intakeMonth || 1) - 1).toLocaleString('default', { month: 'long' })} {data.intakeYear}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Loan Amount</span>
              <p className="font-medium text-primary text-lg">{formatCurrency(data.loanAmount || 0)}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Loan Type</span>
              <Badge variant="outline" className="capitalize">{data.loanType}</Badge>
            </div>
            <div className="space-y-1 col-span-2">
              <span className="text-muted-foreground text-xs">Universities</span>
              <p className="font-medium">{data.universities?.length || 0} selected</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Co-Applicant Details */}
      <Card className="premium-card hover-lift stagger-fade-5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Co-Applicant Details</CardTitle>
          </div>
          {goToStep && (
            <Button variant="ghost" size="sm" onClick={() => goToStep(3)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Name</span>
              <p className="font-medium">{data.coApplicantName}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Relationship</span>
              <p className="font-medium capitalize">{data.coApplicantRelationship}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Phone</span>
              <p className="font-medium">{data.coApplicantPhone}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Email</span>
              <p className="font-medium">{data.coApplicantEmail}</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Monthly Salary</span>
              <p className="font-medium text-primary">₹{data.coApplicantMonthlySalary?.toLocaleString('en-IN') || '0'}/mo</p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground text-xs">Employment</span>
              <Badge variant="secondary" className="capitalize">{data.coApplicantEmploymentType || 'Not provided'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation */}
      <Card className="bg-success/5 border-success/20 stagger-fade-6">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Ready to submit?</p>
              <p className="text-sm text-muted-foreground">
                By submitting this application, you confirm that all information provided is accurate and complete.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-8">
        <Button onClick={onPrev} variant="outline" size="lg" disabled={isSubmitting} className="hover-lift">
          ← Previous
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting} 
          size="lg"
          className="relative overflow-hidden min-w-[240px] hover-lift animate-gentle-pulse"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <span className="relative z-10">🎯 Submit Application</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
