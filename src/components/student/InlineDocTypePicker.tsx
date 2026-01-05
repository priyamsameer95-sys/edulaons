/**
 * InlineDocTypePicker
 * 
 * A simple inline document type picker that avoids Radix Select portal issues.
 * Opens a panel below the button showing categorized document types.
 */
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

const InlineDocTypePicker = ({
  documentTypes,
  value,
  onChange,
  groupedDocTypes,
  getCategoryLabel,
}: InlineDocTypePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPosition | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find selected document type name
  const selectedType = documentTypes.find((dt) => dt.id === value);

  const updatePosition = () => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  };

  // Keep dropdown visible even inside ScrollArea/Sheet by portaling to <body>
  useEffect(() => {
    if (!isOpen) return;

    updatePosition();

    const onScrollOrResize = () => updatePosition();
    window.addEventListener('resize', onScrollOrResize);
    // capture=true to catch scroll from scroll containers (ScrollArea)
    window.addEventListener('scroll', onScrollOrResize, true);

    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [isOpen]);

  // Close on outside click (works with portal)
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (typeId: string) => {
    onChange(typeId);
    setIsOpen(false);
  };

  const dropdown =
    isOpen &&
    pos &&
    createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          width: pos.width,
        }}
        className={cn(
          'z-[1000] max-h-72 overflow-auto rounded-md border border-border bg-popover shadow-lg',
          'text-popover-foreground'
        )}
        role="listbox"
      >
        {Object.keys(groupedDocTypes).length === 0 ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            No document types available.
          </div>
        ) : (
          Object.entries(groupedDocTypes).map(([category, types]) => (
            <div key={category}>
              <div className="sticky top-0 bg-muted/80 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide border-b border-border/50">
                {getCategoryLabel(category)}
              </div>

              {types.map((dt) => (
                <button
                  key={dt.id}
                  type="button"
                  onClick={() => handleSelect(dt.id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-sm text-left',
                    'hover:bg-accent focus:bg-accent focus:outline-none transition-colors',
                    value === dt.id && 'bg-accent'
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 flex items-center justify-center',
                      value === dt.id ? 'text-primary' : 'text-transparent'
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="flex-1 truncate">
                    {dt.name}
                    {dt.required && <span className="text-destructive ml-0.5">*</span>}
                  </span>
                </button>
              ))}
            </div>
          ))
        )}
      </div>,
      document.body
    );

  return (
    <div className="w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() =>
          setIsOpen((v) => {
            const next = !v;
            if (next) requestAnimationFrame(() => updatePosition());
            return next;
          })
        }
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          'hover:bg-accent/50 transition-colors',
          !selectedType && 'text-muted-foreground'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="truncate">{selectedType ? selectedType.name : 'Select document type'}</span>
        <ChevronDown
          className={cn('h-4 w-4 opacity-50 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {dropdown}
    </div>
  );
};

export default InlineDocTypePicker;
