import { UniversityBulkUpload } from '../data/UniversityBulkUpload';
import { UniversityManualEntry } from '../data/UniversityManualEntry';
import { UniversityList } from '../data/UniversityList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, ListFilter, PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const UniversityManagementTab = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary/10 rounded-full">
                    <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">University Master List</h2>
                    <p className="text-muted-foreground">Manage global university records, rankings, and metadata.</p>
                </div>
            </div>

            <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="list" className="gap-2">
                        <ListFilter className="h-4 w-4" />
                        Manage List
                    </TabsTrigger>
                    <TabsTrigger value="add" className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Add / Upload
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="list" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>University Directory</CardTitle>
                            <CardDescription>Search, edit, and view all university records.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <UniversityList />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="add" className="mt-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Bulk Upload Section */}
                        <div>
                            <UniversityBulkUpload />
                        </div>

                        {/* Manual Entry Section */}
                        <div>
                            <UniversityManualEntry />
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <Card className="mt-6 border-blue-100 bg-blue-50/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800">Note on Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                    <CardDescription className="text-blue-700/80 text-xs">
                        Rankings can be specific numbers (e.g., "1") or ranges (e.g., "1201-1400", "1401+").
                        University names must be unique. Uploading or adding a university with an existing name will update its details.
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
    );
};
