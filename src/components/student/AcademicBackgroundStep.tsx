import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CoachingTooltip } from './CoachingTooltip';
import { QUALIFICATIONS, ACADEMIC_VALIDATION, TEST_TYPES } from '@/constants/studentApplication';
import { StudentApplicationData } from '@/hooks/useStudentApplication';
import { Info, Award, ChevronLeft, ChevronRight } from 'lucide-react';

interface AcademicBackgroundStepProps {
  data: StudentApplicationData;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function AcademicBackgroundStep({ data, onUpdate, onNext, onPrev }: AcademicBackgroundStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTestScores, setShowTestScores] = useState(false);

  const validateField = (name: string, value: any): string => {
    if (name === 'tenthPercentage' && value) {
      const num = parseFloat(value);
      if (isNaN(num) || num < ACADEMIC_VALIDATION.tenth.min || num > ACADEMIC_VALIDATION.tenth.max) {
        return `Must be between ${ACADEMIC_VALIDATION.tenth.min}-${ACADEMIC_VALIDATION.tenth.max}`;
      }
    }
    if (name === 'twelfthPercentage' && value) {
      const num = parseFloat(value);
      if (isNaN(num) || num < ACADEMIC_VALIDATION.twelfth.min || num > ACADEMIC_VALIDATION.twelfth.max) {
        return `Must be between ${ACADEMIC_VALIDATION.twelfth.min}-${ACADEMIC_VALIDATION.twelfth.max}`;
      }
    }
    if (name === 'bachelorsPercentage' && value) {
      const num = parseFloat(value);
      if (isNaN(num) || num < ACADEMIC_VALIDATION.bachelors_percentage.min || num > ACADEMIC_VALIDATION.bachelors_percentage.max) {
        return `Must be between ${ACADEMIC_VALIDATION.bachelors_percentage.min}-${ACADEMIC_VALIDATION.bachelors_percentage.max}`;
      }
    }
    if (name === 'bachelorsCgpa' && value) {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > ACADEMIC_VALIDATION.bachelors_cgpa.max) {
        return `Must be between 0-${ACADEMIC_VALIDATION.bachelors_cgpa.max}`;
      }
    }
    if (name === 'testScore' && value && data.testType) {
      const num = parseFloat(value);
      const validation = ACADEMIC_VALIDATION.test_scores[data.testType];
      if (isNaN(num) || num < validation.min || num > validation.max) {
        return `${data.testType} score must be between ${validation.min}-${validation.max}`;
      }
    }
    return '';
  };

  const handleChange = (name: string, value: any) => {
    onUpdate({ [name]: value });
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!data.highestQualification) {
      newErrors.highestQualification = 'Please select your highest qualification';
    }

    // Validate academic marks based on qualification
    const needsSchoolMarks = ['12th', 'diploma', 'bachelors', 'masters', 'phd'].includes(data.highestQualification);
    if (needsSchoolMarks) {
      if (!data.tenthPercentage) {
        newErrors.tenthPercentage = '10th percentage is required for eligibility scoring';
      } else {
        const error = validateField('tenthPercentage', data.tenthPercentage);
        if (error) newErrors.tenthPercentage = error;
      }

      if (!data.twelfthPercentage) {
        newErrors.twelfthPercentage = '12th percentage is required for eligibility scoring';
      } else {
        const error = validateField('twelfthPercentage', data.twelfthPercentage);
        if (error) newErrors.twelfthPercentage = error;
      }
    }

    const needsBachelors = ['bachelors', 'masters', 'phd'].includes(data.highestQualification);
    if (needsBachelors && !data.bachelorsPercentage && !data.bachelorsCgpa) {
      newErrors.bachelorsPercentage = 'Please provide either percentage or CGPA';
    }

    if (data.testType && data.testScore) {
      const error = validateField('testScore', data.testScore);
      if (error) newErrors.testScore = error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  const showSchoolMarks = ['12th', 'diploma', 'bachelors', 'masters', 'phd'].includes(data.highestQualification);
  const showBachelorsMarks = ['bachelors', 'masters', 'phd'].includes(data.highestQualification);

  const getScoreIndicator = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return { color: 'text-green-600', label: 'Excellent' };
    if (percentage >= 60) return { color: 'text-blue-600', label: 'Good' };
    if (percentage >= 40) return { color: 'text-yellow-600', label: 'Average' };
    return { color: 'text-red-600', label: 'Below Average' };
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <CoachingTooltip message="Your academic background helps us match you with the best lenders and determine your eligibility">
              <Label htmlFor="highestQualification">
                Highest Qualification <span className="text-destructive">*</span>
              </Label>
            </CoachingTooltip>
            <Select
              value={data.highestQualification}
              onValueChange={(value) => handleChange('highestQualification', value)}
            >
              <SelectTrigger id="highestQualification">
                <SelectValue placeholder="Select your qualification" />
              </SelectTrigger>
              <SelectContent>
                {QUALIFICATIONS.map((qual) => (
                  <SelectItem key={qual.value} value={qual.value}>
                    {qual.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.highestQualification && (
              <p className="text-sm text-destructive">{errors.highestQualification}</p>
            )}
          </div>

          {showSchoolMarks && (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Academic scores can add up to 40 points to your eligibility score!
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <CoachingTooltip message="Your 10th grade percentage. Higher marks improve eligibility (worth up to 10 points)">
                    <Label htmlFor="tenthPercentage">
                      10th Percentage <span className="text-destructive">*</span>
                    </Label>
                  </CoachingTooltip>
                  <Input
                    id="tenthPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="85.5"
                    value={data.tenthPercentage || ''}
                    onChange={(e) => handleChange('tenthPercentage', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                  {errors.tenthPercentage && (
                    <p className="text-sm text-destructive">{errors.tenthPercentage}</p>
                  )}
                  {data.tenthPercentage && !errors.tenthPercentage && (
                    <p className={`text-sm ${getScoreIndicator(data.tenthPercentage, 100).color}`}>
                      {getScoreIndicator(data.tenthPercentage, 100).label} score
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <CoachingTooltip message="Your 12th grade percentage. Higher marks improve eligibility (worth up to 15 points)">
                    <Label htmlFor="twelfthPercentage">
                      12th Percentage <span className="text-destructive">*</span>
                    </Label>
                  </CoachingTooltip>
                  <Input
                    id="twelfthPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="88.0"
                    value={data.twelfthPercentage || ''}
                    onChange={(e) => handleChange('twelfthPercentage', e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                  {errors.twelfthPercentage && (
                    <p className="text-sm text-destructive">{errors.twelfthPercentage}</p>
                  )}
                  {data.twelfthPercentage && !errors.twelfthPercentage && (
                    <p className={`text-sm ${getScoreIndicator(data.twelfthPercentage, 100).color}`}>
                      {getScoreIndicator(data.twelfthPercentage, 100).label} score
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {showBachelorsMarks && (
            <div className="space-y-4">
              <Label>Bachelor's Performance (worth up to 15 points)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <CoachingTooltip message="Your bachelor's degree percentage">
                    <Label htmlFor="bachelorsPercentage">Percentage</Label>
                  </CoachingTooltip>
                  <Input
                    id="bachelorsPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="75.0"
                    value={data.bachelorsPercentage || ''}
                    onChange={(e) => handleChange('bachelorsPercentage', e.target.value ? parseFloat(e.target.value) : undefined)}
                    disabled={!!data.bachelorsCgpa}
                  />
                  {errors.bachelorsPercentage && (
                    <p className="text-sm text-destructive">{errors.bachelorsPercentage}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <CoachingTooltip message="Or enter your CGPA (out of 10)">
                    <Label htmlFor="bachelorsCgpa">CGPA</Label>
                  </CoachingTooltip>
                  <Input
                    id="bachelorsCgpa"
                    type="number"
                    min="0"
                    max="10"
                    step="0.01"
                    placeholder="8.5"
                    value={data.bachelorsCgpa || ''}
                    onChange={(e) => handleChange('bachelorsCgpa', e.target.value ? parseFloat(e.target.value) : undefined)}
                    disabled={!!data.bachelorsPercentage}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <Label>Test Scores (Optional, but can add up to 10 points!)</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowTestScores(!showTestScores)}
              >
                {showTestScores ? 'Hide' : 'Add Test Scores'}
              </Button>
            </div>

            {showTestScores && (
              <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="testType">Test Type</Label>
                    <Select
                      value={data.testType || ''}
                      onValueChange={(value: any) => handleChange('testType', value)}
                    >
                      <SelectTrigger id="testType">
                        <SelectValue placeholder="Select test" />
                      </SelectTrigger>
                      <SelectContent>
                        {TEST_TYPES.map((test) => (
                          <SelectItem key={test.value} value={test.value}>
                            {test.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testScore">Score</Label>
                    <Input
                      id="testScore"
                      type="number"
                      step="0.1"
                      placeholder={data.testType ? `Enter ${data.testType} score` : 'Select test type first'}
                      value={data.testScore || ''}
                      onChange={(e) => handleChange('testScore', e.target.value ? parseFloat(e.target.value) : undefined)}
                      disabled={!data.testType}
                    />
                    {errors.testScore && (
                      <p className="text-sm text-destructive">{errors.testScore}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="testCertificateNumber">Certificate Number (Optional)</Label>
                    <Input
                      id="testCertificateNumber"
                      placeholder="e.g., 12/AB/CD/1234"
                      value={data.testCertificateNumber || ''}
                      onChange={(e) => handleChange('testCertificateNumber', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testDate">Test Date (Optional)</Label>
                    <Input
                      id="testDate"
                      type="date"
                      value={data.testDate || ''}
                      onChange={(e) => handleChange('testDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onPrev}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button type="submit" className="flex-1">
          Continue
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}
