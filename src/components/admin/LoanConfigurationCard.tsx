import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings2, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { LoanClassification } from "@/hooks/useDynamicDocuments";

type CaseComplexity = 'straightforward' | 'edge_case' | 'high_risk';

interface Lender {
  id: string;
  name: string;
}

interface LoanConfigurationCardProps {
  leadId: string;
  currentClassification: LoanClassification | null;
  currentTargetLenderId: string | null;
  currentComplexity: CaseComplexity | null;
  lenders: Lender[];
  onConfigUpdated?: () => void;
}

const LOAN_TYPES = [
  { value: 'unsecured_nbfc', label: 'Unsecured (NBFC)', description: 'Standard NBFC loan' },
  { value: 'secured_property', label: 'Secured (Property/FD)', description: 'Collateral-backed loan' },
  { value: 'psu_bank', label: 'PSU Bank', description: 'Government bank loan' },
  { value: 'undecided', label: 'Undecided', description: 'Exploration phase' },
] as const;

const COMPLEXITY_OPTIONS = [
  { value: 'straightforward', label: 'Straightforward', color: 'bg-green-100 text-green-800' },
  { value: 'edge_case', label: 'Edge Case', color: 'bg-amber-100 text-amber-800' },
  { value: 'high_risk', label: 'High Risk', color: 'bg-red-100 text-red-800' },
] as const;

export function LoanConfigurationCard({
  leadId,
  currentClassification,
  currentTargetLenderId,
  currentComplexity,
  lenders,
  onConfigUpdated
}: LoanConfigurationCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [loanType, setLoanType] = useState<LoanClassification>(currentClassification || 'undecided');
  const [targetLender, setTargetLender] = useState<string>(currentTargetLenderId || 'none');
  const [complexity, setComplexity] = useState<CaseComplexity>(currentComplexity || 'straightforward');

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('leads_new')
        .update({
          loan_classification: loanType,
          target_lender_id: targetLender === 'none' ? null : targetLender,
          case_complexity: complexity,
          loan_config_updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Configuration saved",
        description: "Loan configuration updated successfully."
      });
      
      setIsEditing(false);
      onConfigUpdated?.();
    } catch (err) {
      console.error('Error saving loan config:', err);
      toast({
        variant: 'destructive',
        title: "Save failed",
        description: "Unable to save loan configuration."
      });
    } finally {
      setSaving(false);
    }
  }, [leadId, loanType, targetLender, complexity, onConfigUpdated]);

  const currentLoanTypeLabel = LOAN_TYPES.find(t => t.value === loanType)?.label || 'Not set';
  const currentComplexityOption = COMPLEXITY_OPTIONS.find(c => c.value === complexity);
  const targetLenderName = lenders.find(l => l.id === targetLender)?.name;

  if (!isEditing) {
    // View mode - compact display
    return (
      <Card className="border border-primary/20 bg-primary/5">
        <CardHeader className="pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              Loan Configuration
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="h-7 text-xs"
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-normal">
              {currentLoanTypeLabel}
            </Badge>
            {targetLenderName && (
              <Badge variant="outline" className="font-normal">
                Target: {targetLenderName}
              </Badge>
            )}
            {currentComplexityOption && (
              <Badge className={`${currentComplexityOption.color} border-0 font-normal`}>
                {currentComplexityOption.label}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Edit mode - full form
  return (
    <Card className="border border-primary/30 bg-primary/5">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Loan Configuration
          </CardTitle>
          <span className="text-xs text-muted-foreground">Set by Counsellor</span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Loan Type */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Loan Type</Label>
          <RadioGroup 
            value={loanType} 
            onValueChange={(val) => setLoanType(val as LoanClassification)}
            className="grid grid-cols-2 gap-2"
          >
            {LOAN_TYPES.map((type) => (
              <div key={type.value} className="flex items-center space-x-2">
                <RadioGroupItem value={type.value} id={type.value} />
                <Label 
                  htmlFor={type.value} 
                  className="text-sm font-normal cursor-pointer"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Target Lender */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Target Lender (Optional)</Label>
          <Select value={targetLender} onValueChange={setTargetLender}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Select lender..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {lenders.map((lender) => (
                <SelectItem key={lender.id} value={lender.id}>
                  {lender.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Case Complexity */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            Case Complexity <span className="text-muted-foreground">(Internal)</span>
          </Label>
          <RadioGroup 
            value={complexity} 
            onValueChange={(val) => setComplexity(val as CaseComplexity)}
            className="flex flex-wrap gap-3"
          >
            {COMPLEXITY_OPTIONS.map((opt) => (
              <div key={opt.value} className="flex items-center space-x-2">
                <RadioGroupItem value={opt.value} id={`complexity-${opt.value}`} />
                <Label 
                  htmlFor={`complexity-${opt.value}`} 
                  className="text-sm font-normal cursor-pointer"
                >
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setLoanType(currentClassification || 'undecided');
              setTargetLender(currentTargetLenderId || 'none');
              setComplexity(currentComplexity || 'straightforward');
              setIsEditing(false);
            }}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-3 w-3 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
