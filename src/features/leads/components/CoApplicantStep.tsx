import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadFormData } from "../types/leadTypes";
import { ArrowLeft, ArrowRight, Loader2, Check } from "lucide-react";
import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CoApplicantStepProps {
    formData: LeadFormData;
    errors: Record<string, string>;
    handleInputChange: (field: keyof LeadFormData, value: string) => void;
    salaryInWords?: string;
    onNext?: () => void;
    onBack?: () => void;
    loading?: boolean;
}

export const CoApplicantStep = ({
    formData,
    errors,
    handleInputChange,
    salaryInWords,
    onNext,
    onBack,
    loading
}: CoApplicantStepProps) => {

    const rangeInputRef = useRef<HTMLInputElement>(null);

    // Options
    const relationships = ['Father', 'Mother', 'Brother', 'Sister', 'Other'];
    const employmentTypes = ['Salaried', 'Self-employed', 'Pensioner'];

    // Income presets
    const incomePresets = [
        { label: '₹5L', value: 500000 },
        { label: '₹10L', value: 1000000 },
        { label: '₹15L', value: 1500000 },
        { label: '₹20L', value: 2000000 },
        { label: '₹30L+', value: 3000000 },
    ];

    const formatCurrency = (value: string) => {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
        if (num >= 100000) return `₹${(num / 100000).toFixed(2)} L`;
        return `₹${num.toLocaleString('en-IN')}`;
    };

    // Update slider background
    const updateSliderBackground = (value: number, min: number, max: number) => {
        if (rangeInputRef.current) {
            const percentage = ((value - min) / (max - min)) * 100;
            rangeInputRef.current.style.background = `linear-gradient(to right, #3B82F6 ${percentage}%, #E5E7EB ${percentage}%)`;
        }
    };

    useEffect(() => {
        const currentSalary = parseFloat(formData.co_applicant_salary) || 500000;
        updateSliderBackground(currentSalary, 100000, 5000000);
    }, [formData.co_applicant_salary]);

    const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleInputChange('co_applicant_salary', e.target.value);
    };

    const handlePresetClick = (amount: number) => {
        handleInputChange('co_applicant_salary', amount.toString());
    };

    return (
        <div className="w-full max-w-4xl mx-auto">
            {/* Main Floating Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-10 relative overflow-hidden">

                <div className="mb-10 relative z-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">Co-applicant Details</h2>
                    <p className="text-gray-500 text-lg leading-relaxed max-w-2xl">
                        Please provide details of the primary financial co-applicant.
                    </p>
                </div>

                <form className="space-y-8 relative z-10">
                    {/* 1. Relationship Selection */}
                    <div>
                        <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Who is the primary earning member?
                        </Label>
                        <div className="flex flex-wrap gap-3">
                            {relationships.map((rel) => {
                                const isSelected = formData.co_applicant_relationship === rel;
                                return (
                                    <button
                                        key={rel}
                                        type="button"
                                        onClick={() => handleInputChange('co_applicant_relationship', rel)}
                                        className={cn(
                                            "px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 border-2",
                                            isSelected
                                                ? "bg-blue-50 border-blue-600 text-blue-700 shadow-sm"
                                                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                        )}
                                    >
                                        {rel}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 2. Employment Type */}
                    <div>
                        <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Employment Type
                        </Label>
                        <div className="flex flex-wrap gap-3">
                            {employmentTypes.map((type) => {
                                const isSelected = formData.co_applicant_employment_type === type;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => handleInputChange('co_applicant_employment_type', type)}
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
                    </div>

                    {/* 3. Annual Income Slider */}
                    <div className="p-8 rounded-2xl border border-gray-100 bg-gray-50/50">
                        <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-6">
                            Annual Income
                        </Label>

                        <div className="mb-8 flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-blue-600 tracking-tight">
                                {formatCurrency(formData.co_applicant_salary)}
                            </span>
                            {salaryInWords && (
                                <span className="text-sm font-medium text-gray-500 capitalize">
                                    ({salaryInWords})
                                </span>
                            )}
                        </div>

                        <div className="relative h-2 mb-8 mx-2">
                            <input
                                ref={rangeInputRef}
                                type="range"
                                min="100000"
                                max="5000000"
                                step="50000"
                                value={parseFloat(formData.co_applicant_salary) || 500000}
                                onChange={handleSalaryChange}
                                className="absolute w-full h-2 rounded-lg appearance-none cursor-pointer z-20 outline-none"
                            />
                            <style>{`
                                input[type=range]::-webkit-slider-thumb {
                                    -webkit-appearance: none;
                                    height: 24px;
                                    width: 24px;
                                    border-radius: 50%;
                                    background: #FFFFFF;
                                    border: 2px solid #3B82F6;
                                    cursor: pointer;
                                    margin-top: -11px;
                                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                                    transition: transform 0.1s;
                                }
                                input[type=range]::-webkit-slider-thumb:hover {
                                    transform: scale(1.1);
                                }
                            `}</style>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {incomePresets.map(preset => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => handlePresetClick(preset.value)}
                                    className="px-4 py-1.5 text-xs font-semibold rounded-full bg-white border border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors shadow-sm"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 4. Contact Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Name */}
                        <div className="group col-span-1">
                            <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Full Name
                            </Label>
                            <input
                                value={formData.co_applicant_name}
                                onChange={(e) => handleInputChange('co_applicant_name', e.target.value)}
                                placeholder="Enter full name"
                                className={cn(
                                    "w-full h-14 px-4 bg-gray-50 border rounded-xl transition-all duration-200 font-medium text-gray-900 placeholder:text-gray-400 outline-none",
                                    "focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10",
                                    errors.co_applicant_name ? "border-red-500 focus:ring-red-100" : "border-gray-200"
                                )}
                            />
                            {errors.co_applicant_name && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.co_applicant_name}</p>}
                        </div>

                        {/* Phone */}
                        <div className="group col-span-1">
                            <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Phone Number
                            </Label>
                            <div className="flex h-14 rounded-xl overflow-hidden border border-gray-200 focus-within:border-blue-600 focus-within:ring-4 focus-within:ring-blue-600/10 transition-all duration-200 bg-gray-50 focus-within:bg-white">
                                <div className="bg-gray-100 px-4 flex items-center justify-center border-r border-gray-200 text-gray-500 font-medium text-sm">
                                    +91
                                </div>
                                <input
                                    value={formData.co_applicant_phone.replace(/^\+91/, '')}
                                    onChange={(e) => handleInputChange('co_applicant_phone', `+91${e.target.value}`)}
                                    placeholder="9876543210"
                                    type="tel"
                                    maxLength={10}
                                    className="flex-1 px-4 bg-transparent outline-none font-medium text-gray-900 placeholder:text-gray-400 h-full"
                                />
                            </div>
                            {errors.co_applicant_phone && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.co_applicant_phone}</p>}
                        </div>

                        {/* Email - Full Width */}
                        <div className="group col-span-1 md:col-span-2">
                            <Label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Email Address
                            </Label>
                            <input
                                type="email"
                                value={formData.co_applicant_email}
                                onChange={(e) => handleInputChange('co_applicant_email', e.target.value)}
                                placeholder="email@example.com"
                                className={cn(
                                    "w-full h-14 px-4 bg-gray-50 border rounded-xl transition-all duration-200 font-medium text-gray-900 placeholder:text-gray-400 outline-none",
                                    "focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10",
                                    errors.co_applicant_email ? "border-red-500 focus:ring-red-100" : "border-gray-200"
                                )}
                            />
                            {errors.co_applicant_email && <p className="text-xs text-red-500 mt-1.5 font-medium">{errors.co_applicant_email}</p>}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="mt-12 flex items-center justify-between pt-6 border-t border-gray-100">
                        <button
                            onClick={onBack}
                            className="px-6 py-3 rounded-xl text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50 transition-colors"
                            type="button"
                            disabled={loading}
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
                            Submit Application
                            {!loading && <ArrowRight className="w-5 h-5" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
