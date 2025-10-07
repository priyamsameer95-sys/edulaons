import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { StudentApplicationData } from '@/hooks/useStudentApplication';

interface CoApplicantDetailsStepProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const CoApplicantDetailsStep = ({ data, onUpdate, onNext, onPrev }: CoApplicantDetailsStepProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="coApplicantName">Co-Applicant Name *</Label>
          <Input
            id="coApplicantName"
            value={data.coApplicantName || ''}
            onChange={(e) => onUpdate({ coApplicantName: e.target.value })}
            required
            placeholder="Enter co-applicant's name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coApplicantRelationship">Relationship *</Label>
          <Select value={data.coApplicantRelationship || ''} onValueChange={(value) => onUpdate({ coApplicantRelationship: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select relationship" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="spouse">Spouse</SelectItem>
              <SelectItem value="sibling">Sibling</SelectItem>
              <SelectItem value="guardian">Guardian</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="coApplicantPhone">Phone Number *</Label>
          <Input
            id="coApplicantPhone"
            type="tel"
            value={data.coApplicantPhone || ''}
            onChange={(e) => onUpdate({ coApplicantPhone: e.target.value })}
            required
            placeholder="Enter phone number"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coApplicantEmail">Email *</Label>
          <Input
            id="coApplicantEmail"
            type="email"
            value={data.coApplicantEmail || ''}
            onChange={(e) => onUpdate({ coApplicantEmail: e.target.value })}
            required
            placeholder="Enter email address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coApplicantSalary">Annual Income (₹) *</Label>
          <Input
            id="coApplicantSalary"
            type="number"
            value={data.coApplicantSalary || ''}
            onChange={(e) => onUpdate({ coApplicantSalary: parseFloat(e.target.value) })}
            required
            min="0"
            placeholder="Enter annual income"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coApplicantPinCode">PIN Code *</Label>
          <Input
            id="coApplicantPinCode"
            value={data.coApplicantPinCode || ''}
            onChange={(e) => onUpdate({ coApplicantPinCode: e.target.value })}
            required
            maxLength={6}
            placeholder="Enter PIN code"
          />
        </div>
      </div>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onPrev}>Previous</Button>
        <Button type="submit">Next</Button>
      </div>
    </form>
  );
};

export default CoApplicantDetailsStep;
