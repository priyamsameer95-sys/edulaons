/**
 * Student Smart Upload - AI-Powered Document Upload
 * 
 * Desktop-first design with simplified confidence display.
 * Filters document types to student-uploadable categories only.
 */
import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDocumentClassification, QueuedFile, ClassificationResult } from '@/hooks/useDocumentClassification';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Sparkles,
  AlertTriangle,
  Trash2,
  Check,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  required?: boolean;
  description?: string | null;
}

interface UploadedDocument {
  id: string;
  document_type_id: string;
  verification_status?: string;
}

interface StudentSmartUploadProps {
  leadId: string;
  documentTypes: DocumentType[];
  onUploadSuccess: () => void;
  studentName?: string;
  coApplicantName?: string;
  uploadedDocuments?: UploadedDocument[];
}

// Student-uploadable categories only
const STUDENT_CATEGORIES = ['KYC', 'Academic', 'Financial', 'Co-Applicant'];

const CATEGORY_LABELS: Record<string, string> = {
  'KYC': 'Student Documents',
  'Academic': 'Academic Documents',
  'Financial': 'Financial Documents',
  'Co-Applicant': 'Co-Applicant Documents',
};

// User-friendly quality messages
const QUALITY_MESSAGES: Record<string, { text: string; variant: 'success' | 'warning' | 'error' }> = {
  good: { text: 'Document looks great!', variant: 'success' },
  acceptable: { text: 'Document accepted', variant: 'success' },
  poor: { text: 'Image quality is low - consider re-uploading', variant: 'warning' },
  unreadable: { text: 'Document is unclear - please try a clearer photo', variant: 'error' },
};

// User-friendly red flag messages
const REDFLAG_MESSAGES: Record<string, string> = {
  blurry: 'Image is blurry',
  partial: 'Part of the document is cut off',
  screenshot: 'Please upload the original document',
  selfie: 'This appears to be a selfie',
  unsupported_format: 'Unsupported file format',
};

const StudentSmartUpload = ({ 
  leadId, 
  documentTypes, 
  onUploadSuccess,
  studentName,
  coApplicantName,
  uploadedDocuments = []
}: StudentSmartUploadProps) => {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const { classifyDocument } = useDocumentClassification();

  // Filter document types to student-uploadable categories
  const studentDocTypes = useMemo(() => {
    return documentTypes.filter(dt => STUDENT_CATEGORIES.includes(dt.category));
  }, [documentTypes]);

  // Group document types by category for the dropdown
  const groupedDocTypes = useMemo(() => {
    return studentDocTypes.reduce((acc, dt) => {
      const category = dt.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(dt);
      return acc;
    }, {} as Record<string, DocumentType[]>);
  }, [studentDocTypes]);

  const findMatchingDocType = useCallback((classification: ClassificationResult): DocumentType | undefined => {
    const normalizedDetected = classification.detected_type.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    return studentDocTypes.find(dt => {
      const normalizedName = dt.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalizedName.includes(normalizedDetected) || 
             normalizedDetected.includes(normalizedName) ||
             normalizedName === normalizedDetected;
    });
  }, [studentDocTypes]);

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
    } else {
      setQueue(prev => prev.map(q => 
        q.id === fileId 
          ? { 
              ...q, 
              status: 'classified', 
              classification: undefined,
            } 
          : q
      ));
    }
  }, [classifyDocument, findMatchingDocType]);

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
    const docType = studentDocTypes.find(dt => dt.id === documentTypeId);
    setQueue(prev => prev.map(q => 
      q.id === fileId 
        ? { 
            ...q, 
            selectedDocumentTypeId: documentTypeId,
            selectedCategory: docType?.category || q.selectedCategory,
          } 
        : q
    ));
  }, [studentDocTypes]);

  // Check if detected name matches student or co-applicant
  const getNameMatchStatus = (detectedName?: string) => {
    if (!detectedName) return { status: 'none', message: '' };
    
    const normalizedDetected = detectedName.toLowerCase().trim();
    const normalizedStudent = studentName?.toLowerCase().trim() || '';
    const normalizedCoApplicant = coApplicantName?.toLowerCase().trim() || '';
    
    const detectedParts = normalizedDetected.split(/\s+/);
    const studentParts = normalizedStudent.split(/\s+/);
    const coApplicantParts = normalizedCoApplicant.split(/\s+/);
    
    const matchesStudent = detectedParts.some(part => 
      studentParts.some(sp => sp.includes(part) || part.includes(sp))
    );
    const matchesCoApplicant = coApplicantParts.length > 0 && detectedParts.some(part => 
      coApplicantParts.some(cp => cp.includes(part) || part.includes(cp))
    );
    
    if (matchesStudent) {
      return { status: 'match', message: 'Matches your profile', matchType: 'student' };
    }
    if (matchesCoApplicant) {
      return { status: 'match', message: 'Matches co-applicant', matchType: 'co_applicant' };
    }
    
    return { 
      status: 'info', 
      message: `Document shows: ${detectedName}`,
    };
  };

  const handleUpload = useCallback(async (queuedFile: QueuedFile) => {
    if (!queuedFile.selectedDocumentTypeId) {
      toast.error('Please select document type');
      return;
    }

    setQueue(prev => prev.map(q => 
      q.id === queuedFile.id ? { ...q, status: 'uploading' } : q
    ));

    try {
      const ext = queuedFile.file.name.split('.').pop();
      const storedFilename = `${leadId}/${queuedFile.selectedDocumentTypeId}/${Date.now()}.${ext}`;

      // Check if document type already exists - delete old one first
      const existingDoc = uploadedDocuments.find(
        doc => doc.document_type_id === queuedFile.selectedDocumentTypeId
      );
      
      if (existingDoc) {
        await supabase
          .from('lead_documents')
          .delete()
          .eq('id', existingDoc.id);
      }

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
          uploaded_by: 'student',
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

      const docTypeName = studentDocTypes.find(d => d.id === queuedFile.selectedDocumentTypeId)?.name;
      toast.success(`${docTypeName || 'Document'} uploaded successfully`);

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
      toast.error('Upload failed. Please try again.');
    }
  }, [leadId, studentDocTypes, onUploadSuccess, uploadedDocuments]);

  const handleUploadAll = useCallback(async () => {
    const readyFiles = queue.filter(q => q.status === 'classified' && q.selectedDocumentTypeId);
    for (const file of readyFiles) {
      await handleUpload(file);
    }
  }, [queue, handleUpload]);

  const removeFromQueue = useCallback((fileId: string) => {
    setQueue(prev => {
      const file = prev.find(q => q.id === fileId);
      if (file?.preview) URL.revokeObjectURL(file.preview);
      return prev.filter(q => q.id !== fileId);
    });
  }, []);

  const clearQueue = useCallback(() => {
    queue.forEach(q => {
      if (q.preview) URL.revokeObjectURL(q.preview);
    });
    setQueue([]);
  }, [queue]);

  // Simplified confidence display for students
  const getConfidenceDisplay = (confidence: number) => {
    if (confidence >= 70) {
      return { icon: CheckCircle2, text: 'AI Matched', className: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' };
    }
    if (confidence >= 50) {
      return { icon: AlertTriangle, text: 'Please Confirm', className: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' };
    }
    return { icon: AlertTriangle, text: 'Select Type', className: 'text-muted-foreground bg-muted' };
  };

  const classifyingCount = queue.filter(q => q.status === 'classifying').length;
  const readyCount = queue.filter(q => q.status === 'classified' && q.selectedDocumentTypeId).length;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Smart Upload
            </CardTitle>
            {queue.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-7 text-xs text-muted-foreground"
                onClick={clearQueue}
              >
                Clear All
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Drop your documents - AI will identify them automatically
          </p>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "p-8 border-2 border-dashed rounded-lg transition-all cursor-pointer",
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
                  {isDragActive ? "Drop files here" : "Drag & drop documents"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, PDF up to 10MB • Multiple files allowed
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
                Upload Queue
                {classifyingCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Analyzing {classifyingCount}
                  </Badge>
                )}
              </CardTitle>
              {readyCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {readyCount} ready to upload
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {queue.map(queuedFile => (
              <div 
                key={queuedFile.id}
                className={cn(
                  "p-4 rounded-lg border transition-colors",
                  queuedFile.status === 'uploaded' && "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
                  queuedFile.status === 'error' && "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
                  queuedFile.status === 'classifying' && "bg-muted/50 border-border",
                  queuedFile.status === 'classified' && "bg-background border-border",
                  queuedFile.status === 'uploading' && "bg-muted/30 border-border",
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Preview */}
                  <div className="w-14 h-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
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
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-sm font-medium truncate text-foreground">
                      {queuedFile.file.name}
                    </p>

                    {/* Classifying State */}
                    {queuedFile.status === 'classifying' && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        AI is analyzing your document...
                      </div>
                    )}

                    {/* Classified State */}
                    {queuedFile.status === 'classified' && (
                      <>
                        {/* Confidence Display - Simplified for students */}
                        {queuedFile.classification && queuedFile.classification.confidence > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {(() => {
                              const conf = getConfidenceDisplay(queuedFile.classification.confidence);
                              const Icon = conf.icon;
                              return (
                                <div className={cn("flex items-center gap-1 text-xs px-2 py-1 rounded-full", conf.className)}>
                                  <Icon className="h-3 w-3" />
                                  {conf.text}
                                </div>
                              );
                            })()}
                            {queuedFile.classification.detected_type_label && (
                              <Badge variant="outline" className="text-xs">
                                {queuedFile.classification.detected_type_label}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Name match indicator - Simplified */}
                        {queuedFile.classification?.detected_name && (() => {
                          const nameMatch = getNameMatchStatus(queuedFile.classification.detected_name);
                          if (nameMatch.status === 'match') {
                            return (
                              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="h-3 w-3" />
                                {nameMatch.message}
                              </div>
                            );
                          }
                          if (nameMatch.status === 'info') {
                            return (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Shield className="h-3 w-3" />
                                {nameMatch.message}
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Quality warning - User friendly */}
                        {queuedFile.classification?.quality && queuedFile.classification.quality !== 'good' && queuedFile.classification.quality !== 'acceptable' && (
                          <div className={cn(
                            "flex items-center gap-1 text-xs",
                            QUALITY_MESSAGES[queuedFile.classification.quality]?.variant === 'warning' && "text-amber-600 dark:text-amber-400",
                            QUALITY_MESSAGES[queuedFile.classification.quality]?.variant === 'error' && "text-red-600 dark:text-red-400"
                          )}>
                            <AlertTriangle className="h-3 w-3" />
                            {QUALITY_MESSAGES[queuedFile.classification.quality]?.text}
                          </div>
                        )}

                        {/* Red flags - User friendly */}
                        {queuedFile.classification?.red_flags && queuedFile.classification.red_flags.length > 0 && (
                          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            {queuedFile.classification.red_flags
                              .map(flag => REDFLAG_MESSAGES[flag] || flag)
                              .join(', ')}
                          </div>
                        )}

                        {/* Document Type Selector */}
                        <Select
                          value={queuedFile.selectedDocumentTypeId || ''}
                          onValueChange={(value) => handleTypeChange(queuedFile.id, value)}
                        >
                          <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(groupedDocTypes).map(([category, types]) => (
                              <div key={category}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  {CATEGORY_LABELS[category] || category}
                                </div>
                                {types.map(dt => (
                                  <SelectItem key={dt.id} value={dt.id} className="text-sm">
                                    {dt.name} {dt.required && '*'}
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => handleUpload(queuedFile)}
                            disabled={!queuedFile.selectedDocumentTypeId}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Upload
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-muted-foreground"
                            onClick={() => removeFromQueue(queuedFile.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}

                    {/* Uploading State */}
                    {queuedFile.status === 'uploading' && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </div>
                    )}

                    {/* Uploaded State */}
                    {queuedFile.status === 'uploaded' && (
                      <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5" />
                        Uploaded successfully!
                      </div>
                    )}

                    {/* Error State */}
                    {queuedFile.status === 'error' && (
                      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                        <XCircle className="h-5 w-5" />
                        {queuedFile.error || 'Upload failed'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Upload All Button */}
            {readyCount > 1 && (
              <Button
                className="w-full h-10"
                onClick={handleUploadAll}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload All Ready ({readyCount})
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StudentSmartUpload;
