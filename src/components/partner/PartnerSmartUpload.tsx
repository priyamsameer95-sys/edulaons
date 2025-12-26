import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDocumentClassification, QueuedFile, ClassificationResult } from '@/hooks/useDocumentClassification';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Sparkles,
  AlertTriangle,
  Trash2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  required?: boolean;
  description?: string | null;
}

interface PartnerSmartUploadProps {
  leadId: string;
  documentTypes: DocumentType[];
  onUploadSuccess: () => void;
  onSuggestDocType?: (docTypeId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  student: 'Student KYC',
  financial_co_applicant: 'Co-Applicant Financial',
  non_financial_co_applicant: 'Non-Financial Co-Applicant',
  collateral: 'Property/Collateral',
  nri_financial: 'NRI Documents',
};

export function PartnerSmartUpload({ 
  leadId, 
  documentTypes, 
  onUploadSuccess,
  onSuggestDocType 
}: PartnerSmartUploadProps) {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const { classifyDocument } = useDocumentClassification();

  // Group document types by category for the dropdown
  const groupedDocTypes = useMemo(() => {
    return documentTypes.reduce((acc, dt) => {
      const category = dt.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(dt);
      return acc;
    }, {} as Record<string, DocumentType[]>);
  }, [documentTypes]);

  const findMatchingDocType = useCallback((classification: ClassificationResult): DocumentType | undefined => {
    const normalizedDetected = classification.detected_type.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    return documentTypes.find(dt => {
      const normalizedName = dt.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalizedName.includes(normalizedDetected) || 
             normalizedDetected.includes(normalizedName) ||
             normalizedName === normalizedDetected;
    });
  }, [documentTypes]);

  const processFile = useCallback(async (file: File): Promise<void> => {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create preview for images
    let preview: string | undefined;
    if (file.type.startsWith('image/')) {
      preview = URL.createObjectURL(file);
    }

    // Add to queue as classifying
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
      const matchingType = findMatchingDocType(classification);

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

      // Notify parent to highlight suggested doc type in grocery list
      if (matchingType && onSuggestDocType) {
        onSuggestDocType(matchingType.id);
      }
    } else {
      setQueue(prev => prev.map(q => 
        q.id === fileId 
          ? { ...q, status: 'classified', classification: undefined } 
          : q
      ));
    }
  }, [classifyDocument, findMatchingDocType, onSuggestDocType]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
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
    maxSize: 10 * 1024 * 1024,
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
    
    // Notify parent to highlight in grocery list
    if (onSuggestDocType) {
      onSuggestDocType(documentTypeId);
    }
  }, [documentTypes, onSuggestDocType]);

  const handleApproveUpload = useCallback(async (queuedFile: QueuedFile) => {
    if (!queuedFile.selectedDocumentTypeId) {
      toast({
        variant: 'destructive',
        title: 'Select document type',
        description: 'Please select what type of document this is',
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

      const docTypeName = documentTypes.find(d => d.id === queuedFile.selectedDocumentTypeId)?.name;
      toast({
        title: 'Document uploaded',
        description: `${docTypeName || 'Document'} uploaded successfully`,
      });

      onUploadSuccess();

      // Remove from queue after delay
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
  }, [leadId, documentTypes, onUploadSuccess]);

  const removeFromQueue = useCallback((fileId: string) => {
    setQueue(prev => {
      const file = prev.find(q => q.id === fileId);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(q => q.id !== fileId);
    });
  }, []);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
    if (confidence >= 50) return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
  };

  const classifyingCount = queue.filter(q => q.status === 'classifying').length;
  const readyCount = queue.filter(q => q.status === 'classified').length;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Smart Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "p-6 border-2 border-dashed rounded-lg transition-all cursor-pointer",
              isDragActive 
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-center">
              <div className={cn(
                "p-3 rounded-full transition-colors",
                isDragActive ? "bg-primary/10" : "bg-muted"
              )}>
                <Upload className={cn(
                  "h-6 w-6 transition-colors",
                  isDragActive ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">
                  {isDragActive ? "Drop files here" : "Drag & drop documents"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  AI will identify the document type automatically
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, PDF up to 10MB
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Classification Queue */}
      {queue.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                AI Classification
                {classifyingCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Analyzing {classifyingCount}
                  </Badge>
                )}
              </CardTitle>
              {readyCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {readyCount} ready for approval
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.map(queuedFile => (
              <div 
                key={queuedFile.id}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  queuedFile.status === 'uploaded' && "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
                  queuedFile.status === 'error' && "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
                  queuedFile.status === 'classifying' && "bg-muted/50 border-border",
                  queuedFile.status === 'classified' && "bg-background border-border",
                  queuedFile.status === 'uploading' && "bg-muted/30 border-border",
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
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm font-medium truncate text-foreground">
                      {queuedFile.file.name}
                    </p>

                    {/* Classifying State */}
                    {queuedFile.status === 'classifying' && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        AI is analyzing...
                      </div>
                    )}

                    {/* Classified State */}
                    {queuedFile.status === 'classified' && (
                      <>
                        {queuedFile.classification && queuedFile.classification.confidence > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {queuedFile.classification.detected_type_label}
                            </Badge>
                            <Badge className={cn("text-xs", getConfidenceColor(queuedFile.classification.confidence))}>
                              {queuedFile.classification.confidence}% confident
                            </Badge>
                          </div>
                        )}

                        {/* Low confidence or no classification warning */}
                        {(!queuedFile.classification || queuedFile.classification.confidence < 70) && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            {queuedFile.classification?.confidence 
                              ? 'Low confidence - please verify type'
                              : 'Please select document type manually'}
                          </div>
                        )}

                        {/* Red flags */}
                        {queuedFile.classification?.red_flags && queuedFile.classification.red_flags.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            {queuedFile.classification.red_flags.join(', ')}
                          </div>
                        )}

                        {/* Document Type Selector */}
                        <Select
                          value={queuedFile.selectedDocumentTypeId || ''}
                          onValueChange={(value) => handleTypeChange(queuedFile.id, value)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(groupedDocTypes).map(([category, types]) => (
                              <div key={category}>
                                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
                                  {CATEGORY_LABELS[category] || category}
                                </div>
                                {types.map(dt => (
                                  <SelectItem key={dt.id} value={dt.id} className="text-xs">
                                    {dt.name} {dt.required && '*'}
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Approve Button */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => handleApproveUpload(queuedFile)}
                            disabled={!queuedFile.selectedDocumentTypeId}
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Approve & Upload
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs"
                            onClick={() => removeFromQueue(queuedFile.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}

                    {/* Uploading State */}
                    {queuedFile.status === 'uploading' && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading...
                      </div>
                    )}

                    {/* Uploaded State */}
                    {queuedFile.status === 'uploaded' && (
                      <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        Uploaded successfully
                      </div>
                    )}

                    {/* Error State */}
                    {queuedFile.status === 'error' && (
                      <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                        <XCircle className="h-4 w-4" />
                        {queuedFile.error || 'Upload failed'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
