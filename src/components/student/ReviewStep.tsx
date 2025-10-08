import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudentApplicationContext } from '@/contexts/StudentApplicationContext';
import { formatCurrency } from '@/utils/formatters';

interface ReviewStepProps {
  onSubmit: () => void;
}

const ReviewStep = ({ onSubmit }: ReviewStepProps) => {
  const { applicationData, prevStep, isSubmitting } = useStudentApplicationContext();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Name:</span>
            <span className="font-medium">{applicationData.name}</span>
            
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{applicationData.phone}</span>
            
            <span className="text-muted-foreground">Date of Birth:</span>
            <span className="font-medium">{applicationData.dateOfBirth}</span>
            
            <span className="text-muted-foreground">Gender:</span>
            <span className="font-medium capitalize">{applicationData.gender}</span>
            
            <span className="text-muted-foreground">Location:</span>
            <span className="font-medium">{applicationData.city}, {applicationData.state} - {applicationData.postalCode}</span>
            
            <span className="text-muted-foreground">Qualification:</span>
            <span className="font-medium">{applicationData.qualification}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Study Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Course:</span>
            <span className="font-medium">{applicationData.course}</span>
            
            <span className="text-muted-foreground">Destination:</span>
            <span className="font-medium">{applicationData.studyDestination}</span>
            
            <span className="text-muted-foreground">Intake:</span>
            <span className="font-medium">
              {new Date(2000, (applicationData.intakeMonth || 1) - 1).toLocaleString('default', { month: 'long' })} {applicationData.intakeYear}
            </span>
            
            <span className="text-muted-foreground">Loan Amount:</span>
            <span className="font-medium">{formatCurrency(applicationData.loanAmount || 0)}</span>
            
            <span className="text-muted-foreground">Loan Type:</span>
            <span className="font-medium capitalize">{applicationData.loanType}</span>
            
            <span className="text-muted-foreground">Universities:</span>
            <span className="font-medium">{applicationData.universities?.length || 0} selected</span>
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
            <span className="font-medium">{applicationData.coApplicantName}</span>
            
            <span className="text-muted-foreground">Relationship:</span>
            <span className="font-medium capitalize">{applicationData.coApplicantRelationship}</span>
            
            <span className="text-muted-foreground">Phone:</span>
            <span className="font-medium">{applicationData.coApplicantPhone}</span>
            
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium">{applicationData.coApplicantEmail}</span>
            
            <span className="text-muted-foreground">Annual Income:</span>
            <span className="font-medium">{formatCurrency(applicationData.coApplicantSalary || 0)}</span>
            
            <span className="text-muted-foreground">PIN Code:</span>
            <span className="font-medium">{applicationData.coApplicantPinCode}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={prevStep}>Previous</Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
