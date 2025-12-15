import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UniversityCombobox } from "@/components/ui/university-combobox";
import { RefactoredLead } from "@/types/refactored-lead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

interface CompleteLeadModalProps {
  open: boolean;
  onClose: () => void;
  lead: RefactoredLead | null;
  onSuccess: () => void;
}

interface FormErrors {
  universityId?: string;
  intakeMonth?: string;
  intakeYear?: string;
  coApplicantPhone?: string;
  coApplicantPinCode?: string;
}

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const YEARS = [2025, 2026, 2027, 2028];

export const CompleteLeadModal = ({
  open,
  onClose,
  lead,
  onSuccess,
}: CompleteLeadModalProps) => {
  const [loading, setLoading] = useState(false);
  const [universityId, setUniversityId] = useState<string>("");
  const [intakeMonth, setIntakeMonth] = useState<string>("");
  const [intakeYear, setIntakeYear] = useState<string>("");
  const [loanType, setLoanType] = useState<string>(lead?.loan_type || "unsecured");
  const [coApplicantPhone, setCoApplicantPhone] = useState<string>("");
  const [coApplicantPinCode, setCoApplicantPinCode] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!universityId) {
      newErrors.universityId = "Required";
    }

    if (!intakeMonth) {
      newErrors.intakeMonth = "Required";
    }

    if (!intakeYear) {
      newErrors.intakeYear = "Required";
    }

    // Co-Applicant Phone validation (10 digits, starts with 6-9)
    if (!coApplicantPhone.trim()) {
      newErrors.coApplicantPhone = "Required";
    } else if (!/^[6-9]\d{9}$/.test(coApplicantPhone.trim())) {
      newErrors.coApplicantPhone = "Enter valid 10-digit number";
    }

    // Co-Applicant PIN Code validation (6 digits)
    if (!coApplicantPinCode.trim()) {
      newErrors.coApplicantPinCode = "Required";
    } else if (!/^\d{6}$/.test(coApplicantPinCode.trim())) {
      newErrors.coApplicantPinCode = "Enter valid 6-digit PIN";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!lead) return;

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Update lead with intake details and loan type
      const { error: leadError } = await supabase
        .from("leads_new")
        .update({
          intake_month: parseInt(intakeMonth),
          intake_year: parseInt(intakeYear),
          loan_type: loanType as "secured" | "unsecured",
          quick_lead_completed_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      // Create lead_universities association
      const { error: uniError } = await supabase
        .from("lead_universities")
        .insert({
          lead_id: lead.id,
          university_id: universityId,
        });

      if (uniError && !uniError.message.includes("duplicate")) {
        throw uniError;
      }

      // Update co-applicant with phone and pin_code (required)
      const { error: coAppError } = await supabase
        .from("co_applicants")
        .update({
          phone: coApplicantPhone.trim(),
          pin_code: coApplicantPinCode.trim(),
        })
        .eq("id", lead.co_applicant_id);

      if (coAppError) throw coAppError;

      toast.success("Lead completed successfully!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error completing lead:", error);
      toast.error(error.message || "Failed to complete lead");
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Complete Lead Details
          </DialogTitle>
          <DialogDescription>
            Fill remaining details for {lead.student?.name} ({lead.case_id})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* University Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              University <span className="text-destructive">*</span>
            </Label>
            <UniversityCombobox
              country={lead.study_destination}
              value={universityId}
              onChange={setUniversityId}
            />
          </div>

          {/* Intake */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Intake Month <span className="text-destructive">*</span>
              </Label>
              <Select value={intakeMonth} onValueChange={setIntakeMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value.toString()}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Intake Year <span className="text-destructive">*</span>
              </Label>
              <Select value={intakeYear} onValueChange={setIntakeYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Loan Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Loan Type</Label>
            <RadioGroup
              value={loanType}
              onValueChange={setLoanType}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unsecured" id="unsecured" />
                <Label htmlFor="unsecured" className="font-normal cursor-pointer">
                  Unsecured
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="secured" id="secured" />
                <Label htmlFor="secured" className="font-normal cursor-pointer">
                  Secured
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Co-Applicant Details (Required) */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-sm font-medium mb-3">
              Co-Applicant Details <span className="text-destructive">*</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">
                  Phone <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="10-digit phone"
                  value={coApplicantPhone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setCoApplicantPhone(value);
                    if (errors.coApplicantPhone) {
                      setErrors(prev => ({ ...prev, coApplicantPhone: undefined }));
                    }
                  }}
                  maxLength={10}
                  className={errors.coApplicantPhone ? 'border-destructive' : ''}
                />
                {errors.coApplicantPhone && (
                  <p className="text-xs text-destructive">{errors.coApplicantPhone}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm">
                  PIN Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="6-digit PIN"
                  value={coApplicantPinCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCoApplicantPinCode(value);
                    if (errors.coApplicantPinCode) {
                      setErrors(prev => ({ ...prev, coApplicantPinCode: undefined }));
                    }
                  }}
                  maxLength={6}
                  className={errors.coApplicantPinCode ? 'border-destructive' : ''}
                />
                {errors.coApplicantPinCode && (
                  <p className="text-xs text-destructive">{errors.coApplicantPinCode}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Lead
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
