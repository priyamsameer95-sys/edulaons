import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentApplicationData } from '@/hooks/useStudentApplication';
import { formatCurrency } from '@/utils/formatters';

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
            
            <span className="text-muted-foreground">Qualification:</span>
            <span className="font-medium">{data.qualification}</span>
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
            <span className="font-medium">{data.course}</span>
            
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
            
            <span className="text-muted-foreground">Annual Income:</span>
            <span className="font-medium">{formatCurrency(data.coApplicantSalary || 0)}</span>
            
            <span className="text-muted-foreground">PIN Code:</span>
            <span className="font-medium">{data.coApplicantPinCode}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrev}>Previous</Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </div>
  );
};

export default ReviewStep;
