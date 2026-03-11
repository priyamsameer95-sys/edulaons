import { GraduationCap } from 'lucide-react';

export const Loader = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6">
                {/* Branded spinner — no external CDN dependency */}
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-muted" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <GraduationCap className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                </div>
                <p className="mt-4 text-lg font-medium text-gray-600 animate-pulse">Processing...</p>
            </div>
        </div>
    );
};
