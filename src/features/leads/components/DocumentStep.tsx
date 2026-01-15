import { Card } from "@/components/ui/card";
import { CheckCircle, Building2, Zap, Clock, ChevronDown, ArrowRight, Percent, IndianRupee } from "lucide-react";
import { LeadFormData } from "../types/leadTypes";
import { cn } from "@/lib/utils";

interface DocumentStepProps {
    createdLead: any;
    formData: LeadFormData;
    onComplete?: () => void;
}

import { useEffect, useState } from "react";
import { leadService } from "../services/leadService";
import { Loader2 } from "lucide-react";



export const DocumentStep = ({ createdLead, formData, onComplete }: DocumentStepProps) => {

    const [lenders, setLenders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLenders = async () => {
            if (createdLead?.id) {
                try {
                    const data = await leadService.getBestMatchLenders(createdLead.id);
                    setLenders(data);
                } catch (error) {
                    console.error("Failed to load recommendations", error);
                } finally {
                    setLoading(false);
                }
            } else {
                // Fallback if no lead ID (shouldn't happen in flow)
                setLoading(false);
            }
        };
        fetchLenders();
    }, [createdLead]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Finding the best lenders for you...</p>
            </div>
        );
    }

    // Split into Best Match (Top 3) and Others
    const recommendedLenders = lenders.slice(0, 3);
    const otherLenders = lenders.slice(3);

    return (
        <div className="w-full max-w-6xl mx-auto px-4 pb-12">

            {/* Success Header */}
            <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 mb-6">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    Application Submitted!
                </h2>
                <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
                    Your loan application has been successfully submitted.
                </p>
                <div className="inline-block bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-lg text-sm font-medium border border-blue-100 dark:border-blue-800">
                    Case ID: <span className="font-bold">{createdLead?.case_id || 'EDU-1768217111796'}</span>
                </div>
            </div>

            {/* Recommendations Section */}
            <div className="mb-16">
                <div className="text-center mb-10">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Top Lender Recommendations
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Personalized based on your financial profile and AI-driven insights.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {recommendedLenders.map((lender) => (
                        <div
                            key={lender.id}
                            className={cn(
                                "relative rounded-2xl transition-all duration-300",
                                lender.isBestMatch
                                    ? "bg-white ring-2 ring-yellow-400 shadow-xl scale-105 z-10"
                                    : "bg-white border border-gray-100 shadow-sm hover:shadow-md"
                            )}
                        >
                            {/* Best Match Badge Header */}
                            {lender.isBestMatch && (
                                <div className="bg-yellow-400 text-white text-xs font-bold uppercase tracking-wider py-2 px-4 rounded-t-2xl text-center flex items-center justify-center gap-2">
                                    <Zap className="w-4 h-4 fill-current" />
                                    Best Match For You
                                    <Zap className="w-4 h-4 fill-current" />
                                </div>
                            )}

                            <div className={cn("p-6", lender.isBestMatch ? "pt-6" : "pt-8")}>
                                {/* Header: Logo & Name */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
                                        <Building2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-gray-900">{lender.name}</h4>
                                        {!lender.isBestMatch && (
                                            <span className="inline-block text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1">
                                                {lender.badge}
                                            </span>
                                        )}
                                        {lender.isBestMatch && (
                                            <span className="text-yellow-500">
                                                ★
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Insights Box */}
                                <div className={cn(
                                    "rounded-xl p-4 mb-6 text-sm",
                                    lender.isBestMatch ? "bg-blue-50 border border-blue-100" : "bg-gray-50 border border-gray-100"
                                )}>
                                    <div className="flex items-start gap-2 mb-2">
                                        <div className="p-1 rounded bg-white shadow-sm">
                                            <Zap className={cn("w-3 h-3", lender.isBestMatch ? "text-blue-500" : "text-gray-400")} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-xs uppercase tracking-wide opacity-70 mb-1">WHY THIS LENDER?</p>
                                            <p className="font-medium text-gray-900 mb-1">{lender.why}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 pl-9">
                                        <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                                        <p className="text-gray-600 text-xs italic">{lender.whySub}</p>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-3 pl-9 italic">Compare terms below to decide.</p>
                                </div>

                                {/* Metrics Grid */}
                                <div className="grid grid-cols-3 gap-2 mb-8 text-center">
                                    <div className="p-3 rounded-lg bg-gray-50/50">
                                        <Percent className={cn("w-5 h-5 mx-auto mb-1", lender.isBestMatch ? "text-green-500" : "text-gray-400")} />
                                        <div className="font-bold text-gray-900 text-lg">{lender.rate}</div>
                                        <div className="text-xs text-uppercase text-gray-400 font-medium">RATE</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-gray-50/50">
                                        <IndianRupee className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                                        <div className="font-bold text-gray-900 text-lg">{lender.maxLoan}</div>
                                        <div className="text-xs text-uppercase text-gray-400 font-medium">MAX LOAN</div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-gray-50/50">
                                        <Clock className="w-5 h-5 mx-auto mb-1 text-orange-400" />
                                        <div className="font-bold text-gray-900 text-lg">{lender.processTime}</div>
                                        <div className="text-xs text-uppercase text-gray-400 font-medium">PROCESS</div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <button className="w-full text-xs text-gray-500 hover:text-gray-800 flex items-center justify-between px-2 py-1">
                                        View Full Details
                                        <ChevronDown className="w-4 h-4" />
                                    </button>

                                    <button
                                        className={cn(
                                            "w-full py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all",
                                            lender.isBestMatch
                                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25"
                                                : "bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                                        )}
                                        onClick={onComplete}
                                    >
                                        Choose This Lender
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Other Lenders List */}
            <div className="max-w-4xl mx-auto">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 text-center">Other Qualified Lenders</h4>
                <div className="space-y-4">
                    {otherLenders.map((lender, i) => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 text-gray-400">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h5 className="font-semibold text-gray-900">{lender.name}</h5>
                                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                        {lender.match}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between w-full sm:w-auto gap-8 md:gap-12">
                                <div className="text-center">
                                    <div className="font-bold text-gray-900">{lender.rate}</div>
                                    <div className="text-xs text-gray-400 font-medium">RATE</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-gray-900">{lender.amount}</div>
                                    <div className="text-xs text-gray-400 font-medium">AMOUNT</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-gray-900">{lender.time}</div>
                                    <div className="text-xs text-gray-400 font-medium">TIME</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <button className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 border border-transparent">
                                    Details
                                </button>
                                <button className="flex-1 sm:flex-none px-6 py-2 text-sm font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                                    Select
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
