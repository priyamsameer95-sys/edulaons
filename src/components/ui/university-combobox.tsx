import * as React from "react";
import { Check, ChevronsUpDown, Loader2, GraduationCap } from "lucide-react";

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
import { useUniversities } from "@/hooks/useUniversities";

interface UniversityComboboxProps {
  country: string;
  value: string;
  onChange: (value: string) => void;
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
  const [inputValue, setInputValue] = React.useState(value);
  const { universities, loading, searchUniversities, totalCount } = useUniversities(country);

  // Update input value when prop value changes
  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Clear input when country changes - DON'T call onChange to prevent infinite loop
  React.useEffect(() => {
    if (!country) {
      setInputValue("");
    }
  }, [country]);

  const handleSelect = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange(selectedValue);
    setOpen(false);
  };

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    onChange(newValue);
  };

  const filteredUniversities = React.useMemo(() => {
    return searchUniversities(inputValue);
  }, [searchUniversities, inputValue]);

  const showNoResults = !loading && inputValue && filteredUniversities.length === 0;
  const showSuggestions = !loading && (!inputValue || filteredUniversities.length > 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !inputValue && "text-muted-foreground",
            error && "border-destructive"
          )}
          disabled={disabled || !country}
        >
          <div className="flex items-center min-w-0">
            <GraduationCap className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {inputValue || placeholder}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={inputValue}
            onValueChange={handleInputChange}
            className="border-0 focus:ring-0"
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">
                  Loading universities...
                </span>
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
                  No universities found for "{inputValue}"
                </p>
                <p className="text-xs text-muted-foreground">
                  You can still submit this custom university name
                </p>
              </div>
            )}

            {showSuggestions && universities.length > 0 && (
              <CommandGroup>
                <div className="px-2 py-1.5 text-xs text-muted-foreground border-b">
                  {totalCount} universities in {country}
                </div>
                {filteredUniversities.map((university) => (
                  <CommandItem
                    key={university.id}
                    value={university.name}
                    onSelect={() => handleSelect(university.name)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center min-w-0">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            inputValue === university.name
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