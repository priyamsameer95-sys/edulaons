import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DocumentUpload } from "@/components/ui/document-upload";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Upload, Check, AlertCircle } from "lucide-react";

interface DocumentUploadSectionProps {
  leadId?: string;
  onDocumentsChange?: (totalUploaded: number, totalRequired: number) => void;
}

interface UploadedDocument {
  documentTypeId: string;
  file: File;
  status: 'uploading' | 'uploaded' | 'error';
}

export const DocumentUploadSection = ({ leadId, onDocumentsChange }: DocumentUploadSectionProps) => {
  const { documentTypes, loading } = useDocumentTypes();
  const { toast } = useToast();
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState<string[]>([]);

  // Track when upload starts to show uploading state
  const handleUploadStart = (documentTypeId: string) => {
    setUploading(prev => [...prev, documentTypeId]);
    
    // Add to uploaded docs with uploading status
    setUploadedDocs(prev => [
      ...prev.filter(doc => doc.documentTypeId !== documentTypeId),
      { documentTypeId, file: new File([], 'temp'), status: 'uploading' }
    ]);
  };

  const getDocumentStatus = (documentTypeId: string) => {
    const doc = uploadedDocs.find(d => d.documentTypeId === documentTypeId);
    if (!doc) return null;
    return doc.status;
  };

  const requiredDocs = documentTypes.filter(dt => dt.required);
  const uploadedRequiredDocs = requiredDocs.filter(dt => 
    getDocumentStatus(dt.id) === 'uploaded'
  );
  const progressPercentage = requiredDocs.length > 0 
    ? (uploadedRequiredDocs.length / requiredDocs.length) * 100 
    : 0;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading document requirements...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Required Documents
          </CardTitle>
          <Badge variant="outline">
            {uploadedRequiredDocs.length}/{requiredDocs.length} Required
          </Badge>
        </div>
        {requiredDocs.length > 0 && (
          <div className="space-y-2">
            <Progress value={progressPercentage} className="w-full h-2" />
            <p className="text-sm text-muted-foreground">
              {Math.round(progressPercentage)}% of required documents uploaded
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {documentTypes.map((docType) => {
          const status = getDocumentStatus(docType.id);
          const isUploading = uploading.includes(docType.id);
          
          return (
            <div key={docType.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{docType.name}</span>
                  {docType.required && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0">
                      Required
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {status === 'uploaded' && (
                    <Check className="h-4 w-4 text-success" />
                  )}
                  {status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  {isUploading && (
                    <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
              </div>
              
              {status !== 'uploaded' && (
                <DocumentUpload
                  leadId={leadId}
                  documentType={docType}
                  onUploadSuccess={(document) => {
                    // Update uploaded docs state
                    setUploadedDocs(prev => 
                      prev.map(doc => 
                        doc.documentTypeId === docType.id 
                          ? { ...doc, status: 'uploaded' as const }
                          : doc
                      )
                    );
                    
                    toast({
                      title: "Document Uploaded",
                      description: `${docType.name} has been uploaded successfully`,
                    });

                    // Notify parent component
                    const totalRequired = documentTypes.filter(dt => dt.required).length;
                    const totalUploaded = uploadedDocs.filter(doc => doc.status === 'uploaded').length + 1;
                    onDocumentsChange?.(totalUploaded, totalRequired);
                  }}
                  onUploadError={(error) => {
                    // Update status to error
                    setUploadedDocs(prev => 
                      prev.map(doc => 
                        doc.documentTypeId === docType.id 
                          ? { ...doc, status: 'error' as const }
                          : doc
                      )
                    );

                    toast({
                      title: "Upload Failed",
                      description: error || "Failed to upload document. Please try again.",
                      variant: "destructive",
                    });
                  }}
                  disabled={isUploading || !leadId}
                  className="h-24"
                />
              )}
              
              {status === 'uploaded' && (
                <div className="p-3 rounded-lg border bg-success/5 border-success/20">
                  <div className="flex items-center gap-2 text-success">
                    <Check className="h-4 w-4" />
                    <span className="text-sm font-medium">Document uploaded successfully</span>
                  </div>
                </div>
              )}
              
              {status === 'error' && (
                <div className="p-3 rounded-lg border bg-destructive/5 border-destructive/20">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Upload failed - please try again</span>
                  </div>
                </div>
              )}
              
              {docType.description && (
                <p className="text-xs text-muted-foreground">{docType.description}</p>
              )}
            </div>
          );
        })}
        
        {documentTypes.length === 0 && (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No document types configured</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};