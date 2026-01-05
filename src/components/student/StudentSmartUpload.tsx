/**
 * Student Smart Upload - AI-Powered Document Upload
 * 
 * Desktop-first design with simplified confidence display.
 * Filters document types to student-uploadable categories only.
 * Includes AI validation step before upload for quality/content checking.
 */
import { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InlineDocTypePicker from './InlineDocTypePicker';
import { useDocumentClassification, QueuedFile, ClassificationResult } from '@/hooks/useDocumentClassification';
import { useDocumentValidation, ValidationResult } from '@/hooks/useDocumentValidation';
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
  Shield,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import AIValidationFeedback from './AIValidationFeedback';

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

// Extended queue file with validation
interface ExtendedQueuedFile extends QueuedFile {
  validationStatus?: 'idle' | 'validating' | 'validated';
  validation?: ValidationResult | null;
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

import { getCategoryLabel } from '@/constants/categoryLabels';

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
  uploadedDocuments = [],
}: StudentSmartUploadProps) => {
  const [queue, setQueue] = useState<ExtendedQueuedFile[]>([]);
  const { classifyDocument } = useDocumentClassification();
  const { validateDocument } = useDocumentValidation();

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
    const queuedFile: ExtendedQueuedFile = {
      id: fileId,
      file,
      preview,
      status: 'classifying',
      validationStatus: 'idle',
    };
    
    setQueue(prev => [...prev, queuedFile]);

    // Step 1: Classify the document
    const classification = await classifyDocument(file);
    
    if (classification) {
      const matchingType = findMatchingDocType(classification);

      // Update with classification, then start validation
      setQueue(prev => prev.map(q => 
        q.id === fileId 
          ? { 
              ...q, 
              status: 'classified', 
              classification,
              selectedDocumentTypeId: matchingType?.id,
              selectedCategory: classification.detected_category,
              validationStatus: 'validating',
            } 
          : q
      ));

      // Step 2: Validate the document if we have a matching type
      if (matchingType) {
        const validation = await validateDocument(file, matchingType.name);
        setQueue(prev => prev.map(q => 
          q.id === fileId 
            ? { 
                ...q, 
                validationStatus: 'validated',
                validation,
              } 
            : q
        ));
      } else {
        // No matching type - skip validation
        setQueue(prev => prev.map(q => 
          q.id === fileId 
            ? { 
                ...q, 
                validationStatus: 'idle',
              } 
            : q
        ));
      }
    } else {
      setQueue(prev => prev.map(q => 
        q.id === fileId 
          ? { 
              ...q, 
              status: 'classified', 
              classification: undefined,
              validationStatus: 'idle',
            } 
          : q
      ));
    }
  }, [classifyDocument, validateDocument, findMatchingDocType]);

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

  const handleTypeChange = useCallback(async (fileId: string, documentTypeId: string) => {
    const docType = studentDocTypes.find(dt => dt.id === documentTypeId);
    const queuedFile = queue.find(q => q.id === fileId);
    
    setQueue(prev => prev.map(q => 
      q.id === fileId 
        ? { 
            ...q, 
            selectedDocumentTypeId: documentTypeId,
            selectedCategory: docType?.category || q.selectedCategory,
            validationStatus: 'validating',
            validation: null,
          } 
        : q
    ));

    // Re-validate with new document type
    if (queuedFile && docType) {
      const validation = await validateDocument(queuedFile.file, docType.name);
      setQueue(prev => prev.map(q => 
        q.id === fileId 
          ? { 
              ...q, 
              validationStatus: 'validated',
              validation,
            } 
          : q
      ));
    }
  }, [studentDocTypes, queue, validateDocument]);

  // Check if detected name matches student or co-applicant
  const getNameMatchStatus = (detectedName?: string) => {
    if (!detectedName) return { status: 'none', message: '' };
    
    const normalizedDetected = detectedName.toLowerCase().trim();
    const normalizedStudent = studentName?.toLowerCase().trim() || '';
    const normalizedCoApplicant = coApplicantName?.toLowerCase().trim() || '';
    
    // Skip matching if co-applicant has a placeholder name
    const placeholderNames = ['co-applicant', 'coapplicant', 'co applicant', 'tbd', 'na', 'n/a', ''];
    const isCoApplicantPlaceholder = placeholderNames.includes(normalizedCoApplicant);
    
    // Minimum 3 characters to avoid false positives from short parts
    const MIN_PART_LENGTH = 3;
    
    const detectedParts = normalizedDetected.split(/\s+/).filter(p => p.length >= MIN_PART_LENGTH);
    const studentParts = normalizedStudent.split(/\s+/).filter(p => p.length >= MIN_PART_LENGTH);
    const coApplicantParts = isCoApplicantPlaceholder 
      ? [] 
      : normalizedCoApplicant.split(/\s+/).filter(p => p.length >= MIN_PART_LENGTH);
    
    // Count matching parts (not just boolean match)
    const countMatches = (detected: string[], target: string[]) => {
      if (target.length === 0) return 0;
      return detected.filter(part => 
        target.some(tp => tp.includes(part) || part.includes(tp))
      ).length;
    };
    
    const studentMatchCount = countMatches(detectedParts, studentParts);
    const coApplicantMatchCount = countMatches(detectedParts, coApplicantParts);
    
    // Calculate match ratio for better comparison
    const studentRatio = studentParts.length > 0 
      ? studentMatchCount / Math.max(detectedParts.length, studentParts.length) 
      : 0;
    const coApplicantRatio = coApplicantParts.length > 0 
      ? coApplicantMatchCount / Math.max(detectedParts.length, coApplicantParts.length) 
      : 0;
    
    // Determine best match based on ratio (higher ratio = better match)
    if (coApplicantRatio > studentRatio && coApplicantMatchCount > 0) {
      return { 
        status: 'match', 
        message: 'Matches co-applicant', 
        matchType: 'co_applicant' 
      };
    }
    
    if (studentMatchCount > 0 && studentParts.length > 0) {
      return { 
        status: 'match', 
        message: 'Matches your profile', 
        matchType: 'student' 
      };
    }
    
    // If we have both student name and detected name but no match - show warning
    if (normalizedStudent && detectedParts.length > 0) {
      return { 
        status: 'warning', 
        message: `Name mismatch: Document shows "${detectedName}" but your name is "${studentName}"`,
      };
    }
    
    return { 
      status: 'info', 
      message: `Document shows: ${detectedName}`,
    };
  };

  const handleUpload = useCallback(async (queuedFile: ExtendedQueuedFile) => {
    if (!queuedFile.selectedDocumentTypeId) {
      toast.error('Please select document type');
      return;
    }

    // Block upload if validation explicitly rejected
    if (queuedFile.validation?.validationStatus === 'rejected') {
      toast.error(queuedFile.validation.notes || 'Document validation failed. Please upload a valid document.');
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

      // Build validation notes combining classification and validation results
      const validationNotes = [
        queuedFile.classification?.notes,
        queuedFile.validation?.notes,
        queuedFile.validation?.redFlags?.length ? `Red flags: ${queuedFile.validation.redFlags.join(', ')}` : null,
      ].filter(Boolean).join(' | ');

      // Create database record with AI classification + validation data
      // Status is 'pending' for student uploads - Admin will approve/reject
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
          // Set to 'pending' so Admin must approve/reject
          verification_status: 'pending',
          uploaded_by: 'student',
          // AI Classification data
          ai_detected_type: queuedFile.classification?.detected_type,
          ai_confidence_score: queuedFile.classification?.confidence,
          ai_quality_assessment: queuedFile.validation?.qualityAssessment || queuedFile.classification?.quality,
          // AI Validation data
          ai_validation_status: queuedFile.validation?.validationStatus || 'manual_review',
          ai_validation_notes: validationNotes || null,
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

  // Stricter confidence display that accounts for quality and red flags
  const getConfidenceDisplay = (classification: ClassificationResult) => {
    const { confidence, quality, red_flags, is_document } = classification;
    
    // Priority 1: Reject non-documents
    if (!is_document || red_flags?.includes('not_a_document') || 
        red_flags?.includes('selfie') || red_flags?.includes('random_photo')) {
      return { icon: XCircle, text: 'Not a Document', className: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400' };
    }
    
    // Priority 2: Quality issues
    if (quality === 'poor' || quality === 'unreadable') {
      return { icon: AlertTriangle, text: 'Poor Quality', className: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' };
    }
    
    // Priority 3: Red flags
    if (red_flags?.some(f => ['blurry', 'partial', 'screenshot', 'edited'].includes(f))) {
      return { icon: AlertTriangle, text: 'Needs Attention', className: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400' };
    }
    
    // Priority 4: Confidence-based
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
                        {/* Confidence Display - Accounts for quality and red flags */}
                        {queuedFile.classification && queuedFile.classification.confidence > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {(() => {
                              const conf = getConfidenceDisplay(queuedFile.classification);
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

                        {/* AI Validation Feedback */}
                        {(queuedFile.validationStatus === 'validating' || queuedFile.validationStatus === 'validated') && (
                          <AIValidationFeedback
                            status={queuedFile.validationStatus}
                            validation={queuedFile.validation}
                          />
                        )}
                        {/* Name match indicator - Shows match, warning, or info */}
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
                          if (nameMatch.status === 'warning') {
                            return (
                              <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded">
                                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>{nameMatch.message}</span>
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

                        {/* Document Type Selector - Inline picker avoids portal issues */}
                        <InlineDocTypePicker
                          documentTypes={studentDocTypes}
                          value={queuedFile.selectedDocumentTypeId}
                          onChange={(value) => handleTypeChange(queuedFile.id, value)}
                          groupedDocTypes={groupedDocTypes}
                          getCategoryLabel={getCategoryLabel}
                        />

                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-1">
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => handleUpload(queuedFile)}
                            disabled={
                              !queuedFile.selectedDocumentTypeId || 
                              queuedFile.validation?.validationStatus === 'rejected'
                            }
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
