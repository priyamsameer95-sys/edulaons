import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { UniversitySelector } from "@/components/ui/university-selector";
import { CourseTypeSelector } from '@/components/shared/CourseTypeSelector';

interface EditStudyTabProps {
    formData: any;
    handleInputChange: (field: any, value: string) => void;
    universities: string[];
    setUniversities: (val: string[]) => void;
    courseId: string;
    setCourseId: (val: string) => void;
    isCustomCourse: boolean;
    setIsCustomCourse: (val: boolean) => void;
    STUDY_DESTINATIONS: string[];
    LOAN_TYPES: string[];
    MONTHS: { value: string; label: string }[];
}

export const EditStudyTab = ({
    formData,
    handleInputChange,
    universities,
    setUniversities,
    courseId,
    setCourseId,
    isCustomCourse,
    setIsCustomCourse,
    STUDY_DESTINATIONS,
    LOAN_TYPES,
    MONTHS
}: EditStudyTabProps) => {
    // DEFENSIVE GUARD: Handle undefined props
    const safeStudyDestinations = STUDY_DESTINATIONS ?? [];
    const safeLoanTypes = LOAN_TYPES ?? [];
    const safeMonths = MONTHS ?? [];

    return (
        <div className="space-y-4 mt-0">
            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Study Plans
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="study_destination">Destination Country</Label>
                            <Select
                                value={formData.study_destination}
                                onValueChange={(value) => handleInputChange('study_destination', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeStudyDestinations.map((dest) => (
                                        <SelectItem key={dest} value={dest}>
                                            {dest}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Target Universities</Label>
                            <UniversitySelector
                                universities={universities}
                                onChange={setUniversities}
                                country={formData.study_destination}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Target Course</Label>
                            <CourseTypeSelector
                                value={courseId}
                                onChange={setCourseId}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="loan_amount">Loan Amount (₹)</Label>
                            <Input
                                id="loan_amount"
                                type="number"
                                value={formData.loan_amount}
                                onChange={(e) => handleInputChange('loan_amount', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="loan_type">Loan Type</Label>
                            <Select
                                value={formData.loan_type}
                                onValueChange={(value) => handleInputChange('loan_type', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeLoanTypes.map((type) => (
                                        <SelectItem key={type} value={type}>
                                            {type === 'secured' ? 'Secured (Collateral)' : 'Unsecured (Non-Collateral)'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label>Intake Month</Label>
                                <Select
                                    value={formData.intake_month}
                                    onValueChange={(value) => handleInputChange('intake_month', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {safeMonths.map((m) => (
                                            <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Year</Label>
                                <Input
                                    value={formData.intake_year}
                                    onChange={(e) => handleInputChange('intake_year', e.target.value)}
                                    placeholder="2025"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
