import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface ScoringRulesEditorProps {
  rules: any;
  onChange: (rules: any) => void;
}

export const ScoringRulesEditor = ({ rules, onChange }: ScoringRulesEditorProps) => {
  const updateRule = (path: string[], value: number) => {
    const newRules = JSON.parse(JSON.stringify(rules));
    let current = newRules;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    onChange(newRules);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scoring Rules Configuration</CardTitle>
        <CardDescription>
          Configure point allocations for different parameters. These rules determine how scores are calculated.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {/* Student Academic Scoring */}
          <AccordionItem value="student-academic">
            <AccordionTrigger>Student Academic Scoring</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>10th Points per 10%</Label>
                  <Input
                    type="number"
                    value={rules.student_academic.tenth_points_per_10_percent}
                    onChange={(e) => updateRule(['student_academic', 'tenth_points_per_10_percent'], parseFloat(e.target.value) || 0)}
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max 10th Points</Label>
                  <Input
                    type="number"
                    value={rules.student_academic.max_tenth_points}
                    onChange={(e) => updateRule(['student_academic', 'max_tenth_points'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>12th Points per 10%</Label>
                  <Input
                    type="number"
                    value={rules.student_academic.twelfth_points_per_10_percent}
                    onChange={(e) => updateRule(['student_academic', 'twelfth_points_per_10_percent'], parseFloat(e.target.value) || 0)}
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max 12th Points</Label>
                  <Input
                    type="number"
                    value={rules.student_academic.max_twelfth_points}
                    onChange={(e) => updateRule(['student_academic', 'max_twelfth_points'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bachelor's Points per 10%</Label>
                  <Input
                    type="number"
                    value={rules.student_academic.bachelors_points_per_10_percent}
                    onChange={(e) => updateRule(['student_academic', 'bachelors_points_per_10_percent'], parseFloat(e.target.value) || 0)}
                    step="0.1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Bachelor's Points</Label>
                  <Input
                    type="number"
                    value={rules.student_academic.max_bachelors_points}
                    onChange={(e) => updateRule(['student_academic', 'max_bachelors_points'], parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Highest Qualification */}
          <AccordionItem value="qualification">
            <AccordionTrigger>Highest Qualification Points</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>PhD</Label>
                  <Input
                    type="number"
                    value={rules.highest_qualification.phd}
                    onChange={(e) => updateRule(['highest_qualification', 'phd'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Masters</Label>
                  <Input
                    type="number"
                    value={rules.highest_qualification.masters}
                    onChange={(e) => updateRule(['highest_qualification', 'masters'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bachelors</Label>
                  <Input
                    type="number"
                    value={rules.highest_qualification.bachelors}
                    onChange={(e) => updateRule(['highest_qualification', 'bachelors'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Diploma</Label>
                  <Input
                    type="number"
                    value={rules.highest_qualification.diploma}
                    onChange={(e) => updateRule(['highest_qualification', 'diploma'], parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* University Grades */}
          <AccordionItem value="university-grades">
            <AccordionTrigger>University Grade Points</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grade A (QS 1-100)</Label>
                  <Input
                    type="number"
                    value={rules.university_grades.A}
                    onChange={(e) => updateRule(['university_grades', 'A'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grade B (QS 101-300)</Label>
                  <Input
                    type="number"
                    value={rules.university_grades.B}
                    onChange={(e) => updateRule(['university_grades', 'B'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grade C (QS 301-500)</Label>
                  <Input
                    type="number"
                    value={rules.university_grades.C}
                    onChange={(e) => updateRule(['university_grades', 'C'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grade D (Unranked)</Label>
                  <Input
                    type="number"
                    value={rules.university_grades.D}
                    onChange={(e) => updateRule(['university_grades', 'D'], parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* IELTS Test Scores */}
          <AccordionItem value="ielts">
            <AccordionTrigger>IELTS Score Points</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>7.0+</Label>
                  <Input
                    type="number"
                    value={rules.test_scores.ielts['7_0_plus']}
                    onChange={(e) => updateRule(['test_scores', 'ielts', '7_0_plus'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>6.5 - 6.9</Label>
                  <Input
                    type="number"
                    value={rules.test_scores.ielts['6_5_to_6_9']}
                    onChange={(e) => updateRule(['test_scores', 'ielts', '6_5_to_6_9'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>6.0 - 6.4</Label>
                  <Input
                    type="number"
                    value={rules.test_scores.ielts['6_0_to_6_4']}
                    onChange={(e) => updateRule(['test_scores', 'ielts', '6_0_to_6_4'], parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Co-Applicant Relationship */}
          <AccordionItem value="relationship">
            <AccordionTrigger>Co-Applicant Relationship Points</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Father/Mother</Label>
                  <Input
                    type="number"
                    value={rules.co_applicant_relationship.father}
                    onChange={(e) => {
                      updateRule(['co_applicant_relationship', 'father'], parseFloat(e.target.value) || 0);
                      updateRule(['co_applicant_relationship', 'mother'], parseFloat(e.target.value) || 0);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Brother/Sister</Label>
                  <Input
                    type="number"
                    value={rules.co_applicant_relationship.brother}
                    onChange={(e) => {
                      updateRule(['co_applicant_relationship', 'brother'], parseFloat(e.target.value) || 0);
                      updateRule(['co_applicant_relationship', 'sister'], parseFloat(e.target.value) || 0);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Spouse</Label>
                  <Input
                    type="number"
                    value={rules.co_applicant_relationship.spouse}
                    onChange={(e) => updateRule(['co_applicant_relationship', 'spouse'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Other</Label>
                  <Input
                    type="number"
                    value={rules.co_applicant_relationship.other}
                    onChange={(e) => updateRule(['co_applicant_relationship', 'other'], parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Co-Applicant Employment */}
          <AccordionItem value="employment">
            <AccordionTrigger>Co-Applicant Employment Points</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Salaried</Label>
                  <Input
                    type="number"
                    value={rules.co_applicant_employment.salaried}
                    onChange={(e) => updateRule(['co_applicant_employment', 'salaried'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Self Employed</Label>
                  <Input
                    type="number"
                    value={rules.co_applicant_employment.self_employed}
                    onChange={(e) => updateRule(['co_applicant_employment', 'self_employed'], parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Co-Applicant Salary Bands */}
          <AccordionItem value="salary">
            <AccordionTrigger>Co-Applicant Salary Band Points</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Above ₹1 Lakh</Label>
                  <Input
                    type="number"
                    value={rules.co_applicant_salary_bands.above_1_lakh}
                    onChange={(e) => updateRule(['co_applicant_salary_bands', 'above_1_lakh'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>₹75K - ₹1 Lakh</Label>
                  <Input
                    type="number"
                    value={rules.co_applicant_salary_bands['75k_to_1_lakh']}
                    onChange={(e) => updateRule(['co_applicant_salary_bands', '75k_to_1_lakh'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>₹50K - ₹75K</Label>
                  <Input
                    type="number"
                    value={rules.co_applicant_salary_bands['50k_to_75k']}
                    onChange={(e) => updateRule(['co_applicant_salary_bands', '50k_to_75k'], parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Below ₹50K</Label>
                  <Input
                    type="number"
                    value={rules.co_applicant_salary_bands.below_50k}
                    onChange={(e) => updateRule(['co_applicant_salary_bands', 'below_50k'], parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};