import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Upload, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileText,
  User,
  Shield,
  Bot,
  AlertTriangle
} from 'lucide-react';
import { useLeadDocuments } from '@/hooks/useLeadDocuments';
import { useDocumentTypes } from '@/hooks/useDocumentTypes';
import { DocumentVerificationModal } from './DocumentVerificationModal';
import { AdminDocumentUpload } from './AdminDocumentUpload';

interface AdminDocumentManagerProps {
  leadId: string;
}

interface LeadDocument {
  id: string;
  original_filename: string;
  file_path: string;
  document_type_id: string;
  uploaded_by?: string;
  verification_status?: string;
  admin_notes?: string;
  verified_by?: string;
  ai_validation_status?: string;
  ai_detected_type?: string;
  ai_confidence_score?: number;
  ai_quality_assessment?: string;
  ai_validation_notes?: string;
  document_types?: {
    name: string;
    category: string;
  };
}

export function AdminDocumentManager({ leadId }: AdminDocumentManagerProps) {
  const { documents, loading, refetch, deleteDocument, getDownloadUrl } = useLeadDocuments(leadId);
  const { documentTypes } = useDocumentTypes();
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LeadDocument | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const handleDownload = async (document: LeadDocument) => {
    try {
      const url = await getDownloadUrl(document.file_path);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = document.original_filename;
      link.click();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleVerificationAction = (document: LeadDocument) => {
    setSelectedDocument(document);
    setVerificationModalOpen(true);
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-success text-success-foreground">Verified</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive text-destructive-foreground">Rejected</Badge>;
      case 'uploaded':
        return <Badge className="bg-blue-500 text-white">Uploaded</Badge>;
      case 'resubmission_required':
        return <Badge className="bg-yellow-500 text-white">Resubmission Required</Badge>;
      default:
        return <Badge variant="outline" className="bg-warning text-warning-foreground">Pending</Badge>;
    }
  };

  const getVerificationIcon = (status: string) => {
    switch (status) {
      case 'verified': return CheckCircle;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  const getUploadedByIcon = (uploadedBy: string) => {
    return uploadedBy === 'admin' ? Shield : User;
  };

  const getAIStatusBadge = (document: LeadDocument) => {
    if (!document.ai_validation_status || document.ai_validation_status === 'pending') {
      return null;
    }
    
    if (document.ai_validation_status === 'validated') {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-300 text-[10px] px-1.5 py-0 h-5">
          <Bot className="h-3 w-3 mr-1" />
          AI OK
        </Badge>
      );
    }
    
    if (document.ai_validation_status === 'rejected') {
      return (
        <Badge className="bg-red-500/10 text-red-600 border-red-300 text-[10px] px-1.5 py-0 h-5">
          <Bot className="h-3 w-3 mr-1" />
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-amber-500/10 text-amber-600 border-amber-300 text-[10px] px-1.5 py-0 h-5">
        <Bot className="h-3 w-3 mr-1" />
        <AlertTriangle className="h-3 w-3 mr-1" />
        Review
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-4">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Upload New Document Button */}
      <div className="flex justify-between items-center p-6 bg-gradient-to-r from-primary/5 to-background rounded-lg border animate-fade-in">
        <div>
          <h3 className="text-xl font-semibold">Document Management</h3>
          <p className="text-sm text-muted-foreground mt-1">Upload and verify student documents</p>
        </div>
        <Button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-2 hover-lift"
        >
          <Upload className="h-4 w-4" />
          Upload for Student
        </Button>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {documents.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">No documents uploaded yet</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          documents.map((document: LeadDocument, index: number) => {
            const VerificationIcon = getVerificationIcon(document.verification_status || 'pending');
            const UploadedByIcon = getUploadedByIcon(document.uploaded_by || 'student');
            const isAIFlagged = document.ai_validation_status === 'manual_review' || document.ai_validation_status === 'rejected';
            
            return (
              <Card 
                key={document.id} 
                className={`hover-lift transition-all stagger-fade-${Math.min(index + 1, 4) as 1 | 2 | 3 | 4} ${
                  isAIFlagged ? 'border-amber-300 dark:border-amber-700' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`p-2 rounded-lg ${
                        document.verification_status === 'verified' ? 'bg-success/10' :
                        document.verification_status === 'rejected' ? 'bg-destructive/10' :
                        isAIFlagged ? 'bg-amber-500/10' :
                        'bg-warning/10'
                      }`}>
                        {isAIFlagged ? (
                          <Bot className="h-5 w-5 text-amber-500" />
                        ) : (
                          <VerificationIcon className={`h-5 w-5 ${
                            document.verification_status === 'verified' ? 'text-success' :
                            document.verification_status === 'rejected' ? 'text-destructive' :
                            'text-warning'
                          }`} />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-semibold text-base">{document.original_filename}</span>
                          <UploadedByIcon className="h-4 w-4 text-muted-foreground" />
                          {document.uploaded_by === 'admin' && (
                            <Badge variant="outline" className="text-xs">Admin Upload</Badge>
                          )}
                          {getAIStatusBadge(document)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-1">
                          {document.document_types?.name} • {document.document_types?.category}
                        </div>

                        {/* AI Details - compact inline */}
                        {isAIFlagged && (
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                            {document.ai_detected_type && (
                              <span className="font-medium">{document.ai_detected_type}</span>
                            )}
                            {document.ai_confidence_score != null && (
                              <Badge variant="outline" className={`text-[10px] py-0 h-4 ${
                                document.ai_confidence_score >= 75 ? "text-green-600 border-green-300" :
                                document.ai_confidence_score >= 50 ? "text-amber-600 border-amber-300" :
                                "text-red-600 border-red-300"
                              }`}>
                                {document.ai_confidence_score}%
                              </Badge>
                            )}
                            {document.ai_validation_notes && (
                              <span className="text-amber-600 dark:text-amber-400">• {document.ai_validation_notes}</span>
                            )}
                          </div>
                        )}
                        
                        {document.admin_notes && (
                          <div className="text-xs text-muted-foreground mt-2 p-2 bg-muted/50 rounded italic">
                            Admin notes: {document.admin_notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {getVerificationBadge(document.verification_status || 'pending')}
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(document)}
                          className="hover-lift"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant={isAIFlagged ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleVerificationAction(document)}
                          title="Update Status"
                          className={isAIFlagged ? "bg-amber-500 hover:bg-amber-600" : "hover-lift"}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Verification Modal */}
      <DocumentVerificationModal
        open={verificationModalOpen}
        onOpenChange={setVerificationModalOpen}
        document={selectedDocument}
        onVerificationComplete={refetch}
      />

      {/* Upload Modal */}
      <AdminDocumentUpload
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        leadId={leadId}
        onUploadComplete={refetch}
      />
    </div>
  );
}