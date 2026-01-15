import { cn } from "@/lib/utils";
import { STEPS } from "../types/leadTypes";

interface LeadStepsProps {
    currentStep: string;
    currentStepIndex: number;
    createdLead: any;
}

export const LeadSteps = ({ currentStep, currentStepIndex }: LeadStepsProps) => {
    return (
        <div className="bg-white border-b sticky top-0 z-50">
            <div className="max-w-4xl mx-auto px-6 py-4">
                <div className="flex gap-2">
                    {STEPS.map((step, index) => {
                        const isActive = step.id === currentStep;
                        const isCompleted = index < currentStepIndex;

                        return (
                            <div key={step.id} className="flex-1 flex flex-col gap-2">
                                <div
                                    className={cn(
                                        "h-2 w-full rounded-full transition-all duration-300",
                                        isActive && "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]",
                                        isCompleted && "bg-emerald-500",
                                        !isActive && !isCompleted && "bg-gray-200"
                                    )}
                                />
                                <span className={cn(
                                    "text-xs font-semibold uppercase tracking-wider text-center transition-colors",
                                    isActive && "text-blue-600",
                                    isCompleted && "text-emerald-500",
                                    !isActive && !isCompleted && "text-gray-400"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
