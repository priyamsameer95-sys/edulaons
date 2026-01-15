import { Label } from "@/components/ui/label";
import { LeadFormData } from "../types/leadTypes";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FloatingLabelInput } from "@/components/ui/input";
import { DatePickerWithYearSelect } from "@/components/ui/date-picker-with-year-select";
import { parseISO } from "date-fns";

interface StudentStepProps {
    formData: LeadFormData;
    errors: Record<string, string>;
    handleInputChange: (field: keyof LeadFormData, value: string) => void;
    onNext?: () => void;
    onBack?: () => void;
    loading?: boolean;
}

export const StudentStep = ({
    formData,
    errors,
    handleInputChange,
    onNext,
    onBack,
    loading
}: StudentStepProps) => {

    const genderOptions = ['Male', 'Female', 'Other'];

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Main Floating Card */}
            <Card className="rounded-2xl shadow-xl border-white/20 shadow-blue-900/5 bg-white/80 backdrop-blur-sm p-6 md:p-10 relative overflow-hidden">

                {/* Decorative Background Element */}
                <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                    <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="200" cy="50" r="150" fill="#3B82F6" />
                    </svg>
                </div>

                {/* Header Section */}
                <div className="mb-10 relative z-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight flex items-center gap-2">
                        Personal Details <Sparkles className="w-5 h-5 text-amber-500" />
                    </h2>
                    <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
                        Tell us about yourself to kickstart your abroad education loan journey. We keep your data secure.
                    </p>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-8 relative z-10">

                    {/* Full Name */}
                    <div className="group col-span-1 space-y-1">
                        <FloatingLabelInput
                            id="studentName"
                            label="Full Name"
                            value={formData.student_name}
                            onChange={(e) => handleInputChange('student_name', e.target.value)}
                            className={cn(errors.student_name ? "border-destructive focus-visible:ring-destructive" : "")}
                        />
                        {errors.student_name && <p className="text-xs text-destructive mt-1.5 font-medium pl-1">{errors.student_name}</p>}
                    </div>

                    {/* WhatsApp Number */}
                    <div className="group col-span-1 space-y-1">
                        <div className="relative">
                            <div className="absolute left-3 top-4 z-10 flex items-center gap-2 text-muted-foreground border-r pr-2 h-6 pointer-events-none">
                                <span className="text-sm font-medium">🇮🇳 +91</span>
                            </div>
                            <input
                                id="studentPhone"
                                type="tel"
                                value={formData.student_phone.replace(/^\+91/, '')}
                                onChange={(e) => handleInputChange('student_phone', `+91${e.target.value}`)}
                                placeholder=" "
                                maxLength={10}
                                className={cn(
                                    "flex h-14 w-full rounded-md border border-input bg-background pl-24 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-out hover:border-primary/50 peer pt-4 pb-1",
                                    errors.student_phone ? "border-destructive focus-visible:ring-destructive" : ""
                                )}
                            />
                            <label
                                htmlFor="studentPhone"
                                className="absolute left-24 top-1 z-10 origin-[0] -translate-y-0 transform text-xs text-muted-foreground duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-sm peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary"
                            >
                                WhatsApp Number
                            </label>
                        </div>
                        {errors.student_phone && <p className="text-xs text-destructive mt-1.5 font-medium pl-1">{errors.student_phone}</p>}
                    </div>

                    {/* Email */}
                    <div className="group col-span-1 space-y-1">
                        <FloatingLabelInput
                            id="studentEmail"
                            label="Email Address"
                            type="email"
                            value={formData.student_email}
                            onChange={(e) => handleInputChange('student_email', e.target.value)}
                            className={cn(errors.student_email ? "border-destructive focus-visible:ring-destructive" : "")}
                        />
                        {errors.student_email && <p className="text-xs text-destructive mt-1.5 font-medium pl-1">{errors.student_email}</p>}
                    </div>

                    {/* Date of Birth */}
                    <div className="group col-span-1 space-y-1 flex flex-col pt-1">
                        <Label className="text-xs font-medium text-muted-foreground ml-1">Date of Birth</Label>
                        <DatePickerWithYearSelect
                            date={formData.student_dob ? parseISO(formData.student_dob) : undefined}
                            setDate={(date) => handleInputChange('student_dob', date ? date.toISOString().split('T')[0] : "")}
                            placeholder="Select Date of Birth"
                            fromYear={1960}
                            toYear={new Date().getFullYear()}
                            className="h-14 px-3"
                        />
                        {errors.student_dob && <p className="text-xs text-destructive mt-1.5 font-medium pl-1">{errors.student_dob}</p>}
                    </div>

                    {/* Gender */}
                    <div className="col-span-1 md:col-span-2">
                        <Label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            Gender
                        </Label>
                        <div className="flex flex-wrap gap-4">
                            {genderOptions.map((option) => {
                                const isSelected = formData.student_gender?.toLowerCase() === option.toLowerCase();
                                return (
                                    <label key={option} className="cursor-pointer relative">
                                        <input
                                            type="radio"
                                            name="gender"
                                            className="sr-only"
                                            checked={isSelected}
                                            onChange={() => handleInputChange('student_gender', option.toLowerCase())}
                                        />
                                        <div className={cn(
                                            "h-14 px-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 border-2",
                                            isSelected
                                                ? "bg-blue-50 border-primary text-primary shadow-sm ring-1 ring-primary/20"
                                                : "bg-background border-input text-muted-foreground hover:border-primary/50 hover:bg-muted/50"
                                        )}>
                                            {option}
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                        {errors.student_gender && <p className="text-xs text-destructive mt-1.5 font-medium pl-1">{errors.student_gender}</p>}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-12 flex items-center justify-between pt-6 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        size="lg"
                        onClick={onBack}
                        disabled={loading}
                        className="rounded-xl h-14 px-8 text-muted-foreground hover:text-foreground"
                    >
                        Back
                    </Button>

                    <Button
                        size="lg"
                        onClick={onNext}
                        disabled={loading}
                        className="rounded-xl h-14 px-10 shadow-lg shadow-primary/20"
                    >
                        {loading && <Loader2 className="w-5 h-5 animate-spin mr-2" />}
                        Continue
                        {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
                    </Button>
                </div>
            </Card>
        </div>
    );
};
