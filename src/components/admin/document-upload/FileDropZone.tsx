import { useCallback, useState } from 'react';
import { Upload, Eye, FileImage, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ACCEPTED_FORMATS, MAX_FILE_SIZE_MB } from './constants';

interface FileDropZoneProps {
  selectedFile: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  onPreviewClick: () => void;
}

export function FileDropZone({
  selectedFile,
  previewUrl,
  onFileSelect,
  onFileRemove,
  onPreviewClick
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  }, [onFileSelect]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const openFilePicker = () => {
    document.getElementById('file-upload')?.click();
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="file-upload">Select File</Label>
      
      {/* File format and size info */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <FileText className="h-3 w-3" />
          Formats: {ACCEPTED_FORMATS.join(', ')}
        </span>
        <span className="flex items-center gap-1">
          <FileImage className="h-3 w-3" />
          Max size: {MAX_FILE_SIZE_MB} MB
        </span>
      </div>

      {/* Drag and drop zone */}
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border",
          "hover:border-primary/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          id="file-upload"
          type="file"
          onChange={handleFileInputChange}
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
        />
        
        {selectedFile ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              {selectedFile.type.startsWith('image/') ? (
                <FileImage className="h-6 w-6 text-primary" />
              ) : (
                <FileText className="h-6 w-6 text-primary" />
              )}
              <div className="text-left">
                <p className="text-sm font-medium truncate max-w-[250px]">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              {previewUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPreviewClick}
                  className="text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={openFilePicker}
                className="text-xs"
              >
                Change File
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onFileRemove}
                className="text-xs text-muted-foreground"
              >
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Upload className={cn(
              "h-8 w-8 mx-auto mb-2",
              isDragging ? "text-primary" : "text-muted-foreground"
            )} />
            <p className="text-sm text-muted-foreground">
              {isDragging ? 'Drop your file here' : 'Drag & drop your file here, or'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={openFilePicker}
              className="mt-2"
            >
              Browse Files
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
