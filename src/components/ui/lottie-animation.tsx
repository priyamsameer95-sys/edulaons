import React, { useEffect, useState } from 'react';
import Lottie, { LottieComponentProps } from 'lottie-react';
import { cn } from '@/lib/utils';

interface LottieAnimationProps extends Omit<LottieComponentProps, 'animationData'> {
    animationUrl: string | object;
    width?: string | number;
    height?: string | number;
    className?: string;
}

export const LottieAnimation = ({
    animationUrl,
    width = '100%',
    height = '100%',
    className,
    loop = true,
    autoPlay = true,
    ...props
}: LottieAnimationProps) => {
    const [animationData, setAnimationData] = useState<any>(null);

    useEffect(() => {
        if (typeof animationUrl === 'string') {
            fetch(animationUrl)
                .then((response) => {
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    return response.json();
                })
                .then((data) => setAnimationData(data))
                .catch((error) => {
                    console.error('Error loading Lottie animation:', error);
                    // Optionally set error state to show fallback UI
                });
        } else {
            setAnimationData(animationUrl);
        }
    }, [animationUrl]);

    if (!animationData) return <div style={{ width, height }} className={cn("animate-pulse bg-muted/20 rounded-lg", className)} />;

    return (
        <div style={{ width, height }} className={className}>
            <Lottie
                animationData={animationData}
                loop={loop}
                autoPlay={autoPlay}
                {...props}
            />
        </div>
    );
};
