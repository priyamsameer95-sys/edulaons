import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ScoreWeightsEditorProps {
  weights: {
    university_weight: number;
    student_weight: number;
    co_applicant_weight: number;
  };
  onChange: (weights: any) => void;
}

export const ScoreWeightsEditor = ({ weights, onChange }: ScoreWeightsEditorProps) => {
  const total = weights.university_weight + weights.student_weight + weights.co_applicant_weight;
  const isValid = total === 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Component Weights</CardTitle>
        <CardDescription>
          Configure how much each component contributes to the overall score. Total must equal 100%.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>University Weight (%)</Label>
            <Input
              type="number"
              value={weights.university_weight}
              onChange={(e) => onChange({
                ...weights,
                university_weight: parseFloat(e.target.value) || 0
              })}
              min={0}
              max={100}
            />
          </div>
          <div className="space-y-2">
            <Label>Student Weight (%)</Label>
            <Input
              type="number"
              value={weights.student_weight}
              onChange={(e) => onChange({
                ...weights,
                student_weight: parseFloat(e.target.value) || 0
              })}
              min={0}
              max={100}
            />
          </div>
          <div className="space-y-2">
            <Label>Co-Applicant Weight (%)</Label>
            <Input
              type="number"
              value={weights.co_applicant_weight}
              onChange={(e) => onChange({
                ...weights,
                co_applicant_weight: parseFloat(e.target.value) || 0
              })}
              min={0}
              max={100}
            />
          </div>
        </div>
        
        <div className={`flex items-center gap-2 p-3 rounded-md ${
          isValid ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {isValid ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="text-sm font-medium">
            Total: {total}% {isValid ? '✓' : '(must equal 100%)'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};