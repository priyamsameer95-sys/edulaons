import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadFormData } from "../types/leadTypes";
import { ArrowLeft, ArrowRight, Search, ChevronDown, CheckCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyStepProps {
    formData: LeadFormData;
    errors: Record<string, string>;
    handleInputChange: (field: keyof LeadFormData, value: string) => void;
    handleUniversitiesChange: (universities: string[]) => void;
    setFields: (fields: Partial<LeadFormData>) => void;
    amountInWords?: string;
    onNext?: () => void;
    onBack?: () => void;
    loading?: boolean;
}

export const StudyStep = ({
    formData,
    errors,
    handleInputChange,
    handleUniversitiesChange,
    loading,
    onNext,
    onBack
}: StudyStepProps) => {

    const qualifications = ['High School', 'Undergraduate', 'Postgraduate'];
    const countries = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'Ireland', 'Other'];
    const loanAmounts = ['₹10 - 25L', '₹25 - 50L', '₹50 - 75L', '₹75L - 1Cr', '₹1Cr+'];
    const courseTypes = ['Masters STEM', 'Bachelors STEM', 'MBA', 'Ph.D.', 'Others'];
    const intakeMonths = ['Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Not sure yet'];

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Main Floating Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-10 relative overflow-hidden">

                <div className="mb-10 relative z-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Study Plans</h2>
                    <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
                        Where are you heading? Let us help you find the best lenders for your dream university.
                    </p>
                </div>

                <form className="space-y-8 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Qualification Dropdown */}
                        <div className="group relative">
                            <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Qualification
                            </Label>
                            <div className="relative">
                                <select
                                    value={formData.qualification}
                                    onChange={(e) => handleInputChange('qualification', e.target.value)}
                                    className={cn(
                                        "block w-full h-14 pl-4 pr-10 text-base rounded-xl border bg-gray-50 transition-all duration-200 cursor-pointer outline-none appearance-none font-medium text-gray-900",
                                        "focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10",
                                        errors.qualification ? "border-red-500 focus:ring-red-100" : "border-gray-200"
                                    )}
                                >
                                    <option value="" className="text-gray-400">Select Qualification</option>
                                    {qualifications.map(q => <option key={q} value={q}>{q}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                    <ChevronDown className="h-5 w-5" />
                                </div>
                            </div>
                            {errors.qualification && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.qualification}</p>}
                        </div>

                        {/* Destination Country Dropdown */}
                        <div className="group relative">
                            <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Destination Country
                            </Label>
                            <div className="relative">
                                <select
                                    value={formData.country}
                                    onChange={(e) => handleInputChange('country', e.target.value)}
                                    className={cn(
                                        "block w-full h-14 pl-4 pr-10 text-base rounded-xl border bg-gray-50 transition-all duration-200 cursor-pointer outline-none appearance-none font-medium text-gray-900",
                                        "focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10",
                                        errors.country ? "border-red-500 focus:ring-red-100" : "border-gray-200"
                                    )}
                                >
                                    <option value="">Select Destination</option>
                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                    <ChevronDown className="h-5 w-5" />
                                </div>
                            </div>
                            {errors.country && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.country}</p>}
                        </div>
                    </div>

                    {/* Loan Amount Pills */}
                    <div>
                        <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Loan Amount Needed
                        </Label>
                        <div className="flex flex-wrap gap-3">
                            {loanAmounts.map((amount) => {
                                const isSelected = formData.amount_requested === amount;
                                return (
                                    <button
                                        key={amount}
                                        type="button"
                                        onClick={() => handleInputChange('amount_requested', amount)}
                                        className={cn(
                                            "px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 border-2",
                                            isSelected
                                                ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm transform scale-105"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                        )}
                                    >
                                        {amount}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.amount_requested && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.amount_requested}</p>}
                    </div>

                    {/* Universities Input */}
                    <div>
                        <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Target Universities <span className="text-gray-400 font-medium normal-case ml-1">(Max 3)</span>
                        </Label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={formData.universities[0]}
                                onChange={(e) => handleUniversitiesChange([e.target.value])}
                                placeholder="Search for international universities..."
                                className={cn(
                                    "w-full h-14 pl-12 pr-4 bg-gray-50 border rounded-xl transition-all duration-200 font-medium text-gray-900 placeholder:text-gray-400 outline-none",
                                    "focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10",
                                    errors.universities ? "border-red-500 focus:ring-red-100" : "border-gray-200"
                                )}
                            />
                        </div>
                        {errors.universities && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.universities}</p>}
                    </div>

                    {/* Course Type Pills */}
                    <div>
                        <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Course Type
                        </Label>
                        <div className="flex flex-wrap gap-3">
                            {courseTypes.map((type) => {
                                const isSelected = formData.course_type === type;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => handleInputChange('course_type', type)}
                                        className={cn(
                                            "px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 border-2",
                                            isSelected
                                                ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                        )}
                                    >
                                        {type}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.course_type && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.course_type}</p>}
                    </div>

                    {/* Intake Month Pills */}
                    <div>
                        <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Expected Intake
                        </Label>
                        <div className="flex flex-wrap gap-3">
                            {intakeMonths.map((month) => {
                                const isSelected = formData.intake_month === month;
                                return (
                                    <button
                                        key={month}
                                        type="button"
                                        onClick={() => handleInputChange('intake_month', month)}
                                        className={cn(
                                            "px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 border-2",
                                            isSelected
                                                ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                        )}
                                    >
                                        {month}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.intake_month && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.intake_month}</p>}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="mt-12 flex items-center justify-between pt-6 border-t border-gray-100">
                        <button
                            onClick={onBack}
                            disabled={loading}
                            className="px-6 py-3 rounded-xl text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50 transition-colors"
                            type="button"
                        >
                            Back
                        </button>

                        <button
                            onClick={onNext}
                            disabled={loading}
                            className={cn(
                                "h-14 px-10 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2",
                                "hover:bg-blue-700 hover:shadow-blue-600/40 active:scale-95 transition-all duration-200",
                                loading && "opacity-80 cursor-not-allowed"
                            )}
                            type="button"
                        >
                            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                            Continue
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
