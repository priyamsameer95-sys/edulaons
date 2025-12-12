import { useMemo } from 'react';
import { Check, HelpCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { getHelpText } from './constants';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  required?: boolean;
}

interface DocumentTypeSelectorProps {
  documentTypes: DocumentType[] | undefined;
  selectedDocumentType: string;
  onSelect: (id: string) => void;
}

export function DocumentTypeSelector({
  documentTypes,
  selectedDocumentType,
  onSelect
}: DocumentTypeSelectorProps) {
  // Group document types by category
  const groupedDocumentTypes = useMemo(() => {
    if (!documentTypes) return {};
    return documentTypes.reduce((acc, type) => {
      const category = type.category || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(type);
      return acc;
    }, {} as Record<string, DocumentType[]>);
  }, [documentTypes]);

  const selectedDocTypeInfo = useMemo(() => {
    if (!documentTypes || !selectedDocumentType) return null;
    return documentTypes.find(t => t.id === selectedDocumentType);
  }, [documentTypes, selectedDocumentType]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>Select Document Type</Label>
        {selectedDocTypeInfo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs">
              <p className="text-xs">{getHelpText(selectedDocTypeInfo.name)}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      <ScrollArea className="h-[180px] rounded-md border p-3">
        <div className="space-y-4">
          {Object.entries(groupedDocumentTypes).map(([category, types]) => (
            <div key={category}>
              <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                {category}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {types.map((type) => (
                  <Tooltip key={type.id}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onSelect(type.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-md border p-2 text-left text-sm transition-colors hover:bg-muted",
                          selectedDocumentType === type.id
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        )}
                      >
                        {selectedDocumentType === type.id && (
                          <Check className="h-3 w-3 text-primary flex-shrink-0" />
                        )}
                        <span className={cn(
                          "truncate",
                          selectedDocumentType !== type.id && "ml-5"
                        )}>
                          {type.name}
                          {type.required && (
                            <span className="text-destructive ml-1">*</span>
                          )}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-xs">{getHelpText(type.name)}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      {selectedDocTypeInfo && (
        <p className="text-xs text-muted-foreground">{getHelpText(selectedDocTypeInfo.name)}</p>
      )}
    </div>
  );
}
