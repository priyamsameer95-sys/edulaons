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
import { 
  Loader2, 
  User, 
  GraduationCap, 
  Users, 
  Building2, 
  AlertCircle, 
  CheckCircle2,
  Save 
} from "lucide-react";
import { PaginatedLead } from "@/hooks/usePaginatedLeads";

interface AdminLeadEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: PaginatedLead | null;
  onSuccess?: () => void;
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
  
  // Admin notes
  admin_notes: string;
}

const STUDY_DESTINATIONS = ['Australia', 'Canada', 'Germany', 'Ireland', 'New Zealand', 'UK', 'USA', 'Other'];
const LOAN_TYPES = ['secured', 'unsecured'];
const RELATIONSHIPS = ['parent', 'spouse', 'sibling', 'guardian', 'other'];
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: new Date(0, i).toLocaleString('default', { month: 'long' }) }));

export function AdminLeadEditModal({
  open,
  onOpenChange,
  lead,
  onSuccess,
}: AdminLeadEditModalProps) {
  const [formData, setFormData] = useState<FormData>({
    student_name: '',
    student_email: '',
    student_phone: '',
    student_postal_code: '',
    student_city: '',
    student_state: '',
    student_date_of_birth: '',
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
    admin_notes: '',
  });
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [completeness, setCompleteness] = useState<LeadCompletenessResult | null>(null);
  const [activeTab, setActiveTab] = useState('student');
  
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
      // Fetch student details
      const { data: studentData } = await supabase
        .from('students')
        .select('*')
        .eq('id', lead.student_id)
        .single();

      // Fetch co-applicant details
      const { data: coApplicantData } = await supabase
        .from('co_applicants')
        .select('*')
        .eq('id', lead.co_applicant_id)
        .single();

      const newFormData: FormData = {
        student_name: studentData?.name || '',
        student_email: studentData?.email || '',
        student_phone: studentData?.phone || '',
        student_postal_code: studentData?.postal_code || '',
        student_city: studentData?.city || '',
        student_state: studentData?.state || '',
        student_date_of_birth: studentData?.date_of_birth || '',
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
        admin_notes: '',
      };

      setFormData(newFormData);
      setOriginalData(newFormData);

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

  const handleSubmit = async () => {
    if (!lead) return;
    
    const changes = getChangedFields();
    if (changes.length === 0) {
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
        studentChanges.forEach(c => { studentUpdate[c.field] = c.newValue || null; });
        
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
          if (c.field === 'salary' && value) {
            value = parseInt(value, 10);
          }
          coAppUpdate[c.field] = value;
        });
        
        const { error } = await supabase
          .from('co_applicants')
          .update(coAppUpdate)
          .eq('id', lead.co_applicant_id);
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
      
      await logFieldChanges(auditEntries);

      // Log activity
      await supabase.from('application_activities').insert({
        lead_id: lead.id,
        activity_type: 'admin_edit',
        description: `Admin edited ${changes.length} field(s)`,
        metadata: {
          fields_changed: changes.map(c => c.field),
          notes: formData.admin_notes,
        },
      });

      toast({
        title: 'Lead updated',
        description: `Successfully updated ${changes.length} field(s)`,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
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
              <TabsList className="grid w-full grid-cols-4 mb-4">
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
                      Student Information
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
                      <Input
                        id="student_state"
                        value={formData.student_state}
                        onChange={(e) => handleInputChange('student_state', e.target.value)}
                        placeholder="Enter state"
                      />
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
                  </CardContent>
                </Card>
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
                      Co-Applicant Information
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
                      <Label htmlFor="co_applicant_occupation">Occupation</Label>
                      <Input
                        id="co_applicant_occupation"
                        value={formData.co_applicant_occupation}
                        onChange={(e) => handleInputChange('co_applicant_occupation', e.target.value)}
                        placeholder="Enter occupation"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="co_applicant_employer">Employer</Label>
                      <Input
                        id="co_applicant_employer"
                        value={formData.co_applicant_employer}
                        onChange={(e) => handleInputChange('co_applicant_employer', e.target.value)}
                        placeholder="Enter employer name"
                      />
                    </div>
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
                    {changedFieldsCount > 0 && (
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          Pending Changes ({changedFieldsCount})
                        </h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {getChangedFields().map((change, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="font-mono bg-background px-1 rounded">{change.field}</span>
                              <span>→</span>
                              <span className="truncate max-w-[200px]">{change.newValue || '(empty)'}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {changedFieldsCount === 0 && (
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
            {changedFieldsCount > 0 && (
              <span className="text-amber-600 font-medium">
                {changedFieldsCount} unsaved change{changedFieldsCount !== 1 ? 's' : ''}
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
              disabled={loading || changedFieldsCount === 0}
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
