import { SmartDocumentUpload } from '@/components/upload/SmartDocumentUpload';

interface InlineDocumentUploadProps {
  leadId: string;
  onUploadComplete?: () => void;
}

export function InlineDocumentUpload({ leadId, onUploadComplete }: InlineDocumentUploadProps) {
  return <SmartDocumentUpload leadId={leadId} onUploadComplete={onUploadComplete} />;
}
