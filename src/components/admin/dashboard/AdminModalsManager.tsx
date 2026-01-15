import React from 'react';
import { PaginatedLead } from '@/hooks/usePaginatedLeads';
import { LeadDetailSheet } from '@/components/dashboard/LeadDetailSheet';
import { StatusUpdateSheet } from '@/components/admin/StatusUpdateSheet';
import { BulkStatusUpdate } from '@/components/lead-status/BulkStatusUpdate';
import { DocumentVerificationModal } from '@/components/admin/DocumentVerificationModal';
import { AdminNewLeadModal } from '@/components/admin/AdminNewLeadModal';
import { CompleteLeadModal } from '@/components/partner/CompleteLeadModal';
import { CommandPalette } from '@/components/admin/CommandPalette';

interface Partner {
  id: string;
  name: string;
  partner_code: string;
}

interface ModalState {
  leadDetail: boolean;
  statusUpdate: boolean;
  bulkStatus: boolean;
  docVerification: boolean;
  newLead: boolean;
  commandPalette: boolean;
  completeLead: boolean;
}

interface AdminModalsManagerProps {
  modals: ModalState;
  selectedLead: PaginatedLead | null;
  selectedLeads: string[];
  selectedDocument: any;
  allPartners: Partner[];
  leads: PaginatedLead[];
  defaultPartnerId?: string | null;

  // Callbacks
  onCloseModal: (modal: keyof ModalState) => void;
  onStatusUpdated: () => void;
  onBulkStatusComplete: () => void;
  onDocVerificationComplete: () => void;
  onNewLeadSuccess: () => void;
  onLeadCompleted: () => void;
  onOpenNewLead: () => void;
  onSelectLead: (leadId: string) => void;
  onSelectPartner: (partnerId: string) => void;
}

export const AdminModalsManager = React.memo(function AdminModalsManager({
  modals,
  selectedLead,
  selectedLeads,
  selectedDocument,
  allPartners,
  leads,
  defaultPartnerId,
  onCloseModal,
  onStatusUpdated,
  onBulkStatusComplete,
  onDocVerificationComplete,
  onNewLeadSuccess,
  onLeadCompleted,
  onOpenNewLead,
  onSelectLead,
  onSelectPartner,
}: AdminModalsManagerProps) {
  return (
    <>
      {/* Command Palette */}
      <CommandPalette
        open={modals.commandPalette}
        onOpenChange={(open) => !open && onCloseModal('commandPalette')}
        onNewLead={onOpenNewLead}
        onSelectLead={onSelectLead}
        onSelectPartner={onSelectPartner}
      />

      {/* Lead Detail & Status Update - only render when lead is selected */}
      {selectedLead && (
        <>
          <LeadDetailSheet
            open={modals.leadDetail}
            onOpenChange={(open) => !open && onCloseModal('leadDetail')}
            lead={selectedLead as any}
            onLeadUpdated={onStatusUpdated}
          />
          <StatusUpdateSheet
            open={modals.statusUpdate}
            onOpenChange={(open) => !open && onCloseModal('statusUpdate')}
            leadId={selectedLead.id}
            studentName={selectedLead.student?.name}
            currentStatus={selectedLead.status as any}
            currentDocumentsStatus={selectedLead.documents_status as any}
            stageStartedAt={selectedLead.current_stage_started_at}
            onStatusUpdated={onStatusUpdated}
          />
        </>
      )}

      {/* Bulk Status Update Modal */}
      <BulkStatusUpdate
        open={modals.bulkStatus}
        onOpenChange={(open) => !open && onCloseModal('bulkStatus')}
        leadIds={selectedLeads}
        onStatusUpdated={onBulkStatusComplete}
      />

      {/* Document Verification Modal */}
      {modals.docVerification && selectedDocument && (
        <DocumentVerificationModal
          open={modals.docVerification}
          onOpenChange={(open) => !open && onCloseModal('docVerification')}
          document={selectedDocument}
          onVerificationComplete={onDocVerificationComplete}
        />
      )}

      {/* Admin New Lead Modal */}
      <AdminNewLeadModal
        open={modals.newLead}
        onOpenChange={(open) => !open && onCloseModal('newLead')}
        onSuccess={onNewLeadSuccess}
        partners={allPartners ?? []}
        defaultPartnerId={defaultPartnerId}
      />

      {/* Complete Lead Modal for Quick Leads */}
      <CompleteLeadModal
        open={modals.completeLead}
        onClose={() => onCloseModal('completeLead')}
        lead={selectedLead as any}
        onSuccess={onLeadCompleted}
      />
    </>
  );
});
