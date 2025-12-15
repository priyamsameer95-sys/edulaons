import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, X, FileText, CheckCircle, AlertTriangle, Bot } from 'lucide-react';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { useDocumentValidation } from '@/hooks/useDocumentValidation';
import { useLeadDocuments } from '@/hooks/useLeadDocuments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { validateFileSize, validateFileFormat } from './document-upload';
import { Badge } from '@/components/ui/badge';

interface InlineDocumentUploadProps {
  leadId: string;
  onUploadComplete: () => void;
}

export function InlineDocumentUpload({ leadId, onUploadComplete }: InlineDocumentUploadProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [adminOverride, setAdminOverride] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { documentTypes } = useDocumentTypes();
  const { documents: uploadedDocuments, refetch: refetchDocuments } = useLeadDocuments(leadId);
  const { toast } = useToast();
  const { validateDocument, isValidating, validationResult, resetValidation } = useDocumentValidation();

  // Get selected document type name
  const selectedDocTypeName = useMemo(() => {
    if (!documentTypes || !selectedDocumentType) return '';
    return documentTypes.find(t => t.id === selectedDocumentType)?.name || '';
  }, [documentTypes, selectedDocumentType]);

  // Trigger validation when file and document type are both selected
  useEffect(() => {
    if (selectedFile && selectedDocTypeName) {
      setAdminOverride(false);
      validateDocument(selectedFile, selectedDocTypeName);
    }
  }, [selectedFile, selectedDocTypeName, validateDocument]);

  const processFile = useCallback((file: File) => {
    const sizeError = validateFileSize(file);
    if (sizeError) {
      toast({ title: 'File too large', description: sizeError, variant: 'destructive' });
      return;
    }
    const formatError = validateFileFormat(file);
    if (formatError) {
      toast({ title: 'Invalid format', description: formatError, variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
  }, [toast]);

  const handleFileRemove = useCallback(() => {
    setSelectedFile(null);
    resetValidation();
  }, [resetValidation]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  // Determine if upload should be allowed
  const canUpload = useMemo(() => {
    if (!selectedFile || !selectedDocumentType) return false;
    if (isValidating) return false;
    if (!validationResult) return false;
    if (validationResult.validationStatus === 'rejected' && !adminOverride) return false;
    return true;
  }, [selectedFile, selectedDocumentType, isValidating, validationResult, adminOverride]);

  const handleUpload = async () => {
    if (!selectedFile || !selectedDocumentType) return;

    try {
      setLoading(true);

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `lead-documents/${leadId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('lead-documents')
        .upload(filePath, selectedFile);

      if (uploadError) {
        toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' });
        return;
      }

      const { error: dbError } = await supabase
        .from('lead_documents')
        .insert({
          lead_id: leadId,
          document_type_id: selectedDocumentType,
          original_filename: selectedFile.name,
          stored_filename: fileName,
          file_path: filePath,
          file_size: selectedFile.size,
          mime_type: selectedFile.type,
          uploaded_by: 'admin',
          verification_status: 'uploaded',
          ai_validation_status: validationResult?.validationStatus || 'pending',
          ai_detected_type: validationResult?.detectedType || null,
          ai_confidence_score: validationResult?.confidence || null,
          ai_quality_assessment: validationResult?.qualityAssessment || null,
          ai_validation_notes: adminOverride 
            ? `Admin override: ${validationResult?.notes}` 
            : validationResult?.notes || null,
          ai_validated_at: validationResult ? new Date().toISOString() : null,
        });

      if (dbError) {
        await supabase.storage.from('lead-documents').remove([filePath]);
        toast({ title: 'Error', description: 'Failed to save document', variant: 'destructive' });
        return;
      }

      toast({ title: 'Document uploaded', description: 'Ready for processing.' });
      
      // Reset form
      setSelectedFile(null);
      setSelectedDocumentType('');
      setAdminOverride(false);
      resetValidation();
      
      refetchDocuments();
      onUploadComplete();
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'Error', description: 'Upload failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Group document types by category
  const groupedTypes = useMemo(() => {
    if (!documentTypes) return {};
    return documentTypes.reduce((acc, type) => {
      if (!acc[type.category]) acc[type.category] = [];
      acc[type.category].push(type);
      return acc;
    }, {} as Record<string, typeof documentTypes>);
  }, [documentTypes]);

  const getValidationBadge = () => {
    if (!selectedFile || !selectedDocumentType) return null;
    if (isValidating) return (
      <Badge variant="outline" className="text-muted-foreground">
        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
        Validating...
      </Badge>
    );
    if (!validationResult) return null;
    
    if (validationResult.validationStatus === 'validated') {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-300">
          <CheckCircle className="h-3 w-3 mr-1" />
          AI Verified
        </Badge>
      );
    }
    if (validationResult.validationStatus === 'rejected') {
      return (
        <Badge className="bg-red-500/10 text-red-600 border-red-300">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {validationResult.notes}
        </Badge>
      );
    }
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-300">
        <Bot className="h-3 w-3 mr-1" />
        Needs Review
      </Badge>
    );
  };

  return (
    <div className="border rounded-lg p-4 bg-card">
      <div className="flex items-center gap-2 mb-3">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">Quick Upload</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Document Type Selector */}
        <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {Object.entries(groupedTypes).map(([category, types]) => (
              <div key={category}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                  {category}
                </div>
                {types.map(type => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>

        {/* File Drop Zone - Compact */}
        <div
          className={`flex-1 border-2 border-dashed rounded-lg transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          } ${selectedFile ? 'bg-muted/30' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{selectedFile.name}</span>
                {getValidationBadge()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 shrink-0"
                onClick={handleFileRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 px-3 py-2 cursor-pointer">
              <span className="text-sm text-muted-foreground">Drop file or</span>
              <span className="text-sm text-primary font-medium">browse</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileInput}
              />
            </label>
          )}
        </div>

        {/* Upload Button */}
        <Button
          onClick={handleUpload}
          disabled={loading || !canUpload}
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Admin Override for rejected documents */}
      {validationResult?.validationStatus === 'rejected' && !adminOverride && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-destructive">{validationResult.notes}</span>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-6 text-xs"
            onClick={() => setAdminOverride(true)}
          >
            Upload Anyway
          </Button>
        </div>
      )}
    </div>
  );
}
