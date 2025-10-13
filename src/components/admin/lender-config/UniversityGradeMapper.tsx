import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { useUniversities } from '@/hooks/useUniversities';

interface UniversityGradeMapperProps {
  mapping: Record<string, string>;
  onChange: (mapping: Record<string, string>) => void;
}

export const UniversityGradeMapper = ({ mapping, onChange }: UniversityGradeMapperProps) => {
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('A');
  const { universities } = useUniversities('');

  const handleAddMapping = () => {
    if (selectedUniversity && selectedGrade) {
      onChange({
        ...mapping,
        [selectedUniversity]: selectedGrade,
      });
      setSelectedUniversity('');
      setSelectedGrade('A');
    }
  };

  const handleRemoveMapping = (universityId: string) => {
    const newMapping = { ...mapping };
    delete newMapping[universityId];
    onChange(newMapping);
  };

  const getUniversityName = (id: string) => {
    const university = universities?.find((u) => u.id === id);
    return university?.name || 'Unknown University';
  };

  const grades = [
    { value: 'A', label: 'A - Top Tier (QS Rank 1-100)', color: 'text-green-600' },
    { value: 'B', label: 'B - Mid Tier (QS Rank 101-300)', color: 'text-blue-600' },
    { value: 'C', label: 'C - Lower Tier (QS Rank 301-500)', color: 'text-yellow-600' },
    { value: 'D', label: 'D - Unranked/Others', color: 'text-red-600' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom University Grades</CardTitle>
        <CardDescription>
          Override default QS ranking-based grading for specific universities (Optional)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select university..." />
            </SelectTrigger>
            <SelectContent>
              {universities?.map((university) => (
                <SelectItem key={university.id} value={university.id}>
                  {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {grades.map((grade) => (
                <SelectItem key={grade.value} value={grade.value}>
                  {grade.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            size="icon"
            onClick={handleAddMapping}
            disabled={!selectedUniversity}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {Object.keys(mapping).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Current Mappings</h4>
            {Object.entries(mapping).map(([universityId, grade]) => (
              <div
                key={universityId}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{getUniversityName(universityId)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${grades.find(g => g.value === grade)?.color}`}>
                    Grade: {grade}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveMapping(universityId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t space-y-2">
          <h4 className="text-sm font-medium">Grade Reference</h4>
          {grades.map((grade) => (
            <div key={grade.value} className="flex items-center gap-2 text-sm">
              <span className={`font-bold ${grade.color}`}>{grade.value}</span>
              <span className="text-muted-foreground">{grade.label.split(' - ')[1]}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
