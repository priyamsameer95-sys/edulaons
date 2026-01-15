import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";

interface FormHeaderProps {
    title?: string;
    savedText?: string;
    onBack?: () => void;
}

export const FormHeader = ({
    title,
    savedText = "Saved Just now",
    onBack
}: FormHeaderProps) => {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <header className="w-full bg-card-light dark:bg-card-dark border-b border-border-light dark:border-border-dark py-4 px-6 md:px-12 flex justify-between items-center shadow-sm sticky top-0 z-10 transition-colors duration-200">
            <button
                onClick={handleBack}
                className="flex items-center text-text-sub-light dark:text-text-sub-dark hover:text-primary transition-colors gap-2 text-sm font-medium"
            >
                <ArrowLeft className="h-4 w-4" />
                Back
            </button>

            {title && (
                <h1 className="text-lg font-semibold text-center hidden md:block text-text-main-light dark:text-text-main-dark">
                    {title}
                </h1>
            )}

            <div className="flex items-center gap-4 text-sm text-text-sub-light dark:text-text-sub-dark">
                <div className="flex items-center gap-1">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="hidden sm:inline">{savedText}</span>
                </div>
                <div className="flex items-center gap-1">
                    <ShieldCheck className="h-4 w-4 text-text-sub-light dark:text-text-sub-dark" />
                    <span className="hidden sm:inline">Secure</span>
                </div>
            </div>
        </header>
    );
};
