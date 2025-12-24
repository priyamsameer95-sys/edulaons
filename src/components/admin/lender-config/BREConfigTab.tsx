/**
 * BRE Configuration Tab for Lenders
 * 
 * Manages Business Rules Engine configuration:
 * - BRE Text (long-form rules description)
 * - BRE JSON (structured rules)
 * - Processing time range
 * - Collateral preferences
 * - Country/University restrictions
 * - Income/Credit expectations
 * - Experience score
 * - Admin remarks
 */

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BREConfigData {
  bre_text: string;
  bre_json: Record<string, unknown> | null;
  processing_time_range_min: number | null;
  processing_time_range_max: number | null;
  collateral_preference: string[];
  country_restrictions: string[];
  university_restrictions: { allowed: string[]; blocked: string[] } | null;
  income_expectations_min: number | null;
  income_expectations_max: number | null;
  credit_expectations: string;
  experience_score: number | null;
  admin_remarks: string;
}

interface BREConfigTabProps {
  data: BREConfigData;
  onChange: (data: BREConfigData) => void;
  isEditMode?: boolean;
}

const COLLATERAL_OPTIONS = [
  { id: 'property', label: 'Property' },
  { id: 'fd', label: 'Fixed Deposit' },
  { id: 'lic', label: 'LIC Policy' },
  { id: 'mutual_funds', label: 'Mutual Funds' },
  { id: 'none', label: 'No Collateral Required' },
];

const BRE_TEXT_PLACEHOLDER = `Enter the lender's Business Rules Engine (BRE) criteria in plain text.

Example:
- Prefer applicants with co-applicant salary >= 75,000/month
- Priority for salaried/government employees
- Minimum credit score: 700+
- Preferred destinations: USA, UK, Canada, Australia
- Avoid applicants from Tier 3 cities for unsecured loans
- Maximum loan amount: 1.5 Cr for secured, 50L for unsecured
- Strong preference for QS Top 200 universities
- Fast-track approval for repeat customers`;

export function BREConfigTab({ data, onChange, isEditMode = false }: BREConfigTabProps) {
  const [newCountry, setNewCountry] = useState('');
  const [newAllowedUniversity, setNewAllowedUniversity] = useState('');
  const [newBlockedUniversity, setNewBlockedUniversity] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [breJsonText, setBreJsonText] = useState('');

  // Initialize BRE JSON text
  useEffect(() => {
    if (data.bre_json) {
      setBreJsonText(JSON.stringify(data.bre_json, null, 2));
    }
  }, []);

  const updateField = <K extends keyof BREConfigData>(field: K, value: BREConfigData[K]) => {
    onChange({ ...data, [field]: value });
  };

  const handleCollateralChange = (id: string, checked: boolean) => {
    const current = data.collateral_preference || [];
    if (checked) {
      updateField('collateral_preference', [...current, id]);
    } else {
      updateField('collateral_preference', current.filter(c => c !== id));
    }
  };

  const addCountry = () => {
    if (newCountry.trim()) {
      const current = data.country_restrictions || [];
      if (!current.includes(newCountry.trim().toUpperCase())) {
        updateField('country_restrictions', [...current, newCountry.trim().toUpperCase()]);
      }
      setNewCountry('');
    }
  };

  const removeCountry = (country: string) => {
    updateField('country_restrictions', (data.country_restrictions || []).filter(c => c !== country));
  };

  const addUniversity = (type: 'allowed' | 'blocked') => {
    const value = type === 'allowed' ? newAllowedUniversity : newBlockedUniversity;
    if (value.trim()) {
      const current = data.university_restrictions || { allowed: [], blocked: [] };
      const list = current[type] || [];
      if (!list.includes(value.trim())) {
        updateField('university_restrictions', {
          ...current,
          [type]: [...list, value.trim()],
        });
      }
      if (type === 'allowed') {
        setNewAllowedUniversity('');
      } else {
        setNewBlockedUniversity('');
      }
    }
  };

  const removeUniversity = (type: 'allowed' | 'blocked', university: string) => {
    const current = data.university_restrictions || { allowed: [], blocked: [] };
    updateField('university_restrictions', {
      ...current,
      [type]: (current[type] || []).filter(u => u !== university),
    });
  };

  const handleJsonChange = (text: string) => {
    setBreJsonText(text);
    if (!text.trim()) {
      setJsonError(null);
      updateField('bre_json', null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      setJsonError(null);
      updateField('bre_json', parsed);
    } catch (err) {
      setJsonError('Invalid JSON format');
    }
  };

  return (
    <div className="space-y-6">
      {/* BRE Text - Main Rules Description */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            BRE Rules (Text)
          </CardTitle>
          <CardDescription className="text-xs">
            Describe the lender's eligibility criteria and preferences in plain text. 
            This will be used by AI to evaluate applicants.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={data.bre_text || ''}
            onChange={(e) => updateField('bre_text', e.target.value)}
            placeholder={BRE_TEXT_PLACEHOLDER}
            rows={10}
            className="font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* BRE JSON - Structured Rules (Optional) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            BRE Rules (JSON)
            <Badge variant="outline" className="text-xs">Optional</Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Optional structured rules in JSON format for more precise AI evaluation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={breJsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            placeholder='{\n  "min_credit_score": 700,\n  "preferred_salary": 75000,\n  "allowed_employment": ["salaried", "government"]\n}'
            rows={6}
            className={cn("font-mono text-sm", jsonError && "border-destructive")}
          />
          {jsonError && (
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {jsonError}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Processing Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Processing Time (Min Days)</Label>
          <Input
            type="number"
            min={0}
            value={data.processing_time_range_min ?? ''}
            onChange={(e) => updateField('processing_time_range_min', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="e.g., 7"
          />
        </div>
        <div className="space-y-2">
          <Label>Processing Time (Max Days)</Label>
          <Input
            type="number"
            min={0}
            value={data.processing_time_range_max ?? ''}
            onChange={(e) => updateField('processing_time_range_max', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="e.g., 21"
          />
        </div>
      </div>

      {/* Collateral Preferences */}
      <div className="space-y-3">
        <Label>Collateral Preferences</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {COLLATERAL_OPTIONS.map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={`collateral-${option.id}`}
                checked={(data.collateral_preference || []).includes(option.id)}
                onCheckedChange={(checked) => handleCollateralChange(option.id, checked as boolean)}
              />
              <Label htmlFor={`collateral-${option.id}`} className="text-sm font-normal cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Country Restrictions */}
      <div className="space-y-3">
        <Label>Country Restrictions (Study Destinations)</Label>
        <div className="flex gap-2">
          <Input
            value={newCountry}
            onChange={(e) => setNewCountry(e.target.value)}
            placeholder="e.g., USA"
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCountry())}
          />
          <Button type="button" variant="outline" size="icon" onClick={addCountry}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {(data.country_restrictions || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.country_restrictions?.map((country) => (
              <Badge key={country} variant="secondary" className="gap-1">
                {country}
                <button onClick={() => removeCountry(country)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* University Restrictions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">University Restrictions</CardTitle>
          <CardDescription className="text-xs">
            Specify preferred or blocked universities/rankings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Allowed Universities */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Preferred Universities/Rankings</Label>
            <div className="flex gap-2">
              <Input
                value={newAllowedUniversity}
                onChange={(e) => setNewAllowedUniversity(e.target.value)}
                placeholder="e.g., QS Top 100, Ivy League"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUniversity('allowed'))}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => addUniversity('allowed')}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(data.university_restrictions?.allowed || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.university_restrictions?.allowed.map((uni) => (
                  <Badge key={uni} variant="default" className="gap-1 bg-emerald-500/10 text-emerald-700 border-emerald-200">
                    {uni}
                    <button onClick={() => removeUniversity('allowed', uni)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Blocked Universities */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Blocked Universities/Rankings</Label>
            <div className="flex gap-2">
              <Input
                value={newBlockedUniversity}
                onChange={(e) => setNewBlockedUniversity(e.target.value)}
                placeholder="e.g., Unranked, Distance Learning"
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUniversity('blocked'))}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => addUniversity('blocked')}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(data.university_restrictions?.blocked || []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {data.university_restrictions?.blocked.map((uni) => (
                  <Badge key={uni} variant="destructive" className="gap-1">
                    {uni}
                    <button onClick={() => removeUniversity('blocked', uni)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Income Expectations */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Min Co-Applicant Income (₹/month)</Label>
          <Input
            type="number"
            min={0}
            value={data.income_expectations_min ?? ''}
            onChange={(e) => updateField('income_expectations_min', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="e.g., 50000"
          />
        </div>
        <div className="space-y-2">
          <Label>Max Co-Applicant Income (₹/month)</Label>
          <Input
            type="number"
            min={0}
            value={data.income_expectations_max ?? ''}
            onChange={(e) => updateField('income_expectations_max', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="e.g., 500000"
          />
        </div>
      </div>

      {/* Credit Expectations */}
      <div className="space-y-2">
        <Label>Credit Score Expectations</Label>
        <Input
          value={data.credit_expectations || ''}
          onChange={(e) => updateField('credit_expectations', e.target.value)}
          placeholder="e.g., 700+ for unsecured, 650+ for secured with property"
        />
      </div>

      {/* Experience Score */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Lender Experience Score (1-10)</Label>
          <Badge variant="outline">{data.experience_score ?? 5}/10</Badge>
        </div>
        <Slider
          value={[data.experience_score ?? 5]}
          onValueChange={([value]) => updateField('experience_score', value)}
          min={1}
          max={10}
          step={1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Rate the lender's historical experience: 1 = Poor, 10 = Excellent
        </p>
      </div>

      {/* Admin Remarks */}
      <div className="space-y-2">
        <Label>Admin Remarks (Internal Only)</Label>
        <Textarea
          value={data.admin_remarks || ''}
          onChange={(e) => updateField('admin_remarks', e.target.value)}
          placeholder="Private notes about this lender's behavior, quirks, or special considerations..."
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          These notes are visible only to admins and won't be shared with students or partners.
        </p>
      </div>
    </div>
  );
}

export default BREConfigTab;
