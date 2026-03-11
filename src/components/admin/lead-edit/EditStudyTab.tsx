import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { UniversitySelector } from "@/components/ui/university-selector";
import { CourseTypeSelector } from '@/components/shared/CourseTypeSelector';

interface EditStudyTabProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formData: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="study_destination">Destination Country <span className="text-red-500">*</span></Label>
                                <Select
                                    value={formData.study_destination}
                                    onValueChange={(value) => handleInputChange('study_destination', value)}
                                >
                                    <SelectTrigger className="h-10">
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
                        </div>

                        <div className="space-y-2">
                            <Label>Target Universities</Label>
                            <UniversitySelector
                                universities={universities}
                                onChange={setUniversities}
                                country={formData.study_destination}
                            />
                        </div>

                        <div className="space-y-2 border-t pt-4">
                            <Label className="text-base">Target Course</Label>
                            <CourseTypeSelector
                                value={courseId}
                                onChange={setCourseId}
                            />
                        </div>
                    </div>

                    {/* Financials & Intake - 2x2 Grid for Perfect Alignment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
                        <div className="space-y-2">
                            <Label htmlFor="loan_amount">Loan Amount (₹) <span className="text-red-500">*</span></Label>
                            <Input
                                id="loan_amount"
                                type="text"
                                inputMode="numeric"
                                value={formData.loan_amount}
                                onChange={(e) => handleInputChange('loan_amount', e.target.value)}
                                className="h-11 shadow-sm"
                                placeholder="e.g. 25,00,000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="loan_type">Loan Type</Label>
                            <Select
                                value={formData.loan_type}
                                onValueChange={(value) => handleInputChange('loan_type', value)}
                            >
                                <SelectTrigger className="h-11 shadow-sm">
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
                        <div className="space-y-2">
                            <Label>Intake Month</Label>
                            <Select
                                value={formData.intake_month}
                                onValueChange={(value) => handleInputChange('intake_month', value)}
                            >
                                <SelectTrigger className="h-11 shadow-sm">
                                    <SelectValue placeholder="Select month" />
                                </SelectTrigger>
                                <SelectContent>
                                    {safeMonths.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Intake Year</Label>
                            <Input
                                value={formData.intake_year}
                                onChange={(e) => handleInputChange('intake_year', e.target.value)}
                                placeholder="e.g. 2025"
                                className="h-11 shadow-sm"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
