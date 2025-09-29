import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DocumentUpload } from "@/components/ui/document-upload";
import { EnhancedDocumentUpload } from "@/components/ui/enhanced-document-upload";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Upload, Check, AlertCircle, File } from "lucide-react";

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
      <div className="bg-gradient-subtle rounded-2xl border border-border/50 shadow-elegant overflow-hidden">
        <div className="p-8 border-b border-border/10 bg-card/50">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Required Documents</h2>
          </div>
        </div>
        <div className="p-8">
          <div className="text-center py-12">
            <File className="h-12 w-12 animate-pulse mx-auto mb-6 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">Loading document requirements...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-subtle rounded-2xl border border-border/50 shadow-elegant overflow-hidden">
      {/* Header Section */}
      <div className="p-8 border-b border-border/10 bg-card/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">Required Documents</h2>
          </div>
          <Badge variant="outline" className="px-4 py-2 text-base font-medium bg-card border-border/20">
            {uploadedRequiredDocs.length}/{requiredDocs.length} Required
          </Badge>
        </div>
        
        {/* Progress Section */}
        {requiredDocs.length > 0 && (
          <div className="space-y-4">
            <Progress 
              value={progressPercentage} 
              className="w-full h-3 bg-muted/50 rounded-full overflow-hidden"
            />
            <div className="flex items-center justify-between">
              <p className="text-base text-muted-foreground">
                {Math.round(progressPercentage)}% of required documents uploaded
              </p>
              <span className="text-sm font-medium text-primary">
                {uploadedRequiredDocs.length} of {requiredDocs.length} completed
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Documents Grid */}
      <div className="p-8">
        <div className="grid gap-6">
          {documentTypes.map((docType) => {
            const status = getDocumentStatus(docType.id);
            const isUploading = uploading.includes(docType.id);
            
            return (
              <Card key={docType.id} className="shadow-lg border-border/20 bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  {/* Document Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <File className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{docType.name}</h3>
                        {docType.description && (
                          <p className="text-sm text-muted-foreground mt-1">{docType.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {docType.required && (
                        <Badge variant="destructive" className="px-3 py-1">
                          Required
                        </Badge>
                      )}
                      
                      {/* Status Indicator */}
                      <div className="flex items-center gap-2">
                        {status === 'uploaded' && (
                          <div className="flex items-center gap-2 text-success">
                            <div className="p-1 rounded-full bg-success/20">
                              <Check className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                        {status === 'error' && (
                          <div className="flex items-center gap-2 text-destructive">
                            <div className="p-1 rounded-full bg-destructive/20">
                              <AlertCircle className="h-4 w-4" />
                            </div>
                          </div>
                        )}
                        {isUploading && (
                          <div className="p-1 rounded-full bg-primary/20">
                            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Upload Area or Status */}
                  {status !== 'uploaded' && (
                    <EnhancedDocumentUpload
                      leadId={leadId}
                      documentType={docType}
                      onUploadSuccess={(document) => {
                        setUploadedDocs(prev => 
                          prev.map(doc => 
                            doc.documentTypeId === docType.id 
                              ? { ...doc, status: 'uploaded' as const }
                              : doc
                          )
                        );
                        
                        toast({
                          title: "✅ Document Uploaded Successfully",
                          description: `${docType.name} has been uploaded and is ready for review`,
                        });

                        const totalRequired = documentTypes.filter(dt => dt.required).length;
                        const totalUploaded = uploadedDocs.filter(doc => doc.status === 'uploaded').length + 1;
                        onDocumentsChange?.(totalUploaded, totalRequired);
                      }}
                      onUploadError={(error) => {
                        setUploadedDocs(prev => 
                          prev.map(doc => 
                            doc.documentTypeId === docType.id 
                              ? { ...doc, status: 'error' as const }
                              : doc
                          )
                        );

                        toast({
                          title: "❌ Upload Failed",
                          description: error || "Something went wrong. Please try uploading again.",
                          variant: "destructive",
                        });
                      }}
                      disabled={isUploading || !leadId}
                    />
                  )}
                  
                  {/* Success State */}
                  {status === 'uploaded' && (
                    <div className="p-6 rounded-xl border-2 border-success/30 bg-gradient-to-r from-success/10 to-success/5 backdrop-blur-sm shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-success/20 shadow-sm">
                          <Check className="h-6 w-6 text-success" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-success">Document verified and ready!</h4>
                          <p className="text-sm text-success/90 mt-1">Your {docType.name.toLowerCase()} has been successfully uploaded and processed</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Error State */}
                  {status === 'error' && (
                    <div className="p-6 rounded-xl border-2 border-destructive/30 bg-gradient-to-r from-destructive/10 to-destructive/5 backdrop-blur-sm shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-destructive/20 shadow-sm">
                          <AlertCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-destructive">Upload needs attention</h4>
                          <p className="text-sm text-destructive/90 mt-1">Please try uploading your {docType.name.toLowerCase()} again or contact support if the issue persists</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {/* Empty State */}
        {documentTypes.length === 0 && (
          <div className="text-center py-16">
            <div className="p-6 rounded-2xl bg-muted/20 inline-block mb-6">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No document types configured</h3>
            <p className="text-muted-foreground">Contact support to set up document requirements</p>
          </div>
        )}
      </div>
    </div>
  );
};