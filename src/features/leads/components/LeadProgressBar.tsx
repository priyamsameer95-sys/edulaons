import { cn } from "@/lib/utils";

interface LeadProgressBarProps {
    currentStep: number;
    totalSteps: number;
}

export const LeadProgressBar = ({ currentStep, totalSteps = 3 }: LeadProgressBarProps) => {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="w-full max-w-4xl mx-auto mb-8 px-4 sm:px-0">
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-primary">
                    Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm text-text-sub-light dark:text-text-sub-dark">
                    {Math.round(progress)}% Completed
                </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div
                    className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};
