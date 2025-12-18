import { useState, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useDynamicDocuments, LoanClassification } from '@/hooks/useDynamicDocuments';
import { useLeadDocuments } from '@/hooks/useLeadDocuments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  FileText, 
  ChevronDown, 
  ChevronRight, 
  Upload, 
  CheckCircle2, 
  Circle,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface StudentDocumentChecklistProps {
  leadId: string;
  loanClassification: LoanClassification | null;
}

interface CategoryGroup {
  category: string;
  label: string;
  docs: Array<{
    id: string;
    document_type_id: string;
    name: string;
    isUploaded: boolean;
    uploadedDoc?: {
      id: string;
      verification_status: string;
      original_filename: string;
    };
  }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  student: 'Student KYC',
  financial_co_applicant: 'Co-Applicant',
  non_financial_co_applicant: 'Co-Applicant',
  collateral: 'Property Documents',
  nri_financial: 'NRI Documents',
};

export function StudentDocumentChecklist({ leadId, loanClassification }: StudentDocumentChecklistProps) {
  const { requiredDocs, totalRequired, loading: docsLoading } = useDynamicDocuments(loanClassification);
  const { documents: uploadedDocs, refetch: refetchUploaded, loading: uploadedLoading } = useLeadDocuments(leadId);
  
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['student', 'financial_co_applicant']));
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentDocTypeRef = useRef<string | null>(null);

  // Group required docs by category and check upload status
  const categoryGroups = useMemo<CategoryGroup[]>(() => {
    const groups = new Map<string, CategoryGroup>();
    
    requiredDocs.forEach(req => {
      const category = req.document_type.category;
      const label = CATEGORY_LABELS[category] || category;
      
      if (!groups.has(category)) {
        groups.set(category, { category, label, docs: [] });
      }
      
      const uploaded = uploadedDocs.find(d => d.document_type_id === req.document_type_id);
      
      groups.get(category)!.docs.push({
        id: req.id,
        document_type_id: req.document_type_id,
        name: req.document_type.name,
        isUploaded: !!uploaded,
        uploadedDoc: uploaded ? {
          id: uploaded.id,
          verification_status: uploaded.verification_status,
          original_filename: uploaded.original_filename,
        } : undefined,
      });
    });
    
    return Array.from(groups.values());
  }, [requiredDocs, uploadedDocs]);

  const totalUploaded = useMemo(() => {
    return categoryGroups.reduce((sum, group) => 
      sum + group.docs.filter(d => d.isUploaded).length, 0
    );
  }, [categoryGroups]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleUploadClick = useCallback((docTypeId: string) => {
    currentDocTypeRef.current = docTypeId;
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const docTypeId = currentDocTypeRef.current;
    
    if (!file || !docTypeId) return;
    
    // Reset input
    e.target.value = '';
    
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum file size is 5MB',
      });
      return;
    }
    
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload PDF, JPG, PNG, or WebP files',
      });
      return;
    }
    
    setUploadingDocType(docTypeId);
    
    try {
      // Generate unique filename
      const ext = file.name.split('.').pop();
      const storedFilename = `${leadId}/${docTypeId}/${Date.now()}.${ext}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('lead-documents')
        .upload(storedFilename, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Create database record
      const { error: dbError } = await supabase
        .from('lead_documents')
        .insert({
          lead_id: leadId,
          document_type_id: docTypeId,
          original_filename: file.name,
          stored_filename: storedFilename,
          file_path: storedFilename,
          file_size: file.size,
          mime_type: file.type,
          upload_status: 'completed',
          verification_status: 'uploaded',
        });
      
      if (dbError) throw dbError;
      
      toast({
        title: 'Document uploaded',
        description: 'Your document has been uploaded successfully.',
      });
      
      refetchUploaded();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Please try again or contact support.',
      });
    } finally {
      setUploadingDocType(null);
    }
  }, [leadId, refetchUploaded]);

  const getStatusIcon = (doc: CategoryGroup['docs'][0]) => {
    if (doc.isUploaded && doc.uploadedDoc) {
      switch (doc.uploadedDoc.verification_status) {
        case 'verified':
          return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
        case 'rejected':
          return <AlertCircle className="h-4 w-4 text-red-600" />;
        default:
          return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      }
    }
    return <Circle className="h-4 w-4 text-muted-foreground" />;
  };

  if (docsLoading || uploadedLoading) {
    return (
      <Card className="bg-card border border-border rounded-xl">
        <CardContent className="pt-6 flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (totalRequired === 0) {
    return (
      <Card className="bg-card border border-border rounded-xl">
        <CardContent className="pt-6 text-center text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Document checklist will appear once your loan type is confirmed.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border border-border rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground text-base">
            <FileText className="h-5 w-5" />
            Documents Required
          </CardTitle>
          <Badge 
            variant={totalUploaded === totalRequired ? 'default' : 'secondary'}
            className="text-xs"
          >
            {totalUploaded}/{totalRequired} uploaded
          </Badge>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-1.5 mt-2">
          <div 
            className="bg-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(totalUploaded / totalRequired) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {categoryGroups.map(group => {
          const uploadedInGroup = group.docs.filter(d => d.isUploaded).length;
          const isExpanded = expandedCategories.has(group.category);
          
          return (
            <Collapsible 
              key={group.category}
              open={isExpanded}
              onOpenChange={() => toggleCategory(group.category)}
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-sm text-foreground">{group.label}</span>
                  </div>
                  <Badge 
                    variant={uploadedInGroup === group.docs.length ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {uploadedInGroup}/{group.docs.length}
                  </Badge>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-6 space-y-1 pb-2">
                {group.docs.map(doc => (
                  <div 
                    key={doc.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getStatusIcon(doc)}
                      <span className={`text-sm truncate ${doc.isUploaded ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {doc.name}
                      </span>
                    </div>
                    {!doc.isUploaded && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => handleUploadClick(doc.document_type_id)}
                        disabled={uploadingDocType === doc.document_type_id}
                      >
                        {uploadingDocType === doc.document_type_id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-3 w-3 mr-1" />
                            Upload
                          </>
                        )}
                      </Button>
                    )}
                    {doc.isUploaded && doc.uploadedDoc?.verification_status === 'rejected' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-red-600"
                        onClick={() => handleUploadClick(doc.document_type_id)}
                        disabled={uploadingDocType === doc.document_type_id}
                      >
                        {uploadingDocType === doc.document_type_id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Reupload'
                        )}
                      </Button>
                    )}
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          );
        })}
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileSelect}
        />
      </CardContent>
    </Card>
  );
}