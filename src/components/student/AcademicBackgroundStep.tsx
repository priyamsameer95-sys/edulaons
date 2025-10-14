import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CoachingTooltip } from './CoachingTooltip';
import { QUALIFICATIONS, ACADEMIC_VALIDATION, TEST_TYPES, TEST_CATEGORIES } from '@/constants/studentApplication';
import { StudentApplicationData } from '@/hooks/useStudentApplication';
import { Info, Award, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';

interface AcademicBackgroundStepProps {
  data: StudentApplicationData;
  onUpdate: (data: Partial<StudentApplicationData>) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function AcademicBackgroundStep({ data, onUpdate, onNext, onPrev }: AcademicBackgroundStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTestScores, setShowTestScores] = useState((data.tests?.length || 0) > 0);
  const [tests, setTests] = useState(data.tests || []);

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
    return '';
  };

  const validateTestScore = (testType: string, score: number): string => {
    const validation = ACADEMIC_VALIDATION.test_scores[testType as keyof typeof ACADEMIC_VALIDATION.test_scores];
    if (!validation) return '';
    if (isNaN(score) || score < validation.min || score > validation.max) {
      return `${testType} score must be between ${validation.min}-${validation.max}`;
    }
    return '';
  };

  // Get tests eligible for student's qualification
  const getEligibleTests = () => {
    if (!data.highestQualification) return TEST_TYPES;
    
    return TEST_TYPES.filter(test => 
      (test.eligibleFor as readonly string[]).includes(data.highestQualification)
    );
  };

  // Get tests available (not already added)
  const getAvailableTests = (currentIndex?: number) => {
    const eligibleTests = getEligibleTests();
    const addedTestTypes = tests
      .map((t, idx) => idx === currentIndex ? null : t.testType)
      .filter(Boolean);
    
    return eligibleTests.filter(test => 
      !addedTestTypes.includes(test.value as any)
    );
  };

  // Check if language test already added
  const hasLanguageTest = (excludeIndex?: number) => {
    return tests.some((t, idx) => 
      idx !== excludeIndex && TEST_CATEGORIES.language.includes(t.testType as any)
    );
  };

  // Validate language test conflicts
  const validateLanguageTestConflict = (newTestType: string, currentIndex: number): string => {
    const isLanguageTest = TEST_CATEGORIES.language.includes(newTestType as any);
    
    if (!isLanguageTest) return '';
    
    if (hasLanguageTest(currentIndex)) {
      const existingLanguageTest = tests.find((t, idx) => 
        idx !== currentIndex && TEST_CATEGORIES.language.includes(t.testType as any)
      );
      return `You already have ${existingLanguageTest?.testType}. You only need ONE English proficiency test.`;
    }
    
    return '';
  };

  const handleChange = (name: string, value: any) => {
    onUpdate({ [name]: value });
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const addTest = () => {
    if (tests.length >= 10) return;
    const newTests = [...tests, { testType: 'TOEFL' as const, testScore: undefined }];
    setTests(newTests);
    onUpdate({ tests: newTests });
  };

  const removeTest = (index: number) => {
    const newTests = tests.filter((_, i) => i !== index);
    setTests(newTests);
    onUpdate({ tests: newTests });
    if (newTests.length === 0) {
      setShowTestScores(false);
    }
  };

  const updateTest = (index: number, field: string, value: any) => {
    const newTests = [...tests];
    
    // If changing test type, validate conflicts
    if (field === 'testType') {
      const conflictError = validateLanguageTestConflict(value, index);
      if (conflictError) {
        setErrors(prev => ({ ...prev, [`testType-${index}`]: conflictError }));
        return;
      } else {
        setErrors(prev => {
          const updated = { ...prev };
          delete updated[`testType-${index}`];
          return updated;
        });
      }
    }
    
    newTests[index] = { ...newTests[index], [field]: value };
    setTests(newTests);
    onUpdate({ tests: newTests });
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

    // Validate test scores - only validate if score is actually entered
    tests.forEach((test, index) => {
      if (test.testScore && test.testScore > 0) {
        const error = validateTestScore(test.testType, test.testScore);
        if (error) newErrors[`testScore-${index}`] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  const showSchoolMarks = ['12th', 'diploma', 'bachelors', 'masters', 'phd'].includes(data.highestQualification);
  const showBachelorsMarks = ['bachelors', 'masters', 'phd'].includes(data.highestQualification);

  const getScoreIndicator = (testType: string, score: number) => {
    const validation = ACADEMIC_VALIDATION.test_scores[testType as keyof typeof ACADEMIC_VALIDATION.test_scores];
    if (!validation) return null;
    const percentage = (score / validation.max) * 100;
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
            <div className="flex items-center gap-1">
              <Label htmlFor="highestQualification">
                Highest Qualification <span className="text-destructive">*</span>
              </Label>
              <CoachingTooltip content="Your academic background helps us match you with the best lenders and determine your eligibility" />
            </div>
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="tenthPercentage">
                      10th Percentage <span className="text-destructive">*</span>
                    </Label>
                    <CoachingTooltip content="Your 10th grade percentage. Higher marks improve eligibility (worth up to 10 points)" />
                  </div>
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
                    <p className="text-sm text-green-600">
                      Good score
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="twelfthPercentage">
                      12th Percentage <span className="text-destructive">*</span>
                    </Label>
                    <CoachingTooltip content="Your 12th grade percentage. Higher marks improve eligibility (worth up to 15 points)" />
                  </div>
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
                    <p className="text-sm text-green-600">
                      Good score
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="bachelorsPercentage">Percentage</Label>
                    <CoachingTooltip content="Your bachelor's degree percentage" />
                  </div>
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
                  <div className="flex items-center gap-1">
                    <Label htmlFor="bachelorsCgpa">CGPA</Label>
                    <CoachingTooltip content="Or enter your CGPA (out of 10)" />
                  </div>
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

          {/* Test Scores Section (Optional) */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  Test Scores (Optional, but can add up to 10 points!)
                  <CoachingTooltip content="Adding test scores like IELTS, TOEFL, GRE can improve your loan eligibility" />
                </h3>
                <p className="text-sm text-muted-foreground">Add up to 10 standardized test scores</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowTestScores(!showTestScores);
                  if (!showTestScores && tests.length === 0) {
                    addTest();
                  }
                }}
              >
                {showTestScores ? 'Hide' : 'Show'}
              </Button>
            </div>

            {showTestScores && (
              <div className="space-y-4">
                {!data.highestQualification && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Please select your highest qualification first to see relevant test options.
                    </AlertDescription>
                  </Alert>
                )}
                
                {data.highestQualification && getEligibleTests().length === 0 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      No standardized tests are typically required for your qualification level.
                    </AlertDescription>
                  </Alert>
                )}
                
                {tests.map((test, index) => (
                  <div key={index} className="space-y-4 p-4 border rounded-lg bg-muted/50 relative">
                    {tests.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => removeTest(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`testType-${index}`}>Test Type</Label>
                        <Select
                          value={test.testType || ''}
                          onValueChange={(value: any) => updateTest(index, 'testType', value)}
                        >
                          <SelectTrigger id={`testType-${index}`}>
                            <SelectValue placeholder="Select test type" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableTests(index).map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`testType-${index}`] && (
                          <p className="text-sm text-destructive">{errors[`testType-${index}`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`testScore-${index}`}>Score</Label>
                        <Input
                          id={`testScore-${index}`}
                          type="number"
                          value={test.testScore || ''}
                          onChange={(e) => updateTest(index, 'testScore', parseFloat(e.target.value))}
                          placeholder="Enter test score"
                        />
                        {errors[`testScore-${index}`] && (
                          <p className="text-sm text-destructive">{errors[`testScore-${index}`]}</p>
                        )}
                        {test.testScore && !errors[`testScore-${index}`] && getScoreIndicator(test.testType, test.testScore) && (
                          <p className={`text-sm ${getScoreIndicator(test.testType, test.testScore)?.color}`}>
                            {getScoreIndicator(test.testType, test.testScore)?.label} score
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`testCertificateNumber-${index}`}>Certificate Number (Optional)</Label>
                        <Input
                          id={`testCertificateNumber-${index}`}
                          value={test.testCertificateNumber || ''}
                          onChange={(e) => updateTest(index, 'testCertificateNumber', e.target.value)}
                          placeholder="e.g., 12/AB/CD/1234"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`testDate-${index}`}>Test Date (Optional)</Label>
                        <Input
                          id={`testDate-${index}`}
                          type="date"
                          value={test.testDate || ''}
                          onChange={(e) => updateTest(index, 'testDate', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {tests.length < 10 && getAvailableTests().length > tests.length && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addTest}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Test Score ({tests.length}/{Math.min(10, getEligibleTests().length)})
                  </Button>
                )}

                {getAvailableTests().length === tests.length && tests.length > 0 && tests.length < 10 && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You've added all available test types for your qualification.
                    </AlertDescription>
                  </Alert>
                )}
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

export default AcademicBackgroundStep;
