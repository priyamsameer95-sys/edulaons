/**
 * Ranked Universities Section for BRE Configuration
 * 
 * Allows admins to manage a ranked list of universities for tiered scoring.
 * Universities are ranked by upload order (first row = Rank 1).
 * Scoring uses percentage-based tiers:
 * - Top 10%: +15% boost
 * - 10-50%: +10% boost
 * - 50-80%: +5% boost
 * - Bottom 20%: +2% boost
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { BarChart3, Upload, Plus, Trash2, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface RankedUniversity {
  name: string;
  country: string;
  rank: number;
}

interface RankedUniversitiesSectionProps {
  universities: RankedUniversity[];
  onChange: (universities: RankedUniversity[]) => void;
}

// Tier calculation based on percentile
function getTierInfo(rank: number, totalCount: number): { tier: number; boost: number; color: string; label: string } {
  if (totalCount === 0) return { tier: 1, boost: 15, color: 'bg-green-500', label: 'Tier 1' };
  
  const percentile = (rank / totalCount) * 100;
  
  if (percentile <= 10) {
    return { tier: 1, boost: 15, color: 'bg-green-500', label: 'T1 +15%' };
  } else if (percentile <= 50) {
    return { tier: 2, boost: 10, color: 'bg-blue-500', label: 'T2 +10%' };
  } else if (percentile <= 80) {
    return { tier: 3, boost: 5, color: 'bg-yellow-500', label: 'T3 +5%' };
  }
  return { tier: 4, boost: 2, color: 'bg-red-500', label: 'T4 +2%' };
}

// Calculate tier boundaries for display
function getTierBoundaries(totalCount: number): { tier1: number; tier2: number; tier3: number; tier4Start: number } {
  return {
    tier1: Math.ceil(totalCount * 0.1),
    tier2: Math.ceil(totalCount * 0.5),
    tier3: Math.ceil(totalCount * 0.8),
    tier4Start: Math.ceil(totalCount * 0.8) + 1,
  };
}

export function RankedUniversitiesSection({
  universities,
  onChange,
}: RankedUniversitiesSectionProps) {
  const { toast } = useToast();
  const [newUniversity, setNewUniversity] = useState('');
  const [newCountry, setNewCountry] = useState('');

  // CSV parsing - auto-assign rank by row order
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed: RankedUniversity[] = [];
          let skipped = 0;

          results.data.forEach((row: any, index: number) => {
            // Support multiple column name formats
            const name =
              row['University/Institute/College'] ||
              row['University'] ||
              row['Institute'] ||
              row['College'] ||
              row['Name'] ||
              row['university'] ||
              row['name'];

            const country =
              row['Country'] ||
              row['country'] ||
              row['COUNTRY'];

            if (name && country) {
              const trimmedName = String(name).trim();
              const trimmedCountry = String(country).trim();
              
              // Avoid duplicates
              const exists = parsed.some(
                (u) =>
                  u.name.toLowerCase() === trimmedName.toLowerCase() &&
                  u.country.toLowerCase() === trimmedCountry.toLowerCase()
              );

              if (!exists && trimmedName && trimmedCountry) {
                parsed.push({ 
                  name: trimmedName, 
                  country: trimmedCountry,
                  rank: parsed.length + 1 // Auto-assign rank by order
                });
              } else if (exists) {
                skipped++;
              }
            }
          });

          if (parsed.length > 0) {
            // Replace entire list (not append)
            onChange(parsed);
            toast({
              title: 'CSV Imported',
              description: `Loaded ${parsed.length} ranked universities${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}`,
            });
          } else {
            toast({
              title: 'No Data Found',
              description: 'Could not find valid university data in the CSV. Check column headers.',
              variant: 'destructive',
            });
          }
        },
        error: (error) => {
          toast({
            title: 'CSV Parse Error',
            description: error.message,
            variant: 'destructive',
          });
        },
      });
    },
    [onChange, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  });

  // Manual add - adds to end of list
  const handleAddManual = () => {
    if (!newUniversity.trim() || !newCountry.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Both university name and country are required',
        variant: 'destructive',
      });
      return;
    }

    const exists = universities.some(
      (u) =>
        u.name.toLowerCase() === newUniversity.trim().toLowerCase() &&
        u.country.toLowerCase() === newCountry.trim().toLowerCase()
    );

    if (exists) {
      toast({
        title: 'Duplicate Entry',
        description: 'This university already exists in the ranked list',
        variant: 'destructive',
      });
      return;
    }

    const newEntry: RankedUniversity = {
      name: newUniversity.trim(),
      country: newCountry.trim(),
      rank: universities.length + 1,
    };

    onChange([...universities, newEntry]);
    setNewUniversity('');
    setNewCountry('');
    toast({
      title: 'Added',
      description: `${newUniversity.trim()} added at rank ${newEntry.rank}`,
    });
  };

  // Remove single - recalculates all ranks
  const handleRemove = (index: number) => {
    const updated = universities
      .filter((_, i) => i !== index)
      .map((u, i) => ({ ...u, rank: i + 1 })); // Recalculate ranks
    onChange(updated);
  };

  // Clear all
  const handleClearAll = () => {
    onChange([]);
    toast({
      title: 'Cleared',
      description: 'All ranked universities removed',
    });
  };

  // Download template
  const handleDownloadTemplate = () => {
    const csvContent = `S. No,University/Institute/College,Country
1,Harvard University,USA
2,Stanford University,USA
3,Massachusetts Institute of Technology,USA
4,University of Oxford,UK
5,University of Cambridge,UK`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ranked_universities_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Country summary
  const countrySummary = universities.reduce((acc, u) => {
    acc[u.country] = (acc[u.country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sortedCountries = Object.entries(countrySummary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Tier boundaries for display
  const tierBounds = getTierBoundaries(universities.length);

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-card">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-500" />
        <h4 className="font-semibold text-base">Ranked Universities</h4>
        <span className="text-xs text-muted-foreground ml-auto">
          Tiered scoring based on rank percentile
        </span>
      </div>

      {/* Info Banner */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 space-y-1">
        <p><strong>How it works:</strong> Upload a CSV to set the ranking order. First row = Rank 1 (highest). Tier scoring scales with list size:</p>
        <div className="flex flex-wrap gap-2 mt-1">
          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-200">Top 10% → +15%</Badge>
          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">10-50% → +10%</Badge>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-200">50-80% → +5%</Badge>
          <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-200">80-100% → +2%</Badge>
        </div>
        <p className="text-muted-foreground/80 mt-1">To change order, re-upload the CSV with new ordering.</p>
      </div>

      {/* CSV Upload */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragActive
            ? 'Drop CSV here...'
            : 'Drag & drop CSV or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Columns: S. No | University/Institute/College | Country
        </p>
        <p className="text-xs text-yellow-600 mt-1">
          ⚠️ Uploading replaces the entire list
        </p>
      </div>

      {/* Download Template */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadTemplate}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Download Template
      </Button>

      {/* Manual Add */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Add Manually (appends to end)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="University name"
            value={newUniversity}
            onChange={(e) => setNewUniversity(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
            className="flex-1"
          />
          <Input
            placeholder="Country"
            value={newCountry}
            onChange={(e) => setNewCountry(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddManual()}
            className="w-32"
          />
          <Button onClick={handleAddManual} size="icon" variant="secondary">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* List Display */}
      {universities.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Ranked List ({universities.length} universities)
            </Label>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive gap-1">
                  <X className="h-3 w-3" />
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear All Ranked Universities?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all {universities.length} universities from the ranked list.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll}>
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Country Summary */}
          {sortedCountries.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {sortedCountries.map(([country, count]) => `${country} (${count})`).join(', ')}
              {Object.keys(countrySummary).length > 5 && ` +${Object.keys(countrySummary).length - 5} more`}
            </p>
          )}

          {/* Tier Summary */}
          <div className="text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1.5 flex flex-wrap gap-x-4 gap-y-1">
            <span><span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />Tier 1: Rank 1-{tierBounds.tier1}</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />Tier 2: Rank {tierBounds.tier1 + 1}-{tierBounds.tier2}</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1" />Tier 3: Rank {tierBounds.tier2 + 1}-{tierBounds.tier3}</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1" />Tier 4: Rank {tierBounds.tier4Start}+</span>
          </div>

          <ScrollArea className="h-[250px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Rank</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead className="w-28">Country</TableHead>
                  <TableHead className="w-20">Tier</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {universities.map((uni, index) => {
                  const tierInfo = getTierInfo(uni.rank, universities.length);
                  return (
                    <TableRow key={`${uni.name}-${uni.country}-${index}`}>
                      <TableCell className="font-mono text-sm font-medium">
                        {uni.rank}
                      </TableCell>
                      <TableCell className="font-medium text-sm">{uni.name}</TableCell>
                      <TableCell className="text-sm">{uni.country}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            tierInfo.tier === 1 ? 'bg-green-500/10 text-green-700 border-green-200' :
                            tierInfo.tier === 2 ? 'bg-blue-500/10 text-blue-700 border-blue-200' :
                            tierInfo.tier === 3 ? 'bg-yellow-500/10 text-yellow-700 border-yellow-200' :
                            'bg-red-500/10 text-red-700 border-red-200'
                          }`}
                        >
                          {tierInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {universities.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No ranked universities added yet. Upload a CSV or add manually.
        </p>
      )}
    </div>
  );
}

export default RankedUniversitiesSection;
