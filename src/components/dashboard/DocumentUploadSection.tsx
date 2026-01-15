import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EnhancedDocumentUpload } from "@/components/ui/enhanced-document-upload";
import { EnhancedEmptyState } from "@/components/ui/enhanced-empty-state";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  Upload,
  Check,
  CheckCircle,
  AlertCircle,
  File,
  ChevronDown,
  User,
  Users,
  Building,
  Globe,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadSectionProps {
  leadId?: string;
  loanType?: 'secured' | 'unsecured';
  onDocumentsChange?: (totalUploaded: number, totalRequired: number) => void;
}

interface UploadedDocument {
  documentTypeId: string;
  file: File;
  status: 'uploading' | 'uploaded' | 'error';
}

interface DocumentCategory {
  id: string;
  name: string;
  icon: any;
  description: string;
  conditional?: boolean;
}

const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  {
    id: 'student',
    name: 'Student Documents',
    icon: User,
    description: 'Required documents for the student applicant'
  },
  {
    id: 'financial_co_applicant',
    name: 'Financial Co-applicant',
    icon: Users,
    description: 'Documents for the primary financial co-applicant'
  },
  {
    id: 'nri_financial',
    name: 'NRI Financial Co-applicant (If Applicable)',
    icon: Globe,
    description: 'Additional documents for NRI co-applicants',
    conditional: true
  },
  {
    id: 'non_financial_co_applicant',
    name: 'Non-financial Co-applicant (Optional)',
    icon: Users,
    description: 'Documents for non-financial co-applicants if any',
    conditional: true
  },
  {
    id: 'collateral',
    name: 'Collateral Documents',
    icon: Building,
    description: 'Property and collateral related documents',
    conditional: true
  }
];

export const DocumentUploadSection = ({
  leadId,
  loanType = 'unsecured',
  onDocumentsChange
}: DocumentUploadSectionProps) => {
  const { documentTypes, loading } = useDocumentTypes();
  const { toast } = useToast();
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState<string[]>([]);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    student: false,
    financial_co_applicant: false,
    nri_financial: false,
    non_financial_co_applicant: false,
    collateral: false
  });

  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getDocumentStatus = (documentTypeId: string) => {
    const doc = uploadedDocs.find(d => d.documentTypeId === documentTypeId);
    if (!doc) return null;
    return doc.status;
  };

  // Group documents by category
  const documentsByCategory = documentTypes.reduce((acc, docType) => {
    if (!acc[docType.category]) {
      acc[docType.category] = [];
    }
    acc[docType.category].push(docType);
    return acc;
  }, {} as Record<string, typeof documentTypes>);

  // Calculate progress
  const requiredDocs = documentTypes.filter(dt => dt.required);
  const uploadedRequiredDocs = requiredDocs.filter(dt =>
    getDocumentStatus(dt.id) === 'uploaded'
  );
  const progressPercentage = requiredDocs.length > 0
    ? (uploadedRequiredDocs.length / requiredDocs.length) * 100
    : 0;

  // Filter categories based on loan type
  const visibleCategories = DOCUMENT_CATEGORIES.filter(cat => {
    if (cat.id === 'collateral') {
      return loanType === 'secured';
    }
    return true;
  });

  if (loading) {
    return (
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Required Documents</h2>
          </div>
        </div>
        <div className="px-4 py-8 text-center">
          <File className="h-8 w-8 animate-pulse mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Compact Header */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Required Documents</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              📄 Upload clear photos or PDFs (max 20MB each)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {uploadedRequiredDocs.length}/{requiredDocs.length}
            </Badge>
            <div className="text-xs text-muted-foreground">
              {Math.round(progressPercentage)}% Complete
            </div>
          </div>
        </div>

        {/* Compact Progress */}
        {requiredDocs.length > 0 && (
          <Progress
            value={progressPercentage}
            className="w-full h-1.5 mt-3"
          />
        )}
      </div>

      {/* Table Layout */}
      <div className="divide-y divide-border">
        {visibleCategories.map((category) => {
          const categoryDocs = documentsByCategory[category.id] || [];
          if (categoryDocs.length === 0) return null;

          const CategoryIcon = category.icon;

          return (
            <Collapsible
              key={category.id}
              open={openCategories[category.id]}
              onOpenChange={() => toggleCategory(category.id)}
            >
              {/* Category Header */}
              <CollapsibleTrigger asChild>
                <div className="px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{category.name}</span>
                      {category.conditional && (
                        <Badge variant="outline" className="text-xs h-5">
                          {category.id === 'collateral' ? 'Secured' : 'Optional'}
                        </Badge>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform text-muted-foreground",
                        openCategories[category.id] && "transform rotate-180"
                      )}
                    />
                  </div>
                </div>
              </CollapsibleTrigger>

              {/* Document Rows */}
              <CollapsibleContent>
                <div className="bg-muted/20">
                  {categoryDocs.map((docType) => {
                    const status = getDocumentStatus(docType.id);
                    const isUploading = uploading.includes(docType.id);

                    return (
                      <div
                        key={docType.id}
                        className="px-4 py-3 border-t border-border/50 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Document Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <File className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground">{docType.name}</span>
                              {docType.required && (
                                <Badge variant="destructive" className="text-xs h-4 px-1.5">
                                  Required
                                </Badge>
                              )}
                              {docType.description && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-xs">
                                      <p className="text-xs">{docType.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>

                          {/* Status & Actions */}
                          <div className="flex items-center gap-3">
                            {/* Upload Status */}
                            {status === 'uploaded' && (
                              <div className="flex items-center gap-1.5 text-success">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">Uploaded</span>
                              </div>
                            )}

                            {status === 'error' && (
                              <div className="flex items-center gap-1.5 text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-xs font-medium">Failed</span>
                              </div>
                            )}

                            {isUploading && (
                              <div className="flex items-center gap-1.5 text-primary">
                                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs font-medium">Uploading...</span>
                              </div>
                            )}

                            {/* Upload Button */}
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
                                    title: "✅ Upload Complete",
                                    description: `${docType.name} uploaded successfully`,
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
                                    description: error || "Please try again",
                                    variant: "destructive",
                                  });
                                }}
                                disabled={isUploading || !leadId}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Empty State */}
      {documentTypes.length === 0 && (
        <EnhancedEmptyState
          variant="no-data"
          icon={FileText}
          title="No Documents Required Yet"
          description="Your document checklist will appear here once your application is submitted."
          supportingText="Don't worry - we'll guide you through exactly what documents you need to upload."
          className="my-8"
        />
      )}
    </div>
  );
};