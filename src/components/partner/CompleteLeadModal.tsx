import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { RefactoredLead } from "@/types/refactored-lead";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  Save,
  Check,
  Building2,
  Calendar,
  MapPin,
  Banknote,
  User,
  GraduationCap,
  Users
} from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { formatIndianNumber } from "@/utils/currencyFormatter";

// Reuse the Admin Components (Standardizing UI)
import { EditStudentTab } from "../admin/lead-edit/EditStudentTab";
import { EditStudyTab } from "../admin/lead-edit/EditStudyTab";
import { EditCoApplicantTab } from "../admin/lead-edit/EditCoApplicantTab";

// Constants needed for props
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
const STUDY_DESTINATIONS = ['Australia', 'Canada', 'Germany', 'Ireland', 'New Zealand', 'UK', 'USA', 'Other'];
const LOAN_TYPES = ['secured', 'unsecured'];
const RELATIONSHIPS = ['parent', 'spouse', 'sibling', 'guardian', 'other'];
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('default', { month: 'long' }) }));
const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'self-employed', label: 'Self-employed' },
];

interface CompleteLeadModalProps {
  open: boolean;
  onClose: () => void;
  lead: RefactoredLead | null;
  onSuccess: () => void;
}

// Unified State Interface matching Admin Modals
interface FormData {
  // Student
  student_name: string;
  student_email: string;
  student_phone: string;
  student_postal_code: string;
  student_city: string;
  student_state: string;
  student_date_of_birth: string;
  student_gender: string;
  student_nationality: string;
  student_street_address: string;
  student_highest_qualification: string;
  student_tenth_percentage: string;
  student_twelfth_percentage: string;
  student_bachelors_percentage: string;
  student_bachelors_cgpa: string;
  student_credit_score: string;

  // Study
  study_destination: string;
  loan_amount: string;
  loan_type: string;
  intake_month: string;
  intake_year: string;

  // Co-Applicant
  co_applicant_name: string;
  co_applicant_relationship: string;
  co_applicant_phone: string;
  co_applicant_salary: string;
  co_applicant_pin_code: string;
  co_applicant_occupation: string;
  co_applicant_employer: string;
  co_applicant_email: string;
  co_applicant_employment_type: string;
  co_applicant_employment_duration: string;
  co_applicant_credit_score: string;
}

const initialFormData: FormData = {
  student_name: '',
  student_email: '',
  student_phone: '',
  student_postal_code: '',
  student_city: '',
  student_state: '',
  student_date_of_birth: '',
  student_gender: '',
  student_nationality: 'Indian',
  student_street_address: '',
  student_highest_qualification: '',
  student_tenth_percentage: '',
  student_twelfth_percentage: '',
  student_bachelors_percentage: '',
  student_bachelors_cgpa: '',
  student_credit_score: '',
  study_destination: '',
  loan_amount: '',
  loan_type: '',
  intake_month: '',
  intake_year: '',
  co_applicant_name: '',
  co_applicant_relationship: '',
  co_applicant_phone: '',
  co_applicant_salary: '',
  co_applicant_pin_code: '',
  co_applicant_occupation: '',
  co_applicant_employer: '',
  co_applicant_email: '',
  co_applicant_employment_type: '',
  co_applicant_employment_duration: '',
  co_applicant_credit_score: '',
};

export const CompleteLeadModal = ({
  open,
  onClose,
  lead,
  onSuccess,
}: CompleteLeadModalProps) => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [activeTab, setActiveTab] = useState('student');
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Extra state for complex selectors (University/Course)
  const [universities, setUniversities] = useState<string[]>(['']);
  const [courseId, setCourseId] = useState<string>('');
  const [isCustomCourse, setIsCustomCourse] = useState(false);
  const [existingSummary, setExistingSummary] = useState<any>(null);

  // Load Data
  useEffect(() => {
    if (!open || !lead) return;
    setFetchingData(true);

    const loadData = async () => {
      try {
        // Fetch Student
        const { data: student } = await supabase.from("students").select("*").eq("id", lead.student_id).single();
        // Fetch Co-Applicant
        const { data: coApp } = await supabase.from("co_applicants").select("*").eq("id", lead.co_applicant_id).single();
        // Fetch Unis
        const { data: leadUnis } = await supabase.from("lead_universities").select("university_id").eq("lead_id", lead.id);
        const uniIds = leadUnis?.map(u => u.university_id) || [];
        setUniversities(uniIds.length ? uniIds : ['']);

        // Fetch Course
        const { data: leadCourses } = await supabase.from("lead_courses").select("*").eq("lead_id", lead.id).limit(1);
        if (leadCourses?.length) {
          const lc = leadCourses[0];
          const cVal = lc.is_custom_course ? lc.custom_course_name : lc.course_id;
          setCourseId(cVal || '');
          setIsCustomCourse(lc.is_custom_course || false);
        }

        // Fetch first university name for Summary
        let firstUniName = null;
        if (uniIds.length > 0) {
          const { data: u } = await supabase.from('universities').select('name').eq('id', uniIds[0]).single();
          firstUniName = u?.name;
        }

        setExistingSummary({
          firstUniversityName: firstUniName,
          intakeDisplay: (lead.intake_month && lead.intake_year) ? `${MONTHS[lead.intake_month - 1]?.label || ''} ${lead.intake_year}` : null,
        });

        // Set Form Data
        setFormData({
          student_name: student?.name || '',
          student_email: student?.email || '',
          student_phone: student?.phone || '',
          student_postal_code: student?.postal_code || '',
          student_city: student?.city || '',
          student_state: student?.state || '',
          student_date_of_birth: student?.date_of_birth || '',
          student_gender: student?.gender || '',
          student_nationality: student?.nationality || 'Indian',
          student_street_address: student?.street_address || '',
          student_highest_qualification: student?.highest_qualification || '',
          student_tenth_percentage: student?.tenth_percentage?.toString() || '',
          student_twelfth_percentage: student?.twelfth_percentage?.toString() || '',
          student_bachelors_percentage: student?.bachelors_percentage?.toString() || '',
          student_bachelors_cgpa: student?.bachelors_cgpa?.toString() || '',
          student_credit_score: student?.credit_score?.toString() || '',

          study_destination: lead.study_destination || '',
          loan_amount: lead.loan_amount?.toString() || '',
          loan_type: lead.loan_type || '',
          intake_month: lead.intake_month?.toString() || '',
          intake_year: lead.intake_year?.toString() || '',

          co_applicant_name: coApp?.name || '',
          co_applicant_relationship: coApp?.relationship || '',
          co_applicant_phone: coApp?.phone || '',
          co_applicant_salary: coApp?.salary?.toString() || '',
          co_applicant_pin_code: coApp?.pin_code || '',
          co_applicant_occupation: coApp?.occupation || '',
          co_applicant_employer: coApp?.employer || '',
          co_applicant_email: coApp?.email || '',
          co_applicant_employment_type: coApp?.employment_type || '',
          co_applicant_employment_duration: coApp?.employment_duration_years?.toString() || '',
          co_applicant_credit_score: coApp?.credit_score?.toString() || '',
        });
      } catch (e) {
        console.error("Error loading lead data", e);
        toast.error("Failed to load existing data");
      } finally {
        setFetchingData(false);
      }
    };
    loadData();
  }, [open, lead]);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = () => {
    // Required fields check
    const required = [
      { k: 'student_state', l: 'Student State' },
      { k: 'co_applicant_name', l: 'Co-Applicant Name' },
      { k: 'co_applicant_relationship', l: 'Relationship' },
      { k: 'co_applicant_salary', l: 'Salary' },
    ];

    for (const r of required) {
      if (!formData[r.k as keyof FormData]) {
        toast.error(`${r.l} is required`);
        return false;
      }
    }

    if (formData.co_applicant_phone && formData.co_applicant_phone.length !== 10) {
      toast.error("Co-applicant phone must be 10 digits");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!lead || !validateForm()) return;
    setLoading(true);

    try {
      // Update Student
      const { error: sErr } = await supabase.from("students").update({
        email: formData.student_email || null,
        postal_code: formData.student_postal_code,
        date_of_birth: formData.student_date_of_birth || null,
        gender: formData.student_gender || null,
        city: formData.student_city || null,
        state: formData.student_state || null,
        nationality: formData.student_nationality || null,
        street_address: formData.student_street_address || null,
        highest_qualification: formData.student_highest_qualification || null,
        tenth_percentage: parseFloat(formData.student_tenth_percentage) || null,
        twelfth_percentage: parseFloat(formData.student_twelfth_percentage) || null,
        bachelors_percentage: parseFloat(formData.student_bachelors_percentage) || null,
        bachelors_cgpa: parseFloat(formData.student_bachelors_cgpa) || null,
        credit_score: parseInt(formData.student_credit_score) || null,
      }).eq("id", lead.student_id);
      if (sErr) throw sErr;

      // Update Co-Applicant
      const { error: cErr } = await supabase.from("co_applicants").update({
        name: formData.co_applicant_name,
        relationship: formData.co_applicant_relationship as any,
        phone: formData.co_applicant_phone,
        salary: parseInt(formData.co_applicant_salary) || 0,
        pin_code: formData.co_applicant_pin_code || null,
        occupation: formData.co_applicant_occupation || null,
        employer: formData.co_applicant_employer || null,
        email: formData.co_applicant_email || null,
        employment_type: formData.co_applicant_employment_type || null,
        employment_duration_years: parseInt(formData.co_applicant_employment_duration) || null,
        credit_score: parseInt(formData.co_applicant_credit_score) || null,
      }).eq("id", lead.co_applicant_id);
      if (cErr) throw cErr;

      // Update Lead Details
      const { error: lErr } = await supabase.from("leads_new").update({
        quick_lead_completed_at: new Date().toISOString(), // MARK AS COMPLETE
        study_destination: formData.study_destination as any || null,
        loan_amount: parseInt(formData.loan_amount) || null,
        loan_type: formData.loan_type as any || null,
        intake_month: parseInt(formData.intake_month) || null,
        intake_year: parseInt(formData.intake_year) || null,
      }).eq("id", lead.id);
      if (lErr) throw lErr;

      // Save Universities
      await supabase.from("lead_universities").delete().eq("lead_id", lead.id);
      const validUnis = universities.filter(u => u && u.length > 5);
      if (validUnis.length) {
        await supabase.from("lead_universities").insert(validUnis.map(u => ({
          lead_id: lead.id, university_id: u
        })));
      }

      // Save Course
      await supabase.from("lead_courses").delete().eq("lead_id", lead.id);
      if (courseId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseId);
        await supabase.from("lead_courses").insert({
          lead_id: lead.id,
          course_id: isUuid ? courseId : null,
          is_custom_course: !isUuid || isCustomCourse,
          custom_course_name: !isUuid || isCustomCourse ? courseId : null
        });
      }

      toast.success("Lead completed successfully!");
      onSuccess();
      onClose();

    } catch (e: any) {
      console.error("Complete Lead Error", e);
      toast.error(e.message || "Failed to save details");
    } finally {
      setLoading(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="space-y-3 pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Complete Application Details
          </DialogTitle>
          <DialogDescription className="text-sm">
            Complete details for <span className="font-medium text-foreground">{lead?.student?.name}</span> to proceed with lender selection.
          </DialogDescription>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Completeness</span>
              <span className="font-medium text-primary">Almost done!</span>
            </div>
            <Progress value={90} className="h-2" />
          </div>
        </DialogHeader>

        {fetchingData ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Summary Section (Already Captured) */}
            <div className="bg-muted/30 border-b p-4 grid grid-cols-4 gap-4 text-sm mb-4">
              {existingSummary?.firstUniversityName && (
                <div>
                  <span className="text-xs text-muted-foreground block">University</span>
                  <span className="font-medium">{existingSummary.firstUniversityName}</span>
                </div>
              )}
              {lead?.study_destination && (
                <div>
                  <span className="text-xs text-muted-foreground block">Destination</span>
                  <span className="font-medium">{lead.study_destination}</span>
                </div>
              )}
              {lead?.loan_amount && (
                <div>
                  <span className="text-xs text-muted-foreground block">Loan Amount</span>
                  <span className="font-medium">₹{formatIndianNumber(lead.loan_amount)}</span>
                </div>
              )}
              {existingSummary?.intakeDisplay && (
                <div>
                  <span className="text-xs text-muted-foreground block">Intake</span>
                  <span className="font-medium">{existingSummary.intakeDisplay}</span>
                </div>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-1">
              <TabsList className="grid w-full grid-cols-3 mb-4 sticky top-0 bg-background z-10">
                <TabsTrigger value="student" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Student
                </TabsTrigger>
                <TabsTrigger value="study" className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" /> Study Plans
                </TabsTrigger>
                <TabsTrigger value="co_applicant" className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Co-Applicant
                </TabsTrigger>
              </TabsList>

              <TabsContent value="student">
                <EditStudentTab
                  formData={formData}
                  handleInputChange={handleInputChange}
                  GENDER_OPTIONS={GENDER_OPTIONS}
                />
              </TabsContent>

              <TabsContent value="study">
                <EditStudyTab
                  formData={formData}
                  handleInputChange={handleInputChange}
                  universities={universities}
                  setUniversities={setUniversities}
                  courseId={courseId}
                  setCourseId={setCourseId}
                  isCustomCourse={isCustomCourse}
                  setIsCustomCourse={setIsCustomCourse}
                  STUDY_DESTINATIONS={STUDY_DESTINATIONS}
                  LOAN_TYPES={LOAN_TYPES}
                  MONTHS={MONTHS}
                />
              </TabsContent>

              <TabsContent value="co_applicant">
                <EditCoApplicantTab
                  formData={formData}
                  handleInputChange={handleInputChange}
                  RELATIONSHIPS={RELATIONSHIPS}
                  EMPLOYMENT_TYPE_OPTIONS={EMPLOYMENT_TYPE_OPTIONS}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="pt-4 border-t mt-auto flex justify-end gap-2 bg-background p-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Save className="h-4 w-4" />
            Complete Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
