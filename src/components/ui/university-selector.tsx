import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UniversityCombobox } from "@/components/ui/university-combobox";
import { Plus, X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface UniversitySelectorProps {
  country: string;
  universities: string[];
  onChange: (universities: string[]) => void;
  error?: string;
  disabled?: boolean;
}

export function UniversitySelector({
  country,
  universities,
  onChange,
  error,
  disabled = false,
}: UniversitySelectorProps) {
  const addUniversity = React.useCallback(() => {
    if (universities.length < 5) {
      onChange([...universities, ""]);
    }
  }, [universities, onChange]);

  const removeUniversity = React.useCallback((index: number) => {
    if (universities.length > 1) {
      const newUniversities = universities
        .filter((_, i) => i !== index)
        .filter(u => u && u.trim()); // Clean empty strings
      onChange(newUniversities.length > 0 ? newUniversities : ['']);
    }
  }, [universities, onChange]);

  const updateUniversity = React.useCallback((index: number, value: string, isCustom?: boolean) => {
    // Prevent duplicate university selection
    const isDuplicate = universities.some((u, i) => i !== index && u && u === value);
    if (isDuplicate && value) {
      return; // Block duplicate - combobox will show error
    }
    const newUniversities = [...universities];
    newUniversities[index] = value;
    onChange(newUniversities);
  }, [universities, onChange]);

  // Get list of already selected universities for duplicate check
  const getSelectedUniversities = React.useCallback((excludeIndex: number) => {
    return universities.filter((u, i) => i !== excludeIndex && u && u.trim());
  }, [universities]);

  const canAddMore = universities.length < 5;
  const canRemove = universities.length > 1;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Universities <span className="text-destructive">*</span>
        </span>
        <span className="text-xs text-muted-foreground">
          {universities.length}/5 universities
        </span>
      </div>
      
      {universities.map((university, index) => (
        <div key={index} className="flex items-start gap-2">
          <div className="flex items-center mt-2">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground ml-1 w-8">
              #{index + 1}
            </span>
          </div>
          
          <div className="flex-1">
            <UniversityCombobox
              country={country}
              value={university}
              onChange={(value, isCustom) => updateUniversity(index, value, isCustom)}
              placeholder={index === 0 ? "Primary university (required)" : "Additional university"}
              disabled={disabled}
              error={error && index === 0 ? error : undefined}
              excludeUniversities={getSelectedUniversities(index)}
            />
          </div>
          
          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeUniversity(index)}
              className="mt-1 h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      
      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addUniversity}
          className="w-full"
          disabled={disabled || !country}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add University ({universities.length}/5)
        </Button>
      )}
      
      {error && universities.length > 0 && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}