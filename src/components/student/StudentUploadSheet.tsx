/**
 * Student Upload Sheet
 * 
 * Desktop-first right-side sheet for AI-powered document upload.
 * Includes progress tracking, smart upload, and document status lists.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Shield } from 'lucide-react';
import StudentSmartUpload from './StudentSmartUpload';
import UploadProgressCard from './UploadProgressCard';
import DocumentStatusList from './DocumentStatusList';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  required: boolean;
  description: string | null;
}

interface UploadedDoc {
  id: string;
  document_type_id: string;
  verification_status: string;
  original_filename: string;
}

interface StudentUploadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  studentName?: string;
  coApplicantName?: string;
  onUploadComplete?: () => void;
}

// Student-uploadable categories
const STUDENT_CATEGORIES = ['KYC', 'Academic', 'Financial', 'Co-Applicant'];

const StudentUploadSheet = ({
  open,
  onOpenChange,
  leadId,
  studentName,
  coApplicantName,
  onUploadComplete,
}: StudentUploadSheetProps) => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const selectPortalRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    if (!leadId) return;

    try {
      const [typesRes, docsRes] = await Promise.all([
        supabase
          .from('document_types')
          .select('id, name, category, required, description')
          .order('display_order', { ascending: true }),
        supabase
          .from('lead_documents')
          .select('id, document_type_id, verification_status, original_filename')
          .eq('lead_id', leadId)
      ]);

      if (typesRes.data) {
        // Filter to student-uploadable categories
        const filtered = typesRes.data.filter(dt => STUDENT_CATEGORIES.includes(dt.category));
        setDocumentTypes(filtered);
      }
      if (docsRes.data) {
        setUploadedDocs(docsRes.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, fetchData]);

  const handleUploadSuccess = useCallback(() => {
    fetchData();
    onUploadComplete?.();
  }, [fetchData, onUploadComplete]);

  // Calculate stats
  const requiredDocs = documentTypes.filter(d => d.required);
  const getDocStatus = (typeId: string): 'required' | 'pending' | 'uploaded' | 'verified' | 'rejected' | 'resubmission_required' => {
    const doc = uploadedDocs.find(d => d.document_type_id === typeId);
    if (!doc) return 'required';
    if (doc.verification_status === 'verified') return 'verified';
    if (doc.verification_status === 'rejected') return 'rejected';
    if (doc.verification_status === 'resubmission_required') return 'resubmission_required';
    if (doc.verification_status === 'uploaded') return 'uploaded';
    return 'pending';
  };

  const uploadedCount = requiredDocs.filter(d => {
    const status = getDocStatus(d.id);
    return status === 'pending' || status === 'uploaded' || status === 'verified';
  }).length;
  const verifiedCount = requiredDocs.filter(d => getDocStatus(d.id) === 'verified').length;
  const rejectedCount = requiredDocs.filter(d => {
    const status = getDocStatus(d.id);
    return status === 'rejected' || status === 'resubmission_required';
  }).length;

  // Build document lists
  const uploadedDocsList = requiredDocs
    .filter(d => {
      const status = getDocStatus(d.id);
      return status === 'pending' || status === 'uploaded' || status === 'verified';
    })
    .map(d => {
      const uploadedDoc = uploadedDocs.find(u => u.document_type_id === d.id);
      return {
        id: d.id,
        name: d.name,
        status: getDocStatus(d.id),
        filename: uploadedDoc?.original_filename,
      };
    });

  const pendingDocsList = requiredDocs
    .filter(d => {
      const status = getDocStatus(d.id);
      return status === 'required' || status === 'rejected' || status === 'resubmission_required';
    })
    .map(d => ({
      id: d.id,
      name: d.name,
      status: getDocStatus(d.id),
    }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl p-0 flex flex-col"
      >
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <SheetTitle className="text-lg font-semibold">
            Upload Documents
          </SheetTitle>
        </SheetHeader>

        {/* Portal container for dropdowns inside the sheet (avoids ScrollArea clipping & modal pointer-events issues) */}
        <div ref={selectPortalRef} className="relative z-50" />

        <ScrollArea className="flex-1">
          <div className="px-6 py-6 space-y-6">
            {/* Progress Card */}
            {!loading && (
              <UploadProgressCard
                uploadedCount={uploadedCount}
                totalCount={requiredDocs.length}
                verifiedCount={verifiedCount}
                rejectedCount={rejectedCount}
              />
            )}

            {/* Smart Upload */}
            <StudentSmartUpload
              leadId={leadId}
              documentTypes={documentTypes}
              onUploadSuccess={handleUploadSuccess}
              studentName={studentName}
              coApplicantName={coApplicantName}
              uploadedDocuments={uploadedDocs}
              selectPortalContainer={selectPortalRef.current}
            />

            {!loading && (
              <div className="space-y-4">
                {uploadedDocsList.length > 0 && (
                  <DocumentStatusList
                    title="Already Uploaded"
                    documents={uploadedDocsList}
                    variant="uploaded"
                    defaultExpanded={false}
                  />
                )}

                {pendingDocsList.length > 0 && (
                  <DocumentStatusList
                    title="Still Needed"
                    documents={pendingDocsList}
                    variant="pending"
                    defaultExpanded={true}
                  />
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Trust Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/30 shrink-0">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Your documents are encrypted and shared only with verified lenders</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StudentUploadSheet;
