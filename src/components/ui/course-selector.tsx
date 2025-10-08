import * as React from "react";
import { Check, ChevronsUpDown, GraduationCap } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { useCourses } from "@/hooks/useCourses";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CourseSelectorProps {
  universityIds: string[];
  value?: string | { id: string; programName: string; degree: string; stream: string; tuition?: string };
  onChange: (value: string | { id: string; programName: string; degree: string; stream: string; tuition?: string }) => void;
  disabled?: boolean;
  error?: string;
  placeholder?: string;
}

export function CourseSelector({
  universityIds,
  value,
  onChange,
  disabled = false,
  error,
  placeholder = "Search for your course...",
}: CourseSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [isCustomEntry, setIsCustomEntry] = React.useState(false);
  const [customCourse, setCustomCourse] = React.useState("");

  const { courses, loading, error: fetchError } = useCourses(universityIds);

  // Initialize from value
  React.useEffect(() => {
    if (typeof value === 'string') {
      setInputValue(value);
      setCustomCourse(value);
      // Check if it's a custom entry (not in DB)
      const existingCourse = courses.find(c => c.program_name === value);
      setIsCustomEntry(!existingCourse && value.length > 0);
    } else if (value && typeof value === 'object') {
      setInputValue(value.programName);
      setIsCustomEntry(false);
    }
  }, [value, courses]);

  // Clear when universities change
  React.useEffect(() => {
    if (universityIds.length === 0) {
      setInputValue("");
      setCustomCourse("");
      setIsCustomEntry(false);
      onChange("");
    }
  }, [universityIds.length]);

  const handleSelect = (course: any) => {
    const courseData = {
      id: course.id,
      programName: course.program_name,
      degree: course.degree,
      stream: course.stream_name,
      tuition: course.tuition_fees || undefined,
    };
    setInputValue(course.program_name);
    setIsCustomEntry(false);
    onChange(courseData);
    setOpen(false);
  };

  const handleCustomEntry = () => {
    if (customCourse.trim()) {
      setInputValue(customCourse);
      setIsCustomEntry(true);
      onChange(customCourse);
      setOpen(false);
    }
  };

  const filteredCourses = React.useMemo(() => {
    if (!inputValue.trim()) return courses;
    
    const searchTerm = inputValue.toLowerCase().trim();
    return courses.filter(course => 
      course.program_name.toLowerCase().includes(searchTerm) ||
      course.stream_name.toLowerCase().includes(searchTerm) ||
      course.degree.toLowerCase().includes(searchTerm)
    );
  }, [courses, inputValue]);

  // Group courses by stream
  const groupedCourses = React.useMemo(() => {
    const groups: Record<string, typeof courses> = {};
    filteredCourses.forEach(course => {
      const stream = course.stream_name || 'Other';
      if (!groups[stream]) groups[stream] = [];
      groups[stream].push(course);
    });
    return groups;
  }, [filteredCourses]);

  if (universityIds.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10 p-4 text-center">
        <GraduationCap className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">Please select universities first</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !inputValue && "text-muted-foreground",
              error && "border-destructive"
            )}
            disabled={disabled || loading}
          >
            <span className="truncate">
              {inputValue || placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder="Search courses..." 
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              {loading ? (
                <div className="p-4 text-sm text-center text-muted-foreground">
                  Loading courses...
                </div>
              ) : fetchError ? (
                <CommandEmpty>
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">{fetchError}</p>
                    {inputValue && (
                      <div className="space-y-2">
                        <Label htmlFor="custom-course">Enter your course manually:</Label>
                        <Input
                          id="custom-course"
                          value={customCourse}
                          onChange={(e) => setCustomCourse(e.target.value)}
                          placeholder="e.g., Master of Science in Computer Science"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCustomEntry();
                            }
                          }}
                        />
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={handleCustomEntry}
                          disabled={!customCourse.trim()}
                        >
                          Use Custom Course
                        </Button>
                      </div>
                    )}
                  </div>
                </CommandEmpty>
              ) : filteredCourses.length === 0 ? (
                <CommandEmpty>
                  <div className="p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">No courses found</p>
                    {inputValue && (
                      <div className="space-y-2">
                        <Label htmlFor="custom-course">Enter your course manually:</Label>
                        <Input
                          id="custom-course"
                          value={customCourse}
                          onChange={(e) => setCustomCourse(e.target.value)}
                          placeholder="e.g., Master of Science in Computer Science"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCustomEntry();
                            }
                          }}
                        />
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={handleCustomEntry}
                          disabled={!customCourse.trim()}
                        >
                          Use Custom Course
                        </Button>
                      </div>
                    )}
                  </div>
                </CommandEmpty>
              ) : (
                <>
                  {Object.entries(groupedCourses).map(([stream, streamCourses]) => (
                    <CommandGroup key={stream} heading={stream}>
                      {streamCourses.map((course) => {
                        const isSelected = typeof value === 'object' 
                          ? value?.id === course.id 
                          : value === course.program_name;
                        
                        return (
                          <CommandItem
                            key={course.id}
                            value={course.program_name}
                            onSelect={() => handleSelect(course)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium truncate">{course.program_name}</span>
                                <Badge variant="secondary" className="shrink-0 text-xs">
                                  {course.degree}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                {course.study_level && (
                                  <span>{course.study_level}</span>
                                )}
                                {course.program_duration && (
                                  <>
                                    <span>•</span>
                                    <span>{course.program_duration}</span>
                                  </>
                                )}
                                {course.tuition_fees && (
                                  <>
                                    <span>•</span>
                                    <span>{course.tuition_fees}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  ))}
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setCustomCourse(inputValue);
                        setOpen(false);
                        setTimeout(() => {
                          const input = document.getElementById('custom-course') as HTMLInputElement;
                          input?.focus();
                        }, 100);
                      }}
                    >
                      <GraduationCap className="mr-2 h-4 w-4" />
                      <span className="text-sm text-muted-foreground">Course not listed? Enter manually</span>
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {isCustomEntry && inputValue && (
        <p className="text-xs text-muted-foreground">
          Custom course entry: {inputValue}
        </p>
      )}
    </div>
  );
}
