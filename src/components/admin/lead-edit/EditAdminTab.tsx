import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

interface EditAdminTabProps {
    adminNotes: string;
    handleInputChange: (field: any, value: string) => void;
}

export const EditAdminTab = ({ adminNotes, handleInputChange }: EditAdminTabProps) => {
    return (
        <div className="space-y-4 mt-0">
            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        Internal Notes
                    </CardTitle>
                    <CardDescription>
                        These notes are visible only to admins and partners.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="admin_notes">Notes / Observations</Label>
                        <Textarea
                            id="admin_notes"
                            value={adminNotes}
                            onChange={(e) => handleInputChange('admin_notes', e.target.value)}
                            placeholder="Add internal notes about this case..."
                            className="min-h-[200px]"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
