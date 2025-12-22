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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Check,
  User,
  Users
} from "lucide-react";
import { CourseCombobox } from "@/components/ui/course-combobox";
import { formatIndianNumber } from "@/utils/currencyFormatter";
import { Database } from "@/integrations/supabase/types";

type RelationshipEnum = Database["public"]["Enums"]["relationship_enum"];

interface CompleteLeadModalProps {
  open: boolean;
  onClose: () => void;
  lead: RefactoredLead | null;
  onSuccess: () => void;
}

interface FormErrors {
  studentPinCode?: string;
  courseId?: string;
  coApplicantName?: string;
  coApplicantRelationship?: string;
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
  studentPinCode: string | null;
  coApplicantName: string | null;
  coApplicantRelationship: RelationshipEnum | null;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const RELATIONSHIP_OPTIONS: { value: RelationshipEnum; label: string }[] = [
  { value: "parent", label: "Parent" },
  { value: "spouse", label: "Spouse" },
  { value: "sibling", label: "Sibling" },
  { value: "guardian", label: "Guardian" },
  { value: "other", label: "Other" },
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
  
  // Student field
  const [studentPinCode, setStudentPinCode] = useState<string>("");
  
  // Course field
  const [courseId, setCourseId] = useState<string>("");
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  
  // Co-applicant fields
  const [coApplicantName, setCoApplicantName] = useState<string>("");
  const [coApplicantRelationship, setCoApplicantRelationship] = useState<RelationshipEnum | "">("");
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

        // Fetch student data for PIN code
        const { data: studentData } = await supabase
          .from("students")
          .select("postal_code")
          .eq("id", lead.student_id)
          .single();

        // Fetch co-applicant data
        const { data: coAppData } = await supabase
          .from("co_applicants")
          .select("name, relationship, phone, pin_code")
          .eq("id", lead.co_applicant_id)
          .single();

        // Pre-populate fields - check for placeholder values
        const studentPin = studentData?.postal_code;
        const isStudentPinPlaceholder = !studentPin || studentPin === "000000";
        setStudentPinCode(isStudentPinPlaceholder ? "" : studentPin);

        const coName = coAppData?.name;
        const isCoNamePlaceholder = !coName || coName === "Co-Applicant";
        setCoApplicantName(isCoNamePlaceholder ? "" : coName);

        if (coAppData?.relationship) {
          setCoApplicantRelationship(coAppData.relationship);
        }

        const coPhone = coAppData?.phone;
        setCoApplicantPhone(coPhone || "");

        const coPin = coAppData?.pin_code;
        const isCoPinPlaceholder = !coPin || coPin === "000000";
        setCoApplicantPinCode(isCoPinPlaceholder ? "" : coPin);

        setExistingData({
          universityId: uniData?.university_id || null,
          universityName: (uniData?.universities as any)?.name || null,
          intakeMonth: lead.intake_month,
          intakeYear: lead.intake_year,
          loanAmount: lead.loan_amount,
          studyDestination: lead.study_destination,
          loanType: lead.loan_type,
          studentPinCode: studentPin || null,
          coApplicantName: coName || null,
          coApplicantRelationship: coAppData?.relationship || null,
        });
      } catch (error) {
        console.error("Error fetching existing data:", error);
        setExistingData({
          universityId: null,
          universityName: null,
          intakeMonth: lead.intake_month,
          intakeYear: lead.intake_year,
          loanAmount: lead.loan_amount,
          studyDestination: lead.study_destination,
          loanType: lead.loan_type,
          studentPinCode: null,
          coApplicantName: null,
          coApplicantRelationship: null,
        });
      } finally {
        setFetchingData(false);
      }
    };

    fetchExistingData();
  }, [open, lead]);

  const resetForm = () => {
    setStudentPinCode("");
    setCourseId("");
    setIsCustomCourse(false);
    setCoApplicantName("");
    setCoApplicantRelationship("");
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

    // Student PIN Code validation (6 digits)
    if (!studentPinCode.trim()) {
      newErrors.studentPinCode = "Required";
    } else if (!/^\d{6}$/.test(studentPinCode.trim())) {
      newErrors.studentPinCode = "Enter valid 6-digit PIN";
    }

    // Course is required
    if (!courseId.trim()) {
      newErrors.courseId = "Please select or enter a course/program";
    }

    // Co-Applicant Name validation
    if (!coApplicantName.trim()) {
      newErrors.coApplicantName = "Required";
    } else if (coApplicantName.trim().length < 2) {
      newErrors.coApplicantName = "Name must be at least 2 characters";
    }

    // Co-Applicant Relationship validation
    if (!coApplicantRelationship) {
      newErrors.coApplicantRelationship = "Required";
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
      // Update student with PIN code
      const { error: studentError } = await supabase
        .from("students")
        .update({
          postal_code: studentPinCode.trim(),
        })
        .eq("id", lead.student_id);

      if (studentError) throw studentError;

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
        const { error: courseError } = await supabase
          .from("lead_courses")
          .insert({
            lead_id: lead.id,
            course_id: null as any,
            is_custom_course: true,
            custom_course_name: courseId,
          });
        
        if (courseError && !courseError.message.includes("null value")) {
          console.warn("Could not save custom course:", courseError);
        }
      } else if (existingData.universityId) {
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

      // Update co-applicant with all fields
      const { error: coAppError } = await supabase
        .from("co_applicants")
        .update({
          name: coApplicantName.trim(),
          relationship: coApplicantRelationship as RelationshipEnum,
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
            Complete Application Details
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

            {/* Student Details Section */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Student Details
              </h4>
              <div className="space-y-2">
                <Label className="text-sm">
                  Student PIN Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="6-digit PIN code"
                  value={studentPinCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setStudentPinCode(value);
                    if (errors.studentPinCode) {
                      setErrors(prev => ({ ...prev, studentPinCode: undefined }));
                    }
                  }}
                  maxLength={6}
                  className={errors.studentPinCode ? 'border-destructive' : ''}
                />
                {errors.studentPinCode && (
                  <p className="text-xs text-destructive">{errors.studentPinCode}</p>
                )}
              </div>
            </div>

            {/* Course Selection - Required */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Course / Program <span className="text-destructive">*</span>
              </Label>
              {existingData?.universityId ? (
                <CourseCombobox
                  universityId={existingData.universityId}
                  value={courseId}
                  onChange={(value, isCustom) => {
                    setCourseId(value);
                    setIsCustomCourse(isCustom || false);
                    if (errors.courseId) {
                      setErrors(prev => ({ ...prev, courseId: undefined }));
                    }
                  }}
                  placeholder="Search or enter course name..."
                  error={errors.courseId}
                />
              ) : (
                <Input
                  placeholder="Enter course/program name"
                  value={courseId}
                  onChange={(e) => {
                    setCourseId(e.target.value);
                    setIsCustomCourse(true);
                    if (errors.courseId) {
                      setErrors(prev => ({ ...prev, courseId: undefined }));
                    }
                  }}
                  className={errors.courseId ? 'border-destructive' : ''}
                />
              )}
              {!existingData?.universityId && (
                <p className="text-xs text-amber-600">
                  No university on file. Enter your course name manually.
                </p>
              )}
              {errors.courseId && (
                <p className="text-xs text-destructive">{errors.courseId}</p>
              )}
            </div>

            {/* Co-Applicant Details - Required */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Co-Applicant Details <span className="text-destructive">*</span>
              </h4>
              
              {/* Name and Relationship Row */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="space-y-2">
                  <Label className="text-sm">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Full name"
                    value={coApplicantName}
                    onChange={(e) => {
                      setCoApplicantName(e.target.value);
                      if (errors.coApplicantName) {
                        setErrors(prev => ({ ...prev, coApplicantName: undefined }));
                      }
                    }}
                    className={errors.coApplicantName ? 'border-destructive' : ''}
                  />
                  {errors.coApplicantName && (
                    <p className="text-xs text-destructive">{errors.coApplicantName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">
                    Relationship <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={coApplicantRelationship}
                    onValueChange={(value: RelationshipEnum) => {
                      setCoApplicantRelationship(value);
                      if (errors.coApplicantRelationship) {
                        setErrors(prev => ({ ...prev, coApplicantRelationship: undefined }));
                      }
                    }}
                  >
                    <SelectTrigger className={errors.coApplicantRelationship ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.coApplicantRelationship && (
                    <p className="text-xs text-destructive">{errors.coApplicantRelationship}</p>
                  )}
                </div>
              </div>

              {/* Phone and PIN Code Row */}
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