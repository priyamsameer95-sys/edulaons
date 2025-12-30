import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pencil, X, Check, GraduationCap, CreditCard, Building2, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';
import { UniversityCombobox } from '@/components/ui/university-combobox';
import { formatDisplayText } from '@/utils/formatters';

interface LeadUniversity {
  id: string;
  name: string;
  city?: string;
  country?: string;
  qs_rank?: number;
}

interface LeadCourse {
  id: string;
  course_id: string;
  is_custom_course?: boolean;
  custom_course_name?: string | null;
  course?: {
    id: string;
    program_name: string;
    degree: string;
    stream_name: string;
    study_level: string;
    tuition_fees?: string;
  };
}

interface EnhancedStudyCardProps {
  lead: {
    id: string;
    loan_amount: number;
    loan_type: string;
    loan_classification?: string | null;
    study_destination: string;
    intake_month?: number | null;
    intake_year?: number | null;
    lender?: { id: string; name: string } | null;
    sanction_amount?: number | null;
    sanction_date?: string | null;
  };
  universities: LeadUniversity[];
  courses?: LeadCourse[];
  isAdmin?: boolean;
  onUpdate?: () => void;
  onChangeLender?: () => void;
}

const STUDY_DESTINATIONS = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'Ireland', 'New Zealand', 'Singapore', 'France', 'Netherlands'];
const LOAN_TYPES = ['secured', 'unsecured'];
const LOAN_CLASSIFICATIONS = ['unsecured_nbfc', 'secured_property', 'psu_bank', 'undecided', 'secured_fd', 'unsecured'];
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear + i);

export function EnhancedStudyCard({
  lead,
  universities,
  courses = [],
  isAdmin = false,
  onUpdate,
  onChangeLender,
}: EnhancedStudyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { logFieldChanges } = useAuditLog();

  // Edit state for lead fields
  const [editData, setEditData] = useState({
    loan_amount: lead.loan_amount,
    loan_type: lead.loan_type,
    loan_classification: lead.loan_classification || '',
    study_destination: lead.study_destination,
    intake_month: lead.intake_month || null,
    intake_year: lead.intake_year || null,
  });

  // Edit state for universities
  const [editUniversities, setEditUniversities] = useState<string[]>(
    universities.length > 0 ? universities.map(u => u.id) : ['']
  );

  const handleEdit = () => {
    setEditData({
      loan_amount: lead.loan_amount,
      loan_type: lead.loan_type,
      loan_classification: lead.loan_classification || '',
      study_destination: lead.study_destination,
      intake_month: lead.intake_month || null,
      intake_year: lead.intake_year || null,
    });
    setEditUniversities(universities.length > 0 ? universities.map(u => u.id) : ['']);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const changedFields: { field: string; oldValue: string | null; newValue: string | null }[] = [];

      // Track lead field changes
      if (editData.loan_amount !== lead.loan_amount) {
        changedFields.push({
          field: 'loan_amount',
          oldValue: String(lead.loan_amount),
          newValue: String(editData.loan_amount),
        });
      }
      if (editData.loan_type !== lead.loan_type) {
        changedFields.push({
          field: 'loan_type',
          oldValue: lead.loan_type,
          newValue: editData.loan_type,
        });
      }
      if (editData.loan_classification !== (lead.loan_classification || '')) {
        changedFields.push({
          field: 'loan_classification',
          oldValue: lead.loan_classification || null,
          newValue: editData.loan_classification || null,
        });
      }
      if (editData.study_destination !== lead.study_destination) {
        changedFields.push({
          field: 'study_destination',
          oldValue: lead.study_destination,
          newValue: editData.study_destination,
        });
      }
      if (editData.intake_month !== lead.intake_month) {
        changedFields.push({
          field: 'intake_month',
          oldValue: lead.intake_month ? String(lead.intake_month) : null,
          newValue: editData.intake_month ? String(editData.intake_month) : null,
        });
      }
      if (editData.intake_year !== lead.intake_year) {
        changedFields.push({
          field: 'intake_year',
          oldValue: lead.intake_year ? String(lead.intake_year) : null,
          newValue: editData.intake_year ? String(editData.intake_year) : null,
        });
      }

      // Check if universities changed
      const oldUniIds = universities.map(u => u.id).sort().join(',');
      const newUniIds = editUniversities.filter(u => u).sort().join(',');
      const universitiesChanged = oldUniIds !== newUniIds;

      if (universitiesChanged) {
        changedFields.push({
          field: 'universities',
          oldValue: JSON.stringify(universities.map(u => ({ id: u.id, name: u.name }))),
          newValue: JSON.stringify(editUniversities.filter(u => u)),
        });
      }

      // Update lead fields
      if (changedFields.some(f => ['loan_amount', 'loan_type', 'loan_classification', 'study_destination', 'intake_month', 'intake_year'].includes(f.field))) {
        const { error: leadError } = await supabase
          .from('leads_new')
          .update({
            loan_amount: editData.loan_amount,
            loan_type: editData.loan_type as 'secured' | 'unsecured',
            loan_classification: editData.loan_classification as 'unsecured_nbfc' | 'secured_property' | 'psu_bank' | 'undecided' | 'secured_fd' | 'unsecured' | null || null,
            study_destination: editData.study_destination as any,
            intake_month: editData.intake_month,
            intake_year: editData.intake_year,
          })
          .eq('id', lead.id);

        if (leadError) throw leadError;
      }

      // Update universities if changed
      if (universitiesChanged) {
        // Delete existing university mappings
        await supabase
          .from('lead_universities')
          .delete()
          .eq('lead_id', lead.id);

        // Insert new university mappings
        const validUniversities = editUniversities.filter(u => u);
        if (validUniversities.length > 0) {
          const { error: uniError } = await supabase
            .from('lead_universities')
            .insert(
              validUniversities.map(universityId => ({
                lead_id: lead.id,
                university_id: universityId,
              }))
            );
          if (uniError) throw uniError;
        }
      }

      // Log field changes
      if (changedFields.length > 0) {
        await logFieldChanges(
          changedFields.map(cf => ({
            leadId: lead.id,
            tableName: cf.field === 'universities' ? 'lead_universities' : 'leads_new',
            fieldName: cf.field,
            oldValue: cf.oldValue,
            newValue: cf.newValue,
            changeSource: 'user_edit' as const,
            changeReason: 'Admin inline edit',
          }))
        );
      }

      toast.success('Study & Loan details updated');
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating study details:', error);
      toast.error('Failed to update details');
    } finally {
      setIsSaving(false);
    }
  };

  const addUniversity = () => {
    if (editUniversities.length < 5) {
      setEditUniversities([...editUniversities, '']);
    }
  };

  const removeUniversity = (index: number) => {
    if (editUniversities.length > 1) {
      setEditUniversities(editUniversities.filter((_, i) => i !== index));
    }
  };

  const updateUniversity = (index: number, value: string) => {
    const newUniversities = [...editUniversities];
    newUniversities[index] = value;
    setEditUniversities(newUniversities);
  };

  const getSelectedUniversities = (excludeIndex: number) => {
    return editUniversities.filter((u, i) => i !== excludeIndex && u);
  };

  const formatLoanAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getMonthName = (month: number | null) => {
    if (!month) return '';
    return MONTHS.find(m => m.value === month)?.label || '';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Study & Loan Details
          </CardTitle>
          {isAdmin && (
            <div className="flex gap-1">
              {isEditing ? (
                <>
                  <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSaving}>
                    <X className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleSave} disabled={isSaving}>
                    <Check className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Study Destination & Intake */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Study Destination</Label>
            {isEditing ? (
              <Select
                value={editData.study_destination}
                onValueChange={(val) => setEditData(prev => ({ ...prev, study_destination: val }))}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STUDY_DESTINATIONS.map(dest => (
                    <SelectItem key={dest} value={dest}>{dest}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium">{lead.study_destination}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Intake</Label>
            {isEditing ? (
              <div className="flex gap-2">
                <Select
                  value={editData.intake_month?.toString() || ''}
                  onValueChange={(val) => setEditData(prev => ({ ...prev, intake_month: parseInt(val) }))}
                >
                  <SelectTrigger className="h-8 text-sm flex-1">
                    <SelectValue placeholder="Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map(m => (
                      <SelectItem key={m.value} value={m.value.toString()}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={editData.intake_year?.toString() || ''}
                  onValueChange={(val) => setEditData(prev => ({ ...prev, intake_year: parseInt(val) }))}
                >
                  <SelectTrigger className="h-8 text-sm w-24">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <p className="text-sm font-medium">
                {getMonthName(lead.intake_month)} {lead.intake_year}
              </p>
            )}
          </div>
        </div>

        {/* Universities */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-1.5 mb-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Universities</span>
            {isEditing && (
              <span className="text-xs text-muted-foreground ml-auto">
                {editUniversities.filter(u => u).length}/5
              </span>
            )}
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              {editUniversities.map((uniId, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">#{index + 1}</span>
                  <div className="flex-1">
                    <UniversityCombobox
                      country={editData.study_destination}
                      value={uniId}
                      onChange={(value) => updateUniversity(index, value)}
                      placeholder={index === 0 ? "Primary university" : "Additional university"}
                      excludeUniversities={getSelectedUniversities(index)}
                    />
                  </div>
                  {editUniversities.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUniversity(index)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {editUniversities.length < 5 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addUniversity}
                  className="w-full text-xs"
                >
                  + Add University
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              {universities.length > 0 ? (
                universities.map((uni, index) => (
                  <div key={uni.id} className="flex items-start gap-2 text-sm">
                    <span className="text-xs text-muted-foreground w-5">#{index + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium leading-tight">{uni.name}</p>
                      {(uni.city || uni.country) && (
                        <p className="text-xs text-muted-foreground">
                          {[uni.city, uni.country].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No universities selected</p>
              )}
            </div>
          )}
        </div>

        {/* Courses */}
        {courses.length > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center gap-1.5 mb-2">
              <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Course</span>
            </div>
            <div className="space-y-1.5">
              {courses.map((courseEntry) => (
                <div key={courseEntry.id} className="text-sm">
                  {courseEntry.is_custom_course ? (
                    <p className="font-medium">{courseEntry.custom_course_name}</p>
                  ) : courseEntry.course ? (
                    <>
                      <p className="font-medium">{courseEntry.course.program_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {courseEntry.course.degree} • {courseEntry.course.stream_name} • {courseEntry.course.study_level}
                      </p>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loan Details */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-1.5 mb-2">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Loan Details</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Loan Amount</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editData.loan_amount}
                  onChange={(e) => setEditData(prev => ({ ...prev, loan_amount: Number(e.target.value) }))}
                  className="h-8 text-sm"
                />
              ) : (
                <p className="text-sm font-medium">{formatLoanAmount(lead.loan_amount)}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Loan Type</Label>
              {isEditing ? (
                <Select
                  value={editData.loan_type}
                  onValueChange={(val) => setEditData(prev => ({ ...prev, loan_type: val }))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_TYPES.map(type => (
                      <SelectItem key={type} value={type} className="capitalize">{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="secondary" className="capitalize">{lead.loan_type}</Badge>
              )}
            </div>
          </div>

          {(isEditing || lead.loan_classification) && (
            <div className="mt-2">
              <Label className="text-xs text-muted-foreground">Classification</Label>
              {isEditing ? (
                <Select
                  value={editData.loan_classification}
                  onValueChange={(val) => setEditData(prev => ({ ...prev, loan_classification: val }))}
                >
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOAN_CLASSIFICATIONS.map(c => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {formatDisplayText(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : lead.loan_classification ? (
                <Badge variant="outline" className="mt-1 capitalize">
                  {formatDisplayText(lead.loan_classification)}
                </Badge>
              ) : null}
            </div>
          )}

          {/* Lender Info */}
          <div className="mt-3 pt-2 border-t flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Lender: {lead.lender?.name || 'Not assigned'}</span>
            {isAdmin && onChangeLender && (
              <button
                onClick={onChangeLender}
                className="text-primary hover:underline text-xs"
              >
                Change
              </button>
            )}
          </div>

          {/* Sanction Details */}
          {lead.sanction_amount && (
            <div className="mt-2 text-xs text-muted-foreground">
              <p>Sanctioned: <span className="text-foreground font-medium">{formatLoanAmount(lead.sanction_amount)}</span></p>
              {lead.sanction_date && (
                <p>Date: {new Date(lead.sanction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
