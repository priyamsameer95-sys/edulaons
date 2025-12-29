/**
 * Student Document Checklist - Enhanced with Category Grouping
 * 
 * Shows document requirements grouped by category.
 * Includes tooltips explaining why each document is needed.
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Loader2,
  User,
  Users,
  GraduationCap,
  Briefcase,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import DocumentCategoryGroup from './DocumentCategoryGroup';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  description: string | null;
  required: boolean;
}

interface UploadedDoc {
  id: string;
  document_type_id: string;
  verification_status: string;
  original_filename: string;
}

interface StudentDocumentChecklistProps {
  leadId: string;
  compact?: boolean;
  onStatsUpdate?: (stats: { pending: number; uploaded: number; total: number; rejected: number }) => void;
}

// Map category names to labels and icons
const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; order: number }> = {
  'KYC': { label: 'Student Documents', icon: User, order: 1 },
  'Academic': { label: 'Academic Documents', icon: GraduationCap, order: 2 },
  'Financial': { label: 'Financial Documents', icon: Briefcase, order: 3 },
  'Co-Applicant': { label: 'Co-Applicant Documents', icon: Users, order: 4 },
  'Collateral': { label: 'Collateral Documents', icon: Building2, order: 5 },
  'Other': { label: 'Other Documents', icon: FileText, order: 6 },
};

const StudentDocumentChecklist = ({ 
  leadId, 
  compact = false,
  onStatsUpdate 
}: StudentDocumentChecklistProps) => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchDocumentData();
  }, [leadId]);

  const fetchDocumentData = async () => {
    try {
      const [typesRes, docsRes] = await Promise.all([
        supabase
          .from('document_types')
          .select('id, name, category, description, required')
          .order('display_order', { ascending: true }),
        supabase
          .from('lead_documents')
          .select('id, document_type_id, verification_status, original_filename')
          .eq('lead_id', leadId)
      ]);

      setDocumentTypes(typesRes.data || []);
      setUploadedDocs(docsRes.data || []);
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDocumentStatus = (typeId: string): 'required' | 'pending' | 'verified' | 'rejected' => {
    const doc = uploadedDocs.find(d => d.document_type_id === typeId);
    if (!doc) return 'required';
    if (doc.verification_status === 'verified') return 'verified';
    if (doc.verification_status === 'rejected') return 'rejected';
    return 'pending';
  };

  const handleFileUpload = async (typeId: string, file: File) => {
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setUploading(typeId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${leadId}/${typeId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: newDoc, error: dbError } = await supabase
        .from('lead_documents')
        .insert({
          lead_id: leadId,
          document_type_id: typeId,
          file_path: fileName,
          stored_filename: fileName,
          original_filename: file.name,
          file_size: file.size,
          mime_type: file.type,
          verification_status: 'pending',
          uploaded_by: 'student'
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setUploadedDocs(prev => [...prev, newDoc]);
      toast.success('Document uploaded successfully');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  // Calculate stats
  const requiredDocs = documentTypes.filter(d => d.required);
  const uploadedCount = requiredDocs.filter(d => {
    const status = getDocumentStatus(d.id);
    return status === 'pending' || status === 'verified';
  }).length;
  const verifiedCount = requiredDocs.filter(d => getDocumentStatus(d.id) === 'verified').length;
  const pendingCount = requiredDocs.filter(d => getDocumentStatus(d.id) === 'required').length;
  const rejectedCount = requiredDocs.filter(d => getDocumentStatus(d.id) === 'rejected').length;
  const progress = requiredDocs.length > 0 ? (verifiedCount / requiredDocs.length) * 100 : 0;

  // Notify parent of stats
  useEffect(() => {
    if (!loading && onStatsUpdate) {
      onStatsUpdate({
        pending: pendingCount,
        uploaded: uploadedCount,
        total: requiredDocs.length,
        rejected: rejectedCount,
      });
    }
  }, [loading, pendingCount, uploadedCount, requiredDocs.length, rejectedCount, onStatsUpdate]);

  // Group documents by category
  const groupedDocuments = requiredDocs.reduce((acc, doc) => {
    const category = doc.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    const uploadedDoc = uploadedDocs.find(u => u.document_type_id === doc.id);
    acc[category].push({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      status: getDocumentStatus(doc.id),
      uploadedFilename: uploadedDoc?.original_filename,
    });
    return acc;
  }, {} as Record<string, Array<{
    id: string;
    name: string;
    description: string | null;
    status: 'required' | 'pending' | 'verified' | 'rejected';
    uploadedFilename?: string;
  }>>);

  // Sort categories by order
  const sortedCategories = Object.keys(groupedDocuments).sort((a, b) => {
    const orderA = CATEGORY_CONFIG[a]?.order ?? 99;
    const orderB = CATEGORY_CONFIG[b]?.order ?? 99;
    return orderA - orderB;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    // Compact view - just show summary
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Documents
            </CardTitle>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {pendingCount} pending
                </span>
              )}
              {rejectedCount > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {rejectedCount} need reupload
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Progress</span>
            <span className="text-xs font-medium text-foreground">{verifiedCount}/{requiredDocs.length}</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Required Documents
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {pendingCount + rejectedCount > 0 ? (
              <span className="font-medium text-foreground">{pendingCount + rejectedCount} pending</span>
            ) : (
              <span className="text-emerald-600 font-medium">All uploaded</span>
            )}
            {' '}of {requiredDocs.length}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Progress Overview */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Verification Progress</span>
            <span className="text-xs font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Category Groups */}
        {sortedCategories.map((category) => {
          const config = CATEGORY_CONFIG[category] || { label: category, icon: FileText, order: 99 };
          const docs = groupedDocuments[category];
          
          // Determine if this category should be expanded (has pending items)
          const hasPending = docs.some(d => d.status === 'required' || d.status === 'rejected');
          
          return (
            <DocumentCategoryGroup
              key={category}
              category={category}
              categoryLabel={config.label}
              categoryIcon={config.icon}
              documents={docs}
              onUpload={handleFileUpload}
              uploadingId={uploading}
              defaultExpanded={hasPending}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};

export default StudentDocumentChecklist;
