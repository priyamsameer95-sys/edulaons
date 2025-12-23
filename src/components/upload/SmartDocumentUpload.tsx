import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useDocumentClassification, QueuedFile, ClassificationResult } from '@/hooks/useDocumentClassification';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { useLeadDocuments } from '@/hooks/useLeadDocuments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ChevronDown,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Trash2,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SmartDocumentUploadProps {
  leadId: string;
  onUploadComplete?: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  student: 'Student KYC',
  financial_co_applicant: 'Co-Applicant Financial',
  non_financial_co_applicant: 'Non-Financial Co-Applicant',
  collateral: 'Property/Collateral',
  nri_financial: 'NRI Documents',
};

const CATEGORY_ORDER = ['student', 'financial_co_applicant', 'non_financial_co_applicant', 'collateral', 'nri_financial'];

export function SmartDocumentUpload({ leadId, onUploadComplete }: SmartDocumentUploadProps) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['student', 'financial_co_applicant']));
  
  const { classifyDocument } = useDocumentClassification();
  const { documentTypes, loading: typesLoading } = useDocumentTypes();
  const { documents: uploadedDocs, refetch: refetchUploaded } = useLeadDocuments(leadId);

  // Group uploaded documents by category
  const uploadedByCategory = useMemo(() => {
    const grouped: Record<string, typeof uploadedDocs> = {};
    uploadedDocs.forEach(doc => {
      const category = doc.document_types?.category || 'student';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(doc);
    });
    return grouped;
  }, [uploadedDocs]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const processFile = useCallback(async (file: File): Promise<void> => {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create preview for images
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    // Add to queue as pending
    const queuedFile: QueuedFile = {
      id: fileId,
      file,
      preview,
      status: 'classifying',
    };
    
    setQueue(prev => [...prev, queuedFile]);

    // Classify the document
    const classification = await classifyDocument(file);
    
    if (classification) {
      // Find matching document type from database
      const matchingType = documentTypes.find(dt => {
        const normalizedName = dt.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const normalizedDetected = classification.detected_type.toLowerCase();
        return normalizedName.includes(normalizedDetected) || normalizedDetected.includes(normalizedName);
      });

      setQueue(prev => prev.map(q => 
        q.id === fileId 
          ? { 
              ...q, 
              status: 'classified', 
              classification,
              selectedDocumentTypeId: matchingType?.id,
              selectedCategory: classification.detected_category,
            } 
          : q
      ));
    } else {
      setQueue(prev => prev.map(q => 
        q.id === fileId 
          ? { ...q, status: 'error', error: 'Classification failed' } 
          : q
      ));
    }
  }, [classifyDocument, documentTypes]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Process files in parallel
    await Promise.all(acceptedFiles.map(processFile));
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleTypeChange = useCallback((fileId: string, documentTypeId: string) => {
    const docType = documentTypes.find(dt => dt.id === documentTypeId);
    setQueue(prev => prev.map(q => 
      q.id === fileId 
        ? { 
            ...q, 
            selectedDocumentTypeId: documentTypeId,
            selectedCategory: docType?.category || q.selectedCategory,
          } 
        : q
    ));
  }, [documentTypes]);

  const handleUpload = useCallback(async (queuedFile: QueuedFile) => {
    if (!queuedFile.selectedDocumentTypeId) {
      toast({
        variant: 'destructive',
        title: 'Select document type',
        description: 'Please select the document type before uploading',
      });
      return;
    }

    setQueue(prev => prev.map(q => 
      q.id === queuedFile.id ? { ...q, status: 'uploading' } : q
    ));

    try {
      const ext = queuedFile.file.name.split('.').pop();
      const storedFilename = `${leadId}/${queuedFile.selectedDocumentTypeId}/${Date.now()}.${ext}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('lead-documents')
        .upload(storedFilename, queuedFile.file, { upsert: true });

      if (uploadError) throw uploadError;

      // Create database record with AI classification data
      const { error: dbError } = await supabase
        .from('lead_documents')
        .insert({
          lead_id: leadId,
          document_type_id: queuedFile.selectedDocumentTypeId,
          original_filename: queuedFile.file.name,
          stored_filename: storedFilename,
          file_path: storedFilename,
          file_size: queuedFile.file.size,
          mime_type: queuedFile.file.type,
          upload_status: 'uploaded',
          verification_status: 'uploaded',
          ai_detected_type: queuedFile.classification?.detected_type,
          ai_confidence_score: queuedFile.classification?.confidence,
          ai_quality_assessment: queuedFile.classification?.quality,
          ai_validation_notes: queuedFile.classification?.notes,
          ai_validated_at: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      setQueue(prev => prev.map(q => 
        q.id === queuedFile.id ? { ...q, status: 'uploaded' } : q
      ));

      toast({
        title: 'Document uploaded',
        description: `${queuedFile.classification?.detected_type_label || 'Document'} uploaded successfully`,
      });

      refetchUploaded();
      onUploadComplete?.();

      // Remove from queue after short delay
      setTimeout(() => {
        setQueue(prev => prev.filter(q => q.id !== queuedFile.id));
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setQueue(prev => prev.map(q => 
        q.id === queuedFile.id ? { ...q, status: 'error', error: 'Upload failed' } : q
      ));
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'Please try again',
      });
    }
  }, [leadId, refetchUploaded, onUploadComplete]);

  const handleUploadAll = useCallback(async () => {
    const readyFiles = queue.filter(q => q.status === 'classified' && q.selectedDocumentTypeId);
    await Promise.all(readyFiles.map(handleUpload));
  }, [queue, handleUpload]);

  const removeFromQueue = useCallback((fileId: string) => {
    setQueue(prev => {
      const file = prev.find(q => q.id === fileId);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(q => q.id !== fileId);
    });
  }, []);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">{confidence}%</Badge>;
    if (confidence >= 50) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">{confidence}%</Badge>;
    return <Badge className="bg-red-100 text-red-700 border-red-200">{confidence}%</Badge>;
  };

  const readyCount = queue.filter(q => q.status === 'classified' && q.selectedDocumentTypeId).length;
  const classifyingCount = queue.filter(q => q.status === 'classifying').length;

  if (typesLoading) {
    return (
      <Card className="border border-border rounded-xl">
        <CardContent className="pt-6 flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card className="border border-border rounded-xl overflow-hidden">
        <div
          {...getRootProps()}
          className={cn(
            "p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer",
            isDragActive 
              ? "border-primary bg-primary/5" 
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3 text-center">
            <div className={cn(
              "p-4 rounded-full transition-colors",
              isDragActive ? "bg-primary/10" : "bg-muted"
            )}>
              <Upload className={cn(
                "h-8 w-8 transition-colors",
                isDragActive ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {isDragActive ? "Drop your documents here" : "Drag & drop documents"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                AI will automatically identify and categorize them
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3" />
              <span>Supports JPG, PNG, PDF up to 10MB</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Upload Queue */}
      {queue.length > 0 && (
        <Card className="border border-border rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                AI Classification Queue
                {classifyingCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Analyzing {classifyingCount}
                  </Badge>
                )}
              </CardTitle>
              {readyCount > 0 && (
                <Button size="sm" onClick={handleUploadAll}>
                  Upload All ({readyCount})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-80">
              <div className="space-y-3">
                {queue.map(queuedFile => (
                  <div 
                    key={queuedFile.id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors",
                      queuedFile.status === 'uploaded' && "bg-emerald-50 border-emerald-200",
                      queuedFile.status === 'error' && "bg-red-50 border-red-200",
                      queuedFile.status === 'classifying' && "bg-muted/50 border-border",
                      queuedFile.status === 'classified' && "bg-background border-border",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Preview */}
                      <div className="w-12 h-12 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                        {queuedFile.preview ? (
                          <img 
                            src={queuedFile.preview} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileText className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-foreground">
                          {queuedFile.file.name}
                        </p>

                        {queuedFile.status === 'classifying' && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Analyzing document...
                          </div>
                        )}

                        {queuedFile.status === 'classified' && queuedFile.classification && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {queuedFile.classification.detected_type_label}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {queuedFile.classification.detected_category_label}
                              </Badge>
                              {getConfidenceBadge(queuedFile.classification.confidence)}
                            </div>

                            {/* Document Type Selector */}
                            <Select
                              value={queuedFile.selectedDocumentTypeId || ''}
                              onValueChange={(value) => handleTypeChange(queuedFile.id, value)}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Confirm or change document type" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(
                                  documentTypes.reduce((acc, dt) => {
                                    if (!acc[dt.category]) acc[dt.category] = [];
                                    acc[dt.category].push(dt);
                                    return acc;
                                  }, {} as Record<string, typeof documentTypes>)
                                ).map(([category, types]) => (
                                  <div key={category}>
                                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                                      {CATEGORY_LABELS[category] || category}
                                    </div>
                                    {types.map(dt => (
                                      <SelectItem key={dt.id} value={dt.id} className="text-xs">
                                        {dt.name}
                                      </SelectItem>
                                    ))}
                                  </div>
                                ))}
                              </SelectContent>
                            </Select>

                            {queuedFile.classification.confidence < 60 && (
                              <div className="flex items-center gap-1 text-xs text-amber-600">
                                <AlertTriangle className="h-3 w-3" />
                                Low confidence - please verify
                              </div>
                            )}
                          </div>
                        )}

                        {queuedFile.status === 'uploading' && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Uploading...
                          </div>
                        )}

                        {queuedFile.status === 'uploaded' && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-emerald-600">
                            <CheckCircle2 className="h-4 w-4" />
                            Uploaded successfully
                          </div>
                        )}

                        {queuedFile.status === 'error' && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-red-600">
                            <XCircle className="h-4 w-4" />
                            {queuedFile.error || 'Upload failed'}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {queuedFile.status === 'classified' && queuedFile.selectedDocumentTypeId && (
                          <Button 
                            size="sm" 
                            variant="default"
                            className="h-8"
                            onClick={() => handleUpload(queuedFile)}
                          >
                            Upload
                          </Button>
                        )}
                        {['classified', 'error'].includes(queuedFile.status) && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeFromQueue(queuedFile.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Documents by Category */}
      {uploadedDocs.length > 0 && (
        <Card className="border border-border rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Uploaded Documents
              <Badge variant="secondary" className="text-xs">
                {uploadedDocs.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {CATEGORY_ORDER.filter(cat => uploadedByCategory[cat]?.length).map(category => {
              const docs = uploadedByCategory[category] || [];
              const isExpanded = expandedCategories.has(category);
              
              return (
                <Collapsible
                  key={category}
                  open={isExpanded}
                  onOpenChange={() => toggleCategory(category)}
                >
                  <CollapsibleTrigger asChild>
                    <button className="flex items-center justify-between w-full py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm text-foreground">
                          {CATEGORY_LABELS[category] || category}
                        </span>
                      </div>
                      <Badge variant="default" className="text-xs">
                        {docs.length}
                      </Badge>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-6 space-y-1 pb-2">
                    {docs.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-foreground truncate">
                              {doc.document_types?.name || 'Document'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {doc.original_filename}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            doc.verification_status === 'verified' && "border-emerald-300 text-emerald-700",
                            doc.verification_status === 'rejected' && "border-red-300 text-red-700",
                          )}
                        >
                          {doc.verification_status}
                        </Badge>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
