import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Check, Search, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';

interface University {
  id: string;
  name: string;
  city: string;
  country: string;
}

interface UniversityQuestionProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onSubmit: () => void;
  studyDestination?: string;
  maxSelections?: number;
}

const UniversityQuestion = ({
  selectedIds,
  onChange,
  onSubmit,
  studyDestination,
  maxSelections = 3,
}: UniversityQuestionProps) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<University[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(search, 300);

  // Fetch selected universities on mount
  useEffect(() => {
    if (selectedIds.length > 0) {
      const fetchSelected = async () => {
        const { data } = await supabase
          .from('universities')
          .select('id, name, city, country')
          .in('id', selectedIds);
        if (data) {
          setSelectedUniversities(data);
        }
      };
      fetchSelected();
    }
  }, []);

  // Search universities
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setResults([]);
      return;
    }

    const searchUniversities = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('universities')
          .select('id, name, city, country')
          .ilike('name', `%${debouncedSearch}%`)
          .limit(10);

        if (studyDestination) {
          query = query.ilike('country', `%${studyDestination}%`);
        }

        const { data } = await query;
        setResults(data || []);
      } catch (error) {
        console.error('Error searching universities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    searchUniversities();
  }, [debouncedSearch, studyDestination]);

  const handleSelect = useCallback((university: University) => {
    if (selectedIds.includes(university.id)) {
      // Remove
      const newIds = selectedIds.filter(id => id !== university.id);
      onChange(newIds);
      setSelectedUniversities(prev => prev.filter(u => u.id !== university.id));
    } else if (selectedIds.length < maxSelections) {
      // Add
      const newIds = [...selectedIds, university.id];
      onChange(newIds);
      setSelectedUniversities(prev => [...prev, university]);
    }
    setSearch('');
    setResults([]);
    inputRef.current?.focus();
  }, [selectedIds, onChange, maxSelections]);

  const handleRemove = (id: string) => {
    const newIds = selectedIds.filter(uid => uid !== id);
    onChange(newIds);
    setSelectedUniversities(prev => prev.filter(u => u.id !== id));
  };

  const handleSubmit = () => {
    if (selectedIds.length > 0) {
      onSubmit();
    }
  };

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  return (
    <div className="space-y-6">
      {/* Selected universities */}
      {selectedUniversities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedUniversities.map((uni) => (
            <div
              key={uni.id}
              className="flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary rounded-lg"
            >
              <span className="text-sm font-medium">{uni.name}</span>
              <button
                onClick={() => handleRemove(uni.id)}
                className="hover:bg-primary/20 rounded p-0.5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            selectedIds.length >= maxSelections 
              ? `Maximum ${maxSelections} universities selected`
              : "Search for a university..."
          }
          disabled={selectedIds.length >= maxSelections}
          className={cn(
            "w-full bg-transparent border-b-2 border-muted-foreground/30 py-3 pl-10 text-xl",
            "placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary",
            "transition-colors duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
        {isLoading && (
          <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground animate-spin" />
        )}
      </div>

      {/* Search results */}
      {results.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          {results.map((university) => {
            const isSelected = selectedIds.includes(university.id);
            return (
              <button
                key={university.id}
                onClick={() => handleSelect(university)}
                className={cn(
                  "w-full flex items-center justify-between p-4 text-left",
                  "hover:bg-muted/50 transition-colors border-b border-border last:border-b-0",
                  isSelected && "bg-primary/5"
                )}
              >
                <div>
                  <p className="font-medium text-foreground">{university.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {university.city}, {university.country}
                  </p>
                </div>
                {isSelected && <Check className="h-5 w-5 text-primary" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Help text */}
      <p className="text-sm text-muted-foreground">
        Select up to {maxSelections} universities. {selectedIds.length}/{maxSelections} selected.
      </p>

      <div className="flex items-center gap-4 pt-4">
        <button
          onClick={handleSubmit}
          disabled={selectedIds.length === 0}
          className={cn(
            "px-6 py-3 rounded-lg font-medium text-base transition-all duration-200",
            "bg-primary text-primary-foreground hover:opacity-90",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center gap-2"
          )}
        >
          OK
          <span className="text-primary-foreground/70 text-sm flex items-center gap-1">
            press Enter ↵
          </span>
        </button>
      </div>
    </div>
  );
};

export default UniversityQuestion;
