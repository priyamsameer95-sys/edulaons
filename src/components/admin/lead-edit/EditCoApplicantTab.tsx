import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface EditCoApplicantTabProps {
    formData: any;
    handleInputChange: (field: any, value: string) => void;
    RELATIONSHIPS: string[];
    EMPLOYMENT_TYPE_OPTIONS: { value: string; label: string }[];
}

export const EditCoApplicantTab = ({
    formData,
    handleInputChange,
    RELATIONSHIPS,
    EMPLOYMENT_TYPE_OPTIONS
}: EditCoApplicantTabProps) => {
    // DEFENSIVE GUARD: Handle undefined props
    const safeRelationships = RELATIONSHIPS ?? [];
    const safeEmploymentTypes = EMPLOYMENT_TYPE_OPTIONS ?? [];

    return (
        <div className="space-y-4 mt-0">
            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Co-Applicant Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="co_applicant_name">Full Name</Label>
                        <Input
                            id="co_applicant_name"
                            value={formData.co_applicant_name}
                            onChange={(e) => handleInputChange('co_applicant_name', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="co_applicant_relationship">Relationship</Label>
                        <Select
                            value={formData.co_applicant_relationship}
                            onValueChange={(value) => handleInputChange('co_applicant_relationship', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                            <SelectContent>
                                {safeRelationships.map((rel) => (
                                    <SelectItem key={rel} value={rel}>
                                        {rel.charAt(0).toUpperCase() + rel.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="co_applicant_email">Email</Label>
                        <Input
                            id="co_applicant_email"
                            type="email"
                            value={formData.co_applicant_email}
                            onChange={(e) => handleInputChange('co_applicant_email', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="co_applicant_phone">Phone</Label>
                        <Input
                            id="co_applicant_phone"
                            value={formData.co_applicant_phone}
                            onChange={(e) => handleInputChange('co_applicant_phone', e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <BriefcaseIcon className="h-4 w-4" />
                        Employment & Financials
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="co_applicant_occupation">Occupation</Label>
                            <Input
                                id="co_applicant_occupation"
                                value={formData.co_applicant_occupation}
                                onChange={(e) => handleInputChange('co_applicant_occupation', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="co_applicant_employer">Employer Name</Label>
                            <Input
                                id="co_applicant_employer"
                                value={formData.co_applicant_employer}
                                onChange={(e) => handleInputChange('co_applicant_employer', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="co_applicant_employment_type">Employment Type</Label>
                            <Select
                                value={formData.co_applicant_employment_type}
                                onValueChange={(value) => handleInputChange('co_applicant_employment_type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeEmploymentTypes.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="co_applicant_salary">Monthly Income (₹)</Label>
                            <Input
                                id="co_applicant_salary"
                                type="number"
                                value={formData.co_applicant_salary}
                                onChange={(e) => handleInputChange('co_applicant_salary', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="co_applicant_credit_score">CIBIL Score</Label>
                            <Input
                                id="co_applicant_credit_score"
                                type="number"
                                value={formData.co_applicant_credit_score}
                                onChange={(e) => handleInputChange('co_applicant_credit_score', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Helper Icon
function BriefcaseIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    )
}
