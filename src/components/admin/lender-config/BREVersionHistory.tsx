/**
 * BRE Version History Component
 * 
 * Displays version history for lender BRE configurations
 * with rollback capability.
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { History, RotateCcw, User, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface BREHistoryEntry {
  id: string;
  lender_id: string;
  bre_text: string | null;
  bre_json: unknown;
  processing_time_range_min: number | null;
  processing_time_range_max: number | null;
  collateral_preference: string[] | null;
  country_restrictions: string[] | null;
  university_restrictions: unknown;
  income_expectations_min: number | null;
  income_expectations_max: number | null;
  credit_expectations: string | null;
  experience_score: number | null;
  admin_remarks: string | null;
  version_number: number;
  changed_by: string | null;
  changed_at: string;
  change_reason: string;
}

interface BREVersionHistoryProps {
  lenderId: string;
  onRollback?: (breText: string) => void;
  className?: string;
}

export function BREVersionHistory({ lenderId, onRollback, className }: BREVersionHistoryProps) {
  const [history, setHistory] = useState<BREHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (lenderId) {
      fetchHistory();
    }
  }, [lenderId]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('lender_bre_history')
        .select('*')
        .eq('lender_id', lenderId)
        .order('version_number', { ascending: false });

      if (error) throw error;

      setHistory(data || []);

      // Fetch user emails for changed_by
      const userIds = [...new Set((data || []).map(h => h.changed_by).filter(Boolean))];
      if (userIds.length > 0) {
        const { data: users } = await supabase
          .from('app_users')
          .select('id, email')
          .in('id', userIds as string[]);

        if (users) {
          const emailMap: Record<string, string> = {};
          users.forEach(u => {
            emailMap[u.id] = u.email;
          });
          setUserEmails(emailMap);
        }
      }
    } catch (err) {
      console.error('Error fetching BRE history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = (entry: BREHistoryEntry) => {
    // Only rollback the bre_text for the simplified version
    onRollback?.(entry.bre_text || '');
    
    toast({
      title: 'Version Loaded',
      description: `Version ${entry.version_number} loaded into form. Save to apply changes.`,
    });
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Version History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No version history yet. Changes will be tracked after you save BRE configuration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-medium">Version History</CardTitle>
        </div>
        <CardDescription className="text-xs">
          {history.length} version{history.length !== 1 ? 's' : ''} recorded
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {history.map((entry, index) => (
              <Collapsible 
                key={entry.id}
                open={expandedId === entry.id}
                onOpenChange={(open) => setExpandedId(open ? entry.id : null)}
              >
                <div className={cn(
                  "border rounded-lg p-3 transition-colors",
                  index === 0 ? "bg-primary/5 border-primary/30" : "bg-background"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                          v{entry.version_number}
                        </Badge>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1 truncate">
                        {entry.change_reason}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(entry.changed_at), 'MMM d, yyyy h:mm a')}
                        </span>
                        {entry.changed_by && userEmails[entry.changed_by] && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {userEmails[entry.changed_by]}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {index !== 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRollback(entry)}
                          className="h-7 text-xs"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Rollback
                        </Button>
                      )}
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          {expandedId === entry.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </div>
                  
                  <CollapsibleContent className="mt-3 pt-3 border-t">
                    <div className="space-y-2 text-xs">
                      {entry.bre_text && (
                        <div>
                          <span className="font-medium">BRE Text:</span>
                          <p className="text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-4">
                            {entry.bre_text}
                          </p>
                        </div>
                      )}
                      {entry.collateral_preference && entry.collateral_preference.length > 0 && (
                        <div>
                          <span className="font-medium">Collateral:</span>
                          <span className="ml-2 text-muted-foreground">
                            {entry.collateral_preference.join(', ')}
                          </span>
                        </div>
                      )}
                      {entry.country_restrictions && entry.country_restrictions.length > 0 && (
                        <div>
                          <span className="font-medium">Countries:</span>
                          <span className="ml-2 text-muted-foreground">
                            {entry.country_restrictions.join(', ')}
                          </span>
                        </div>
                      )}
                      {entry.income_expectations_min !== null && (
                        <div>
                          <span className="font-medium">Income Range:</span>
                          <span className="ml-2 text-muted-foreground">
                            ₹{entry.income_expectations_min?.toLocaleString()} - ₹{entry.income_expectations_max?.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {entry.experience_score !== null && (
                        <div>
                          <span className="font-medium">Experience Score:</span>
                          <span className="ml-2 text-muted-foreground">
                            {entry.experience_score}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default BREVersionHistory;
