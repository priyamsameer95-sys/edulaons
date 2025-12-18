import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusSelect } from '@/components/lead-status/StatusSelect';
import { PipelineSelector } from './status-update/PipelineSelector';
import { ConditionalFields } from './status-update/ConditionalFields';
import { StatusTransitionPreview } from './status-update/StatusTransitionPreview';
import { useStatusManager } from '@/hooks/useStatusManager';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle } from 'lucide-react';
import { LeadStatusExtended } from '@/constants/processFlow';
import { parseFormattedNumber } from '@/utils/currencyFormatter';
import { REASON_CODE_GROUPS } from '@/constants/reasonCodes';
import type { DocumentStatus } from '@/utils/statusUtils';

interface StatusUpdateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  studentName?: string;
  currentStatus: LeadStatusExtended;
  currentDocumentsStatus: DocumentStatus;
  stageStartedAt?: Date | string | null;
  onStatusUpdated?: () => void;
}

export function StatusUpdateSheet({
  open,
  onOpenChange,
  leadId,
  studentName,
  currentStatus,
  currentDocumentsStatus,
  stageStartedAt,
  onStatusUpdated
}: StatusUpdateSheetProps) {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatusExtended>(currentStatus);
  const [selectedDocumentsStatus, setSelectedDocumentsStatus] = useState<DocumentStatus>(currentDocumentsStatus);
  const [reasonCode, setReasonCode] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [conditionalValues, setConditionalValues] = useState<{
    lanNumber?: string;
    sanctionAmount?: string;
    sanctionDate?: Date;
    pdScheduledAt?: Date;
    pfAmount?: string;
    pfPaidAt?: Date;
    propertyVerificationStatus?: string;
  }>({});

  const { updateLeadStatus, loading } = useStatusManager();
  const { appUser } = useAuth();
  
  const isAdmin = appUser?.role === 'admin' || appUser?.role === 'super_admin';
  const NOTES_MIN_LENGTH = 10;
  const NOTES_MAX_LENGTH = 150;

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedStatus(currentStatus);
      setSelectedDocumentsStatus(currentDocumentsStatus);
      setReasonCode('');
      setNotes('');
      setValidationError(null);
      setConditionalValues({});
    }
  }, [open, currentStatus, currentDocumentsStatus]);

  const validateForm = (): boolean => {
    setValidationError(null);

    const statusChanged = selectedStatus !== currentStatus;
    const documentsStatusChanged = selectedDocumentsStatus !== currentDocumentsStatus;
    
    if (!statusChanged && !documentsStatusChanged) {
      setValidationError('Please make at least one status change before submitting.');
      return false;
    }

    // Validate admin notes requirement
    if (isAdmin) {
      const notesLength = notes.trim().length;
      if (notesLength < NOTES_MIN_LENGTH) {
        setValidationError(`Admin notes are required. Please provide at least ${NOTES_MIN_LENGTH} characters.`);
        return false;
      }
      if (notesLength > NOTES_MAX_LENGTH) {
        setValidationError(`Admin notes are too long. Maximum ${NOTES_MAX_LENGTH} characters allowed.`);
        return false;
      }
    }

    // Validate conditional fields
    if (selectedStatus === 'logged_with_lender' && !conditionalValues.lanNumber?.trim()) {
      setValidationError('LAN Number is required for this status.');
      return false;
    }

    if (selectedStatus === 'sanctioned') {
      if (!conditionalValues.sanctionAmount) {
        setValidationError('Sanction amount is required.');
        return false;
      }
      if (!conditionalValues.sanctionDate) {
        setValidationError('Sanction date is required.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Prepare additional data for the status update
    const additionalData: Record<string, unknown> = {};
    
    if (conditionalValues.lanNumber) {
      additionalData.lan_number = conditionalValues.lanNumber;
    }
    if (conditionalValues.sanctionAmount) {
      additionalData.sanction_amount = parseFormattedNumber(conditionalValues.sanctionAmount);
    }
    if (conditionalValues.sanctionDate) {
      additionalData.sanction_date = conditionalValues.sanctionDate.toISOString();
    }
    if (conditionalValues.pdScheduledAt) {
      additionalData.pd_call_scheduled_at = conditionalValues.pdScheduledAt.toISOString();
    }
    if (conditionalValues.pfAmount) {
      additionalData.pf_amount = parseFormattedNumber(conditionalValues.pfAmount);
    }
    if (conditionalValues.pfPaidAt) {
      additionalData.pf_paid_at = conditionalValues.pfPaidAt.toISOString();
    }
    if (conditionalValues.propertyVerificationStatus) {
      additionalData.property_verification_status = conditionalValues.propertyVerificationStatus;
    }

    const success = await updateLeadStatus({
      leadId,
      newStatus: selectedStatus !== currentStatus ? selectedStatus : undefined,
      newDocumentsStatus: selectedDocumentsStatus !== currentDocumentsStatus ? selectedDocumentsStatus : undefined,
      reason: reasonCode || undefined,
      reasonCode: reasonCode || undefined,
      notes: notes.trim() || undefined,
      additionalData: Object.keys(additionalData).length > 0 ? additionalData : undefined,
    });

    if (success) {
      onOpenChange(false);
      onStatusUpdated?.();
    }
  };

  const notesLength = notes.trim().length;
  const isNotesValid = !isAdmin || (notesLength >= NOTES_MIN_LENGTH && notesLength <= NOTES_MAX_LENGTH);
  const hasChanges = selectedStatus !== currentStatus || selectedDocumentsStatus !== currentDocumentsStatus;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>
            Update Lead Status
            {studentName && <span className="text-muted-foreground font-normal ml-2">• {studentName}</span>}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}

            {/* Status Transition Preview */}
            <StatusTransitionPreview
              currentStatus={currentStatus}
              selectedStatus={selectedStatus}
              stageStartedAt={stageStartedAt}
            />

            <Separator />

            {/* Visual Pipeline Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Select New Status</Label>
              <PipelineSelector
                currentStatus={currentStatus}
                selectedStatus={selectedStatus}
                onSelectStatus={setSelectedStatus}
                isAdmin={isAdmin}
              />
            </div>

            {/* Conditional Fields */}
            <ConditionalFields
              selectedStatus={selectedStatus}
              values={conditionalValues}
              onChange={setConditionalValues}
            />

            <Separator />

            {/* Documents Status */}
            <div className="space-y-2">
              <Label className="text-sm">Documents Status</Label>
              <StatusSelect
                value={selectedDocumentsStatus}
                onChange={(value) => setSelectedDocumentsStatus(value as DocumentStatus)}
                type="document"
                currentStatus={currentDocumentsStatus}
                isAdmin={isAdmin}
              />
            </div>

            {/* Reason - Quick Select Dropdown */}
            <div className="space-y-2">
              <Label className="text-sm">Reason for Change</Label>
              <Select value={reasonCode} onValueChange={setReasonCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{REASON_CODE_GROUPS.positive.label}</SelectLabel>
                    {REASON_CODE_GROUPS.positive.codes.map((code) => (
                      <SelectItem key={code.value} value={code.value}>
                        {code.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>{REASON_CODE_GROUPS.drop_off.label}</SelectLabel>
                    {REASON_CODE_GROUPS.drop_off.codes.map((code) => (
                      <SelectItem key={code.value} value={code.value}>
                        {code.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>{REASON_CODE_GROUPS.neutral.label}</SelectLabel>
                    {REASON_CODE_GROUPS.neutral.codes.map((code) => (
                      <SelectItem key={code.value} value={code.value}>
                        {code.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Admin Notes */}
            <div className="space-y-2">
              <Label className="text-sm">
                {isAdmin ? 'Admin Notes *' : 'Additional Notes'}
              </Label>
              <Textarea
                placeholder={isAdmin 
                  ? `Required (${NOTES_MIN_LENGTH}-${NOTES_MAX_LENGTH} characters)...` 
                  : "Add any additional notes..."
                }
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={NOTES_MAX_LENGTH}
                className={!isNotesValid ? 'border-destructive' : ''}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span className={!isNotesValid ? 'text-destructive' : ''}>
                  {isAdmin && `Min: ${NOTES_MIN_LENGTH} characters`}
                </span>
                <span className={!isNotesValid ? 'text-destructive' : ''}>
                  {notesLength}/{NOTES_MAX_LENGTH}
                </span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="px-6 py-4 border-t bg-muted/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !hasChanges || !isNotesValid}
          >
            {loading ? 'Updating...' : 'Update Status'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
