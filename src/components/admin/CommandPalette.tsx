import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { 
  Search, 
  Users, 
  Building2, 
  Settings, 
  Plus, 
  FileText,
  User,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewLead?: () => void;
  onSelectLead?: (leadId: string) => void;
  onSelectPartner?: (partnerId: string) => void;
}

interface SearchResult {
  type: 'lead' | 'partner';
  id: string;
  title: string;
  subtitle: string;
}

export function CommandPalette({ 
  open, 
  onOpenChange, 
  onNewLead,
  onSelectLead,
  onSelectPartner,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const debouncedSearch = useDebounce(search, 200);

  // Search leads and partners
  React.useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setResults([]);
      return;
    }

    const searchData = async () => {
      setIsSearching(true);
      try {
        const searchResults: SearchResult[] = [];

        // Search leads via students
        const { data: leads } = await supabase
          .from('leads_new')
          .select(`
            id,
            case_id,
            student:students(name, email)
          `)
          .or(`case_id.ilike.%${debouncedSearch}%`)
          .limit(5);

        // Also search by student name/email
        const { data: studentLeads } = await supabase
          .from('students')
          .select(`
            id,
            name,
            email,
            leads:leads_new(id, case_id)
          `)
          .or(`name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%`)
          .limit(5);

        // Add leads from case_id search
        leads?.forEach(lead => {
          if (lead.student) {
            searchResults.push({
              type: 'lead',
              id: lead.id,
              title: (lead.student as any).name || 'Unknown',
              subtitle: `${lead.case_id} • ${(lead.student as any).email}`,
            });
          }
        });

        // Add leads from student search
        studentLeads?.forEach(student => {
          const studentLeadsList = student.leads as any[];
          studentLeadsList?.forEach(lead => {
            if (!searchResults.find(r => r.id === lead.id)) {
              searchResults.push({
                type: 'lead',
                id: lead.id,
                title: student.name,
                subtitle: `${lead.case_id} • ${student.email}`,
              });
            }
          });
        });

        // Search partners
        const { data: partners } = await supabase
          .from('partners')
          .select('id, name, partner_code')
          .or(`name.ilike.%${debouncedSearch}%,partner_code.ilike.%${debouncedSearch}%`)
          .limit(5);

        partners?.forEach(partner => {
          searchResults.push({
            type: 'partner',
            id: partner.id,
            title: partner.name,
            subtitle: partner.partner_code,
          });
        });

        setResults(searchResults);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    };

    searchData();
  }, [debouncedSearch]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'lead' && onSelectLead) {
      onSelectLead(result.id);
    } else if (result.type === 'partner' && onSelectPartner) {
      onSelectPartner(result.id);
    }
    onOpenChange(false);
    setSearch('');
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <Command className="rounded-lg border shadow-md">
        <CommandInput 
          placeholder="Search leads, partners, or type a command..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>
            {isSearching ? 'Searching...' : 'No results found.'}
          </CommandEmpty>

          {/* Search Results */}
          {results.length > 0 && (
            <>
              <CommandGroup heading="Search Results">
                {results.map((result) => (
                  <CommandItem
                    key={`${result.type}-${result.id}`}
                    onSelect={() => handleSelect(result)}
                  >
                    {result.type === 'lead' ? (
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex flex-col">
                      <span>{result.title}</span>
                      <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                    </div>
                    <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Quick Actions */}
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => {
              onNewLead?.();
              onOpenChange(false);
            }}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Create New Lead</span>
            </CommandItem>
            <CommandItem onSelect={() => {
              navigate('/dashboard/admin');
              onOpenChange(false);
            }}>
              <Users className="mr-2 h-4 w-4" />
              <span>Go to Lead Queue</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {/* Navigation */}
          <CommandGroup heading="Navigation">
            <CommandItem onSelect={() => {
              navigate('/dashboard/admin?tab=partners');
              onOpenChange(false);
            }}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>Partners</span>
            </CommandItem>
            <CommandItem onSelect={() => {
              navigate('/dashboard/admin?tab=lenders');
              onOpenChange(false);
            }}>
              <Building2 className="mr-2 h-4 w-4" />
              <span>Lenders</span>
            </CommandItem>
            <CommandItem onSelect={() => {
              navigate('/dashboard/admin?tab=settings');
              onOpenChange(false);
            }}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
