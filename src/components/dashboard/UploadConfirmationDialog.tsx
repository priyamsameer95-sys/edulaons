import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, FileText, Upload } from 'lucide-react';

interface UploadConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'replace' | 'large' | 'multiple';
  fileCount: number;
  documentName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const UploadConfirmationDialog = ({
  open,
  onOpenChange,
  type,
  fileCount,
  documentName,
  onConfirm,
  onCancel
}: UploadConfirmationDialogProps) => {
  const getDialogContent = () => {
    switch (type) {
      case 'replace':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-warning" />,
          title: 'Replace existing document?',
          description: `This will replace the existing ${documentName} document. The previous version will no longer be accessible. Are you sure you want to continue?`,
          confirmText: 'Replace Document',
          confirmVariant: 'default' as const
        };
        
      case 'large':
        return {
          icon: <Upload className="h-6 w-6 text-primary" />,
          title: 'Large file upload',
          description: `You're about to upload ${fileCount > 1 ? 'files' : 'a file'} larger than 5MB. This may take longer to upload and process. Do you want to continue?`,
          confirmText: 'Upload Large File',
          confirmVariant: 'default' as const
        };
        
      case 'multiple':
        return {
          icon: <FileText className="h-6 w-6 text-primary" />,
          title: 'Upload multiple files',
          description: `You're about to upload ${fileCount} files for ${documentName}. All files will be processed together. Continue with batch upload?`,
          confirmText: 'Upload All Files',
          confirmVariant: 'default' as const
        };
        
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-warning" />,
          title: 'Confirm action',
          description: 'Are you sure you want to proceed?',
          confirmText: 'Continue',
          confirmVariant: 'default' as const
        };
    }
  };

  const content = getDialogContent();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center space-x-2">
            {content.icon}
            <AlertDialogTitle>{content.title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            {content.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className={type === 'replace' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
          >
            {content.confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};