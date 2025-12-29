/**
 * Student Document Checklist Component
 * 
 * Shows document requirements and upload status for students
 */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface DocumentType {
  id: string;
  name: string;
  category: string;
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
}

const StudentDocumentChecklist = ({ leadId, compact = false }: StudentDocumentChecklistProps) => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(!compact);

  useEffect(() => {
    fetchDocumentData();
  }, [leadId]);

  const fetchDocumentData = async () => {
    try {
      const [typesRes, docsRes] = await Promise.all([
        supabase
          .from('document_types')
          .select('id, name, category, required')
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

  const getDocumentStatus = (typeId: string) => {
    const doc = uploadedDocs.find(d => d.document_type_id === typeId);
    if (!doc) return 'pending';
    return doc.verification_status;
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
      toast.success('Document uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const requiredDocs = documentTypes.filter(d => d.required);
  const pendingCount = requiredDocs.filter(d => getDocumentStatus(d.id) === 'pending').length;
  const verifiedCount = requiredDocs.filter(d => getDocumentStatus(d.id) === 'verified').length;
  const rejectedCount = requiredDocs.filter(d => getDocumentStatus(d.id) === 'rejected').length;
  const progress = requiredDocs.length > 0 ? (verifiedCount / requiredDocs.length) * 100 : 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'verified') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (status === 'rejected') return <X className="w-4 h-4 text-red-600" />;
    if (status === 'pending' && uploadedDocs.some(d => d.verification_status === 'pending')) {
      return <Clock className="w-4 h-4 text-amber-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Documents
              </CardTitle>
              <div className="flex items-center gap-3">
                {pendingCount > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                    {pendingCount} pending
                  </span>
                )}
                {rejectedCount > 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    {rejectedCount} need reupload
                  </span>
                )}
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">Upload Progress</span>
                <span className="text-xs font-medium text-foreground">{verifiedCount}/{requiredDocs.length}</span>
              </div>
              <Progress value={progress} className="h-1.5" />
            </div>

            {/* Document List */}
            <div className="space-y-2">
              {requiredDocs.slice(0, compact ? 5 : undefined).map(docType => {
                const status = getDocumentStatus(docType.id);
                const uploaded = uploadedDocs.find(d => d.document_type_id === docType.id);
                const isUploading = uploading === docType.id;

                return (
                  <div 
                    key={docType.id}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg border",
                      status === 'verified' ? "bg-emerald-50/50 border-emerald-200" :
                      status === 'rejected' ? "bg-red-50/50 border-red-200" :
                      uploaded ? "bg-amber-50/50 border-amber-200" :
                      "bg-muted/30 border-border"
                    )}
                  >
                    <StatusIcon status={status} />
                    <span className="flex-1 text-sm font-medium text-foreground truncate">
                      {docType.name}
                    </span>

                    {!uploaded || status === 'rejected' ? (
                      <label className="cursor-pointer">
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
                        <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                          <span>
                            {isUploading ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Upload className="w-3.5 h-3.5" />
                            )}
                          </span>
                        </Button>
                      </label>
                    ) : (
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded",
                        status === 'verified' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {status === 'verified' ? '✓' : '⏳'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {compact && requiredDocs.length > 5 && (
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View all {requiredDocs.length} documents
              </Button>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default StudentDocumentChecklist;
