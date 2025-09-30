import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, CheckCircle, XCircle, Download, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

interface PendingDocument {
  id: string;
  lead_id: string;
  case_id: string;
  student_name: string;
  partner_name: string;
  original_filename: string;
  file_path: string;
  uploaded_at: string;
  document_type_name: string;
  document_category: string;
}

export function DocumentVerificationQueue() {
  const [pendingDocs, setPendingDocs] = useState<PendingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingDocuments();
    
    // Real-time subscription
    const channel = supabase
      .channel('verification_queue')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lead_documents'
        },
        () => fetchPendingDocuments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPendingDocuments = async () => {
    try {
      const { data: documents } = await supabase
        .from('lead_documents')
        .select(`
          id,
          lead_id,
          original_filename,
          file_path,
          uploaded_at,
          document_types(name, category)
        `)
        .eq('verification_status', 'pending')
        .order('uploaded_at', { ascending: false });

      if (!documents || documents.length === 0) {
        setPendingDocs([]);
        setLoading(false);
        return;
      }

      const leadIds = [...new Set(documents.map(d => d.lead_id))];
      const { data: leads } = await supabase
        .from('leads_new')
        .select(`
          id,
          case_id,
          students(name),
          partners(name)
        `)
        .in('id', leadIds);

      const leadMap = new Map(leads?.map(l => [l.id, l]) || []);

      const formatted = documents.map(doc => {
        const lead = leadMap.get(doc.lead_id);
        return {
          id: doc.id,
          lead_id: doc.lead_id,
          case_id: lead?.case_id || 'Unknown',
          student_name: (lead?.students as any)?.name || 'Unknown',
          partner_name: (lead?.partners as any)?.name || 'Unknown',
          original_filename: doc.original_filename,
          file_path: doc.file_path,
          uploaded_at: doc.uploaded_at,
          document_type_name: (doc.document_types as any)?.name || 'Unknown',
          document_category: (doc.document_types as any)?.category || 'Other'
        };
      });

      setPendingDocs(formatted);
    } catch (error) {
      console.error('Error fetching pending documents:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch verification queue'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (docId: string) => {
    setActionLoading(docId);
    try {
      const { error } = await supabase
        .from('lead_documents')
        .update({
          verification_status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          admin_notes: notes[docId] || null
        })
        .eq('id', docId);

      if (error) throw error;

      toast({
        title: 'Document Verified',
        description: 'Document has been successfully verified'
      });

      fetchPendingDocuments();
      setNotes(prev => {
        const updated = { ...prev };
        delete updated[docId];
        return updated;
      });
    } catch (error) {
      console.error('Error verifying document:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to verify document'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (docId: string) => {
    if (!notes[docId]?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Rejection Reason Required',
        description: 'Please provide a reason for rejecting this document'
      });
      return;
    }

    setActionLoading(docId);
    try {
      const { error } = await supabase
        .from('lead_documents')
        .update({
          verification_status: 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id,
          admin_notes: notes[docId]
        })
        .eq('id', docId);

      if (error) throw error;

      toast({
        title: 'Document Rejected',
        description: 'Document has been rejected with notes'
      });

      fetchPendingDocuments();
      setNotes(prev => {
        const updated = { ...prev };
        delete updated[docId];
        return updated;
      });
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject document'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownload = async (filePath: string, filename: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('lead-documents')
        .createSignedUrl(filePath, 3600);

      if (error) throw error;

      window.open(data.signedUrl, '_blank');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download document'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Verification Queue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Verification Queue
          <Badge variant="secondary" className="ml-auto">{pendingDocs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-4">
            {pendingDocs.map(doc => (
              <Card key={doc.id} className="border-warning/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="font-medium">{doc.original_filename}</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <Badge variant="outline">{doc.document_type_name}</Badge>
                        <span>•</span>
                        <span>Case #{doc.case_id.slice(0, 8)}</span>
                        <span>•</span>
                        <span>{doc.student_name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Uploaded {formatDistanceToNow(new Date(doc.uploaded_at), { addSuffix: true })}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc.file_path, doc.original_filename)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>

                  <Textarea
                    placeholder="Add verification notes (required for rejection)"
                    value={notes[doc.id] || ''}
                    onChange={(e) => setNotes(prev => ({ ...prev, [doc.id]: e.target.value }))}
                    className="min-h-[60px]"
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleVerify(doc.id)}
                      disabled={actionLoading === doc.id}
                      className="flex-1 gap-2"
                      variant="default"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Verify
                    </Button>
                    <Button
                      onClick={() => handleReject(doc.id)}
                      disabled={actionLoading === doc.id}
                      className="flex-1 gap-2"
                      variant="destructive"
                    >
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {pendingDocs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm">No documents pending verification</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}