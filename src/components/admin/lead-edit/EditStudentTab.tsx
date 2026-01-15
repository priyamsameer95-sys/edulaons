import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, GraduationCap } from "lucide-react";
import { QUALIFICATION_OPTIONS } from "@/utils/leadCompletionSchema";
import { INDIAN_STATES } from "@/constants/indianStates";
import { parseISO } from "date-fns";
import { DatePickerWithYearSelect } from "@/components/ui/date-picker-with-year-select";

interface FormData {
    student_name: string;
    student_email: string;
    student_phone: string;
    student_postal_code: string;
    student_city: string;
    student_state: string;
    student_date_of_birth: string;
    student_gender: string;
    student_nationality: string;
    student_street_address: string;
    student_highest_qualification: string;
    student_tenth_percentage: string;
    student_twelfth_percentage: string;
    student_bachelors_percentage: string;
    student_bachelors_cgpa: string;
    student_credit_score: string;
    // ... other fields not used here but part of FormData
}

interface EditStudentTabProps {
    formData: FormData;
    handleInputChange: (field: any, value: string) => void;
    GENDER_OPTIONS: { value: string; label: string }[];
}

export const EditStudentTab = ({ formData, handleInputChange, GENDER_OPTIONS }: EditStudentTabProps) => {
    // DEFENSIVE GUARD: Handle undefined props
    const safeGenderOptions = GENDER_OPTIONS ?? [];

    return (
        <div className="space-y-4 mt-0">
            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Basic Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="student_name">Full Name</Label>
                        <Input
                            id="student_name"
                            value={formData.student_name}
                            onChange={(e) => handleInputChange('student_name', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="student_email">Email</Label>
                        <Input
                            id="student_email"
                            type="email"
                            value={formData.student_email}
                            onChange={(e) => handleInputChange('student_email', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="student_phone">Phone</Label>
                        <Input
                            id="student_phone"
                            value={formData.student_phone}
                            onChange={(e) => handleInputChange('student_phone', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2 flex flex-col">
                        <Label htmlFor="student_date_of_birth">Date of Birth</Label>
                        <DatePickerWithYearSelect
                            date={formData.student_date_of_birth ? parseISO(formData.student_date_of_birth) : undefined}
                            setDate={(date) => handleInputChange('student_date_of_birth', date ? date.toISOString().split('T')[0] : "")}
                            placeholder="Select Date of Birth"
                            fromYear={1960}
                            toYear={new Date().getFullYear()}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="student_gender">Gender</Label>
                        <Select
                            value={formData.student_gender}
                            onValueChange={(value) => handleInputChange('student_gender', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                {GENDER_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="student_nationality">Nationality</Label>
                        <Input
                            id="student_nationality"
                            value={formData.student_nationality}
                            onChange={(e) => handleInputChange('student_nationality', e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Building2Icon className="h-4 w-4" />
                        Address Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                        <Label htmlFor="student_street_address">Street Address</Label>
                        <Input
                            id="student_street_address"
                            value={formData.student_street_address}
                            onChange={(e) => handleInputChange('student_street_address', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="student_postal_code">Postal Code</Label>
                        <Input
                            id="student_postal_code"
                            value={formData.student_postal_code}
                            onChange={(e) => handleInputChange('student_postal_code', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="student_city">City</Label>
                        <Input
                            id="student_city"
                            value={formData.student_city}
                            onChange={(e) => handleInputChange('student_city', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="student_state">State</Label>
                        <Select
                            value={formData.student_state}
                            onValueChange={(value) => handleInputChange('student_state', value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                            </SelectTrigger>
                            <SelectContent>
                                {INDIAN_STATES.map((state) => (
                                    <SelectItem key={state} value={state}>
                                        {state}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Academic Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="student_highest_qualification">Highest Qualification</Label>
                            <Select
                                value={formData.student_highest_qualification}
                                onValueChange={(value) => handleInputChange('student_highest_qualification', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select qualification" />
                                </SelectTrigger>
                                <SelectContent>
                                    {QUALIFICATION_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="student_credit_score">CIBIL Score (Optional)</Label>
                            <Input
                                id="student_credit_score"
                                type="number"
                                value={formData.student_credit_score}
                                onChange={(e) => handleInputChange('student_credit_score', e.target.value)}
                                placeholder="e.g 750"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="student_tenth_percentage">10th %</Label>
                            <Input
                                id="student_tenth_percentage"
                                type="number"
                                value={formData.student_tenth_percentage}
                                onChange={(e) => handleInputChange('student_tenth_percentage', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="student_twelfth_percentage">12th %</Label>
                            <Input
                                id="student_twelfth_percentage"
                                type="number"
                                value={formData.student_twelfth_percentage}
                                onChange={(e) => handleInputChange('student_twelfth_percentage', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="student_bachelors_cgpa">Bachelors CGPA</Label>
                            <Input
                                id="student_bachelors_cgpa"
                                type="number"
                                step="0.1"
                                value={formData.student_bachelors_cgpa}
                                onChange={(e) => handleInputChange('student_bachelors_cgpa', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Helper Icon
function Building2Icon(props: any) {
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
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
            <path d="M10 6h4" />
            <path d="M10 10h4" />
            <path d="M10 14h4" />
            <path d="M10 18h4" />
        </svg>
    )
}
