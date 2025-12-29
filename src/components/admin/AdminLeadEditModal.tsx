/**
 * Admin Lead Edit Modal
 * 
 * Per Knowledge Base:
 * - Admin can complete/edit ANY lead regardless of origin (Partner, Student, Admin)
 * - All edits must be audited with role attribution
 * - Shows ALL lead fields including admin-only sections
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { 
  getLeadCompleteness, 
  getCompletenessColor, 
  getMissingSummary,
  LeadCompletenessResult 
} from "@/utils/leadCompleteness";
import { QUALIFICATION_OPTIONS, TEST_TYPES } from "@/utils/leadCompletionSchema";
import { INDIAN_STATES } from "@/constants/indianStates";
import { 
  Loader2, 
  User, 
  GraduationCap, 
  Users, 
  Building2, 
  AlertCircle, 
  CheckCircle2,
  Save,
  ChevronDown,
  FileText,
  Plus,
  Trash2
} from "lucide-react";
import { PaginatedLead } from "@/hooks/usePaginatedLeads";

interface AdminLeadEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: PaginatedLead | null;
  onSuccess?: () => void;
}

interface AcademicTest {
  id?: string;
  test_type: string;
  score: string;
  test_date: string;
  expiry_date: string;
  isNew?: boolean;
  isDeleted?: boolean;
}

interface FormData {
  // Student fields
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
  
  // Study fields
  study_destination: string;
  loan_amount: string;
  loan_type: string;
  intake_month: string;
  intake_year: string;
  
  // Co-applicant fields
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
  
  // Admin notes
  admin_notes: string;
}

const STUDY_DESTINATIONS = ['Australia', 'Canada', 'Germany', 'Ireland', 'New Zealand', 'UK', 'USA', 'Other'];
const LOAN_TYPES = ['secured', 'unsecured'];
const RELATIONSHIPS = ['parent', 'spouse', 'sibling', 'guardian', 'other'];
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('default', { month: 'long' }) }));
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];
const EMPLOYMENT_TYPE_OPTIONS = [
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'self-employed', label: 'Self-employed' },
];

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
  admin_notes: '',
};

export function AdminLeadEditModal({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: AdminLeadEditModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [completeness, setCompleteness] = useState<LeadCompletenessResult | null>(null);
  const [activeTab, setActiveTab] = useState('student');
  const [academicHistoryOpen, setAcademicHistoryOpen] = useState(false);
  const [employmentDetailsOpen, setEmploymentDetailsOpen] = useState(false);
  
  // Academic tests state
  const [academicTests, setAcademicTests] = useState<AcademicTest[]>([]);
  const [originalTests, setOriginalTests] = useState<AcademicTest[]>([]);
  
  const { toast } = useToast();
  const { logFieldChanges } = useAuditLog();

  // Fetch full lead details when modal opens
  useEffect(() => {
    if (open && lead) {
      fetchLeadDetails();
    }
  }, [open, lead?.id]);

  const fetchLeadDetails = async () => {
    if (!lead) return;
    
    setFetchingDetails(true);
    try {
      // Fetch student details with all fields
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', lead.student_id)
        .single();

      // Fetch co-applicant details with all fields
      const { data: coApplicantData } = await supabase
        .from('co_applicants')
        .select('*')
        .eq('id', lead.co_applicant_id)
        .single();

      // Fetch academic tests
      const { data: testsData } = await supabase
        .from('academic_tests')
        .select('*')
        .eq('student_id', lead.student_id);

      const newFormData: FormData = {
        student_name: studentData?.name || '',
        student_email: studentData?.email || '',
        student_phone: studentData?.phone || '',
        student_postal_code: studentData?.postal_code || '',
        student_city: studentData?.city || '',
        student_state: studentData?.state || '',
        student_date_of_birth: studentData?.date_of_birth || '',
        student_gender: studentData?.gender || '',
        student_nationality: studentData?.nationality || 'Indian',
        student_street_address: studentData?.street_address || '',
        student_highest_qualification: studentData?.highest_qualification || '',
        student_tenth_percentage: studentData?.tenth_percentage?.toString() || '',
        student_twelfth_percentage: studentData?.twelfth_percentage?.toString() || '',
        student_bachelors_percentage: studentData?.bachelors_percentage?.toString() || '',
        student_bachelors_cgpa: studentData?.bachelors_cgpa?.toString() || '',
        student_credit_score: studentData?.credit_score?.toString() || '',
        study_destination: lead.study_destination || '',
        loan_amount: String(lead.loan_amount || ''),
        loan_type: lead.loan_type || '',
        intake_month: String(lead.intake_month || ''),
        intake_year: String(lead.intake_year || ''),
        co_applicant_name: coApplicantData?.name || '',
        co_applicant_relationship: coApplicantData?.relationship || '',
        co_applicant_phone: coApplicantData?.phone || '',
        co_applicant_salary: String(coApplicantData?.salary || ''),
        co_applicant_pin_code: coApplicantData?.pin_code || '',
        co_applicant_occupation: coApplicantData?.occupation || '',
        co_applicant_employer: coApplicantData?.employer || '',
        co_applicant_email: coApplicantData?.email || '',
        co_applicant_employment_type: coApplicantData?.employment_type || '',
        co_applicant_employment_duration: coApplicantData?.employment_duration_years?.toString() || '',
        co_applicant_credit_score: coApplicantData?.credit_score?.toString() || '',
        admin_notes: '',
      };

      setFormData(newFormData);
      setOriginalData(newFormData);

      // Set academic tests
      const tests = (testsData || []).map(t => ({
        id: t.id,
        test_type: t.test_type,
        score: t.score,
        test_date: t.test_date || '',
        expiry_date: t.expiry_date || '',
      }));
      setAcademicTests(tests);
      setOriginalTests(JSON.parse(JSON.stringify(tests)));

      // Calculate completeness
      const leadWithDetails = {
        ...lead,
        student: studentData,
        co_applicant: coApplicantData,
      };
      setCompleteness(getLeadCompleteness(leadWithDetails));
    } catch (error) {
      console.error('Error fetching lead details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lead details',
        variant: 'destructive',
      });
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Academic test handlers
  const addAcademicTest = () => {
    if (academicTests.filter(t => !t.isDeleted).length >= 5) {
      toast({ title: 'Maximum 5 tests allowed', variant: 'destructive' });
      return;
    }
    setAcademicTests(prev => [...prev, {
      test_type: '',
      score: '',
      test_date: '',
      expiry_date: '',
      isNew: true,
    }]);
  };

  const updateAcademicTest = (index: number, field: keyof AcademicTest, value: string) => {
    setAcademicTests(prev => prev.map((test, i) => 
      i === index ? { ...test, [field]: value } : test
    ));
  };

  const removeAcademicTest = (index: number) => {
    setAcademicTests(prev => prev.map((test, i) => 
      i === index ? { ...test, isDeleted: true } : test
    ));
  };

  const getTestMaxScore = (testType: string): number => {
    const test = TEST_TYPES.find(t => t.value === testType);
    return test?.maxScore || 100;
  };

  const validateTestScore = (testType: string, score: string): boolean => {
    if (!testType || !score) return true;
    const numScore = parseFloat(score);
    const testInfo = TEST_TYPES.find(t => t.value === testType);
    if (!testInfo) return true;
    const minScore = testInfo.minScore || 0;
    return numScore >= minScore && numScore <= testInfo.maxScore;
  };

  const getChangedFields = useCallback((): { field: string; oldValue: string; newValue: string; tableName: string }[] => {
    if (!originalData) return [];
    
    const changes: { field: string; oldValue: string; newValue: string; tableName: string }[] = [];
    
    const fieldMappings: { key: keyof FormData; table: string; dbField: string }[] = [
      { key: 'student_name', table: 'students', dbField: 'name' },
      { key: 'student_email', table: 'students', dbField: 'email' },
      { key: 'student_phone', table: 'students', dbField: 'phone' },
      { key: 'student_postal_code', table: 'students', dbField: 'postal_code' },
      { key: 'student_city', table: 'students', dbField: 'city' },
      { key: 'student_state', table: 'students', dbField: 'state' },
      { key: 'student_date_of_birth', table: 'students', dbField: 'date_of_birth' },
      { key: 'student_gender', table: 'students', dbField: 'gender' },
      { key: 'student_nationality', table: 'students', dbField: 'nationality' },
      { key: 'student_street_address', table: 'students', dbField: 'street_address' },
      { key: 'student_highest_qualification', table: 'students', dbField: 'highest_qualification' },
      { key: 'student_tenth_percentage', table: 'students', dbField: 'tenth_percentage' },
      { key: 'student_twelfth_percentage', table: 'students', dbField: 'twelfth_percentage' },
      { key: 'student_bachelors_percentage', table: 'students', dbField: 'bachelors_percentage' },
      { key: 'student_bachelors_cgpa', table: 'students', dbField: 'bachelors_cgpa' },
      { key: 'student_credit_score', table: 'students', dbField: 'credit_score' },
      { key: 'study_destination', table: 'leads_new', dbField: 'study_destination' },
      { key: 'loan_amount', table: 'leads_new', dbField: 'loan_amount' },
      { key: 'loan_type', table: 'leads_new', dbField: 'loan_type' },
      { key: 'intake_month', table: 'leads_new', dbField: 'intake_month' },
      { key: 'intake_year', table: 'leads_new', dbField: 'intake_year' },
      { key: 'co_applicant_name', table: 'co_applicants', dbField: 'name' },
      { key: 'co_applicant_relationship', table: 'co_applicants', dbField: 'relationship' },
      { key: 'co_applicant_phone', table: 'co_applicants', dbField: 'phone' },
      { key: 'co_applicant_salary', table: 'co_applicants', dbField: 'salary' },
      { key: 'co_applicant_pin_code', table: 'co_applicants', dbField: 'pin_code' },
      { key: 'co_applicant_occupation', table: 'co_applicants', dbField: 'occupation' },
      { key: 'co_applicant_employer', table: 'co_applicants', dbField: 'employer' },
      { key: 'co_applicant_email', table: 'co_applicants', dbField: 'email' },
      { key: 'co_applicant_employment_type', table: 'co_applicants', dbField: 'employment_type' },
      { key: 'co_applicant_employment_duration', table: 'co_applicants', dbField: 'employment_duration_years' },
      { key: 'co_applicant_credit_score', table: 'co_applicants', dbField: 'credit_score' },
    ];
    
    for (const mapping of fieldMappings) {
      const oldVal = originalData[mapping.key];
      const newVal = formData[mapping.key];
      if (oldVal !== newVal) {
        changes.push({
          field: mapping.dbField,
          oldValue: oldVal,
          newValue: newVal,
          tableName: mapping.table,
        });
      }
    }
    
    return changes;
  }, [originalData, formData]);

  const getTestChanges = useCallback(() => {
    const toDelete: string[] = [];
    const toUpdate: AcademicTest[] = [];
    const toInsert: AcademicTest[] = [];

    academicTests.forEach((test, idx) => {
      if (test.isDeleted && test.id) {
        toDelete.push(test.id);
      } else if (test.isNew && !test.isDeleted && test.test_type && test.score) {
        toInsert.push(test);
      } else if (test.id && !test.isDeleted) {
        const original = originalTests.find(t => t.id === test.id);
        if (original && (
          original.test_type !== test.test_type ||
          original.score !== test.score ||
          original.test_date !== test.test_date ||
          original.expiry_date !== test.expiry_date
        )) {
          toUpdate.push(test);
        }
      }
    });

    return { toDelete, toUpdate, toInsert };
  }, [academicTests, originalTests]);

  const handleSubmit = async () => {
    if (!lead) return;
    
    const changes = getChangedFields();
    const testChanges = getTestChanges();
    const hasTestChanges = testChanges.toDelete.length > 0 || testChanges.toUpdate.length > 0 || testChanges.toInsert.length > 0;
    
    if (changes.length === 0 && !hasTestChanges) {
      toast({
        title: 'No changes',
        description: 'No fields have been modified',
      });
      return;
    }
    
    setLoading(true);
    try {
      // Group changes by table
      const studentChanges = changes.filter(c => c.tableName === 'students');
      const leadChanges = changes.filter(c => c.tableName === 'leads_new');
      const coApplicantChanges = changes.filter(c => c.tableName === 'co_applicants');

      // Update student
      if (studentChanges.length > 0) {
        const studentUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
        studentChanges.forEach(c => {
          let value: any = c.newValue || null;
          // Convert numeric fields
          if (['tenth_percentage', 'twelfth_percentage', 'bachelors_percentage', 'bachelors_cgpa', 'credit_score'].includes(c.field) && value) {
            value = parseFloat(value);
          }
          studentUpdate[c.field] = value;
        });
        
        const { error } = await supabase
          .from('students')
          .update(studentUpdate)
          .eq('id', lead.student_id);
        if (error) throw error;
      }

      // Update lead
      if (leadChanges.length > 0) {
        const leadUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
        leadChanges.forEach(c => {
          let value: any = c.newValue || null;
          // Convert numbers
          if (['loan_amount', 'intake_month', 'intake_year'].includes(c.field) && value) {
            value = parseInt(value, 10);
          }
          leadUpdate[c.field] = value;
        });
        
        // Mark quick lead as completed if it was incomplete
        if (lead.is_quick_lead && !lead.quick_lead_completed_at) {
          leadUpdate.quick_lead_completed_at = new Date().toISOString();
        }
        
        const { error } = await supabase
          .from('leads_new')
          .update(leadUpdate)
          .eq('id', lead.id);
        if (error) throw error;
      }

      // Update co-applicant
      if (coApplicantChanges.length > 0) {
        const coAppUpdate: Record<string, any> = { updated_at: new Date().toISOString() };
        coApplicantChanges.forEach(c => {
          let value: any = c.newValue || null;
          if (['salary', 'employment_duration_years', 'credit_score'].includes(c.field) && value) {
            value = c.field === 'employment_duration_years' ? parseInt(value, 10) : parseFloat(value);
          }
          coAppUpdate[c.field] = value;
        });
        
        const { error } = await supabase
          .from('co_applicants')
          .update(coAppUpdate)
          .eq('id', lead.co_applicant_id);
        if (error) throw error;
      }

      // Handle academic test changes
      if (testChanges.toDelete.length > 0) {
        const { error } = await supabase
          .from('academic_tests')
          .delete()
          .in('id', testChanges.toDelete);
        if (error) throw error;
      }

      for (const test of testChanges.toUpdate) {
        const { error } = await supabase
          .from('academic_tests')
          .update({
            test_type: test.test_type as "GMAT" | "GRE" | "IELTS" | "Other" | "PTE" | "SAT" | "TOEFL",
            score: test.score,
            test_date: test.test_date || null,
            expiry_date: test.expiry_date || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', test.id);
        if (error) throw error;
      }

      if (testChanges.toInsert.length > 0) {
        const { error } = await supabase
          .from('academic_tests')
          .insert(testChanges.toInsert.map(t => ({
            student_id: lead.student_id,
            test_type: t.test_type as "GMAT" | "GRE" | "IELTS" | "Other" | "PTE" | "SAT" | "TOEFL",
            score: t.score,
            test_date: t.test_date || null,
            expiry_date: t.expiry_date || null,
          })));
        if (error) throw error;
      }

      // Log all changes to audit log
      const auditEntries = changes.map(c => ({
        leadId: lead.id,
        tableName: c.tableName,
        fieldName: c.field,
        oldValue: c.oldValue,
        newValue: c.newValue,
        changeReason: formData.admin_notes || 'Admin edit',
        changeSource: 'user_edit' as const,
      }));
      
      if (auditEntries.length > 0) {
        await logFieldChanges(auditEntries);
      }

      // Log activity
      const totalChanges = changes.length + testChanges.toDelete.length + testChanges.toUpdate.length + testChanges.toInsert.length;
      await supabase.from('application_activities').insert({
        lead_id: lead.id,
        activity_type: 'admin_edit',
        description: `Admin edited ${totalChanges} field(s)`,
        metadata: {
          fields_changed: changes.map(c => c.field),
          tests_added: testChanges.toInsert.length,
          tests_updated: testChanges.toUpdate.length,
          tests_deleted: testChanges.toDelete.length,
          notes: formData.admin_notes,
        },
      });

      toast({
        title: 'Lead updated',
        description: `Successfully updated ${totalChanges} field(s)`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to update lead. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const changedFieldsCount = getChangedFields().length;
  const testChanges = getTestChanges();
  const totalTestChanges = testChanges.toDelete.length + testChanges.toUpdate.length + testChanges.toInsert.length;
  const totalChanges = changedFieldsCount + totalTestChanges;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Edit Lead Details
            {lead?.case_id && (
              <Badge variant="outline" className="font-mono text-xs">
                {lead.case_id}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3">
            {completeness && (
              <>
                <Badge variant="outline" className={getCompletenessColor(completeness.completenessScore)}>
                  {completeness.completenessScore}% Complete
                </Badge>
                <span className="text-xs">
                  {getMissingSummary(completeness)}
                </span>
              </>
            )}
            {lead?.is_quick_lead && !lead.quick_lead_completed_at && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                Quick Lead - Needs Completion
              </Badge>
            )}
          </DialogDescription>
        </DialogHeader>

        {fetchingDetails ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="student" className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="study" className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Study
                </TabsTrigger>
                <TabsTrigger value="co_applicant" className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Co-Applicant
                </TabsTrigger>
                <TabsTrigger value="tests" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Tests
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  Admin
                </TabsTrigger>
              </TabsList>

              {/* Student Tab */}
              <TabsContent value="student" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="student_name">Full Name *</Label>
                      <Input
                        id="student_name"
                        value={formData.student_name}
                        onChange={(e) => handleInputChange('student_name', e.target.value)}
                        placeholder="Enter student name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_email">Email *</Label>
                      <Input
                        id="student_email"
                        type="email"
                        value={formData.student_email}
                        onChange={(e) => handleInputChange('student_email', e.target.value)}
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_phone">Phone *</Label>
                      <Input
                        id="student_phone"
                        value={formData.student_phone}
                        onChange={(e) => handleInputChange('student_phone', e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_postal_code">PIN Code *</Label>
                      <Input
                        id="student_postal_code"
                        value={formData.student_postal_code}
                        onChange={(e) => handleInputChange('student_postal_code', e.target.value)}
                        placeholder="Enter PIN code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_city">City</Label>
                      <Input
                        id="student_city"
                        value={formData.student_city}
                        onChange={(e) => handleInputChange('student_city', e.target.value)}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_state">State</Label>
                      <Select
                        value={formData.student_state}
                        onValueChange={(value) => handleInputChange('student_state', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map(state => (
                            <SelectItem key={state} value={state}>{state}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_date_of_birth">Date of Birth</Label>
                      <Input
                        id="student_date_of_birth"
                        type="date"
                        value={formData.student_date_of_birth}
                        onChange={(e) => handleInputChange('student_date_of_birth', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="student_gender">Gender</Label>
                      <Select
                        value={formData.student_gender}
                        onValueChange={(value) => handleInputChange('student_gender', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          {GENDER_OPTIONS.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Academic History Collapsible */}
                <Collapsible open={academicHistoryOpen} onOpenChange={setAcademicHistoryOpen}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            Academic History
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${academicHistoryOpen ? 'rotate-180' : ''}`} />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="grid grid-cols-2 gap-4 pt-0">
                        <div className="space-y-2">
                          <Label htmlFor="student_nationality">Nationality</Label>
                          <Input
                            id="student_nationality"
                            value={formData.student_nationality}
                            onChange={(e) => handleInputChange('student_nationality', e.target.value)}
                            placeholder="Enter nationality"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student_highest_qualification">Highest Qualification</Label>
                          <Select
                            value={formData.student_highest_qualification}
                            onValueChange={(value) => handleInputChange('student_highest_qualification', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select qualification" />
                            </SelectTrigger>
                            <SelectContent>
                              {QUALIFICATION_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 col-span-2">
                          <Label htmlFor="student_street_address">Street Address</Label>
                          <Textarea
                            id="student_street_address"
                            value={formData.student_street_address}
                            onChange={(e) => handleInputChange('student_street_address', e.target.value)}
                            placeholder="Enter full address"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student_tenth_percentage">10th Percentage</Label>
                          <Input
                            id="student_tenth_percentage"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.student_tenth_percentage}
                            onChange={(e) => handleInputChange('student_tenth_percentage', e.target.value)}
                            placeholder="0-100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student_twelfth_percentage">12th Percentage</Label>
                          <Input
                            id="student_twelfth_percentage"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.student_twelfth_percentage}
                            onChange={(e) => handleInputChange('student_twelfth_percentage', e.target.value)}
                            placeholder="0-100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student_bachelors_percentage">Bachelor's Percentage</Label>
                          <Input
                            id="student_bachelors_percentage"
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={formData.student_bachelors_percentage}
                            onChange={(e) => handleInputChange('student_bachelors_percentage', e.target.value)}
                            placeholder="0-100"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student_bachelors_cgpa">Bachelor's CGPA</Label>
                          <Input
                            id="student_bachelors_cgpa"
                            type="number"
                            min="0"
                            max="10"
                            step="0.01"
                            value={formData.student_bachelors_cgpa}
                            onChange={(e) => handleInputChange('student_bachelors_cgpa', e.target.value)}
                            placeholder="0-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student_credit_score">Credit Score</Label>
                          <Input
                            id="student_credit_score"
                            type="number"
                            min="300"
                            max="900"
                            value={formData.student_credit_score}
                            onChange={(e) => handleInputChange('student_credit_score', e.target.value)}
                            placeholder="300-900"
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </TabsContent>

              {/* Study Tab */}
              <TabsContent value="study" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Study & Loan Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="study_destination">Study Destination *</Label>
                      <Select
                        value={formData.study_destination}
                        onValueChange={(value) => handleInputChange('study_destination', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {STUDY_DESTINATIONS.map(dest => (
                            <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loan_amount">Loan Amount (₹) *</Label>
                      <Input
                        id="loan_amount"
                        type="number"
                        value={formData.loan_amount}
                        onChange={(e) => handleInputChange('loan_amount', e.target.value)}
                        placeholder="Enter loan amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loan_type">Loan Type *</Label>
                      <Select
                        value={formData.loan_type}
                        onValueChange={(value) => handleInputChange('loan_type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOAN_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                              {type.charAt(0).toUpperCase() + type.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="intake_month">Intake Month *</Label>
                      <Select
                        value={formData.intake_month}
                        onValueChange={(value) => handleInputChange('intake_month', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map(m => (
                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="intake_year">Intake Year *</Label>
                      <Input
                        id="intake_year"
                        type="number"
                        min="2024"
                        max="2030"
                        value={formData.intake_year}
                        onChange={(e) => handleInputChange('intake_year', e.target.value)}
                        placeholder="Enter year"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Co-Applicant Tab */}
              <TabsContent value="co_applicant" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="co_applicant_name">Full Name *</Label>
                      <Input
                        id="co_applicant_name"
                        value={formData.co_applicant_name}
                        onChange={(e) => handleInputChange('co_applicant_name', e.target.value)}
                        placeholder="Enter name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="co_applicant_relationship">Relationship *</Label>
                      <Select
                        value={formData.co_applicant_relationship}
                        onValueChange={(value) => handleInputChange('co_applicant_relationship', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIPS.map(rel => (
                            <SelectItem key={rel} value={rel}>
                              {rel.charAt(0).toUpperCase() + rel.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="co_applicant_phone">Phone *</Label>
                      <Input
                        id="co_applicant_phone"
                        value={formData.co_applicant_phone}
                        onChange={(e) => handleInputChange('co_applicant_phone', e.target.value)}
                        placeholder="Enter phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="co_applicant_salary">Monthly Salary (₹) *</Label>
                      <Input
                        id="co_applicant_salary"
                        type="number"
                        value={formData.co_applicant_salary}
                        onChange={(e) => handleInputChange('co_applicant_salary', e.target.value)}
                        placeholder="Enter salary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="co_applicant_pin_code">PIN Code *</Label>
                      <Input
                        id="co_applicant_pin_code"
                        value={formData.co_applicant_pin_code}
                        onChange={(e) => handleInputChange('co_applicant_pin_code', e.target.value)}
                        placeholder="Enter PIN code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="co_applicant_email">Email</Label>
                      <Input
                        id="co_applicant_email"
                        type="email"
                        value={formData.co_applicant_email}
                        onChange={(e) => handleInputChange('co_applicant_email', e.target.value)}
                        placeholder="Enter email"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Employment Details Collapsible */}
                <Collapsible open={employmentDetailsOpen} onOpenChange={setEmploymentDetailsOpen}>
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Employment Details
                          </span>
                          <ChevronDown className={`h-4 w-4 transition-transform ${employmentDetailsOpen ? 'rotate-180' : ''}`} />
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="grid grid-cols-2 gap-4 pt-0">
                        <div className="space-y-2">
                          <Label htmlFor="co_applicant_occupation">Occupation</Label>
                          <Input
                            id="co_applicant_occupation"
                            value={formData.co_applicant_occupation}
                            onChange={(e) => handleInputChange('co_applicant_occupation', e.target.value)}
                            placeholder="Enter occupation"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="co_applicant_employer">Employer</Label>
                          <Input
                            id="co_applicant_employer"
                            value={formData.co_applicant_employer}
                            onChange={(e) => handleInputChange('co_applicant_employer', e.target.value)}
                            placeholder="Enter employer name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="co_applicant_employment_type">Employment Type</Label>
                          <Select
                            value={formData.co_applicant_employment_type}
                            onValueChange={(value) => handleInputChange('co_applicant_employment_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {EMPLOYMENT_TYPE_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="co_applicant_employment_duration">Employment Duration (years)</Label>
                          <Input
                            id="co_applicant_employment_duration"
                            type="number"
                            min="0"
                            max="50"
                            value={formData.co_applicant_employment_duration}
                            onChange={(e) => handleInputChange('co_applicant_employment_duration', e.target.value)}
                            placeholder="0-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="co_applicant_credit_score">Credit Score</Label>
                          <Input
                            id="co_applicant_credit_score"
                            type="number"
                            min="300"
                            max="900"
                            value={formData.co_applicant_credit_score}
                            onChange={(e) => handleInputChange('co_applicant_credit_score', e.target.value)}
                            placeholder="300-900"
                          />
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </TabsContent>

              {/* Tests Tab */}
              <TabsContent value="tests" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Academic Test Scores
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAcademicTest}
                        disabled={academicTests.filter(t => !t.isDeleted).length >= 5}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Test
                      </Button>
                    </CardTitle>
                    <CardDescription>
                      Add standardized test scores (IELTS, TOEFL, GRE, GMAT, etc.)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {academicTests.filter(t => !t.isDeleted).length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No test scores added yet</p>
                        <p className="text-xs mt-1">Click "Add Test" to add standardized test scores</p>
                      </div>
                    ) : (
                      academicTests.map((test, index) => {
                        if (test.isDeleted) return null;
                        const isValid = validateTestScore(test.test_type, test.score);
                        return (
                          <div key={test.id || `new-${index}`} className="grid grid-cols-5 gap-3 p-3 border rounded-lg bg-muted/30">
                            <div className="space-y-1">
                              <Label className="text-xs">Test Type</Label>
                              <Select
                                value={test.test_type}
                                onValueChange={(value) => updateAcademicTest(index, 'test_type', value)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {TEST_TYPES.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">
                                Score {test.test_type && `(max: ${getTestMaxScore(test.test_type)})`}
                              </Label>
                              <Input
                                type="number"
                                className={`h-9 ${!isValid ? 'border-destructive' : ''}`}
                                value={test.score}
                                onChange={(e) => updateAcademicTest(index, 'score', e.target.value)}
                                placeholder="Score"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Test Date</Label>
                              <Input
                                type="date"
                                className="h-9"
                                value={test.test_date}
                                onChange={(e) => updateAcademicTest(index, 'test_date', e.target.value)}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Expiry Date</Label>
                              <Input
                                type="date"
                                className="h-9"
                                value={test.expiry_date}
                                onChange={(e) => updateAcademicTest(index, 'expiry_date', e.target.value)}
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeAcademicTest(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Admin Tab */}
              <TabsContent value="admin" className="space-y-4 mt-0">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Admin Notes & Summary
                    </CardTitle>
                    <CardDescription>
                      Internal notes for this edit (will be logged in audit trail)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin_notes">Reason for Edit</Label>
                      <Textarea
                        id="admin_notes"
                        value={formData.admin_notes}
                        onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                        placeholder="Enter reason for changes (required for audit trail)..."
                        rows={3}
                      />
                    </div>

                    {/* Changes Summary */}
                    {totalChanges > 0 && (
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          Pending Changes ({totalChanges})
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {getChangedFields().map((change, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="font-mono bg-background px-1 rounded">{change.field}</span>
                              <span>→</span>
                              <span className="truncate max-w-[200px]">{change.newValue || '(empty)'}</span>
                            </li>
                          ))}
                          {testChanges.toInsert.length > 0 && (
                            <li className="flex items-center gap-2">
                              <span className="font-mono bg-background px-1 rounded">tests</span>
                              <span>→</span>
                              <span>{testChanges.toInsert.length} new test(s) to add</span>
                            </li>
                          )}
                          {testChanges.toUpdate.length > 0 && (
                            <li className="flex items-center gap-2">
                              <span className="font-mono bg-background px-1 rounded">tests</span>
                              <span>→</span>
                              <span>{testChanges.toUpdate.length} test(s) to update</span>
                            </li>
                          )}
                          {testChanges.toDelete.length > 0 && (
                            <li className="flex items-center gap-2">
                              <span className="font-mono bg-background px-1 rounded">tests</span>
                              <span>→</span>
                              <span className="text-destructive">{testChanges.toDelete.length} test(s) to delete</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {totalChanges === 0 && (
                      <div className="rounded-lg border bg-muted/30 p-4 text-center">
                        <CheckCircle2 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No changes made yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            {totalChanges > 0 && (
              <span className="text-amber-600 font-medium">
                {totalChanges} unsaved change{totalChanges !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || totalChanges === 0}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
