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
  Users,
  ShieldCheck,
  Sparkles,
  Briefcase,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { CourseCombobox } from "@/components/ui/course-combobox";
import { UniversitySelector } from "@/components/ui/university-selector";
import { Progress } from "@/components/ui/progress";
import { formatIndianNumber } from "@/utils/currencyFormatter";
import { Database } from "@/integrations/supabase/types";
import { ALL_STATES_AND_UTS } from "@/constants/indianStates";
import { 
  GENDER_OPTIONS, 
  OCCUPATION_OPTIONS, 
  EMPLOYMENT_TYPE_OPTIONS,
  QUALIFICATION_OPTIONS 
} from "@/utils/leadCompletionSchema";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type RelationshipEnum = Database["public"]["Enums"]["relationship_enum"];

interface CompleteLeadModalProps {
  open: boolean;
  onClose: () => void;
  lead: RefactoredLead | null;
  onSuccess: () => void;
}

interface FormErrors {
  studentPinCode?: string;
  studentDob?: string;
  studentGender?: string;
  studentCity?: string;
  studentState?: string;
  studentNationality?: string;
  studentStreetAddress?: string;
  studentHighestQualification?: string;
  studentTenthPercentage?: string;
  studentTwelfthPercentage?: string;
  studentBachelorsPercentage?: string;
  studentBachelorsCgpa?: string;
  studentCreditScore?: string;
  courseId?: string;
  coApplicantName?: string;
  coApplicantRelationship?: string;
  coApplicantPhone?: string;
  coApplicantSalary?: string;
  coApplicantPinCode?: string;
  coApplicantOccupation?: string;
  coApplicantEmployer?: string;
  coApplicantEmploymentType?: string;
  coApplicantEmploymentDuration?: string;
  coApplicantCreditScore?: string;
}

interface ExistingData {
  universities: string[];
  firstUniversityName: string | null;
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

const STUDY_DESTINATIONS = [
  "USA",
  "Canada",
  "UK",
  "Australia",
  "Germany",
  "Ireland",
  "New Zealand",
  "Other",
];

const LOAN_TYPE_OPTIONS = [
  { value: "secured", label: "Secured" },
  { value: "unsecured", label: "Unsecured" },
] as const;

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
  
  // Student fields
  const [studentPinCode, setStudentPinCode] = useState<string>("");
  const [studentDob, setStudentDob] = useState<string>("");
  const [studentGender, setStudentGender] = useState<string>("");
  const [studentCity, setStudentCity] = useState<string>("");
  const [studentState, setStudentState] = useState<string>("");
  const [studentNationality, setStudentNationality] = useState<string>("Indian");
  const [studentStreetAddress, setStudentStreetAddress] = useState<string>("");
  const [studentHighestQualification, setStudentHighestQualification] = useState<string>("");
  const [studentTenthPercentage, setStudentTenthPercentage] = useState<string>("");
  const [studentTwelfthPercentage, setStudentTwelfthPercentage] = useState<string>("");
  const [studentBachelorsPercentage, setStudentBachelorsPercentage] = useState<string>("");
  const [studentBachelorsCgpa, setStudentBachelorsCgpa] = useState<string>("");
  const [studentCreditScore, setStudentCreditScore] = useState<string>("");
  const [studentEmail, setStudentEmail] = useState<string>("");

  // Study fields (same set as Add Lead)
  const [studyDestination, setStudyDestination] = useState<string>("");
  const [intakeMonth, setIntakeMonth] = useState<string>("");
  const [intakeYear, setIntakeYear] = useState<string>("");
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [loanType, setLoanType] = useState<string>("");
  const [universities, setUniversities] = useState<string[]>([""]);
  
  // Course field
  const [courseId, setCourseId] = useState<string>("");
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  
  // Co-applicant required fields
  const [coApplicantName, setCoApplicantName] = useState<string>("");
  const [coApplicantRelationship, setCoApplicantRelationship] = useState<RelationshipEnum | "">("");
  const [coApplicantPhone, setCoApplicantPhone] = useState<string>("");
  const [coApplicantSalary, setCoApplicantSalary] = useState<string>("");
  const [coApplicantPinCode, setCoApplicantPinCode] = useState<string>("");
  
  // Co-applicant optional employment fields
  const [coApplicantOccupation, setCoApplicantOccupation] = useState<string>("");
  const [coApplicantEmployer, setCoApplicantEmployer] = useState<string>("");
  const [coApplicantEmploymentType, setCoApplicantEmploymentType] = useState<string>("");
  const [coApplicantEmploymentDuration, setCoApplicantEmploymentDuration] = useState<string>("");
  const [coApplicantCreditScore, setCoApplicantCreditScore] = useState<string>("");
  
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Collapsible sections state
  const [optionalStudentOpen, setOptionalStudentOpen] = useState(false);
  const [optionalCoAppOpen, setOptionalCoAppOpen] = useState(false);

  // Fetch existing data when modal opens
  useEffect(() => {
    const fetchExistingData = async () => {
      if (!open || !lead) return;

      setFetchingData(true);
      try {
        // Fetch universities (can be multiple)
        const { data: uniRows } = await supabase
          .from("lead_universities")
          .select("university_id")
          .eq("lead_id", lead.id);

        const uniIds = (uniRows || []).map(r => r.university_id).filter(Boolean);
        setUniversities(uniIds.length > 0 ? uniIds : [""]);

        // Fetch first university name for the summary header (best-effort)
        let firstUniversityName: string | null = null;
        if (uniIds[0]) {
          const { data: uni } = await supabase
            .from("universities")
            .select("name")
            .eq("id", uniIds[0])
            .maybeSingle();
          firstUniversityName = uni?.name || null;
        }

        // Fetch existing course if any
        const { data: courseData } = await supabase
          .from("lead_courses")
          .select(`
            course_id,
            is_custom_course,
            custom_course_name,
            courses!inner(id, program_name)
          `)
          .eq("lead_id", lead.id)
          .maybeSingle();

        // Fetch student data - including all optional fields
        const { data: studentData } = await supabase
          .from("students")
          .select("email, postal_code, date_of_birth, gender, city, state, nationality, street_address, highest_qualification, tenth_percentage, twelfth_percentage, bachelors_percentage, bachelors_cgpa, credit_score")
          .eq("id", lead.student_id)
          .single();

        // Fetch co-applicant data - including all optional fields
        const { data: coAppData } = await supabase
          .from("co_applicants")
          .select("name, relationship, phone, pin_code, salary, occupation, employer, employment_type, employment_duration_years, credit_score, email")
          .eq("id", lead.co_applicant_id)
          .single();

        // Pre-populate required fields
        const studentPin = studentData?.postal_code;
        const isStudentPinPlaceholder = !studentPin || studentPin === "000000";
        setStudentPinCode(isStudentPinPlaceholder ? "" : studentPin);

        setStudentEmail(studentData?.email || "");

        // Pre-populate optional student fields
        setStudentDob(studentData?.date_of_birth || "");
        setStudentGender(studentData?.gender || "");
        setStudentCity(studentData?.city || "");
        setStudentState(studentData?.state || "");
        setStudentNationality(studentData?.nationality || "Indian");
        setStudentStreetAddress(studentData?.street_address || "");
        setStudentHighestQualification(studentData?.highest_qualification || "");
        setStudentTenthPercentage(studentData?.tenth_percentage ? String(studentData.tenth_percentage) : "");
        setStudentTwelfthPercentage(studentData?.twelfth_percentage ? String(studentData.twelfth_percentage) : "");
        setStudentBachelorsPercentage(studentData?.bachelors_percentage ? String(studentData.bachelors_percentage) : "");
        setStudentBachelorsCgpa(studentData?.bachelors_cgpa ? String(studentData.bachelors_cgpa) : "");
        setStudentCreditScore(studentData?.credit_score ? String(studentData.credit_score) : "");

        // Pre-populate study fields
        setStudyDestination(lead.study_destination || "");
        setLoanType(lead.loan_type || "");
        setLoanAmount(lead.loan_amount ? String(lead.loan_amount) : "");
        setIntakeMonth(lead.intake_month ? String(lead.intake_month) : "");
        setIntakeYear(lead.intake_year ? String(lead.intake_year) : "");

        // Pre-populate course if exists
        if (courseData) {
          if (courseData.is_custom_course && courseData.custom_course_name) {
            setCourseId(courseData.custom_course_name);
            setIsCustomCourse(true);
          } else if (courseData.course_id) {
            setCourseId(courseData.course_id);
            setIsCustomCourse(false);
          }
        }

        // Co-applicant required fields
        const coName = coAppData?.name;
        const isCoNamePlaceholder = !coName || coName === "Co-Applicant";
        setCoApplicantName(isCoNamePlaceholder ? "" : coName);

        if (coAppData?.relationship) {
          setCoApplicantRelationship(coAppData.relationship);
        }

        const coPhone = coAppData?.phone;
        setCoApplicantPhone(coPhone || "");

        const coSalary = coAppData?.salary;
        setCoApplicantSalary(coSalary && coSalary > 0 ? String(coSalary) : "");

        const coPin = coAppData?.pin_code;
        const isCoPinPlaceholder = !coPin || coPin === "000000";
        setCoApplicantPinCode(isCoPinPlaceholder ? "" : coPin);
        
        // Co-applicant optional employment fields
        setCoApplicantOccupation(coAppData?.occupation || "");
        setCoApplicantEmployer(coAppData?.employer || "");
        setCoApplicantEmploymentType(coAppData?.employment_type || "");
        setCoApplicantEmploymentDuration(
          coAppData?.employment_duration_years ? String(coAppData.employment_duration_years) : ""
        );
        setCoApplicantCreditScore(coAppData?.credit_score ? String(coAppData.credit_score) : "");

        setExistingData({
          universities: uniIds.length > 0 ? uniIds : [""],
          firstUniversityName,
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
          universities: [""],
          firstUniversityName: null,
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
    // Student fields
    setStudentPinCode("");
    setStudentDob("");
    setStudentGender("");
    setStudentCity("");
    setStudentState("");
    setStudentNationality("Indian");
    setStudentStreetAddress("");
    setStudentHighestQualification("");
    setStudentTenthPercentage("");
    setStudentTwelfthPercentage("");
    setStudentBachelorsPercentage("");
    setStudentBachelorsCgpa("");
    setStudentCreditScore("");
    setStudentEmail("");

    // Study
    setStudyDestination("");
    setIntakeMonth("");
    setIntakeYear("");
    setLoanAmount("");
    setLoanType("");
    setUniversities([""]);

    // Course
    setCourseId("");
    setIsCustomCourse(false);

    // Co-applicant required
    setCoApplicantName("");
    setCoApplicantRelationship("");
    setCoApplicantPhone("");
    setCoApplicantSalary("");
    setCoApplicantPinCode("");

    // Co-applicant optional
    setCoApplicantOccupation("");
    setCoApplicantEmployer("");
    setCoApplicantEmploymentType("");
    setCoApplicantEmploymentDuration("");
    setCoApplicantCreditScore("");

    // Reset UI state
    setErrors({});
    setExistingData(null);
    setOptionalStudentOpen(false);
    setOptionalCoAppOpen(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Student PIN Code validation (6 digits) - REQUIRED
    if (!studentPinCode.trim()) {
      newErrors.studentPinCode = "Required";
    } else if (!/^\d{6}$/.test(studentPinCode.trim())) {
      newErrors.studentPinCode = "Enter valid 6-digit PIN";
    }

    // Course is required
    if (!courseId.trim()) {
      newErrors.courseId = "Please select or enter a course/program";
    }

    // Co-Applicant Name validation - REQUIRED
    if (!coApplicantName.trim()) {
      newErrors.coApplicantName = "Required";
    } else if (coApplicantName.trim().length < 2) {
      newErrors.coApplicantName = "Name must be at least 2 characters";
    }

    // Co-Applicant Relationship validation - REQUIRED
    if (!coApplicantRelationship) {
      newErrors.coApplicantRelationship = "Required";
    }

    // Co-Applicant Phone validation (10 digits, starts with 6-9) - REQUIRED
    if (!coApplicantPhone.trim()) {
      newErrors.coApplicantPhone = "Required";
    } else if (!/^[6-9]\d{9}$/.test(coApplicantPhone.trim())) {
      newErrors.coApplicantPhone = "Enter valid 10-digit number";
    }

    // Co-Applicant Salary validation - REQUIRED
    if (!coApplicantSalary.trim()) {
      newErrors.coApplicantSalary = "Required for eligibility";
    } else {
      const salaryNum = parseInt(coApplicantSalary.replace(/,/g, ''), 10);
      if (isNaN(salaryNum) || salaryNum <= 0) {
        newErrors.coApplicantSalary = "Enter a valid amount";
      }
    }

    // Co-Applicant PIN Code validation (6 digits) - REQUIRED
    if (!coApplicantPinCode.trim()) {
      newErrors.coApplicantPinCode = "Required";
    } else if (!/^\d{6}$/.test(coApplicantPinCode.trim())) {
      newErrors.coApplicantPinCode = "Enter valid 6-digit PIN";
    }

    // Optional field validations (only if filled)
    if (studentCity.trim() && studentCity.trim().length < 2) {
      newErrors.studentCity = "City must be at least 2 characters";
    }
    
    // Student academic validations
    if (studentTenthPercentage.trim()) {
      const pct = parseFloat(studentTenthPercentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        newErrors.studentTenthPercentage = "Enter valid percentage (0-100)";
      }
    }
    if (studentTwelfthPercentage.trim()) {
      const pct = parseFloat(studentTwelfthPercentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        newErrors.studentTwelfthPercentage = "Enter valid percentage (0-100)";
      }
    }
    if (studentBachelorsPercentage.trim()) {
      const pct = parseFloat(studentBachelorsPercentage);
      if (isNaN(pct) || pct < 0 || pct > 100) {
        newErrors.studentBachelorsPercentage = "Enter valid percentage (0-100)";
      }
    }
    if (studentBachelorsCgpa.trim()) {
      const cgpa = parseFloat(studentBachelorsCgpa);
      if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
        newErrors.studentBachelorsCgpa = "Enter valid CGPA (0-10)";
      }
    }
    if (studentCreditScore.trim()) {
      const score = parseInt(studentCreditScore, 10);
      if (isNaN(score) || score < 300 || score > 900) {
        newErrors.studentCreditScore = "Enter valid score (300-900)";
      }
    }
    
    if (coApplicantEmployer.trim() && coApplicantEmployer.trim().length < 2) {
      newErrors.coApplicantEmployer = "Employer name must be at least 2 characters";
    }
    
    if (coApplicantEmploymentDuration.trim()) {
      const duration = parseInt(coApplicantEmploymentDuration, 10);
      if (isNaN(duration) || duration < 0 || duration > 50) {
        newErrors.coApplicantEmploymentDuration = "Enter valid years (0-50)";
      }
    }
    
    if (coApplicantCreditScore.trim()) {
      const score = parseInt(coApplicantCreditScore, 10);
      if (isNaN(score) || score < 300 || score > 900) {
        newErrors.coApplicantCreditScore = "Enter valid score (300-900)";
      }
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
      // Update student with all fields
      const { error: studentError } = await supabase
        .from("students")
        .update({
          email: studentEmail.trim() || null,
          postal_code: studentPinCode.trim(),
          date_of_birth: studentDob || null,
          gender: studentGender || null,
          city: studentCity.trim() || null,
          state: studentState || null,
          nationality: studentNationality.trim() || null,
          street_address: studentStreetAddress.trim() || null,
          highest_qualification: studentHighestQualification || null,
          tenth_percentage: studentTenthPercentage ? parseFloat(studentTenthPercentage) : null,
          twelfth_percentage: studentTwelfthPercentage ? parseFloat(studentTwelfthPercentage) : null,
          bachelors_percentage: studentBachelorsPercentage ? parseFloat(studentBachelorsPercentage) : null,
          bachelors_cgpa: studentBachelorsCgpa ? parseFloat(studentBachelorsCgpa) : null,
          credit_score: studentCreditScore ? parseInt(studentCreditScore, 10) : null,
        })
        .eq("id", lead.student_id);

      if (studentError) throw studentError;

      // Update lead (mark completed + allow editing the same fields as Add Lead)
      const loanAmountNum = loanAmount.trim() ? parseInt(loanAmount.replace(/,/g, ""), 10) : null;
      const intakeMonthNum = intakeMonth.trim() ? parseInt(intakeMonth, 10) : null;
      const intakeYearNum = intakeYear.trim() ? parseInt(intakeYear, 10) : null;

      const { error: leadError } = await supabase
        .from("leads_new")
        .update({
          quick_lead_completed_at: new Date().toISOString(),
          study_destination: studyDestination || null,
          loan_type: (loanType as any) || null,
          loan_amount: loanAmountNum ?? (lead.loan_amount || null),
          intake_month: intakeMonthNum,
          intake_year: intakeYearNum,
        })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      // Save universities
      await supabase.from("lead_universities").delete().eq("lead_id", lead.id);
      const validUniversities = universities.filter(u => u && u.trim() && u.length > 10);
      if (validUniversities.length > 0) {
        const { error: uniSaveError } = await supabase
          .from("lead_universities")
          .insert(validUniversities.map(university_id => ({ lead_id: lead.id, university_id })));
        if (uniSaveError) throw uniSaveError;
      }

      // Save course association
      try {
        await supabase
          .from("lead_courses")
          .delete()
          .eq("lead_id", lead.id);

        const primaryUniversityId = universities.find(u => u && u.trim() && u.length > 10) || null;

        if (isCustomCourse || !primaryUniversityId) {
          console.log("Custom course entered:", courseId);
        } else if (courseId && primaryUniversityId) {
          const { error: courseError } = await supabase
            .from("lead_courses")
            .insert({
              lead_id: lead.id,
              course_id: courseId,
              is_custom_course: false,
            });

          if (courseError) {
            console.warn("Could not save course association:", courseError);
          }
        }
      } catch (courseErr) {
        console.warn("Error handling course:", courseErr);
      }

      // Update co-applicant with all fields
      const salaryValue = parseInt(coApplicantSalary.replace(/,/g, ''), 10);
      const { error: coAppError } = await supabase
        .from("co_applicants")
        .update({
          name: coApplicantName.trim(),
          relationship: coApplicantRelationship as RelationshipEnum,
          phone: coApplicantPhone.trim(),
          salary: salaryValue,
          pin_code: coApplicantPinCode.trim(),
          occupation: coApplicantOccupation || null,
          employer: coApplicantEmployer.trim() || null,
          employment_type: coApplicantEmploymentType || null,
          employment_duration_years: coApplicantEmploymentDuration 
            ? parseInt(coApplicantEmploymentDuration, 10) 
            : null,
          credit_score: coApplicantCreditScore 
            ? parseInt(coApplicantCreditScore, 10) 
            : null,
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Complete Application Details
          </DialogTitle>
          <DialogDescription className="text-sm">
            Complete all required fields and optional details for <span className="font-medium text-foreground">{lead.student?.name}</span>.
          </DialogDescription>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Application progress</span>
              <span className="font-medium text-primary">Almost there!</span>
            </div>
            <Progress value={90} className="h-2" />
          </div>
        </DialogHeader>

        {fetchingData ? (
          <div className="flex items-center justify-center py-8 flex-1">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Loading your saved data...</span>
          </div>
        ) : (
          <div className="space-y-5 py-4 overflow-y-auto flex-1">
            {/* Already Captured Data */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Already Captured
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {existingData?.firstUniversityName && (
                  <div className="flex items-start gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">University</p>
                      <p className="font-medium">{existingData.firstUniversityName}</p>
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

            {/* Student Details Section - Required */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Student Details
              </h4>
              <div className="space-y-2">
                <Label className="text-sm">
                  PIN Code <span className="text-destructive">*</span>
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
              
              {/* Optional Student Fields - Collapsible */}
              <Collapsible open={optionalStudentOpen} onOpenChange={setOptionalStudentOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
                    <span className="text-xs">Additional Details (Optional)</span>
                    {optionalStudentOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Date of Birth</Label>
                      <Input
                        type="date"
                        value={studentDob}
                        onChange={(e) => setStudentDob(e.target.value)}
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 16)).toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Gender</Label>
                      <Select value={studentGender} onValueChange={setStudentGender}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">City</Label>
                      <Input
                        placeholder="Enter city"
                        value={studentCity}
                        onChange={(e) => {
                          setStudentCity(e.target.value);
                          if (errors.studentCity) {
                            setErrors(prev => ({ ...prev, studentCity: undefined }));
                          }
                        }}
                        className={errors.studentCity ? 'border-destructive' : ''}
                      />
                      {errors.studentCity && (
                        <p className="text-xs text-destructive">{errors.studentCity}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">State</Label>
                      <Select value={studentState} onValueChange={setStudentState}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select state..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ALL_STATES_AND_UTS.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Nationality</Label>
                      <Input
                        placeholder="Enter nationality"
                        value={studentNationality}
                        onChange={(e) => setStudentNationality(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Highest Qualification</Label>
                      <Select value={studentHighestQualification} onValueChange={setStudentHighestQualification}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {QUALIFICATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Street Address</Label>
                    <Textarea
                      placeholder="Enter full address"
                      value={studentStreetAddress}
                      onChange={(e) => setStudentStreetAddress(e.target.value)}
                      rows={2}
                    />
                  </div>
                  
                  {/* Academic Scores */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Academic Scores</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-sm">10th Percentage</Label>
                        <Input
                          type="number"
                          placeholder="0-100"
                          min="0"
                          max="100"
                          step="0.01"
                          value={studentTenthPercentage}
                          onChange={(e) => {
                            setStudentTenthPercentage(e.target.value);
                            if (errors.studentTenthPercentage) {
                              setErrors(prev => ({ ...prev, studentTenthPercentage: undefined }));
                            }
                          }}
                          className={errors.studentTenthPercentage ? 'border-destructive' : ''}
                        />
                        {errors.studentTenthPercentage && (
                          <p className="text-xs text-destructive">{errors.studentTenthPercentage}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">12th Percentage</Label>
                        <Input
                          type="number"
                          placeholder="0-100"
                          min="0"
                          max="100"
                          step="0.01"
                          value={studentTwelfthPercentage}
                          onChange={(e) => {
                            setStudentTwelfthPercentage(e.target.value);
                            if (errors.studentTwelfthPercentage) {
                              setErrors(prev => ({ ...prev, studentTwelfthPercentage: undefined }));
                            }
                          }}
                          className={errors.studentTwelfthPercentage ? 'border-destructive' : ''}
                        />
                        {errors.studentTwelfthPercentage && (
                          <p className="text-xs text-destructive">{errors.studentTwelfthPercentage}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Bachelor's Percentage</Label>
                        <Input
                          type="number"
                          placeholder="0-100"
                          min="0"
                          max="100"
                          step="0.01"
                          value={studentBachelorsPercentage}
                          onChange={(e) => {
                            setStudentBachelorsPercentage(e.target.value);
                            if (errors.studentBachelorsPercentage) {
                              setErrors(prev => ({ ...prev, studentBachelorsPercentage: undefined }));
                            }
                          }}
                          className={errors.studentBachelorsPercentage ? 'border-destructive' : ''}
                        />
                        {errors.studentBachelorsPercentage && (
                          <p className="text-xs text-destructive">{errors.studentBachelorsPercentage}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Bachelor's CGPA</Label>
                        <Input
                          type="number"
                          placeholder="0-10"
                          min="0"
                          max="10"
                          step="0.01"
                          value={studentBachelorsCgpa}
                          onChange={(e) => {
                            setStudentBachelorsCgpa(e.target.value);
                            if (errors.studentBachelorsCgpa) {
                              setErrors(prev => ({ ...prev, studentBachelorsCgpa: undefined }));
                            }
                          }}
                          className={errors.studentBachelorsCgpa ? 'border-destructive' : ''}
                        />
                        {errors.studentBachelorsCgpa && (
                          <p className="text-xs text-destructive">{errors.studentBachelorsCgpa}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="space-y-2">
                        <Label className="text-sm">Credit Score</Label>
                        <Input
                          type="number"
                          placeholder="300-900"
                          min="300"
                          max="900"
                          value={studentCreditScore}
                          onChange={(e) => {
                            setStudentCreditScore(e.target.value);
                            if (errors.studentCreditScore) {
                              setErrors(prev => ({ ...prev, studentCreditScore: undefined }));
                            }
                          }}
                          className={errors.studentCreditScore ? 'border-destructive' : ''}
                        />
                        {errors.studentCreditScore && (
                          <p className="text-xs text-destructive">{errors.studentCreditScore}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Course Selection */}
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
                <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-md">
                  💡 We couldn't fetch your university automatically — please enter your course name manually.
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

              {/* Phone and Salary Row */}
              <div className="grid grid-cols-2 gap-3 mb-3">
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
                    Monthly Salary <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                    <Input
                      placeholder="e.g. 50000"
                      value={coApplicantSalary}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^\d]/g, '');
                        setCoApplicantSalary(value);
                        if (errors.coApplicantSalary) {
                          setErrors(prev => ({ ...prev, coApplicantSalary: undefined }));
                        }
                      }}
                      className={`pl-7 ${errors.coApplicantSalary ? 'border-destructive' : ''}`}
                    />
                  </div>
                  {errors.coApplicantSalary && (
                    <p className="text-xs text-destructive">{errors.coApplicantSalary}</p>
                  )}
                </div>
              </div>

              {/* PIN Code Row */}
              <div className="grid grid-cols-2 gap-3 mb-3">
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
              
              {/* Optional Employment Fields - Collapsible */}
              <Collapsible open={optionalCoAppOpen} onOpenChange={setOptionalCoAppOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
                    <span className="text-xs flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      Employment Details (Optional)
                    </span>
                    {optionalCoAppOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Occupation</Label>
                      <Select value={coApplicantOccupation} onValueChange={setCoApplicantOccupation}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {OCCUPATION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Employer</Label>
                      <Input
                        placeholder="Company name"
                        value={coApplicantEmployer}
                        onChange={(e) => {
                          setCoApplicantEmployer(e.target.value);
                          if (errors.coApplicantEmployer) {
                            setErrors(prev => ({ ...prev, coApplicantEmployer: undefined }));
                          }
                        }}
                        className={errors.coApplicantEmployer ? 'border-destructive' : ''}
                      />
                      {errors.coApplicantEmployer && (
                        <p className="text-xs text-destructive">{errors.coApplicantEmployer}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Employment Type</Label>
                      <Select value={coApplicantEmploymentType} onValueChange={setCoApplicantEmploymentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Employment Duration (Years)</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 5"
                        min="0"
                        max="50"
                        value={coApplicantEmploymentDuration}
                        onChange={(e) => {
                          setCoApplicantEmploymentDuration(e.target.value);
                          if (errors.coApplicantEmploymentDuration) {
                            setErrors(prev => ({ ...prev, coApplicantEmploymentDuration: undefined }));
                          }
                        }}
                        className={errors.coApplicantEmploymentDuration ? 'border-destructive' : ''}
                      />
                      {errors.coApplicantEmploymentDuration && (
                        <p className="text-xs text-destructive">{errors.coApplicantEmploymentDuration}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Credit Score</Label>
                      <Input
                        type="number"
                        placeholder="300-900"
                        min="300"
                        max="900"
                        value={coApplicantCreditScore}
                        onChange={(e) => {
                          setCoApplicantCreditScore(e.target.value);
                          if (errors.coApplicantCreditScore) {
                            setErrors(prev => ({ ...prev, coApplicantCreditScore: undefined }));
                          }
                        }}
                        className={errors.coApplicantCreditScore ? 'border-destructive' : ''}
                      />
                      {errors.coApplicantCreditScore && (
                        <p className="text-xs text-destructive">{errors.coApplicantCreditScore}</p>
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        )}

        {/* Trust Signal */}
        {!fetchingData && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
            <ShieldCheck className="h-4 w-4 text-green-600 shrink-0" />
            <span>Your data is encrypted and never shared with third parties.</span>
          </div>
        )}

        {/* Sticky Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t bg-background sticky bottom-0">
          <Button variant="outline" onClick={handleClose} disabled={loading || fetchingData}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || fetchingData} className="min-w-[140px]">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Complete Application
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
