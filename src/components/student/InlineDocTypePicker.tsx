/**
 * InlineDocTypePicker
 * 
 * A simple inline document type picker that avoids Radix Select portal issues.
 * Opens a panel below the button showing categorized document types.
 */
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentType {
  id: string;
  name: string;
  category: string;
  required?: boolean;
}

interface InlineDocTypePickerProps {
  documentTypes: DocumentType[];
  value: string | undefined;
  onChange: (value: string) => void;
  groupedDocTypes: Record<string, DocumentType[]>;
  getCategoryLabel: (category: string) => string;
}

const InlineDocTypePicker = ({
  documentTypes,
  value,
  onChange,
  groupedDocTypes,
  getCategoryLabel,
}: InlineDocTypePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Find selected document type name
  const selectedType = documentTypes.find(dt => dt.id === value);
  
  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);
  
  const handleSelect = (typeId: string) => {
    onChange(typeId);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm",
          "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "hover:bg-accent/50 transition-colors",
          !selectedType && "text-muted-foreground"
        )}
      >
        <span className="truncate">
          {selectedType ? selectedType.name : 'Select document type'}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 opacity-50 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>
      
      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-md border border-border bg-popover shadow-lg">
          {Object.entries(groupedDocTypes).map(([category, types]) => (
            <div key={category}>
              {/* Category Header */}
              <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                {getCategoryLabel(category)}
              </div>
              
              {/* Document Types */}
              {types.map(dt => (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => handleSelect(dt.id)}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-sm text-left",
                    "hover:bg-accent focus:bg-accent focus:outline-none transition-colors",
                    value === dt.id && "bg-accent"
                  )}
                >
                  <span className={cn(
                    "w-4 h-4 flex items-center justify-center",
                    value === dt.id ? "text-primary" : "text-transparent"
                  )}>
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="flex-1 truncate">
                    {dt.name}
                    {dt.required && <span className="text-destructive ml-0.5">*</span>}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InlineDocTypePicker;
