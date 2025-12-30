import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pencil, X, Check, Users, Briefcase, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CoApplicant {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  relationship: string;
  salary: number;
  pin_code: string;
  occupation?: string | null;
  employer?: string | null;
  employment_type?: string | null;
  employment_duration_years?: number | null;
  monthly_salary?: number | null;
  credit_score?: number | null;
}

interface EnhancedCoApplicantCardProps {
  coApplicant: CoApplicant;
  leadId: string;
  onUpdate?: () => void;
  isAdmin?: boolean;
}

const RELATIONSHIP_OPTIONS = ['parent', 'spouse', 'sibling', 'guardian', 'other'];
const EMPLOYMENT_TYPES = ['Salaried', 'Self-Employed', 'Business', 'Retired', 'Other'];

export function EnhancedCoApplicantCard({ 
  coApplicant, 
  leadId,
  onUpdate,
  isAdmin = false 
}: EnhancedCoApplicantCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<CoApplicant>>({});
  const { logFieldChanges } = useAuditLog();

  const handleEdit = () => {
    setEditData({ ...coApplicant });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const changedFields: { field: string; oldValue: string | null; newValue: string | null }[] = [];
      
      Object.keys(editData).forEach(key => {
        const oldVal = coApplicant[key as keyof CoApplicant];
        const newVal = editData[key as keyof CoApplicant];
        if (String(oldVal ?? '') !== String(newVal ?? '')) {
          changedFields.push({
            field: key,
            oldValue: oldVal != null ? String(oldVal) : null,
            newValue: newVal != null ? String(newVal) : null,
          });
        }
      });

      if (changedFields.length === 0) {
        setIsEditing(false);
        return;
      }

      const { error } = await supabase
        .from('co_applicants')
        .update({
          name: editData.name,
          phone: editData.phone,
          email: editData.email,
          relationship: editData.relationship as 'parent' | 'spouse' | 'sibling' | 'guardian' | 'other',
          salary: editData.salary,
          pin_code: editData.pin_code,
          occupation: editData.occupation,
          employer: editData.employer,
          employment_type: editData.employment_type,
          employment_duration_years: editData.employment_duration_years,
          monthly_salary: editData.monthly_salary,
          credit_score: editData.credit_score,
        })
        .eq('id', coApplicant.id);

      if (error) throw error;

      await logFieldChanges(
        changedFields.map(cf => ({
          leadId,
          tableName: 'co_applicants',
          fieldName: cf.field,
          oldValue: cf.oldValue,
          newValue: cf.newValue,
          changeSource: 'user_edit' as const,
          changeReason: 'Admin inline edit',
        }))
      );

      toast.success('Co-applicant details updated');
      setIsEditing(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating co-applicant:', error);
      toast.error('Failed to update co-applicant details');
    } finally {
      setIsSaving(false);
    }
  };

  const getCreditScoreColor = (score: number | null | undefined) => {
    if (!score) return 'bg-muted text-muted-foreground';
    if (score >= 750) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (score >= 650) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const formatSalary = (val: number | null | undefined) => {
    if (!val) return '—';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Co-Applicant
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
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Full Name</p>
            {isEditing ? (
              <Input value={editData.name ?? ''} onChange={e => setEditData(p => ({ ...p, name: e.target.value }))} className="h-8 text-sm" />
            ) : (
              <p className="text-sm font-medium">{coApplicant.name}</p>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Relationship</p>
            {isEditing ? (
              <Select value={editData.relationship ?? ''} onValueChange={val => setEditData(p => ({ ...p, relationship: val }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm font-medium capitalize">{coApplicant.relationship}</p>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Phone</p>
            {isEditing ? (
              <Input value={editData.phone ?? ''} onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))} className="h-8 text-sm" />
            ) : (
              <p className="text-sm font-medium">{coApplicant.phone ?? '—'}</p>
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">PIN Code</p>
            {isEditing ? (
              <Input value={editData.pin_code ?? ''} onChange={e => setEditData(p => ({ ...p, pin_code: e.target.value }))} className="h-8 text-sm" />
            ) : (
              <p className="text-sm font-medium">{coApplicant.pin_code}</p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-1.5 mb-2">
            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Employment</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Occupation</p>
              {isEditing ? (
                <Input value={editData.occupation ?? ''} onChange={e => setEditData(p => ({ ...p, occupation: e.target.value }))} className="h-8 text-sm" />
              ) : (
                <p className="text-sm font-medium">{coApplicant.occupation ?? '—'}</p>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Employer</p>
              {isEditing ? (
                <Input value={editData.employer ?? ''} onChange={e => setEditData(p => ({ ...p, employer: e.target.value }))} className="h-8 text-sm" />
              ) : (
                <p className="text-sm font-medium">{coApplicant.employer ?? '—'}</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center gap-1.5 mb-2">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Financial</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Annual Salary</p>
              {isEditing ? (
                <Input type="number" value={editData.salary ?? ''} onChange={e => setEditData(p => ({ ...p, salary: Number(e.target.value) }))} className="h-8 text-sm" />
              ) : (
                <p className="text-sm font-medium">{formatSalary(coApplicant.salary)}</p>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Credit Score</p>
              {isEditing ? (
                <Input type="number" value={editData.credit_score ?? ''} onChange={e => setEditData(p => ({ ...p, credit_score: e.target.value ? Number(e.target.value) : null }))} className="h-8 text-sm" />
              ) : (
                <Badge className={getCreditScoreColor(coApplicant.credit_score)}>
                  {coApplicant.credit_score ?? 'N/A'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
