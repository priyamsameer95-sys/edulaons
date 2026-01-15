import { LottieAnimation } from './lottie-animation';

export const Loader = () => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col items-center">
                {/* Using a "Paper Plane" loading animation for a travel/future theme */}
                <LottieAnimation
                    animationUrl="https://assets5.lottiefiles.com/packages/lf20_t2rngd5k.json"
                    className="w-48 h-48"
                />
                <p className="mt-4 text-lg font-medium text-gray-600 animate-pulse">Processing...</p>
            </div>
        </div>
    );
};
