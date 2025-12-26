import * as React from "react";
import { Check, Loader2, GraduationCap, AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUniversitySelection } from "@/hooks/useUniversitySelection";
import { useDebounce } from "@/hooks/use-debounce";
import { University, isValidUUID } from "@/types/selection";

interface UniversityComboboxProps {
  country: string;
  value: string;
  onChange: (value: string, isCustom?: boolean) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function UniversityCombobox({
  country,
  value,
  onChange,
  error,
  placeholder = "Search or type university name",
  disabled = false,
}: UniversityComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [localInput, setLocalInput] = React.useState("");
  
  const {
    universities,
    totalCount,
    loading,
    error: fetchError,
    selectedUniversity,
    inputValue,
    searchUniversities,
    refetch,
  } = useUniversitySelection({
    country,
    initialValue: value,
  });

  const debouncedSearch = useDebounce(localInput || inputValue, 300);
  
  const filteredUniversities = React.useMemo(() => {
    return searchUniversities(debouncedSearch);
  }, [searchUniversities, debouncedSearch]);

  // Sync local input with selection state
  React.useEffect(() => {
    setLocalInput(inputValue);
  }, [inputValue]);

  const handleSelect = (university: University) => {
    setLocalInput(university.name);
    onChange(university.id, false);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setLocalInput(newValue);
    onChange(newValue, true);
  };

  const displayValue = selectedUniversity?.name || localInput || "";
  const showNoResults = !loading && !fetchError && localInput && filteredUniversities.length === 0;
  const showSuggestions = !loading && !fetchError && (!localInput || filteredUniversities.length > 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal max-w-full",
            !displayValue && "text-muted-foreground",
            error && "border-destructive"
          )}
          disabled={disabled || !country}
        >
          <div className="flex items-center min-w-0 max-w-[calc(100%-1rem)]">
            <GraduationCap className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {displayValue || placeholder}
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={localInput}
            onValueChange={handleInputChange}
            className="border-0 focus:ring-0"
          />
          <CommandList>
            {loading && (
              <div className="p-2 space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center space-x-2 p-2">
                    <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                    <div className="space-y-1 flex-1">
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                      <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {fetchError && (
              <div className="text-center py-6 px-4">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                <p className="text-sm font-medium text-destructive mb-1">
                  Failed to load universities
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {fetchError}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetch()}
                  type="button"
                >
                  Retry
                </Button>
              </div>
            )}

            {!country && !loading && (
              <CommandEmpty>
                <div className="text-center py-6">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Please select a country first
                  </p>
                </div>
              </CommandEmpty>
            )}

            {showNoResults && (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">
                  No universities found for "{localInput}"
                </p>
                <p className="text-xs text-muted-foreground">
                  You can still submit this custom university name
                </p>
              </div>
            )}

            {showSuggestions && universities.length > 0 && (
              <CommandGroup>
                <div className="px-2 py-1.5 text-xs text-muted-foreground border-b text-center">
                  {totalCount} universities in {country}
                </div>
                {filteredUniversities.map((university) => (
                  <CommandItem
                    key={university.id}
                    value={university.name}
                    onSelect={() => handleSelect(university)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center min-w-0">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedUniversity?.id === university.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {university.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {university.city}
                            {university.qs_rank && (
                              <span className="ml-2">
                                QS #{university.qs_rank}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {university.popular && (
                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          Popular
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {country && totalCount === 0 && !loading && (
              <CommandEmpty>
                <div className="text-center py-6">
                  <GraduationCap className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No universities available for {country}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You can still type a custom university name
                  </p>
                </div>
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
