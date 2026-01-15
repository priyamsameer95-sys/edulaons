import * as React from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface PartnerOption {
  id: string;
  name: string;
  partner_code: string;
}

interface PartnerComboboxProps {
  partners: PartnerOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

// Helper to highlight search term in text
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function PartnerCombobox({
  partners,
  value,
  onChange,
  placeholder = 'Select partner...',
  disabled = false,
  className,
}: PartnerComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // DEFENSIVE GUARD: Handle undefined/null partners
  const safePartners = partners ?? [];
  const isLoading = !partners;

  // Get recent partners from localStorage
  const [recentPartnerIds, setRecentPartnerIds] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('recentPartners');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const selectedPartner = safePartners.find(p => p.id === value);

  const handleSelect = (partnerId: string) => {
    const newValue = partnerId === value ? null : partnerId;
    onChange(newValue);
    setOpen(false);
    setSearchQuery('');

    // Update recent partners
    if (newValue) {
      const updated = [newValue, ...recentPartnerIds.filter(id => id !== newValue)].slice(0, 5);
      setRecentPartnerIds(updated);
      localStorage.setItem('recentPartners', JSON.stringify(updated));
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Filter partners based on search
  const filteredPartners = React.useMemo(() => {
    if (!searchQuery) return safePartners;
    const query = searchQuery.toLowerCase();
    return safePartners.filter(
      p => p.name.toLowerCase().includes(query) ||
        p.partner_code.toLowerCase().includes(query)
    );
  }, [safePartners, searchQuery]);

  // Get recent partners that exist in current list
  const recentPartners = React.useMemo(() =>
    recentPartnerIds
      .map(id => safePartners.find(p => p.id === id))
      .filter(Boolean) as PartnerOption[],
    [recentPartnerIds, safePartners]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select a partner"
          disabled={disabled || isLoading}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {isLoading ? (
            <span className="text-muted-foreground">Loading partners...</span>
          ) : selectedPartner ? (
            <span className="truncate max-w-[calc(100%-24px)]">
              {selectedPartner.name}
              <span className="ml-1.5 text-xs text-muted-foreground">({selectedPartner.partner_code})</span>
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0 bg-popover border shadow-md" align="start">
        <Command shouldFilter={false}>
          <div className="relative flex items-center border-b">
            <CommandInput
              placeholder="Search by name or code..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 p-1 rounded-sm hover:bg-muted text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <CommandList>
            <CommandEmpty>No partner found.</CommandEmpty>

            {/* Recent partners section */}
            {recentPartners.length > 0 && !searchQuery && (
              <CommandGroup heading="Recent">
                {recentPartners.map((partner) => (
                  <CommandItem
                    key={`recent-${partner.id}`}
                    value={partner.id}
                    onSelect={() => handleSelect(partner.id)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === partner.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="truncate font-medium">{partner.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {partner.partner_code}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* All partners section */}
            <CommandGroup heading={searchQuery ? `Results (${filteredPartners.length})` : 'All Partners'}>
              {filteredPartners.slice(0, 50).map((partner) => (
                <CommandItem
                  key={partner.id}
                  value={partner.id}
                  onSelect={() => handleSelect(partner.id)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === partner.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="truncate font-medium">
                    <HighlightedText text={partner.name} query={searchQuery} />
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    <HighlightedText text={partner.partner_code} query={searchQuery} />
                  </span>
                </CommandItem>
              ))}
              {filteredPartners.length > 50 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                  +{filteredPartners.length - 50} more — type to filter
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
