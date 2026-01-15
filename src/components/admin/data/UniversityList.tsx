import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Edit2, ExternalLink, RefreshCw } from 'lucide-react';
import { UniversityManualEntry } from './UniversityManualEntry';

interface University {
    id: string;
    name: string;
    country: string;
    city: string;
    global_rank: string | number | null;
    url: string | null;
}

const PAGE_SIZE = 10;

export const UniversityList = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [universities, setUniversities] = useState<University[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);

    const fetchUniversities = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('universities')
                .select('*', { count: 'exact' });

            if (searchQuery) {
                query = query.or(`name.ilike.%${searchQuery}%,country.ilike.%${searchQuery}%`);
            } else {
                query = query.order('name', { ascending: true });
            }

            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error, count } = await query.range(from, to);

            if (error) throw error;

            setUniversities(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            console.error('Error fetching universities:', error);
            // Don't show toast on initial load error to avoid spam, just log
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchUniversities();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Page change
    useEffect(() => {
        fetchUniversities();
    }, [page]);

    const handleEdit = (uni: University) => {
        setEditingUniversity(uni);
        setIsEditOpen(true);
    };

    const handleEditSuccess = () => {
        setIsEditOpen(false);
        setEditingUniversity(null);
        fetchUniversities(); // Refresh list
        toast({ title: "University Updated", description: "The records have been refreshed." });
    };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search universities by name or country..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" onClick={() => fetchUniversities()} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Rank</TableHead>
                            <TableHead>University Name</TableHead>
                            <TableHead>Country</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && universities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : universities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No universities found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            universities.map((uni) => (
                                <TableRow key={uni.id}>
                                    <TableCell className="font-medium">
                                        {uni.global_rank ? `#${uni.global_rank}` : <span className="text-muted-foreground text-xs">N/A</span>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{uni.name}</span>
                                            {uni.url && (
                                                <a
                                                    href={uni.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-blue-500 hover:underline flex items-center gap-1 w-fit"
                                                >
                                                    Website <ExternalLink className="h-3 w-3" />
                                                </a>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{uni.country}</div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(uni)}>
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                        <PaginationItem>
                            <span className="text-sm text-muted-foreground mx-2">
                                Page {page} of {totalPages}
                            </span>
                        </PaginationItem>
                        <PaginationItem>
                            <PaginationNext
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className={page === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit University</DialogTitle>
                    </DialogHeader>
                    {editingUniversity && (
                        <UniversityManualEntry
                            initialData={{
                                id: editingUniversity.id,
                                name: editingUniversity.name,
                                country: editingUniversity.country,
                                city: editingUniversity.city,
                                global_rank: editingUniversity.global_rank,
                                url: editingUniversity.url || '',
                            }}
                            onSuccess={handleEditSuccess}
                            onCancel={() => setIsEditOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
