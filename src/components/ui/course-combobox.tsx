import * as React from "react";
import { Check, ChevronsUpDown, Plus, Search, AlertCircle, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useCourseSelection } from "@/hooks/useCourseSelection";
import { useDebounce } from "@/hooks/use-debounce";
import { Course, isValidUUID } from "@/types/selection";

interface CourseComboboxProps {
  universityId?: string;
  value?: string;
  onChange: (value: string, isCustom?: boolean) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function CourseCombobox({
  universityId,
  value = "",
  onChange,
  placeholder = "Search or enter course name...",
  disabled = false,
  error,
}: CourseComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [localInput, setLocalInput] = React.useState("");
  
  const {
    courses,
    groupedCourses,
    loading,
    error: fetchError,
    selectedCourse,
    inputValue,
    isUniversityValid,
    searchCourses,
    refetch,
  } = useCourseSelection({
    universityId,
    initialValue: value,
  });

  const debouncedSearch = useDebounce(localInput, 300);

  const filteredCourses = React.useMemo(() => {
    return searchCourses(debouncedSearch);
  }, [searchCourses, debouncedSearch]);

  // Sync local input with selection state
  React.useEffect(() => {
    setLocalInput(inputValue);
  }, [inputValue]);

  const handleSelect = (course: Course) => {
    setLocalInput(course.program_name);
    onChange(course.id, false);
    setOpen(false);
  };

  const handleCustomSelect = () => {
    onChange(localInput, true);
    setOpen(false);
  };

  const displayValue = selectedCourse?.program_name || value;
  const showNoResults = !loading && !fetchError && filteredCourses.length === 0 && debouncedSearch.length > 0;
  const showAddCustom = localInput.length > 0 && !courses.find(c => 
    c.program_name.toLowerCase() === localInput.toLowerCase()
  );

  // Only disable if explicitly disabled via prop
  const isDisabled = disabled;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal",
            !value && "text-muted-foreground",
            error && "border-destructive"
          )}
          disabled={isDisabled}
        >
          <span className="truncate">
            {value ? displayValue : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <div className="border-b px-3 py-2 bg-muted/30">
            <CommandInput 
              placeholder="Type to search courses or enter custom name..."
              value={localInput}
              onValueChange={setLocalInput}
              className="border-0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              💡 Type any text to add a custom course, or select from the list below
            </p>
          </div>
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
                  Failed to load courses
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  {fetchError}
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetch()}
                >
                  Retry
                </Button>
              </div>
            )}

            {!loading && !fetchError && (
              <>
                {/* Show message for custom university */}
                {universityId && !isUniversityValid && (
                  <div className="px-3 py-2 text-xs text-muted-foreground bg-muted/50 border-b">
                    Custom university selected. Enter a course name manually.
                  </div>
                )}

                {Object.entries(groupedCourses).map(([level, levelCourses]) => {
                  const filtered = levelCourses.filter(c => 
                    filteredCourses.find(fc => fc.id === c.id)
                  );
                  
                  if (filtered.length === 0) return null;

                  return (
                    <CommandGroup key={level} heading={level}>
                      {filtered.map((course) => (
                        <CommandItem
                          key={course.id}
                          value={course.id}
                          onSelect={() => handleSelect(course)}
                          className="flex items-start gap-2 py-3"
                        >
                          <Check
                            className={cn(
                              "mt-1 h-4 w-4",
                              value === course.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-medium text-sm leading-tight">
                                {course.program_name}
                              </span>
                              {course.tuition_fees && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {course.tuition_fees}
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                              {course.degree && (
                                <span className="flex items-center gap-1">
                                  <GraduationCap className="h-3 w-3" />
                                  {course.degree}
                                </span>
                              )}
                              {course.program_duration && (
                                <span>• {course.program_duration}</span>
                              )}
                              {course.stream_name && (
                                <span>• {course.stream_name}</span>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  );
                })}

                {showNoResults && isUniversityValid && (
                  <CommandEmpty>
                    <div className="text-center py-6">
                      <Search className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm font-medium">No courses found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Try adjusting your search
                      </p>
                    </div>
                  </CommandEmpty>
                )}

                {showAddCustom && !loading && (
                  <>
                    <CommandSeparator />
                    <CommandGroup heading="Custom Course">
                      <CommandItem
                        onSelect={handleCustomSelect}
                        className="flex items-center gap-2 bg-muted/50"
                      >
                        <Plus className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <div className="font-medium">Use custom course name</div>
                          <div className="text-xs text-muted-foreground">"{localInput}"</div>
                        </div>
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
