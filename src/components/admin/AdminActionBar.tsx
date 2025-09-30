import { FileText, Edit, Upload, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AdminActionBarProps {
  onUpdateStatus: () => void;
  onViewDocuments: () => void;
  onVerifyDocuments: () => void;
  onUploadDocument: () => void;
  selectedCount: number;
}

export function AdminActionBar({
  onUpdateStatus,
  onViewDocuments,
  onVerifyDocuments,
  onUploadDocument,
  selectedCount
}: AdminActionBarProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <div className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">Quick Actions</h3>
            {selectedCount > 0 && (
              <span className="text-sm text-muted-foreground">
                ({selectedCount} lead{selectedCount > 1 ? 's' : ''} selected)
              </span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={onUpdateStatus}
              variant="default"
              size="sm"
              className="gap-2"
              disabled={selectedCount === 0}
            >
              <Edit className="h-4 w-4" />
              Update Status
            </Button>
            
            <Button 
              onClick={onViewDocuments}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={selectedCount === 0}
            >
              <FileText className="h-4 w-4" />
              View Documents
            </Button>
            
            <Button 
              onClick={onVerifyDocuments}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Verify Queue
            </Button>
            
            <Button 
              onClick={onUploadDocument}
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={selectedCount !== 1}
            >
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}