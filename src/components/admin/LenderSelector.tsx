import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Lender {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
}

interface LenderSelectorProps {
  value: string;
  onChange: (lenderId: string) => void;
  studyDestination?: string;
  loanAmount?: number;
  disabled?: boolean;
  showDescription?: boolean;
}

export function LenderSelector({
  value,
  onChange,
  studyDestination,
  loanAmount,
  disabled = false,
  showDescription = true,
}: LenderSelectorProps) {
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchLenders();
    if (studyDestination) {
      fetchPreferences();
    }
  }, [studyDestination]);

  const fetchLenders = async () => {
    try {
      const { data, error } = await supabase
        .from("lenders")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setLenders(data || []);
    } catch (error) {
      console.error("Error fetching lenders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    if (!studyDestination) return;

    try {
      const { data, error } = await supabase
        .from("university_lender_preferences")
        .select("lender_id, compatibility_score, is_preferred")
        .eq("study_destination", studyDestination as any);

      if (error) throw error;

      const prefMap: Record<string, number> = {};
      data?.forEach((pref) => {
        prefMap[pref.lender_id] = pref.compatibility_score || 50;
      });
      setPreferences(prefMap);
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const getSuggestedLenders = () => {
    return lenders
      .map((lender) => ({
        ...lender,
        score: preferences[lender.id] || 50,
      }))
      .sort((a, b) => b.score - a.score);
  };

  const suggestedLenders = getSuggestedLenders();
  const selectedLender = lenders.find((l) => l.id === value);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading lenders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="lender-select">Assigned Lender</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="lender-select">
          <SelectValue placeholder="Select a lender" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {suggestedLenders.map((lender) => (
            <SelectItem key={lender.id} value={lender.id}>
              <div className="flex items-center gap-2">
                <span>{lender.name}</span>
                {preferences[lender.id] && preferences[lender.id] > 70 && (
                  <Badge variant="secondary" className="text-xs">
                    Recommended
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showDescription && selectedLender?.description && (
        <p className="text-sm text-muted-foreground mt-1">
          {selectedLender.description}
        </p>
      )}
      
      {studyDestination && preferences[value] && (
        <div className="text-xs text-muted-foreground">
          Compatibility score: {preferences[value]}/100 for {studyDestination}
        </div>
      )}
    </div>
  );
}
