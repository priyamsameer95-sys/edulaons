import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Pencil, X, Check, User, Phone, Mail, MapPin, GraduationCap, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isPlaceholderEmail, formatDisplayEmail, validateEmail } from '@/utils/formatters';

interface Student {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  nationality?: string | null;
  street_address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  tenth_percentage?: number | null;
  twelfth_percentage?: number | null;
  bachelors_percentage?: number | null;
  bachelors_cgpa?: number | null;
  highest_qualification?: string | null;
  credit_score?: number | null;
}

interface AcademicTest {
  id: string;
  test_type: string;
  score: string;
  test_date?: string | null;
}

interface EnhancedStudentCardProps {
  student: Student;
  academicTests?: AcademicTest[];
  leadId: string;
  onUpdate?: () => void;
  isAdmin?: boolean;
}

export function EnhancedStudentCard({ 
  student, 
  academicTests = [], 
  leadId,
  onUpdate,
  isAdmin = false 
}: EnhancedStudentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Student>>({});
  const [emailError, setEmailError] = useState<string | null>(null);
  const { logFieldChanges } = useAuditLog();

  const handleEdit = () => {
    const initialData = { ...student };
    
    // If email is a placeholder, clear it for editing
    if (isPlaceholderEmail(student.email)) {
      initialData.email = '';
    }
    
    setEditData(initialData);
    setIsEditing(true);
    setEmailError(null);
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
    setEmailError(null);
  };

  const handleSave = async () => {
    // Validate email before saving
    const error = validateEmail(editData.email);
    if (error) {
      setEmailError(error);
      toast.error(error);
      return;
    }

    setIsSaving(true);
    try {
      // Track which fields changed - compare with original student data
      const changedFields: { field: string; oldValue: string | null; newValue: string | null }[] = [];
      
      Object.keys(editData).forEach(key => {
        const oldVal = student[key as keyof Student];
        const newVal = editData[key as keyof Student];
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
        .from('students')
        .update({
          name: editData.name,
          phone: editData.phone,
          email: editData.email || student.email, // Keep original if empty
          date_of_birth: editData.date_of_birth,
          gender: editData.gender,
          nationality: editData.nationality,
          street_address: editData.street_address,
          city: editData.city,
          state: editData.state,
          postal_code: editData.postal_code,
          tenth_percentage: editData.tenth_percentage,
          twelfth_percentage: editData.twelfth_percentage,
          bachelors_percentage: editData.bachelors_percentage,
          bachelors_cgpa: editData.bachelors_cgpa,
          highest_qualification: editData.highest_qualification,
          credit_score: editData.credit_score,
        })
        .eq('id', student.id);

      if (error) throw error;

      // Log field changes
      await logFieldChanges(
        changedFields.map(cf => ({
          leadId,
          tableName: 'students',
          fieldName: cf.field,
          oldValue: cf.oldValue,
          newValue: cf.newValue,
          changeSource: 'user_edit' as const,
          changeReason: 'Admin inline edit',
        }))
      );

      toast.success('Student details updated');
      setIsEditing(false);
      setEmailError(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error('Failed to update student details');
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

  const renderEmailField = () => {
    if (isEditing && isAdmin) {
      return (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Email</Label>
          <Input
            type="email"
            value={editData.email || ''}
            onChange={(e) => {
              setEditData(prev => ({ ...prev, email: e.target.value }));
              setEmailError(null);
            }}
            placeholder="Enter real email address"
            className={`h-8 text-sm ${emailError ? 'border-destructive' : ''}`}
          />
          {emailError && (
            <p className="text-xs text-destructive">{emailError}</p>
          )}
        </div>
      );
    }
    
    // Display mode - format placeholder emails nicely
    const { display, isPlaceholder } = formatDisplayEmail(student.email);
    return (
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">Email</p>
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium ${isPlaceholder ? 'text-muted-foreground italic' : ''}`}>
            {display}
          </p>
{isPlaceholder && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-amber-100 text-amber-700 border-amber-200">
                      Email needed
                    </Badge>
                  )}
        </div>
      </div>
    );
  };

  const renderField = (label: string, value: string | number | null | undefined, field?: keyof Student, type: 'text' | 'number' | 'date' | 'select' = 'text', options?: string[]) => {
    if (isEditing && field && isAdmin) {
      if (type === 'select' && options) {
        return (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <Select
              value={String(editData[field] ?? '')}
              onValueChange={(val) => setEditData(prev => ({ ...prev, [field]: val }))}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={`Select ${label}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map(opt => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }
      return (
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">{label}</Label>
          <Input
            type={type}
            value={editData[field] ?? ''}
            onChange={(e) => setEditData(prev => ({ 
              ...prev, 
              [field]: type === 'number' ? (e.target.value ? Number(e.target.value) : null) : e.target.value 
            }))}
            className="h-8 text-sm"
          />
        </div>
      );
    }
    
    return (
      <div className="space-y-0.5">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value ?? '—'}</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Student Information
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
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-3">
          {renderField('Full Name', student.name, 'name')}
          {renderField('Phone', student.phone, 'phone')}
          {renderEmailField()}
          {renderField('Date of Birth', student.date_of_birth ? format(new Date(student.date_of_birth), 'dd MMM yyyy') : null, 'date_of_birth', 'date')}
          {renderField('Gender', student.gender, 'gender', 'select', ['Male', 'Female', 'Other'])}
          {renderField('Nationality', student.nationality, 'nationality')}
        </div>

        {/* Address */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-1.5 mb-2">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Address</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {renderField('Street', student.street_address, 'street_address')}
            {renderField('City', student.city, 'city')}
            {renderField('State', student.state, 'state')}
            {renderField('PIN Code', student.postal_code, 'postal_code')}
          </div>
        </div>

        {/* Academics */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-1.5 mb-2">
            <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Academics</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {renderField('10th %', student.tenth_percentage ? `${student.tenth_percentage}%` : null, 'tenth_percentage', 'number')}
            {renderField('12th %', student.twelfth_percentage ? `${student.twelfth_percentage}%` : null, 'twelfth_percentage', 'number')}
            {renderField("Bachelor's %", student.bachelors_percentage ? `${student.bachelors_percentage}%` : null, 'bachelors_percentage', 'number')}
            {renderField('CGPA', student.bachelors_cgpa, 'bachelors_cgpa', 'number')}
            {renderField('Highest Qualification', student.highest_qualification, 'highest_qualification')}
          </div>
        </div>

        {/* Credit Score */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-1.5 mb-2">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Credit</span>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && isAdmin ? (
              <Input
                type="number"
                value={editData.credit_score ?? ''}
                onChange={(e) => setEditData(prev => ({ 
                  ...prev, 
                  credit_score: e.target.value ? Number(e.target.value) : null 
                }))}
                className="h-8 text-sm w-32"
                placeholder="Credit Score"
              />
            ) : (
              <Badge className={getCreditScoreColor(student.credit_score)}>
                {student.credit_score ?? 'Not Available'}
              </Badge>
            )}
          </div>
        </div>

        {/* Test Scores */}
        {academicTests.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">Test Scores</p>
            <div className="flex flex-wrap gap-2">
              {academicTests.map(test => (
                <Badge key={test.id} variant="secondary" className="text-xs">
                  {test.test_type}: {test.score}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}