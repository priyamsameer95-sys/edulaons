import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
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

  // Get recent partners from localStorage
  const [recentPartnerIds, setRecentPartnerIds] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('recentPartners');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const selectedPartner = partners.find(p => p.id === value);

  const handleSelect = (partnerId: string) => {
    const newValue = partnerId === value ? null : partnerId;
    onChange(newValue);
    setOpen(false);

    // Update recent partners
    if (newValue) {
      const updated = [newValue, ...recentPartnerIds.filter(id => id !== newValue)].slice(0, 5);
      setRecentPartnerIds(updated);
      localStorage.setItem('recentPartners', JSON.stringify(updated));
    }
  };

  // Filter partners based on search
  const filteredPartners = React.useMemo(() => {
    if (!searchQuery) return partners;
    const query = searchQuery.toLowerCase();
    return partners.filter(
      p => p.name.toLowerCase().includes(query) || 
           p.partner_code.toLowerCase().includes(query)
    );
  }, [partners, searchQuery]);

  // Get recent partners that exist in current list
  const recentPartners = React.useMemo(() => 
    recentPartnerIds
      .map(id => partners.find(p => p.id === id))
      .filter(Boolean) as PartnerOption[],
    [recentPartnerIds, partners]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {selectedPartner ? (
            <span className="truncate">
              {selectedPartner.partner_code} - {selectedPartner.name}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="Search partners..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
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
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === partner.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="font-mono text-xs text-muted-foreground mr-2">
                      {partner.partner_code}
                    </span>
                    <span className="truncate">{partner.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {/* All partners section */}
            <CommandGroup heading={searchQuery ? 'Results' : 'All Partners'}>
              {filteredPartners.slice(0, 50).map((partner) => (
                <CommandItem
                  key={partner.id}
                  value={partner.id}
                  onSelect={() => handleSelect(partner.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === partner.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="font-mono text-xs text-muted-foreground mr-2">
                    {partner.partner_code}
                  </span>
                  <span className="truncate">{partner.name}</span>
                </CommandItem>
              ))}
              {filteredPartners.length > 50 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground text-center">
                  +{filteredPartners.length - 50} more - type to filter
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
