/**
 * Post-Submit Document Upload Component
 * 
 * Shows after lender selection - allows students to upload required documents
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  required: boolean;
  description?: string;
}

interface UploadedDoc {
  id: string;
  document_type_id: string;
  verification_status: string;
  original_filename: string;
}

interface PostSubmitDocumentUploadProps {
  leadId: string;
  caseId: string;
  onComplete: () => void;
  onSkip: () => void;
}

const PostSubmitDocumentUpload = ({ 
  leadId, 
  caseId, 
  onComplete, 
  onSkip 
}: PostSubmitDocumentUploadProps) => {
  const navigate = useNavigate();
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchDocumentData();
  }, [leadId]);

  const fetchDocumentData = async () => {
    try {
      // Fetch document types
      const { data: types } = await supabase
        .from('document_types')
        .select('id, name, category, required, description')
        .order('display_order', { ascending: true });

      // Fetch already uploaded documents for this lead
      const { data: docs } = await supabase
        .from('lead_documents')
        .select('id, document_type_id, verification_status, original_filename')
        .eq('lead_id', leadId);

      setDocumentTypes(types || []);
      setUploadedDocs(docs || []);
    } catch (err) {
      console.error('Error fetching document data:', err);
      toast.error('Failed to load document requirements');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentStatus = (typeId: string) => {
    const doc = uploadedDocs.find(d => d.document_type_id === typeId);
    if (!doc) return 'pending';
    return doc.verification_status;
  };

  const getUploadedDoc = (typeId: string) => {
    return uploadedDocs.find(d => d.document_type_id === typeId);
  };

  const handleFileUpload = async (typeId: string, file: File) => {
    if (!file) return;

    // Validate file
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only PDF, JPG, and PNG files are allowed');
      return;
    }

    setUploading(typeId);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${leadId}/${typeId}/${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
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
      console.error('Upload error:', err);
      toast.error(err.message || 'Failed to upload document');
    } finally {
      setUploading(null);
    }
  };

  const requiredDocs = documentTypes.filter(d => d.required);
  const uploadedRequiredCount = requiredDocs.filter(d => getDocumentStatus(d.id) !== 'pending').length;
  const progress = requiredDocs.length > 0 ? (uploadedRequiredCount / requiredDocs.length) * 100 : 0;

  const groupedDocs = documentTypes.reduce((acc, doc) => {
    const category = doc.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, DocumentType[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload Documents</h2>
        <p className="text-muted-foreground">
          Upload your documents now or come back later from your dashboard
        </p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Document Progress</span>
            <span className="text-sm text-muted-foreground">
              {uploadedRequiredCount} of {requiredDocs.length} required
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      {/* Document Categories */}
      {Object.entries(groupedDocs).map(([category, docs]) => (
        <Card key={category}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {docs.map(docType => {
              const status = getDocumentStatus(docType.id);
              const uploaded = getUploadedDoc(docType.id);
              const isUploading = uploading === docType.id;

              return (
                <div 
                  key={docType.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    status === 'verified' 
                      ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800"
                      : status === 'rejected'
                      ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                      : uploaded
                      ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                      : "bg-muted/30 border-border"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    status === 'verified' ? "bg-emerald-100 dark:bg-emerald-900/30" :
                    status === 'rejected' ? "bg-red-100 dark:bg-red-900/30" :
                    uploaded ? "bg-amber-100 dark:bg-amber-900/30" :
                    "bg-muted"
                  )}>
                    {status === 'verified' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : status === 'rejected' ? (
                      <X className="w-5 h-5 text-red-600" />
                    ) : uploaded ? (
                      <Clock className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-foreground">{docType.name}</span>
                      {docType.required && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Required</span>
                      )}
                    </div>
                    {uploaded ? (
                      <p className="text-xs text-muted-foreground truncate">{uploaded.original_filename}</p>
                    ) : docType.description ? (
                      <p className="text-xs text-muted-foreground">{docType.description}</p>
                    ) : null}
                  </div>

                  {!uploaded || status === 'rejected' ? (
                    <label className="shrink-0 cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType.id, file);
                        }}
                        disabled={isUploading}
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={isUploading}
                        asChild
                      >
                        <span>
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-3.5 h-3.5 mr-1.5" />
                              {status === 'rejected' ? 'Re-upload' : 'Upload'}
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  ) : (
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full shrink-0",
                      status === 'verified' 
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    )}>
                      {status === 'verified' ? 'Verified' : 'Pending Review'}
                    </span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Actions */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={onSkip}
          className="flex-1"
        >
          Resume Later
        </Button>
        <Button 
          onClick={onComplete}
          className="flex-1"
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        You can always upload documents from your dashboard
      </p>
    </div>
  );
};

export default PostSubmitDocumentUpload;
