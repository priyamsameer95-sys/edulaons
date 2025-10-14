import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentApplicationData } from '@/hooks/useStudentApplication';
import { formatCurrency } from '@/utils/formatters';
import { Loader2 } from 'lucide-react';

interface ReviewStepProps {
  data: Partial<StudentApplicationData>;
  onSubmit: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
}

const ReviewStep = ({ data, onSubmit, onPrev, isSubmitting }: ReviewStepProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{data.name}</span>
            
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{data.phone}</span>
            
            <span className="text-muted-foreground">Date of Birth:</span>
            <span className="font-medium">{data.dateOfBirth}</span>
            
            <span className="text-muted-foreground">Gender:</span>
            <span className="font-medium capitalize">{data.gender}</span>
            
            <span className="text-muted-foreground">Location:</span>
            <span className="font-medium">{data.city}, {data.state} - {data.postalCode}</span>
            
            <span className="text-muted-foreground">Highest Qualification:</span>
            <span className="font-medium">{data.highestQualification || 'Not provided'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Academic Background</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            {data.tenthPercentage && (
              <>
                <span className="text-muted-foreground">10th Percentage:</span>
                <span className="font-medium">{data.tenthPercentage}%</span>
              </>
            )}
            
            {data.twelfthPercentage && (
              <>
                <span className="text-muted-foreground">12th Percentage:</span>
                <span className="font-medium">{data.twelfthPercentage}%</span>
              </>
            )}
            
            {data.bachelorsPercentage && (
              <>
                <span className="text-muted-foreground">Bachelor's Percentage:</span>
                <span className="font-medium">{data.bachelorsPercentage}%</span>
              </>
            )}
            
            {data.bachelorsCgpa && (
              <>
                <span className="text-muted-foreground">Bachelor's CGPA:</span>
                <span className="font-medium">{data.bachelorsCgpa}</span>
              </>
            )}
            
            {data.testType && (
              <>
                <span className="text-muted-foreground">Test Type:</span>
                <span className="font-medium">{data.testType}</span>
              </>
            )}
            
            {data.testScore && (
              <>
                <span className="text-muted-foreground">Test Score:</span>
                <span className="font-medium">{data.testScore}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Study Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            
            <span className="text-muted-foreground">Destination:</span>
            <span className="font-medium">{data.studyDestination}</span>
            
            <span className="text-muted-foreground">Intake:</span>
            <span className="font-medium">
              {new Date(2000, (data.intakeMonth || 1) - 1).toLocaleString('default', { month: 'long' })} {data.intakeYear}
            </span>
            
            <span className="text-muted-foreground">Loan Amount:</span>
            <span className="font-medium">{formatCurrency(data.loanAmount || 0)}</span>
            
            <span className="text-muted-foreground">Loan Type:</span>
            <span className="font-medium capitalize">{data.loanType}</span>
            
            <span className="text-muted-foreground">Universities:</span>
            <span className="font-medium">{data.universities?.length || 0} selected</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Co-Applicant Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{data.coApplicantName}</span>
            
            <span className="text-muted-foreground">Relationship:</span>
            <span className="font-medium capitalize">{data.coApplicantRelationship}</span>
            
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{data.coApplicantPhone}</span>
            
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{data.coApplicantEmail}</span>
            
            <span className="text-muted-foreground">Monthly Salary:</span>
            <span className="font-medium">₹{data.coApplicantMonthlySalary?.toLocaleString('en-IN') || '0'}/month</span>
            
            <span className="text-muted-foreground">Employment Type:</span>
            <span className="font-medium capitalize">{data.coApplicantEmploymentType || 'Not provided'}</span>
            
            <span className="text-muted-foreground">PIN Code:</span>
            <span className="font-medium">{data.coApplicantPinCode}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between mt-6">
        <Button onClick={onPrev} variant="outline" size="lg" disabled={isSubmitting}>
          Previous
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting} 
          size="lg"
          className="relative overflow-hidden group min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <span className="relative z-10">Submit Application</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
