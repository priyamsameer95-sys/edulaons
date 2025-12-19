import { useState, useEffect } from "react";
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
import { RefactoredLead } from "@/types/refactored-lead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  CheckCircle2, 
  GraduationCap, 
  MapPin, 
  Calendar, 
  Banknote,
  Building2,
  Check
} from "lucide-react";
import { CourseCombobox } from "@/components/ui/course-combobox";
import { formatIndianNumber } from "@/utils/currencyFormatter";

interface CompleteLeadModalProps {
  open: boolean;
  onClose: () => void;
  lead: RefactoredLead | null;
  onSuccess: () => void;
}

interface FormErrors {
  courseId?: string;
  coApplicantPhone?: string;
  coApplicantPinCode?: string;
}

interface ExistingData {
  universityId: string | null;
  universityName: string | null;
  intakeMonth: number | null;
  intakeYear: number | null;
  loanAmount: number | null;
  studyDestination: string | null;
  loanType: string | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const CompleteLeadModal = ({
  open,
  onClose,
  lead,
  onSuccess,
}: CompleteLeadModalProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [existingData, setExistingData] = useState<ExistingData | null>(null);
  
  // Only truly missing fields
  const [courseId, setCourseId] = useState<string>("");
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [coApplicantPhone, setCoApplicantPhone] = useState<string>("");
  const [coApplicantPinCode, setCoApplicantPinCode] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});

  // Fetch existing data when modal opens
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!open || !lead) return;

      setFetchingData(true);
      try {
        // Fetch lead_universities to get university info
        const { data: uniData } = await supabase
          .from("lead_universities")
          .select(`
            university_id,
            universities!inner(id, name, country)
          `)
          .eq("lead_id", lead.id)
          .single();

        // Fetch co-applicant data to check if phone/pin already exist
        const { data: coAppData } = await supabase
          .from("co_applicants")
          .select("phone, pin_code")
          .eq("id", lead.co_applicant_id)
          .single();

        // Pre-populate if co-applicant already has phone/pin
        if (coAppData?.phone) {
          setCoApplicantPhone(coAppData.phone);
        }
        if (coAppData?.pin_code) {
          setCoApplicantPinCode(coAppData.pin_code);
        }

        setExistingData({
          universityId: uniData?.university_id || null,
          universityName: (uniData?.universities as any)?.name || null,
          intakeMonth: lead.intake_month,
          intakeYear: lead.intake_year,
          loanAmount: lead.loan_amount,
          studyDestination: lead.study_destination,
          loanType: lead.loan_type,
        });
      } catch (error) {
        console.error("Error fetching existing data:", error);
        // Still set basic data from lead
        setExistingData({
          universityId: null,
          universityName: null,
          intakeMonth: lead.intake_month,
          intakeYear: lead.intake_year,
          loanAmount: lead.loan_amount,
          studyDestination: lead.study_destination,
          loanType: lead.loan_type,
        });
      } finally {
        setFetchingData(false);
      }
    };

    fetchExistingData();
  }, [open, lead]);

  const resetForm = () => {
    setCourseId("");
    setIsCustomCourse(false);
    setCoApplicantPhone("");
    setCoApplicantPinCode("");
    setErrors({});
    setExistingData(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Course is required
    if (!courseId.trim()) {
      newErrors.courseId = "Please select or enter a course/program";
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
    if (!lead || !existingData) return;

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Update lead to mark as completed
      const { error: leadError } = await supabase
        .from("leads_new")
        .update({
          quick_lead_completed_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      // Save course association
      if (isCustomCourse) {
        // For custom course, we store it differently
        // First check if there's a course entry we can use or create a record
        const { error: courseError } = await supabase
          .from("lead_courses")
          .insert({
            lead_id: lead.id,
            course_id: null as any, // Will be handled by custom_course_name
            is_custom_course: true,
            custom_course_name: courseId,
          });
        
        // If constraint fails, that's okay - we tried
        if (courseError && !courseError.message.includes("null value")) {
          console.warn("Could not save custom course:", courseError);
        }
      } else if (existingData.universityId) {
        // For selected course, save the association
        const { error: courseError } = await supabase
          .from("lead_courses")
          .insert({
            lead_id: lead.id,
            course_id: courseId,
            is_custom_course: false,
          });

        if (courseError && !courseError.message.includes("duplicate")) {
          console.warn("Could not save course:", courseError);
        }
      }

      // Update co-applicant with phone and pin_code
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
      handleClose();
    } catch (error: any) {
      console.error("Error completing lead:", error);
      toast.error(error.message || "Failed to complete lead");
    } finally {
      setLoading(false);
    }
  };

  if (!lead) return null;

  const getIntakeDisplay = () => {
    if (existingData?.intakeMonth && existingData?.intakeYear) {
      return `${MONTHS[existingData.intakeMonth - 1]} ${existingData.intakeYear}`;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            Almost Done! Just 3 Quick Details
          </DialogTitle>
          <DialogDescription>
            Complete the application for {lead.student?.name} ({lead.case_id})
          </DialogDescription>
        </DialogHeader>

        {fetchingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading existing data...</span>
          </div>
        ) : (
          <div className="space-y-5 py-4">
            {/* Already Captured Data - Read Only Confirmation */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Already Captured
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {existingData?.universityName && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">University</p>
                      <p className="font-medium">{existingData.universityName}</p>
                    </div>
                  </div>
                )}
                {getIntakeDisplay() && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Intake</p>
                      <p className="font-medium">{getIntakeDisplay()}</p>
                    </div>
                  </div>
                )}
                {existingData?.studyDestination && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="font-medium">{existingData.studyDestination}</p>
                    </div>
                  </div>
                )}
                {existingData?.loanAmount && (
                  <div className="flex items-start gap-2">
                    <Banknote className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Loan Amount</p>
                      <p className="font-medium">₹{formatIndianNumber(existingData.loanAmount)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Course Selection - Required */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Course / Program <span className="text-destructive">*</span>
              </Label>
              <CourseCombobox
                universityId={existingData?.universityId || undefined}
                value={courseId}
                onChange={(value, isCustom) => {
                  setCourseId(value);
                  setIsCustomCourse(isCustom || false);
                  if (errors.courseId) {
                    setErrors(prev => ({ ...prev, courseId: undefined }));
                  }
                }}
                placeholder="Search or enter course name..."
                disabled={!existingData?.universityId}
                error={errors.courseId}
              />
              {!existingData?.universityId && (
                <p className="text-xs text-amber-600">
                  University not found. You can still enter a custom course name.
                </p>
              )}
              {errors.courseId && (
                <p className="text-xs text-destructive">{errors.courseId}</p>
              )}
            </div>

            {/* Co-Applicant Details - Required */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Co-Applicant Contact <span className="text-destructive">*</span>
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
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={loading || fetchingData}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || fetchingData}>
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
