import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Save, X } from 'lucide-react';

const STUDY_DESTINATIONS = ['Australia', 'Canada', 'Germany', 'Ireland', 'New Zealand', 'UK', 'USA', 'Other'];

interface UniversityManualEntryProps {
    initialData?: {
        id: string;
        name: string;
        country: string;
        city: string; // Keeping for type compatibility but ignoring
        global_rank: string | number | null;
        url: string;
    };
    onSuccess?: () => void;
    onCancel?: () => void;
}

export const UniversityManualEntry = ({ initialData, onSuccess, onCancel }: UniversityManualEntryProps = {}) => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [country, setCountry] = useState('');
    // const [city, setCity] = useState(''); // Removed
    const [rank, setRank] = useState('');
    const [website, setWebsite] = useState('');

    useEffect(() => {
        if (initialData) {
            setName(initialData.name || '');
            setCountry(initialData.country || '');
            // setCity(initialData.city || '');
            setRank(initialData.global_rank ? String(initialData.global_rank) : '');
            setWebsite(initialData.url || '');
        }
    }, [initialData]);

    const resetForm = () => {
        setName('');
        setCountry('');
        // setCity('');
        setRank('');
        setWebsite('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !country) {
            toast({ title: "Error", description: "Name and Country are required.", variant: "destructive" });
            return;
        }

        setLoading(true);

        try {
            const payload = {
                name: name.trim(),
                country: country,
                city: '', // Default to empty
                global_rank: rank ? rank.toString() : null, // Store as string
                url: website.trim() || null
            };

            let error;

            if (initialData?.id) {
                // Update
                const { error: updateError } = await supabase
                    .from('universities')
                    .update(payload as any)
                    .eq('id', initialData.id);
                error = updateError;
            } else {
                // Upsert (Insert/Update by name)
                const { error: insertError } = await supabase
                    .from('universities')
                    .upsert(payload as any, {
                        onConflict: 'name',
                        ignoreDuplicates: false
                    });
                error = insertError;
            }

            if (error) throw error;

            toast({ title: "Success", description: `Saved university: ${name}` });
            if (!initialData) resetForm();
            onSuccess?.();

        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const FormContent = (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="uni-name">University Name <span className="text-destructive">*</span></Label>
                <Input
                    id="uni-name"
                    placeholder="e.g. Stanford University"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    disabled={!!initialData} // Disable name edit if updating to prevent accidental dupes or primary key issues if name used as key elsewhere
                />
            </div>

            <div className="space-y-2">
                <Label>Country <span className="text-destructive">*</span></Label>
                <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                        {STUDY_DESTINATIONS.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="uni-rank">Global Rank</Label>
                    <Input
                        id="uni-rank"
                        placeholder="e.g. 1, 1201-1400, 1401+"
                        value={rank}
                        onChange={e => setRank(e.target.value)}
                    />
                    <p className="text-[10px] text-muted-foreground">Example: 1, 10-20, 1401+</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="uni-web">Website URL</Label>
                    <Input
                        id="uni-web"
                        placeholder="https://..."
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex gap-2">
                {onCancel && (
                    <Button type="button" variant="outline" className="w-full" onClick={onCancel} disabled={loading}>
                        Cancel
                    </Button>
                )}
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {initialData ? 'Update University' : 'Save University'}
                </Button>
            </div>
        </form>
    );

    if (initialData) {
        return <div className="pt-2">{FormContent}</div>;
    }

    return (
        <Card className="h-full shadow-md">
            <CardHeader className="bg-muted/20 pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Plus className="h-5 w-5 text-primary" />
                    Add Single University
                </CardTitle>
                <CardDescription>
                    Manually add a new university record.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                {FormContent}
            </CardContent>
        </Card>
    );
};
