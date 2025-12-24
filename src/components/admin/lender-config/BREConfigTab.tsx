/**
 * Simplified BRE Configuration Tab for Lenders
 * 
 * Manages Business Rules Engine free text configuration:
 * - BRE Text (long-form rules description used by AI)
 * - Last updated info
 */

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';

export interface SimplifiedBREData {
  bre_text: string;
  bre_updated_at?: string | null;
  bre_updated_by?: string | null;
}

interface BREConfigTabProps {
  data: SimplifiedBREData;
  onChange: (data: SimplifiedBREData) => void;
}

const BRE_TEXT_PLACEHOLDER = `Describe approval philosophy, risk appetite, common rejects, processing speed, preferred profiles, and any internal experience notes.

Example:
- Prefer applicants with co-applicant salary >= 75,000/month
- Priority for salaried/government employees
- Minimum credit score: 700+
- Preferred destinations: USA, UK, Canada, Australia
- Avoid applicants from Tier 3 cities for unsecured loans
- Maximum loan amount: 1.5 Cr for secured, 50L for unsecured
- Strong preference for QS Top 200 universities
- Fast-track approval for repeat customers
- Usually rejects: Self-employed with ITR < 3 years, Credit score < 650`;

export function BREConfigTab({ data, onChange }: BREConfigTabProps) {
  const [updatedByEmail, setUpdatedByEmail] = useState<string | null>(null);

  // Fetch the email of the user who last updated
  useEffect(() => {
    const fetchUpdatedByEmail = async () => {
      if (data.bre_updated_by) {
        const { data: userData } = await supabase
          .from('app_users')
          .select('email')
          .eq('id', data.bre_updated_by)
          .single();
        
        if (userData) {
          setUpdatedByEmail(userData.email);
        }
      }
    };

    fetchUpdatedByEmail();
  }, [data.bre_updated_by]);

  const handleTextChange = (value: string) => {
    onChange({ ...data, bre_text: value });
  };

  const formatLastUpdated = () => {
    if (!data.bre_updated_at) return null;
    
    try {
      const date = new Date(data.bre_updated_at);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch {
      return null;
    }
  };

  const lastUpdatedDisplay = formatLastUpdated();

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 pb-2 border-b">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Lender BRE (Internal Notes)</h3>
      </div>

      {/* BRE Text Input */}
      <div className="space-y-2">
        <Label htmlFor="bre_text" className="text-sm font-medium">
          Lender BRE (Free Text – used by AI for lender recommendation)
        </Label>
        <Textarea
          id="bre_text"
          value={data.bre_text || ''}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={BRE_TEXT_PLACEHOLDER}
          rows={12}
          className="font-mono text-sm resize-y min-h-[240px]"
        />
        <p className="text-xs text-muted-foreground">
          Describe approval philosophy, risk appetite, common rejects, processing speed, 
          preferred profiles, and any internal experience notes.
        </p>
      </div>

      {/* Last Updated Info */}
      {lastUpdatedDisplay && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          <Clock className="h-4 w-4" />
          <span>
            Last updated by{' '}
            <span className="font-medium text-foreground">
              {updatedByEmail || 'Unknown'}
            </span>{' '}
            on {lastUpdatedDisplay}
          </span>
        </div>
      )}
    </div>
  );
}

export default BREConfigTab;
