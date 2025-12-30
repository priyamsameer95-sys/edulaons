/**
 * Document Preview Modal with Inline Verification
 * 
 * Per Knowledge Base:
 * - Audit document views for admin
 * - Accept/reject actions directly in preview
 * - Every doc change must log: uploader role, status change role, reason (mandatory for reject)
 */
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAccessLogger } from '@/hooks/useAccessLogger';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Bot, 
  Download, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  AlertTriangle,
  Sparkles,
  Eye
} from 'lucide-react';

interface DocumentData {
  id: string;
  lead_id: string;
  original_filename: string;
  verification_status?: string;
  ai_validation_status?: string;
  ai_validation_notes?: string;
  ai_confidence_score?: number;
  ai_detected_type?: string;
  ai_quality_assessment?: string;
  document_types?: {
    name: string;
    category: string;
  } | null;
}

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewUrl: string | null;
  fileName?: string;
  leadId?: string;
  documentId?: string;
  document?: DocumentData;
  onVerificationComplete?: () => void;
  showVerificationActions?: boolean;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  previewUrl,
  fileName,
  leadId,
  documentId,
  document,
  onVerificationComplete,
  showVerificationActions = true,
}: DocumentPreviewModalProps) {
  const { logDocumentPreview } = useAccessLogger();
  const { logDocumentChange } = useAuditLog();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Audit log when preview opens
  useEffect(() => {
    if (open && leadId && documentId) {
      logDocumentPreview(leadId, documentId);
    }
  }, [open, leadId, documentId, logDocumentPreview]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setRejectReason('');
      setShowRejectForm(false);
      setZoom(1);
      setRotation(0);
    }
  }, [open]);

  const currentStatus = document?.verification_status || 'pending';
  const hasAISuggestion = document?.ai_validation_status && document.ai_validation_status !== 'pending';

  const handleVerify = async () => {
    if (!document) return;
    
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('lead_documents')
        .update({
          verification_status: 'verified',
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', document.id);

      if (error) throw error;

      // Audit log
      await logDocumentChange({
        documentId: document.id,
        leadId: document.lead_id,
        action: 'verify',
        oldStatus: currentStatus,
        newStatus: 'verified',
      });

      toast({
        title: 'Document Verified',
        description: 'Document has been verified successfully',
      });

      onVerificationComplete?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error verifying document:', err);
      toast({
        title: 'Error',
        description: 'Failed to verify document',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!document) return;
    
    if (!rejectReason.trim()) {
      toast({
        title: 'Reason Required',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('lead_documents')
        .update({
          verification_status: 'rejected',
          verification_notes: rejectReason.trim(),
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq('id', document.id);

      if (error) throw error;

      // Audit log with mandatory reason
      await logDocumentChange({
        documentId: document.id,
        leadId: document.lead_id,
        action: 'reject',
        oldStatus: currentStatus,
        newStatus: 'rejected',
        reason: rejectReason.trim(),
      });

      toast({
        title: 'Document Rejected',
        description: 'Document has been rejected',
      });

      onVerificationComplete?.();
      onOpenChange(false);
    } catch (err) {
      console.error('Error rejecting document:', err);
      toast({
        title: 'Error',
        description: 'Failed to reject document',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptAISuggestion = async () => {
    if (!document) return;

    if (document.ai_validation_status === 'validated') {
      await handleVerify();
    } else if (document.ai_validation_status === 'rejected') {
      setRejectReason(document.ai_validation_notes || 'AI flagged issues');
      setShowRejectForm(true);
    }
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30">
            <CheckCircle className="h-3 w-3 mr-1" /> Verified
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/30">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
    }
  };

  if (!previewUrl) return null;

  const displayName = document?.document_types?.name || fileName || 'Document Preview';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0 flex-1">
              <DialogTitle className="text-base font-semibold truncate pr-8">
                {displayName}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge()}
                {document?.document_types?.category && (
                  <Badge variant="outline" className="text-xs">
                    {document.document_types.category}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  View logged
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* AI Analysis Panel */}
        {hasAISuggestion && showVerificationActions && currentStatus === 'pending' && (
          <div className="flex-shrink-0 p-3 bg-muted/50 rounded-lg border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">AI Analysis</span>
              </div>
              
              {document.ai_validation_status === 'validated' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />Looks Good
                </Badge>
              )}
              {document.ai_validation_status === 'rejected' && (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                  <XCircle className="h-3 w-3 mr-1" />Issues Found
                </Badge>
              )}
              {document.ai_validation_status === 'manual_review' && (
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />Needs Review
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {document.ai_detected_type && (
                <span>Detected: {document.ai_detected_type}</span>
              )}
              {document.ai_confidence_score != null && (
                <Badge variant="outline" className={`text-xs ${
                  document.ai_confidence_score >= 75 ? "bg-green-50 text-green-700" :
                  document.ai_confidence_score >= 50 ? "bg-amber-50 text-amber-700" :
                  "bg-red-50 text-red-700"
                }`}>
                  {document.ai_confidence_score}% confidence
                </Badge>
              )}
            </div>

            {document.ai_validation_notes && (
              <p className="text-xs text-muted-foreground italic">
                "{document.ai_validation_notes}"
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={handleAcceptAISuggestion}
              disabled={loading}
              className="w-full"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              Accept AI Suggestion
            </Button>
          </div>
        )}

        {/* Image controls */}
        <div className="flex-shrink-0 flex items-center justify-center gap-2 py-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(z => Math.min(3, z + 0.25))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRotation(r => (r + 90) % 360)}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(previewUrl, '_blank')}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Image preview */}
        <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 min-h-[300px]">
          <img 
            src={previewUrl} 
            alt="Document preview" 
            className="max-w-full object-contain transition-transform duration-200"
            style={{ 
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              maxHeight: '60vh',
            }}
          />
        </div>

        {/* Reject reason form */}
        {showRejectForm && (
          <div className="flex-shrink-0 space-y-2 pt-3 border-t">
            <Label htmlFor="reject-reason" className="text-destructive text-sm">
              Reason for Rejection *
            </Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this document is being rejected..."
              className="min-h-[60px] text-sm border-destructive/50"
              required
            />
          </div>
        )}

        {/* Footer with actions */}
        {showVerificationActions && currentStatus === 'pending' && (
          <DialogFooter className="flex-shrink-0 gap-2 pt-3 border-t sm:justify-between">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Close
            </Button>
            
            <div className="flex gap-2">
              {!showRejectForm ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowRejectForm(true)}
                    disabled={loading}
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    onClick={handleVerify}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verify
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectReason('');
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={loading || !rejectReason.trim()}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Confirm Reject
                  </Button>
                </>
              )}
            </div>
          </DialogFooter>
        )}

        {/* Already verified/rejected - just show close */}
        {(!showVerificationActions || currentStatus !== 'pending') && (
          <DialogFooter className="flex-shrink-0 pt-3 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
