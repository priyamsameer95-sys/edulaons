import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { StudentApplicationData } from '@/hooks/useStudentApplication';

interface StudyDetailsStepProps {
  data: Partial<StudentApplicationData>;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

const StudyDetailsStep = ({ data, onUpdate, onNext, onPrev }: StudyDetailsStepProps) => {
  const currentYear = new Date().getFullYear();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Select Universities (up to 3) *</Label>
          <Input
            placeholder="Enter university IDs (comma-separated)"
            value={data.universities?.join(', ') || ''}
            onChange={(e) => onUpdate({ universities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            required
          />
          <p className="text-xs text-muted-foreground">
            Enter up to 3 university IDs separated by commas
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="course">Course/Program *</Label>
          <Input
            id="course"
            value={data.course || ''}
            onChange={(e) => onUpdate({ course: e.target.value })}
            required
            placeholder="e.g., Master of Science in Computer Science"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="studyDestination">Study Destination *</Label>
            <Select value={data.studyDestination || ''} onValueChange={(value) => onUpdate({ studyDestination: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USA">USA</SelectItem>
                <SelectItem value="UK">UK</SelectItem>
                <SelectItem value="Canada">Canada</SelectItem>
                <SelectItem value="Australia">Australia</SelectItem>
                <SelectItem value="Germany">Germany</SelectItem>
                <SelectItem value="Ireland">Ireland</SelectItem>
                <SelectItem value="New Zealand">New Zealand</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loanType">Loan Type *</Label>
            <Select value={data.loanType || 'secured'} onValueChange={(value) => onUpdate({ loanType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select loan type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="secured">Secured</SelectItem>
                <SelectItem value="unsecured">Unsecured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="intakeMonth">Intake Month *</Label>
            <Select value={data.intakeMonth?.toString() || ''} onValueChange={(value) => onUpdate({ intakeMonth: parseInt(value) })}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="intakeYear">Intake Year *</Label>
            <Select value={data.intakeYear?.toString() || ''} onValueChange={(value) => onUpdate({ intakeYear: parseInt(value) })}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 3 }, (_, i) => (
                  <SelectItem key={currentYear + i} value={(currentYear + i).toString()}>
                    {currentYear + i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="loanAmount">Loan Amount (₹) *</Label>
          <Input
            id="loanAmount"
            type="number"
            value={data.loanAmount || ''}
            onChange={(e) => onUpdate({ loanAmount: parseFloat(e.target.value) })}
            required
            min="100000"
            placeholder="Enter loan amount"
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

export default StudyDetailsStep;
