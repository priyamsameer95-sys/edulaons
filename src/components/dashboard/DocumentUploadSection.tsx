import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { EnhancedDocumentUpload } from "@/components/ui/enhanced-document-upload";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDocumentTypes } from "@/hooks/useDocumentTypes";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Upload, 
  Check, 
  AlertCircle, 
  File, 
  ChevronDown, 
  User, 
  Users, 
  Building,
  Globe
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
    student: true,
    financial_co_applicant: true,
    nri_financial: false,
    non_financial_co_applicant: false,
    collateral: loanType === 'secured'
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
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Document Collection</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upload documents organized by category
              </p>
            </div>
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

      {/* Documents by Category */}
      <div className="p-8 space-y-6">
        {visibleCategories.map((category) => {
          const categoryDocs = documentsByCategory[category.id] || [];
          if (categoryDocs.length === 0) return null;

          const CategoryIcon = category.icon;
          const categoryRequiredDocs = categoryDocs.filter(doc => doc.required);
          const categoryUploadedDocs = categoryRequiredDocs.filter(doc => 
            getDocumentStatus(doc.id) === 'uploaded'
          );
          const categoryProgress = categoryRequiredDocs.length > 0
            ? (categoryUploadedDocs.length / categoryRequiredDocs.length) * 100
            : 100;

          return (
            <Collapsible
              key={category.id}
              open={openCategories[category.id]}
              onOpenChange={() => toggleCategory(category.id)}
            >
              <Card className="shadow-lg border-border/20 bg-card/80 backdrop-blur-sm">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-4 cursor-pointer hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <CategoryIcon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {category.name}
                            {category.conditional && (
                              <Badge variant="outline" className="text-xs">
                                {category.id === 'collateral' ? 'Secured Loan' : 'Optional'}
                              </Badge>
                            )}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {categoryRequiredDocs.length > 0 && (
                          <Badge 
                            variant={categoryProgress === 100 ? "default" : "secondary"}
                            className="px-3 py-1"
                          >
                            {categoryUploadedDocs.length}/{categoryRequiredDocs.length} Required
                          </Badge>
                        )}
                        <ChevronDown 
                          className={cn(
                            "h-5 w-5 transition-transform text-muted-foreground",
                            openCategories[category.id] && "transform rotate-180"
                          )} 
                        />
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-6 pt-0">
                    {categoryDocs.map((docType) => {
                      const status = getDocumentStatus(docType.id);
                      const isUploading = uploading.includes(docType.id);
                      
                      return (
                        <div 
                          key={docType.id} 
                          className="border border-border/50 rounded-xl p-6 bg-card/50 hover:bg-card transition-colors"
                        >
                          {/* Document Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10">
                                <File className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <h3 className="text-base font-semibold text-foreground">{docType.name}</h3>
                                {docType.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{docType.description}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {docType.required && (
                                <Badge variant="destructive" className="px-3 py-1 text-xs">
                                  Required
                                </Badge>
                              )}
                              
                              {/* Status Indicator */}
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
                            <div className="p-4 rounded-xl border-2 border-success/30 bg-gradient-to-r from-success/10 to-success/5">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-success/20">
                                  <Check className="h-5 w-5 text-success" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-success">Document verified and ready!</h4>
                                  <p className="text-xs text-success/90 mt-1">Successfully uploaded and processed</p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Error State */}
                          {status === 'error' && (
                            <div className="p-4 rounded-xl border-2 border-destructive/30 bg-gradient-to-r from-destructive/10 to-destructive/5">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-destructive/20">
                                  <AlertCircle className="h-5 w-5 text-destructive" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-destructive">Upload needs attention</h4>
                                  <p className="text-xs text-destructive/90 mt-1">Please try uploading again</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
        
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