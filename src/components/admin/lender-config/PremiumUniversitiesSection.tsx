/**
 * Premium Universities Section for BRE Configuration
 * 
 * Allows admins to manage a list of premium universities for a lender.
 * Students from these universities get a score boost in AI recommendations.
 * Supports CSV upload and manual entry.
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Star, Upload, Plus, Trash2, Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface PremiumUniversity {
  name: string;
  country: string;
}

interface PremiumUniversitiesSectionProps {
  universities: PremiumUniversity[];
  onChange: (universities: PremiumUniversity[]) => void;
}

export function PremiumUniversitiesSection({
  universities,
  onChange,
}: PremiumUniversitiesSectionProps) {
  const { toast } = useToast();
  const [newUniversity, setNewUniversity] = useState('');
  const [newCountry, setNewCountry] = useState('');

  // CSV parsing
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsed: PremiumUniversity[] = [];
          let skipped = 0;

          results.data.forEach((row: any) => {
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
              const exists = universities.some(
                (u) =>
                  u.name.toLowerCase() === trimmedName.toLowerCase() &&
                  u.country.toLowerCase() === trimmedCountry.toLowerCase()
              ) || parsed.some(
                (u) =>
                  u.name.toLowerCase() === trimmedName.toLowerCase() &&
                  u.country.toLowerCase() === trimmedCountry.toLowerCase()
              );

              if (!exists && trimmedName && trimmedCountry) {
                parsed.push({ name: trimmedName, country: trimmedCountry });
              } else if (exists) {
                skipped++;
              }
            }
          });

          if (parsed.length > 0) {
            onChange([...universities, ...parsed]);
            toast({
              title: 'CSV Imported',
              description: `Added ${parsed.length} universities${skipped > 0 ? ` (${skipped} duplicates skipped)` : ''}`,
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
    [universities, onChange, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
  });

  // Manual add
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
        description: 'This university already exists in the list',
        variant: 'destructive',
      });
      return;
    }

    onChange([...universities, { name: newUniversity.trim(), country: newCountry.trim() }]);
    setNewUniversity('');
    setNewCountry('');
    toast({
      title: 'Added',
      description: `${newUniversity.trim()} added to premium list`,
    });
  };

  // Remove single
  const handleRemove = (index: number) => {
    const updated = universities.filter((_, i) => i !== index);
    onChange(updated);
  };

  // Clear all
  const handleClearAll = () => {
    onChange([]);
    toast({
      title: 'Cleared',
      description: 'All premium universities removed',
    });
  };

  // Download template
  const handleDownloadTemplate = () => {
    const csvContent = `S. No,University/Institute/College,Country
1,Massachusetts Institute of Technology,USA
2,Stanford University,USA
3,University of Oxford,UK`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'premium_universities_template.csv';
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

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-card">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-500" />
        <h4 className="font-semibold text-base">Premium Universities</h4>
        <span className="text-xs text-muted-foreground ml-auto">
          Students from these get a score boost
        </span>
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
        <Label className="text-sm font-medium">Add Manually</Label>
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
              Premium List ({universities.length})
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
                  <AlertDialogTitle>Clear All Universities?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all {universities.length} universities from the premium list.
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

          <ScrollArea className="h-[200px] border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead className="w-28">Country</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {universities.map((uni, index) => (
                  <TableRow key={`${uni.name}-${uni.country}-${index}`}>
                    <TableCell className="text-muted-foreground text-xs">
                      {index + 1}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{uni.name}</TableCell>
                    <TableCell className="text-sm">{uni.country}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      )}

      {universities.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No premium universities added yet. Upload a CSV or add manually.
        </p>
      )}
    </div>
  );
}

export default PremiumUniversitiesSection;
